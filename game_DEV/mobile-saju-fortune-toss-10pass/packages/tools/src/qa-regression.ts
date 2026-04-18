import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';

import type { BirthInput } from '@saju/core';
import {
  buildQnaTemplateContext,
  compareCharts,
  computeFourPillars,
  computeMonthLuckForYearMonth,
  computeSaeunForYear,
  computeSajuChart,
  formatQnaText,
} from '@saju/core';
import { qnaSnippets } from '@saju/data';

import { POST as postCompare } from '../../../apps/web/app/api/compare/route';
import { POST as postMonthLuck } from '../../../apps/web/app/api/month-luck/route';
import { POST as postSaju } from '../../../apps/web/app/api/saju/route';
import { POST as postYearLuck } from '../../../apps/web/app/api/year-luck/route';

const require = createRequire(import.meta.url);
const tarotDeckModule = require('../../../apps/mobile/lib/features/tarot/deck.ts') as {
  TAROT_DECK: Array<{ id: string }>;
  spreadFor: (type: 'today' | 'love' | 'money' | 'relationship' | 'study') => { count: number; positions: string[] };
};
const tarotRandomModule = require('../../../apps/mobile/lib/features/tarot/random.ts') as {
  hashSeed: (text: string) => number;
  makeRng: (seed: number) => () => number;
  shuffle: <T>(items: readonly T[], rng: () => number) => T[];
};
const tarotStorageModule = require('../../../apps/mobile/lib/features/tarot/storage.ts') as {
  kstDateKey: (now?: Date) => string;
};
const TAROT_DECK = tarotDeckModule.TAROT_DECK;
const spreadFor = tarotDeckModule.spreadFor;
const hashSeed = tarotRandomModule.hashSeed;
const makeRng = tarotRandomModule.makeRng;
const shuffle = tarotRandomModule.shuffle;
const kstDateKey = tarotStorageModule.kstDateKey;

type RoutePost = (request: Request) => Promise<Response>;

interface QaCheckResult {
  name: string;
  passed: boolean;
  details: string;
}

interface RouteCallResult {
  status: number;
  json: unknown;
}

const ITERATIONS = 10;

const QA_INPUTS: BirthInput[] = [
  {
    calendar: 'solar',
    date: '1992-10-24',
    time: '05:30',
    timezone: 'Asia/Seoul',
    gender: 'female',
    options: {
      includeHiddenStems: true,
      hiddenStemWeights: 'all_weighted',
      strengthModel: 'advanced_v1',
      yearPillarRule: 'ipchun',
      monthPillarRule: 'solarTerms',
      jaSiBoundaryRule: '23-01_nextDay',
    },
  },
  {
    calendar: 'solar',
    date: '2000-01-01',
    time: '23:59',
    timezone: 'Asia/Seoul',
    gender: 'male',
    options: {
      jaSiBoundaryRule: '23-01_sameDay',
      includeHiddenStems: true,
      hiddenStemWeights: 'dominant_only',
    },
  },
  {
    calendar: 'lunar',
    date: '1999-08-15',
    time: '13:20',
    timezone: 'Asia/Seoul',
    isLeapMonth: false,
    gender: 'unknown',
    options: {
      yearPillarRule: 'ipchun',
      monthPillarRule: 'solarTerms',
      includeHiddenStems: true,
    },
  },
];
const PRIMARY_INPUT = QA_INPUTS[0] as BirthInput;
const SECONDARY_INPUT = QA_INPUTS[1] as BirthInput;
const REQUIRED_QNA_DOMAINS = [
  'money',
  'love',
  'health',
  'children',
  'parents',
  'friends',
  'benefactor',
  'job',
  'business',
] as const;

