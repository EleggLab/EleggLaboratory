from __future__ import annotations

import json
import os
import unicodedata
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Tuple

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[2]
ASSET_ROOT = ROOT / "Asset"
PUBLIC_ROOT = ROOT / "pc-choice-ugc" / "public" / "stock-library"
DOCS_ROOT = ROOT / "pc-choice-ugc" / "docs"


@dataclass
class SourceSpec:
    key: str
    kind: str
    target_name: str
    tokens: Tuple[str, ...]
    max_w: int
    max_h: int
    quality: int
    style: str
    usage: str
    tags: List[str]


def normalize_text(value: str) -> str:
    return unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii").lower()


def find_best_matches(specs: Iterable[SourceSpec]) -> Dict[str, Path]:
    spec_list = list(specs)
    found: Dict[str, Path] = {}
    for root, _, files in os.walk(ASSET_ROOT):
        for file in files:
            ext = Path(file).suffix.lower()
            if ext not in {".png", ".jpg", ".jpeg", ".webp"}:
                continue
            file_path = Path(root) / file
            haystack = normalize_text(str(file_path))
            for spec in spec_list:
                if all(token in haystack for token in spec.tokens):
                    current = found.get(spec.key)
                    if current is None or len(str(file_path)) < len(str(current)):
                        found[spec.key] = file_path
    return found


def convert_webp(src: Path, dst: Path, max_w: int, max_h: int, quality: int) -> Dict[str, int]:
    dst.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(src) as image:
        image = image.convert("RGBA")
        original_w, original_h = image.size
        scale = min(max_w / original_w, max_h / original_h, 1.0)
        out_w = max(1, int(original_w * scale))
        out_h = max(1, int(original_h * scale))
        if (out_w, out_h) != (original_w, original_h):
            image = image.resize((out_w, out_h), Image.Resampling.LANCZOS)
        image.save(dst, format="WEBP", quality=quality, method=6)
    return {
        "originalWidth": original_w,
        "originalHeight": original_h,
        "width": out_w,
        "height": out_h,
        "bytes": dst.stat().st_size,
    }


def collect_pack_summary() -> Dict[str, Dict[str, object]]:
    summary: Dict[str, Dict[str, object]] = {}
    for root, _, files in os.walk(ASSET_ROOT):
        rel = Path(root).relative_to(ASSET_ROOT)
        if not rel.parts:
            continue
        pack = rel.parts[0]
        for file in files:
            ext = Path(file).suffix.lower()
            if ext not in {".png", ".jpg", ".jpeg", ".webp"}:
                continue
            entry = summary.setdefault(
                pack,
                {
                    "images": 0,
                    "styles": set(),
                    "types": set(),
                },
            )
            entry["images"] += 1
            lower = normalize_text(str(Path(root) / file))
            if "datinggameui" in lower or "renpy" in lower:
                entry["styles"].add("subculture-ui")
            elif "face" in lower:
                entry["styles"].add("subculture-portrait")
            elif "kawaii" in lower or "cozy" in lower:
                entry["styles"].add("cute-casual")
            elif "kenney" in lower:
                entry["styles"].add("flat-gamepack")
            else:
                entry["styles"].add("mixed")

            if any(token in lower for token in ["background", "day.jpg", "night.jpg", "scene"]):
                entry["types"].add("background")
            elif any(token in lower for token in ["face", "visage", "portrait", "character"]):
                entry["types"].add("character")
            elif any(token in lower for token in ["button", "panel", "dialogue", "icon", "popup", "container"]):
                entry["types"].add("ui")
            else:
                entry["types"].add("misc")

    normalized: Dict[str, Dict[str, object]] = {}
    for pack, data in summary.items():
        normalized[pack] = {
            "images": data["images"],
            "styles": sorted(data["styles"]),
            "types": sorted(data["types"]),
        }
    return dict(sorted(normalized.items(), key=lambda x: x[1]["images"], reverse=True))


