import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import type { BirthInput, MonthlyLuckCycle, SajuChartResult } from '@saju/core';
import {
  buildNarrative,
  buildQnaTemplateContext,
  computeMonthLuckForYearMonth,
  computeSaeunForYear,
  computeSajuChart,
  formatQnaText,
  type QnaCycleContext,
  type QnaDomain,
} from '@saju/core';
import { qnaSnippets } from '@saju/data';

import { BACKGROUNDS } from '../../lib/assets/backgrounds';
import { commonStyles } from '../../lib/ui/commonStyles';
import { ScreenScroll } from '../../lib/ui/ScreenScroll';
import { UI } from '../../lib/ui/tokens';
import SectionCard from '../components/SectionCard';
import PillarsMatrixNative from './PillarsMatrixNative';

type CalendarType = 'solar' | 'lunar';
type ViewMode = 'report' | 'qna';
type QnaMode = 'overall' | 'year' | 'month';

const DOMAINS: Array<{ key: QnaDomain; label: string; hint: string }> = [
  { key: 'money', label: '금전', hint: '수입/지출/자원 흐름' },
  { key: 'love', label: '연애', hint: '관계 표현/속도/거리' },
  { key: 'health', label: '건강', hint: '루틴/회복/컨디션 관리' },
  { key: 'children', label: '자식', hint: '양육/표현/책임' },
  { key: 'parents', label: '부모', hint: '가족 책임/거리 조절' },
  { key: 'friends', label: '친구', hint: '동료/경쟁/협업' },
  { key: 'benefactor', label: '귀인', hint: '지원/기회/멘토' },
  { key: 'job', label: '직장', hint: '커리어/평판/구조' },
  { key: 'business', label: '사업', hint: '창업/운영/리스크' },
];

const SAJU_INPUT_STORAGE_KEY = 'saju:birth-input:v1';
const SAJU_INPUT_MAX = 10;

interface SavedSajuInput {
  id: string;
  createdAtISO: string;
  calendar: CalendarType;
  birthYear: string;
  birthMonth: string;
  birthDay: string;
  birthHour: string;
  birthMinute: string;
  isLeapMonth: boolean;
  gender: BirthInput['gender'];
  yearRuleIpchun: boolean;
  jaSiNextDay: boolean;
}

type SavedSajuPayload = Omit<SavedSajuInput, 'id' | 'createdAtISO'>;

function normalizeSavedInput(parsed: unknown): SavedSajuInput | null {
  if (!parsed || typeof parsed !== 'object') return null;
  const safe = parsed as Partial<SavedSajuInput>;
  if (safe.calendar !== 'solar' && safe.calendar !== 'lunar') return null;

  return {
    id: typeof safe.id === 'string' && safe.id.length > 0 ? safe.id : `legacy-${Date.now()}-${Math.random()}`,
    createdAtISO:
      typeof safe.createdAtISO === 'string' && safe.createdAtISO.length > 0
        ? safe.createdAtISO
        : new Date().toISOString(),
    calendar: safe.calendar,
    birthYear: typeof safe.birthYear === 'string' ? onlyDigits(safe.birthYear, 4) : '',
    birthMonth: typeof safe.birthMonth === 'string' ? onlyDigits(safe.birthMonth, 2) : '',
    birthDay: typeof safe.birthDay === 'string' ? onlyDigits(safe.birthDay, 2) : '',
    birthHour: typeof safe.birthHour === 'string' ? onlyDigits(safe.birthHour, 2) : '',
    birthMinute: typeof safe.birthMinute === 'string' ? onlyDigits(safe.birthMinute, 2) : '',
    isLeapMonth: Boolean(safe.isLeapMonth),
    gender:
      safe.gender === 'male' ||
      safe.gender === 'female' ||
      safe.gender === 'other' ||
      safe.gender === 'unknown'
        ? safe.gender
        : 'unknown',
    yearRuleIpchun: typeof safe.yearRuleIpchun === 'boolean' ? safe.yearRuleIpchun : true,
    jaSiNextDay: typeof safe.jaSiNextDay === 'boolean' ? safe.jaSiNextDay : true,
  };
}

function onlyDigits(value: string, maxLen: number): string {
  return value.replace(/\D/g, '').slice(0, maxLen);
}

function safeInt(value: string, min: number, max: number): number | null {
  const n = Number(value);
  if (!Number.isInteger(n)) return null;
  if (n < min || n > max) return null;
  return n;
}

