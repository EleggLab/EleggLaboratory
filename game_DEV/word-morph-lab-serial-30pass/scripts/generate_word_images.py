from __future__ import annotations

import argparse
import io
import json
import os
import pathlib
import sys
import urllib.error
import urllib.request
import zipfile


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Build or run a 100-word image batch from the Word Morph Lab catalog."
    )
    parser.add_argument(
        "--catalog",
        default="data/word_catalog.json",
        help="Catalog JSON path relative to the project root.",
    )
    parser.add_argument(
        "--config",
        default="novelai.config.sample.json",
        help="Render config JSON path relative to the project root.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=100,
        help="Maximum number of jobs to include.",
    )
    parser.add_argument(
        "--only",
        default="",
        help="Comma-separated list of word ids to render.",
    )
    parser.add_argument(
        "--skip-existing",
        action="store_true",
        help="Skip jobs that already have an output image on disk.",
    )
    parser.add_argument(
        "--live",
        action="store_true",
        help="Actually call the configured HTTP endpoint after writing the manifest.",
    )
    return parser.parse_args()


def load_json(path: pathlib.Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def flatten_catalog(catalog: dict) -> list[dict]:
    words: list[dict] = []
    default_render = catalog.get("meta", {}).get("default_render", {})
    base_seed = int(default_render.get("base_seed", 0))

    for category in catalog.get("categories", []):
        for raw_word in category.get("words", []):
            word_id = str(raw_word[0]).strip().lower()
            prompt_delta = str(raw_word[1]).strip()
            mood = str(raw_word[2]).strip()
            aliases = raw_word[3] if len(raw_word) > 3 and isinstance(raw_word[3], list) else []
            if not word_id:
                continue

            index = len(words) + 1
            words.append(
                {
                    "id": word_id,
                    "label": to_label(word_id),
                    "aliases": [word_id, *[normalize_token(alias) for alias in aliases if normalize_token(alias)]],
                    "category": category["slug"],
                    "category_label": category["label"],
                    "accent": category["accent"],
                    "prompt_delta": prompt_delta,
                    "mood": mood,
                    "seed": base_seed + index,
                    "image_path": f"./assets/generated/{word_id}.png",
                }
            )

    return words


def build_jobs(catalog: dict, config: dict, only_ids: set[str], limit: int) -> list[dict]:
    jobs: list[dict] = []
    meta = catalog.get("meta", {})
    default_render = meta.get("default_render", {})
    render_cfg = {**default_render, **config.get("render", {})}
    prompting_cfg = config.get("prompting", {})
    base_prompt = prompting_cfg.get("base_prompt_override") or meta.get("base_prompt", "")
    negative_prompt = ", ".join(
        filter(
            None,
            [
                meta.get("negative_prompt", ""),
                prompting_cfg.get("negative_prompt_suffix", ""),
            ],
        )
    )
    suffix_template = prompting_cfg.get("suffix_template", "{category} state, {mood}")

    for word in flatten_catalog(catalog):
        if only_ids and word["id"] not in only_ids:
            continue
        if len(jobs) >= limit:
            break

        suffix = suffix_template.format(category=word["category_label"].lower(), mood=word["mood"])
        full_prompt = ", ".join(filter(None, [base_prompt, word["prompt_delta"], suffix]))

        jobs.append(
            {
                "slug": word["id"],
                "label": word["label"],
                "category": word["category"],
                "category_label": word["category_label"],
                "prompt": full_prompt,
                "negative_prompt": negative_prompt,
                "seed": int(word["seed"]),
                "width": int(render_cfg.get("width", 832)),
                "height": int(render_cfg.get("height", 1216)),
                "steps": int(render_cfg.get("steps", 24)),
                "scale": float(render_cfg.get("scale", 5.5)),
                "sampler": str(render_cfg.get("sampler", "k_euler")),
                "cfg_rescale": float(render_cfg.get("cfg_rescale", 0.2)),
                "model": str(render_cfg.get("model", "nai-diffusion-3")),
                "n_samples": int(render_cfg.get("n_samples", 1)),
                "quality_toggle": bool(render_cfg.get("quality_toggle", True)),
                "sm": bool(render_cfg.get("sm", True)),
                "sm_dyn": bool(render_cfg.get("sm_dyn", True)),
                "output_path": word["image_path"],
            }
        )

    return jobs


def normalize_token(value: str) -> str:
    return " ".join(str(value or "").strip().lower().replace("_", " ").replace("-", " ").split())


def to_label(value: str) -> str:
    return " ".join(chunk.capitalize() for chunk in value.replace("_", " ").replace("-", " ").split())


def build_payload(job: dict) -> dict:
    return {
        "input": job["prompt"],
        "model": job["model"],
        "action": "generate",
        "parameters": {
            "width": job["width"],
            "height": job["height"],
            "steps": job["steps"],
            "scale": job["scale"],
            "sampler": job["sampler"],
            "cfg_rescale": job["cfg_rescale"],
            "seed": job["seed"],
            "n_samples": job["n_samples"],
            "qualityToggle": job["quality_toggle"],
            "sm": job["sm"],
            "sm_dyn": job["sm_dyn"],
            "negative_prompt": job["negative_prompt"],
        },
    }


def write_manifest(path: pathlib.Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def save_image_bytes(response_bytes: bytes, target_path: pathlib.Path) -> None:
    target_path.parent.mkdir(parents=True, exist_ok=True)

    if response_bytes[:2] == b"PK":
        with zipfile.ZipFile(io.BytesIO(response_bytes)) as archive:
            image_candidates = [
                name
                for name in archive.namelist()
                if name.lower().endswith((".png", ".jpg", ".jpeg", ".webp"))
            ]
            if not image_candidates:
                raise RuntimeError("ZIP response did not contain an image file.")
            with archive.open(image_candidates[0]) as handle:
                target_path.write_bytes(handle.read())
            return

    if response_bytes.startswith(b"\x89PNG") or response_bytes.startswith(b"\xff\xd8"):
        target_path.write_bytes(response_bytes)
        return

    try:
        payload = json.loads(response_bytes.decode("utf-8"))
    except Exception as error:  # pragma: no cover - defensive branch
        raise RuntimeError(f"Unsupported response format: {error}") from error

    image_field = None
    if isinstance(payload, dict):
        if isinstance(payload.get("image"), str):
            image_field = payload["image"]
        elif isinstance(payload.get("images"), list) and payload["images"]:
            first = payload["images"][0]
            if isinstance(first, str):
                image_field = first

    if not image_field:
        raise RuntimeError("JSON response did not contain a usable image field.")

    import base64

    target_path.write_bytes(base64.b64decode(image_field))


def run_live_batch(project_root: pathlib.Path, config: dict, jobs: list[dict], skip_existing: bool) -> None:
    api_cfg = config.get("api", {})
    endpoint = str(api_cfg.get("endpoint", "")).strip()
    token_env = str(api_cfg.get("token_env", "")).strip()
    timeout_seconds = int(api_cfg.get("timeout_seconds", 180))
    image_dir = pathlib.Path(project_root, config.get("output", {}).get("image_dir", "./assets/generated"))
    overwrite = bool(config.get("output", {}).get("overwrite", False))

    if not endpoint:
        raise RuntimeError("Config is missing api.endpoint.")
    if not token_env:
        raise RuntimeError("Config is missing api.token_env.")

    token = os.environ.get(token_env)
    if not token:
        raise RuntimeError(f"Environment variable {token_env} is not set.")

    for index, job in enumerate(jobs, start=1):
        output_path = image_dir / f"{job['slug']}.png"
        if output_path.exists() and (skip_existing or not overwrite):
            print(f"[skip] {job['slug']} -> {output_path}")
            continue

        payload = build_payload(job)
        request = urllib.request.Request(
            endpoint,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {token}",
                "Accept": "application/json, application/zip, image/png, image/jpeg",
            },
            method="POST",
        )

        print(f"[{index}/{len(jobs)}] rendering {job['slug']} -> {output_path}")
        try:
            with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
                response_bytes = response.read()
            save_image_bytes(response_bytes, output_path)
        except urllib.error.HTTPError as error:
            body = error.read().decode("utf-8", errors="replace")
            print(f"[error] {job['slug']} -> HTTP {error.code}\n{body}", file=sys.stderr)
        except Exception as error:  # pragma: no cover - defensive branch
            print(f"[error] {job['slug']} -> {error}", file=sys.stderr)


def main() -> int:
    args = parse_args()
    project_root = pathlib.Path(__file__).resolve().parents[1]
    catalog_path = project_root / args.catalog
    config_path = project_root / args.config

    catalog = load_json(catalog_path)
    config = load_json(config_path)
    only_ids = {normalize_token(item) for item in args.only.split(",") if normalize_token(item)}
    jobs = build_jobs(catalog, config, only_ids, args.limit)

    manifest_payload = {
        "catalog_title": catalog.get("meta", {}).get("title", "Word Morph Lab"),
        "job_count": len(jobs),
        "jobs": jobs,
    }

    manifest_path = project_root / config.get("output", {}).get("manifest_path", "./output/jobs/word_jobs.json")
    write_manifest(manifest_path, manifest_payload)
    print(f"[manifest] wrote {len(jobs)} jobs to {manifest_path}")

    if not args.live:
        print("[manifest] dry run only. Add --live after you expose the NovelAI token.")
        return 0

    run_live_batch(project_root, config, jobs, args.skip_existing)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
