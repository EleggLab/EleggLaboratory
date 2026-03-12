from __future__ import annotations

from pathlib import Path

from .game import Game


def main() -> int:
    project_root = Path(__file__).resolve().parents[2]
    game = Game(project_root=project_root)
    return game.run()

