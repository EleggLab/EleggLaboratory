'use client';

import { useEffect, useMemo, useState } from 'react';
import { buildNarrative } from '@saju/core';
import type {
  AnnualLuckCycle,
  BirthInput,
  Branch,
  CompareChartsResult,
  Element,
  ElementDistributionModel,
  SajuChartResult,
  Stem,
  TenGod,
} from '@saju/core';
import { ElementLegend, LabelBadge } from '@saju/ui';
import { SOURCE_LINKS } from '../lib/sourceLinks';
import ElementChart from './ElementChart';
import PillarsMatrix from './PillarsMatrix';
import QnaPanel from './QnaPanel';

const ELEMENT_MODEL_LABEL: Record<ElementDistributionModel, string> = {
  stems_only: '천간만',
  stems_branches: '천간+지지(주오행)',
  stems_branches_hidden: '천간+지지+지장간(가중)',
};

const TEN_GOD_TRAITS: Record<TenGod, string> = {
  비견: '자기주도·동료 경쟁',
  겁재: '경쟁·분배·지출 관리',
  식신: '생산·루틴·실행',
  상관: '표현·변화·문제제기',
  편재: '기회·유동성·거래',
  정재: '안정·관리·실무',
  편관: '압박·도전·돌파',
  정관: '책임·평판·구조',
  편인: '직감·탐구·아이디어',
  정인: '학습·회복·지원',
};

function elementModelLabel(model: ElementDistributionModel): string {
  return ELEMENT_MODEL_LABEL[model] ?? model;
}

interface FormState {
  calendar: 'solar' | 'lunar';
  date: string;
  time: string;
  isLeapMonth: boolean;
  timezone: string;
  gender: 'male' | 'female' | 'other' | 'unknown';
  locationName: string;
  locationLat: string;
  locationLon: string;
  options: {
    yearPillarRule: 'ipchun' | 'lunarNewYear' | 'custom';
    monthPillarRule: 'solarTerms' | 'lunarMonth';
    jaSiBoundaryRule: '23-01_sameDay' | '23-01_nextDay' | 'configurable';
    jaSiBoundaryHour: 0 | 23;
    customYearBoundaryMonth: number;
    customYearBoundaryDay: number;
    includeHiddenStems: boolean;
    hiddenStemWeights: 'dominant_only' | 'all_weighted';
    elementDistributionModel: 'stems_only' | 'stems_branches' | 'stems_branches_hidden';
    strengthModel: 'simple' | 'advanced_v1';
    luckComputationModel: 'simple' | 'advanced_v1';
    luckStartAge: number;
    applyLocalSolarTimeCorrection: boolean;
  };
}

const DEFAULT_FORM: FormState = {
  calendar: 'solar',
  date: '1992-10-24',
  time: '05:30',
  isLeapMonth: false,
  timezone: 'Asia/Seoul',
  gender: 'unknown',
  locationName: '',
  locationLat: '',
  locationLon: '',
  options: {
    yearPillarRule: 'ipchun',
    monthPillarRule: 'solarTerms',
    jaSiBoundaryRule: '23-01_nextDay',
    jaSiBoundaryHour: 23,
    customYearBoundaryMonth: 2,
    customYearBoundaryDay: 4,
    includeHiddenStems: true,
    hiddenStemWeights: 'all_weighted',
    elementDistributionModel: 'stems_branches_hidden',
    strengthModel: 'advanced_v1',
    luckComputationModel: 'simple',
    luckStartAge: 7,
    applyLocalSolarTimeCorrection: false,
  },
};

type TabKey = 'summary' | 'detail' | 'compare' | 'qna' | 'settings';

interface SavedChart {
  id: string;
  name: string;
  createdAt: string;
  input: BirthInput;
  preview: {
    date: string;
    dayPillar: string;
  };
}

interface YearLuckResponse {
  solarYear: number;
  cycle: AnnualLuckCycle;
}

interface MonthLuckCycle {
  pillar: { stem: Stem; branch: Branch };
  tenGodToDayMaster: TenGod;
  element: Element;
  tags: string[];
  notes: string[];
}

interface MonthLuckResponse {
  solarYear: number;
  solarMonth: number;
  anchor: {
    date: string;
    time: string;
    timezone: string;
  };
  cycle: MonthLuckCycle;
}

const SAVED_CHARTS_KEY = 'saju.savedCharts.v1';

async function fetchSaju(input: BirthInput, timeoutMs = 15000): Promise<SajuChartResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch('/api/saju', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
      signal: controller.signal,
    });

    const text = await res.text();
    let json: { error?: string } = {};
    if (text) {
      try {
        json = JSON.parse(text) as { error?: string };
      } catch {
        json = {};
      }
    }

    if (!res.ok) {
      throw new Error(json.error ?? '사주 계산 요청에 실패했습니다.');
    }

    return json as unknown as SajuChartResult;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('사주 계산 요청이 지연되어 취소되었습니다. 잠시 후 다시 시도해 주세요.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchCompare(
  a: BirthInput,
  b: BirthInput,
  timeoutMs = 15000,
): Promise<CompareChartsResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch('/api/compare', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ a, b }),
      signal: controller.signal,
    });

    const text = await res.text();
    let json: { error?: string } = {};
    if (text) {
      try {
        json = JSON.parse(text) as { error?: string };
      } catch {
        json = {};
      }
    }

    if (!res.ok) {
      throw new Error(json.error ?? '비교 요청에 실패했습니다.');
    }

    return json as unknown as CompareChartsResult;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('비교 요청이 지연되어 취소되었습니다. 잠시 후 다시 시도해 주세요.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchYearLuck(
  birthInput: BirthInput,
  solarYear: number,
  timeoutMs = 15000,
): Promise<YearLuckResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch('/api/year-luck', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ birthInput, solarYear }),
      signal: controller.signal,
    });

    const text = await res.text();
    let json: { error?: string } = {};
    if (text) {
      try {
        json = JSON.parse(text) as { error?: string };
      } catch {
        json = {};
      }
    }

    if (!res.ok) {
      throw new Error(json.error ?? '지정 연도 운 계산에 실패했습니다.');
    }

    return json as unknown as YearLuckResponse;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('지정 연도 운 계산이 지연되어 취소되었습니다. 잠시 후 다시 시도해 주세요.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchMonthLuck(
  birthInput: BirthInput,
  solarYear: number,
  solarMonth: number,
  timeoutMs = 15000,
): Promise<MonthLuckResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch('/api/month-luck', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ birthInput, solarYear, solarMonth }),
      signal: controller.signal,
    });

    const text = await res.text();
    let json: { error?: string } = {};
    if (text) {
      try {
        json = JSON.parse(text) as { error?: string };
      } catch {
        json = {};
      }
    }

    if (!res.ok) {
      throw new Error(json.error ?? '지정 월 운 계산에 실패했습니다.');
    }

    return json as unknown as MonthLuckResponse;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('지정 월 운 계산이 지연되어 취소되었습니다. 잠시 후 다시 시도해 주세요.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : undefined;
}

