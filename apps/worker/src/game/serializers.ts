import type {
  BuyRequestView,
  LeaderboardEntry,
  Player,
  PlayerPublicView,
  PublicHintView,
  ReadableHintView,
  RedactedRoomSnapshot,
  RoomState,
  SellOrderView,
  StockActionLogView,
  StockPublicView,
  TradeLogView,
} from "@tong/shared/types";
import {
  getHintMarketLimits,
  getNetWorth,
  getRemainingStockActionsThisRound,
  getStockActionsUsedThisRound,
} from "@tong/shared/utils";
import { getHintSellability } from "./orders";

function serializePublicHint(state: RoomState, hintId: string): PublicHintView {
  const hint = state.hints[hintId]!;
  return {
    id: hint.id,
    phaseType: hint.phaseType,
    targetType: hint.targetType,
    infoType: hint.infoType,
    roundNumber: hint.roundNumber,
    content: hint.content,
  };
}

function serializeReadableHint(state: RoomState, player: Player, hintId: string): ReadableHintView {
  const hint = state.hints[hintId]!;
  const { reason } = getHintSellability(state, player.id, hint.id);
  return {
    id: hint.id,
    ownerPlayerId: hint.ownerPlayerId,
    phaseType: hint.phaseType,
    targetType: hint.targetType,
    infoType: hint.infoType,
    roundNumber: hint.roundNumber,
    content: hint.content,
    acquiredRound: hint.acquiredRound,
    soldOnce: hint.soldOnce,
    canSell: reason === null,
    sellBlockedReason: reason,
  };
}

export function serializeSnapshot(
  state: RoomState,
  playerId: string,
  serverNow: number,
  reconnectTokenAccepted = false,
): RedactedRoomSnapshot {
  const player = state.players[playerId];
  if (!player) {
    throw new Error("플레이어 스냅샷을 만들 수 없습니다.");
  }

  const leaderboardMap = new Map<string, LeaderboardEntry>(
    state.leaderboard.map((entry) => [entry.playerId, entry]),
  );

  const players: PlayerPublicView[] = Object.values(state.players)
    .map((entry) => ({
      id: entry.id,
      nickname: entry.nickname,
      isHost: entry.isHost,
      connected: entry.connected,
      phaseDone: state.phaseReadyPlayerIds.includes(entry.id),
      netWorth: getNetWorth(entry, state.stocks),
      rank: leaderboardMap.get(entry.id)?.rank ?? 0,
    }))
    .sort((left, right) => left.rank - right.rank || left.nickname.localeCompare(right.nickname, "ko"));

  const stocks: StockPublicView[] = Object.values(state.stocks).map((stock) => ({
    id: stock.id,
    code: stock.code,
    name: stock.name,
    tags: stock.tags,
    currentPrice: stock.currentPrice,
    priceHistory: [...stock.priceHistory],
  }));

  const sellOrders: SellOrderView[] = Object.values(state.sellOrders)
    .filter((order) => order.status === "open")
    .sort((left, right) => left.price - right.price || left.createdAt - right.createdAt)
    .map((order) => ({
      id: order.id,
      sellerPlayerId: order.sellerPlayerId,
      phaseType: order.phaseType,
      targetType: order.targetType,
      infoType: order.infoType,
      price: order.price,
      adTag: order.adTag,
      createdAt: order.createdAt,
      status: order.status,
    }));

  const buyRequests: BuyRequestView[] = Object.values(state.buyRequests)
    .filter((request) => request.status === "open")
    .sort((left, right) => right.price - left.price || left.createdAt - right.createdAt)
    .map((request) => ({
      id: request.id,
      buyerPlayerId: request.buyerPlayerId,
      phaseType: request.phaseType,
      targetType: request.targetType,
      infoType: request.infoType,
      price: request.price,
      createdAt: request.createdAt,
      status: request.status,
    }));

  const publicHints = state.revealedPublicHintIds.map((hintId) => serializePublicHint(state, hintId));
  const readableHints = player.readableHintIds
    .filter((hintId) => state.hints[hintId] && state.hints[hintId]!.readableBy.includes(playerId))
    .map((hintId) => serializeReadableHint(state, player, hintId))
    .sort((left, right) => {
      const leftRound = left.roundNumber ?? -1;
      const rightRound = right.roundNumber ?? -1;
      return rightRound - leftRound || left.content.localeCompare(right.content, "ko");
    });

  const myRecentStockActions: StockActionLogView[] = state.stockActionLogs
    .filter((action) => action.playerId === playerId)
    .slice(-8);

  const tradeLogs: TradeLogView[] = [...state.tradeLogs].slice(-20);
  const stockActionsUsed = getStockActionsUsedThisRound(state, playerId);
  const stockActionsRemaining = getRemainingStockActionsThisRound(state, playerId);
  const hintMarketLimits = getHintMarketLimits(Object.keys(state.players).length);

  return {
    roomCode: state.roomCode,
    status: state.status,
    phase: state.phase,
    roundNumber: state.roundNumber,
    phaseStartedAt: state.phaseStartedAt,
    phaseEndsAt: state.phaseEndsAt,
    phaseReadyPlayerIds: [...state.phaseReadyPlayerIds],
    serverNow,
    players,
    stocks,
    publicHints,
    sellOrders,
    buyRequests,
    hintMarketLimits,
    tradeLogs,
    leaderboard: state.leaderboard,
    self: {
      id: player.id,
      nickname: player.nickname,
      isHost: player.isHost,
      cash: player.cash,
      reservedCash: player.reservedCash,
      netWorth: getNetWorth(player, state.stocks),
      holdings: player.holdings,
      stockActionsUsed,
      stockActionsRemaining,
    },
    readableHints,
    myRecentStockActions,
    lastRoundSummary: state.roundSummariesByPlayer[playerId] ?? null,
    reconnectTokenAccepted,
  };
}
