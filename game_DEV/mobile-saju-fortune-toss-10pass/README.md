# Saju Vibe Monorepo

사주 계산/해석 + 타로 + 주역 + 데일리 운세(별자리/12지신) 모바일 중심 프로젝트입니다.  
웹은 테스트/검증 용도이며, 실제 배포 타깃은 앱(Expo)입니다.

## 1) 실행
```bash
corepack pnpm install
corepack pnpm dev:mobile
```

웹 테스트가 필요하면:
```bash
corepack pnpm dev:web
```

## 2) 기본 검증
```bash
corepack pnpm qa:regression
corepack pnpm test
corepack pnpm typecheck
corepack pnpm build
```

## 3) 출시 전 원클릭 점검
```bash
corepack pnpm release:check
```

포함 항목:
- 모바일 에셋 용량 감사 (`verify:assets`)
- 10회 반복 회귀 QA (`qa:regression`)
- 타입체크, 테스트, 빌드

## 4) 주요 문서
- `docs/RELEASE_TODO.md`: 출시 직전 체크리스트/남은 수동 점검
- `docs/QA_REPORT.md`: 회귀 QA 결과
- `docs/ASSET_AUDIT.md`: 참조 에셋 용량 리포트
- `SELF-CRITIQUE.md`: 리스크/개선 계획
- `SOURCES.md`: 리서치 출처

## 5) 선택 검증 (공공 API)
KASI 교차검증(개발자용):
```bash
$env:DATA_GO_KASI_SERVICE_KEY='YOUR_KEY'
$env:VERIFY_LIMIT='3'
corepack pnpm verify:kasi
```
