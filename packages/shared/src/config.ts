export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 4;
export const ROUND_COUNT = 10;
export const START_CASH = 30;
export const START_PRICE = 10;
export const MAX_HOLD_PER_STOCK = 4;
export const HINT_MARKET_SECONDS = 20;
export const STOCK_MARKET_SECONDS = 15;
export const SETTLEMENT_SECONDS = 5;
export const MAX_SELL_ORDERS_PER_PLAYER = 2;
export const MAX_BUY_REQUESTS_PER_PLAYER = 1;
export const TWO_PLAYER_MAX_SELL_ORDERS_PER_PLAYER = 3;
export const TWO_PLAYER_MAX_BUY_REQUESTS_PER_PLAYER = 2;
export const MAX_STOCK_ACTIONS_PER_ROUND = 3;
export const PRICE_OPTIONS = [1, 2, 3, 4, 5] as const;
export const AD_TAGS = [
  "즉시 활용",
  "후반 가치",
  "변동 큼",
  "태그 관련",
  "장기 정보",
] as const;
export const ROOM_CODE_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const ROOM_CODE_LENGTH = 5;
export const ROOM_CLEANUP_MS = 30 * 60 * 1000;

export const STOCK_DEFINITIONS = [
  { id: "A", code: "A", name: "알파디펜스", tags: ["방산", "제조"] as const },
  { id: "B", code: "B", name: "넥스트칩", tags: ["IT", "플랫폼"] as const },
  { id: "C", code: "C", name: "스타웨이브", tags: ["연예", "플랫폼"] as const },
  { id: "D", code: "D", name: "바이오실드", tags: ["바이오", "방산"] as const },
  { id: "E", code: "E", name: "메가로지", tags: ["물류", "제조"] as const },
] as const;

export const TAG_DEFINITIONS = [
  "방산",
  "제조",
  "플랫폼",
  "연예",
  "바이오",
  "물류",
  "IT",
] as const;

export const TAG_STOCK_MAP = {
  방산: ["A", "D"],
  제조: ["A", "E"],
  플랫폼: ["B", "C"],
  연예: ["C"],
  바이오: ["D"],
  물류: ["E"],
  IT: ["B"],
} as const;

export const GAME_TITLE = "통이 크시네!";
export const SUBCOPY_OPTIONS = [
  "정보는 사고팔고, 주식은 과감하게.",
  "눈치 빠른 사람이 돈 번다.",
  "큰손처럼 보이되, 들키진 마라.",
  "시장보다 무서운 건 사람이다.",
] as const;

export const PHASE_TYPE_LABELS = {
  overall: "전체",
  round: "이번",
} as const;

export const TARGET_TYPE_LABELS = {
  single: "개별",
  tag: "태그",
  market: "시장",
} as const;

export const INFO_TYPE_LABELS = {
  up: "상승",
  down: "하락",
  compare: "비교",
  exact: "정확수치",
} as const;

export const ROOM_PHASE_LABELS = {
  LOBBY: "대기",
  ROUND_SETUP: "준비",
  HINT_MARKET_OPEN: "힌트 거래",
  STOCK_MARKET_OPEN: "주식 거래",
  ROUND_SETTLEMENT: "정산",
  GAME_END: "게임 종료",
} as const;

export const ROOM_STATUS_LABELS = {
  LOBBY: "대기",
  IN_GAME: "진행중",
  GAME_END: "종료",
} as const;