function assertCondition(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function pillarsSignature(input: BirthInput): string {
  const fp = computeFourPillars(input);
  const hour = fp.hour ? `${fp.hour.stem}${fp.hour.branch}` : '--';
  return `${fp.year.stem}${fp.year.branch}|${fp.month.stem}${fp.month.branch}|${fp.day.stem}${fp.day.branch}|${hour}`;
}

async function callRoute(post: RoutePost, payload: unknown): Promise<RouteCallResult> {
  const request = new Request('http://localhost/qa', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const response = await post(request);
  const json = (await response.json()) as unknown;
  return {
    status: response.status,
    json,
  };
}

function randomDrawFromDeck(seedText: string, count: number): Array<{ id: string; reversed: boolean }> {
  const rng = makeRng(hashSeed(seedText));
  const deck = shuffle(TAROT_DECK, rng).slice(0, count);
  return deck.map((card) => ({
    id: card.id,
    reversed: rng() < 0.5,
  }));
}

async function runQa(): Promise<QaCheckResult[]> {
  const checks: QaCheckResult[] = [];

  // 1) Core deterministic computation (3 profiles x 10 repeats)
  {
    const signatures = QA_INPUTS.map((input) => pillarsSignature(input));
    for (let i = 0; i < ITERATIONS; i += 1) {
      QA_INPUTS.forEach((input, idx) => {
        const current = pillarsSignature(input);
        assertCondition(
          current === signatures[idx],
          `Determinism mismatch at case#${idx + 1}, iter=${i + 1}: ${current} != ${signatures[idx]}`,
        );
      });
    }
    checks.push({
      name: 'Core deterministic pillars',
      passed: true,
      details: `${QA_INPUTS.length} cases x ${ITERATIONS} repeats`,
    });
  }

  // 2) Core year/month luck repeat checks
  {
    const natal = computeFourPillars(PRIMARY_INPUT);
    const yearPillars = new Set<string>();
    const monthPillars = new Set<string>();

    for (let i = 0; i < ITERATIONS; i += 1) {
      const year = 2026 + i;
      const yearLuck = computeSaeunForYear(natal, year);
      yearPillars.add(`${yearLuck.pillar.stem}${yearLuck.pillar.branch}`);

      const month = (i % 12) + 1;
      const monthLuck = computeMonthLuckForYearMonth(natal, 2026, month);
      monthPillars.add(`${monthLuck.pillar.stem}${monthLuck.pillar.branch}`);
    }

    assertCondition(yearPillars.size >= 3, `Year luck diversity too low: ${yearPillars.size}`);
    assertCondition(monthPillars.size >= 3, `Month luck diversity too low: ${monthPillars.size}`);

    checks.push({
      name: 'Core year/month luck variation',
      passed: true,
      details: `year unique=${yearPillars.size}, month unique=${monthPillars.size}`,
    });
  }

  // 3) Core compare repeat checks
  {
    for (let i = 0; i < ITERATIONS; i += 1) {
      const out = compareCharts(PRIMARY_INPUT, SECONDARY_INPUT);
      assertCondition(Array.isArray(out.comparison.notes), `Compare notes missing at iter=${i + 1}`);
      assertCondition(out.comparison.notes.length >= 2, `Compare notes too short at iter=${i + 1}`);
    }
    checks.push({
      name: 'Core compare repeat',
      passed: true,
      details: `${ITERATIONS} repeats`,
    });
  }

  // 4) Web route handler checks: /api/saju
  {
    for (let i = 0; i < ITERATIONS; i += 1) {
      const payload = QA_INPUTS[i % QA_INPUTS.length] as BirthInput;
      const out = await callRoute(postSaju, payload);
      assertCondition(out.status === 200, `/api/saju expected 200, got ${out.status} at iter=${i + 1}`);
      const json = out.json as { fourPillars?: { day?: { stem?: string } } };
      assertCondition(!!json.fourPillars?.day?.stem, `/api/saju malformed payload at iter=${i + 1}`);
    }

    const invalid = await callRoute(postSaju, { calendar: 'solar' });
    assertCondition(invalid.status === 400, `/api/saju invalid payload should return 400, got ${invalid.status}`);

    checks.push({
      name: 'Route /api/saju',
      passed: true,
      details: `${ITERATIONS} valid + 1 invalid`,
    });
  }

  // 5) Web route handler checks: /api/year-luck
  {
    for (let i = 0; i < ITERATIONS; i += 1) {
      const out = await callRoute(postYearLuck, {
        birthInput: PRIMARY_INPUT,
        solarYear: 2020 + i,
      });
      assertCondition(out.status === 200, `/api/year-luck expected 200, got ${out.status} at iter=${i + 1}`);
      const json = out.json as { cycle?: { pillar?: { stem?: string; branch?: string } } };
      assertCondition(!!json.cycle?.pillar?.stem, `/api/year-luck missing pillar at iter=${i + 1}`);
      assertCondition(!!json.cycle?.pillar?.branch, `/api/year-luck missing branch at iter=${i + 1}`);
    }

    const invalid = await callRoute(postYearLuck, {
      birthInput: PRIMARY_INPUT,
      solarYear: 999,
    });
    assertCondition(
      invalid.status === 400,
      `/api/year-luck invalid payload should return 400, got ${invalid.status}`,
    );

    checks.push({
      name: 'Route /api/year-luck',
      passed: true,
      details: `${ITERATIONS} valid + 1 invalid`,
    });
  }

  // 6) Web route handler checks: /api/month-luck
  {
    const monthSignatures = new Set<string>();
    for (let i = 0; i < ITERATIONS; i += 1) {
      const month = (i % 12) + 1;
      const out = await callRoute(postMonthLuck, {
        birthInput: PRIMARY_INPUT,
        solarYear: 2026,
        solarMonth: month,
      });
      assertCondition(out.status === 200, `/api/month-luck expected 200, got ${out.status} at iter=${i + 1}`);
      const json = out.json as {
        solarMonth?: number;
        cycle?: { pillar?: { stem?: string; branch?: string } };
      };
      assertCondition(json.solarMonth === month, `/api/month-luck month mismatch at iter=${i + 1}`);
      assertCondition(!!json.cycle?.pillar?.stem, `/api/month-luck missing stem at iter=${i + 1}`);
      assertCondition(!!json.cycle?.pillar?.branch, `/api/month-luck missing branch at iter=${i + 1}`);
      monthSignatures.add(`${json.cycle?.pillar?.stem}${json.cycle?.pillar?.branch}`);
    }

    assertCondition(monthSignatures.size >= 3, `/api/month-luck diversity too low: ${monthSignatures.size}`);

    const invalid = await callRoute(postMonthLuck, {
      birthInput: PRIMARY_INPUT,
      solarYear: 2026,
      solarMonth: 13,
    });
    assertCondition(
      invalid.status === 400,
      `/api/month-luck invalid payload should return 400, got ${invalid.status}`,
    );

    checks.push({
      name: 'Route /api/month-luck',
      passed: true,
      details: `${ITERATIONS} valid + 1 invalid, unique pillars=${monthSignatures.size}`,
    });
  }

  // 7) Web route handler checks: /api/compare
  {
    for (let i = 0; i < ITERATIONS; i += 1) {
      const out = await callRoute(postCompare, {
        a: QA_INPUTS[i % QA_INPUTS.length] as BirthInput,
        b: QA_INPUTS[(i + 1) % QA_INPUTS.length] as BirthInput,
      });
      assertCondition(out.status === 200, `/api/compare expected 200, got ${out.status} at iter=${i + 1}`);
      const json = out.json as { comparison?: { notes?: string[] } };
      assertCondition(Array.isArray(json.comparison?.notes), `/api/compare notes missing at iter=${i + 1}`);
    }

    const invalid = await callRoute(postCompare, { a: PRIMARY_INPUT });
    assertCondition(invalid.status === 400, `/api/compare invalid payload should return 400, got ${invalid.status}`);

    checks.push({
      name: 'Route /api/compare',
      passed: true,
      details: `${ITERATIONS} valid + 1 invalid`,
    });
  }

  // 8) Tarot deck and RNG checks
  {
    const uniqueIds = new Set(TAROT_DECK.map((card) => card.id));
    assertCondition(TAROT_DECK.length === 22, `Tarot deck length expected 22, got ${TAROT_DECK.length}`);
    assertCondition(uniqueIds.size === TAROT_DECK.length, `Tarot deck has duplicate IDs`);

    assertCondition(spreadFor('today').count === 1, `spreadFor(today) should be 1`);
    assertCondition(spreadFor('love').count === 3, `spreadFor(love) should be 3`);
    assertCondition(spreadFor('money').count === 3, `spreadFor(money) should be 3`);
    assertCondition(spreadFor('relationship').count === 3, `spreadFor(relationship) should be 3`);
    assertCondition(spreadFor('study').count === 3, `spreadFor(study) should be 3`);

    const deterministic = randomDrawFromDeck('qa-seed', 3)
      .map((card) => `${card.id}:${card.reversed}`)
      .join('|');
    for (let i = 0; i < ITERATIONS; i += 1) {
      const current = randomDrawFromDeck('qa-seed', 3)
        .map((card) => `${card.id}:${card.reversed}`)
        .join('|');
      assertCondition(current === deterministic, `Tarot deterministic draw mismatch at iter=${i + 1}`);
    }

    for (let i = 0; i < ITERATIONS; i += 1) {
      const rng = makeRng(hashSeed(`shuffle-${i}`));
      const shuffled = shuffle(TAROT_DECK, rng);
      const ids = new Set(shuffled.map((card) => card.id));
      assertCondition(shuffled.length === TAROT_DECK.length, `Tarot shuffle length mismatch at iter=${i + 1}`);
      assertCondition(ids.size === TAROT_DECK.length, `Tarot shuffle duplicate card at iter=${i + 1}`);
    }

    checks.push({
      name: 'Tarot deck / shuffle / spread',
      passed: true,
      details: `deterministic draw ${ITERATIONS} repeats + shuffle ${ITERATIONS} repeats`,
    });
  }

  // 9) Smoke check for top-level chart object shape
  {
    for (let i = 0; i < ITERATIONS; i += 1) {
      const out = computeSajuChart(QA_INPUTS[i % QA_INPUTS.length] as BirthInput);
      assertCondition(!!out.features?.dayMaster, `chart.features.dayMaster missing at iter=${i + 1}`);
      assertCondition(!!out.luck?.cycles?.length, `chart.luck.cycles missing at iter=${i + 1}`);
    }

    checks.push({
      name: 'Chart object smoke',
      passed: true,
      details: `${ITERATIONS} repeats`,
    });
  }

  // 10) Saju QnA domain coverage + year/month variation checks
  {
    REQUIRED_QNA_DOMAINS.forEach((domain) => {
      const exists = qnaSnippets.some((snippet) => (snippet.tags ?? []).includes(domain));
      assertCondition(exists, `QnA snippet missing for domain=${domain}`);
    });

    const chart = computeSajuChart(PRIMARY_INPUT);
    const moneySnippet = qnaSnippets.find((snippet) => (snippet.tags ?? []).includes('money'));
    assertCondition(!!moneySnippet, 'QnA money snippet not found');

    const template = (moneySnippet?.content.long ?? moneySnippet?.content.short) as string;
    const monthlyTexts = new Set<string>();
    const yearlyTexts = new Set<string>();

    for (let i = 0; i < ITERATIONS; i += 1) {
      const month = (i % 12) + 1;
      const monthCycle = computeMonthLuckForYearMonth(chart.fourPillars, 2026, month);
      const monthContext = buildQnaTemplateContext(chart, {
        kind: 'month',
        year: monthCycle.solarYear,
        month: monthCycle.solarMonth,
        label: `${monthCycle.solarYear}-${String(monthCycle.solarMonth).padStart(2, '0')}`,
        pillar: `${monthCycle.pillar.stem}${monthCycle.pillar.branch}`,
        tenGod: monthCycle.tenGodToDayMaster,
        element: monthCycle.element,
      });
      const monthBody = formatQnaText(template, monthContext);
      assertCondition(monthBody.includes(monthCycle.tenGodToDayMaster), `Month QnA missing tenGod at iter=${i + 1}`);
      assertCondition(
        monthBody.includes(`${monthCycle.solarYear}-${String(monthCycle.solarMonth).padStart(2, '0')}`),
        `Month QnA missing cycle label at iter=${i + 1}`,
      );
      monthlyTexts.add(monthBody);

      const year = 2020 + i;
      const yearCycle = computeSaeunForYear(chart.fourPillars, year);
      const yearContext = buildQnaTemplateContext(chart, {
        kind: 'year',
        year: yearCycle.solarYear,
        label: `${yearCycle.solarYear}년`,
        pillar: `${yearCycle.pillar.stem}${yearCycle.pillar.branch}`,
        tenGod: yearCycle.tenGodToDayMaster,
        element: yearCycle.element,
      });
      const yearBody = formatQnaText(template, yearContext);
      assertCondition(yearBody.includes(yearCycle.tenGodToDayMaster), `Year QnA missing tenGod at iter=${i + 1}`);
      yearlyTexts.add(yearBody);
    }

    const overallText = formatQnaText(template, buildQnaTemplateContext(chart));
    assertCondition(!overallText.includes('{{'), 'QnA overall text still contains unresolved placeholders');

    assertCondition(
      monthlyTexts.size >= ITERATIONS,
      `Month QnA variation too low: ${monthlyTexts.size} (expected >= ${ITERATIONS})`,
    );
    assertCondition(
      yearlyTexts.size >= ITERATIONS,
      `Year QnA variation too low: ${yearlyTexts.size} (expected >= ${ITERATIONS})`,
    );

    checks.push({
      name: 'Saju QnA year/month variation',
      passed: true,
      details: `domains=${REQUIRED_QNA_DOMAINS.length}, month variants=${monthlyTexts.size}, year variants=${yearlyTexts.size}`,
    });
  }

  // 11) Tarot KST date-key boundary checks
  {
    const fixed = new Date('2026-01-01T00:00:00.000Z');
    const fixedKey = kstDateKey(fixed);

    for (let i = 0; i < ITERATIONS; i += 1) {
      const current = kstDateKey(fixed);
      assertCondition(current === fixedKey, `kstDateKey determinism mismatch at iter=${i + 1}`);
    }

    const beforeBoundary = kstDateKey(new Date('2026-01-01T14:59:00.000Z')); // 23:59 KST
    const afterBoundary = kstDateKey(new Date('2026-01-01T15:00:00.000Z')); // 00:00 next day KST

    assertCondition(beforeBoundary === '2026-01-01', `kstDateKey before boundary mismatch: ${beforeBoundary}`);
    assertCondition(afterBoundary === '2026-01-02', `kstDateKey after boundary mismatch: ${afterBoundary}`);

    checks.push({
      name: 'Tarot KST date key',
      passed: true,
      details: `${ITERATIONS} deterministic repeats + boundary checks`,
    });
  }

  return checks;
}

async function main(): Promise<void> {
  const startedAt = new Date();
  const repoRoot = resolve(process.cwd(), '..', '..');
  const checks: QaCheckResult[] = [];

  try {
    checks.push(...(await runQa()));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    checks.push({
      name: 'QA runtime',
      passed: false,
      details: message,
    });
  }

  const allPassed = checks.every((check) => check.passed);
  const endedAt = new Date();

  const lines: string[] = [];
  lines.push('# QA Regression Report');
  lines.push('');
  lines.push(`- Started (UTC): ${startedAt.toISOString()}`);
  lines.push(`- Finished (UTC): ${endedAt.toISOString()}`);
  lines.push(`- Iteration baseline: ${ITERATIONS} repeats per action`);
  lines.push(`- Result: ${allPassed ? 'PASS' : 'FAIL'}`);
  lines.push('');
  lines.push('| Check | Status | Details |');
  lines.push('| - | - | - |');
  checks.forEach((check) => {
    lines.push(`| ${check.name} | ${check.passed ? 'PASS' : 'FAIL'} | ${check.details.replaceAll('|', '/')} |`);
  });
  lines.push('');
  lines.push('## Scope');
  lines.push('- Core computation determinism');
  lines.push('- Year/Month luck calculation variation');
  lines.push('- Compare chart result shape');
  lines.push('- Next Route Handler integration (/api/saju, /api/year-luck, /api/month-luck, /api/compare)');
  lines.push('- Tarot deck integrity, deterministic draw, shuffle stability');
  lines.push('- Saju QnA domain coverage and year/month variation');
  lines.push('- Tarot KST date-key boundary consistency');

  const docsDir = join(repoRoot, 'docs');
  mkdirSync(docsDir, { recursive: true });
  const reportPath = join(docsDir, 'QA_REPORT.md');
  writeFileSync(reportPath, `${lines.join('\n')}\n`, 'utf-8');

  console.log(`[qa] report: ${reportPath}`);
  checks.forEach((check) => {
    console.log(`[qa] ${check.passed ? 'PASS' : 'FAIL'} - ${check.name}: ${check.details}`);
  });

  if (!allPassed) {
    process.exit(1);
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(message);
  process.exit(1);
});
