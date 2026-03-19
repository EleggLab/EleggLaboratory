# Production Readiness Checklist (Paper Trading)

현재 상태: **개발 진행 중 (실사용 전)**

## 완료된 항목
- Paper-only 아키텍처 (실주문 어댑터 미연결)
- 수동 주문 + AI 계획 동일 주문 스키마
- 보수적 partial fill 모델
- 주문/체결/현금/포지션 기본 흐름
- 시장 상태/세션 오버라이드
- banned ticker 차단
- state snapshot 저장/복구 (재시작 복구 기초)
- WebSocket 스트림 기초 (/ws/quotes, /ws/orders, /ws/positions)
- JWT 기반 기본 인증 보호(주요 변경 API)
- corporate action 수동 적용 엔드포인트(분할 보정 기초)

## 남은 필수 항목 (실사용 전)
1. 진짜 Alembic migration 체계 완성
2. APScheduler/Celery 기반 조건주문/exit rule 감시 워커 분리(현재는 in-process loop)
3. 거래정지/투자주의/관리종목 자동 동기화 파이프라인 고도화
4. corporate action 자동 반영 로직(평균단가/수량 보정) 고도화
5. 20개 핵심 시나리오 자동 테스트 통과 + CI 그린 증빙
6. 장애/재시작/리플레이 일관성 검증 리포트 자동화
7. 인증/권한/JWT/감사로그 보강(역할별 권한 경계)
8. 비중 컴파일러의 섹터/일일매수 한도/포지션 제한 운영값 검증

## 판정 기준
- 위 7개 모두 완료 + E2E 테스트 그린이면
  **"실사용 가능(종이투자 운용 투입 가능)"** 으로 선언.
