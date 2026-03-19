# KR Paper Trader v1

국내주식용 현실형 모의투자 웹앱 (Paper Trading Only)

## 핵심 원칙
- **실주문 절대 금지** (paper execution only)
- 수동 주문 + AI 전략안을 동일한 실행 스키마로 처리
- 총자산 100% 기준 비중 운용
- Risk Engine이 AI보다 상위
- 모든 이벤트 Audit 가능
- 기본 시간대: `Asia/Seoul`

## Monorepo 구조
- `apps/frontend` : Next.js + TypeScript + Tailwind + shadcn/ui (스켈레톤)
- `apps/backend` : FastAPI + SQLAlchemy + Alembic (핵심 API 스켈레톤)
- `infra` : Docker Compose
- `samples` : AI Plan / Manual Order 샘플 JSON
- `docs` : 아키텍처 다이어그램 / 정책
- `tests` : pytest / Playwright 스켈레톤

## 빠른 실행
```bash
cp .env.example .env
docker compose -f infra/docker-compose.yml up --build
```

- Backend: http://localhost:8000
- Frontend: http://localhost:3000

## 필수 API (v1 스켈레톤)
- POST `/api/ai/plan/generate`
- POST `/api/ai/plan/{id}/approve`
- POST `/api/ai/plan/{id}/reject`
- POST `/api/orders`
- POST `/api/orders/{id}/cancel`
- POST `/api/orders/{id}/replace`
- GET `/api/orders`
- GET `/api/fills`
- GET `/api/positions`
- GET `/api/dashboard`
- GET `/api/market/status`
- GET `/api/settings/risk`
- PATCH `/api/settings/risk`
- POST `/api/sim/reset`
- POST `/api/sim/replay/start`
- GET `/api/audit-logs`

## 주의
현재 구현은 **v1 bootstrap/skeleton**이며, 실거래 연결은 의도적으로 비활성화되어 있습니다.
