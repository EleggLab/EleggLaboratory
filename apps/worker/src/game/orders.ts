import type {
  BuyRequest,
  Hint,
  RoomState,
  SellOrder,
  TradeLog,
} from "@tong/shared/types";
import {
  createId,
  getFreeCash,
  getHintMarketLimits,
  isHintMetaMatch,
} from "@tong/shared/utils";
import { refreshLeaderboard } from "../utils/state";

function requireHintMarket(state: RoomState): void {
  if (state.phase !== "HINT_MARKET_OPEN") {
    throw new Error("지금은 힌트 거래 단계가 아닙니다.");
  }
}

function getOpenSellOrdersByPlayer(state: RoomState, playerId: string): SellOrder[] {
  return Object.values(state.sellOrders).filter(
    (order) => order.sellerPlayerId === playerId && order.status === "open",
  );
}

function getOpenBuyRequestsByPlayer(state: RoomState, playerId: string): BuyRequest[] {
  return Object.values(state.buyRequests).filter(
    (request) => request.buyerPlayerId === playerId && request.status === "open",
  );
}

export function getHintSellability(
  state: RoomState,
  playerId: string,
  hintId: string,
  options?: { ignoreOpenListing?: boolean },
): { hint: Hint; reason: string | null } {
  const hint = state.hints[hintId];
  if (!hint) {
    throw new Error("힌트를 찾을 수 없습니다.");
  }
  if (hint.audience !== "private") {
    return { hint, reason: "공개 힌트는 거래할 수 없습니다." };
  }
  if (hint.ownerPlayerId !== playerId) {
    return { hint, reason: "내 힌트만 판매할 수 있습니다." };
  }
  if (!hint.tradeable) {
    return { hint, reason: "이 힌트는 거래할 수 없습니다." };
  }
  if (hint.phaseType === "round" && hint.roundNumber !== state.roundNumber) {
    return { hint, reason: "지나간 라운드 힌트는 다시 거래할 수 없습니다." };
  }
  if (hint.soldOnce) {
    return { hint, reason: "이미 한 번 판매한 힌트입니다." };
  }
  if ((hint.acquiredRound ?? -1) === state.roundNumber) {
    return { hint, reason: "이번 라운드에 산 힌트는 다시 팔 수 없습니다." };
  }
  if (
    !options?.ignoreOpenListing &&
    getOpenSellOrdersByPlayer(state, playerId).some((order) => order.hintId === hintId)
  ) {
    return { hint, reason: "이미 주문장에 올린 힌트입니다." };
  }
  return { hint, reason: null };
}

export function placeSellOrder(
  state: RoomState,
  playerId: string,
  hintId: string,
  price: SellOrder["price"],
  adTag: SellOrder["adTag"],
  now: number,
): SellOrder {
  requireHintMarket(state);
  const { maxSellOrders } = getHintMarketLimits(Object.keys(state.players).length);
  if (getOpenSellOrdersByPlayer(state, playerId).length >= maxSellOrders) {
    throw new Error(`판매 주문은 ${maxSellOrders}개까지만 올릴 수 있습니다.`);
  }

  const { hint, reason } = getHintSellability(state, playerId, hintId);
  if (reason) {
    throw new Error(reason);
  }

  const order: SellOrder = {
    id: createId("sell"),
    sellerPlayerId: playerId,
    hintId,
    phaseType: hint.phaseType,
    targetType: hint.targetType,
    infoType: hint.infoType,
    price,
    adTag,
    createdAt: now,
    status: "open",
  };
  state.sellOrders[order.id] = order;
  state.updatedAt = now;
  return order;
}

export function cancelSellOrder(state: RoomState, playerId: string, orderId: string, now: number): void {
  requireHintMarket(state);
  const order = state.sellOrders[orderId];
  if (!order || order.sellerPlayerId !== playerId || order.status !== "open") {
    throw new Error("취소할 판매 주문이 없습니다.");
  }
  order.status = "cancelled";
  state.updatedAt = now;
}

export function placeBuyRequest(
  state: RoomState,
  playerId: string,
  input: Pick<BuyRequest, "phaseType" | "targetType" | "infoType" | "price">,
  now: number,
): BuyRequest {
  requireHintMarket(state);
  const player = state.players[playerId];
  if (!player) {
    throw new Error("플레이어를 찾을 수 없습니다.");
  }
  const { maxBuyRequests } = getHintMarketLimits(Object.keys(state.players).length);
  if (getOpenBuyRequestsByPlayer(state, playerId).length >= maxBuyRequests) {
    throw new Error(`매수 요청은 ${maxBuyRequests}개까지만 올릴 수 있습니다.`);
  }
  if (getFreeCash(player) < input.price) {
    throw new Error("현금이 부족합니다.");
  }

  player.reservedCash += input.price;
  const request: BuyRequest = {
    id: createId("buy"),
    buyerPlayerId: playerId,
    phaseType: input.phaseType,
    targetType: input.targetType,
    infoType: input.infoType,
    price: input.price,
    createdAt: now,
    status: "open",
  };
  state.buyRequests[request.id] = request;
  state.updatedAt = now;
  refreshLeaderboard(state);
  return request;
}

