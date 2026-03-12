from __future__ import annotations

import argparse
from pathlib import Path
import sys


def _bootstrap_path() -> None:
    root = Path(__file__).resolve().parent
    src = root / "src"
    if str(src) not in sys.path:
        sys.path.insert(0, str(src))


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the Crimson Wasteland web play server.")
    parser.add_argument("--host", default="127.0.0.1", help="Host interface (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=8090, help="Port number (default: 8090)")
    return parser.parse_args()


def main() -> int:
    _bootstrap_path()
    args = _parse_args()
    from crimson_wasteland.web_runtime import run_web_play_server

    project_root = Path(__file__).resolve().parent
    run_web_play_server(project_root=project_root, host=args.host, port=args.port)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
