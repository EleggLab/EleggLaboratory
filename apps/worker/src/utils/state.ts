import {
  START_CASH,
  STOCK_DEFINITIONS,
} from "@tong/shared/config";
import type {
  LeaderboardEntry,
  Player,
  RoomState,
  StockId,
} from "@tong/shared/types";
import {
  createEmptyHoldings,
  createId,
  createInitialStocks,
  getNetWorth,
  normalizeNickname,
} from "@tong/shared/utils";

export function createEmptyMatrix(): Record<StockId, number[]> {
  return STOCK_DEFINITIONS.reduce(
    (matrix, stock) => {
      matrix[stock.id] = [];
      return matrix;
    },
    {} as Record<StockId, number[]>,
  );
}

export function createRoomState(roomCode: string, createdAt: number): RoomState {
  return {
    roomCode,
    seed: `${roomCode}:${createdAt}`,
    status: "LOBBY",
    phase: "LOBBY",
    roundNumber: 0,
    phaseStartedAt: null,
    phaseEndsAt: null,
    players: {},
    stocks: createInitialStocks(),
    stockDeltaMatrix: createEmptyMatrix(),
    hints: {},
    publicOverallHintId: null,
    publicRoundHintIdsByRound: {},
    privateOverallHintIdsByPlayer: {},
    privateRoundHintIdsByRound: {},
    revealedPublicHintIds: [],
    sellOrders: {},
    buyRequests: {},
    tradeLogs: [],
    stockActionLogs: [],
    roundSummariesByPlayer: {},
    roundBaselines: {},
    phaseReadyPlayerIds: [],
    leaderboard: [],
    createdAt,
    updatedAt: createdAt,
    cleanupAt: null,
  };
}

export function createPlayer(nickname: string, isHost: boolean, now: number): Player {
  return {
    id: createId("player"),
    token: createId("token"),
    nickname: normalizeNickname(nickname),
    isHost,
    connected: false,
    cash: START_CASH,
    reservedCash: 0,
    holdings: createEmptyHoldings(),
    readableHintIds: [],
    joinedAt: now,
  };
}

export function resetPlayerForGame(player: Player): Player {
  return {
    ...player,
    cash: START_CASH,
    reservedCash: 0,
    holdings: createEmptyHoldings(),
    readableHintIds: [],
  };
}

export function refreshLeaderboard(state: RoomState): LeaderboardEntry[] {
  const entries = Object.values(state.players)
    .map((player) => ({
      playerId: player.id,
      nickname: player.nickname,
      netWorth: getNetWorth(player, state.stocks),
      rank: 0,
      joinedAt: player.joinedAt,
    }))
    .sort((left, right) => {
      return right.netWorth - left.netWorth || left.joinedAt - right.joinedAt;
    })
    .map((entry, index) => ({
      playerId: entry.playerId,
      nickname: entry.nickname,
      netWorth: entry.netWorth,
      rank: index + 1,
    }));

  state.leaderboard = entries;
  return entries;
}

export function getPlayerByToken(state: RoomState, playerToken: string): Player | undefined {
  return Object.values(state.players).find((player) => player.token === playerToken);
}

export function removePlayer(state: RoomState, playerId: string): void {
  delete state.players[playerId];
  refreshLeaderboard(state);
}

export function transferHostIfNeeded(state: RoomState): void {
  const players = Object.values(state.players);
  if (players.some((player) => player.isHost)) {
    return;
  }

  const nextHost = [...players].sort((left, right) => left.joinedAt - right.joinedAt)[0];
  if (nextHost) {
    nextHost.isHost = true;
  }
}
