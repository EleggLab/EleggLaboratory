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

export type AstraDialogueContext = 'intro' | 'ambient' | 'tap' | 'swap';

const ASTRA_INTRO_LINES: Record<AstraDialogueTier, readonly string[]> = {
  '1-2': [
    '아스트라예요. 지금은 한 가지부터 천천히 정리하면 충분해요.',
  ],
  '3-4': [
    '아스트라예요. 서두르지 말고, 하나씩 맞춰 가면 흐름이 훨씬 편해져요.',
  ],
  '5-6': [
    '아스트라예요. 오늘은 잘 맞는 방향부터 같이 골라보면 돼요.',
  ],
  '7-8': [
    '아스트라예요. 조급해하지 않아도 괜찮아요. 타이밍만 맞추면 충분해요.',
  ],
  '9-10': [
    '아스트라예요. 마음이 가는 방향을 먼저 정하고, 그다음 천천히 밀어가면 돼요.',
  ],
};

const ASTRA_AMBIENT_LINES: Record<AstraDialogueTier, readonly string[]> = {
  '1-2': [
    '오늘은 한 가지 일만 차분히 끝내도 충분합니다.',
    '마음이 복잡하다면 답을 서두르지 말고, 쉬운 일부터 정리해 보세요.',
    '큰 변화를 만들기보다 지금의 흐름을 안정시키는 편이 좋습니다.',
  ],
  '3-4': [
    '지금은 순서를 지키는 것만으로도 결과가 좋아질 수 있습니다.',
    '서두르지 않고 하나씩 정리하면 실수도 줄고 마음도 편해집니다.',
    '새로운 일을 벌이기보다 이미 시작한 일을 마무리하는 편이 유리합니다.',
  ],
  '5-6': [
    '오늘은 작은 신호도 가볍게 넘기지 않는 편이 좋습니다.',
    '방향을 바꾸기보다 잘 맞는 흐름을 조금 더 밀어보세요.',
    '하루 전체를 바꾸려 하기보다 중요한 한 장면에 집중해 보세요.',
  ],
  '7-8': [
    '오늘은 말 한마디와 타이밍 하나가 크게 작용할 수 있습니다.',
    '조급함만 줄여도 흐름이 훨씬 부드러워질 수 있습니다.',
    '강하게 밀기보다 흔들리지 않는 태도를 지키는 편이 중요합니다.',
  ],
  '9-10': [
    '오늘은 이미 만들어진 흐름을 어떻게 다루느냐가 중요합니다.',
    '결론을 급히 내리기보다 내가 원하는 방향을 먼저 분명히 잡아보세요.',
    '무엇을 고르느냐보다 어떤 태도로 밀고 가느냐가 더 중요할 수 있습니다.',
  ],
};

const ASTRA_TAP_LINES: Record<AstraDialogueTier, readonly string[]> = {
  '1-2': [
    '지금은 가볍게 확인하는 것만으로도 충분합니다.',
    '오늘은 답을 서두르기보다 마음이 움직이는 방향만 살펴봐도 괜찮습니다.',
    '작은 반응 하나에도 힌트가 있을 수 있으니 그냥 넘기지 마세요.',
  ],
  '3-4': [
    '한 번 더 확인하는 태도가 오늘은 좋은 결과로 이어질 수 있습니다.',
    '방금 느낀 감각은 크게 틀리지 않을 가능성이 큽니다.',
    '급하게 넘기지 않고 다시 살펴보면 더 정확해질 수 있습니다.',
  ],
  '5-6': [
    '반응을 하나씩 모아가면 오늘 흐름이 더 선명해질 수 있습니다.',
    '지금의 감각은 제법 정확한 편입니다. 천천히 맞춰가는 방식이 더 잘 맞습니다.',
    '서두르기보다 반응을 조금 더 모아 판단하는 편이 안정적입니다.',
  ],
  '7-8': [
    '지금처럼 움직이면 흐름이 더 또렷해질 수 있습니다.',
    '방금 건드린 방향이 이미 의미를 만들고 있으니 쉽게 넘기지 마세요.',
    '오늘은 작은 반응 하나가 분위기를 바꿀 수 있습니다.',
  ],
  '9-10': [
    '지금은 당신이 만든 움직임이 바로 분위기를 바꿀 수 있습니다.',
    '방금 반응도 우연으로 넘기지 않는 편이 좋습니다.',
    '작은 선택도 오래 남을 수 있으니 마음이 분명한 쪽으로 움직여 보세요.',
  ],
};

