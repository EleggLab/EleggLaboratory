from __future__ import annotations

import base64
import io
import json
import pathlib
import sys
import zipfile


def extract_image(response_path: pathlib.Path, output_path: pathlib.Path) -> None:
    data = response_path.read_bytes()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    if data[:2] == b"PK":
        with zipfile.ZipFile(io.BytesIO(data)) as archive:
            for name in archive.namelist():
                if name.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
                    with archive.open(name) as handle:
                        output_path.write_bytes(handle.read())
                    return
        raise RuntimeError("ZIP response did not contain an image file.")

    if data.startswith(b"\x89PNG") or data.startswith(b"\xff\xd8"):
        output_path.write_bytes(data)
        return

    payload = json.loads(data.decode("utf-8"))
    if isinstance(payload, dict):
        if isinstance(payload.get("image"), str):
            output_path.write_bytes(base64.b64decode(payload["image"]))
            return
        if isinstance(payload.get("images"), list) and payload["images"]:
            if isinstance(payload["images"][0], str):
                output_path.write_bytes(base64.b64decode(payload["images"][0]))
                return

    raise RuntimeError("Unsupported response payload.")


def main(argv: list[str]) -> int:
    if len(argv) != 3:
        print("usage: extract_image_from_response.py <response_path> <output_path>", file=sys.stderr)
        return 2

    response_path = pathlib.Path(argv[1]).resolve()
    output_path = pathlib.Path(argv[2]).resolve()
    extract_image(response_path, output_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