function buildBirthDate(yearText: string, monthText: string, dayText: string): string | null {
  const y = safeInt(yearText.trim(), 1800, 2100);
  const m = safeInt(monthText.trim(), 1, 12);
  const d = safeInt(dayText.trim(), 1, 31);
  if (!y || !m || !d) return null;
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function buildBirthTime(hourText: string, minuteText: string): string | undefined | null {
  const hhRaw = hourText.trim();
  const mmRaw = minuteText.trim();
  if (!hhRaw && !mmRaw) return undefined;
  if (!hhRaw || !mmRaw) return null;
  const hh = safeInt(hhRaw, 0, 23);
  const mm = safeInt(mmRaw, 0, 59);
  if (hh === null || mm === null) return null;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function formatSavedInputSummary(saved: SavedSajuInput): string {
  const date = `${saved.birthYear || '----'}-${(saved.birthMonth || '--').padStart(2, '0')}-${(saved.birthDay || '--').padStart(2, '0')}`;
  const timeKnown = Boolean(saved.birthHour && saved.birthMinute);
  const time = timeKnown ? `${saved.birthHour.padStart(2, '0')}:${saved.birthMinute.padStart(2, '0')}` : '시간 모름';
  const calendar = saved.calendar === 'solar' ? '양력' : '음력';
  const leap = saved.calendar === 'lunar' && saved.isLeapMonth ? ' (윤달)' : '';
  const genderLabel =
    saved.gender === 'male' ? '남' : saved.gender === 'female' ? '여' : saved.gender === 'other' ? '기타' : '미입력';
  return `${calendar}${leap} · ${date} ${time} · ${genderLabel}`;
}

function monthLuckText(monthLuck: MonthlyLuckCycle, chart: SajuChartResult): string {
  const dominant = Object.entries(chart.features.elementDistribution.counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([k]) => k)
    .filter(Boolean);

  const pillarText = `${monthLuck.pillar.stem}${monthLuck.pillar.branch}`;
  const domText = dominant.length ? dominant.join('/') : '균형형';

  return [
    `[${monthLuck.solarYear}년 ${String(monthLuck.solarMonth).padStart(2, '0')}월 흐름]`,
    `- 월운: ${pillarText} / ${monthLuck.tenGodToDayMaster} / 오행 ${monthLuck.element}`,
    `- 핵심: ${monthLuck.tenGodToDayMaster} 역할이 전면에 나오기 쉬운 시기라 목표를 하나로 좁힐수록 체감 성과가 높아집니다.`,
    `- 균형: 기존 오행 흐름(${domText})과 충돌하지 않도록 일정/지출/에너지 배분을 먼저 정리하세요.`,
  ].join('\n');
}

function hashIndex(seed: string, mod: number): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0) % mod;
}

function monthFromLabel(label: string): number | null {
  const m = label.match(/-(\d{1,2})$/);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isInteger(n) || n < 1 || n > 12) return null;
  return n;
}

