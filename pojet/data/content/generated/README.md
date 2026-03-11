# Generated Content Staging

## 목적
- 이 경로는 생성형 초안 데이터를 보관/검토하는 스테이징 영역이다.
- 런타임 로더(`src/config/contentLoader.js`)가 직접 읽는 경로가 아니다.

## 폴더 구조
- `raw-2026-03-12/`: 원본 생성 산출물(파일명 정규화만 적용)
- `normalized/`: 프로젝트 스키마로 변환한 후보 파일

## 적용 규칙
- `raw-*` 파일은 바로 `data/content/*.json`에 덮어쓰지 않는다.
- 적용 전 필수 검증:
  - JSON 파싱 성공
  - 필수 필드 충족(`id`, `tier`, `choices[].effects` 등)
  - 기존 ID 충돌/중복 확인
  - 밸런스 및 로그 길이 기준 충족
