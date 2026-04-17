import type {
  EnemyArchetype,
  LessonDefinition,
  LibraryUpgradeDefinition,
  PassiveDefinition,
  RelicDefinition,
  SchoolId,
  SpellDefinition,
  StageDefinition,
  UpgradeChoice,
} from './types';

export const SCHOOL_LABELS: Record<SchoolId, { accent: string; body: string; name: string }> = {
  flame: { accent: '#FF9A66', body: '발랄한 속도로 점수를 쌓는 테마', name: '선샤인' },
  frost: { accent: '#74D4FF', body: '차분한 리듬 플레이 테마', name: '스카이' },
  ward: { accent: '#B9C7FF', body: '안정적으로 버티는 테마', name: '클라우드' },
  alchemy: { accent: '#F3D06F', body: '출시 후 확장 예정', name: '스타라이트' },
};

export const SPELLS: Record<string, SpellDefinition> = {
  color_pop: {
    id: 'color_pop', school: 'flame', name: '컬러팝', description: '가장 가까운 방해물을 톡 하고 정리해요.',
    kind: 'projectile', baseDamage: 12, baseCooldownMs: 900, baseRadius: 10, projectileSpeed: 320, color: '#FF946A',
  },
  rainbow_ring: {
    id: 'rainbow_ring', school: 'flame', name: '레인보우 링', description: '주변 방해물을 넓게 정리해요.',
    kind: 'pulse', baseDamage: 18, baseCooldownMs: 2200, baseRadius: 124, color: '#FFC767',
  },
  star_bounce: {
    id: 'star_bounce', school: 'flame', name: '스타 바운스', description: '천천히 움직이지만 강한 별빛을 발사해요.',
    kind: 'projectile', baseDamage: 26, baseCooldownMs: 3000, baseRadius: 18, projectileSpeed: 220, color: '#FF625A',
  },
  smile_guard: {
    id: 'smile_guard', school: 'flame', name: '스마일 가드', description: '중앙 하트를 회복하고 근처를 정리해요.',
    kind: 'support', baseDamage: 8, baseCooldownMs: 3600, baseRadius: 90, supportHeal: 8, color: '#FFE2B1',
  },
};

export const PASSIVES: Record<string, PassiveDefinition> = {
  quick_rhythm: { id: 'quick_rhythm', name: '빠른 리듬', description: '모든 스킬 쿨타임이 감소해요.', maxLevel: 3 },
  happy_power: { id: 'happy_power', name: '해피 파워', description: '스킬 효과가 상승해요.', maxLevel: 3 },
  comfy_guard: { id: 'comfy_guard', name: '안심 보호막', description: '중앙 하트 최대치가 증가해요.', maxLevel: 3 },
  wide_sparkle: { id: 'wide_sparkle', name: '넓은 반짝임', description: '광역 범위가 커져요.', maxLevel: 3 },
};

export const RELICS: Record<string, RelicDefinition> = {
  mascot_badge: { id: 'mascot_badge', name: '마스코트 배지', description: '라운드 후반 점수 효율이 상승해요.' },
  candy_notebook: { id: 'candy_notebook', name: '캔디 노트', description: '시작 30초 동안 속도가 빨라져요.' },
};

export const LESSONS: LessonDefinition[] = [
  {
    id: 'lesson_color_pop', school: 'flame', name: '컬러팝 클래스', description: '기본 스킬을 빠르게 사용해요.',
    body: '처음 플레이하는 분에게 가장 쉬운 입문 클래스예요.', castSpeedBonus: 0.12, noteBonus: 0,
    startingSpellIds: ['color_pop'], startingSpellLevels: { color_pop: 2 }, startingPassives: { quick_rhythm: 1 },
  },
  {
    id: 'lesson_rainbow_guard', school: 'flame', name: '레인보우 가드 클래스', description: '안정적으로 오래 버텨요.',
    body: '실수해도 복구하기 쉬운 안정형 클래스예요.', castSpeedBonus: 0, noteBonus: 0.08,
    startingSpellIds: ['color_pop', 'smile_guard'], startingSpellLevels: { color_pop: 1, smile_guard: 1 }, startingPassives: { comfy_guard: 1 },
  },
  {
    id: 'lesson_star_bounce', school: 'flame', name: '스타 바운스 클래스', description: '강한 한 방으로 라운드를 압축해요.',
    body: '조금 느리지만 시원한 마무리를 좋아하는 분께 추천해요.', castSpeedBonus: -0.03, noteBonus: 0,
    startingSpellIds: ['color_pop', 'star_bounce'], startingSpellLevels: { color_pop: 1, star_bounce: 1 }, startingPassives: { happy_power: 1 },
  },
];

