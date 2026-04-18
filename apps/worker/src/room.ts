import {
  MIN_PLAYERS,
  ROUND_COUNT,
  ROOM_CLEANUP_MS,
  START_CASH,
  START_PRICE,
} from "@tong/shared/config";
import {
  clientActionSchema,
  createRoomBodySchema,
  joinRoomBodySchema,
  startGameBodySchema,
} from "@tong/shared/schema";
import type {
  ClientAction,
  JoinRoomResponse,
  PlayerPublicView,
  RoomState,
  ServerEvent,
  StockActionLog,
  TradeLog,
} from "@tong/shared/types";
import { getConnectedPlayerCount } from "@tong/shared/utils";
import { generateStockDeltaMatrix } from "./game/generator";
import { generateHintPack } from "./game/hints";
import {
  buySellOrder,
  cancelBuyRequest,
  cancelSellOrder,
  fulfillBuyRequest,
  placeBuyRequest,
  placeSellOrder,
} from "./game/orders";
import {
  finishSettlement,
  getNextAlarmTime,
  isPhaseAdvanceReady,
  markPlayerReady,
  openHintMarket,
  openSettlement,
  openStockMarket,
  shouldCleanupRoom,
} from "./game/phase";
import { serializeSnapshot } from "./game/serializers";
import { applyStockAction } from "./game/settlement";
import {
  createPlayer,
  createRoomState,
  getPlayerByToken,
  refreshLeaderboard,
  resetPlayerForGame,
  transferHostIfNeeded,
} from "./utils/state";

export interface Env {
  ROOMS: DurableObjectNamespace;
  ASSETS: Fetcher;
}

