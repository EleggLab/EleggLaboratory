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
  flame: {
    accent: '#FF875E',
    body: '직관적인 폭발력으로 첫 런의 재미를 빠르게 체감하게 만드는 학파',
    name: '화염학',
  },
  frost: {
    accent: '#70D2FF',
    body: '출시 후 확장 예정',
    name: '냉기학',
  },
  ward: {
    accent: '#B6C4FF',
    body: '출시 후 확장 예정',
    name: '보호술',
  },
  alchemy: {
    accent: '#F3D06F',
    body: '출시 후 확장 예정',
    name: '연금학',
  },
};

export const SPELLS: Record<string, SpellDefinition> = {
  firebolt: {
    id: 'firebolt',
    school: 'flame',
    name: '화염탄',
    description: '가장 가까운 적에게 빠른 탄환을 날립니다.',
    kind: 'projectile',
    baseDamage: 12,
    baseCooldownMs: 900,
    baseRadius: 10,
    projectileSpeed: 320,
    color: '#FF946A',
  },
  ember_ring: {
    id: 'ember_ring',
    school: 'flame',
    name: '잿불 고리',
    description: '결계 근처 적을 밀어내듯 광역 타격합니다.',
    kind: 'pulse',
    baseDamage: 18,
    baseCooldownMs: 2200,
    baseRadius: 124,
    color: '#FFC767',
  },
  meteor_shard: {
    id: 'meteor_shard',
    school: 'flame',
    name: '유성 파편',
    description: '느리지만 강력한 관통 조각을 발사합니다.',
    kind: 'projectile',
    baseDamage: 26,
    baseCooldownMs: 3000,
    baseRadius: 18,
    projectileSpeed: 220,
    color: '#FF625A',
  },
  cinder_ward: {
    id: 'cinder_ward',
    school: 'flame',
    name: '재빛 보호막',
    description: '결계석을 회복하고 주변 적을 태웁니다.',
    kind: 'support',
    baseDamage: 8,
    baseCooldownMs: 3600,
    baseRadius: 90,
    supportHeal: 8,
    color: '#FFE2B1',
  },
};

export const PASSIVES: Record<string, PassiveDefinition> = {
  quick_incantation: {
    id: 'quick_incantation',
    name: '빠른 영창',
    description: '모든 주문 재사용 대기시간이 짧아집니다.',
    maxLevel: 3,
  },
  hot_lesson: {
    id: 'hot_lesson',
    name: '과열 강의',
    description: '화염 주문 피해가 상승합니다.',
    maxLevel: 3,
  },
  reinforced_glyph: {
    id: 'reinforced_glyph',
    name: '강화 각인',
    description: '결계석 최대 체력이 증가합니다.',
    maxLevel: 3,
  },
  wide_arcs: {
    id: 'wide_arcs',
    name: '확장 도해',
    description: '광역 주문 반경과 탄환 크기가 커집니다.',
    maxLevel: 3,
  },
};

export const RELICS: Record<string, RelicDefinition> = {
  headmaster_seal: {
    id: 'headmaster_seal',
    name: '교장 인장',
    description: '보스 웨이브에서 주문 피해가 크게 상승합니다.',
  },
  heated_textbook: {
    id: 'heated_textbook',
    name: '가열된 교본',
    description: '첫 30초 동안 영창 속도가 크게 빨라집니다.',
  },
};

export const LESSONS: LessonDefinition[] = [
  {
    id: 'lesson_firebolt_practice',
    school: 'flame',
    name: '화염탄 실습',
    description: '기본 화염탄을 빠르게 연속 시전합니다.',
    body: '초반이 안정적이고, 첫 승리에 가장 유리한 표준 수업이에여.',
    castSpeedBonus: 0.12,
    noteBonus: 0,
    startingSpellIds: ['firebolt'],
    startingSpellLevels: { firebolt: 2 },
    startingPassives: { quick_incantation: 1 },
  },
  {
    id: 'lesson_ember_barrier',
    school: 'flame',
    name: '재빛 결계 이론',
    description: '보호막과 광역 견제로 결계 운영이 쉬워집니다.',
    body: '처음 해도 덜 흔들리는 안정형 수업 카드예여.',
    castSpeedBonus: 0,
    noteBonus: 0.08,
    startingSpellIds: ['firebolt', 'cinder_ward'],
    startingSpellLevels: { firebolt: 1, cinder_ward: 1 },
    startingPassives: { reinforced_glyph: 1 },
  },
  {
    id: 'lesson_meteor_lab',
    school: 'flame',
    name: '유성 파편 실험',
    description: '강한 한 방으로 보스를 빠르게 정리합니다.',
    body: '조금 느리지만 확실한 피니시를 원하는 플레이어용 수업이에여.',
    castSpeedBonus: -0.03,
    noteBonus: 0,
    startingSpellIds: ['firebolt', 'meteor_shard'],
    startingSpellLevels: { firebolt: 1, meteor_shard: 1 },
    startingPassives: { hot_lesson: 1 },
  },
];

