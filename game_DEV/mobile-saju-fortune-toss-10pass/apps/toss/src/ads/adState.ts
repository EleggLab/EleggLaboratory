import type { TossAdKind, TossBannerSlot, TossFullscreenSlot } from './adConfig';

export type TossAdPlacement = TossBannerSlot | TossFullscreenSlot;

const LAST_EVENT_AT = new Map<string, number>();

export function logAdEvent(
  kind: TossAdKind,
  slot: TossAdPlacement,
  event: string,
  payload?: unknown,
): void {
  LAST_EVENT_AT.set(`${kind}:${slot}:${event}`, Date.now());
  if (__DEV__) {
    console.info('[toss-ad]', { kind, slot, event, payload });
  }
}

export function getLastAdEventAt(kind: TossAdKind, slot: TossAdPlacement, event: string): number | null {
  return LAST_EVENT_AT.get(`${kind}:${slot}:${event}`) ?? null;
}
