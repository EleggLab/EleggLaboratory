import type { CreateRoomResponse, JoinRoomResponse } from "@tong/shared/types";

async function readJsonOrThrow<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as { message?: string };
  if (!response.ok) {
    throw new Error(payload.message ?? "요청을 처리하지 못했습니다.");
  }
  return payload as T;
}

export async function createRoom(nickname: string): Promise<CreateRoomResponse> {
  const response = await fetch("/api/rooms", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ nickname }),
  });
  return readJsonOrThrow<CreateRoomResponse>(response);
}

export async function joinRoom(
  roomCode: string,
  nickname: string,
  playerToken?: string,
): Promise<JoinRoomResponse> {
  const response = await fetch(`/api/rooms/${roomCode}/join`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ nickname, playerToken }),
  });
  return readJsonOrThrow<JoinRoomResponse>(response);
}

export async function startGame(roomCode: string, playerToken: string): Promise<void> {
  const response = await fetch(`/api/rooms/${roomCode}/start`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ playerToken }),
  });
  await readJsonOrThrow<{ ok: true }>(response);
}
