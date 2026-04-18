# 사주 앱 프로젝트 인수인계 문서

## 1. 프로젝트 한줄 요약

이 프로젝트는 `사주 + 타로 + 주역 + 데일리 운세`를 한 앱에 묶은 모바일 우선 프로젝트입니다.  
핵심 방향은 `앱 우선`, `공유 계산 엔진`, `AI 없이도 재현 가능한 해석`입니다.

## 2. 현재 상태 요약

- 프로젝트명: `Saju Companion`
- 앱 슬러그: `saju-companion`
- 안드로이드 패키지: `com.rndhr.sajucompanion`
- 현재 단계: `production-candidate`
- 구조: `pnpm` 모노레포
- 메인 제품: Expo/React Native 모바일 앱
- 보조 제품: Next.js 기반 웹 테스트/검증용 앱

## 3. 이 앱이 하는 일

- 사주 입력 후 사주 원국 계산
- 결과표 + 자연어 리포트 + 분야별 Q&A 제공
- 특정 해 운세 / 월 운세 확인
- 타로 셔플 / 선택 / 결과 보기
- 주역점 MVP
- 별자리 / 12지신 기반 데일리 운세 페이지

## 4. 기술 구조

### 앱/패키지 구성

- `apps/mobile`
  - Expo Router 기반 모바일 앱
  - 실제 주력 UX는 여기입니다
- `apps/web`
  - Next.js 기반 웹 테스트 UI
  - 계산 엔진 검증과 빠른 확인용입니다
- `packages/core`
  - 사주 계산, 운세 계산, 해석 생성의 핵심 로직
- `packages/data`
  - 규칙 JSON, Q&A 템플릿, 데이터 테이블
- `packages/ui`
  - 공용 UI 구성 요소
- `packages/tools`
  - QA, 자산 검사, 리서치 수집, 교차 검증 스크립트

### 계산/해석 정책

- 기본 계산 규칙
  - `yearPillarRule = ipchun`
  - `monthPillarRule = solarTerms`
  - `jaSiBoundaryRule = 23-01_nextDay`
  - `timezone = Asia/Seoul`
- 해석은 AI 호출 없이 결정적 규칙/템플릿 기반으로 생성됩니다
- 모바일이 메인이고, 웹은 검증과 내부 테스트 성격이 강합니다

## 5. 주요 화면

- `home`
  - 홈 진입 화면, 주요 기능 진입 허브
- `saju`
  - 사주 입력, 결과표, 자연어 해석, Q&A, 연/월 운세
- `tarot`
  - 셔플, 선택, 결과 확인
- `iching`
  - 시간 탭 기반 주역점 MVP
- `today`
  - 별자리/12지신 일일 운세

## 6. 웹/API 쪽 포인트

웹에는 아래 라우트 핸들러가 있어 계산 검증에 쓰기 좋습니다.

- `/api/saju`
- `/api/year-luck`
- `/api/month-luck`
- `/api/compare`

## 7. 실행 방법

### 설치

```bash
corepack pnpm install
```

### 모바일 실행

```bash
corepack pnpm dev:mobile
```

또는

```bash
run-mobile-8082.cmd
```

### 웹 실행

```bash
corepack pnpm dev:web
```

또는

```bash
run-web-3100.cmd
```

### 기본 검증

```bash
corepack pnpm qa:regression
corepack pnpm test
corepack pnpm typecheck
corepack pnpm build
```

### 릴리즈 전 묶음 검증

```bash
corepack pnpm release:check
```

## 8. 포함된 리소스

이 압축본에는 프로젝트 내부에서 실제 참조하는 모바일 리소스가 포함되어 있습니다.

- `apps/mobile/assets/backgrounds`
  - 7개 파일, 약 32.61MB
- `apps/mobile/assets/icons`
  - 24개 파일, 약 2.82MB
- `apps/mobile/assets/tarot`
  - 25개 파일, 약 2.29MB
- `apps/mobile/assets/zodiac`
  - 24개 파일, 약 1.81MB
- 루트 앱 리소스
  - `app-icon.png`
  - `splash-icon.png`
  - `adaptive-foreground.png`

리소스 성격:

- 배경 이미지/GIF
- 타로 메이저 카드 이미지
- 서양 별자리 아이콘
- 12지신 아이콘
- 앱 아이콘/스플래시 아이콘

## 9. 현재 검증 상태

