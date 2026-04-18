import { useSyncExternalStore } from "react";
import type {
  ClientAction,
  RedactedRoomSnapshot,
  ServerEvent,
} from "@tong/shared/types";
import { createRoom, joinRoom, startGame } from "../lib/api";
import {
  clearSession,
  loadNickname,
  loadSession,
  saveNickname,
  saveSession,
  type SavedSession,
} from "../lib/storage";
import { getServerOffset } from "../lib/time";
import { connectGameWebSocket } from "../lib/ws";

export interface ToastItem {
  id: string;
  tone: "info" | "success" | "error";
  message: string;
}

export interface GameStoreState {
  nickname: string;
  session: SavedSession | null;
  snapshot: RedactedRoomSnapshot | null;
  connectionStatus: "idle" | "connecting" | "connected" | "reconnecting" | "disconnected";
  serverOffsetMs: number;
  lastError: string | null;
  toasts: ToastItem[];
}

class GameStore {
  private state: GameStoreState = {
    nickname: loadNickname(),
    session: loadSession(),
    snapshot: null,
    connectionStatus: "idle",
    serverOffsetMs: 0,
    lastError: null,
    toasts: [],
  };

  private listeners = new Set<() => void>();
  private socket: WebSocket | null = null;
  private reconnectAttempt = 0;
  private reconnectTimer: number | null = null;
  private intentionalCloseSockets = new WeakSet<WebSocket>();

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): GameStoreState => this.state;

  private emit(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  private setState(partial: Partial<GameStoreState>): void {
    this.state = { ...this.state, ...partial };
    this.emit();
  }

  private addToast(message: string, tone: ToastItem["tone"]): void {
    const toast: ToastItem = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      tone,
      message,
    };
    this.setState({ toasts: [...this.state.toasts, toast] });
    window.setTimeout(() => this.dismissToast(toast.id), 2600);
  }

  dismissToast = (toastId: string): void => {
    this.setState({ toasts: this.state.toasts.filter((toast) => toast.id !== toastId) });
  };

  setNickname = (nickname: string): void => {
    saveNickname(nickname);
    this.setState({ nickname });
  };

  private beginConnectionTransition(nickname: string): void {
    saveNickname(nickname);

    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.reconnectAttempt = 0;

    if (this.socket) {
      this.intentionalCloseSockets.add(this.socket);
      this.socket.close();
      this.socket = null;
    }

    this.setState({
      nickname,
      connectionStatus: "connecting",
      lastError: null,
      snapshot: null,
      serverOffsetMs: 0,
    });
  }

  private rememberSession(session: SavedSession): void {
    saveSession(session);
    this.setState({ session });
  }

  private failConnectionTransition(message: string): void {
    this.setState({
      connectionStatus: "idle",
      lastError: message,
      snapshot: null,
      serverOffsetMs: 0,
    });
  }

  private clearSessionState(): void {
    clearSession();
    if (this.socket) {
      this.intentionalCloseSockets.add(this.socket);
      this.socket.close();
      this.socket = null;
    }
    this.reconnectAttempt = 0;
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.setState({
      session: null,
      snapshot: null,
      connectionStatus: "idle",
      lastError: null,
      serverOffsetMs: 0,
    });
  }

  goHome = (): void => {
    this.clearSessionState();
  };

  leaveRoom = (): void => {
    const session = this.state.session;
    if (!session) {
      return;
    }
    this.sendAction({ type: "leaveRoom", playerToken: session.playerToken });
    this.clearSessionState();
  };

  async createRoomAndConnect(nickname: string): Promise<void> {
    this.beginConnectionTransition(nickname);
    try {
      const response = await createRoom(nickname);
      const session: SavedSession = {
        roomCode: response.roomCode,
        playerToken: response.playerToken,
        playerId: response.playerId,
        nickname,
      };
      this.rememberSession(session);
      this.connectSocket(session);
    } catch (error) {
      const message = error instanceof Error ? error.message : "방을 만들지 못했습니다.";
      this.failConnectionTransition(message);
      throw error;
    }
  }

  async joinRoomAndConnect(roomCode: string, nickname: string, playerToken?: string): Promise<void> {
    this.beginConnectionTransition(nickname);
    try {
      const response = await joinRoom(roomCode.toUpperCase(), nickname, playerToken);
      const session: SavedSession = {
        roomCode: response.roomCode,
        playerToken: response.playerToken,
        playerId: response.playerId,
        nickname,
      };
      this.rememberSession(session);
      this.connectSocket(session);
    } catch (error) {
      const message = error instanceof Error ? error.message : "방에 참가하지 못했습니다.";
      this.failConnectionTransition(message);
      throw error;
    }
  }

  async rejoinSavedRoom(): Promise<void> {
    const session = this.state.session;
    if (!session) {
      throw new Error("저장된 이전 방이 없습니다.");
    }
    await this.joinRoomAndConnect(session.roomCode, session.nickname, session.playerToken);
  }

  async startGame(): Promise<void> {
    const session = this.state.session;
    if (!session) {
      throw new Error("세션이 없습니다.");
    }
    await startGame(session.roomCode, session.playerToken);
  }

  sendAction(action: ClientAction): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.addToast("연결이 끊겨 있어요. 다시 시도해 주세요.", "error");
      return;
    }
    this.socket.send(JSON.stringify(action));
  }

  private connectSocket(session: SavedSession): void {
    if (this.socket) {
      this.intentionalCloseSockets.add(this.socket);
      this.socket.close();
    }
    const socket = connectGameWebSocket(session.roomCode, session.playerToken, {
      onOpen: (openedSocket) => {
        if (openedSocket !== this.socket) {
          return;
        }
        this.reconnectAttempt = 0;
        this.setState({ connectionStatus: "connected" });
        this.sendAction({ type: "hello", playerToken: session.playerToken });
      },
      onMessage: (messageSocket, event) => {
        if (messageSocket !== this.socket) {
          return;
        }
        this.handleEvent(event);
      },
      onClose: (closedSocket) => this.handleSocketClosed(closedSocket),
      onError: (erroredSocket) => {
        if (erroredSocket !== this.socket) {
          return;
        }
        this.setState({ connectionStatus: "reconnecting" });
      },
    });
    this.socket = socket;
  }

  private handleSocketClosed(closedSocket: WebSocket): void {
    if (this.intentionalCloseSockets.has(closedSocket)) {
      this.intentionalCloseSockets.delete(closedSocket);
      if (closedSocket === this.socket) {
        this.socket = null;
      }
      return;
    }

    if (closedSocket !== this.socket) {
      return;
    }

    this.socket = null;
    if (!this.state.session) {
      this.setState({ connectionStatus: "disconnected" });
      return;
    }
    this.reconnectAttempt += 1;
    this.setState({ connectionStatus: "reconnecting" });
    this.reconnectTimer = window.setTimeout(() => {
      const session = this.state.session;
      if (session) {
        this.connectSocket(session);
      }
    }, Math.min(1500 * this.reconnectAttempt, 5000));
  }

  private handleEvent(event: ServerEvent): void {
    switch (event.type) {
      case "roomSnapshot":
        this.setState({
          snapshot: event.snapshot,
          lastError: null,
          serverOffsetMs: getServerOffset(event.snapshot.serverNow),
        });
        break;
      case "roomPlayersUpdated":
        if (this.state.snapshot) {
          this.setState({
            snapshot: {
              ...this.state.snapshot,
              players: event.players,
              leaderboard: event.leaderboard,
            },
          });
        }
        break;
      case "error":
        this.setState({ lastError: event.message });
        this.addToast(event.message, "error");
        break;
      case "tradeExecuted":
        this.addToast("힌트 거래가 체결됐습니다.", "success");
        break;
      case "stockActionApplied":
        this.addToast("주식 주문이 반영됐습니다.", "info");
        break;
      case "roundSettled":
        this.addToast("정산이 완료됐습니다.", "success");
        break;
      case "gameEnded":
        this.addToast("게임이 끝났습니다.", "success");
        break;
      case "phaseStarted":
        this.addToast(
          event.phase === "HINT_MARKET_OPEN"
            ? "힌트 거래가 열렸습니다."
            : event.phase === "STOCK_MARKET_OPEN"
              ? "주식 거래가 열렸습니다."
              : event.phase === "ROUND_SETTLEMENT"
                ? "라운드 정산 중입니다."
                : "단계가 변경됐습니다.",
          "info",
        );
        break;
      case "reconnectAccepted":
        this.setState({ connectionStatus: "connected" });
        break;
      default:
        break;
    }
  }
}

const store = new GameStore();

export const gameActions = {
  setNickname: store.setNickname,
  dismissToast: store.dismissToast,
  createRoomAndConnect: (nickname: string) => store.createRoomAndConnect(nickname),
  joinRoomAndConnect: (roomCode: string, nickname: string, playerToken?: string) =>
    store.joinRoomAndConnect(roomCode, nickname, playerToken),
  rejoinSavedRoom: () => store.rejoinSavedRoom(),
  startGame: () => store.startGame(),
  sendAction: (action: ClientAction) => store.sendAction(action),
  leaveRoom: () => store.leaveRoom(),
  goHome: () => store.goHome(),
};

export function useGameStore(): GameStoreState {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}