export const ENEMIES: Record<string, EnemyArchetype> = {
  ember_rat: {
    id: 'ember_rat',
    name: '재 쥐',
    hp: 22,
    speed: 42,
    radius: 13,
    damage: 7,
    rewardXp: 10,
    rewardNotes: 6,
    rewardInk: 0,
    color: '#F4B66A',
  },
  ash_wisp: {
    id: 'ash_wisp',
    name: '잿빛 위습',
    hp: 17,
    speed: 58,
    radius: 11,
    damage: 5,
    rewardXp: 9,
    rewardNotes: 5,
    rewardInk: 0,
    color: '#CED7FF',
  },
  cinder_knight: {
    id: 'cinder_knight',
    name: '숯빛 기사',
    hp: 52,
    speed: 28,
    radius: 18,
    damage: 14,
    rewardXp: 18,
    rewardNotes: 12,
    rewardInk: 0,
    color: '#8B4A3E',
  },
  exam_warden: {
    id: 'exam_warden',
    name: '결계 시험관',
    hp: 220,
    speed: 18,
    radius: 28,
    damage: 26,
    rewardXp: 60,
    rewardNotes: 32,
    rewardInk: 1,
    color: '#FF6D5A',
  },
};

export const STAGES: StageDefinition[] = [
  {
    id: 'stage_1',
    title: '기초 시험 1',
    completionNotes: 29,
    completionInk: 0,
    bossWaveIndex: 7,
    waves: [
      { enemyId: 'ember_rat', count: 4, spawnIntervalMs: 800 },
      { enemyId: 'ember_rat', count: 5, spawnIntervalMs: 760 },
      { enemyId: 'ash_wisp', count: 5, spawnIntervalMs: 640 },
      { enemyId: 'ember_rat', count: 6, spawnIntervalMs: 640 },
      { enemyId: 'ash_wisp', count: 6, spawnIntervalMs: 580 },
      { enemyId: 'cinder_knight', count: 2, spawnIntervalMs: 1000 },
      { enemyId: 'ember_rat', count: 8, spawnIntervalMs: 520 },
      { enemyId: 'exam_warden', count: 1, spawnIntervalMs: 1000 },
    ],
  },
  {
    id: 'stage_2',
    title: '기초 시험 2',
    completionNotes: 37,
    completionInk: 0,
    bossWaveIndex: 7,
    waves: [
      { enemyId: 'ember_rat', count: 6, spawnIntervalMs: 760 },
      { enemyId: 'ash_wisp', count: 6, spawnIntervalMs: 620 },
      { enemyId: 'cinder_knight', count: 3, spawnIntervalMs: 960 },
      { enemyId: 'ash_wisp', count: 8, spawnIntervalMs: 560 },
      { enemyId: 'ember_rat', count: 8, spawnIntervalMs: 560 },
      { enemyId: 'cinder_knight', count: 3, spawnIntervalMs: 920 },
      { enemyId: 'ash_wisp', count: 10, spawnIntervalMs: 520 },
      { enemyId: 'exam_warden', count: 1, spawnIntervalMs: 1000 },
    ],
  },
  {
    id: 'stage_3',
    title: '응용 시험 1',
    completionNotes: 40,
    completionInk: 1,
    bossWaveIndex: 7,
    waves: [
      { enemyId: 'ash_wisp', count: 8, spawnIntervalMs: 540 },
      { enemyId: 'cinder_knight', count: 4, spawnIntervalMs: 880 },
      { enemyId: 'ember_rat', count: 12, spawnIntervalMs: 500 },
      { enemyId: 'ash_wisp', count: 10, spawnIntervalMs: 500 },
      { enemyId: 'cinder_knight', count: 4, spawnIntervalMs: 860 },
      { enemyId: 'ember_rat', count: 12, spawnIntervalMs: 460 },
      { enemyId: 'ash_wisp', count: 12, spawnIntervalMs: 440 },
      { enemyId: 'exam_warden', count: 1, spawnIntervalMs: 1000 },
    ],
  },
  {
    id: 'stage_4',
    title: '응용 시험 2',
    completionNotes: 48,
    completionInk: 1,
    bossWaveIndex: 7,
    waves: [
      { enemyId: 'ember_rat', count: 10, spawnIntervalMs: 500 },
      { enemyId: 'ash_wisp', count: 12, spawnIntervalMs: 460 },
      { enemyId: 'cinder_knight', count: 5, spawnIntervalMs: 820 },
      { enemyId: 'ember_rat', count: 14, spawnIntervalMs: 440 },
      { enemyId: 'ash_wisp', count: 14, spawnIntervalMs: 430 },
      { enemyId: 'cinder_knight', count: 6, spawnIntervalMs: 780 },
      { enemyId: 'ash_wisp', count: 16, spawnIntervalMs: 420 },
      { enemyId: 'exam_warden', count: 1, spawnIntervalMs: 1000 },
    ],
  },
  {
    id: 'stage_5',
    title: '승급 시험',
    completionNotes: 80,
    completionInk: 2,
    bossWaveIndex: 7,
    waves: [
      { enemyId: 'ash_wisp', count: 12, spawnIntervalMs: 460 },
      { enemyId: 'cinder_knight', count: 6, spawnIntervalMs: 760 },
      { enemyId: 'ember_rat', count: 16, spawnIntervalMs: 420 },
      { enemyId: 'ash_wisp', count: 16, spawnIntervalMs: 400 },
      { enemyId: 'cinder_knight', count: 7, spawnIntervalMs: 740 },
      { enemyId: 'ember_rat', count: 18, spawnIntervalMs: 400 },
      { enemyId: 'ash_wisp', count: 18, spawnIntervalMs: 390 },
      { enemyId: 'exam_warden', count: 1, spawnIntervalMs: 1000 },
    ],
  },
];

