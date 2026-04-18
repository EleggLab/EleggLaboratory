import {
  TWO_PLAYER_MAX_BUY_REQUESTS_PER_PLAYER,
  TWO_PLAYER_MAX_SELL_ORDERS_PER_PLAYER,
} from "@tong/shared/config";
import { applyStockAction } from "../src/game/settlement";
import { serializeSnapshot } from "../src/game/serializers";
import { createStartedRoomState } from "./helpers";

describe("serializers", () => {
  it("자기 힌트만 content가 보이고 타인 private hint는 숨긴다", () => {
    const { state, hostId, guestId } = createStartedRoomState("SER:1");
    const hostSnapshot = serializeSnapshot(state, hostId, 100);
    const guestPrivateHintId = state.privateOverallHintIdsByPlayer[guestId]!;

    expect(hostSnapshot.readableHints.some((hint) => hint.id === guestPrivateHintId)).toBe(false);
    expect(hostSnapshot.publicHints.every((hint) => typeof hint.content === "string")).toBe(true);
  });

  it("미래 가격 이력은 보내지 않는다", () => {
    const { state, hostId } = createStartedRoomState("SER:2");
    const snapshot = serializeSnapshot(state, hostId, 100);

    expect(snapshot.stocks.every((stock) => stock.priceHistory.length === 1)).toBe(true);
  });

  it("현재 라운드 주식 행동 예산을 자기 스냅샷에 담는다", () => {
    const { state, hostId } = createStartedRoomState("SER:3");

    state.phase = "STOCK_MARKET_OPEN";
    applyStockAction(state, hostId, "A", "buy", 10);
    applyStockAction(state, hostId, "A", "sell", 11);

    const snapshot = serializeSnapshot(state, hostId, 100);

    expect(snapshot.self.stockActionsUsed).toBe(2);
    expect(snapshot.self.stockActionsRemaining).toBe(1);
  });

  it("2인 방 주문장 한도를 스냅샷에 담는다", () => {
    const { state, hostId } = createStartedRoomState("SER:4");
    const snapshot = serializeSnapshot(state, hostId, 100);

    expect(snapshot.hintMarketLimits.maxSellOrders).toBe(TWO_PLAYER_MAX_SELL_ORDERS_PER_PLAYER);
    expect(snapshot.hintMarketLimits.maxBuyRequests).toBe(TWO_PLAYER_MAX_BUY_REQUESTS_PER_PLAYER);
  });
});