export const ENEMIES: Record<string, EnemyArchetype> = {
  toy_blob: { id: 'toy_blob', name: '토이 블롭', hp: 24, speed: 42, radius: 13, damage: 7, rewardXp: 10, rewardNotes: 6, rewardInk: 0, color: '#F4B66A' },
  cloud_puff: { id: 'cloud_puff', name: '클라우드 퍼프', hp: 18, speed: 58, radius: 11, damage: 5, rewardXp: 9, rewardNotes: 5, rewardInk: 0, color: '#CED7FF' },
  box_bot: { id: 'box_bot', name: '박스봇', hp: 52, speed: 28, radius: 18, damage: 14, rewardXp: 18, rewardNotes: 12, rewardInk: 0, color: '#8B4A3E' },
  giant_balloon: { id: 'giant_balloon', name: '자이언트 벌룬', hp: 220, speed: 18, radius: 28, damage: 26, rewardXp: 60, rewardNotes: 32, rewardInk: 1, color: '#FF6D5A' },
};

export const STAGES: StageDefinition[] = [
  { id: 'stage_1', title: '파크 라운드 1', completionNotes: 28, completionInk: 0, bossWaveIndex: 7, waves: [
    { enemyId: 'toy_blob', count: 4, spawnIntervalMs: 800 },{ enemyId: 'toy_blob', count: 5, spawnIntervalMs: 760 },{ enemyId: 'cloud_puff', count: 5, spawnIntervalMs: 640 },{ enemyId: 'toy_blob', count: 6, spawnIntervalMs: 640 },{ enemyId: 'cloud_puff', count: 6, spawnIntervalMs: 580 },{ enemyId: 'box_bot', count: 2, spawnIntervalMs: 1000 },{ enemyId: 'toy_blob', count: 8, spawnIntervalMs: 520 },{ enemyId: 'giant_balloon', count: 1, spawnIntervalMs: 1000 },
  ]},
  { id: 'stage_2', title: '파크 라운드 2', completionNotes: 34, completionInk: 0, bossWaveIndex: 7, waves: [
    { enemyId: 'toy_blob', count: 6, spawnIntervalMs: 760 },{ enemyId: 'cloud_puff', count: 6, spawnIntervalMs: 620 },{ enemyId: 'box_bot', count: 3, spawnIntervalMs: 960 },{ enemyId: 'cloud_puff', count: 8, spawnIntervalMs: 560 },{ enemyId: 'toy_blob', count: 8, spawnIntervalMs: 560 },{ enemyId: 'box_bot', count: 3, spawnIntervalMs: 920 },{ enemyId: 'cloud_puff', count: 10, spawnIntervalMs: 520 },{ enemyId: 'giant_balloon', count: 1, spawnIntervalMs: 1000 },
  ]},
  { id: 'stage_3', title: '파크 라운드 3', completionNotes: 42, completionInk: 1, bossWaveIndex: 7, waves: [
    { enemyId: 'cloud_puff', count: 8, spawnIntervalMs: 540 },{ enemyId: 'box_bot', count: 4, spawnIntervalMs: 880 },{ enemyId: 'toy_blob', count: 12, spawnIntervalMs: 500 },{ enemyId: 'cloud_puff', count: 10, spawnIntervalMs: 500 },{ enemyId: 'box_bot', count: 4, spawnIntervalMs: 860 },{ enemyId: 'toy_blob', count: 12, spawnIntervalMs: 460 },{ enemyId: 'cloud_puff', count: 12, spawnIntervalMs: 440 },{ enemyId: 'giant_balloon', count: 1, spawnIntervalMs: 1000 },
  ]},
  { id: 'stage_4', title: '파크 라운드 4', completionNotes: 52, completionInk: 1, bossWaveIndex: 7, waves: [
    { enemyId: 'toy_blob', count: 10, spawnIntervalMs: 500 },{ enemyId: 'cloud_puff', count: 12, spawnIntervalMs: 460 },{ enemyId: 'box_bot', count: 5, spawnIntervalMs: 820 },{ enemyId: 'toy_blob', count: 14, spawnIntervalMs: 440 },{ enemyId: 'cloud_puff', count: 14, spawnIntervalMs: 430 },{ enemyId: 'box_bot', count: 6, spawnIntervalMs: 780 },{ enemyId: 'cloud_puff', count: 16, spawnIntervalMs: 420 },{ enemyId: 'giant_balloon', count: 1, spawnIntervalMs: 1000 },
  ]},
  { id: 'stage_5', title: '파크 챌린지', completionNotes: 91, completionInk: 2, bossWaveIndex: 7, waves: [
    { enemyId: 'cloud_puff', count: 12, spawnIntervalMs: 460 },{ enemyId: 'box_bot', count: 6, spawnIntervalMs: 760 },{ enemyId: 'toy_blob', count: 16, spawnIntervalMs: 420 },{ enemyId: 'cloud_puff', count: 16, spawnIntervalMs: 400 },{ enemyId: 'box_bot', count: 7, spawnIntervalMs: 740 },{ enemyId: 'toy_blob', count: 18, spawnIntervalMs: 400 },{ enemyId: 'cloud_puff', count: 18, spawnIntervalMs: 390 },{ enemyId: 'giant_balloon', count: 1, spawnIntervalMs: 1000 },
  ]},
];

