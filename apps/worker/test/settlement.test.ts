import { MAX_STOCK_ACTIONS_PER_ROUND } from "@tong/shared/config";
import { applyStockAction, settleCurrentRound } from "../src/game/settlement";
import { createSimpleSettlementState } from "./helpers";

describe("settlement", () => {
  it("delta 적용 후 가격과 자산이 갱신된다", () => {
    const { state, hostId } = createSimpleSettlementState();
    const summaries = settleCurrentRound(state, 50);

    expect(state.stocks.A.currentPrice).toBe(12);
    expect(state.stocks.B.currentPrice).toBe(9);
    expect(state.stocks.E.currentPrice).toBe(8);
    expect(summaries[hostId]!.netWorthDelta).toBe(4);
    expect(state.leaderboard[0]?.playerId).toBe(hostId);
  });

  it("한 라운드에 주식 행동은 세 번까지만 허용된다", () => {
    const { state, hostId } = createSimpleSettlementState();

    applyStockAction(state, hostId, "A", "buy", 10);
    applyStockAction(state, hostId, "A", "sell", 11);
    applyStockAction(state, hostId, "C", "buy", 12);

    expect(() => applyStockAction(state, hostId, "D", "buy", 13)).toThrow(
      `이번 라운드에는 주식 행동을 ${MAX_STOCK_ACTIONS_PER_ROUND}번까지 할 수 있습니다.`,
    );
  });
});
