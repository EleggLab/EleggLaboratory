import type {
  AugmentDefinition,
  AugmentId,
  BlockCatalogItem,
  BlockKind,
  BossDefinition,
  BossId,
  CrewDefinition,
  CrewId,
  SupplyReward,
} from './types';

export const HOME_RULE_CHIPS = [
  '토스 WebView 게임 규격',
  '아래에서 위로 드래그 발사',
  '보스 격파 후 증강 1개 선택',
  '데일리 보급으로 승무원 해금',
];

export const CREWS: CrewDefinition[] = [
  {
    id: 'ria',
    name: '리아',
    role: '가이드',
    oneLine: '첫 플레이어용 정밀 조준형 승무원',
    passive: '기본 공 +1, 벽 튕김 미리보기 +1회',
    active: '다음 발사 한 턴 동안 공 피해 +1',
    unlockCost: 0,
    accent: '#1664FF',
    startBalls: 1,
    previewBounces: 2,
  },
  {
    id: 'tae',
    name: '태오',
    role: '서포터',
    oneLine: '공 수를 빠르게 불리는 템포형 승무원',
    passive: '4루프마다 보급 공 1개 자동 지급',
    active: '즉시 공 +2, 현재 보드에 공 보급 1개 추가',
    unlockCost: 1,
    accent: '#2D9F87',
    startBalls: 0,
    previewBounces: 1,
  },
  {
    id: 'yuna',
    name: '유나',
    role: '가드',
    oneLine: '한 번의 붕괴를 버티는 안전장치형 승무원',
    passive: '런 시작 시 보호막 +1',
    active: '다음 하강 턴을 1회 막음',
    unlockCost: 1,
    accent: '#FF8B3D',
    startBalls: 0,
    previewBounces: 1,
  },
  {
    id: 'doho',
    name: '도호',
    role: '브레이커',
    oneLine: '폭탄과 보스 딜을 밀어주는 고점형 승무원',
    passive: '폭탄 폭발 반경 +1',
    active: '가장 약한 블록 4개에 폭격 피해',
    unlockCost: 1,
    accent: '#E84C5D',
    startBalls: 0,
    previewBounces: 1,
  },
  {
    id: 'nari',
    name: '나리',
    role: '콜렉터',
    oneLine: '보급 공 가치와 회복력을 높이는 수집형 승무원',
    passive: '공 보급 획득량 +1',
    active: '보호막 +1과 공 +1을 동시에 획득',
    unlockCost: 1,
    accent: '#7B5CFF',
    startBalls: 0,
    previewBounces: 1,
  },
];

export const AUGMENTS: AugmentDefinition[] = [
  {
    id: 'plus_ball',
    name: '볼 캐리어',
    summary: '기본 공 수 +1',
    body: '지속적으로 공을 한 개 더 발사해 기본 루프 안정성을 올립니다.',
    maxStacks: 3,
    tone: 'tempo',
  },
  {
    id: 'pickup_echo',
    name: '회수 메모',
    summary: '공 보급 획득량 +1',
    body: '볼 픽업을 먹을 때마다 추가 공을 한 개 더 확보합니다.',
    maxStacks: 2,
    tone: 'tempo',
  },
  {
    id: 'bomb_echo',
    name: '연쇄 폭파',
    summary: '폭탄 폭발 범위 확장',
    body: '폭탄 파괴 시 인접 피해 범위가 한 칸 더 늘어나 군집 정리에 강해집니다.',
    maxStacks: 2,
    tone: 'control',
  },
  {
    id: 'boss_crack',
    name: '보스 균열',
    summary: '보스 대상 추가 피해',
    body: '보스에게 주는 피해가 1 증가해 5루프 간격의 난관을 더 빨리 넘깁니다.',
    maxStacks: 2,
    tone: 'control',
  },
  {
    id: 'combo_charge',
    name: '콤보 축전기',
    summary: '스킬 충전량 증가',
    body: '연속 타격 시 스킬 게이지가 더 빠르게 차서 액티브 버튼이 자주 열립니다.',
    maxStacks: 2,
    tone: 'tempo',
  },
  {
    id: 'preview_plus',
    name: '리허설 라인',
    summary: '조준 미리보기 +1회',
    body: '드래그 중 벽 반사 예측선이 한 번 더 보여 첫 사용자 오발을 줄입니다.',
    maxStacks: 2,
    tone: 'control',
  },
  {
    id: 'safety_net',
    name: '하단 안전망',
    summary: '보호막 +1',
    body: '하강 실패를 한 번 더 버틸 수 있어 보스 직전 붕괴를 완화합니다.',
    maxStacks: 2,
    tone: 'defense',
  },
];