export function cancelBuyRequest(state: RoomState, playerId: string, requestId: string, now: number): void {
  requireHintMarket(state);
  const request = state.buyRequests[requestId];
  if (!request || request.buyerPlayerId !== playerId || request.status !== "open") {
    throw new Error("취소할 매수 요청이 없습니다.");
  }
  const buyer = state.players[playerId]!;
  buyer.reservedCash -= request.price;
  request.status = "cancelled";
  state.updatedAt = now;
  refreshLeaderboard(state);
}

function deliverHintToBuyer(state: RoomState, hint: Hint, buyerPlayerId: string): void {
  hint.soldOnce = true;
  hint.acquiredRound = state.roundNumber;
  if (!hint.readableBy.includes(buyerPlayerId)) {
    hint.readableBy.push(buyerPlayerId);
  }
  const buyer = state.players[buyerPlayerId]!;
  if (!buyer.readableHintIds.includes(hint.id)) {
    buyer.readableHintIds.push(hint.id);
  }
}

function createTradeLog(
  state: RoomState,
  sellerPlayerId: string,
  buyerPlayerId: string,
  hint: Hint,
  price: number,
  now: number,
): TradeLog {
  const tradeLog: TradeLog = {
    id: createId("trade"),
    roundNumber: state.roundNumber,
    sellerPlayerId,
    buyerPlayerId,
    phaseType: hint.phaseType,
    targetType: hint.targetType,
    infoType: hint.infoType,
    price: price as TradeLog["price"],
    createdAt: now,
  };
  state.tradeLogs.push(tradeLog);
  return tradeLog;
}

export function buySellOrder(
  state: RoomState,
  buyerPlayerId: string,
  orderId: string,
  now: number,
): TradeLog {
  requireHintMarket(state);
  const order = state.sellOrders[orderId];
  if (!order || order.status !== "open") {
    throw new Error("구매할 판매 주문이 없습니다.");
  }
  if (order.sellerPlayerId === buyerPlayerId) {
    throw new Error("내 판매 주문은 살 수 없습니다.");
  }
  const buyer = state.players[buyerPlayerId];
  const seller = state.players[order.sellerPlayerId];
  if (!buyer || !seller) {
    throw new Error("플레이어를 찾을 수 없습니다.");
  }
  if (getFreeCash(buyer) < order.price) {
    throw new Error("현금이 부족합니다.");
  }

  const { hint, reason } = getHintSellability(state, seller.id, order.hintId, {
    ignoreOpenListing: true,
  });
  if (reason) {
    throw new Error(reason);
  }

  buyer.cash -= order.price;
  seller.cash += order.price;
  order.status = "filled";
  deliverHintToBuyer(state, hint, buyer.id);
  const tradeLog = createTradeLog(state, seller.id, buyer.id, hint, order.price, now);
  state.updatedAt = now;
  refreshLeaderboard(state);
  return tradeLog;
}

export function fulfillBuyRequest(
  state: RoomState,
  sellerPlayerId: string,
  requestId: string,
  hintId: string,
  now: number,
): TradeLog {
  requireHintMarket(state);
  const request = state.buyRequests[requestId];
  if (!request || request.status !== "open") {
    throw new Error("체결할 매수 요청이 없습니다.");
  }
  if (request.buyerPlayerId === sellerPlayerId) {
    throw new Error("내 매수 요청은 직접 채울 수 없습니다.");
  }

  const seller = state.players[sellerPlayerId];
  const buyer = state.players[request.buyerPlayerId];
  if (!seller || !buyer) {
    throw new Error("플레이어를 찾을 수 없습니다.");
  }

  const { hint, reason } = getHintSellability(state, sellerPlayerId, hintId);
  if (reason) {
    throw new Error(reason);
  }
  if (!isHintMetaMatch(hint, request)) {
    throw new Error("매수 요청 메타와 맞지 않는 힌트입니다.");
  }

  buyer.reservedCash -= request.price;
  seller.cash += request.price;
  request.status = "filled";
  deliverHintToBuyer(state, hint, buyer.id);
  const tradeLog = createTradeLog(state, seller.id, buyer.id, hint, request.price, now);
  state.updatedAt = now;
  refreshLeaderboard(state);
  return tradeLog;
}

export function expireOpenOrders(state: RoomState, now: number): boolean {
  let changed = false;
  for (const order of Object.values(state.sellOrders)) {
    if (order.status === "open") {
      order.status = "expired";
      changed = true;
    }
  }
  for (const request of Object.values(state.buyRequests)) {
    if (request.status === "open") {
      const buyer = state.players[request.buyerPlayerId];
      if (buyer) {
        buyer.reservedCash -= request.price;
      }
      request.status = "expired";
      changed = true;
    }
  }
  if (changed) {
    state.updatedAt = now;
    refreshLeaderboard(state);
  }
  return changed;
}
