# ASSET_USAGE_MAP_KO

## 적용 에셋

현재 `DatingGameUI`에서 가져온 파일을 Ren'Py UI에 적용했습니다.

- `gui/ugc/menu_background.png`
  - 언어 선택 화면, 기본 스토리 배경 fallback
- `gui/ugc/dialogue_container.png`
  - 대사 패널(하단 프레임)
- `gui/ugc/choice_button.png`
- `gui/ugc/choice_button_pressed.png`
  - 선택지 버튼 normal/hover
- `gui/ugc/primary_button.png`
- `gui/ugc/primary_button_pressed.png`
  - 기본 동작 버튼(다음/종료/언어 선택)

## fallback 정책

모든 파일은 아래 정책을 사용합니다.

1. 파일 존재: PNG 사용
2. 파일 없음: Solid 색상 UI로 자동 대체

즉, 에셋 누락 시에도 게임은 중단되지 않습니다.

## 확장 권장

추가로 아래 폴더를 쓰면 관리가 쉽습니다.

- `project/game/ugc/backgrounds/` : 시나리오 배경
- `project/game/ugc/portraits/` : 캐릭터 반신

노드의 `background` 필드는 `ugc/backgrounds/<filename>` 기준으로 로드됩니다.