const ASTRA_SWAP_LINES: Record<AstraDialogueTier, readonly string[]> = {
  '1-2': [
    '장면이 바뀌면 같은 하루도 다른 느낌으로 읽힐 수 있습니다.',
    '지금은 부담을 덜어내는 쪽이 더 잘 맞아 보여 이 장면으로 바꿔봤습니다.',
  ],
  '3-4': [
    '장면이 바뀌면 마음이 붙는 지점도 달라질 수 있습니다.',
    '같은 운세라도 어떤 분위기로 보느냐에 따라 느낌이 달라질 수 있습니다.',
  ],
  '5-6': [
    '지금은 이 분위기가 더 잘 맞습니다. 보여지는 결을 또렷하게 읽어보세요.',
    '오늘은 감각에 맞는 장면을 고르는 편이 결과도 더 좋아질 수 있습니다.',
  ],
  '7-8': [
    '분위기가 달라지면 집중해야 할 지점도 함께 달라집니다.',
    '같은 하루라도 어디에 시선을 두느냐에 따라 의미가 달라질 수 있습니다.',
  ],
  '9-10': [
    '지금은 이 장면이 더 정확하게 맞아 보입니다.',
    '보이는 분위기가 달라지면 판단의 방향도 함께 달라질 수 있습니다.',
  ],
};

function clampAffection(affection: number): number {
  return Math.max(ASTRA_AFFECTION_MIN, Math.min(ASTRA_AFFECTION_MAX, Math.trunc(affection)));
}

function scaledLegacyAffection(legacyValue: number): number {
  const scaled = Math.ceil((legacyValue / 10) * ASTRA_AFFECTION_MAX);
  return clampAffection(scaled);
}

function randomItem<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)] as T;
}

export function astraDialogueTierForAffection(affection: number): AstraDialogueTier {
  const value = clampAffection(affection);
  if (value <= scaledLegacyAffection(2)) return '1-2';
  if (value <= scaledLegacyAffection(4)) return '3-4';
  if (value <= scaledLegacyAffection(6)) return '5-6';
  if (value <= scaledLegacyAffection(8)) return '7-8';
  return '9-10';
}

export function getUnlockedAstraVariants(affection: number): AstraVariantManifest[] {
  const value = clampAffection(affection);
  return ASTRA_VARIANTS.filter((variant) => scaledLegacyAffection(variant.unlockAffinityMin) <= value);
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

export function getNextSessionAstraVariant(
  affection: number,
  currentVariantId: string | null,
): AstraVariantManifest {
  const unlocked = getUnlockedAstraVariants(affection);
  if (unlocked.length === 0) {
    return ASTRA_VARIANTS[0] as AstraVariantManifest;
  }

  if (!currentVariantId) {
    const first = unlocked[0] as AstraVariantManifest;
    sessionVariantId = first.id;
    return first;
  }

  const currentIndex = unlocked.findIndex((variant) => variant.id === currentVariantId);
  const next =
    currentIndex >= 0
      ? (unlocked[(currentIndex + 1) % unlocked.length] as AstraVariantManifest)
      : (unlocked[0] as AstraVariantManifest);
  sessionVariantId = next.id;
  return next;
}

function pickStandaloneAstraLine(
  tier: AstraDialogueTier,
  context: AstraDialogueContext,
  previousLine?: string | null,
): string {
  const pool =
    context === 'intro'
      ? ASTRA_INTRO_LINES[tier]
      : context === 'swap'
      ? ASTRA_SWAP_LINES[tier]
      : context === 'tap'
        ? ASTRA_TAP_LINES[tier]
        : ASTRA_AMBIENT_LINES[tier];

  if (pool.length === 0) {
    return previousLine ?? '';
  }

  if (pool.length === 1) {
    return pool[0] ?? previousLine ?? '';
  }

  let nextLine = previousLine ?? '';
  while (nextLine === previousLine) {
    nextLine = randomItem(pool);
  }
  return nextLine;
}

export function buildAstraDialogueLine(
  variant: AstraVariantManifest,
  affection: number,
  previousLine?: string | null,
  context: AstraDialogueContext = 'ambient',
): string {
  void variant;
  const tier = astraDialogueTierForAffection(affection);
  return pickStandaloneAstraLine(tier, context, previousLine);
}
