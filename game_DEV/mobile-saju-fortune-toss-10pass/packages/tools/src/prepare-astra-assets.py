#!/usr/bin/env python3
from __future__ import annotations

import io
import json
import re
import shutil
from dataclasses import dataclass
from pathlib import Path

from PIL import Image

repo_root = Path(__file__).resolve().parents[3]
workspace_root = repo_root.parents[1]
assets_root = repo_root / "apps" / "mobile" / "assets" / "astra"
manifest_path = repo_root / "apps" / "mobile" / "lib" / "features" / "astra" / "generatedManifest.ts"

TIER_LABELS = ["1-2", "3-4", "5-6", "7-8", "9-10"]
HEART_EMOJI = chr(0x1F49C)
TIER_HEADINGS = [f"{HEART_EMOJI} {tier.replace('-', '~')}" for tier in TIER_LABELS]
TIER_HEADING_SET = set(TIER_HEADINGS)
RE_TIER_HEADING = re.compile(r"(?<!\d)([1-9]\d?)~([1-9]\d?)(?!\d)")


@dataclass(frozen=True)
class VariantConfig:
    source_index: int
    slug: str
    unlock_affinity_min: int


VARIANT_CONFIGS: list[VariantConfig] = [
    VariantConfig(0, "smile-trust-front", 1),
    VariantConfig(1, "bright-smile-comfort", 1),
    VariantConfig(8, "wave-greeting", 1),
    VariantConfig(6, "peace-sign-playful", 1),
    VariantConfig(15, "playful-relaxed", 1),
    VariantConfig(21, "gray-neutral", 1),
    VariantConfig(16, "window-flutter", 3),
    VariantConfig(17, "teal-smile", 3),
    VariantConfig(5, "leaning-wall-look", 3),
    VariantConfig(4, "bright-outdoor-surprised", 3),
    VariantConfig(9, "crystal-destiny-link", 5),
    VariantConfig(20, "arms-crossed-cool", 5),
    VariantConfig(2, "dark-hand-reach", 5),
    VariantConfig(3, "teary-closeup", 5),
    VariantConfig(18, "bedroom-lean", 7),
    VariantConfig(12, "dark-room-sofa", 7),
    VariantConfig(7, "sulky-hurt", 7),
    VariantConfig(19, "raised-arm-allure", 7),
    VariantConfig(10, "dark-room-vulnerable", 9),
    VariantConfig(14, "crying-dependent", 9),
    VariantConfig(11, "dark-room-danger", 9),
    VariantConfig(13, "dark-hand-allure-danger", 9),
]


def discover_source_root() -> Path:
    explicit = workspace_root / "shared-assets" / "characters" / "astra"
    if explicit.is_dir():
        return explicit

    candidates: list[Path] = []
    for entry in workspace_root.iterdir():
        if not entry.is_dir():
            continue
        child_dirs = [child for child in entry.iterdir() if child.is_dir()]
        if len(child_dirs) < 20:
            continue
        valid_children = 0
        for child in child_dirs:
            txt_count = len(list(child.glob("*.txt")))
            png_count = len(list(child.glob("*.png")))
            gif_count = len(list(child.glob("*.gif")))
            if txt_count == 1 and png_count == 1 and gif_count <= 1:
                valid_children += 1
        if valid_children == len(child_dirs):
            candidates.append(entry)

    if len(candidates) != 1:
      raise RuntimeError(f"Expected exactly one Astra source folder, found {len(candidates)} candidates: {candidates}")

    return candidates[0]


def resize_if_needed(image: Image.Image, max_long_edge: int) -> Image.Image:
    width, height = image.size
    long_edge = max(width, height)
    if long_edge <= max_long_edge:
        return image
    scale = max_long_edge / float(long_edge)
    next_size = (max(1, int(width * scale)), max(1, int(height * scale)))
    return image.resize(next_size, Image.Resampling.LANCZOS)


