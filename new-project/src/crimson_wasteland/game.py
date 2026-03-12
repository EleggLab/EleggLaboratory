from __future__ import annotations

from pathlib import Path
from typing import Callable

from .character_creation import (
    all_creation_scenes,
    apply_betrayal_bonus,
    apply_effect,
    assign_starting_loadout,
    format_character_sheet,
    get_option,
)
from .gameplay import SurvivalLoop
from .models import PlayerCharacter
from .persistence import save_character
from .state_bridge import LiveStateBridge


class Game:
    def __init__(
        self,
        project_root: Path,
        input_fn: Callable[[str], str] = input,
        output_fn: Callable[[str], None] = print,
        live_state_bridge: LiveStateBridge | None = None,
    ) -> None:
        self.project_root = project_root
        self.input_fn = input_fn
        self.output_fn = output_fn
        self.live_state_bridge = live_state_bridge or LiveStateBridge(
            root_dir=project_root,
            output_fn=output_fn,
        )

    def run(self) -> int:
        self.output_fn("=== Project: Crimson Wasteland ===")
        self.output_fn("텍스트 기반 프로토타입 - 오프닝 및 캐릭터 생성")

        player = PlayerCharacter()
        try:
            self._publish_live_state(player, phase="creation_started")
            scenes = all_creation_scenes()

            for scene in scenes:
                self._render_scene(scene.title, scene.prompt)
                selected_key = self._ask_choice(scene)
                player.set_creation_choice(scene.scene_id, selected_key)
                selected_option = get_option(scene, selected_key)
                apply_effect(player, selected_option.effect)

                if scene.scene_id == "opening_caravan" and selected_key == "3":
                    bonus_key = self._ask_betrayal_bonus()
                    apply_betrayal_bonus(player, bonus_key)
                self._publish_live_state(
                    player,
                    phase="creation_scene_complete",
                    note=scene.scene_id,
                )

            assigned_items = assign_starting_loadout(player)
            self._build_player_identity(player)
            self._show_loadout_summary(assigned_items)
            self.output_fn(format_character_sheet(player))
            self._publish_live_state(player, phase="creation_completed")
            loop = SurvivalLoop(
                player=player,
                input_fn=self.input_fn,
                output_fn=self.output_fn,
                live_state_bridge=self.live_state_bridge,
            )
            loop.run()
            self._publish_live_state(player, phase="survival_loop_finished")
            self._maybe_save(player)
            self.output_fn("프로토타입 흐름이 종료되었습니다.")
            return 0
        except (EOFError, KeyboardInterrupt):
            return self._handle_interrupted_session(player)

    def _build_player_identity(self, player: PlayerCharacter) -> None:
        self.output_fn("")
        self.output_fn("[캐릭터 정체성 설정]")
        self.output_fn("기억의 편린이 끝나자, 당신은 자기 자신을 정의하기 시작한다.")
        player.name = self._ask_text("이름")
        player.gender = self._ask_text("성별(자유 입력)")
        player.appearance = self._ask_appearance()

    def _ask_appearance(self) -> str:
        self.output_fn("")
        self.output_fn("[외형 텍스트 묘사 선택]")
        presets = {
            "1": "바람에 깎인 흉터가 선명한 황무지 생존자",
            "2": "경계심 어린 눈빛의 마른 방랑자",
            "3": "군용 장비 자국이 남은 냉정한 이방인",
            "4": "직접 입력",
        }
        for key, text in presets.items():
            self.output_fn(f"{key}. {text}")

        valid = {"1", "2", "3", "4"}
        while True:
            choice = self._read_choice_input("선택 번호 입력 > ", valid)
            if choice in {"1", "2", "3"}:
                return presets[choice]
            if choice == "4":
                return self._ask_text("외형 한 줄 설명")
            self.output_fn("유효한 선택지를 입력하세요: 1, 2, 3, 4")

    def _show_loadout_summary(self, assigned_items: tuple[str, ...]) -> None:
        self.output_fn("")
        self.output_fn("[시작 장비 결정]")
        if not assigned_items:
            self.output_fn("장비가 할당되지 않았습니다.")
            return
        self.output_fn("당신의 선택에 따라 아래 장비가 지급되었습니다.")
        for item in assigned_items:
            self.output_fn(f"- {item}")

    def _render_scene(self, title: str, prompt: str) -> None:
        self.output_fn("")
        self.output_fn(f"[{title}]")
        self.output_fn(prompt)

    def _ask_choice(self, scene) -> str:
        for option in scene.options:
            self.output_fn(f"{option.key}. {option.text}")

        valid = {option.key for option in scene.options}
        while True:
            raw = self._read_choice_input("선택 번호 입력 > ", valid)
            if raw in valid:
                return raw
            self.output_fn(f"유효한 선택지를 입력하세요: {', '.join(sorted(valid))}")

    def _ask_betrayal_bonus(self) -> str:
        self.output_fn("")
        self.output_fn("밀고 선택 보너스 스탯을 고르세요.")
        self.output_fn("1. 매력 +1")
        self.output_fn("2. 지능 +1")
        valid = {"1", "2"}
        while True:
            raw = self._read_choice_input("선택 번호 입력 > ", valid)
            if raw in valid:
                return raw
            self.output_fn("유효한 선택지를 입력하세요: 1, 2")

    def _ask_text(self, label: str) -> str:
        while True:
            value = self._read_input(f"{label}: ")
            if value:
                return value
            self.output_fn("빈 값은 허용되지 않습니다.")

    def _maybe_save(self, player: PlayerCharacter) -> None:
        raw = self._read_input("캐릭터 시트를 저장할까요? (y/n) > ").lower()
        if raw not in {"y", "yes", "ㅛ"}:
            self.output_fn("저장을 건너뜁니다.")
            self._publish_live_state(player, phase="session_finished", note="save_skipped")
            return
        save_path = save_character(player, self.project_root)
        self.output_fn(f"저장 완료: {save_path}")
        self._publish_live_state(
            player,
            phase="session_finished",
            note=f"save_completed:{save_path.name}",
        )

    def _publish_live_state(
        self,
        player: PlayerCharacter,
        *,
        phase: str,
        note: str | None = None,
    ) -> None:
        self.live_state_bridge.publish(player, phase=phase, note=note)

    def _handle_interrupted_session(self, player: PlayerCharacter) -> int:
        self.output_fn("")
        self.output_fn("입력이 중단되어 세션을 안전 종료합니다.")
        self._publish_live_state(player, phase="session_interrupted", note="input_interrupted")
        try:
            save_path = save_character(player, self.project_root)
            self.output_fn(f"긴급 저장 완료: {save_path}")
        except Exception as exc:
            self.output_fn(f"긴급 저장 실패: {exc}")
        return 0

    def _read_input(self, prompt: str) -> str:
        return self.input_fn(prompt).strip().lstrip("\ufeff")

    def _read_choice_input(self, prompt: str, valid: set[str]) -> str:
        raw = self._read_input(prompt)
        if raw in valid:
            return raw
        return raw