### QA

- `docs/QA_REPORT.md` 기준 PASS
- 기준 일시: 2026-02-22
- 10회 반복 기준으로 다음 검증 통과
  - 사주 핵심 계산 반복 안정성
  - 연/월 운세 변화 반영
  - `/api/saju`, `/api/year-luck`, `/api/month-luck`, `/api/compare`
  - 타로 셔플/스프레드/일일 저장
  - Q&A 연/월 variation

### 자산

- `docs/ASSET_AUDIT.md` 기준
  - 참조 이미지 78개
  - 참조 총량 약 10.57MB
  - 전체 이미지 81개
  - 전체 총량 약 39.68MB
- 현재 참조 자산 예산은 큰 문제 없이 관리되는 상태입니다

## 10. 이 압축본에서 제외한 파일

아래 파일은 보안 또는 로컬 개발환경 종속 문제 때문에 제외했습니다.

- `apps/web/.env.local`
- `apps/mobile/android/upload-keystore.jks`
- `apps/mobile/android/app/debug.keystore`
- `apps/mobile/android/keystore.properties`
- `apps/mobile/android/local.properties`
- `apps/web/tsconfig.tsbuildinfo`

즉, 소스와 리소스는 포함되어 있지만 아래는 직접 다시 준비해야 합니다.

- 웹 비밀키/환경변수
- 안드로이드 릴리즈 서명키
- 로컬 Android SDK 경로 설정

## 11. 남은 개발 / 우선순위

### A. 다른 개발자가 먼저 보면 좋은 핵심 작업

- 실제 안드로이드 기기에서 15분 이상 실사용 점검
- 자정 경계 기준 데일리 운세 동작 재검증
- 스토어 등록용 스크린샷 최종 캡처
- 개인정보처리방침 URL / 고객문의 URL 준비

### B. 계산 정확도 쪽 우선 개선

- KASI/data.go.kr 기반 교차검증 강화
- 자시(23:00~01:00) 경계 규칙 옵션 확장 및 검증
- 음력 입력/윤달/절기 경계 테스트 벡터 추가
- 로컬 태양시 보정 정확도 개선
- 월운 계산 앵커 로직 고도화

### C. 해석/Q&A 개선

- 분야별 Q&A 개인화 입력 확장
- 근거 문장/출처 노출 강화
- Q&A 템플릿 버전 관리 강화
- 문화권/관점 차이에 따른 표현 예외처리 보강

### D. UX 개선

- 모바일 상세 결과를 더 짧게 요약해서 보여주는 카드 강화
- 기본 추천 옵션 프리셋 제공
- 설정 변경 전/후 결과 차이 비교 UX 추가

## 12. 릴리즈 직전 체크리스트

`docs/RELEASE_TODO.md` 기준으로 아직 사람이 직접 확인해야 하는 항목이 있습니다.

- Android 실기기 테스트
- KST 00:00 전후 일일 운세 동작 점검
- 스토어 스크린샷 정리
- 개인정보처리방침/문의 URL 연결

## 13. 기존 문서 중 꼭 볼 것

- `README.md`
  - 빠른 실행 안내
- `docs/DECISIONS.md`
  - 현재 계산 규칙과 제품 방향
- `docs/QA_REPORT.md`
  - 자동 검증 결과
- `docs/ASSET_AUDIT.md`
  - 리소스 용량 현황
- `docs/RELEASE_TODO.md`
  - 출시 전 필수 체크
- `SELF-CRITIQUE.md`
  - 아직 남아있는 리스크와 개선 방향
- `SOURCES.md`
  - 리서치 근거와 채택 이유

## 14. 인수인계 추천 순서

1. `README.md`로 실행
2. `docs/DECISIONS.md`로 계산 기본값 이해
3. `apps/mobile` 기준으로 실제 앱 흐름 확인
4. `docs/QA_REPORT.md`와 `docs/RELEASE_TODO.md` 확인
5. `SELF-CRITIQUE.md` 기준으로 정확도/고도화 작업 이어받기

## 15. 요약

이 프로젝트는 완전 초기 단계가 아니라, 이미 모바일 중심 MVP 이상 상태까지 올라와 있습니다.  
즉시 이어받아 개발 가능한 수준이며, 남은 일은 크게 두 갈래입니다.

- 출시 직전 운영/검수 마무리
- 계산 정확도와 해석 품질 고도화