interface WebSocketAttachment {
  playerId: string;
  playerToken: string;
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export class GameRoomDurableObject {
  private roomState: RoomState | null = null;

  constructor(
    private readonly state: DurableObjectState,
    private readonly env: Env,
  ) {
    void this.state.blockConcurrencyWhile(async () => {
      this.roomState = (await this.state.storage.get<RoomState>("roomState")) ?? null;
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    try {
      if (url.pathname === "/exists") {
        return jsonResponse({
          initialized: Boolean(this.roomState && Object.keys(this.roomState.players).length > 0),
        });
      }

      if (url.pathname === "/create" && request.method === "POST") {
        const body = createRoomBodySchema.parse(await request.json());
        const roomCode = url.searchParams.get("roomCode");
        if (!roomCode) {
          return jsonResponse({ message: "방 코드를 찾지 못했습니다." }, 400);
        }
        return this.handleCreate(roomCode, body.nickname);
      }

      if (url.pathname === "/join" && request.method === "POST") {
        const body = joinRoomBodySchema.parse(await request.json());
        return this.handleJoin(body.nickname, body.playerToken);
      }

      if (url.pathname === "/start" && request.method === "POST") {
        const body = startGameBodySchema.parse(await request.json());
        await this.startGame(body.playerToken, Date.now());
        return jsonResponse({ ok: true });
      }

      if (url.pathname === "/ws" && request.headers.get("Upgrade") === "websocket") {
        return this.handleWebSocket(url.searchParams.get("playerToken"));
      }

      return jsonResponse({ message: "지원하지 않는 요청입니다." }, 404);
    } catch (error) {
      const message = error instanceof Error ? error.message : "요청을 처리하지 못했습니다.";
      return jsonResponse({ message }, 400);
    }
  }

  async alarm(): Promise<void> {
    const current = this.requireState();
    const now = Date.now();

    if (shouldCleanupRoom(current, now, this.getActivePlayerIds().length)) {
      await this.state.storage.deleteAll();
      this.roomState = null;
      return;
    }

    await this.persistState();
  }

  webSocketMessage(webSocket: WebSocket, message: ArrayBuffer | string): void | Promise<void> {
    const rawMessage =
      typeof message === "string" ? message : new TextDecoder().decode(message as ArrayBuffer);
    const action = clientActionSchema.parse(JSON.parse(rawMessage)) as ClientAction;
    return this.handleClientAction(webSocket, action);
  }

  webSocketClose(webSocket: WebSocket): void | Promise<void> {
    return this.handleSocketClosed(webSocket);
  }

  webSocketError(webSocket: WebSocket): void | Promise<void> {
    return this.handleSocketClosed(webSocket);
  }

  private requireState(): RoomState {
    if (!this.roomState) {
      throw new Error("방 상태를 찾을 수 없습니다.");
    }
    return this.roomState;
  }

  private async handleCreate(roomCode: string, nickname: string): Promise<Response> {
    const now = Date.now();
    if (!this.roomState || Object.keys(this.roomState.players).length === 0) {
      this.roomState = createRoomState(roomCode, now);
    } else {
      throw new Error("이미 사용 중인 방 코드입니다.");
    }

    const player = createPlayer(nickname, true, now);
    this.roomState.players[player.id] = player;
    this.roomState.updatedAt = now;
    refreshLeaderboard(this.roomState);
    await this.persistState();

    return jsonResponse({
      roomCode: this.roomState.roomCode,
      playerToken: player.token,
      playerId: player.id,
      isHost: true,
    });
  }

  private async handleJoin(nickname: string, playerToken?: string): Promise<Response> {
    const state = this.requireState();
    const now = Date.now();
    let player = playerToken ? getPlayerByToken(state, playerToken) : undefined;

    if (player) {
      player.connected = false;
      state.updatedAt = now;
      state.cleanupAt = null;
      await this.persistState();
      return jsonResponse({
        roomCode: state.roomCode,
        playerToken: player.token,
        playerId: player.id,
        isHost: player.isHost,
      } satisfies JoinRoomResponse);
    }

    if (state.status !== "LOBBY") {
      throw new Error("게임 진행 중에는 새로 참가할 수 없습니다.");
    }
    if (Object.keys(state.players).length >= 4) {
      throw new Error("방이 가득 찼습니다.");
    }

    player = createPlayer(nickname, false, now);
    state.players[player.id] = player;
    state.updatedAt = now;
    refreshLeaderboard(state);
    await this.persistState();

    return jsonResponse({
      roomCode: state.roomCode,
      playerToken: player.token,
      playerId: player.id,
      isHost: false,
    } satisfies JoinRoomResponse);
  }

  private async handleWebSocket(playerToken: string | null): Promise<Response> {
    if (!playerToken) {
      return new Response("playerToken missing", { status: 400 });
    }
    const state = this.requireState();
    const player = getPlayerByToken(state, playerToken);
    if (!player) {
      return new Response("unknown player", { status: 403 });
    }

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    const attachment: WebSocketAttachment = { playerId: player.id, playerToken };

    this.closeExistingSockets(player.id);
    (server as WebSocket & { serializeAttachment(value: unknown): void }).serializeAttachment(
      attachment,
    );
    this.state.acceptWebSocket(server);

    player.connected = true;
    state.updatedAt = Date.now();
    state.cleanupAt = null;
    await this.persistState();

    await this.sendEventToPlayer(player.id, {
      type: "reconnectAccepted",
      playerId: player.id,
    });
    await this.sendSnapshotToPlayer(player.id, true);
    await this.broadcastPlayersUpdated();
    await this.broadcastSnapshots();

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  private closeExistingSockets(playerId: string): void {
    for (const socket of this.state.getWebSockets()) {
      const attachment = (
        socket as WebSocket & { deserializeAttachment(): WebSocketAttachment | null }
      ).deserializeAttachment();
      if (attachment?.playerId === playerId) {
        socket.close(4000, "reconnected");
      }
    }
  }

  private async handleClientAction(webSocket: WebSocket, action: ClientAction): Promise<void> {
    const state = this.requireState();
    const attachment = (
      webSocket as WebSocket & { deserializeAttachment(): WebSocketAttachment | null }
    ).deserializeAttachment();
    const player = attachment?.playerToken
      ? getPlayerByToken(state, attachment.playerToken)
      : undefined;
    if (!player || player.token !== action.playerToken) {
      await this.sendEvent(webSocket, { type: "error", message: "세션이 유효하지 않습니다." });
      return;
    }

    const now = Date.now();
    try {
      switch (action.type) {
        case "hello":
          await this.sendSnapshotToPlayer(player.id, true);
          break;
        case "startGame":
          await this.startGame(player.token, now);
          break;
        case "placeSellOrder":
          this.ensurePlayerCanAct(state, player.id);
          placeSellOrder(state, player.id, action.hintId, action.price, action.adTag, now);
          await this.persistState();
          await this.broadcastOrderBook();
          await this.broadcastSnapshots();
          break;
        case "cancelSellOrder":
          this.ensurePlayerCanAct(state, player.id);
          cancelSellOrder(state, player.id, action.orderId, now);
          await this.persistState();
          await this.broadcastOrderBook();
          await this.broadcastSnapshots();
          break;
        case "placeBuyRequest":
          this.ensurePlayerCanAct(state, player.id);
          placeBuyRequest(
            state,
            player.id,
            {
              phaseType: action.phaseType,
              targetType: action.targetType,
              infoType: action.infoType,
              price: action.price,
            },
            now,
          );
          await this.persistState();
          await this.broadcastOrderBook();
          await this.broadcastSnapshots();
          break;
        case "cancelBuyRequest":
          this.ensurePlayerCanAct(state, player.id);
          cancelBuyRequest(state, player.id, action.requestId, now);
          await this.persistState();
          await this.broadcastOrderBook();
          await this.broadcastSnapshots();
          break;
        case "fulfillBuyRequest": {
          this.ensurePlayerCanAct(state, player.id);
          const tradeLog = fulfillBuyRequest(state, player.id, action.requestId, action.hintId, now);
          await this.persistState();
          await this.broadcastTradeExecuted(tradeLog);
          await this.broadcastOrderBook();
          await this.broadcastSnapshots();
          break;
        }
        case "buySellOrder": {
          this.ensurePlayerCanAct(state, player.id);
          const tradeLog = buySellOrder(state, player.id, action.orderId, now);
          await this.persistState();
          await this.broadcastTradeExecuted(tradeLog);
          await this.broadcastOrderBook();
          await this.broadcastSnapshots();
          break;
        }
        case "buyStock": {
          this.ensurePlayerCanAct(state, player.id);
          const log = applyStockAction(state, player.id, action.stockId, "buy", now);
          await this.persistState();
          await this.broadcastStockAction(log);
          await this.broadcastSnapshots();
          break;
        }
        case "sellStock": {
          this.ensurePlayerCanAct(state, player.id);
          const log = applyStockAction(state, player.id, action.stockId, "sell", now);
          await this.persistState();
          await this.broadcastStockAction(log);
          await this.broadcastSnapshots();
          break;
        }
        case "endTurn": {
          if (
            state.phase !== "HINT_MARKET_OPEN" &&
            state.phase !== "STOCK_MARKET_OPEN" &&
            state.phase !== "ROUND_SETTLEMENT"
          ) {
            throw new Error("지금은 턴 종료를 할 수 없습니다.");
          }
          markPlayerReady(state, player.id);
          state.updatedAt = now;
          await this.persistState();
          const advanced = await this.tryAdvancePhase(now);
          if (!advanced) {
            await this.broadcastPlayersUpdated();
            await this.broadcastSnapshots();
          }
          break;
        }
        case "leaveRoom":
          if (state.phase !== "LOBBY") {
            throw new Error("게임 시작 후에는 방을 나갈 수 없습니다.");
          }
          delete state.players[player.id];
          transferHostIfNeeded(state);
          refreshLeaderboard(state);
          state.updatedAt = now;
          if (Object.keys(state.players).length === 0) {
            state.cleanupAt = now + 60_000;
          }
          await this.persistState();
          webSocket.close(1000, "leave");
          await this.broadcastPlayersUpdated();
          await this.broadcastSnapshots();
          break;
        case "ping":
          await this.sendEvent(webSocket, { type: "pong", now: action.now });
          break;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "요청을 처리하지 못했습니다.";
      await this.sendEvent(webSocket, { type: "error", message });
    }
  }

  private async startGame(playerToken: string, now: number): Promise<void> {
    const state = this.requireState();
    const player = getPlayerByToken(state, playerToken);
    const connectedPlayerCount = getConnectedPlayerCount(Object.values(state.players));
    if (!player) {
      throw new Error("플레이어를 찾을 수 없습니다.");
    }
    if (!player.isHost) {
      throw new Error("호스트만 게임을 시작할 수 있습니다.");
    }
    if (connectedPlayerCount < MIN_PLAYERS) {
      throw new Error("최소 두 명이 있어야 시작할 수 있습니다.");
    }
    if (state.status !== "LOBBY") {
      throw new Error("이미 시작된 게임입니다.");
    }

    const generatedMarket = generateStockDeltaMatrix(state.seed);
    state.status = "IN_GAME";
    state.phase = "ROUND_SETUP";
    state.sellOrders = {};
    state.buyRequests = {};
    state.tradeLogs = [];
    state.stockActionLogs = [];
    state.roundSummariesByPlayer = {};
    state.roundBaselines = {};
    state.revealedPublicHintIds = [];
    for (const stock of Object.values(state.stocks)) {
      stock.currentPrice = START_PRICE;
      stock.priceHistory = [START_PRICE];
    }
    state.stockDeltaMatrix = generatedMarket.stockDeltaMatrix;
    state.players = Object.fromEntries(
      Object.values(state.players).map((entry) => [
        entry.id,
        { ...resetPlayerForGame(entry), connected: entry.connected },
      ]),
    );
    const hintPack = generateHintPack(state.seed, Object.values(state.players), state.stockDeltaMatrix);
    state.hints = hintPack.hints;
    state.publicOverallHintId = hintPack.publicOverallHintId;
    state.privateOverallHintIdsByPlayer = hintPack.privateOverallHintIdsByPlayer;
    state.publicRoundHintIdsByRound = hintPack.publicRoundHintIdsByRound;
    state.privateRoundHintIdsByRound = hintPack.privateRoundHintIdsByRound;

    const transition = openHintMarket(state, 1, now);
    refreshLeaderboard(state);
    await this.persistState();
    await this.broadcastEventToAll({ type: "gameStarted", roundNumber: 1 });
    await this.broadcastHintReveal(transition);
    await this.broadcastPhaseStarted();
    await this.broadcastSnapshots();
  }

  private async handleSocketClosed(webSocket: WebSocket): Promise<void> {
    const state = this.roomState;
    if (!state) {
      return;
    }
    const attachment = (
      webSocket as WebSocket & { deserializeAttachment(): WebSocketAttachment | null }
    ).deserializeAttachment();
    if (!attachment) {
      return;
    }
    const player = state.players[attachment.playerId];
    if (!player) {
      return;
    }

    const hasAnotherSocket = this.state
      .getWebSockets()
      .filter((socket) => socket !== webSocket)
      .some((socket) => {
        const otherAttachment = (
          socket as WebSocket & { deserializeAttachment(): WebSocketAttachment | null }
        ).deserializeAttachment();
        return otherAttachment?.playerId === player.id;
      });

    if (!hasAnotherSocket) {
      player.connected = false;
      state.updatedAt = Date.now();
      state.cleanupAt = Date.now() + ROOM_CLEANUP_MS;
      await this.persistState();
      const advanced = await this.tryAdvancePhase(Date.now());
      if (!advanced) {
        await this.broadcastPlayersUpdated();
        await this.broadcastSnapshots();
      }
    }
  }

  private ensurePlayerCanAct(state: RoomState, playerId: string): void {
    if (state.phaseReadyPlayerIds.includes(playerId)) {
      throw new Error("이미 턴 종료를 눌렀습니다.");
    }
  }

  private async tryAdvancePhase(now: number): Promise<boolean> {
    const state = this.requireState();
    if (!isPhaseAdvanceReady(state)) {
      return false;
    }

    if (state.phase === "HINT_MARKET_OPEN") {
      openStockMarket(state, now);
      await this.persistState();
      await this.broadcastPlayersUpdated();
      await this.broadcastPhaseStarted();
      await this.broadcastSnapshots();
      return true;
    }

    if (state.phase === "STOCK_MARKET_OPEN") {
      openSettlement(state, now);
      await this.persistState();
      await this.broadcastPlayersUpdated();
      await this.broadcastPhaseStarted();
      await this.broadcastRoundSettled();
      return true;
    }

    if (state.phase === "ROUND_SETTLEMENT") {
      const ended = state.roundNumber >= ROUND_COUNT;
      const transition = finishSettlement(state, now);
      await this.persistState();
      await this.broadcastPlayersUpdated();
      if (ended) {
        await this.broadcastGameEnded();
      } else {
        await this.broadcastHintReveal(transition);
        await this.broadcastPhaseStarted();
        await this.broadcastSnapshots();
      }
      return true;
    }

    return false;
  }

  private getActivePlayerIds(): string[] {
    const active = new Set<string>();
    for (const socket of this.state.getWebSockets()) {
      const attachment = (
        socket as WebSocket & { deserializeAttachment(): WebSocketAttachment | null }
      ).deserializeAttachment();
      if (attachment?.playerId) {
        active.add(attachment.playerId);
      }
    }
    return [...active];
  }

  private async sendEvent(webSocket: WebSocket, event: ServerEvent): Promise<void> {
    try {
      webSocket.send(JSON.stringify(event));
    } catch {
      webSocket.close(1011, "send-failed");
    }
  }

  private async sendEventToPlayer(playerId: string, event: ServerEvent): Promise<void> {
    for (const socket of this.state.getWebSockets()) {
      const attachment = (
        socket as WebSocket & { deserializeAttachment(): WebSocketAttachment | null }
      ).deserializeAttachment();
      if (attachment?.playerId === playerId) {
        await this.sendEvent(socket, event);
      }
    }
  }

  private async broadcastEventToAll(event: ServerEvent): Promise<void> {
    for (const socket of this.state.getWebSockets()) {
      await this.sendEvent(socket, event);
    }
  }

  private async sendSnapshotToPlayer(playerId: string, reconnectTokenAccepted = false): Promise<void> {
    const state = this.requireState();
    const snapshot = serializeSnapshot(state, playerId, Date.now(), reconnectTokenAccepted);
    await this.sendEventToPlayer(playerId, { type: "roomSnapshot", snapshot });
  }

  private async broadcastSnapshots(): Promise<void> {
    const state = this.requireState();
    for (const socket of this.state.getWebSockets()) {
      const attachment = (
        socket as WebSocket & { deserializeAttachment(): WebSocketAttachment | null }
      ).deserializeAttachment();
      if (!attachment?.playerId || !state.players[attachment.playerId]) {
        continue;
      }
      const snapshot = serializeSnapshot(state, attachment.playerId, Date.now());
      await this.sendEvent(socket, { type: "roomSnapshot", snapshot });
    }
  }

  private async broadcastPlayersUpdated(): Promise<void> {
    const state = this.requireState();
    const players: PlayerPublicView[] = Object.values(state.players)
      .map((entry) => ({
        id: entry.id,
        nickname: entry.nickname,
        isHost: entry.isHost,
        connected: entry.connected,
        phaseDone: state.phaseReadyPlayerIds.includes(entry.id),
        netWorth: state.leaderboard.find((item) => item.playerId === entry.id)?.netWorth ?? START_CASH,
        rank: state.leaderboard.find((item) => item.playerId === entry.id)?.rank ?? 0,
      }))
      .sort((left, right) => left.rank - right.rank || left.nickname.localeCompare(right.nickname, "ko"));
    await this.broadcastEventToAll({
      type: "roomPlayersUpdated",
      players,
      leaderboard: state.leaderboard,
    });
  }

  private async broadcastPhaseStarted(): Promise<void> {
    const state = this.requireState();
    await this.broadcastEventToAll({
      type: "phaseStarted",
      phase: state.phase,
      roundNumber: state.roundNumber,
      phaseStartedAt: state.phaseStartedAt,
      phaseEndsAt: state.phaseEndsAt,
    });
  }

  private async broadcastHintReveal(transition: {
    newPublicHintIds: string[];
    newPrivateHintIdsByPlayer: Record<string, string[]>;
  }): Promise<void> {
    const state = this.requireState();
    for (const hintId of transition.newPublicHintIds) {
      const hint = state.hints[hintId]!;
      await this.broadcastEventToAll({
        type: "publicHintRevealed",
        hint: {
          id: hint.id,
          phaseType: hint.phaseType,
          targetType: hint.targetType,
          infoType: hint.infoType,
          roundNumber: hint.roundNumber,
          content: hint.content,
        },
      });
    }

    for (const [playerId, hintIds] of Object.entries(transition.newPrivateHintIdsByPlayer)) {
      const snapshot = serializeSnapshot(state, playerId, Date.now());
      for (const hintId of hintIds) {
        const hint = snapshot.readableHints.find((item) => item.id === hintId);
        if (hint) {
          await this.sendEventToPlayer(playerId, { type: "privateHintDelivered", hint });
        }
      }
    }
  }

  private async broadcastOrderBook(): Promise<void> {
    const state = this.requireState();
    const samplePlayer = Object.values(state.players)[0];
    if (!samplePlayer) {
      return;
    }
    const snapshot = serializeSnapshot(state, samplePlayer.id, Date.now());
    await this.broadcastEventToAll({
      type: "orderBookUpdated",
      sellOrders: snapshot.sellOrders,
      buyRequests: snapshot.buyRequests,
      tradeLogs: snapshot.tradeLogs,
    });
  }

  private async broadcastTradeExecuted(tradeLog: TradeLog): Promise<void> {
    await this.broadcastEventToAll({ type: "tradeExecuted", tradeLog });
  }

  private async broadcastStockAction(action: StockActionLog): Promise<void> {
    await this.broadcastEventToAll({ type: "stockActionApplied", action });
  }

  private async broadcastRoundSettled(): Promise<void> {
    const state = this.requireState();
    for (const player of Object.values(state.players)) {
      await this.sendEventToPlayer(player.id, {
        type: "roundSettled",
        summary: state.roundSummariesByPlayer[player.id] ?? null,
      });
    }
    await this.broadcastSnapshots();
  }

  private async broadcastGameEnded(): Promise<void> {
    const state = this.requireState();
    for (const player of Object.values(state.players)) {
      await this.sendEventToPlayer(player.id, {
        type: "gameEnded",
        leaderboard: state.leaderboard,
        finalSummary: state.roundSummariesByPlayer[player.id] ?? null,
      });
    }
    await this.broadcastSnapshots();
  }

  private async persistState(): Promise<void> {
    if (!this.roomState) {
      return;
    }
    await this.state.storage.put("roomState", this.roomState);
    const nextAlarm = getNextAlarmTime(this.roomState);
    if (nextAlarm) {
      await this.state.storage.setAlarm(nextAlarm);
    }
  }
}