function toBirthInput(form: FormState): BirthInput {
  const options: NonNullable<BirthInput['options']> = {
    yearPillarRule: form.options.yearPillarRule,
    monthPillarRule: form.options.monthPillarRule,
    jaSiBoundaryRule: form.options.jaSiBoundaryRule,
    jaSiBoundaryHour: form.options.jaSiBoundaryHour,
    includeHiddenStems: form.options.includeHiddenStems,
    hiddenStemWeights: form.options.hiddenStemWeights,
    elementDistributionModel: form.options.elementDistributionModel,
    strengthModel: form.options.strengthModel,
    luckComputationModel: form.options.luckComputationModel,
    luckStartAge: form.options.luckStartAge,
    applyLocalSolarTimeCorrection: form.options.applyLocalSolarTimeCorrection,
  };

  if (form.options.yearPillarRule === 'custom') {
    options.customYearBoundary = {
      month: form.options.customYearBoundaryMonth,
      day: form.options.customYearBoundaryDay,
    };
  }

  const input: BirthInput = {
    calendar: form.calendar,
    date: form.date,
    timezone: form.timezone,
    gender: form.gender,
    options,
  };

  if (form.time) {
    input.time = form.time;
  }
  if (form.calendar === 'lunar') {
    input.isLeapMonth = form.isLeapMonth;
  }

  const lat = parseOptionalNumber(form.locationLat);
  const lon = parseOptionalNumber(form.locationLon);
  if (lat !== undefined && lon !== undefined) {
    input.location = {
      lat,
      lon,
      ...(form.locationName.trim() ? { name: form.locationName.trim() } : {}),
    };
  }

  return input;
}

