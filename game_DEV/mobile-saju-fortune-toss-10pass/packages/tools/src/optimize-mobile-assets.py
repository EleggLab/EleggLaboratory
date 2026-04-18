#!/usr/bin/env python3
from __future__ import annotations

import io
import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from PIL import Image

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp"}
SOURCE_EXTENSIONS = {".ts", ".tsx", ".js", ".jsx"}
IGNORE_DIRS = {"node_modules", "dist", "android", "ios", ".expo", "build-artifacts"}
RE_REQUIRE = re.compile(r"""require\((['"])([^'"]*assets/[^'"]+)\1\)""")


@dataclass
class Rule:
    max_long_edge: int
    max_colors: int | None


def iter_files(root: Path, exts: set[str]) -> Iterable[Path]:
    stack = [root]
    while stack:
        current = stack.pop()
        if not current.exists():
            continue
        for entry in current.iterdir():
            if entry.is_dir():
                if entry.name not in IGNORE_DIRS:
                    stack.append(entry)
                continue
            if entry.suffix.lower() in exts:
                yield entry


def parse_require_assets(file_path: Path) -> list[str]:
    content = file_path.read_text(encoding="utf-8")
    code_only = re.sub(r"/\*[\s\S]*?\*/", "", content)
    code_only = re.sub(r"//.*$", "", code_only, flags=re.M)
    return [m[1] for m in RE_REQUIRE.findall(code_only)]


def resolve_rule(rel_path: str) -> Rule:
    rp = rel_path.replace("\\", "/")
    if "/assets/astra/" in rp:
        if rp.endswith(".gif"):
            return Rule(max_long_edge=720, max_colors=128)
        return Rule(max_long_edge=1600, max_colors=256)
    if "dos_simple_square_app_icon_twelve_zodiac_animals" in rp:
        return Rule(max_long_edge=384, max_colors=192)
    if "/assets/icons/" in rp:
        return Rule(max_long_edge=384, max_colors=192)
    if "/assets/tarot/major/" in rp:
        return Rule(max_long_edge=1024, max_colors=256)
    if "/assets/zodiac/" in rp:
        return Rule(max_long_edge=900, max_colors=256)
    if "/assets/backgrounds/" in rp:
        return Rule(max_long_edge=1350, max_colors=256)
    return Rule(max_long_edge=1024, max_colors=256)


def resize_if_needed(image: Image.Image, max_long_edge: int) -> Image.Image:
    w, h = image.size
    long_edge = max(w, h)
    if long_edge <= max_long_edge:
        return image
    scale = max_long_edge / float(long_edge)
    next_size = (max(1, int(w * scale)), max(1, int(h * scale)))
    return image.resize(next_size, Image.Resampling.LANCZOS)


def encode_png_bytes(image: Image.Image) -> bytes:
    buf = io.BytesIO()
    image.save(buf, format="PNG", optimize=True, compress_level=9)
    return buf.getvalue()


def encode_quantized_png_bytes(image: Image.Image, max_colors: int) -> bytes:
    # FASTOCTREE handles RGBA input and usually yields a strong size reduction
    # for illustration-style assets while keeping visual quality acceptable.
    quantized = image.quantize(colors=max_colors, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.FLOYDSTEINBERG)
    buf = io.BytesIO()
    quantized.save(buf, format="PNG", optimize=True, compress_level=9)
    return buf.getvalue()


def unique_ints(values: list[int]) -> list[int]:
    seen: set[int] = set()
    out: list[int] = []
    for value in values:
        if value not in seen:
            seen.add(value)
            out.append(value)
    return out


def encode_gif_candidate(
    image: Image.Image,
    rule: Rule,
    frame_step: int,
    colors: int,
) -> bytes | None:
    frame_count = getattr(image, "n_frames", 1)
    frames: list[Image.Image] = []
    durations: list[int] = []

    for index in range(0, frame_count, frame_step):
        image.seek(index)
        duration = int(image.info.get("duration", 67))
        frame = image.convert("RGBA")
        frame = resize_if_needed(frame, rule.max_long_edge)
        quantized = frame.convert(
            "P",
            palette=Image.Palette.ADAPTIVE,
            colors=colors,
            dither=Image.Dither.FLOYDSTEINBERG,
        )
        frames.append(quantized)
        durations.append(max(20, duration * frame_step))

    if not frames:
        return None

    buf = io.BytesIO()
    loop = int(image.info.get("loop", 0))
    frames[0].save(
        buf,
        format="GIF",
        save_all=True,
        append_images=frames[1:],
        optimize=True,
        loop=loop,
        duration=durations,
        disposal=2,
    )
    return buf.getvalue()


