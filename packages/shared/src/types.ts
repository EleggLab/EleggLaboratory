import type {
  AD_TAGS,
  PRICE_OPTIONS,
  STOCK_DEFINITIONS,
  TAG_DEFINITIONS,
} from "./config";

export type PriceOption = (typeof PRICE_OPTIONS)[number];
export type AdTag = (typeof AD_TAGS)[number];
export type StockId = (typeof STOCK_DEFINITIONS)[number]["id"];
export type StockCode = (typeof STOCK_DEFINITIONS)[number]["code"];
export type TagId = (typeof TAG_DEFINITIONS)[number];

export type RoomPhase =
  | "LOBBY"
  | "ROUND_SETUP"
  | "HINT_MARKET_OPEN"
  | "STOCK_MARKET_OPEN"
  | "ROUND_SETTLEMENT"
  | "GAME_END";

export type RoomStatus = "LOBBY" | "IN_GAME" | "GAME_END";
export type HintAudience = "public" | "private";
export type PhaseType = "overall" | "round";
export type TargetType = "single" | "tag" | "market";
export type InfoType = "up" | "down" | "compare" | "exact";
export type OrderStatus = "open" | "filled" | "cancelled" | "expired";
export type StockActionType = "buy" | "sell";

export interface Player {
  id: string;
  token: string;
  nickname: string;
  isHost: boolean;
  connected: boolean;
  cash: number;
  reservedCash: number;
  holdings: Record<StockId, number>;
  readableHintIds: string[];
  joinedAt: number;
}

export interface Stock {
  id: StockId;
  code: StockCode;
  name: string;
  tags: TagId[];
  currentPrice: number;
  priceHistory: number[];
}

export type HintProof =
  | {
      kind: "final_stock_direction";
      stockId: StockId;
      direction: "up" | "down";
    }
  | {
      kind: "final_tag_direction";
      tagId: TagId;
      direction: "up" | "down";
    }
  | {
      kind: "final_compare";
      leftStockId: StockId;
      rightStockId: StockId;
      relation: "gt" | "lt";
    }
  | {
      kind: "final_stock_exact_change";
      stockId: StockId;
      delta: number;
    }
  | {
      kind: "stock_reaches_price_at_least";
      stockId: StockId;
      price: number;
    }
  | {
      kind: "stock_reaches_price_at_most";
      stockId: StockId;
      price: number;
    }
  | {
      kind: "round_stock_direction";
      roundNumber: number;
      stockId: StockId;
      direction: "up" | "down";
    }
  | {
      kind: "round_stock_exact_change";
      roundNumber: number;
      stockId: StockId;
      delta: number;
    }
  | {
      kind: "round_tag_direction";
      roundNumber: number;
      tagId: TagId;
      direction: "up" | "down";
    }
  | {
      kind: "round_market_balance";
      roundNumber: number;
      relation: "more-up" | "more-down";
    }
  | {
      kind: "round_max_swing_at_least";
      roundNumber: number;
      direction: "up" | "down";
      magnitude: number;
    }
  | {
      kind: "round_compare_magnitude";
      roundNumber: number;
      leftStockId: StockId;
      rightStockId: StockId;
      relation: "gt" | "lt";
    }
  | {
      kind: "round_stock_rank";
      roundNumber: number;
      stockId: StockId;
      rankType: "top-up" | "top-down";
    };

export interface Hint {
  id: string;
  audience: HintAudience;
  ownerPlayerId: string | null;
  phaseType: PhaseType;
  targetType: TargetType;
  infoType: InfoType;
  roundNumber: number | null;
  content: string;
  tradeable: boolean;
  soldOnce: boolean;
  acquiredRound: number | null;
  readableBy: string[];
  proof: HintProof;
}

export interface SellOrder {
  id: string;
  sellerPlayerId: string;
  hintId: string;
  phaseType: PhaseType;
  targetType: TargetType;
  infoType: InfoType;
  price: PriceOption;
  adTag: AdTag;
  createdAt: number;
  status: OrderStatus;
}