def encode_png_bytes(image: Image.Image) -> bytes:
    buf = io.BytesIO()
    image.save(buf, format="PNG", optimize=True, compress_level=9)
    return buf.getvalue()


def encode_quantized_png_bytes(image: Image.Image, max_colors: int) -> bytes:
    quantized = image.quantize(
        colors=max_colors,
        method=Image.Quantize.FASTOCTREE,
        dither=Image.Dither.FLOYDSTEINBERG,
    )
    buf = io.BytesIO()
    quantized.save(buf, format="PNG", optimize=True, compress_level=9)
    return buf.getvalue()


def optimize_png(src_path: Path, dst_path: Path) -> tuple[int, tuple[int, int]]:
    with Image.open(src_path) as img:
        base = img.convert("RGBA")
        base = resize_if_needed(base, 1600)
        candidate = encode_png_bytes(base)
        quantized = encode_quantized_png_bytes(base, 256)
        best = quantized if len(quantized) < len(candidate) else candidate
        dst_path.write_bytes(best)
        return len(best), base.size


def optimize_gif(src_path: Path, dst_path: Path) -> tuple[int, tuple[int, int], int]:
    with Image.open(src_path) as img:
        frame_count = getattr(img, "n_frames", 1)
        best_bytes: bytes | None = None
        best_size = (0, 0)
        best_duration_ms = 0

        step_candidates = [1]
        if frame_count >= 70:
            step_candidates.append(2)
        if frame_count >= 140:
            step_candidates.append(3)

        color_candidates = [128, 112, 96, 80, 64]

        for frame_step in step_candidates:
            for colors in color_candidates:
                frames: list[Image.Image] = []
                durations: list[int] = []

                for index in range(0, frame_count, frame_step):
                    img.seek(index)
                    duration = int(img.info.get("duration", 67))
                    frame = resize_if_needed(img.convert("RGBA"), 720)
                    quantized = frame.convert(
                        "P",
                        palette=Image.Palette.ADAPTIVE,
                        colors=colors,
                        dither=Image.Dither.FLOYDSTEINBERG,
                    )
                    frames.append(quantized)
                    durations.append(max(20, duration * frame_step))

                output = io.BytesIO()
                frames[0].save(
                    output,
                    format="GIF",
                    save_all=True,
                    append_images=frames[1:],
                    optimize=True,
                    loop=int(img.info.get("loop", 0)),
                    duration=durations,
                    disposal=2,
                )
                candidate = output.getvalue()
                if best_bytes is None or len(candidate) < len(best_bytes):
                    best_bytes = candidate
                    best_size = frames[0].size
                    best_duration_ms = sum(durations)

        if best_bytes is None:
            raise RuntimeError(f"Failed to encode gif: {src_path}")

        dst_path.write_bytes(best_bytes)
        return len(best_bytes), best_size, best_duration_ms


def parse_dialogues(txt_path: Path) -> dict[str, list[str]]:
    content = txt_path.read_text(encoding="utf-8")
    current_tier: str | None = None
    dialogue_by_tier = {tier: [] for tier in TIER_LABELS}

    for raw_line in content.splitlines():
        line = raw_line.strip()
        if not line:
            continue

        heading_matches = RE_TIER_HEADING.findall(line)
        if heading_matches:
            start, end = heading_matches[-1]
            normalized = f"{start}-{end}"
            if normalized not in TIER_LABELS:
                raise RuntimeError(f"Unknown Astra tier heading in {txt_path}: {line}")
            current_tier = normalized
            continue

        if current_tier is None:
            continue

        cleaned = line.strip().strip('"').strip("'").strip()
        if cleaned:
            dialogue_by_tier[current_tier].append(cleaned)

    missing = [tier for tier, lines in dialogue_by_tier.items() if not lines]
    if missing:
        raise RuntimeError(f"Missing dialogue tiers in {txt_path}: {', '.join(missing)}")

    return dialogue_by_tier


def json_block(data: object) -> str:
    return json.dumps(data, ensure_ascii=True, indent=6)


