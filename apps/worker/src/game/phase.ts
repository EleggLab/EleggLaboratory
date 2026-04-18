import {
  ROUND_COUNT,
  ROOM_CLEANUP_MS,
} from "@tong/shared/config";
import type { RoomState } from "@tong/shared/types";
import { expireOpenOrders } from "./orders";
import { settleCurrentRound, startRoundBaseline } from "./settlement";

export interface PhaseTransitionResult {
  newPublicHintIds: string[];
  newPrivateHintIdsByPlayer: Record<string, string[]>;
}

export function markPlayerReady(state: RoomState, playerId: string): void {
  if (!state.phaseReadyPlayerIds.includes(playerId)) {
    state.phaseReadyPlayerIds.push(playerId);
  }
}

export function isPhaseAdvanceReady(state: RoomState): boolean {
  if (
    state.phase !== "HINT_MARKET_OPEN" &&
    state.phase !== "STOCK_MARKET_OPEN" &&
    state.phase !== "ROUND_SETTLEMENT"
  ) {
    return false;
  }
  const connectedPlayers = Object.values(state.players)
    .filter((player) => player.connected)
    .map((player) => player.id);
  if (connectedPlayers.length === 0) {
    return false;
  }
  return connectedPlayers.every((playerId) => state.phaseReadyPlayerIds.includes(playerId));
}

export function openHintMarket(state: RoomState, roundNumber: number, now: number): PhaseTransitionResult {
  state.roundNumber = roundNumber;
  state.phase = "HINT_MARKET_OPEN";
  state.phaseStartedAt = now;
  state.phaseEndsAt = null;
  state.phaseReadyPlayerIds = [];
  state.updatedAt = now;

  const newPublicHintIds: string[] = [];
  const newPrivateHintIdsByPlayer: Record<string, string[]> = {};

  if (roundNumber === 1 && state.publicOverallHintId) {
    if (!state.revealedPublicHintIds.includes(state.publicOverallHintId)) {
      state.revealedPublicHintIds.push(state.publicOverallHintId);
      newPublicHintIds.push(state.publicOverallHintId);
    }
    for (const player of Object.values(state.players)) {
      const overallHintId = state.privateOverallHintIdsByPlayer[player.id];
      if (overallHintId && !player.readableHintIds.includes(overallHintId)) {
        player.readableHintIds.push(overallHintId);
        newPrivateHintIdsByPlayer[player.id] = [...(newPrivateHintIdsByPlayer[player.id] ?? []), overallHintId];
      }
    }
  }

  const publicRoundHintId = state.publicRoundHintIdsByRound[roundNumber];
  if (publicRoundHintId && !state.revealedPublicHintIds.includes(publicRoundHintId)) {
    state.revealedPublicHintIds.push(publicRoundHintId);
    newPublicHintIds.push(publicRoundHintId);
  }

  for (const player of Object.values(state.players)) {
    const privateRoundHintId = state.privateRoundHintIdsByRound[roundNumber]?.[player.id];
    if (privateRoundHintId && !player.readableHintIds.includes(privateRoundHintId)) {
      player.readableHintIds.push(privateRoundHintId);
      newPrivateHintIdsByPlayer[player.id] = [
        ...(newPrivateHintIdsByPlayer[player.id] ?? []),
        privateRoundHintId,
      ];
    }
  }

  startRoundBaseline(state);
  return { newPublicHintIds, newPrivateHintIdsByPlayer };
}

export function openStockMarket(state: RoomState, now: number): void {
  expireOpenOrders(state, now);
  state.phase = "STOCK_MARKET_OPEN";
  state.phaseStartedAt = now;
  state.phaseEndsAt = null;
  state.phaseReadyPlayerIds = [];
  state.updatedAt = now;
}

export function openSettlement(state: RoomState, now: number): void {
  state.phase = "ROUND_SETTLEMENT";
  state.phaseStartedAt = now;
  state.phaseEndsAt = null;
  state.phaseReadyPlayerIds = [];
  settleCurrentRound(state, now);
  state.updatedAt = now;
}

export function finishSettlement(state: RoomState, now: number): PhaseTransitionResult {
  if (state.roundNumber >= ROUND_COUNT) {
    state.phase = "GAME_END";
    state.status = "GAME_END";
    state.phaseStartedAt = now;
    state.phaseEndsAt = null;
    state.phaseReadyPlayerIds = [];
    state.cleanupAt = now + ROOM_CLEANUP_MS;
    state.updatedAt = now;
    return { newPublicHintIds: [], newPrivateHintIdsByPlayer: {} };
  }

  return openHintMarket(state, state.roundNumber + 1, now);
}

export function getNextAlarmTime(state: RoomState): number | null {
  const candidates = [state.cleanupAt].filter(
    (value): value is number => typeof value === "number",
  );
  if (candidates.length === 0) {
    return null;
  }
  return Math.min(...candidates);
}

export function shouldCleanupRoom(state: RoomState, now: number, connectedCount: number): boolean {
  return Boolean(state.cleanupAt && state.cleanupAt <= now && connectedCount === 0);
}
