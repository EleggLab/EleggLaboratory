# Ops Runbook (Paper Trading)

## Start
1. `cp .env.example .env`
2. `docker compose -f infra/docker-compose.yml up --build`
3. health check: `GET /health`

## Daily Checks
- `GET /api/readiness`
- `GET /api/market/status`
- `GET /api/dashboard`
- `GET /api/audit-logs`

## Incident: stale quote blocks orders
- 확인: `/api/market/status` 의 `stale_quote_seconds`
- 조치: `/api/market/admin/session-state`로 임시 완화

## Incident: wrong warning flags
- 조치: `/api/market/admin/instruments/{ticker}/flags`
- 일괄 반영: `/api/market/admin/disclosure-sync/mock`

## Recovery
- state snapshot: `/app/runtime/state.json`
- 재기동 시 startup 로드 자동 수행

## Safety
- live broker endpoint 미구현/비활성
- 실주문 호출 금지 정책 유지
