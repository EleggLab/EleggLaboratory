export function getServerOffset(serverNow: number): number {
  return serverNow - Date.now();
}

export function getRemainingMs(phaseEndsAt: number | null, serverOffsetMs: number): number {
  if (!phaseEndsAt) {
    return 0;
  }
  return Math.max(0, phaseEndsAt - (Date.now() + serverOffsetMs));
}

export function formatRemaining(phaseEndsAt: number | null, serverOffsetMs: number): string {
  const totalSeconds = Math.ceil(getRemainingMs(phaseEndsAt, serverOffsetMs) / 1000);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
