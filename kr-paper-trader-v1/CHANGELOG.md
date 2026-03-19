# CHANGELOG

## v1.0.0-beta - 2026-03-19

### Added
- target_weight_pct 중심 Portfolio Rebalance Compiler 도입
- AI 승인형 집행 경계 고정 (submit -> validation -> approval -> compile -> queue)
- 운영 기본에서 internal generate 비활성 (`ALLOW_INTERNAL_AI_GENERATE=false`)
- 보수적 체결 모델(quote_based / bar_conservative) 및 partial fill
- stale quote / banned ticker / warning-halt / duplicate live order 차단
- state snapshot 저장/복구 + WS stream + worker loop + exit rule 기초
- JWT + role(admin/trader) 권한 경계
- PnL 요약 엔드포인트 (`/api/pnl`)
- release gate 스크립트 및 운영/릴리즈 문서 세트

### Testing
- 핵심 시나리오 문서 기준 20/20 체크 완료
- backend 테스트 스위트 확장 (auth/plan/compiler/recovery/worker/exit/pnl)

### Notes
- 본 릴리즈는 paper trading 전용
- production_ready 최종 선언은 CI green + soak 증빙 완료 후 확정
