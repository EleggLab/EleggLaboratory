import {
  TWO_PLAYER_MAX_BUY_REQUESTS_PER_PLAYER,
  TWO_PLAYER_MAX_SELL_ORDERS_PER_PLAYER,
} from "@tong/shared/config";
import { createId } from "@tong/shared/utils";
import {
  buySellOrder,
  fulfillBuyRequest,
  getHintSellability,
  placeBuyRequest,
  placeSellOrder,
} from "../src/game/orders";
import { createManualHint, createStartedRoomState } from "./helpers";

describe("orders", () => {
  it("sell order 구매 시 soldOnce와 readableHintIds가 적용된다", () => {
    const { state, hostId, guestId } = createStartedRoomState("ORDER:1");
    const hintId = state.privateOverallHintIdsByPlayer[hostId]!;
    const order = placeSellOrder(state, hostId, hintId, 2, "즉시 활용", 1);
    const trade = buySellOrder(state, guestId, order.id, 2);

    expect(trade.price).toBe(2);
    expect(state.hints[hintId]!.soldOnce).toBe(true);
    expect(state.players[guestId]!.readableHintIds).toContain(hintId);
  });

  it("buy request 충족 시 예약금이 해제되고 거래 로그가 남는다", () => {
    const { state, hostId, guestId } = createStartedRoomState("ORDER:2");
    const hintId = state.privateRoundHintIdsByRound[1]![hostId]!;
    const hint = state.hints[hintId]!;
    const request = placeBuyRequest(
      state,
      guestId,
      {
        phaseType: hint.phaseType,
        targetType: hint.targetType,
        infoType: hint.infoType,
        price: 3,
      },
      3,
    );
    const trade = fulfillBuyRequest(state, hostId, request.id, hintId, 4);

    expect(trade.price).toBe(3);
    expect(state.players[guestId]!.reservedCash).toBe(0);
    expect(state.tradeLogs).toHaveLength(1);
  });

  it("same-round resale 금지와 soldOnce를 막는다", () => {
    const { state, guestId } = createStartedRoomState("ORDER:3");
    const manualHint = createManualHint(guestId);
    state.hints[manualHint.id] = manualHint;
    state.players[guestId]!.readableHintIds.push(manualHint.id);

    expect(getHintSellability(state, guestId, manualHint.id).reason).toContain("이번 라운드");
  });

  it("stale round hint는 다음 라운드에 팔 수 없다", () => {
    const { state, guestId } = createStartedRoomState("ORDER:4");
    const manualHint = createManualHint(guestId);
    manualHint.acquiredRound = 1;
    state.hints[manualHint.id] = manualHint;
    state.players[guestId]!.readableHintIds.push(manualHint.id);
    state.roundNumber = 2;

    expect(getHintSellability(state, guestId, manualHint.id).reason).toContain("지나간 라운드");
  });

  it("2인 방에서는 주문장 한도가 조금 더 넓다", () => {
    const { state, hostId, guestId } = createStartedRoomState("ORDER:5");

    for (let index = 0; index < TWO_PLAYER_MAX_SELL_ORDERS_PER_PLAYER; index += 1) {
      const hint = {
        ...createManualHint(hostId),
        id: createId("hint"),
        acquiredRound: null,
        content: `추가 판매 힌트 ${index + 1}`,
      };
      state.hints[hint.id] = hint;
      state.players[hostId]!.readableHintIds.push(hint.id);
      placeSellOrder(state, hostId, hint.id, 1, "즉시 활용", 10 + index);
    }

    expect(() =>
      placeSellOrder(
        state,
        hostId,
        state.privateOverallHintIdsByPlayer[hostId]!,
        1,
        "즉시 활용",
        99,
      ),
    ).toThrow(`판매 주문은 ${TWO_PLAYER_MAX_SELL_ORDERS_PER_PLAYER}개까지만 올릴 수 있습니다.`);

    for (let index = 0; index < TWO_PLAYER_MAX_BUY_REQUESTS_PER_PLAYER; index += 1) {
      placeBuyRequest(
        state,
        guestId,
        {
          phaseType: index % 2 === 0 ? "round" : "overall",
          targetType: "single",
          infoType: index % 2 === 0 ? "up" : "compare",
          price: 1,
        },
        100 + index,
      );
    }

    expect(() =>
      placeBuyRequest(
        state,
        guestId,
        {
          phaseType: "round",
          targetType: "tag",
          infoType: "down",
          price: 1,
        },
        200,
      ),
    ).toThrow(`매수 요청은 ${TWO_PLAYER_MAX_BUY_REQUESTS_PER_PLAYER}개까지만 올릴 수 있습니다.`);
  });
});