def optimize_gif_bytes(path: Path, rule: Rule) -> bytes | None:
    gif_rule = Rule(max_long_edge=min(rule.max_long_edge, 480), max_colors=rule.max_colors)
    with Image.open(path) as im:
        frame_count = getattr(im, "n_frames", 1)
        max_colors = max(32, min(rule.max_colors or 96, 128))
        color_candidates = unique_ints([max_colors, 96, 80, 64])
        step_candidates = [1]
        if frame_count >= 90:
            step_candidates.append(2)
        if frame_count >= 180:
            step_candidates.append(3)

        best: bytes | None = None
        for step in step_candidates:
            for colors in color_candidates:
                candidate = encode_gif_candidate(im, gif_rule, step, colors)
                if candidate is None:
                    continue
                if best is None or len(candidate) < len(best):
                    best = candidate

        return best


def main() -> None:
    repo_root = Path(__file__).resolve().parents[3]
    mobile_root = repo_root / "apps" / "mobile"
    app_root = mobile_root / "app"
    lib_root = mobile_root / "lib"
    app_json = mobile_root / "app.json"

    referenced: set[Path] = set()

    for source_root in (app_root, lib_root):
        for file_path in iter_files(source_root, SOURCE_EXTENSIONS):
            for ref in parse_require_assets(file_path):
                abs_path = (file_path.parent / ref).resolve()
                if abs_path.suffix.lower() in IMAGE_EXTENSIONS and abs_path.exists():
                    referenced.add(abs_path)

    if app_json.exists():
        data = json.loads(app_json.read_text(encoding="utf-8"))
        expo = data.get("expo", {})
        app_json_refs = [
            expo.get("icon"),
            (expo.get("splash") or {}).get("image"),
            (expo.get("ios") or {}).get("icon"),
            ((expo.get("android") or {}).get("adaptiveIcon") or {}).get("foregroundImage"),
            ((expo.get("android") or {}).get("adaptiveIcon") or {}).get("monochromeImage"),
        ]
        for ref in app_json_refs:
            if not ref:
                continue
            abs_path = (mobile_root / ref).resolve()
            if abs_path.suffix.lower() in IMAGE_EXTENSIONS and abs_path.exists():
                referenced.add(abs_path)

    targets = sorted(referenced)
    before_total = sum(p.stat().st_size for p in targets)

    changed = 0
    bytes_saved = 0
    skipped = 0

    for path in targets:
        suffix = path.suffix.lower()

        if suffix == ".gif":
            rel_path = path.relative_to(repo_root).as_posix()
            rule = resolve_rule("/" + rel_path)
            original_bytes = path.read_bytes()
            original_size = len(original_bytes)

            if original_size < 150 * 1024:
                skipped += 1
                continue

            best = optimize_gif_bytes(path, rule)
            if best is None:
                skipped += 1
                continue

            if len(best) <= int(original_size * 0.96):
                path.write_bytes(best)
                changed += 1
                bytes_saved += max(0, original_size - len(best))
            else:
                skipped += 1
            continue

        if suffix not in {".png", ".jpg", ".jpeg"}:
            skipped += 1
            continue

        rel_path = path.relative_to(repo_root).as_posix()
        rule = resolve_rule("/" + rel_path)
        original_bytes = path.read_bytes()
        original_size = len(original_bytes)

        if original_size < 150 * 1024:
            skipped += 1
            continue

        with Image.open(path) as im:
            original_dims = im.size
            base = im.convert("RGBA")
            base = resize_if_needed(base, rule.max_long_edge)

        candidate = encode_png_bytes(base)
        best = candidate

        if rule.max_colors:
            quantized = encode_quantized_png_bytes(base, rule.max_colors)
            if len(quantized) < len(best):
                best = quantized

        # write only if meaningful reduction or resized dimension changed.
        reduced_enough = len(best) <= int(original_size * 0.96)
        resized = base.size != original_dims
        if reduced_enough or resized:
            path.write_bytes(best)
            changed += 1
            bytes_saved += max(0, original_size - len(best))

    after_total = sum(p.stat().st_size for p in targets)

    print(f"[optimize-assets] referenced files: {len(targets)}")
    print(f"[optimize-assets] changed files: {changed}, skipped: {skipped}")
    print(f"[optimize-assets] before: {before_total / 1024 / 1024:.2f} MB")
    print(f"[optimize-assets] after : {after_total / 1024 / 1024:.2f} MB")
    print(f"[optimize-assets] saved : {bytes_saved / 1024 / 1024:.2f} MB")


if __name__ == "__main__":
    main()
