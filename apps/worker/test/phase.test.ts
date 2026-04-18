import {
  finishSettlement,
  isPhaseAdvanceReady,
  markPlayerReady,
  openStockMarket,
  openSettlement,
} from "../src/game/phase";
import { placeBuyRequest } from "../src/game/orders";
import { createStartedRoomState } from "./helpers";

describe("phase", () => {
  it("hint -> stock 전이 시 주문이 만료되고 예약금이 반환된다", () => {
    const { state, hostId } = createStartedRoomState("PHASE:1");
    placeBuyRequest(
      state,
      hostId,
      { phaseType: "round", targetType: "single", infoType: "up", price: 2 },
      10,
    );

    openStockMarket(state, 20);

    expect(state.phase).toBe("STOCK_MARKET_OPEN");
    expect(state.players[hostId]!.reservedCash).toBe(0);
    expect(Object.values(state.buyRequests)[0]!.status).toBe("expired");
    expect(state.phaseReadyPlayerIds).toEqual([]);
  });

  it("round settlement 이후 round 10이면 게임이 끝난다", () => {
    const { state } = createStartedRoomState("PHASE:2");
    state.roundNumber = 10;
    openSettlement(state, 30);
    finishSettlement(state, 40);

    expect(state.phase).toBe("GAME_END");
    expect(state.status).toBe("GAME_END");
  });

  it("현재 접속 중인 플레이어가 모두 턴 종료해야 다음 단계 준비가 된다", () => {
    const { state, hostId, guestId } = createStartedRoomState("PHASE:3");
    expect(isPhaseAdvanceReady(state)).toBe(false);

    markPlayerReady(state, hostId);
    expect(isPhaseAdvanceReady(state)).toBe(false);

    markPlayerReady(state, guestId);
    expect(isPhaseAdvanceReady(state)).toBe(true);
  });
});
