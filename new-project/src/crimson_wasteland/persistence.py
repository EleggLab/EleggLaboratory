from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

from .models import PlayerCharacter


def save_character(
    player: PlayerCharacter,
    root_dir: Path,
) -> Path:
    saves = root_dir / "saves"
    saves.mkdir(parents=True, exist_ok=True)

    safe_name = "".join(
        char.lower() if char.isalnum() else "_"
        for char in player.name.strip()
    ).strip("_")
    if not safe_name:
        safe_name = "unnamed"

    ts = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    file_path = saves / f"{safe_name}_{ts}.json"
    counter = 1
    while file_path.exists():
        file_path = saves / f"{safe_name}_{ts}_{counter}.json"
        counter += 1
    file_path.write_text(
        json.dumps(player.as_dict(), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return file_path
