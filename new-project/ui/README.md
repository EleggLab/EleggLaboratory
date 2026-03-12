# UI Shell

게임 저장 JSON을 시각적으로 확인하는 정적 UI 프로토타입입니다.
CLI 실행 중에는 `ui/state/live_state.json`을 폴링해 실시간 상태를 반영할 수 있습니다.

## Run

프로젝트 루트에서:

```bash
python -m http.server 8080
```

브라우저에서:

- `http://localhost:8080/ui/index.html`

별도 터미널에서 게임 실행:

```bash
python main.py
```

UI에서 `라이브 동기화 시작` 버튼을 누르면 `ui/state/live_state.json`을 주기적으로 읽어
현재 캐릭터 상태를 자동 반영합니다.

## Features

- 임시 SVG 아트 에셋(배경/포트레이트/아이콘) 직접 사용
- 저장 파일(`saves/*.json`) 업로드 후 상태 반영
- 세력 평판 단계 시각화(막대 + 단계 텍스트)
- 퀘스트/인벤토리/소문 패널 구성
- 모바일 반응형 레이아웃
- 라이브 동기화 모드(실행 중 상태 자동 폴링)

## Play In Browser

CLI 콘솔 입력 대신 HTML 플레이 화면을 사용하려면:

```bash
python web_play.py
```

접속:

- `http://127.0.0.1:8090/` (기본 진입)
- `http://127.0.0.1:8090/ui/play.html` (직접 진입)