def main() -> None:
    source_root = discover_source_root()
    source_dirs = sorted(child for child in source_root.iterdir() if child.is_dir())

    if len(source_dirs) <= max(config.source_index for config in VARIANT_CONFIGS):
        raise RuntimeError("Astra source folder count is lower than expected.")

    if assets_root.exists():
        shutil.rmtree(assets_root)
    assets_root.mkdir(parents=True, exist_ok=True)
    manifest_path.parent.mkdir(parents=True, exist_ok=True)

    manifest_items: list[str] = []
    still_total = 0
    gif_total = 0

    for config in VARIANT_CONFIGS:
        folder = source_dirs[config.source_index]
        txt_files = list(folder.glob("*.txt"))
        png_files = list(folder.glob("*.png"))
        gif_files = list(folder.glob("*.gif"))

        if len(txt_files) != 1 or len(png_files) != 1 or len(gif_files) > 1:
            raise RuntimeError(
                f"Unexpected asset layout in {folder}: txt={len(txt_files)}, png={len(png_files)}, gif={len(gif_files)}"
            )

        target_dir = assets_root / config.slug
        target_dir.mkdir(parents=True, exist_ok=True)

        still_path = target_dir / "still.png"
        still_size, _ = optimize_png(png_files[0], still_path)
        still_total += still_size

        loop_require = ""
        loop_duration_line = ""
        if gif_files:
            loop_path = target_dir / "loop.gif"
            loop_size, _, loop_duration_ms = optimize_gif(gif_files[0], loop_path)
            gif_total += loop_size
            loop_require = (
                f"      loop: require('../../../assets/astra/{config.slug}/loop.gif') as ImageSourcePropType,\n"
            )
            loop_duration_line = f"      loopDurationMs: {loop_duration_ms},\n"

        dialogues = parse_dialogues(txt_files[0])
        dialogues_ts = json_block(dialogues)

        manifest_items.append(
            (
                "    {\n"
                f"      id: 'astra-{config.slug}',\n"
                f"      slug: '{config.slug}',\n"
                f"      label: {json.dumps(folder.name, ensure_ascii=True)},\n"
                f"      unlockAffinityMin: {config.unlock_affinity_min},\n"
                f"      still: require('../../../assets/astra/{config.slug}/still.png') as ImageSourcePropType,\n"
                f"{loop_require}"
                f"{loop_duration_line}"
                f"      dialogueByTier: {dialogues_ts} as Record<AstraDialogueTier, readonly string[]>,\n"
                "    }"
            )
        )

    manifest_body = ",\n".join(manifest_items)
    manifest_content = (
        "import type { ImageSourcePropType } from 'react-native';\n\n"
        "export type AstraDialogueTier = '1-2' | '3-4' | '5-6' | '7-8' | '9-10';\n\n"
        "export interface AstraVariantManifest {\n"
        "  id: string;\n"
        "  slug: string;\n"
        "  label: string;\n"
        "  unlockAffinityMin: number;\n"
        "  still: ImageSourcePropType;\n"
        "  loop?: ImageSourcePropType;\n"
        "  loopDurationMs?: number;\n"
        "  dialogueByTier: Record<AstraDialogueTier, readonly string[]>;\n"
        "}\n\n"
        "export const ASTRA_VARIANTS: readonly AstraVariantManifest[] = [\n"
        f"{manifest_body}\n"
        "];\n"
    )

    manifest_path.write_text(manifest_content, encoding="utf-8")

    print(f"[astra] source: {source_root}")
    print(f"[astra] output: {assets_root}")
    print(f"[astra] manifest: {manifest_path}")
    print(f"[astra] variants: {len(VARIANT_CONFIGS)}")
    print(f"[astra] still total: {still_total / 1024 / 1024:.2f} MB")
    print(f"[astra] gif total: {gif_total / 1024 / 1024:.2f} MB")


if __name__ == "__main__":
    main()