def main() -> None:
    specs: List[SourceSpec] = [
        SourceSpec(
            key="bg_dating_main",
            kind="background",
            target_name="backgrounds/dating_main.webp",
            tokens=("datinggameui", "exports", "background.jpg"),
            max_w=1440,
            max_h=900,
            quality=80,
            style="subculture-ui",
            usage="template-background",
            tags=["배경", "서브컬쳐", "연애시뮬레이션", "실내", "임시태그배경"],
        ),
        SourceSpec(
            key="bg_dating_home",
            kind="background",
            target_name="backgrounds/dating_home.webp",
            tokens=("homescreenbackground.jpg",),
            max_w=1440,
            max_h=900,
            quality=80,
            style="subculture-ui",
            usage="template-background",
            tags=["배경", "서브컬쳐", "홈화면", "실내", "임시태그배경"],
        ),
        SourceSpec(
            key="bg_renpy_day",
            kind="background",
            target_name="backgrounds/renpy_day.webp",
            tokens=("day.jpg",),
            max_w=1440,
            max_h=900,
            quality=80,
            style="subculture-renpy",
            usage="template-background",
            tags=["배경", "서브컬쳐", "주간", "미연시", "임시태그배경"],
        ),
        SourceSpec(
            key="bg_renpy_night",
            kind="background",
            target_name="backgrounds/renpy_night.webp",
            tokens=("night.jpg",),
            max_w=1440,
            max_h=900,
            quality=80,
            style="subculture-renpy",
            usage="template-background",
            tags=["배경", "서브컬쳐", "야간", "미연시", "임시태그배경"],
        ),
        SourceSpec(
            key="bg_messaging_room",
            kind="background",
            target_name="backgrounds/messaging_room.webp",
            tokens=("messagingbackground.png",),
            max_w=1280,
            max_h=900,
            quality=82,
            style="subculture-ui",
            usage="situation-background",
            tags=["배경", "상황", "메신저", "서브컬쳐", "임시태그배경"],
        ),
        SourceSpec(
            key="bg_settings_room",
            kind="background",
            target_name="backgrounds/settings_room.webp",
            tokens=("settingsbackground.png",),
            max_w=1440,
            max_h=900,
            quality=82,
            style="subculture-ui",
            usage="situation-background",
            tags=["배경", "설정화면", "서브컬쳐", "UI", "임시태그배경"],
        ),
        SourceSpec(
            key="ted_normal",
            kind="character",
            target_name="characters/ted_normal.webp",
            tokens=("visage neutre",),
            max_w=512,
            max_h=512,
            quality=84,
            style="subculture-portrait",
            usage="character-standing",
            tags=["사람", "남성", "서브컬쳐", "초상", "표정", "임시태그캐릭터"],
        ),
        SourceSpec(
            key="ted_sick",
            kind="character",
            target_name="characters/ted_sick.webp",
            tokens=("visage triste",),
            max_w=512,
            max_h=512,
            quality=84,
            style="subculture-portrait",
            usage="character-status",
            tags=["사람", "남성", "서브컬쳐", "아픔", "표정", "임시태그캐릭터"],
        ),
        SourceSpec(
            key="ted_insane",
            kind="character",
            target_name="characters/ted_insane.webp",
            tokens=("visage", "nerver"),
            max_w=512,
            max_h=512,
            quality=84,
            style="subculture-portrait",
            usage="character-status",
            tags=["사람", "남성", "서브컬쳐", "불안정", "표정", "임시태그캐릭터"],
        ),
        SourceSpec(
            key="dolores_normal",
            kind="character",
            target_name="characters/dolores_normal.webp",
            tokens=("visage sourire",),
            max_w=512,
            max_h=512,
            quality=84,
            style="subculture-portrait",
            usage="character-standing",
            tags=["사람", "여성", "서브컬쳐", "초상", "표정", "임시태그캐릭터"],
        ),
        SourceSpec(
            key="dolores_sick",
            kind="character",
            target_name="characters/dolores_sick.webp",
            tokens=("visage pleure",),
            max_w=512,
            max_h=512,
            quality=84,
            style="subculture-portrait",
            usage="character-status",
            tags=["사람", "여성", "서브컬쳐", "아픔", "표정", "임시태그캐릭터"],
        ),
        SourceSpec(
            key="dolores_insane",
            kind="character",
            target_name="characters/dolores_insane.webp",
            tokens=("visage suspicieux",),
            max_w=512,
            max_h=512,
            quality=84,
            style="subculture-portrait",
            usage="character-status",
            tags=["사람", "여성", "서브컬쳐", "불안정", "표정", "임시태그캐릭터"],
        ),
        SourceSpec(
            key="mary_normal",
            kind="character",
            target_name="characters/mary_normal.webp",
            tokens=("visage clindoeil2",),
            max_w=512,
            max_h=512,
            quality=84,
            style="subculture-portrait",
            usage="character-standing",
            tags=["사람", "여성", "서브컬쳐", "초상", "표정", "임시태그캐릭터"],
        ),
        SourceSpec(
            key="mary_sick",
            kind="character",
            target_name="characters/mary_sick.webp",
            tokens=("visage peur",),
            max_w=512,
            max_h=512,
            quality=84,
            style="subculture-portrait",
            usage="character-status",
            tags=["사람", "여성", "서브컬쳐", "아픔", "표정", "임시태그캐릭터"],
        ),
        SourceSpec(
            key="mary_insane",
            kind="character",
            target_name="characters/mary_insane.webp",
            tokens=("visage pucca 2",),
            max_w=512,
            max_h=512,
            quality=84,
            style="subculture-portrait",
            usage="character-status",
            tags=["사람", "여성", "서브컬쳐", "불안정", "표정", "임시태그캐릭터"],
        ),
        SourceSpec(
            key="timmy_normal",
            kind="character",
            target_name="characters/timmy_normal.webp",
            tokens=("visage 1",),
            max_w=512,
            max_h=512,
            quality=84,
            style="subculture-portrait",
            usage="character-standing",
            tags=["사람", "남성", "서브컬쳐", "초상", "표정", "임시태그캐릭터"],
        ),
        SourceSpec(
            key="timmy_sick",
            kind="character",
            target_name="characters/timmy_sick.webp",
            tokens=("visage 2",),
            max_w=512,
            max_h=512,
            quality=84,
            style="subculture-portrait",
            usage="character-status",
            tags=["사람", "남성", "서브컬쳐", "아픔", "표정", "임시태그캐릭터"],
        ),
        SourceSpec(
            key="timmy_insane",
            kind="character",
            target_name="characters/timmy_insane.webp",
            tokens=("visage 3",),
            max_w=512,
            max_h=512,
            quality=84,
            style="subculture-portrait",
            usage="character-status",
            tags=["사람", "남성", "서브컬쳐", "불안정", "표정", "임시태그캐릭터"],
        ),
    ]

    matches = find_best_matches(specs)
    manifest: Dict[str, object] = {
        "version": 1,
        "generatedBy": "tools/prepare_stock_assets.py",
        "entries": [],
        "packSummary": collect_pack_summary(),
    }

    for spec in specs:
        source = matches.get(spec.key)
        if source is None:
            continue
        output_path = PUBLIC_ROOT / spec.target_name
        image_meta = convert_webp(source, output_path, spec.max_w, spec.max_h, spec.quality)
        manifest["entries"].append(
            {
                "id": spec.key,
                "kind": spec.kind,
                "style": spec.style,
                "usage": spec.usage,
                "tags": spec.tags,
                "source": str(source.relative_to(ROOT)).replace("\\", "/"),
                "output": f"/stock-library/{spec.target_name.replace(os.sep, '/')}",
                **image_meta,
            }
        )

    # Dead-state portraits generated from normal portraits
    dead_mapping = {
        "ted_dead": "ted_normal",
        "dolores_dead": "dolores_normal",
        "mary_dead": "mary_normal",
        "timmy_dead": "timmy_normal",
    }
    for dead_key, normal_key in dead_mapping.items():
        src = PUBLIC_ROOT / "characters" / f"{normal_key}.webp"
        if not src.exists():
            continue
        dst = PUBLIC_ROOT / "characters" / f"{dead_key}.webp"
        with Image.open(src) as image:
            image = ImageOps.grayscale(image).convert("RGBA")
            image.save(dst, format="WEBP", quality=80, method=6)
        manifest["entries"].append(
            {
                "id": dead_key,
                "kind": "character",
                "style": "subculture-portrait",
                "usage": "character-status",
                "tags": ["사람", "흑백", "사망", "표정", "임시태그캐릭터"],
                "source": f"generated-from:{normal_key}",
                "output": f"/stock-library/characters/{dead_key}.webp",
                "originalWidth": 512,
                "originalHeight": 512,
                "width": 512,
                "height": 512,
                "bytes": dst.stat().st_size,
            }
        )

    PUBLIC_ROOT.mkdir(parents=True, exist_ok=True)
    manifest_path = PUBLIC_ROOT / "manifest.json"
    with manifest_path.open("w", encoding="utf-8") as file:
        json.dump(manifest, file, ensure_ascii=False, indent=2)

    DOCS_ROOT.mkdir(parents=True, exist_ok=True)
    report_path = DOCS_ROOT / "ASSET_CLASSIFICATION.md"
    with report_path.open("w", encoding="utf-8") as file:
        file.write("# Asset Classification\n\n")
        file.write("## Pack Summary\n\n")
        file.write("| Pack | Image Count | Style Groups | Type Groups |\n")
        file.write("| --- | ---: | --- | --- |\n")
        for pack, data in manifest["packSummary"].items():
            styles = ", ".join(data["styles"])
            types = ", ".join(data["types"])
            file.write(f"| {pack} | {data['images']} | {styles} | {types} |\n")

        file.write("\n## Curated Template Set\n\n")
        file.write("| ID | Kind | Style | Usage | Output | Tags |\n")
        file.write("| --- | --- | --- | --- | --- | --- |\n")
        for entry in manifest["entries"]:
            tags = ", ".join(entry["tags"])
            file.write(
                f"| {entry['id']} | {entry['kind']} | {entry['style']} | {entry['usage']} | {entry['output']} | {tags} |\n"
            )

    print(f"Generated: {manifest_path}")
    print(f"Generated: {report_path}")


if __name__ == "__main__":
    main()
