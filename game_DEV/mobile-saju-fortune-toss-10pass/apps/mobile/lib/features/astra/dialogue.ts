import {
  ASTRA_AFFECTION_MAX,
  ASTRA_AFFECTION_MIN,
} from './affection';
import {
  ASTRA_VARIANTS,
  type AstraDialogueTier,
  type AstraVariantManifest,
} from './generatedManifest';

let sessionVariantId: string | null = null;

function clampAffection(affection: number): number {
  return Math.max(ASTRA_AFFECTION_MIN, Math.min(ASTRA_AFFECTION_MAX, Math.trunc(affection)));
}

function randomItem<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)] as T;
}

export function astraDialogueTierForAffection(affection: number): AstraDialogueTier {
  const value = clampAffection(affection);
  if (value <= 2) return '1-2';
  if (value <= 4) return '3-4';
  if (value <= 6) return '5-6';
  if (value <= 8) return '7-8';
  return '9-10';
}

export function getUnlockedAstraVariants(affection: number): AstraVariantManifest[] {
  const value = clampAffection(affection);
  return ASTRA_VARIANTS.filter((variant) => variant.unlockAffinityMin <= value);
}

export function getSessionAstraVariant(
  affection: number,
  lastVariantId: string | null,
): AstraVariantManifest {
  const unlocked = getUnlockedAstraVariants(affection);
  if (unlocked.length === 0) {
    return ASTRA_VARIANTS[0] as AstraVariantManifest;
  }

  if (sessionVariantId) {
    const cached = unlocked.find((variant) => variant.id === sessionVariantId);
    if (cached) return cached;
  }

  const pool =
    lastVariantId && unlocked.length > 1
      ? unlocked.filter((variant) => variant.id !== lastVariantId)
      : unlocked;
  const picked = randomItem(pool.length > 0 ? pool : unlocked);
  sessionVariantId = picked.id;
  return picked;
}

export function pickAstraDialogueLine(
  variant: AstraVariantManifest,
  affection: number,
  previousLine?: string | null,
): string {
  const tier = astraDialogueTierForAffection(affection);
  const lines = variant.dialogueByTier[tier] ?? [];
  if (lines.length === 0) {
    return previousLine ?? '';
  }
  if (lines.length === 1) {
    return lines[0] ?? previousLine ?? '';
  }

  let nextLine = previousLine ?? '';
  while (nextLine === previousLine) {
    nextLine = randomItem(lines);
  }
  return nextLine;
}
