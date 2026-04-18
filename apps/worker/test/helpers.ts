import { ROUND_COUNT, START_PRICE } from "@tong/shared/config";
import type { RoomState } from "@tong/shared/types";
import { createId, createInitialStocks } from "@tong/shared/utils";
import { generateStockDeltaMatrix } from "../src/game/generator";
import { generateHintPack } from "../src/game/hints";
import { openHintMarket } from "../src/game/phase";
import { createPlayer, createRoomState, refreshLeaderboard, resetPlayerForGame } from "../src/utils/state";

export function createStartedRoomState(seed = "ABCDE:1"): {
  state: RoomState;
  hostId: string;
  guestId: string;
} {
  const state = createRoomState("ABCDE", 1);
  state.seed = seed;

  const host = createPlayer("민수", true, 1);
  const guest = createPlayer("지훈", false, 2);
  host.connected = true;
  guest.connected = true;
  state.players[host.id] = host;
  state.players[guest.id] = guest;

  const generated = generateStockDeltaMatrix(seed);
  state.status = "IN_GAME";
  state.phase = "ROUND_SETUP";
  state.stockDeltaMatrix = generated.stockDeltaMatrix;
  state.players = Object.fromEntries(
    Object.values(state.players).map((player) => [
      player.id,
      { ...resetPlayerForGame(player), connected: player.connected },
    ]),
  );

  const hintPack = generateHintPack(seed, Object.values(state.players), state.stockDeltaMatrix);
  state.hints = hintPack.hints;
  state.publicOverallHintId = hintPack.publicOverallHintId;
  state.privateOverallHintIdsByPlayer = hintPack.privateOverallHintIdsByPlayer;
  state.publicRoundHintIdsByRound = hintPack.publicRoundHintIdsByRound;
  state.privateRoundHintIdsByRound = hintPack.privateRoundHintIdsByRound;

  openHintMarket(state, 1, 10_000);
  refreshLeaderboard(state);
  return { state, hostId: host.id, guestId: guest.id };
}

export function createSimpleSettlementState(): {
  state: RoomState;
  hostId: string;
  guestId: string;
} {
  const state = createRoomState("SETTL", 1);
  const host = createPlayer("호스트", true, 1);
  const guest = createPlayer("게스트", false, 2);
  host.connected = true;
  guest.connected = true;
  state.players[host.id] = host;
  state.players[guest.id] = guest;
  state.status = "IN_GAME";
  state.phase = "STOCK_MARKET_OPEN";
  state.roundNumber = 1;
  state.stocks = createInitialStocks();
  state.stockDeltaMatrix = {
    A: [2, ...Array(ROUND_COUNT - 1).fill(0)],
    B: [-1, ...Array(ROUND_COUNT - 1).fill(0)],
    C: [0, ...Array(ROUND_COUNT - 1).fill(0)],
    D: [3, ...Array(ROUND_COUNT - 1).fill(0)],
    E: [-2, ...Array(ROUND_COUNT - 1).fill(0)],
  };
  state.players[host.id] = {
    ...host,
    cash: 20,
    holdings: { A: 2, B: 0, C: 1, D: 0, E: 0 },
    readableHintIds: [],
    reservedCash: 0,
  };
  state.players[guest.id] = {
    ...guest,
    cash: 25,
    holdings: { A: 0, B: 1, C: 0, D: 1, E: 0 },
    readableHintIds: [],
    reservedCash: 0,
  };
  state.roundBaselines = {
    [host.id]: { cash: 20, holdingsValue: START_PRICE * 3, netWorth: 50 },
    [guest.id]: { cash: 25, holdingsValue: START_PRICE * 2, netWorth: 45 },
  };
  refreshLeaderboard(state);
  return { state, hostId: host.id, guestId: guest.id };
}

export function createManualHint(ownerPlayerId: string) {
  return {
    id: createId("hint"),
    audience: "private" as const,
    ownerPlayerId,
    phaseType: "round" as const,
    targetType: "single" as const,
    infoType: "up" as const,
    roundNumber: 1,
    content: "테스트 힌트",
    tradeable: true,
    soldOnce: false,
    acquiredRound: 1,
    readableBy: [ownerPlayerId],
    proof: {
      kind: "round_stock_direction" as const,
      roundNumber: 1,
      stockId: "A" as const,
      direction: "up" as const,
    },
  };
}
