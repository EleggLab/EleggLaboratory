from __future__ import annotations

import json
import queue
import threading
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlparse

from .game import Game


def _utc_iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass(frozen=True)
class SubmitResult:
    accepted: bool
    reason: str | None = None

    def as_dict(self) -> dict[str, Any]:
        return {
            "accepted": self.accepted,
            "reason": self.reason,
        }


class WebGameSession:
    def __init__(self, project_root: Path, session_id: str) -> None:
        self.project_root = project_root
        self.session_id = session_id
        self.created_at = _utc_iso_now()
        self._lock = threading.Lock()
        self._input_queue: queue.Queue[str | None] = queue.Queue()
        self._lines: list[str] = []
        self._waiting_prompt: str | None = None
        self._finished = False
        self._return_code: int | None = None
        self._error: str | None = None
        self._thread = threading.Thread(target=self._run_game, daemon=True)
        self._thread.start()

    def _emit(self, text: str) -> None:
        with self._lock:
            self._lines.append(text)

    def _read_input(self, prompt: str) -> str:
        self._emit(prompt)
        with self._lock:
            self._waiting_prompt = prompt
        value = self._input_queue.get()
        with self._lock:
            self._waiting_prompt = None
        if value is None:
            raise EOFError
        return value

    def _run_game(self) -> None:
        try:
            game = Game(
                project_root=self.project_root,
                input_fn=self._read_input,
                output_fn=self._emit,
            )
            return_code = game.run()
        except Exception as exc:  # pragma: no cover
            self._emit(f"[SYSTEM] Fatal error: {exc}")
            return_code = 1
            with self._lock:
                self._error = f"{type(exc).__name__}: {exc}"
        finally:
            with self._lock:
                self._finished = True
                self._return_code = return_code
                self._waiting_prompt = None

    def submit_input(self, text: str) -> SubmitResult:
        with self._lock:
            if self._finished:
                return SubmitResult(accepted=False, reason="session_finished")
            if self._waiting_prompt is None:
                return SubmitResult(accepted=False, reason="not_waiting_for_input")
            self._lines.append(f"> {text}")
        self._input_queue.put(text)
        return SubmitResult(accepted=True)

    def stop(self) -> None:
        self._input_queue.put(None)
        self._thread.join(timeout=2)

    def poll(self, offset: int) -> dict[str, Any]:
        with self._lock:
            safe_offset = max(0, min(offset, len(self._lines)))
            lines = self._lines[safe_offset:]
            return {
                "session_id": self.session_id,
                "created_at": self.created_at,
                "lines": lines,
                "next_offset": len(self._lines),
                "waiting_prompt": self._waiting_prompt,
                "finished": self._finished,
                "return_code": self._return_code,
                "error": self._error,
            }

    @property
    def finished(self) -> bool:
        with self._lock:
            return self._finished


class SessionRegistry:
    def __init__(self, project_root: Path, max_sessions: int = 20) -> None:
        self.project_root = project_root
        self.max_sessions = max_sessions
        self._sessions: dict[str, WebGameSession] = {}
        self._lock = threading.Lock()

    def create(self) -> WebGameSession:
        with self._lock:
            self._prune_locked()
            session_id = uuid.uuid4().hex
            session = WebGameSession(project_root=self.project_root, session_id=session_id)
            self._sessions[session_id] = session
            return session

    def get(self, session_id: str) -> WebGameSession | None:
        with self._lock:
            return self._sessions.get(session_id)

    def stop(self, session_id: str) -> bool:
        with self._lock:
            session = self._sessions.get(session_id)
        if not session:
            return False
        session.stop()
        return True

    def stop_all(self) -> None:
        with self._lock:
            sessions = list(self._sessions.values())
        for session in sessions:
            session.stop()

    def _prune_locked(self) -> None:
        if len(self._sessions) < self.max_sessions:
            return
        finished = [session_id for session_id, session in self._sessions.items() if session.finished]
        for session_id in finished:
            self._sessions.pop(session_id, None)
            if len(self._sessions) < self.max_sessions:
                return