export const LIBRARY_UPGRADES: LibraryUpgradeDefinition[] = [
  { id: 'library_heart_upgrade', name: '하트 업그레이드', body: '중앙 하트 최대치를 12 올려요.', maxLevel: 3, noteCost: 60 },
  { id: 'library_quick_cast', name: '퀵 리듬', body: '스킬 재사용 대기시간을 6% 줄여요.', maxLevel: 3, noteCost: 70 },
  { id: 'library_bonus_notes', name: '보너스 노트', body: '라운드 보상 노트를 10% 늘려요.', maxLevel: 3, noteCost: 80 },
  { id: 'library_ink_booster', name: '잉크 부스터', body: '보스 클리어 시 잉크를 1개 추가 획득해요.', maxLevel: 2, noteCost: 120 },
];

export const FREE_APP_RULES = ['광고 없음', '인앱 결제 없음', '랭킹 없음', '로컬 저장 기반'];

export function getStageById(stageId: string): StageDefinition {
  const stage = STAGES.find((candidate) => candidate.id === stageId);
  if (!stage) throw new Error(`Unknown stage: ${stageId}`);
  return stage;
}

export function getLessonById(lessonId: string): LessonDefinition {
  const lesson = LESSONS.find((candidate) => candidate.id === lessonId);
  if (!lesson) throw new Error(`Unknown lesson: ${lessonId}`);
  return lesson;
}

export function buildUpgradePool(
  knownSpellIds: string[],
  spellLevels: Record<string, number>,
  passiveLevels: Record<string, number>,
  knownRelicIds: string[],
): UpgradeChoice[] {
  const pool: UpgradeChoice[] = [];

  for (const spell of Object.values(SPELLS)) {
    if (!knownSpellIds.includes(spell.id)) {
      pool.push({ id: `unlock-${spell.id}`, kind: 'spell-unlock', label: `${spell.name} 해금`, body: spell.description, targetId: spell.id });
      continue;
    }
    const currentLevel = spellLevels[spell.id] ?? 0;
    if (currentLevel < 3) {
      pool.push({ id: `upgrade-${spell.id}`, kind: 'spell-upgrade', label: `${spell.name} 강화`, body: `${spell.name} 효과가 상승해요.`, targetId: spell.id });
    }
  }

  for (const passive of Object.values(PASSIVES)) {
    const currentLevel = passiveLevels[passive.id] ?? 0;
    if (currentLevel < passive.maxLevel) {
      pool.push({ id: `passive-${passive.id}`, kind: 'passive', label: passive.name, body: passive.description, targetId: passive.id });
    }
  }

  for (const relic of Object.values(RELICS)) {
    if (!knownRelicIds.includes(relic.id)) {
      pool.push({ id: `relic-${relic.id}`, kind: 'relic', label: relic.name, body: relic.description, targetId: relic.id });
    }
  }

  return pool;
}
