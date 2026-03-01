# Mobile Suite (Android Multi-App Prep)

이 폴더는 여러 안드로이드 앱을 공통 에셋/구조로 운영하기 위한 기본 스켈레톤이다.

## 구조

- `apps/`
  - `app-one/`
  - `app-two/`
  - `app-three/`
- `common/`
  - `art-assets/`  ← 공용 아트에셋 업로드 위치
  - `icons/`
  - `fonts/`
  - `illustrations/`
  - `lottie/`
  - `sounds/`
- `docs/`
- `scripts/`

## 다음 단계

1. `common/art-assets/`에 원본 아트에셋 업로드
2. 앱별 브랜딩 분기 필요 시 `apps/<app-name>/branding/` 추가
3. 원하면 다음 작업으로 Gradle 멀티모듈/Flavor 기반 템플릿까지 생성 가능
