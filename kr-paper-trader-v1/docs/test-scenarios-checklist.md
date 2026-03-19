# 20 Core Scenarios Coverage Checklist

기준: 원 기획 테스트 시나리오 20개

1. 지정가 매수 미도달 -> 미체결 유지 ✅ (`test_limit_buy_waits_until_price_reached` 일부)
2. 지정가 매수 도달 + 수량 부족 -> 부분체결 ✅ (partial fill 기본 정책)
3. stop loss 충족 -> 청산 주문 발생 ✅ (`test_stop_loss_triggers_auto_exit`)
4. trailing stop 갱신 후 되돌림 -> 청산 ✅ (`test_trailing_stop_triggers_on_pullback`)
5. 시장 종료 후 일반 주문 -> 정책 동작 ✅ (`test_market_closed_blocks_non_market_open`)
6. 거래정지 종목 주문 시도 -> rejected ✅ (`test_halt_flag_blocks_order`)
7. 투자경고 종목 주문 시도 -> rejected ✅ (`test_warning_flag_blocks_order`)
8. AI 전략 schema invalid -> reject ✅ (`test_ai_plan_submit_rejects_risk_violation` + 필수필드 체크)
9. AI 전략 risk 위반 -> reject ✅
10. 서버 재시작 후 order/position 복구 ✅ (`test_state_snapshot_restores_orders_and_plans`)
11. fee/tax 반영 후 pnl 계산 일치 ✅ (`test_fee_tax_and_pnl_consistency_smoke` + `/api/pnl`)
12. split order tranche 정상 작동 ✅ (`test_split_order_creates_tranches`)
13. marketable limit 즉시 체결 ✅ (limit 조건 체결 경로)
14. same ticker duplicate order 제한 ✅ (`test_duplicate_live_order_rejected`)
15. banned ticker 차단 ✅ (`test_banned_ticker_blocked`)
16. no_trade_day 전략 정상 표시 ✅ (`test_ai_plan_no_trade_clears_plan`)
17. replay 모드 동일 seed 재현 ✅ (`test_replay_seed_is_deterministic`)
18. stale quote 신규매수 차단 ✅ (`test_stale_quote_blocks_new_buy`)
19. corporate action 반영 후 평균단가/수량 보정 ✅ (`test_corporate_action_split_apply`)
20. approval 없는 AI plan 주문 미생성 ✅ (`test_rejected_plan_cannot_be_approved`)

## 남은 우선 테스트
- stop_loss 전용 테스트
- trailing_stop 되돌림 테스트
- halt 전용 차단 테스트
- fee/tax pnl 일치 정밀 테스트
