import type { ServerEvent } from "@tong/shared/types";

export interface WebSocketHandlers {
  onOpen: (socket: WebSocket) => void;
  onMessage: (socket: WebSocket, event: ServerEvent) => void;
  onClose: (socket: WebSocket) => void;
  onError: (socket: WebSocket) => void;
}

export function buildWebSocketUrl(roomCode: string, playerToken: string): string {
  const url = new URL(`/api/rooms/${roomCode}/ws`, window.location.origin);
  url.searchParams.set("playerToken", playerToken);
  url.protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return url.toString();
}

export function connectGameWebSocket(
  roomCode: string,
  playerToken: string,
  handlers: WebSocketHandlers,
): WebSocket {
  const socket = new WebSocket(buildWebSocketUrl(roomCode, playerToken));
  socket.addEventListener("open", () => handlers.onOpen(socket));
  socket.addEventListener("close", () => handlers.onClose(socket));
  socket.addEventListener("error", () => handlers.onError(socket));
  socket.addEventListener("message", (event) => {
    try {
      handlers.onMessage(socket, JSON.parse(event.data) as ServerEvent);
    } catch {
      handlers.onMessage(socket, {
        type: "error",
        message: "서버 메시지를 읽지 못했습니다.",
      });
    }
  });
  return socket;
}
