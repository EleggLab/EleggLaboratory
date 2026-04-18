export interface SavedSession {
  roomCode: string;
  playerToken: string;
  playerId: string;
  nickname: string;
}

const NICKNAME_KEY = "tong-keusine.nickname";
const SESSION_KEY = "tong-keusine.session";

export function loadNickname(): string {
  return localStorage.getItem(NICKNAME_KEY) ?? "";
}

export function saveNickname(nickname: string): void {
  localStorage.setItem(NICKNAME_KEY, nickname);
}

export function loadSession(): SavedSession | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as SavedSession;
  } catch {
    return null;
  }
}

export function saveSession(session: SavedSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}