function buildCycleNote(domain: QnaDomain, cycle: QnaCycleContext): string {
  const label = DOMAINS.find((d) => d.key === domain)?.label ?? domain;
  const month = monthFromLabel(cycle.label);
  const monthActions = [
    '초반에는 계획을 최소화하고 해야 할 일 1개를 먼저 끝내는 방식이 유리합니다.',
    '관계/일정 조율을 먼저 해 두면 불필요한 소모를 크게 줄일 수 있습니다.',
    '확장보다 누수 점검을 우선해 안정적인 기반을 만드는 편이 좋습니다.',
    '작은 결론을 빠르게 확정하고 실행으로 넘기면 체감 성과가 좋아집니다.',
    '지출/시간/체력 중 한 가지 지표를 고정해 추적하세요.',
    '중간 점검 구간으로 보고 진행률을 수치로 확인하는 것이 효과적입니다.',
    '새로운 방법보다 검증된 루틴을 반복하는 편이 안정적입니다.',
    '협업 구간에서는 역할/기한/결과물을 문장으로 명확히 합의하세요.',
    '속도보다 정확도를 우선해 재작업 가능성을 줄이는 달입니다.',
    '결과 공유 시점을 앞당겨 피드백을 빠르게 반영하는 편이 유리합니다.',
    '해야 할 일보다 버릴 일을 먼저 정리하면 흐름이 살아납니다.',
    '다음 달 준비를 위해 템플릿/체크리스트를 남겨 재사용성을 높이세요.',
  ] as const;

  const domainFocus: Record<QnaDomain, readonly string[]> = {
    money: [
      '수입 증대보다 현금흐름의 안정화가 우선 과제입니다.',
      '거래 조건과 정산 주기를 분명히 할수록 손실이 줄어듭니다.',
      '가격/노력/시간의 교환비를 점검하는 달입니다.',
    ],
    love: [
      '감정보다 표현 방식과 타이밍이 관계의 질을 좌우하는 달입니다.',
      '결론을 급히 내리기보다 대화 구조를 먼저 정리하는 편이 좋습니다.',
      '약속/기준을 짧고 선명하게 합의할수록 안정감이 높아집니다.',
    ],
    health: [
      '무리한 목표보다 회복 가능한 루틴을 고정하는 것이 핵심입니다.',
      '수면/식사/움직임의 기본 패턴을 일정하게 유지하세요.',
      '컨디션 관리는 강도보다 지속성에서 차이가 납니다.',
    ],
    children: [
      '훈육보다 일관된 리듬과 예측 가능한 규칙이 효과적인 달입니다.',
      '설명은 짧고 반복 가능한 방식으로 전달하는 편이 좋습니다.',
      '관찰과 피드백의 주기를 짧게 가져가면 갈등이 줄어듭니다.',
    ],
    parents: [
      '감정 해석보다 역할/일정/분담을 선명히 정하는 달입니다.',
      '혼자 책임지기보다 요청과 협의를 먼저 여는 편이 유리합니다.',
      '거리 조절과 연락 리듬을 미리 정하면 피로가 줄어듭니다.',
    ],
    friends: [
      '친밀감보다 약속의 명확성이 관계를 오래 유지합니다.',
      '협업/동업은 기준과 정산을 먼저 정하는 편이 안정적입니다.',
      '비교보다는 역할 적합성 중심으로 관계를 정리하세요.',
    ],
    benefactor: [
      '도움은 막연한 기대보다 구체적 요청에서 성사율이 올라갑니다.',
      '준비된 결과물을 먼저 보여줄수록 연결 가능성이 커집니다.',
      '연결 채널을 넓히기보다 지속 가능한 채널을 고정하세요.',
    ],
    job: [
      '성과보다 기준/보고/마감의 정밀도가 평가를 좌우하는 달입니다.',
      '멀티태스킹보다 단일 우선순위를 먼저 끝내는 편이 유리합니다.',
      '결과물 공유 주기를 짧게 하면 리스크가 줄어듭니다.',
    ],
    business: [
      '확장보다 수익화 구조의 반복 가능성을 점검해야 하는 달입니다.',
      '매출보다 정산/운영/계약의 안정성을 먼저 확인하세요.',
      '속도전보다 검증 루프를 짧게 가져가면 실패 비용이 줄어듭니다.',
    ],
  };

  const domainRisk: Record<QnaDomain, readonly string[]> = {
    money: ['충동 지출', '정산 누락', '조건 없는 거래 확대'],
    love: ['직설 과다', '속도 차이 무시', '감정 누적 후 폭발'],
    health: ['수면 리듬 붕괴', '회복 없는 과속', '체력 대비 과한 목표'],
    children: ['규칙의 잦은 변경', '피로 상태에서의 훈육', '기대치 과다'],
    parents: ['역할 경계 붕괴', '일정 충돌 방치', '혼자 떠안기'],
    friends: ['정산/약속 모호', '비교 심리', '역할 미합의'],
    benefactor: ['요청 불명확', '준비 없는 접촉', '채널 과분산'],
    job: ['완벽주의로 지연', '보고 누락', '우선순위 혼선'],
    business: ['검증 없는 확장', '고정비 증가', '계약 리스크 방치'],
  };

  const seed = `${domain}:${cycle.label}:${cycle.pillar}:${cycle.tenGod}:${cycle.element}`;
  const focusItems = domainFocus[domain];
  const riskItems = domainRisk[domain];
  const focus = focusItems[hashIndex(seed, focusItems.length)] ?? focusItems[0] ?? '';
  const risk = riskItems[hashIndex(`${seed}:risk`, riskItems.length)] ?? riskItems[0] ?? '';
  const monthAction =
    month !== null ? monthActions[Math.max(0, month - 1)] : monthActions[hashIndex(`${seed}:month`, monthActions.length)];

  return [
    '[시기 반영]',
    `- 기준: ${cycle.label} · ${cycle.pillar} · ${cycle.tenGod} · ${cycle.element}`,
    `- 초점: ${label} 영역은 ${focus}`,
    `- 리스크: 이번 시기에는 특히 "${risk}" 패턴을 먼저 차단하는 편이 좋습니다.`,
    `- 실행: ${monthAction}`,
  ].join('\n');
}

