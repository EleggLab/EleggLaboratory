import {
  MAX_BUY_REQUESTS_PER_PLAYER,
  MAX_SELL_ORDERS_PER_PLAYER,
  MAX_STOCK_ACTIONS_PER_ROUND,
  ROOM_CODE_CHARSET,
  ROOM_CODE_LENGTH,
  START_PRICE,
  STOCK_DEFINITIONS,
  TAG_STOCK_MAP,
  TWO_PLAYER_MAX_BUY_REQUESTS_PER_PLAYER,
  TWO_PLAYER_MAX_SELL_ORDERS_PER_PLAYER,
} from "./config";
import type {
  Hint,
  HintMetaFilter,
  HintProof,
  Player,
  RoomState,
  Stock,
  StockId,
  TagId,
} from "./types";

export function hashString(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createSeededRng(seed: string): () => number {
  let state = hashString(seed) || 1;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let result = Math.imul(state ^ (state >>> 15), 1 | state);
    result ^= result + Math.imul(result ^ (result >>> 7), 61 | result);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function shuffleDeterministic<T>(items: T[], seed: string): T[] {
  const rng = createSeededRng(seed);
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex]!, next[index]!];
  }
  return next;
}

export function createRoomCode(rng: () => number): string {
  let code = "";
  for (let index = 0; index < ROOM_CODE_LENGTH; index += 1) {
    code += ROOM_CODE_CHARSET[Math.floor(rng() * ROOM_CODE_CHARSET.length)];
  }
  return code;
}

export function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

export function createInitialStocks(): Record<StockId, Stock> {
  return STOCK_DEFINITIONS.reduce(
    (stocks, definition) => {
      stocks[definition.id] = {
        id: definition.id,
        code: definition.code,
        name: definition.name,
        tags: [...definition.tags],
        currentPrice: START_PRICE,
        priceHistory: [START_PRICE],
      };
      return stocks;
    },
    {} as Record<StockId, Stock>,
  );
}

export function createEmptyHoldings(): Record<StockId, number> {
  return STOCK_DEFINITIONS.reduce(
    (holdings, definition) => {
      holdings[definition.id] = 0;
      return holdings;
    },
    {} as Record<StockId, number>,
  );
}

export function getHoldingsValue(player: Player, stocks: Record<StockId, Stock>): number {
  return STOCK_DEFINITIONS.reduce((total, stock) => {
    return total + stocks[stock.id].currentPrice * player.holdings[stock.id];
  }, 0);
}

export function getNetWorth(player: Player, stocks: Record<StockId, Stock>): number {
  return player.cash + getHoldingsValue(player, stocks);
}

export function getStockActionsUsedThisRound(
  state: Pick<RoomState, "roundNumber" | "stockActionLogs">,
  playerId: string,
): number {
  return state.stockActionLogs.filter(
    (action) => action.playerId === playerId && action.roundNumber === state.roundNumber,
  ).length;
}

export function getRemainingStockActionsThisRound(
  state: Pick<RoomState, "roundNumber" | "stockActionLogs">,
  playerId: string,
): number {
  return Math.max(0, MAX_STOCK_ACTIONS_PER_ROUND - getStockActionsUsedThisRound(state, playerId));
}

export function getHintMarketLimits(playerCount: number): {
  maxSellOrders: number;
  maxBuyRequests: number;
} {
  if (playerCount <= 2) {
    return {
      maxSellOrders: TWO_PLAYER_MAX_SELL_ORDERS_PER_PLAYER,
      maxBuyRequests: TWO_PLAYER_MAX_BUY_REQUESTS_PER_PLAYER,
    };
  }

  return {
    maxSellOrders: MAX_SELL_ORDERS_PER_PLAYER,
    maxBuyRequests: MAX_BUY_REQUESTS_PER_PLAYER,
  };
}

export function getConnectedPlayerCount(players: Array<{ connected: boolean }>): number {
  return players.filter((player) => player.connected).length;
}

export function getTagStockIds(tagId: TagId): StockId[] {
  return [...TAG_STOCK_MAP[tagId]] as StockId[];
}

export function getStockName(stockId: StockId): string {
  return STOCK_DEFINITIONS.find((stock) => stock.id === stockId)?.name ?? stockId;
}

export function clampPrice(price: number): number {
  return Math.max(1, price);
}

export function normalizeNickname(nickname: string): string {
  return nickname.trim().slice(0, 12);
}

export function getFreeCash(player: Player): number {
  return player.cash - player.reservedCash;
}

export function isHintMetaMatch(hint: Hint, filter: HintMetaFilter): boolean {
  if (filter.phaseType && hint.phaseType !== filter.phaseType) {
    return false;
  }
  if (filter.targetType && hint.targetType !== filter.targetType) {
    return false;
  }
  if (filter.infoType && hint.infoType !== filter.infoType) {
    return false;
  }
  return true;
}

export function getFinalPrices(state: Pick<RoomState, "stocks">): Record<StockId, number> {
  return STOCK_DEFINITIONS.reduce(
    (prices, stock) => {
      prices[stock.id] = state.stocks[stock.id].currentPrice;
      return prices;
    },
    {} as Record<StockId, number>,
  );
}

