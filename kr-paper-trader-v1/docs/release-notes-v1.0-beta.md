# KR Paper Trader v1.0-beta Release Notes

## 요약
이번 릴리즈는 "기능 확장"보다 "기획 의도 정렬"에 초점을 맞췄습니다.
핵심은 target_weight_pct 중심 실행 컴파일러, 승인형 AI 집행 경계, 운영 안정성 기반 확보입니다.

## 핵심 변경
- target_weight_pct 기반 Portfolio Rebalance Compiler 도입
- 수동/AI 주문을 동일 스키마 + 동일 실행 엔진으로 정렬
- AI 승인 경계 강화
  - submit -> validation -> approval -> compile -> queue
  - 운영 기본에서 internal generate 비활성
- 보수적 체결 모델 유지/강화
  - partial fill
  - quote_based / bar_conservative fill_model 기록
- 리스크 차단 강화
  - stale quote / banned ticker / warning-halt / duplicate live order
- 운영성 강화
  - state snapshot 저장/복구
  - WS stream (quotes/orders/positions)
  - worker loop + exit rule 자동청산 기초
  - readiness/ops 문서 및 스크립트 정비

## 테스트/검증 현황
- 문서 기준 핵심 시나리오 20/20 커버
- backend 테스트 스위트 확장 완료
- 환경 제약으로 CI green 최종 캡처는 별도 실행 필요

## 알려진 제한
- 아직 실주문 기능 없음 (의도된 제약)
- 워커 장시간 soak/CI 증빙 완료 전 production_ready 미선언

## 다음 단계
1. CI green 증빙 고정
2. soak 리포트 자동 축적
3. readiness 최종 판정 후 beta 태그 고정