export default function SajuScreen(): React.JSX.Element {
  const [calendar, setCalendar] = useState<CalendarType>('solar');
  const [birthYear, setBirthYear] = useState('1992');
  const [birthMonth, setBirthMonth] = useState('10');
  const [birthDay, setBirthDay] = useState('24');
  const [birthHour, setBirthHour] = useState('05');
  const [birthMinute, setBirthMinute] = useState('30');
  const [isLeapMonth, setIsLeapMonth] = useState(false);
  const [gender, setGender] = useState<BirthInput['gender']>('unknown');

  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [yearRuleIpchun, setYearRuleIpchun] = useState(true);
  const [jaSiNextDay, setJaSiNextDay] = useState(true);

  const [chart, setChart] = useState<SajuChartResult | null>(null);
  const [error, setError] = useState('');

  const [viewMode, setViewMode] = useState<ViewMode>('report');
  const [yearText, setYearText] = useState(() => String(new Date().getFullYear()));
  const [monthText, setMonthText] = useState(() => String(new Date().getMonth() + 1));
  const [yearCycle, setYearCycle] = useState<ReturnType<typeof computeSaeunForYear> | null>(null);
  const [monthCycle, setMonthCycle] = useState<MonthlyLuckCycle | null>(null);

  const [qnaMode, setQnaMode] = useState<QnaMode>('overall');
  const [domain, setDomain] = useState<QnaDomain>('money');
  const [saveNote, setSaveNote] = useState('');
  const [savedInputs, setSavedInputs] = useState<SavedSajuInput[]>([]);

  const narrative = useMemo(() => {
    if (!chart) return null;
    return buildNarrative(chart, yearCycle);
  }, [chart, yearCycle]);

  const qnaSnippet = useMemo(() => qnaSnippets.find((s) => s.tags?.includes(domain)), [domain]);

  const qnaCycleContext = useMemo<QnaCycleContext | undefined>(() => {
    if (!chart) return undefined;
    if (qnaMode === 'year') {
      const year = safeInt(yearText, 1900, 2100);
      if (!year) return undefined;
      const cycle = computeSaeunForYear(chart.fourPillars, year);
      return {
        kind: 'year',
        year: cycle.solarYear,
        label: `${cycle.solarYear}년`,
        pillar: `${cycle.pillar.stem}${cycle.pillar.branch}`,
        tenGod: cycle.tenGodToDayMaster,
        element: cycle.element,
      };
    }
    if (qnaMode === 'month') {
      const year = safeInt(yearText, 1900, 2100);
      const month = safeInt(monthText, 1, 12);
      if (!year || !month) return undefined;
      const cycle = computeMonthLuckForYearMonth(chart.fourPillars, year, month);
      return {
        kind: 'month',
        year: cycle.solarYear,
        month: cycle.solarMonth,
        label: `${cycle.solarYear}-${String(cycle.solarMonth).padStart(2, '0')}`,
        pillar: `${cycle.pillar.stem}${cycle.pillar.branch}`,
        tenGod: cycle.tenGodToDayMaster,
        element: cycle.element,
      };
    }
    return undefined;
  }, [chart, monthText, qnaMode, yearText]);

  const qnaContext = useMemo(() => {
    if (!chart) return null;
    return buildQnaTemplateContext(chart, qnaCycleContext);
  }, [chart, qnaCycleContext]);

  const qnaText = useMemo(() => {
    if (!qnaSnippet || !qnaContext) return null;
    const template = qnaSnippet.content.long ?? qnaSnippet.content.short;
    const body = formatQnaText(template, qnaContext);
    if (!qnaCycleContext) return body;
    return `${body}\n\n${buildCycleNote(domain, qnaCycleContext)}`;
  }, [domain, qnaContext, qnaCycleContext, qnaSnippet]);

  const applySavedInputToForm = useCallback((saved: SavedSajuPayload): void => {
    setCalendar(saved.calendar);
    setBirthYear(onlyDigits(saved.birthYear, 4));
    setBirthMonth(onlyDigits(saved.birthMonth, 2));
    setBirthDay(onlyDigits(saved.birthDay, 2));
    setBirthHour(onlyDigits(saved.birthHour, 2));
    setBirthMinute(onlyDigits(saved.birthMinute, 2));
    setIsLeapMonth(Boolean(saved.isLeapMonth));
    setGender(saved.gender ?? 'unknown');
    setYearRuleIpchun(Boolean(saved.yearRuleIpchun));
    setJaSiNextDay(Boolean(saved.jaSiNextDay));
  }, []);

  const resetToEntry = useCallback((): void => {
    setChart(null);
    setViewMode('report');
    setYearCycle(null);
    setMonthCycle(null);
    setQnaMode('overall');
    setError('');
  }, []);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(SAJU_INPUT_STORAGE_KEY)
      .then((raw) => {
        if (!mounted || !raw) return;

        const parsedUnknown = JSON.parse(raw) as unknown;
        const parsedList = Array.isArray(parsedUnknown) ? parsedUnknown : [parsedUnknown];
        const normalized = parsedList
          .map((item) => normalizeSavedInput(item))
          .filter((item): item is SavedSajuInput => Boolean(item))
          .slice(0, SAJU_INPUT_MAX);

        if (normalized.length === 0) return;

        const firstSaved = normalized[0];
        if (!firstSaved) return;

        setSavedInputs(normalized);
        applySavedInputToForm(firstSaved);
        setSaveNote(`저장한 입력값 ${normalized.length}개를 불러왔어요.`);
      })
      .catch(() => {
        if (!mounted) return;
        setSavedInputs([]);
        setSaveNote('');
      });
    return () => {
      mounted = false;
    };
  }, [applySavedInputToForm]);

  const computeFromPayload = useCallback((payload: SavedSajuPayload): void => {
    setError('');
    try {
      const parsedDate = buildBirthDate(payload.birthYear, payload.birthMonth, payload.birthDay);
      const parsedTime = buildBirthTime(payload.birthHour, payload.birthMinute);
      if (!parsedDate) {
        setError('생년월일을 확인해 주세요. (YYYY-MM-DD)');
        return;
      }
      if (parsedTime === null) {
        setError('출생 시간을 확인해 주세요. (HH:mm, 모르면 비워두기)');
        return;
      }

      const input: BirthInput = {
        calendar: payload.calendar,
        date: parsedDate,
        timezone: 'Asia/Seoul',
        gender: payload.gender ?? 'unknown',
        ...(parsedTime ? { time: parsedTime } : {}),
        ...(payload.calendar === 'lunar' ? { isLeapMonth: payload.isLeapMonth } : {}),
        options: {
          yearPillarRule: payload.yearRuleIpchun ? 'ipchun' : 'lunarNewYear',
          monthPillarRule: 'solarTerms',
          jaSiBoundaryRule: payload.jaSiNextDay ? '23-01_nextDay' : '23-01_sameDay',
          includeHiddenStems: true,
          hiddenStemWeights: 'all_weighted',
          elementDistributionModel: 'stems_branches_hidden',
          strengthModel: 'advanced_v1',
          luckComputationModel: 'simple',
          luckStartAge: 7,
        },
      };

      const next = computeSajuChart(input);
      setChart(next);
      setViewMode('report');
      setYearCycle(null);
      setMonthCycle(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : '계산 오류');
    }
  }, []);

  const compute = (): void => {
    computeFromPayload({
      calendar,
      birthYear: onlyDigits(birthYear, 4),
      birthMonth: onlyDigits(birthMonth, 2),
      birthDay: onlyDigits(birthDay, 2),
      birthHour: onlyDigits(birthHour, 2),
      birthMinute: onlyDigits(birthMinute, 2),
      isLeapMonth,
      gender,
      yearRuleIpchun,
      jaSiNextDay,
    });
  };

  const handleSaveInput = useCallback(() => {
    if (savedInputs.length >= SAJU_INPUT_MAX) {
      setSaveNote(`저장 슬롯(${SAJU_INPUT_MAX}개)이 가득 찼어요. 기존 항목을 삭제 후 저장해 주세요.`);
      return;
    }

    const payload: SavedSajuInput = {
      id: `saju-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      createdAtISO: new Date().toISOString(),
      calendar,
      birthYear: onlyDigits(birthYear, 4),
      birthMonth: onlyDigits(birthMonth, 2),
      birthDay: onlyDigits(birthDay, 2),
      birthHour: onlyDigits(birthHour, 2),
      birthMinute: onlyDigits(birthMinute, 2),
      isLeapMonth,
      gender,
      yearRuleIpchun,
      jaSiNextDay,
    };

    const nextList = [payload, ...savedInputs].slice(0, SAJU_INPUT_MAX);
    AsyncStorage.setItem(SAJU_INPUT_STORAGE_KEY, JSON.stringify(nextList))
      .then(() => {
        setSavedInputs(nextList);
        setSaveNote(`입력 정보를 저장했어요. (${nextList.length}/${SAJU_INPUT_MAX})`);
      })
      .catch(() => setSaveNote('저장에 실패했어요. 다시 시도해 주세요.'));
  }, [
    birthDay,
    birthHour,
    birthMinute,
    birthMonth,
    birthYear,
    calendar,
    gender,
    isLeapMonth,
    jaSiNextDay,
    savedInputs,
    yearRuleIpchun,
  ]);

  const handleUseSavedInput = useCallback(
    (saved: SavedSajuInput): void => {
      applySavedInputToForm(saved);
      computeFromPayload(saved);
    },
    [applySavedInputToForm, computeFromPayload],
  );

  const handleDeleteSavedInput = useCallback(
    (id: string): void => {
      const nextList = savedInputs.filter((item) => item.id !== id);
      AsyncStorage.setItem(SAJU_INPUT_STORAGE_KEY, JSON.stringify(nextList))
        .then(() => {
          setSavedInputs(nextList);
          setSaveNote(nextList.length ? '저장 정보를 삭제했어요.' : '저장 정보를 모두 비웠어요.');
        })
        .catch(() => {
          setSaveNote('삭제에 실패했어요. 다시 시도해 주세요.');
        });
    },
    [savedInputs],
  );

  const handlePickYear = (): void => {
    if (!chart) return;
    const year = safeInt(yearText, 1900, 2100);
    if (!year) {
      setError('연도는 1900~2100 사이 정수로 입력해 주세요.');
      return;
    }
    setError('');
    setYearCycle(computeSaeunForYear(chart.fourPillars, year));
  };

  const handlePickMonth = (): void => {
    if (!chart) return;
    const year = safeInt(yearText, 1900, 2100);
    const month = safeInt(monthText, 1, 12);
    if (!year || !month) {
      setError('연도(1900~2100) / 월(1~12)을 입력해 주세요.');
      return;
    }
    setError('');
    setMonthCycle(computeMonthLuckForYearMonth(chart.fourPillars, year, month));
  };

  return (
    <ScreenScroll background={BACKGROUNDS.saju} contentContainerStyle={[commonStyles.screen, styles.container]}>
      <View style={[commonStyles.hero, styles.hero]}>
        <Text style={styles.heroLine}>생년월일시를 입력하면 결과와 분야별 Q&A를 바로 확인할 수 있어요.</Text>
      </View>

      {!chart ? (
        <SectionCard title="사주 입력">
          <Text style={styles.meta}>달력/시간/성별만 빠르게 입력하고, 나머지는 상세 설정에서 조절할 수 있어요.</Text>

          <View style={styles.toggleRow}>
            <Pressable style={[styles.toggleBtn, calendar === 'solar' && styles.toggleBtnActive]} onPress={() => setCalendar('solar')}>
              <Text style={styles.toggleText}>양력</Text>
            </Pressable>
            <Pressable style={[styles.toggleBtn, calendar === 'lunar' && styles.toggleBtnActive]} onPress={() => setCalendar('lunar')}>
              <Text style={styles.toggleText}>음력</Text>
            </Pressable>
          </View>

          <View style={styles.maskRow}>
            <TextInput value={birthYear} onChangeText={(t) => setBirthYear(onlyDigits(t, 4))} placeholder="YYYY" style={[styles.input, styles.maskInput, styles.maskYear]} keyboardType="number-pad" maxLength={4} />
            <TextInput value={birthMonth} onChangeText={(t) => setBirthMonth(onlyDigits(t, 2))} placeholder="MM" style={[styles.input, styles.maskInput, styles.maskMd]} keyboardType="number-pad" maxLength={2} />
            <TextInput value={birthDay} onChangeText={(t) => setBirthDay(onlyDigits(t, 2))} placeholder="DD" style={[styles.input, styles.maskInput, styles.maskMd]} keyboardType="number-pad" maxLength={2} />
          </View>

          <View style={styles.maskRow}>
            <TextInput value={birthHour} onChangeText={(t) => setBirthHour(onlyDigits(t, 2))} placeholder="HH" style={[styles.input, styles.maskInput, styles.maskMd]} keyboardType="number-pad" maxLength={2} />
            <TextInput value={birthMinute} onChangeText={(t) => setBirthMinute(onlyDigits(t, 2))} placeholder="mm" style={[styles.input, styles.maskInput, styles.maskMd]} keyboardType="number-pad" maxLength={2} />
            <Pressable onPress={() => { setBirthHour(''); setBirthMinute(''); }} style={styles.clearChip}><Text style={styles.clearChipText}>모름</Text></Pressable>
          </View>
          <Text style={styles.meta}>시간을 모르면 비워두세요. (시주는 미정 또는 후보로 처리됩니다)</Text>

          {calendar === 'lunar' ? <View style={styles.switchRow}><Text style={styles.rowLabel}>윤달</Text><Switch value={isLeapMonth} onValueChange={setIsLeapMonth} /></View> : null}

          <View style={styles.toggleRow}>
            {([
              ['unknown', '미입력'],
              ['male', '남'],
              ['female', '여'],
            ] as const).map(([key, label]) => (
              <Pressable key={key} style={[styles.toggleBtn, gender === key && styles.toggleBtnActive]} onPress={() => setGender(key)}>
                <Text style={styles.toggleText}>{label}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.advancedToggle} onPress={() => setAdvancedOpen((v) => !v)}><Text style={styles.advancedToggleText}>{advancedOpen ? '상세 설정 닫기' : '상세 설정 열기'}</Text></Pressable>

          <Pressable style={styles.saveBtn} onPress={handleSaveInput}>
            <Text style={styles.saveBtnText}>입력 정보 저장 ({savedInputs.length}/{SAJU_INPUT_MAX})</Text>
          </Pressable>
          {saveNote ? <Text style={styles.meta}>{saveNote}</Text> : null}

          {savedInputs.length > 0 ? (
            <View style={styles.savedList}>
              {savedInputs.map((saved, idx) => (
                <View key={saved.id} style={styles.savedBox}>
                  <Pressable
                    onPress={() => handleUseSavedInput(saved)}
                    style={({ pressed }) => [styles.savedMainBtn, pressed && commonStyles.pressed]}
                  >
                    <Text style={styles.savedTitle}>저장 {idx + 1}</Text>
                    <Text style={styles.savedSummary}>{formatSavedInputSummary(saved)}</Text>
                    <Text style={styles.savedHint}>누르면 저장한 사주로 바로 계산됩니다.</Text>
                  </Pressable>
                  <View style={styles.savedActionRow}>
                    <Pressable
                      onPress={() => handleDeleteSavedInput(saved.id)}
                      style={({ pressed }) => [styles.savedActionBtn, styles.savedActionDanger, styles.savedActionSingle, pressed && commonStyles.pressed]}
                    >
                      <Text style={[styles.savedActionText, styles.savedActionDangerText]}>삭제</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {advancedOpen ? (
            <View style={styles.advancedBox}>
              <Text style={styles.advancedTitle}>규칙 옵션(학파 차이 가능)</Text>
              <View style={styles.switchRow}><Text style={styles.rowLabel}>연주 기준: 입춘</Text><Switch value={yearRuleIpchun} onValueChange={setYearRuleIpchun} /></View>
              <View style={styles.switchRow}><Text style={styles.rowLabel}>자시 23시를 다음날로 처리</Text><Switch value={jaSiNextDay} onValueChange={setJaSiNextDay} /></View>
              <Text style={styles.meta}>옵션에 따라 결과가 달라질 수 있습니다.</Text>
            </View>
          ) : null}

          <Pressable style={styles.primaryBtn} onPress={compute}><Text style={styles.primaryBtnText}>사주 풀이 보기</Text></Pressable>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </SectionCard>
      ) : (
        <>
          <View style={styles.topRow}>
            <Pressable style={[styles.smallBtn, viewMode === 'report' && styles.smallBtnActive]} onPress={() => setViewMode('report')}><Text style={[styles.smallBtnText, viewMode === 'report' && styles.smallBtnTextActive]}>종합</Text></Pressable>
            <Pressable style={[styles.smallBtn, viewMode === 'qna' && styles.smallBtnActive]} onPress={() => setViewMode('qna')}><Text style={[styles.smallBtnText, viewMode === 'qna' && styles.smallBtnTextActive]}>분야별 Q&A</Text></Pressable>
            <Pressable style={[styles.smallBtn, { marginLeft: 'auto' }]} onPress={resetToEntry}><Text style={styles.smallBtnText}>다시 입력</Text></Pressable>
          </View>

          <SectionCard title="명식 결과">
            <PillarsMatrixNative chart={chart} />
            {!chart.fourPillars.hour && chart.features.hourCandidates?.length ? <Text style={styles.meta}>시간 미입력: 시주 후보 {chart.features.hourCandidates.join(', ')}</Text> : null}
          </SectionCard>

          {viewMode === 'report' ? (
            <>
              <SectionCard title="종합 풀이">
                <Text style={styles.pre}>{narrative?.profile ?? '-'}</Text>
                <View style={styles.divider} />
                <Text style={styles.pre}>{narrative?.overallLuck ?? '-'}</Text>
              </SectionCard>

              <SectionCard title="연/월 운세 선택">
                <Text style={styles.meta}>지정한 연도/월 기준으로 흐름을 자연어로 보여줍니다.</Text>
                <View style={styles.inlineInputs}>
                  <View style={{ flex: 1 }}><Text style={styles.rowLabel}>연도</Text><TextInput value={yearText} onChangeText={(t) => setYearText(onlyDigits(t, 4))} style={styles.input} placeholder="2026" keyboardType="number-pad" maxLength={4} /></View>
                  <Pressable style={styles.secondaryBtn} onPress={handlePickYear}><Text style={styles.secondaryBtnText}>해 운세</Text></Pressable>
                </View>
                <View style={styles.inlineInputs}>
                  <View style={{ flex: 1 }}><Text style={styles.rowLabel}>월</Text><TextInput value={monthText} onChangeText={(t) => setMonthText(onlyDigits(t, 2))} style={styles.input} placeholder="2" keyboardType="number-pad" maxLength={2} /></View>
                  <Pressable style={styles.secondaryBtn} onPress={handlePickMonth}><Text style={styles.secondaryBtnText}>월 운세</Text></Pressable>
                </View>
                {error ? <Text style={styles.error}>{error}</Text> : null}
                {narrative?.yearlyLuck ? <><View style={styles.divider} /><Text style={styles.pre}>{narrative.yearlyLuck}</Text></> : null}
                {monthCycle ? (
                  <>
                    <View style={styles.divider} />
                    <Text style={styles.pre}>{monthLuckText(monthCycle, chart)}</Text>
                    <Text style={styles.meta}>기준: {monthCycle.anchor.date} {monthCycle.anchor.time} ({monthCycle.anchor.timezone}){`\n`}{monthCycle.notes.join(' · ')}</Text>
                  </>
                ) : null}
              </SectionCard>
            </>
          ) : (
            <SectionCard title="분야별 Q&A">
              <Text style={styles.meta}>계산된 사주 구조(십성/오행/강약)만 기반으로 설명합니다. 연도/월을 바꾸면 해당 시기 흐름이 반영됩니다.</Text>
              <View style={styles.toggleRow}>
                {([
                  ['overall', '전체'],
                  ['year', '연도'],
                  ['month', '월'],
                ] as const).map(([key, label]) => (
                  <Pressable key={key} style={[styles.toggleBtn, qnaMode === key && styles.toggleBtnActive]} onPress={() => setQnaMode(key)}><Text style={styles.toggleText}>{label}</Text></Pressable>
                ))}
              </View>
              {qnaMode !== 'overall' ? (
                <>
                  <View style={styles.inlineInputs}>
                    <View style={{ flex: 1 }}><Text style={styles.rowLabel}>연도</Text><TextInput value={yearText} onChangeText={(t) => setYearText(onlyDigits(t, 4))} style={styles.input} placeholder="2026" keyboardType="number-pad" maxLength={4} /></View>
                    {qnaMode === 'month' ? <View style={{ flex: 1 }}><Text style={styles.rowLabel}>월</Text><TextInput value={monthText} onChangeText={(t) => setMonthText(onlyDigits(t, 2))} style={styles.input} placeholder="2" keyboardType="number-pad" maxLength={2} /></View> : null}
                  </View>
                  {!qnaCycleContext ? <Text style={styles.error}>연도/월 입력이 올바르지 않습니다.</Text> : <Text style={styles.meta}>선택: {qnaCycleContext.label} · {qnaCycleContext.pillar} · {qnaCycleContext.tenGod} · {qnaCycleContext.element}</Text>}
                </>
              ) : null}
              <View style={styles.domainRow}>
                {DOMAINS.map((item) => (
                  <Pressable key={item.key} onPress={() => setDomain(item.key)} style={[styles.domainChip, domain === item.key && styles.domainChipActive]}>
                    <Text style={[styles.domainChipText, domain === item.key && styles.domainChipTextActive]}>{item.label}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.meta}>{DOMAINS.find((d) => d.key === domain)?.hint}</Text>
              {qnaSnippet && qnaText ? (
                <>
                  <Text style={styles.qnaTitle}>{qnaSnippet.title}</Text>
                  <Text style={styles.meta}>{qnaSnippet.content.short}</Text>
                  <View style={styles.divider} />
                  <Text style={styles.pre}>{qnaText}</Text>
                </>
              ) : <Text style={styles.error}>Q&A 템플릿을 찾지 못했습니다.</Text>}
            </SectionCard>
          )}
        </>
      )}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  container: { gap: 22 },
  hero: { gap: 0 },
  heroLine: { color: '#f2f1ef', fontSize: 14, fontWeight: '800', lineHeight: 20 },
  meta: { fontSize: 12, lineHeight: 17, color: '#6b7280' },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff', fontSize: 14, color: '#111827' },
  maskRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  maskInput: { textAlign: 'center', paddingHorizontal: 0, minWidth: 0, flexShrink: 1 },
  maskYear: { flex: 1.8 },
  maskMd: { flex: 1 },
  clearChip: { marginLeft: 4, borderRadius: 999, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff', paddingVertical: 10, paddingHorizontal: 12 },
  clearChipText: { fontSize: 12, fontWeight: '900', color: '#111827' },
  toggleRow: { flexDirection: 'row', gap: 8 },
  toggleBtn: { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingVertical: 10, alignItems: 'center', backgroundColor: '#f9fafb' },
  toggleBtnActive: { backgroundColor: '#fff6d6', borderColor: '#f7c948' },
  toggleText: { fontSize: 13, color: '#111827', fontWeight: '900' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontSize: 12, fontWeight: '900', color: '#111827', marginBottom: 6 },
  primaryBtn: { borderRadius: 14, paddingVertical: 12, alignItems: 'center', backgroundColor: '#0b1020' },
  primaryBtnText: { color: '#f2f1ef', fontWeight: '900', fontSize: 15, letterSpacing: 0.2 },
  error: { color: UI.colors.danger, fontSize: 12, lineHeight: 17, fontWeight: '800' },
  advancedToggle: { borderRadius: 12, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff' },
  advancedToggleText: { fontSize: 13, fontWeight: '900', color: '#111827' },
  saveBtn: { borderRadius: 12, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#f9fafb' },
  saveBtnText: { fontSize: 13, fontWeight: '900', color: '#111827' },
  savedList: { gap: 14 },
  savedBox: { borderRadius: 14, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff', padding: 12, gap: 10 },
  savedMainBtn: { borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb', paddingVertical: 10, paddingHorizontal: 12, gap: 4 },
  savedTitle: { fontSize: 12, fontWeight: '900', color: '#111827' },
  savedSummary: { fontSize: 12, lineHeight: 17, color: '#111827', fontWeight: '700' },
  savedHint: { fontSize: 11, lineHeight: 16, color: '#6b7280', fontWeight: '700' },
  savedActionRow: { flexDirection: 'row', gap: 8 },
  savedActionBtn: { flex: 1, borderRadius: 10, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#fff', paddingVertical: 9, alignItems: 'center' },
  savedActionSingle: { flex: 0, minWidth: 84, alignSelf: 'flex-end' },
  savedActionText: { fontSize: 12, fontWeight: '900', color: '#111827' },
  savedActionDanger: { borderColor: '#fca5a5', backgroundColor: '#fff5f5' },
  savedActionDangerText: { color: '#b91c1c' },
  advancedBox: { borderRadius: 14, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff', padding: 12, gap: 10 },
  advancedTitle: { fontSize: 13, fontWeight: '900', color: '#111827' },
  topRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 2 },
  smallBtn: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#fff' },
  smallBtnActive: { backgroundColor: '#0b1020', borderColor: '#0b1020' },
  smallBtnText: { fontSize: 13, fontWeight: '900', color: '#111827' },
  smallBtnTextActive: { color: '#fff' },
  pre: { fontSize: 13, lineHeight: 20, color: '#111827' },
  divider: { height: 1, backgroundColor: '#efe9df', marginVertical: 10 },
  inlineInputs: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' },
  secondaryBtn: { marginLeft: 'auto', borderRadius: 12, paddingVertical: 11, paddingHorizontal: 14, backgroundColor: '#fff6d6', borderWidth: 1, borderColor: '#f7c948' },
  secondaryBtnText: { fontSize: 13, fontWeight: '900', color: '#111827' },
  domainRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  domainChip: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#f9fafb' },
  domainChipActive: { backgroundColor: '#0b1020', borderColor: '#0b1020' },
  domainChipText: { fontSize: 12, fontWeight: '900', color: '#111827' },
  domainChipTextActive: { color: '#f2f1ef' },
  qnaTitle: { fontSize: 15, fontWeight: '900', color: '#111827' },
});
