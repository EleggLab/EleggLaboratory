export type CalendarType = 'solar' | 'lunar';
export type Gender = 'male' | 'female' | 'other' | 'unknown';
export type YearPillarRule = 'ipchun' | 'lunarNewYear' | 'custom';
export type MonthPillarRule = 'solarTerms' | 'lunarMonth';
export type JaSiBoundaryRule = '23-01_sameDay' | '23-01_nextDay' | 'configurable';
export type HiddenStemWeightsModel = 'dominant_only' | 'all_weighted';
export type StrengthModel = 'simple' | 'advanced_v1';
export type ElementDistributionModel = 'stems_only' | 'stems_branches' | 'stems_branches_hidden';
export type LuckComputationModel = 'simple' | 'advanced_v1';

export type Stem = '갑' | '을' | '병' | '정' | '무' | '기' | '경' | '신' | '임' | '계';
export type Branch = '자' | '축' | '인' | '묘' | '진' | '사' | '오' | '미' | '신' | '유' | '술' | '해';
export type Element = '목' | '화' | '토' | '금' | '수';
export type YinYang = '양' | '음';

export type TenGod =
  | '비견'
  | '겁재'
  | '식신'
  | '상관'
  | '편재'
  | '정재'
  | '편관'
  | '정관'
  | '편인'
  | '정인';

export interface BirthInput {
  calendar: CalendarType;
  date: string;
  time?: string;
  isLeapMonth?: boolean;
  timezone?: string;
  gender?: Gender;
  location?: { name?: string; lat: number; lon: number };
  options?: {
    yearPillarRule?: YearPillarRule;
    monthPillarRule?: MonthPillarRule;
    jaSiBoundaryRule?: JaSiBoundaryRule;
    jaSiBoundaryHour?: 0 | 23;
    customYearBoundary?: { month: number; day: number };
    includeHiddenStems?: boolean;
    hiddenStemWeights?: HiddenStemWeightsModel;
    elementDistributionModel?: ElementDistributionModel;
    strengthModel?: StrengthModel;
    luckComputationModel?: LuckComputationModel;
    luckStartAge?: number;
    applyLocalSolarTimeCorrection?: boolean;
  };
}

export interface HiddenStemDetail {
  stem: Stem;
  element: Element;
  yinYang: YinYang;
  tenGodToDayMaster?: TenGod;
  weight?: number;
}

export interface Pillar {
  stem: Stem;
  branch: Branch;
  stemElement: Element;
  stemYinYang: YinYang;
  branchElementPrimary: Element;
  hiddenStems?: HiddenStemDetail[];
}

export interface FourPillarsMeta {
  input: BirthInput;
  computedAt: string;
  calendarConversion?: {
    solar: string;
    lunar: { y: number; m: number; d: number; isLeap: boolean };
  };
  solarTerms?: {
    currentTerm?: string;
    nextTerm?: string;
    termMomentISO?: string;
  };
  notes: string[];
  confidence: {
    calendarConversion: 'high' | 'medium' | 'low';
    hourPillar: 'high' | 'medium' | 'low';
    pillarRuleAmbiguity: 'present' | 'none';
  };
  ruleVersion: {
    yearPillarRule: YearPillarRule;
    monthPillarRule: MonthPillarRule;
    jaSiBoundaryRule: JaSiBoundaryRule;
    elementDistributionModel: ElementDistributionModel;
    tenGods: 'v1';
    hiddenStems: 'v1';
    strengthModel: StrengthModel;
    luckComputationModel: LuckComputationModel;
    applyLocalSolarTimeCorrection: boolean;
  };
}

export interface FourPillars {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour?: Pillar;
  meta: FourPillarsMeta;
}

export type ElementCount = Record<Element, number>;
export type TenGodCount = Record<TenGod, number>;

export interface ElementDistribution {
  currentModel: ElementDistributionModel;
  counts: ElementCount;
  breakdown: {
    stems: ElementCount;
    branches: ElementCount;
    hiddenStems: ElementCount;
  };
}

export interface RelationHit {
  kind: 'clash' | 'threeHarmony' | 'stemCombine' | 'branchSixCombine' | 'harm' | 'break' | 'punishment';
  labels: string[];
  matched: string[];
}

export interface StrengthAnalysis {
  model: StrengthModel;
  level: '강' | '중' | '약';
  score?: number;
  reasons: string[];
}

export interface DerivedFeatures {
  dayMaster: Stem;
  dayPillar: string;
  tenGodCount: TenGodCount;
  elementDistribution: ElementDistribution;
  relations: RelationHit[];
  strength: StrengthAnalysis;
  keyTags: string[];
  hourCandidates?: string[];
}

export interface LuckCycle {
  startAge: number;
  endAge: number;
  pillar: { stem: Stem; branch: Branch };
  tenGodToDayMaster: TenGod;
  element: Element;
  tags: string[];
}

export interface AnnualLuckCycle {
  solarYear: number;
  age: number;
  pillar: { stem: Stem; branch: Branch };
  tenGodToDayMaster: TenGod;
  element: Element;
  tags: string[];
}

export interface MonthlyLuckCycle {
  solarYear: number;
  solarMonth: number;
  anchor: { date: string; time: string; timezone: string };
  pillar: { stem: Stem; branch: Branch };
  tenGodToDayMaster: TenGod;
  element: Element;
  tags: string[];
  notes: string[];
}

export interface SajuChartResult {
  fourPillars: FourPillars;
  features: DerivedFeatures;
  luck: {
    direction: 'forward' | 'backward';
    startAge: number;
    computedBy: LuckComputationModel;
    cycles: LuckCycle[];
    annualCycles: AnnualLuckCycle[];
  };
}

export interface CompareChartsResult {
  a: SajuChartResult;
  b: SajuChartResult;
  comparison: {
    sameDayMaster: boolean;
    dayMasterRelation: TenGod;
    dominantElements: { a: Element[]; b: Element[] };
    elementGap: ElementCount;
    notes: string[];
  };
}
