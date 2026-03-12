# Implementation Notes

## Source Mapping

- GDD 3.1.1 (S.P.E.C.I.A.L): `src/crimson_wasteland/models.py::CoreStats`
- GDD 3.1.2 (생존 스탯): `src/crimson_wasteland/models.py::SurvivalStats`
- GDD 3.1.3~3.1.5 (변이/퍽 일부): `src/crimson_wasteland/character_creation.py`
- GDD 13.1~13.2 (오프닝/캐릭터 생성): `src/crimson_wasteland/game.py`
- 생존 루프/전투/제작/정착지: `src/crimson_wasteland/gameplay.py`
- 저장/라이브 상태 브리지: `src/crimson_wasteland/persistence.py`, `src/crimson_wasteland/state_bridge.py`
- UI 셸/실시간 폴링: `ui/index.html`, `ui/app.js`

## Current Constraints

- 지역 지속성(헥스맵/씬 상태 저장)과 다지역 메인 체인은 아직 미구현
- UI는 상태 조회 중심이며 게임 입력을 직접 처리하는 양방향 UI는 미구현
- 저장은 캐릭터/세션 상태 JSON 중심으로, 월드 시드/이벤트 로그 리플레이는 미지원