export function buildPriceHistoryFromMatrix(
  stockDeltaMatrix: Record<StockId, number[]>,
): Record<StockId, number[]> {
  const history = STOCK_DEFINITIONS.reduce(
    (map, stock) => {
      map[stock.id] = [START_PRICE];
      return map;
    },
    {} as Record<StockId, number[]>,
  );

  for (let roundIndex = 0; roundIndex < stockDeltaMatrix.A.length; roundIndex += 1) {
    for (const stock of STOCK_DEFINITIONS) {
      const previous = history[stock.id][history[stock.id].length - 1] ?? START_PRICE;
      history[stock.id].push(clampPrice(previous + stockDeltaMatrix[stock.id][roundIndex]!));
    }
  }

  return history;
}

export function buildEffectiveRoundChanges(
  stockDeltaMatrix: Record<StockId, number[]>,
): Record<StockId, number[]> {
  const priceHistory = buildPriceHistoryFromMatrix(stockDeltaMatrix);
  return STOCK_DEFINITIONS.reduce(
    (changes, stock) => {
      changes[stock.id] = [];
      for (let roundIndex = 1; roundIndex < priceHistory[stock.id].length; roundIndex += 1) {
        changes[stock.id].push(
          priceHistory[stock.id][roundIndex]! - priceHistory[stock.id][roundIndex - 1]!,
        );
      }
      return changes;
    },
    {} as Record<StockId, number[]>,
  );
}

export interface HintTruthContext {
  stockDeltaMatrix: Record<StockId, number[]>;
}

export function isHintTruthful(proof: HintProof, context: HintTruthContext): boolean {
  const priceHistory = buildPriceHistoryFromMatrix(context.stockDeltaMatrix);
  const effectiveRoundChanges = buildEffectiveRoundChanges(context.stockDeltaMatrix);
  const finalPrices = STOCK_DEFINITIONS.reduce(
    (map, stock) => {
      map[stock.id] = priceHistory[stock.id][priceHistory[stock.id].length - 1]!;
      return map;
    },
    {} as Record<StockId, number>,
  );
  const finalChange = (stockId: StockId) => finalPrices[stockId] - START_PRICE;
  const roundChange = (stockId: StockId, roundNumber: number) =>
    effectiveRoundChanges[stockId][roundNumber - 1] ?? 0;
  const tagRoundSum = (tagId: TagId, roundNumber: number) =>
    getTagStockIds(tagId).reduce((sum, stockId) => sum + roundChange(stockId, roundNumber), 0);

  switch (proof.kind) {
    case "final_stock_direction":
      return proof.direction === "up"
        ? finalChange(proof.stockId) > 0
        : finalChange(proof.stockId) < 0;
    case "final_tag_direction":
      return proof.direction === "up"
        ? getTagStockIds(proof.tagId).reduce((sum, stockId) => sum + finalChange(stockId), 0) > 0
        : getTagStockIds(proof.tagId).reduce((sum, stockId) => sum + finalChange(stockId), 0) < 0;
    case "final_compare":
      return proof.relation === "gt"
        ? finalPrices[proof.leftStockId] > finalPrices[proof.rightStockId]
        : finalPrices[proof.leftStockId] < finalPrices[proof.rightStockId];
    case "final_stock_exact_change":
      return finalChange(proof.stockId) === proof.delta;
    case "stock_reaches_price_at_least":
      return priceHistory[proof.stockId].some((price) => price >= proof.price);
    case "stock_reaches_price_at_most":
      return priceHistory[proof.stockId].some((price) => price <= proof.price);
    case "round_stock_direction":
      return proof.direction === "up"
        ? roundChange(proof.stockId, proof.roundNumber) > 0
        : roundChange(proof.stockId, proof.roundNumber) < 0;
    case "round_stock_exact_change":
      return roundChange(proof.stockId, proof.roundNumber) === proof.delta;
    case "round_tag_direction":
      return proof.direction === "up"
        ? tagRoundSum(proof.tagId, proof.roundNumber) > 0
        : tagRoundSum(proof.tagId, proof.roundNumber) < 0;
    case "round_market_balance": {
      let rising = 0;
      let falling = 0;
      for (const stock of STOCK_DEFINITIONS) {
        const change = roundChange(stock.id, proof.roundNumber);
        if (change > 0) {
          rising += 1;
        }
        if (change < 0) {
          falling += 1;
        }
      }
      return proof.relation === "more-up" ? rising > falling : rising < falling;
    }
    case "round_max_swing_at_least": {
      const values = STOCK_DEFINITIONS.map((stock) => roundChange(stock.id, proof.roundNumber));
      return proof.direction === "up"
        ? Math.max(...values) >= proof.magnitude
        : Math.min(...values) <= -proof.magnitude;
    }
    case "round_compare_magnitude":
      return proof.relation === "gt"
        ? Math.abs(roundChange(proof.leftStockId, proof.roundNumber)) >
            Math.abs(roundChange(proof.rightStockId, proof.roundNumber))
        : Math.abs(roundChange(proof.leftStockId, proof.roundNumber)) <
            Math.abs(roundChange(proof.rightStockId, proof.roundNumber));
    case "round_stock_rank": {
      const sorted = [...STOCK_DEFINITIONS]
        .map((stock) => ({
          stockId: stock.id,
          change: roundChange(stock.id, proof.roundNumber),
        }))
        .sort((left, right) => {
          if (proof.rankType === "top-up") {
            return right.change - left.change || left.stockId.localeCompare(right.stockId);
          }
          return left.change - right.change || left.stockId.localeCompare(right.stockId);
        });
      return sorted[0]?.stockId === proof.stockId;
    }
  }
}
