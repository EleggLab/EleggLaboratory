from __future__ import annotations

import argparse
import functools
import os
import socket
import subprocess
import threading
import time
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import shutil


BASE_DIR = Path(__file__).resolve().parent
WEB_DIR = BASE_DIR.parent / "pc-choice-ugc"
DIST_DIR = WEB_DIR / "dist"
LOCAL_DIST_DIR = BASE_DIR / "web_dist"


def find_free_port(start: int = 5210, end: int = 5299) -> int:
    for port in range(start, end + 1):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(("127.0.0.1", port))
                return port
            except OSError:
                continue
    raise RuntimeError("No free port found for local UGC server.")


def run_cmd(cmd: list[str], cwd: Path):
    proc = subprocess.run(cmd, cwd=str(cwd), shell=False)
    if proc.returncode != 0:
        raise RuntimeError(f"Command failed ({proc.returncode}): {' '.join(cmd)}")


def ensure_dist(rebuild: bool) -> Path:
    if LOCAL_DIST_DIR.exists() and not rebuild:
        return LOCAL_DIST_DIR

    if not WEB_DIR.exists():
        if LOCAL_DIST_DIR.exists():
            return LOCAL_DIST_DIR
        raise RuntimeError(f"Missing web project folder: {WEB_DIR}")

    if not DIST_DIR.exists() or rebuild:
        print("[UGC] Building pc-choice-ugc...")
        npm_bin = "npm.cmd" if os.name == "nt" else "npm"
        run_cmd([npm_bin, "run", "build"], WEB_DIR)
        if not DIST_DIR.exists():
            raise RuntimeError("Build finished but dist folder was not created.")

    if LOCAL_DIST_DIR.exists():
        shutil.rmtree(LOCAL_DIST_DIR)
    shutil.copytree(DIST_DIR, LOCAL_DIST_DIR)
    return LOCAL_DIST_DIR


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):  # noqa: A003
        return

    def end_headers(self):
        # Prevent stale cached bundles when rebuilding frequently during playtest.
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


def start_static_server(port: int, directory: Path):
    handler = functools.partial(QuietHandler, directory=str(directory))
    server = ThreadingHTTPServer(("127.0.0.1", port), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server


def try_launch_webview(url: str) -> bool:
    try:
        import webview  # type: ignore
    except Exception:
        return False

    webview.create_window("Steam UGC Studio", url, width=1600, height=950, min_size=(1280, 720))
    webview.start()
    return True


def main():
    parser = argparse.ArgumentParser(description="Launch full pc-choice-ugc from Python runtime.")
    parser.add_argument("--rebuild", action="store_true", help="Force npm build before launching")
    parser.add_argument("--no-webview", action="store_true", help="Always open external browser")
    args = parser.parse_args()

    try:
        dist_dir = ensure_dist(rebuild=args.rebuild)
    except Exception as exc:
        print(f"[UGC] Build/setup failed: {exc}")
        return 1

    port = find_free_port()
    server = start_static_server(port, dist_dir)
    url = f"http://127.0.0.1:{port}/"
    print(f"[UGC] Serving: {url}")

    try:
        time.sleep(0.2)
        if not args.no_webview and try_launch_webview(url):
            return 0

        webbrowser.open(url)
        print("[UGC] Press Ctrl+C to stop server.")
        while True:
            time.sleep(1.0)
    except KeyboardInterrupt:
        print("\n[UGC] Shutdown requested.")
    finally:
        server.shutdown()
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
