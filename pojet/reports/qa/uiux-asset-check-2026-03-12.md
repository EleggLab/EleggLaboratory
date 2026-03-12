# UI/UX 에셋 점검 및 적용 보고서

작성일: 2026-03-12
범위: 마일스톤 진행 + 추가 UX/UI 에셋 검토 + 이미지 비율/깨짐 방지

## 0) 캡처 기반 확인
- 캡처 파일:
  - `pojet/reports/ui-capture/16-onboarding-desktop-texturepass.png`
  - `pojet/reports/ui-capture/17-onboarding-mobile-texturepass.png`
  - `pojet/reports/ui-capture/18-onboarding-mobile-texturepass-v2.png`
- 메모:
  - 현 환경에서 `playwright` 미설치 상태라 신규 인터랙션 캡처는 제한됨.
  - 대신 헤드리스 크롬으로 온보딩 화면을 재캡처하고, 기존 인터랙션 캡처(13~15)와 함께 교차 검증함.
  - 17번 캡처에서 모바일 생성 모달 하단 버튼 우측 잘림 확인.
  - 반응형 footer 수정 후 18번 캡처에서 잘림 해소 확인.

## 1) 에셋 후보 재점검 결과
- 점검 폴더:
  - `pojet/Asset/Clean RenPy GUI Kit_FShift`
  - `pojet/Asset/DatingGameUI`
  - `pojet/Asset/Layer Lab`
  - `pojet/Asset/kenney_*`
- 채택(런타임 적용):
  - `pojet/assets/ui/textures/noise-perlin.png`
  - `pojet/assets/ui/textures/gradient-radial.png`
- 미적용(보류/제외):
  - `DatingGameUI`, `Clean RenPy` 배경/버튼: 다크 판타지 톤과 충돌
  - `Layer Lab` 데모 UI/캐릭터: 모바일 캐주얼 스타일 비중이 높아 톤 불일치
  - 고대비 패턴(`pattern-diagonal`): 장시간 플레이 시 시각 피로 가능성으로 제거

## 2) 적용 변경 사항
- `pojet/styles.css`
  - 배경 텍스처 조합을 `noise + radial` 중심으로 재구성
  - 강한 대각선 패턴 제거
  - 배경은 `cover`/`no-repeat` 기반으로 왜곡 없이 노출되도록 유지
- `pojet/src/presentation/assetPortraitRenderer.js`
  - 이미지 로드 실패(`error`) 시 `src` 제거 + `hidden` 처리
  - 깨진 이미지 아이콘이 UI에 노출되지 않도록 안전장치 추가
  - 로딩 성공(`load`) 시에만 표시
- `pojet/data/presentation/character-asset-catalog.json`
  - 승인 에셋 목록을 현재 적용 자산과 일치하도록 정리

## 3) 이미지 무결성(깨짐/늘어짐) 검증
- CSS URL 존재성 점검:
  - `assets/ui/textures/gradient-radial.png`: 존재
  - `assets/ui/textures/noise-perlin.png`: 존재
- 비율 보존 규칙:
  - 인물 이미지: `object-fit: contain`
  - 장면 배경: `background-size: cover`
  - 전역 이미지: `img { max-width: 100%; height: auto; }`
- 로드 실패 처리:
  - portrait art `error` 이벤트에서 강제 숨김 처리 완료

## 4) QA/시뮬레이션 결과
- 자동 QA: `node runtime/tests/qaStressTest.js 140 50`
  - PASS (140/140, 실패 0)
- 플레이 로그 placeholder 검사(160 step 시뮬레이션):
  - `??`/`???`: 0건
  - `익명 인물`/`인물-숫자`: 0건
  - `N번째 이벤트`: 0건

## 5) 시각 검토 메모
- 기존 캡처(`reports/ui-capture/13~15`) 기준으로 레이아웃 붕괴/이미지 늘어짐은 미확인.
- 이번 수정은 텍스처 조합과 로드 실패 보호 로직 중심이라, 기능 리스크는 낮음.
- 모바일 생성 모달의 버튼 줄바꿈/폭 고정 이슈는 v2 반영으로 해결됨.