export const BOSSES: BossDefinition[] = [
  {
    id: 'vault_keeper',
    name: '볼트 키퍼',
    body: '2x2 철벽형 보스. 평딜로는 느리지만 보스 전용 피해에 약합니다.',
    color: '#1259D8',
    width: 2,
    height: 2,
  },
  {
    id: 'cactus_hydra',
    name: '가시 히드라',
    body: '넓은 반사체처럼 움직임을 어지럽히는 방해형 보스입니다.',
    color: '#1D8C69',
    width: 3,
    height: 2,
  },
  {
    id: 'steel_warden',
    name: '스틸 워든',
    body: '높은 체력과 느린 압박으로 루프 템포를 끊는 수문장입니다.',
    color: '#5E6677',
    width: 2,
    height: 3,
  },
];

export const BLOCK_CATALOG: BlockCatalogItem[] = [
  {
    kind: 'normal',
    name: '기본 블록',
    body: '가장 많이 등장하는 기본 타깃입니다.',
    tone: '#1664FF',
  },
  {
    kind: 'triangle',
    name: '삼각 블록',
    body: '대각 반사 성질이 강해 예측 없이 쏘면 각도가 크게 바뀝니다.',
    tone: '#4C79FF',
  },
  {
    kind: 'steel',
    name: '스틸 블록',
    body: '피해를 덜 받아 초반 공 수가 적으면 정리 효율이 떨어집니다.',
    tone: '#6D7585',
  },
  {
    kind: 'cactus',
    name: '가시 블록',
    body: '맞을 때마다 다음 착지점이 흔들려 조준 안정성을 무너뜨립니다.',
    tone: '#2C9D73',
  },
  {
    kind: 'bomb',
    name: '폭탄 블록',
    body: '파괴 시 주변 블록을 함께 태워 밀집 라인을 정리합니다.',
    tone: '#F46151',
  },
  {
    kind: 'ball',
    name: '볼 픽업',
    body: '닿기만 해도 다음 턴부터 발사 공 수가 늘어납니다.',
    tone: '#FF9A30',
  },
];

export const SUPPLY_REWARDS: SupplyReward[] = [
  { step: 1, gems: 1, label: '시작 보급' },
  { step: 2, gems: 1, label: '조준 기록' },
  { step: 3, gems: 1, label: '반사 연습' },
  { step: 4, gems: 1, label: '보스 대비' },
  { step: 5, gems: 2, label: '주간 보급' },
];

export function getCrewById(id: CrewId) {
  const crew = CREWS.find((entry) => entry.id === id);
  if (!crew) {
    throw new Error(`Unknown crew: ${id}`);
  }

  return crew;
}

export function getAugmentById(id: AugmentId) {
  const augment = AUGMENTS.find((entry) => entry.id === id);
  if (!augment) {
    throw new Error(`Unknown augment: ${id}`);
  }

  return augment;
}

export function getBossById(id: BossId) {
  const boss = BOSSES.find((entry) => entry.id === id);
  if (!boss) {
    throw new Error(`Unknown boss: ${id}`);
  }

  return boss;
}

export function getBlockCatalogByKind(kind: BlockKind) {
  const block = BLOCK_CATALOG.find((entry) => entry.kind === kind);
  if (!block) {
    throw new Error(`Unknown block kind: ${kind}`);
  }

  return block;
}
