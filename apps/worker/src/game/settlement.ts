import {
  MAX_HOLD_PER_STOCK,
  MAX_STOCK_ACTIONS_PER_ROUND,
  STOCK_DEFINITIONS,
} from "@tong/shared/config";
import type {
  RoomState,
  RoundPriceChange,
  RoundSummary,
  StockActionLog,
  StockId,
} from "@tong/shared/types";
import {
  clampPrice,
  createId,
  getFreeCash,
  getHoldingsValue,
  getNetWorth,
  getRemainingStockActionsThisRound,
} from "@tong/shared/utils";
import { refreshLeaderboard } from "../utils/state";

export function getStockActionBlockReason(
  state: RoomState,
  playerId: string,
  stockId: StockId,
  action: "buy" | "sell",
): string | null {
  const player = state.players[playerId];
  const stock = state.stocks[stockId];
  if (!player || !stock) {
    throw new Error("플레이어나 종목을 찾을 수 없습니다.");
  }

  if (state.phase !== "STOCK_MARKET_OPEN") {
    return "지금은 주식을 거래할 수 없습니다.";
  }

  if (getRemainingStockActionsThisRound(state, playerId) <= 0) {
    return `이번 라운드에는 주식 행동을 ${MAX_STOCK_ACTIONS_PER_ROUND}번까지 할 수 있습니다.`;
  }

  if (action === "buy") {
    if (getFreeCash(player) < stock.currentPrice) {
      return "현금이 부족합니다.";
    }
    if (player.holdings[stockId] >= MAX_HOLD_PER_STOCK) {
      return `종목당 최대 ${MAX_HOLD_PER_STOCK}주까지만 보유할 수 있습니다.`;
    }
    return null;
  }

  if (player.holdings[stockId] <= 0) {
    return "보유 주식이 없습니다.";
  }

  return null;
}

export function applyStockAction(
  state: RoomState,
  playerId: string,
  stockId: StockId,
  action: "buy" | "sell",
  now: number,
): StockActionLog {
  const blockReason = getStockActionBlockReason(state, playerId, stockId, action);
  if (blockReason) {
    throw new Error(blockReason);
  }

  const player = state.players[playerId]!;
  const stock = state.stocks[stockId]!;

  if (action === "buy") {
    player.cash -= stock.currentPrice;
    player.holdings[stockId] += 1;
  } else {
    player.cash += stock.currentPrice;
    player.holdings[stockId] -= 1;
  }

  const log: StockActionLog = {
    id: createId("stock"),
    roundNumber: state.roundNumber,
    playerId,
    stockId,
    action,
    price: stock.currentPrice,
    createdAt: now,
  };
  state.stockActionLogs.push(log);
  state.updatedAt = now;
  refreshLeaderboard(state);
  return log;
}

export function startRoundBaseline(state: RoomState): void {
  for (const player of Object.values(state.players)) {
    state.roundBaselines[player.id] = {
      cash: player.cash,
      holdingsValue: getHoldingsValue(player, state.stocks),
      netWorth: getNetWorth(player, state.stocks),
    };
  }
  refreshLeaderboard(state);
}

export function settleCurrentRound(state: RoomState, now: number): Record<string, RoundSummary> {
  const roundIndex = state.roundNumber - 1;
  const stockChanges: RoundPriceChange[] = [];

  for (const stock of STOCK_DEFINITIONS) {
    const beforePrice = state.stocks[stock.id].currentPrice;
    const rawDelta = state.stockDeltaMatrix[stock.id][roundIndex] ?? 0;
    const afterPrice = clampPrice(beforePrice + rawDelta);
    state.stocks[stock.id].currentPrice = afterPrice;
    state.stocks[stock.id].priceHistory.push(afterPrice);
    stockChanges.push({
      stockId: stock.id,
      stockName: stock.name,
      beforePrice,
      afterPrice,
      delta: afterPrice - beforePrice,
    });
  }

  refreshLeaderboard(state);
  const tradeLogsThisRound = state.tradeLogs.filter((trade) => trade.roundNumber === state.roundNumber);
  const stockLogsThisRound = state.stockActionLogs.filter(
    (action) => action.roundNumber === state.roundNumber,
  );
  const summaries: Record<string, RoundSummary> = {};

  for (const player of Object.values(state.players)) {
    const baseline = state.roundBaselines[player.id] ?? {
      cash: player.cash,
      holdingsValue: getHoldingsValue(player, state.stocks),
      netWorth: getNetWorth(player, state.stocks),
    };
    const netWorth = getNetWorth(player, state.stocks);
    const holdingsValue = getHoldingsValue(player, state.stocks);
    const rank = state.leaderboard.find((entry) => entry.playerId === player.id)?.rank ?? 0;
    summaries[player.id] = {
      roundNumber: state.roundNumber,
      cashDelta: player.cash - baseline.cash,
      holdingsValueDelta: holdingsValue - baseline.holdingsValue,
      netWorthDelta: netWorth - baseline.netWorth,
      rank,
      tradeCount:
        tradeLogsThisRound.filter(
          (trade) => trade.sellerPlayerId === player.id || trade.buyerPlayerId === player.id,
        ).length + stockLogsThisRound.filter((action) => action.playerId === player.id).length,
      hintTradeCount: tradeLogsThisRound.filter(
        (trade) => trade.sellerPlayerId === player.id || trade.buyerPlayerId === player.id,
      ).length,
      stockActionCount: stockLogsThisRound.filter((action) => action.playerId === player.id).length,
      stockChanges,
    };
  }

  state.roundSummariesByPlayer = summaries;
  state.updatedAt = now;
  return summaries;
}
