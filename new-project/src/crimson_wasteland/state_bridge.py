from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable

from .models import PlayerCharacter


class LiveStateBridge:
    """Write runtime game state so the UI shell can poll it."""

    def __init__(
        self,
        root_dir: Path,
        output_fn: Callable[[str], None] | None = None,
    ) -> None:
        self.root_dir = root_dir
        self.output_fn = output_fn
        self.state_file = root_dir / "ui" / "state" / "live_state.json"
        self._warned = False

    def publish(
        self,
        player: PlayerCharacter,
        *,
        day: int | None = None,
        ap: int | None = None,
        max_ap: int | None = None,
        balance_profile_key: str | None = None,
        balance_profile_label: str | None = None,
        phase: str = "runtime",
        note: str | None = None,
    ) -> None:
        payload = {
            "meta": {
                "schema": "crimson_wasteland_live_state_v1",
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "phase": phase,
                "day": day,
                "ap": ap,
                "max_ap": max_ap,
                "balance_profile_key": balance_profile_key,
                "balance_profile_label": balance_profile_label,
            },
            "player": player.as_dict(),
        }
        if note:
            payload["meta"]["note"] = note

        try:
            self.state_file.parent.mkdir(parents=True, exist_ok=True)
            tmp_path = self.state_file.with_suffix(".tmp")
            tmp_path.write_text(
                json.dumps(payload, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
            tmp_path.replace(self.state_file)
            self._warned = False
        except Exception as exc:
            if self.output_fn and not self._warned:
                self.output_fn(f"[LiveStateBridge] 상태 파일 업데이트 실패: {exc}")
            self._warned = True