export interface BuyRequest {
  id: string;
  buyerPlayerId: string;
  phaseType: PhaseType;
  targetType: TargetType;
  infoType: InfoType;
  price: PriceOption;
  createdAt: number;
  status: OrderStatus;
}

export interface TradeLog {
  id: string;
  roundNumber: number;
  sellerPlayerId: string;
  buyerPlayerId: string;
  phaseType: PhaseType;
  targetType: TargetType;
  infoType: InfoType;
  price: PriceOption;
  createdAt: number;
}

export interface StockActionLog {
  id: string;
  roundNumber: number;
  playerId: string;
  stockId: StockId;
  action: StockActionType;
  price: number;
  createdAt: number;
}

export interface RoundPriceChange {
  stockId: StockId;
  stockName: string;
  beforePrice: number;
  afterPrice: number;
  delta: number;
}

export interface RoundSummary {
  roundNumber: number;
  cashDelta: number;
  holdingsValueDelta: number;
  netWorthDelta: number;
  rank: number;
  tradeCount: number;
  hintTradeCount: number;
  stockActionCount: number;
  stockChanges: RoundPriceChange[];
}

export interface LeaderboardEntry {
  playerId: string;
  nickname: string;
  netWorth: number;
  rank: number;
}

export interface RoundBaseline {
  cash: number;
  holdingsValue: number;
  netWorth: number;
}

export interface PlayerPublicView {
  id: string;
  nickname: string;
  isHost: boolean;
  connected: boolean;
  phaseDone: boolean;
  netWorth: number;
  rank: number;
}

export interface PlayerSelfView {
  id: string;
  nickname: string;
  isHost: boolean;
  cash: number;
  reservedCash: number;
  netWorth: number;
  holdings: Record<StockId, number>;
  stockActionsUsed: number;
  stockActionsRemaining: number;
}

export interface StockPublicView {
  id: StockId;
  code: StockCode;
  name: string;
  tags: TagId[];
  currentPrice: number;
  priceHistory: number[];
}

export interface PublicHintView {
  id: string;
  phaseType: PhaseType;
  targetType: TargetType;
  infoType: InfoType;
  roundNumber: number | null;
  content: string;
}

export interface ReadableHintView extends PublicHintView {
  ownerPlayerId: string | null;
  acquiredRound: number | null;
  soldOnce: boolean;
  canSell: boolean;
  sellBlockedReason: string | null;
}

export interface SellOrderView {
  id: string;
  sellerPlayerId: string;
  phaseType: PhaseType;
  targetType: TargetType;
  infoType: InfoType;
  price: PriceOption;
  adTag: AdTag;
  createdAt: number;
  status: OrderStatus;
}

export interface BuyRequestView {
  id: string;
  buyerPlayerId: string;
  phaseType: PhaseType;
  targetType: TargetType;
  infoType: InfoType;
  price: PriceOption;
  createdAt: number;
  status: OrderStatus;
}

export interface TradeLogView extends TradeLog {}
export interface StockActionLogView extends StockActionLog {}

export interface HintMetaFilter {
  phaseType?: PhaseType;
  targetType?: TargetType;
  infoType?: InfoType;
}

export interface RoomState {
  roomCode: string;
  seed: string;
  status: RoomStatus;
  phase: RoomPhase;
  roundNumber: number;
  phaseStartedAt: number | null;
  phaseEndsAt: number | null;
  players: Record<string, Player>;
  stocks: Record<StockId, Stock>;
  stockDeltaMatrix: Record<StockId, number[]>;
  hints: Record<string, Hint>;
  publicOverallHintId: string | null;
  publicRoundHintIdsByRound: Record<number, string>;
  privateOverallHintIdsByPlayer: Record<string, string>;
  privateRoundHintIdsByRound: Record<number, Record<string, string>>;
  revealedPublicHintIds: string[];
  sellOrders: Record<string, SellOrder>;
  buyRequests: Record<string, BuyRequest>;
  tradeLogs: TradeLog[];
  stockActionLogs: StockActionLog[];
  roundSummariesByPlayer: Record<string, RoundSummary>;
  roundBaselines: Record<string, RoundBaseline>;
  phaseReadyPlayerIds: string[];
  leaderboard: LeaderboardEntry[];
  createdAt: number;
  updatedAt: number;
  cleanupAt: number | null;
}

