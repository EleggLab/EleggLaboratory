# Project: Crimson Wasteland (Prototype)

`game_design_document.md` 기반 1차 CLI 프로토타입입니다.

현재 구현 범위:
- 오프닝 시나리오(캐러밴 선택)
- 기억 편린 3단계 캐릭터 생성
- S.P.E.C.I.A.L / 생존 스탯 / 스킬 / 퍽 반영
- 선택 기반 시작 장비 자동 결정
- 외형 텍스트 묘사 선택
- 생존 루프(탐험/AP/휴식/정화수 사용)
- 탐험 중 랜덤 이벤트(자원 발견/적 조우)
- 간단 전투 및 전리품 획득(공격/도주/방어 태세, 명중/회피/치명타, 출혈 상태이상 1차)
- 인벤토리 확인/아이템 사용 메뉴
- 제작 시스템(붕대/정화수/간이 해독제)
- 세력 평판/소문 1차 시스템
- 정착지 상호작용(지원/거래/정보제공/의식참가)
- 평판 단계 효과 1차(세력 단계별 거래가/거래 차단/지원 효율 반영)
- 성장 루프 1차(XP/레벨/레벨업/퍼크 포인트)
- 성장 퍼크 3종(황무지 방랑자/전장 의무병/협상가)
- 칭호 평판(황무지의 성자/약탈왕/유령) 1차 반영
- NPC 관계 수치(신뢰/호감/공포/욕정/지배복종) 1차
- NPC 상호작용(보급 공유/위협/대화/유혹/지배 시도)
- 퀘스트 프레임워크 1차(퀘스트 로그/상태/완료 처리)
- 오아시스 퀘스트 수직 슬라이스(정화수 전달, 수호/갈취 분기, 보상/칭호 반영)
- V.E.R.I.T.A.S. 퀘스트 수직 슬라이스(중계기 재료 전달, 보호/유출 분기, 보상/칭호 반영)
- 메인 루프 퀘스트 바로가기(9번) + 헤더 목표 표시 + 첫날 동선 가이드
- 메뉴 네비게이션 단축(0: 최근 행동 반복, 0/back/q: 빠른 뒤로가기)
- 밸런스 프로필 3종(스토리/스탠다드/하드코어) 및 난이도별 수치 스케일링
- 캐릭터 시트 출력 및 JSON 저장
- 입력 중단(EOF/CTRL+C) 안전 종료 + 긴급 저장
- 정적 UI 셸(`ui/`) 제공: 저장 JSON 시각화 + 임시 SVG 아트 에셋 반영
- 라이브 상태 브리지(`ui/state/live_state.json`): CLI 진행 상태를 UI에서 실시간 폴링 가능

## Run

```bash
python main.py
```

## Web Play (HTML)

PowerShell 입력 없이 브라우저에서 플레이하려면:

```bash
python web_play.py
```

- 기본 주소: `http://127.0.0.1:8090/`
- 직접 페이지: `http://127.0.0.1:8090/ui/play.html`
- 기존 상태 대시보드: `http://127.0.0.1:8090/ui/index.html`

선택 입력은 텍스트 박스에 숫자/문자(`1`, `8`, `y`, `n`, `back`, `q`)를 넣거나
퀵 버튼으로 전송할 수 있습니다.

## Test

```bash
python -m unittest discover -s tests -p "test_*.py"
```

## UI Preview

```bash
python -m http.server 8080
```

- `http://localhost:8080/ui/index.html`
- UI에서 `라이브 동기화 시작` 클릭 시, 실행 중 게임 상태를 자동 반영

## Text Catalog Build

출력 텍스트 카탈로그(JSON 100+ 카테고리)를 재생성하려면:

```bash
python tools/build_text_catalog.py
```

- 생성 위치: `content/text_catalog/*.json`
- 인덱스: `content/text_catalog/index.json`
- 글자수 리포트: `docs/text_catalog_charcount_report_2026-03-12.md`

## Structure

- `game_design_document.md`: 원본 기획서
- `main.py`: 실행 엔트리포인트
- `src/crimson_wasteland/`: 게임 로직 패키지
- `tests/`: 단위 테스트
- `content/text_catalog/`: 카테고리별 출력 텍스트 JSON
- `assets/temp/`: 임시 플레이스홀더 이미지(SVG)
- `saves/`: 실행 시 생성되는 캐릭터 저장 폴더