function toFormState(input: BirthInput): FormState {
  const base = structuredClone(DEFAULT_FORM);

  base.calendar = input.calendar;
  base.date = input.date;
  base.time = input.time ?? '';
  base.timezone = input.timezone ?? 'Asia/Seoul';
  base.gender = input.gender ?? 'unknown';
  base.isLeapMonth = input.isLeapMonth ?? false;
  base.locationName = input.location?.name ?? '';
  base.locationLat = input.location?.lat !== undefined ? String(input.location.lat) : '';
  base.locationLon = input.location?.lon !== undefined ? String(input.location.lon) : '';

  const opts = input.options;
  if (opts) {
    base.options.yearPillarRule = opts.yearPillarRule ?? base.options.yearPillarRule;
    base.options.monthPillarRule = opts.monthPillarRule ?? base.options.monthPillarRule;
    base.options.jaSiBoundaryRule = opts.jaSiBoundaryRule ?? base.options.jaSiBoundaryRule;
    base.options.jaSiBoundaryHour = opts.jaSiBoundaryHour ?? base.options.jaSiBoundaryHour;
    base.options.includeHiddenStems = opts.includeHiddenStems ?? base.options.includeHiddenStems;
    base.options.hiddenStemWeights = opts.hiddenStemWeights ?? base.options.hiddenStemWeights;
    base.options.elementDistributionModel =
      opts.elementDistributionModel ?? base.options.elementDistributionModel;
    base.options.strengthModel = opts.strengthModel ?? base.options.strengthModel;
    base.options.luckComputationModel = opts.luckComputationModel ?? base.options.luckComputationModel;
    base.options.luckStartAge = opts.luckStartAge ?? base.options.luckStartAge;
    base.options.applyLocalSolarTimeCorrection =
      opts.applyLocalSolarTimeCorrection ?? base.options.applyLocalSolarTimeCorrection;

    if (opts.customYearBoundary) {
      base.options.customYearBoundaryMonth = opts.customYearBoundary.month;
      base.options.customYearBoundaryDay = opts.customYearBoundary.day;
    }
  }

  return base;
}

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(encoded: string): string {
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const padded = `${base64}${'='.repeat((4 - (base64.length % 4 || 4)) % 4)}`;
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encodeBirthInputForShare(input: BirthInput): string {
  return toBase64Url(JSON.stringify(input));
}

function decodeBirthInputFromShare(encoded: string): BirthInput | null {
  try {
    const json = fromBase64Url(encoded);
    return JSON.parse(json) as BirthInput;
  } catch {
    return null;
  }
}

function createSavedChart(input: BirthInput, computed: SajuChartResult): SavedChart {
  const now = new Date();
  return {
    id: `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    name: `${input.date} ${computed.fourPillars.day.stem}${computed.fourPillars.day.branch}`,
    createdAt: now.toISOString(),
    input,
    preview: {
      date: input.date,
      dayPillar: `${computed.fourPillars.day.stem}${computed.fourPillars.day.branch}`,
    },
  };
}

function getStrengthScore(result: SajuChartResult): number {
  if (typeof result.features.strength.score === 'number') {
    return result.features.strength.score;
  }

  if (result.features.strength.level === '강') {
    return 70;
  }
  if (result.features.strength.level === '중') {
    return 50;
  }
  return 30;
}

function getTopTenGods(result: SajuChartResult, topN = 3): Array<[string, number]> {
  return Object.entries(result.features.tenGodCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN);
}

function getElementBalanceInsight(result: SajuChartResult): {
  dominant: string[];
  lacking: string[];
} {
  const sorted = Object.entries(result.features.elementDistribution.counts).sort((a, b) => b[1] - a[1]);
  const dominant = sorted
    .slice(0, 2)
    .filter(([, value]) => value > 0)
    .map(([element]) => element);
  const lacking = sorted
    .slice(-2)
    .filter(([, value]) => value <= 1)
    .map(([element]) => element);
  return { dominant, lacking };
}

function formatSavedDate(value: string): string {
  return value.split('T')[0] ?? value;
}

export default function SajuCalculatorClient(): React.JSX.Element {
  const [tab, setTab] = useState<TabKey>('summary');
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [showInput, setShowInput] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [result, setResult] = useState<SajuChartResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [yearInput, setYearInput] = useState(String(new Date().getFullYear()));
  const [monthInput, setMonthInput] = useState(() => {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    return `${now.getFullYear()}-${mm}`;
  });
  const [yearLuckLoading, setYearLuckLoading] = useState(false);
  const [yearLuckCycle, setYearLuckCycle] = useState<AnnualLuckCycle | null>(null);
  const [monthLuckLoading, setMonthLuckLoading] = useState(false);
  const [monthLuck, setMonthLuck] = useState<MonthLuckResponse | null>(null);
  const [savedCharts, setSavedCharts] = useState<SavedChart[]>([]);
  const [savedSearch, setSavedSearch] = useState('');
  const [compareAId, setCompareAId] = useState('');
  const [compareBId, setCompareBId] = useState('');
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareResult, setCompareResult] = useState<CompareChartsResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const birthInputForQna = useMemo(
    () => (result ? result.fourPillars.meta.input : toBirthInput(form)),
    [result, form],
  );
  const filteredSavedCharts = useMemo(() => {
    const q = savedSearch.trim().toLowerCase();
    if (!q) {
      return savedCharts;
    }
    return savedCharts.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.preview.dayPillar.toLowerCase().includes(q) ||
        item.preview.date.includes(q),
    );
  }, [savedCharts, savedSearch]);
  const compareAChart = useMemo(
    () => savedCharts.find((item) => item.id === compareAId) ?? null,
    [savedCharts, compareAId],
  );
  const compareBChart = useMemo(
    () => savedCharts.find((item) => item.id === compareBId) ?? null,
    [savedCharts, compareBId],
  );
  const narrative = useMemo(
    () => (result ? buildNarrative(result, yearLuckCycle) : null),
    [result, yearLuckCycle],
  );
  const monthLuckText = useMemo(() => {
    if (!monthLuck) {
      return null;
    }
    const insight = result ? getElementBalanceInsight(result) : null;
    const dom = insight?.dominant ?? [];
    const domText = dom.length ? `기존 우세 오행(${dom.join('/')})` : '기존 오행 균형';
    const tenGod = monthLuck.cycle.tenGodToDayMaster;
    const trait = TEN_GOD_TRAITS[tenGod] ?? '역할 변화';
    const pillarText = `${monthLuck.cycle.pillar.stem}${monthLuck.cycle.pillar.branch}`;
    const title = `${monthLuck.solarYear}년 ${String(monthLuck.solarMonth).padStart(2, '0')}월 이달운(월운)`;
    return [
      `[${title}]`,
      `- 월운: ${pillarText} / ${tenGod}(${trait}) / 오행 ${monthLuck.cycle.element}`,
      `- 포인트: 이번 달은 ${tenGod} 테마가 강해지기 쉬워, ${trait} 방향으로 선택을 정리하면 체감이 빨라질 수 있습니다.`,
      `- 균형: ${domText}과의 균형을 보면서 속도·지출·관계 에너지를 조절하세요.`,
      '',
      '[작게 적용해보기]',
      '- 늘릴 것 1개(습관/성과/관계) + 줄일 것 1개(소비/과속/미루기)를 정해보세요.',
      '- 큰 결정보다, 반복 가능한 루틴 1개를 먼저 고정하는 편이 안전합니다.',
    ].join('\n');
  }, [monthLuck, result]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const raw = window.localStorage.getItem(SAVED_CHARTS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SavedChart[];
        setSavedCharts(Array.isArray(parsed) ? parsed : []);
      }
    } catch {
      setSavedCharts([]);
    }

    const shared = new URLSearchParams(window.location.search).get('bi');
    if (!shared) {
      return;
    }
    const decoded = decodeBirthInputFromShare(shared);
    if (!decoded) {
      setMessage('공유 링크 파싱에 실패했습니다. 기본 입력값으로 시작합니다.');
      return;
    }
    setForm(toFormState(decoded));
    setMessage('공유 링크에서 입력값을 불러왔습니다.');
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(SAVED_CHARTS_KEY, JSON.stringify(savedCharts));
  }, [savedCharts]);

  const handleFetchYearLuck = async (input: BirthInput, year: number): Promise<void> => {
    setYearLuckLoading(true);
    try {
      const response = await fetchYearLuck(input, year);
      setYearLuckCycle(response.cycle);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '지정 연도 운 계산 중 오류가 발생했습니다.';
      setError(msg);
      setYearLuckCycle(null);
    } finally {
      setYearLuckLoading(false);
    }
  };

  const handleFetchMonthLuck = async (input: BirthInput, year: number, month: number): Promise<void> => {
    setMonthLuckLoading(true);
    try {
      const response = await fetchMonthLuck(input, year, month);
      setMonthLuck(response);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '지정 월 운 계산 중 오류가 발생했습니다.';
      setError(msg);
      setMonthLuck(null);
    } finally {
      setMonthLuckLoading(false);
    }
  };

  const handleCompute = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const input = toBirthInput(form);
      const computed = await fetchSaju(input);
      setResult(computed);
      setMonthLuck(null);
      setShowInput(false);
      if (tab === 'settings' || tab === 'compare') {
        setTab('summary');
      }
      const targetYear = Number(yearInput);
      if (Number.isInteger(targetYear) && targetYear >= 1900 && targetYear <= 2100) {
        await handleFetchYearLuck(input, targetYear);
      } else {
        setYearLuckCycle(null);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '계산 중 오류가 발생했습니다.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCurrent = (): void => {
    if (!result) {
      setMessage('저장할 계산 결과가 없습니다.');
      return;
    }

    const input = birthInputForQna;
    const template = createSavedChart(input, result);
    const customName = window.prompt('저장 이름을 입력하세요', template.name);
    if (customName === null) {
      return;
    }
    const trimmed = customName.trim();
    const next: SavedChart = {
      ...template,
      name: trimmed || template.name,
    };
    setSavedCharts((prev) => [next, ...prev]);
    setMessage(`저장 완료: ${next.name}`);
  };

  const handleDeleteSaved = (id: string): void => {
    setSavedCharts((prev) => prev.filter((item) => item.id !== id));
    if (compareAId === id) {
      setCompareAId('');
    }
    if (compareBId === id) {
      setCompareBId('');
    }
  };

  const loadSavedChart = async (item: SavedChart, computeNow: boolean): Promise<void> => {
    const nextForm = toFormState(item.input);
    setForm(nextForm);
    setMessage(`불러옴: ${item.name}`);

    if (!computeNow) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const computed = await fetchSaju(item.input);
      setResult(computed);
      setMonthLuck(null);
      setShowInput(false);
      setTab('summary');
      const targetYear = Number(yearInput);
      if (Number.isInteger(targetYear) && targetYear >= 1900 && targetYear <= 2100) {
        await handleFetchYearLuck(item.input, targetYear);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '불러오기 계산 중 오류가 발생했습니다.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async (): Promise<void> => {
    if (!compareAChart || !compareBChart) {
      setMessage('비교할 두 명조를 먼저 선택해 주세요.');
      return;
    }

    setCompareLoading(true);
    setError(null);
    setCompareResult(null);
    try {
      const compared = await fetchCompare(compareAChart.input, compareBChart.input);
      setCompareResult(compared);
      setMessage(`비교 완료: ${compareAChart.name} vs ${compareBChart.name}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '비교 중 오류가 발생했습니다.';
      setError(msg);
    } finally {
      setCompareLoading(false);
    }
  };

  const handleCopyShareLink = async (): Promise<void> => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const current = result ? result.fourPillars.meta.input : toBirthInput(form);
      const encoded = encodeBirthInputForShare(current);
      const url = new URL(window.location.href);
      url.searchParams.set('bi', encoded);
      await navigator.clipboard.writeText(url.toString());
      setMessage('입력 공유 링크를 클립보드에 복사했습니다.');
    } catch {
      setMessage('공유 링크 복사에 실패했습니다.');
    }
  };

  const handleYearLuckSubmit = async (): Promise<void> => {
    if (!result) {
      return;
    }
    const targetYear = Number(yearInput);
    if (!Number.isInteger(targetYear) || targetYear < 1900 || targetYear > 2100) {
      setMessage('연도는 1900~2100 사이 정수로 입력해 주세요.');
      return;
    }
    await handleFetchYearLuck(birthInputForQna, targetYear);
    setMessage(`${targetYear}년 한해운을 반영했습니다.`);
  };

  const handleMonthLuckSubmit = async (): Promise<void> => {
    if (!result) {
      return;
    }
    const match = /^(\d{4})-(\d{2})$/.exec(monthInput.trim());
    if (!match) {
      setMessage('월은 YYYY-MM 형식으로 입력해 주세요.');
      return;
    }
    const targetYear = Number(match[1]);
    const targetMonth = Number(match[2]);
    if (
      !Number.isInteger(targetYear) ||
      targetYear < 1900 ||
      targetYear > 2100 ||
      !Number.isInteger(targetMonth) ||
      targetMonth < 1 ||
      targetMonth > 12
    ) {
      setMessage('월은 1900-01 ~ 2100-12 범위로 입력해 주세요.');
      return;
    }
    await handleFetchMonthLuck(birthInputForQna, targetYear, targetMonth);
    setMessage(`${targetYear}-${String(targetMonth).padStart(2, '0')} 이달운을 반영했습니다.`);
  };

  const topTenGods = result ? getTopTenGods(result) : [];
  const elementInsight = result ? getElementBalanceInsight(result) : null;
  const luckPreview = result ? result.luck.cycles.slice(0, 3) : [];

  return (
    <main className="container">
      <section className="hero">
        <h1>사주 계산 · 해석 · 분야별 Q&A</h1>
        <p>계산 사실과 해석(규칙/템플릿)을 분리해 보여주는 신뢰도 중심 MVP</p>
      </section>

      <div className={`grid ${showInput ? '' : 'single'}`}>
        {showInput ? (
        <section className="panel">
          <h2>입력</h2>
          <form onSubmit={handleCompute} className="form-grid">
            <label>
              달력
              <select
                value={form.calendar}
                onChange={(e) => setForm((prev) => ({ ...prev, calendar: e.target.value as FormState['calendar'] }))}
              >
                <option value="solar">양력</option>
                <option value="lunar">음력</option>
              </select>
            </label>

            <label>
              날짜
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                required
              />
            </label>

            <label>
              시간 (모르면 비움)
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm((prev) => ({ ...prev, time: e.target.value }))}
              />
            </label>

            <label>
              성별
              <select
                value={form.gender}
                onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value as FormState['gender'] }))}
              >
                <option value="unknown">미입력</option>
                <option value="male">남성</option>
                <option value="female">여성</option>
                <option value="other">기타</option>
              </select>
            </label>

            <details
              className="section-card"
              open={showAdvanced}
              onToggle={(event) => setShowAdvanced((event.currentTarget as HTMLDetailsElement).open)}
              style={{ gridColumn: '1 / -1' }}
            >
              <summary>상세 설정</summary>
              <div className="form-grid" style={{ marginTop: '0.6rem' }}>
            <label>
              출생지명 (선택)
              <input
                value={form.locationName}
                onChange={(e) => setForm((prev) => ({ ...prev, locationName: e.target.value }))}
                placeholder="예: 서울"
              />
            </label>

            <label>
              위도/경도 (선택)
              <input
                value={form.locationLat}
                onChange={(e) => setForm((prev) => ({ ...prev, locationLat: e.target.value }))}
                placeholder="37.5665"
              />
            </label>

            <label>
              경도 (선택)
              <input
                value={form.locationLon}
                onChange={(e) => setForm((prev) => ({ ...prev, locationLon: e.target.value }))}
                placeholder="126.9780"
              />
            </label>

            <label>
              출생지 태양시 보정
              <select
                value={String(form.options.applyLocalSolarTimeCorrection)}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    options: {
                      ...prev.options,
                      applyLocalSolarTimeCorrection: e.target.value === 'true',
                    },
                  }))
                }
              >
                <option value="false">미적용(기본)</option>
                <option value="true">적용</option>
              </select>
            </label>

            {form.calendar === 'lunar' ? (
              <label>
                윤달
                <select
                  value={String(form.isLeapMonth)}
                  onChange={(e) => setForm((prev) => ({ ...prev, isLeapMonth: e.target.value === 'true' }))}
                >
                  <option value="false">평달</option>
                  <option value="true">윤달</option>
                </select>
              </label>
            ) : null}

            <label>
              년주 기준
              <select
                value={form.options.yearPillarRule}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    options: { ...prev.options, yearPillarRule: e.target.value as FormState['options']['yearPillarRule'] },
                  }))
                }
              >
                <option value="ipchun">입춘 기준(기본)</option>
                <option value="lunarNewYear">음력설 기준</option>
                <option value="custom">커스텀 경계</option>
              </select>
            </label>

            {form.options.yearPillarRule === 'custom' ? (
              <>
                <label>
                  커스텀 경계 월
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={form.options.customYearBoundaryMonth}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        options: {
                          ...prev.options,
                          customYearBoundaryMonth: Number(e.target.value) || 2,
                        },
                      }))
                    }
                  />
                </label>
                <label>
                  커스텀 경계 일
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={form.options.customYearBoundaryDay}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        options: {
                          ...prev.options,
                          customYearBoundaryDay: Number(e.target.value) || 4,
                        },
                      }))
                    }
                  />
                </label>
              </>
            ) : null}

            <label>
              월주 기준
              <select
                value={form.options.monthPillarRule}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    options: {
                      ...prev.options,
                      monthPillarRule: e.target.value as FormState['options']['monthPillarRule'],
                    },
                  }))
                }
              >
                <option value="solarTerms">절기 기준(기본)</option>
                <option value="lunarMonth">음력 월 기준</option>
              </select>
            </label>

            <label>
              자시 경계
              <select
                value={form.options.jaSiBoundaryRule}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    options: {
                      ...prev.options,
                      jaSiBoundaryRule: e.target.value as FormState['options']['jaSiBoundaryRule'],
                    },
                  }))
                }
              >
                <option value="23-01_nextDay">23시를 다음날로</option>
                <option value="23-01_sameDay">23시를 당일로</option>
                <option value="configurable">configurable</option>
              </select>
            </label>

            {form.options.jaSiBoundaryRule === 'configurable' ? (
              <label>
                configurable 경계시
                <select
                  value={String(form.options.jaSiBoundaryHour)}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      options: {
                        ...prev.options,
                        jaSiBoundaryHour: Number(e.target.value) as 0 | 23,
                      },
                    }))
                  }
                >
                  <option value="23">23:00</option>
                  <option value="0">00:00</option>
                </select>
              </label>
            ) : null}

            <label>
              오행 집계 모델
              <select
                value={form.options.elementDistributionModel}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    options: {
                      ...prev.options,
                      elementDistributionModel: e.target.value as FormState['options']['elementDistributionModel'],
                    },
                  }))
                }
              >
                <option value="stems_only">천간만</option>
                <option value="stems_branches">천간+지지</option>
                <option value="stems_branches_hidden">천간+지지+지장간</option>
              </select>
            </label>

            <label>
              지장간 집계
              <select
                value={String(form.options.includeHiddenStems)}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    options: { ...prev.options, includeHiddenStems: e.target.value === 'true' },
                  }))
                }
              >
                <option value="true">포함</option>
                <option value="false">미포함</option>
              </select>
            </label>

            <label>
              지장간 가중치
              <select
                value={form.options.hiddenStemWeights}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    options: {
                      ...prev.options,
                      hiddenStemWeights: e.target.value as FormState['options']['hiddenStemWeights'],
                    },
                  }))
                }
              >
                <option value="all_weighted">all_weighted</option>
                <option value="dominant_only">dominant_only</option>
              </select>
            </label>

            <label>
              대운 시작 산식
              <select
                value={form.options.luckComputationModel}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    options: {
                      ...prev.options,
                      luckComputationModel: e.target.value as FormState['options']['luckComputationModel'],
                    },
                  }))
                }
              >
                <option value="simple">simple(수동 시작나이)</option>
                <option value="advanced_v1">advanced_v1(절기 간격 환산)</option>
              </select>
            </label>

            <label>
              대운 시작 나이(simple)
              <input
                type="number"
                min={0}
                max={20}
                value={form.options.luckStartAge}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    options: { ...prev.options, luckStartAge: Number(e.target.value) || 7 },
                  }))
                }
                disabled={form.options.luckComputationModel !== 'simple'}
              />
            </label>
              </div>
            </details>

            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.5rem' }}>
              <button type="submit" disabled={loading}>
                {loading ? '계산 중...' : '사주 계산'}
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setForm(DEFAULT_FORM);
                  setShowAdvanced(false);
                }}
              >
                기본값
              </button>
            </div>
          </form>

          {error ? <div className="warning" style={{ marginTop: '0.7rem' }}>{error}</div> : null}
          {message ? <div className="meta" style={{ marginTop: '0.5rem' }}>{message}</div> : null}
        </section>
        ) : null}

        <section className="panel">
          {!showInput && result ? (
            <div style={{ marginBottom: '0.6rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="secondary" onClick={() => setShowInput(true)}>
                입력 다시 열기
              </button>
            </div>
          ) : null}

            <div className="tabs">
              {[
                ['summary', '결과'],
                ['qna', '분야별 Q&A'],
                ['settings', '근거/설정'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                className={`tab ${tab === key ? 'active' : ''}`}
                onClick={() => setTab(key as TabKey)}
                aria-pressed={tab === key}
                aria-label={`${label} 탭 열기`}
              >
                {label}
              </button>
            ))}
          </div>

          {!result ? <div className="meta">입력을 제출하면 결과가 표시됩니다.</div> : null}

          {result && tab === 'summary' ? (
            <div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                <button type="button" className="secondary" onClick={handleSaveCurrent}>
                  현재 결과 저장
                </button>
                <button type="button" className="secondary" onClick={() => void handleCopyShareLink()}>
                  입력 링크 복사
                </button>
              </div>

              <div className="badges">
                <LabelBadge label="계산 결과" tone="calculation" />
                <LabelBadge label="해석 규칙" tone="rule" />
              </div>

              <details className="section-card" open>
                <summary>결과표(명조)</summary>
                <div style={{ marginTop: '0.6rem' }}>
                  <PillarsMatrix chart={result} />
                </div>
              </details>

              <details className="section-card">
                <summary>요약</summary>
                <p className="meta" style={{ marginTop: '0.6rem' }}>
                  일주 {result.fourPillars.day.stem}
                  {result.fourPillars.day.branch} · 일간 {result.fourPillars.day.stemElement} · 강약{' '}
                  {result.features.strength.level}
                </p>
                <div className="chip-row">
                  {result.features.keyTags.map((tag) => (
                    <span key={tag} className="pill">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="chip-row" style={{ marginTop: '0.45rem' }}>
                  <span className="pill">우세 오행: {elementInsight?.dominant.join(', ') || '없음'}</span>
                  <span className="pill">보완 오행: {elementInsight?.lacking.join(', ') || '없음'}</span>
                  {topTenGods.map(([name, value]) => (
                    <span key={name} className="pill">
                      {name} {value}
                    </span>
                  ))}
                </div>
              </details>

              <details className="section-card">
                <summary>종합 해석(자연어)</summary>
                {narrative ? (
                  <div style={{ marginTop: '0.6rem' }}>
                    <div className="meta" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.75 }}>
                      {narrative.profile}
                    </div>
                    <div className="meta" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.75, marginTop: '0.65rem' }}>
                      {narrative.overallLuck}
                    </div>

                    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.55rem' }}>
                      <label style={{ minWidth: '180px' }}>
                        지정 연도 한해운
                        <input
                          type="number"
                          min={1900}
                          max={2100}
                          value={yearInput}
                          onChange={(e) => setYearInput(e.target.value)}
                        />
                      </label>
                      <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => void handleYearLuckSubmit()}
                          disabled={yearLuckLoading}
                        >
                          {yearLuckLoading ? '계산 중...' : '한해운 보기'}
                        </button>
                      </div>

                      <label style={{ minWidth: '180px' }}>
                        지정 월 이달운
                        <input type="month" value={monthInput} onChange={(e) => setMonthInput(e.target.value)} />
                      </label>
                      <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => void handleMonthLuckSubmit()}
                          disabled={monthLuckLoading}
                        >
                          {monthLuckLoading ? '계산 중...' : '이달운 보기'}
                        </button>
                      </div>
                    </div>

                    {narrative.yearlyLuck ? (
                      <div className="meta" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.75, marginTop: '0.55rem' }}>
                        {narrative.yearlyLuck}
                      </div>
                    ) : (
                      <p className="meta" style={{ marginTop: '0.55rem' }}>
                        지정 연도를 선택하면 해당 연도의 한해운을 자연어로 보여줍니다.
                      </p>
                    )}

                    {monthLuckText ? (
                      <>
                        <div className="meta" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.75, marginTop: '0.45rem' }}>
                          {monthLuckText}
                        </div>
                        {monthLuck?.cycle.notes?.length ? (
                          <ul className="meta" style={{ marginTop: '0.35rem' }}>
                            {monthLuck.cycle.notes.map((note) => (
                              <li key={note}>{note}</li>
                            ))}
                          </ul>
                        ) : null}
                      </>
                    ) : (
                      <p className="meta" style={{ marginTop: '0.45rem' }}>
                        지정 월을 선택하면 해당 월의 이달운(월운)을 자연어로 보여줍니다.
                      </p>
                    )}

                  </div>
                ) : (
                  <div className="meta" style={{ marginTop: '0.6rem' }}>
                    아직 계산 결과가 없어 종합 해석을 표시할 수 없습니다.
                  </div>
                )}
              </details>

              <details className="section-card">
                <summary>대운 미리보기</summary>
                <div className="chip-row" style={{ marginTop: '0.6rem' }}>
                  {luckPreview.map((cycle) => (
                    <span key={`${cycle.startAge}-${cycle.pillar.stem}${cycle.pillar.branch}`} className="pill">
                      {cycle.startAge}-{cycle.endAge}세 {cycle.pillar.stem}
                      {cycle.pillar.branch} ({cycle.tenGodToDayMaster})
                    </span>
                  ))}
                </div>
                <p className="meta" style={{ marginTop: '0.45rem' }}>
                  참고: 웹은 테스트용 UI이며, 앱(Expo)에서 “결과표 → 자연어 풀이 → Q&A” 흐름으로 더 단순하게 제공합니다.
                </p>
              </details>

              <details className="section-card">
                <summary>오행 차트</summary>
                <p className="meta" style={{ marginTop: '0.6rem' }}>
                  집계 방식: {elementModelLabel(result.features.elementDistribution.currentModel)}
                </p>
                <ElementChart distribution={result.features.elementDistribution} />
                <div style={{ marginTop: '0.5rem' }}>
                  <ElementLegend counts={result.features.elementDistribution.counts} />
                </div>
              </details>
            </div>
          ) : null}

          {result && tab === 'detail' ? (
            <div>
              <details className="section-card" open>
                <summary>강약 분석</summary>
                <div
                  style={{
                    width: '100%',
                    height: '12px',
                    borderRadius: '999px',
                    background: '#e5e7eb',
                    overflow: 'hidden',
                    marginTop: '0.6rem',
                  }}
                >
                  <div
                    style={{
                      width: `${getStrengthScore(result)}%`,
                      height: '100%',
                      background: '#2c6e63',
                    }}
                  />
                </div>
                <div className="meta" style={{ marginTop: '0.3rem' }}>
                  레벨: {result.features.strength.level}
                  {typeof result.features.strength.score === 'number' ? ` / 점수: ${result.features.strength.score}` : ''}
                </div>
                <ul className="meta">
                  {result.features.strength.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </details>

              <details className="section-card" open>
                <summary>십성 분포</summary>
                <table className="table" style={{ marginTop: '0.6rem' }}>
                  <tbody>
                    {Object.entries(result.features.tenGodCount).map(([key, value]) => (
                      <tr key={key}>
                        <th>{key}</th>
                        <td>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>

              <details className="section-card">
                <summary>관계(합/충/삼합)</summary>
                {result.features.relations.length === 0 ? (
                  <div className="meta" style={{ marginTop: '0.6rem' }}>감지된 주요 관계 없음</div>
                ) : (
                  <ul className="meta" style={{ marginTop: '0.6rem' }}>
                    {result.features.relations.map((rel) => (
                      <li key={`${rel.kind}-${rel.matched.join(',')}`}>
                        [{rel.kind}] {rel.matched.join(', ')}
                      </li>
                    ))}
                  </ul>
                )}
              </details>

              <details className="section-card" open>
                <summary>대운 타임라인</summary>
                <div className="meta" style={{ marginTop: '0.6rem', marginBottom: '0.4rem' }}>
                  대운 시작 나이: {result.luck.startAge}
                </div>
                <div className="timeline">
                  {result.luck.cycles.map((cycle) => (
                    <div key={`${cycle.startAge}-${cycle.pillar.stem}${cycle.pillar.branch}`} className="timeline-item">
                      <span>
                        {cycle.startAge}-{cycle.endAge}세
                      </span>
                      <span>
                        {cycle.pillar.stem}
                        {cycle.pillar.branch} · {cycle.tenGodToDayMaster}
                      </span>
                    </div>
                  ))}
                </div>
              </details>

              <details className="section-card">
                <summary>세운(연운) 10년</summary>
                <div className="timeline" style={{ marginTop: '0.6rem' }}>
                  {result.luck.annualCycles.map((cycle) => (
                    <div key={`${cycle.solarYear}-${cycle.pillar.stem}${cycle.pillar.branch}`} className="timeline-item">
                      <span>
                        {cycle.solarYear}년 ({cycle.age}세)
                      </span>
                      <span>
                        {cycle.pillar.stem}
                        {cycle.pillar.branch} · {cycle.tenGodToDayMaster}
                      </span>
                    </div>
                  ))}
                </div>
              </details>

              {!result.fourPillars.hour && result.features.hourCandidates?.length ? (
                <details className="section-card">
                  <summary>시주 후보(시간 미입력)</summary>
                  <div className="meta" style={{ marginTop: '0.6rem' }}>{result.features.hourCandidates.join(', ')}</div>
                </details>
              ) : null}
            </div>
          ) : null}

          {tab === 'compare' ? (
            <div>
              <h2>저장 명조 비교</h2>
              {savedCharts.length < 2 ? (
                <div className="meta">
                  비교를 위해 최소 2개의 명조가 필요합니다. 결과 요약 탭에서 먼저 저장해 주세요.
                </div>
              ) : (
                <>
                  <label>
                    비교 대상 A
                    <select value={compareAId} onChange={(e) => setCompareAId(e.target.value)}>
                      <option value="">선택</option>
                      {savedCharts.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.preview.dayPillar})
                        </option>
                      ))}
                    </select>
                  </label>

                  <label style={{ marginTop: '0.55rem', display: 'grid', gap: '0.25rem' }}>
                    비교 대상 B
                    <select value={compareBId} onChange={(e) => setCompareBId(e.target.value)}>
                      <option value="">선택</option>
                      {savedCharts.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.preview.dayPillar})
                        </option>
                      ))}
                    </select>
                  </label>

                  <div style={{ marginTop: '0.6rem' }}>
                    <button type="button" onClick={() => void handleCompare()} disabled={compareLoading}>
                      {compareLoading ? '비교 중...' : '궁합 비교 실행'}
                    </button>
                  </div>
                </>
              )}

              {compareResult ? (
                <div style={{ marginTop: '0.8rem' }}>
                  <div className="badges">
                    <LabelBadge label="계산 결과" tone="calculation" />
                    <LabelBadge label="해석 규칙" tone="rule" />
                  </div>

                  <div className="meta">
                    비교: {compareAChart?.name ?? 'A'} vs {compareBChart?.name ?? 'B'}
                  </div>
                  <ul className="meta">
                    <li>일간 동일 여부: {compareResult.comparison.sameDayMaster ? '동일' : '다름'}</li>
                    <li>일간 관계(십성): {compareResult.comparison.dayMasterRelation}</li>
                    <li>A 우세 오행: {compareResult.comparison.dominantElements.a.join(', ')}</li>
                    <li>B 우세 오행: {compareResult.comparison.dominantElements.b.join(', ')}</li>
                  </ul>

                  <h2 style={{ marginTop: '0.8rem' }}>오행 차이(A-B)</h2>
                  <table className="table">
                    <tbody>
                      {Object.entries(compareResult.comparison.elementGap).map(([element, gap]) => (
                        <tr key={element}>
                          <th>{element}</th>
                          <td>{gap}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {compareResult.comparison.notes.length > 0 ? (
                    <>
                      <h2 style={{ marginTop: '0.8rem' }}>비교 노트</h2>
                      <ul className="meta">
                        {compareResult.comparison.notes.map((note) => (
                          <li key={note}>{note}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {tab === 'qna' && result ? <QnaPanel birthInput={birthInputForQna} chart={result} /> : null}

          {tab === 'settings' ? (
            <div>
              {result ? (
                <>
                  <h2>룰 버전</h2>
                  <ul className="meta">
                    <li>년주 기준: {result.fourPillars.meta.ruleVersion.yearPillarRule}</li>
                    <li>월주 기준: {result.fourPillars.meta.ruleVersion.monthPillarRule}</li>
                    <li>자시 경계: {result.fourPillars.meta.ruleVersion.jaSiBoundaryRule}</li>
                    <li>오행 집계: {result.fourPillars.meta.ruleVersion.elementDistributionModel}</li>
                    <li>십성 규칙: {result.fourPillars.meta.ruleVersion.tenGods}</li>
                    <li>
                      출생지 태양시 보정:{' '}
                      {result.fourPillars.meta.ruleVersion.applyLocalSolarTimeCorrection ? '적용' : '미적용'}
                    </li>
                  </ul>

                  <h2 style={{ marginTop: '0.8rem' }}>신뢰도 노트</h2>
                  <ul className="meta">
                    {result.fourPillars.meta.notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <div className="meta">아직 계산 결과가 없어 규칙/노트 표시를 생략했습니다.</div>
              )}

              <h2 style={{ marginTop: '0.8rem' }}>저장된 명조</h2>
              <label>
                저장 목록 검색
                <input
                  value={savedSearch}
                  onChange={(e) => setSavedSearch(e.target.value)}
                  placeholder="이름, 날짜, 일주 검색"
                />
              </label>

              {filteredSavedCharts.length === 0 ? (
                <div className="meta" style={{ marginTop: '0.5rem' }}>
                  저장된 명조가 없습니다.
                </div>
              ) : (
                <div className="timeline" style={{ marginTop: '0.5rem' }}>
                  {filteredSavedCharts.map((item) => (
                    <div key={item.id} className="timeline-item" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ minWidth: '220px' }}>
                        <strong>{item.name}</strong>
                        <div className="meta">
                          {item.preview.date} · {item.preview.dayPillar} · 저장 {formatSavedDate(item.createdAt)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.35rem', marginLeft: 'auto', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => {
                            void loadSavedChart(item, true);
                          }}
                        >
                          불러와 계산
                        </button>
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => {
                            setCompareAId(item.id);
                            setTab('compare');
                          }}
                        >
                          A 지정
                        </button>
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => {
                            setCompareBId(item.id);
                            setTab('compare');
                          }}
                        >
                          B 지정
                        </button>
                        <button type="button" className="secondary" onClick={() => handleDeleteSaved(item.id)}>
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: '0.8rem' }}>
                <button type="button" className="secondary" onClick={() => void handleCopyShareLink()}>
                  현재 입력 공유 링크 복사
                </button>
              </div>

              <p className="meta" style={{ marginTop: '0.9rem' }}>
                출처 상세는 <code>SOURCES.md</code>, 결정 기록은 <code>docs/DECISIONS.md</code>에서 확인하세요.
              </p>

              <div style={{ marginTop: '0.5rem' }}>
                <h2>핵심 출처 링크</h2>
                <ul className="meta">
                  {SOURCE_LINKS.map((item) => (
                    <li key={item.url}>
                      <a href={item.url} target="_blank" rel="noreferrer">
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