class WebPlayRequestHandler(SimpleHTTPRequestHandler):
    registry: SessionRegistry
    project_root: Path

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, directory=str(self.project_root), **kwargs)

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/":
            self.path = "/ui/play.html"
            return super().do_GET()

        if parsed.path.startswith("/api/session/") and parsed.path.endswith("/poll"):
            self._handle_poll(parsed.path, parse_qs(parsed.query))
            return

        super().do_GET()

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/session":
            self._handle_create_session()
            return
        if parsed.path.startswith("/api/session/") and parsed.path.endswith("/input"):
            self._handle_submit_input(parsed.path)
            return
        if parsed.path.startswith("/api/session/") and parsed.path.endswith("/stop"):
            self._handle_stop(parsed.path)
            return
        self._send_json(HTTPStatus.NOT_FOUND, {"error": "not_found"})

    def log_message(self, format: str, *args: Any) -> None:  # noqa: A003
        return

    def _handle_create_session(self) -> None:
        session = self.registry.create()
        self._send_json(
            HTTPStatus.CREATED,
            {
                "session_id": session.session_id,
                "created_at": session.created_at,
            },
        )

    def _handle_submit_input(self, path: str) -> None:
        parts = path.strip("/").split("/")
        if len(parts) != 4:
            self._send_json(HTTPStatus.NOT_FOUND, {"error": "not_found"})
            return
        session_id = parts[2]
        session = self.registry.get(session_id)
        if not session:
            self._send_json(HTTPStatus.NOT_FOUND, {"error": "session_not_found"})
            return

        payload = self._read_json_body()
        if payload is None:
            return
        text = payload.get("text", "")
        if not isinstance(text, str):
            text = str(text)
        result = session.submit_input(text)
        status = HTTPStatus.OK if result.accepted else HTTPStatus.CONFLICT
        self._send_json(status, result.as_dict())

    def _handle_stop(self, path: str) -> None:
        parts = path.strip("/").split("/")
        if len(parts) != 4:
            self._send_json(HTTPStatus.NOT_FOUND, {"error": "not_found"})
            return
        session_id = parts[2]
        stopped = self.registry.stop(session_id)
        if not stopped:
            self._send_json(HTTPStatus.NOT_FOUND, {"error": "session_not_found"})
            return
        self._send_json(HTTPStatus.OK, {"stopped": True})

    def _handle_poll(self, path: str, query: dict[str, list[str]]) -> None:
        parts = path.strip("/").split("/")
        if len(parts) != 4:
            self._send_json(HTTPStatus.NOT_FOUND, {"error": "not_found"})
            return
        session_id = parts[2]
        session = self.registry.get(session_id)
        if not session:
            self._send_json(HTTPStatus.NOT_FOUND, {"error": "session_not_found"})
            return

        raw_offset = query.get("offset", ["0"])[0]
        try:
            offset = int(raw_offset)
        except ValueError:
            offset = 0
        self._send_json(HTTPStatus.OK, session.poll(offset))

    def _read_json_body(self) -> dict[str, Any] | None:
        raw_length = self.headers.get("Content-Length")
        if not raw_length:
            return {}
        try:
            content_length = int(raw_length)
        except ValueError:
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": "invalid_content_length"})
            return None
        body = self.rfile.read(content_length)
        if not body:
            return {}
        try:
            payload = json.loads(body.decode("utf-8"))
        except json.JSONDecodeError:
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": "invalid_json"})
            return None
        if not isinstance(payload, dict):
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": "json_object_required"})
            return None
        return payload

    def _send_json(self, status: HTTPStatus, payload: dict[str, Any]) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status.value)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def run_web_play_server(
    project_root: Path,
    host: str = "127.0.0.1",
    port: int = 8090,
) -> None:
    WebPlayRequestHandler.project_root = project_root
    WebPlayRequestHandler.registry = SessionRegistry(project_root=project_root)
    server = ThreadingHTTPServer((host, port), WebPlayRequestHandler)
    print(f"[WEB] Crimson Wasteland web server: http://{host}:{port}/")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        WebPlayRequestHandler.registry.stop_all()
        server.server_close()