export const LIBRARY_UPGRADES: LibraryUpgradeDefinition[] = [
  {
    id: 'library_barrier_studies',
    name: '결계 연구',
    body: '결계석 최대 체력을 12씩 높입니다.',
    maxLevel: 3,
    noteCost: 60,
  },
  {
    id: 'library_quick_notes',
    name: '속독 노트',
    body: '모든 주문 재사용 대기시간을 6% 줄입니다.',
    maxLevel: 3,
    noteCost: 70,
  },
  {
    id: 'library_bonus_notes',
    name: '채점 보정',
    body: '시험 보상 노트를 10% 늘립니다.',
    maxLevel: 3,
    noteCost: 80,
  },
  {
    id: 'library_ink_distiller',
    name: '잉크 증류',
    body: '보스 클리어 시 추가 마력 잉크를 1개 얻습니다.',
    maxLevel: 2,
    noteCost: 120,
  },
];

export const FREE_APP_RULES = [
  '광고 없음',
  '인앱 결제 없음',
  '랭킹 없음',
  '로컬 저장 기반',
];

export function getStageById(stageId: string): StageDefinition {
  const stage = STAGES.find((candidate) => candidate.id === stageId);
  if (!stage) {
    throw new Error(`Unknown stage: ${stageId}`);
  }

  return stage;
}

export function getLessonById(lessonId: string): LessonDefinition {
  const lesson = LESSONS.find((candidate) => candidate.id === lessonId);
  if (!lesson) {
    throw new Error(`Unknown lesson: ${lessonId}`);
  }

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
      pool.push({
        id: `unlock-${spell.id}`,
        kind: 'spell-unlock',
        label: `${spell.name} 해금`,
        body: spell.description,
        targetId: spell.id,
      });
      continue;
    }

    const currentLevel = spellLevels[spell.id] ?? 0;
    if (currentLevel < 3) {
      pool.push({
        id: `upgrade-${spell.id}`,
        kind: 'spell-upgrade',
        label: `${spell.name} 강화`,
        body: `${spell.name} 피해량과 효과 범위가 상승합니다.`,
        targetId: spell.id,
      });
    }
  }

  for (const passive of Object.values(PASSIVES)) {
    const currentLevel = passiveLevels[passive.id] ?? 0;
    if (currentLevel < passive.maxLevel) {
      pool.push({
        id: `passive-${passive.id}`,
        kind: 'passive',
        label: passive.name,
        body: passive.description,
        targetId: passive.id,
      });
    }
  }

  for (const relic of Object.values(RELICS)) {
    if (!knownRelicIds.includes(relic.id)) {
      pool.push({
        id: `relic-${relic.id}`,
        kind: 'relic',
        label: relic.name,
        body: relic.description,
        targetId: relic.id,
      });
    }
  }

  return pool;
}

