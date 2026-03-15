#!/usr/bin/env python3
"""Build Korean-base reset preset assets from daily reset sources."""

from __future__ import annotations

import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urljoin, urlparse

import requests
import yaml
from bs4 import BeautifulSoup

from timeconv import kst_to_utc_hhmm, normalize_utc_hhmm, utc_to_kst_hhmm, utc_to_kst_minutes

BASE_URL = "https://gachalist.com/daily-resets"
REGION_PRIORITY = ["South Korea", "Korea", "KR", "Asia", "Japan", "Global"]


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def slugify(value: str) -> str:
    lowered = value.strip().lower()
    lowered = re.sub(r"[^a-z0-9]+", "-", lowered)
    lowered = re.sub(r"-+", "-", lowered)
    return lowered.strip("-") or "unknown"


def clean_name(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").strip())


def derive_game_key(game_url: str, display_name: str) -> str:
    if game_url:
        path = urlparse(game_url).path.strip("/")
        if path:
            return slugify(path.split("/")[-1])
    return slugify(display_name)


def region_priority_key(region_name: str) -> tuple[int, str]:
    normalized = region_name.lower().strip()
    for idx, target in enumerate(REGION_PRIORITY):
        target_lower = target.lower()
        if normalized == target_lower:
            return idx, region_name
        if target_lower in normalized:
            return idx + 100, region_name
    return 9999, region_name


def choose_default_region(region_names: list[str]) -> str:
    if not region_names:
        return "Unknown"
    return sorted(region_names, key=region_priority_key)[0]


def extract_region_name(region_block: Any) -> str:
    h3 = region_block.find("h3")
    if not h3:
        return "Unknown"
    span_texts = [clean_name(span.get_text(" ", strip=True)) for span in h3.find_all("span")]
    for text in reversed(span_texts):
        if text:
            return text
    text = clean_name(h3.get_text(" ", strip=True))
    return text or "Unknown"


def extract_utc_time(region_block: Any) -> str | None:
    data_span = region_block.select_one("[data-reset-time-utc]")
    if data_span and data_span.get("data-reset-time-utc"):
        return data_span["data-reset-time-utc"].strip()

    utc_span = region_block.select_one(".utc-time")
    if utc_span:
        text = clean_name(utc_span.get_text(" ", strip=True))
        match = re.search(r"(\d{1,2}:\d{2}(?::\d{2})?)", text)
        if match:
            return match.group(1)

    text = clean_name(region_block.get_text(" ", strip=True))
    if "Unknown" in text:
        return None
    match = re.search(r"(\d{1,2}:\d{2}(?::\d{2})?)\s*UTC", text, flags=re.IGNORECASE)
    if match:
        return match.group(1)
    return None


def to_aliases(display_name: str, current_aliases: set[str] | None = None) -> set[str]:
    aliases = set(current_aliases or set())
    aliases.add(display_name)
    simplified = re.sub(r"[^A-Za-z0-9가-힣]+", " ", display_name)
    simplified = clean_name(simplified)
    if simplified and simplified.lower() != display_name.lower():
        aliases.add(simplified)
    return {alias for alias in aliases if alias}


def init_game(game_key: str, display_name: str) -> dict[str, Any]:
    return {
        "gameKey": game_key,
        "displayName": display_name,
        "aliases": set(),
        "defaultRegion": "",
        "regions": {},
        "packageNameHints": set(),
    }


def fetch_pages(max_pages: int) -> tuple[list[tuple[str, str]], str]:
    pages: list[tuple[str, str]] = []
    for page in range(1, max_pages + 1):
        url = BASE_URL if page == 1 else f"{BASE_URL}?page={page}"
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        html = response.text
        if "game-reset-card" not in html:
            break
        pages.append((url, html))
        if 'rel="next"' not in html:
            break
    if not pages:
        raise RuntimeError("No pages parsed in fetch mode.")
    return pages, utc_now_iso()


def extract_page_number(path: Path) -> int:
    match = re.search(r"(\d+)", path.stem)
    return int(match.group(1)) if match else 1_000_000


def read_snapshot_pages(html_dir: Path) -> tuple[list[tuple[str, str]], str]:
    if not html_dir.exists():
        raise FileNotFoundError(f"Snapshot directory not found: {html_dir}")

    files = sorted(html_dir.glob("*.html"), key=lambda p: (extract_page_number(p), p.name.lower()))
    if not files:
        raise RuntimeError(f"No *.html files found in snapshot directory: {html_dir}")

    pages: list[tuple[str, str]] = []
    for file in files:
        html = file.read_text(encoding="utf-8")
        pages.append((file.resolve().as_uri(), html))
    return pages, utc_now_iso()


def parse_pages(pages: list[tuple[str, str]]) -> dict[str, dict[str, Any]]:
    games: dict[str, dict[str, Any]] = {}

    for page_url, html in pages:
        soup = BeautifulSoup(html, "html.parser")
        cards = soup.select("div.game-reset-card")

        for card in cards:
            title_link = card.select_one("h2 a[href]") or card.select_one("a[href][title]")
            if not title_link:
                continue

            display_name = clean_name(title_link.get_text(" ", strip=True))
            if not display_name:
                continue

            game_url = urljoin(BASE_URL, title_link.get("href", ""))
            game_key = derive_game_key(game_url, display_name)
            game_obj = games.setdefault(game_key, init_game(game_key, display_name))

            game_obj["displayName"] = display_name
            game_obj["aliases"].add(display_name)

            regions_parent = card.select_one("div.regions")
            region_blocks = regions_parent.select("div.rounded-box") if regions_parent else []

            for region_block in region_blocks:
                region_name = extract_region_name(region_block)
                utc_time_raw = extract_utc_time(region_block)

                if utc_time_raw is None:
                    region_entry = {
                        "region": region_name,
                        "resetTimeUtc": None,
                        "resetTimeKst": None,
                        "resetMinutesKst": None,
                        "confidence": "unknown",
                        "sourceUrl": game_url,
                        "sourceNote": "Reset time listed as Unknown in source card.",
                    }
                else:
                    utc_hhmm = normalize_utc_hhmm(utc_time_raw)
                    reset_kst = utc_to_kst_hhmm(utc_hhmm)
                    region_entry = {
                        "region": region_name,
                        "resetTimeUtc": utc_hhmm,
                        "resetTimeKst": reset_kst,
                        "resetMinutesKst": utc_to_kst_minutes(utc_hhmm),
                        "confidence": "community",
                        "sourceUrl": game_url,
                        "sourceNote": "Parsed from GachaList daily-resets list.",
                    }

                existing = game_obj["regions"].get(region_name)
                if existing is None:
                    game_obj["regions"][region_name] = region_entry
                else:
                    if existing["resetTimeKst"] is None and region_entry["resetTimeKst"] is not None:
                        game_obj["regions"][region_name] = region_entry

    for game in games.values():
        game["aliases"] = to_aliases(game["displayName"], set(game["aliases"]))
        game["defaultRegion"] = choose_default_region(list(game["regions"].keys()))

    return games


def apply_overrides(games: dict[str, dict[str, Any]], overrides_path: Path) -> None:
    if not overrides_path.exists():
        return

    data = yaml.safe_load(overrides_path.read_text(encoding="utf-8")) or {}
    games_overrides = data.get("games", {})

    for game_key, payload in games_overrides.items():
        game = games.setdefault(game_key, init_game(game_key, payload.get("displayName") or game_key))

        if payload.get("displayName"):
            game["displayName"] = payload["displayName"]

        for alias in payload.get("aliases", []):
            if alias:
                game["aliases"].add(alias)

        for package_hint in payload.get("packageNameHints", []):
            if package_hint:
                game["packageNameHints"].add(package_hint)

        default_region = payload.get("defaultRegion")
        if default_region:
            game["defaultRegion"] = default_region

        for region_name, region_payload in (payload.get("regions") or {}).items():
            kst_time = region_payload.get("resetTimeKst")
            if kst_time is None:
                utc_time = None
                normalized_kst = None
                minutes_kst = None
            else:
                normalized_kst = normalize_utc_hhmm(kst_time)
                utc_time = kst_to_utc_hhmm(normalized_kst)
                minutes_kst = (int(normalized_kst[:2]) * 60) + int(normalized_kst[3:5])

            game["regions"][region_name] = {
                "region": region_name,
                "resetTimeUtc": utc_time,
                "resetTimeKst": normalized_kst,
                "resetMinutesKst": minutes_kst,
                "confidence": region_payload.get("confidence", "unknown"),
                "sourceUrl": region_payload.get("sourceUrl", BASE_URL),
                "sourceNote": region_payload.get("sourceNote", "Manual override applied."),
            }

        if not game["defaultRegion"]:
            game["defaultRegion"] = choose_default_region(list(game["regions"].keys()))

        game["aliases"] = to_aliases(game["displayName"], set(game["aliases"]))


def game_to_output(game: dict[str, Any]) -> dict[str, Any]:
    region_values = list(game["regions"].values())
    region_values.sort(key=lambda r: region_priority_key(r["region"]))
    return {
        "gameKey": game["gameKey"],
        "displayName": game["displayName"],
        "aliases": sorted(game["aliases"], key=lambda x: x.lower()),
        "defaultRegion": game["defaultRegion"],
        "regions": region_values,
        "packageNameHints": sorted(game["packageNameHints"]),
    }


def pick_default_region_entry(game: dict[str, Any]) -> dict[str, Any]:
    by_name = {region["region"]: region for region in game["regions"]}
    if game["defaultRegion"] in by_name:
        return by_name[game["defaultRegion"]]
    if game["regions"]:
        return game["regions"][0]
    return {
        "region": "Unknown",
        "resetTimeUtc": None,
        "resetTimeKst": None,
        "resetMinutesKst": None,
        "confidence": "unknown",
        "sourceUrl": BASE_URL,
        "sourceNote": "No region data parsed.",
    }


def build_outputs(games: dict[str, dict[str, Any]], retrieved_at_utc: str) -> tuple[dict[str, Any], dict[str, Any]]:
    ordered_games = sorted((game_to_output(g) for g in games.values()), key=lambda g: g["displayName"].lower())

    full = {
        "schemaVersion": 1,
        "generatedAtUtc": utc_now_iso(),
        "baseTimezone": "Asia/Seoul",
        "sourceAttribution": [
            {
                "name": "GachaList daily-resets",
                "url": BASE_URL,
                "retrievedAtUtc": retrieved_at_utc,
                "licenseNote": "CHECK TERMS",
            }
        ],
        "games": ordered_games,
    }

    flat_games = []
    for game in ordered_games:
        default_region = pick_default_region_entry(game)
        flat_games.append(
            {
                "gameKey": game["gameKey"],
                "displayName": game["displayName"],
                "aliases": game["aliases"],
                "resetTimeKst": default_region["resetTimeKst"],
                "resetMinutesKst": default_region["resetMinutesKst"],
                "confidence": default_region["confidence"],
                "sourceUrl": default_region["sourceUrl"],
                "sourceNote": default_region["sourceNote"],
                "packageNameHints": game["packageNameHints"],
            }
        )

    flat = {
        "schemaVersion": 1,
        "generatedAtUtc": full["generatedAtUtc"],
        "baseTimezone": "Asia/Seoul",
        "games": flat_games,
    }

    return full, flat


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build presets_kr JSON assets")
    parser.add_argument("--fetch", action="store_true", help="Fetch pages directly from GachaList")
    parser.add_argument("--html-dir", type=Path, help="Read HTML snapshots from a directory")
    parser.add_argument("--max-pages", type=int, default=30, help="Max pages to fetch in --fetch mode")
    parser.add_argument(
        "--overrides",
        type=Path,
        default=Path("tools/presets/manual_overrides.yaml"),
        help="Path to manual overrides YAML",
    )
    parser.add_argument(
        "--out-full",
        type=Path,
        default=Path("app/src/main/assets/presets_kr_full.json"),
        help="Output path for full normalized JSON",
    )
    parser.add_argument(
        "--out-flat",
        type=Path,
        default=Path("app/src/main/assets/presets_kr_flat.json"),
        help="Output path for flat default-region JSON",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    if args.html_dir:
        pages, retrieved_at = read_snapshot_pages(args.html_dir)
    else:
        if not args.fetch:
            print("[info] --fetch or --html-dir not provided, defaulting to --fetch")
        pages, retrieved_at = fetch_pages(args.max_pages)

    games = parse_pages(pages)
    apply_overrides(games, args.overrides)

    # Ensure defaults are present after override updates.
    for game in games.values():
        if not game["defaultRegion"]:
            game["defaultRegion"] = choose_default_region(list(game["regions"].keys()))

    full, flat = build_outputs(games, retrieved_at)
    write_json(args.out_full, full)
    write_json(args.out_flat, flat)

    print(f"Wrote {args.out_full} ({len(full['games'])} games)")
    print(f"Wrote {args.out_flat} ({len(flat['games'])} games)")


if __name__ == "__main__":
    main()