export interface RedactedRoomSnapshot {
  roomCode: string;
  status: RoomStatus;
  phase: RoomPhase;
  roundNumber: number;
  phaseStartedAt: number | null;
  phaseEndsAt: number | null;
  phaseReadyPlayerIds: string[];
  serverNow: number;
  players: PlayerPublicView[];
  stocks: StockPublicView[];
  publicHints: PublicHintView[];
  sellOrders: SellOrderView[];
  buyRequests: BuyRequestView[];
  hintMarketLimits: {
    maxSellOrders: number;
    maxBuyRequests: number;
  };
  tradeLogs: TradeLogView[];
  leaderboard: LeaderboardEntry[];
  self: PlayerSelfView;
  readableHints: ReadableHintView[];
  myRecentStockActions: StockActionLogView[];
  lastRoundSummary: RoundSummary | null;
  reconnectTokenAccepted: boolean;
}

export interface CreateRoomResponse {
  roomCode: string;
  playerToken: string;
  playerId: string;
  isHost: boolean;
}

export interface JoinRoomResponse extends CreateRoomResponse {}

export type ClientAction =
  | { type: "hello"; playerToken: string }
  | { type: "startGame"; playerToken: string }
  | {
      type: "placeSellOrder";
      playerToken: string;
      hintId: string;
      price: PriceOption;
      adTag: AdTag;
    }
  | { type: "cancelSellOrder"; playerToken: string; orderId: string }
  | {
      type: "placeBuyRequest";
      playerToken: string;
      phaseType: PhaseType;
      targetType: TargetType;
      infoType: InfoType;
      price: PriceOption;
    }
  | { type: "cancelBuyRequest"; playerToken: string; requestId: string }
  | {
      type: "fulfillBuyRequest";
      playerToken: string;
      requestId: string;
      hintId: string;
    }
  | { type: "buySellOrder"; playerToken: string; orderId: string }
  | { type: "buyStock"; playerToken: string; stockId: StockId }
  | { type: "sellStock"; playerToken: string; stockId: StockId }
  | { type: "endTurn"; playerToken: string }
  | { type: "leaveRoom"; playerToken: string }
  | { type: "ping"; playerToken: string; now: number };

export type ServerEvent =
  | { type: "reconnectAccepted"; playerId: string }
  | { type: "roomSnapshot"; snapshot: RedactedRoomSnapshot }
  | {
      type: "roomPlayersUpdated";
      players: PlayerPublicView[];
      leaderboard: LeaderboardEntry[];
    }
  | { type: "gameStarted"; roundNumber: number }
  | {
      type: "phaseStarted";
      phase: RoomPhase;
      roundNumber: number;
      phaseStartedAt: number | null;
      phaseEndsAt: number | null;
    }
  | { type: "publicHintRevealed"; hint: PublicHintView }
  | { type: "privateHintDelivered"; hint: ReadableHintView }
  | {
      type: "orderBookUpdated";
      sellOrders: SellOrderView[];
      buyRequests: BuyRequestView[];
      tradeLogs: TradeLogView[];
    }
  | { type: "tradeExecuted"; tradeLog: TradeLogView }
  | { type: "stockActionApplied"; action: StockActionLogView }
  | { type: "roundSettled"; summary: RoundSummary | null }
  | {
      type: "gameEnded";
      leaderboard: LeaderboardEntry[];
      finalSummary: RoundSummary | null;
    }
  | { type: "pong"; now: number }
  | { type: "error"; message: string };
