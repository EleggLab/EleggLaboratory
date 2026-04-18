'use client';

import { useMemo, useState } from 'react';
import type { AnnualLuckCycle, BirthInput, Element, SajuChartResult, TenGod } from '@saju/core';
import { buildQnaTemplateContext, formatQnaText, type QnaCycleContext, type QnaDomain } from '@saju/core';
import { qnaSnippets } from '@saju/data';

interface QnaPanelProps {
  birthInput: BirthInput;
  chart: SajuChartResult;
}

type QnaMode = 'overall' | 'year' | 'month';

interface YearLuckResponse {
  solarYear: number;
  cycle: AnnualLuckCycle;
}

interface MonthLuckResponse {
  solarYear: number;
  solarMonth: number;
  anchor: { date: string; time: string; timezone: string };
  cycle: {
    pillar: { stem: string; branch: string };
    tenGodToDayMaster: TenGod;
    element: Element;
    tags: string[];
    notes?: string[];
  };
}

const DOMAINS: Array<{ key: QnaDomain; label: string; hint: string }> = [
  { key: 'money', label: '금전', hint: '수입/지출/자원' },
  { key: 'love', label: '연애', hint: '관계/약속/표현' },
  { key: 'health', label: '건강', hint: '생활 루틴' },
  { key: 'children', label: '자식', hint: '양육/교육' },
  { key: 'parents', label: '부모', hint: '가족/책임' },
  { key: 'friends', label: '친구', hint: '동료/협업' },
  { key: 'benefactor', label: '귀인', hint: '도움/기회' },
  { key: 'job', label: '직장', hint: '커리어/평판' },
  { key: 'business', label: '사업', hint: '창업/수익화' },
];

async function postJson<T>(url: string, body: unknown, timeoutMs = 15000): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const text = await res.text();
    const json = text ? (JSON.parse(text) as unknown) : {};

    if (!res.ok) {
      const message = (json as { error?: string }).error ?? '요청에 실패했습니다.';
      throw new Error(message);
    }

    return json as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('요청이 지연되어 취소되었습니다. 잠시 후 다시 시도해 주세요.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function safeHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export default function QnaPanel({ birthInput, chart }: QnaPanelProps): React.JSX.Element {
  const [mode, setMode] = useState<QnaMode>('overall');
  const [domain, setDomain] = useState<QnaDomain>('money');

  const [yearInput, setYearInput] = useState(() => String(new Date().getFullYear()));
  const [monthInput, setMonthInput] = useState(() => String(new Date().getMonth() + 1));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const [yearCycle, setYearCycle] = useState<AnnualLuckCycle | null>(null);
  const [monthCycle, setMonthCycle] = useState<MonthLuckResponse | null>(null);

  const snippet = useMemo(() => qnaSnippets.find((item) => item.tags?.includes(domain)), [domain]);

  const cycleContext = useMemo<QnaCycleContext | undefined>(() => {
    if (mode === 'year' && yearCycle) {
      const pillar = `${yearCycle.pillar.stem}${yearCycle.pillar.branch}`;
      return { label: `${yearCycle.solarYear}년`, pillar, tenGod: yearCycle.tenGodToDayMaster, element: yearCycle.element };
    }
    if (mode === 'month' && monthCycle) {
      const pillar = `${monthCycle.cycle.pillar.stem}${monthCycle.cycle.pillar.branch}`;
      return {
        label: `${monthCycle.solarYear}-${String(monthCycle.solarMonth).padStart(2, '0')}`,
        pillar,
        tenGod: monthCycle.cycle.tenGodToDayMaster,
        element: monthCycle.cycle.element,
      };
    }
    return undefined;
  }, [mode, monthCycle, yearCycle]);

  const templateContext = useMemo(
    () => buildQnaTemplateContext(chart, cycleContext),
    [chart, cycleContext],
  );

  const rendered = useMemo(() => {
    if (!snippet) return null;
    const long = snippet.content.long ?? snippet.content.short;
    return {
      title: snippet.title,
      short: snippet.content.short,
      long: formatQnaText(long, templateContext),
      sources: snippet.evidence?.sourceUrls ?? [],
    };
  }, [snippet, templateContext]);

  const evidenceLines = useMemo(() => {
    const counts = chart.features.tenGodCount;
    const peer = counts.비견 + counts.겁재;
    const output = counts.식신 + counts.상관;
    const wealth = counts.정재 + counts.편재;
    const power = counts.정관 + counts.편관;
    const resource = counts.정인 + counts.편인;

    const dominant = templateContext.dominantElements || '-';
    const lacking = templateContext.lackingElements || '-';

    const lines = [
      `일주: ${chart.features.dayPillar} (일간 ${chart.features.dayMaster})`,
      `강약: ${chart.features.strength.level}`,
      `오행: 우세 ${dominant} / 보완 ${lacking}`,
      `십성 그룹(가중 합): 비겁 ${peer.toFixed(2)}, 식상 ${output.toFixed(2)}, 재성 ${wealth.toFixed(2)}, 관성 ${power.toFixed(2)}, 인성 ${resource.toFixed(2)}`,
    ];

    if (cycleContext) {
      lines.push(`선택 운: ${cycleContext.label} ${cycleContext.pillar} / ${cycleContext.tenGod} / ${cycleContext.element}`);
    }

    return lines;
  }, [chart, cycleContext, templateContext.dominantElements, templateContext.lackingElements]);

  async function handleLoadYear(): Promise<void> {
    setError('');
    setLoading(true);
    try {
      const solarYear = Number(yearInput);
      const data = await postJson<YearLuckResponse>('/api/year-luck', { birthInput, solarYear });
      setYearCycle(data.cycle);
      setMonthCycle(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadMonth(): Promise<void> {
    setError('');
    setLoading(true);
    try {
      const solarYear = Number(yearInput);
      const solarMonth = Number(monthInput);
      const data = await postJson<MonthLuckResponse>('/api/month-luck', { birthInput, solarYear, solarMonth });
      setMonthCycle(data);
      setYearCycle(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="section-card" style={{ marginTop: 0 }}>
        <div className="meta">
          AI 없이, 계산된 사주 결과(십성/오행/강약)만으로 분야별 Q&A를 제공합니다.
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
          {([
            ['overall', '전체'],
            ['year', '연도'],
            ['month', '월'],
          ] as Array<[QnaMode, string]>).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`tab ${mode === key ? 'active' : ''}`}
              onClick={() => setMode(key)}
              aria-pressed={mode === key}
            >
              {label}
            </button>
          ))}
        </div>

        {mode !== 'overall' ? (
          <div
            style={{
              display: 'grid',
              gap: '0.5rem',
              gridTemplateColumns: mode === 'month' ? '1fr 1fr auto' : '1fr auto',
              alignItems: 'end',
              marginTop: '0.6rem',
            }}
          >
            <label>
              연도
              <input
                type="number"
                min={1900}
                max={2100}
                value={yearInput}
                onChange={(e) => setYearInput(e.target.value)}
              />
            </label>

            {mode === 'month' ? (
              <label>
                월
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={monthInput}
                  onChange={(e) => setMonthInput(e.target.value)}
                />
              </label>
            ) : null}

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {mode === 'year' ? (
                <button type="button" className="secondary" onClick={() => void handleLoadYear()} disabled={loading}>
                  {loading ? '불러오는 중...' : '연운 불러오기'}
                </button>
              ) : null}
              {mode === 'month' ? (
                <button type="button" className="secondary" onClick={() => void handleLoadMonth()} disabled={loading}>
                  {loading ? '불러오는 중...' : '월운 불러오기'}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="warning" style={{ marginTop: '0.65rem' }}>
            {error}
          </div>
        ) : null}

        {mode !== 'overall' && !cycleContext ? (
          <div className="meta" style={{ marginTop: '0.65rem' }}>
            {mode === 'year'
              ? '연운을 불러오면 해당 연도의 포인트를 함께 반영해 풀이를 보여줍니다.'
              : '월운을 불러오면 해당 월(양력 15일 정오 기준)의 포인트를 함께 반영해 풀이를 보여줍니다.'}
          </div>
        ) : null}

        {cycleContext ? (
          <div className="meta" style={{ marginTop: '0.65rem' }}>
            선택 운: {cycleContext.label} · {cycleContext.pillar} · {cycleContext.tenGod} · {cycleContext.element}
          </div>
        ) : null}

        {mode === 'month' && monthCycle ? (
          <div className="meta" style={{ marginTop: '0.25rem' }}>
            기준: {monthCycle.anchor.date} {monthCycle.anchor.time} ({monthCycle.anchor.timezone})
            {monthCycle.cycle.notes?.[0] ? ` · ${monthCycle.cycle.notes[0]}` : null}
          </div>
        ) : null}
      </div>

      <details className="section-card" open>
        <summary>분야 선택</summary>
        <div className="chip-row">
          {DOMAINS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`tab ${domain === item.key ? 'active' : ''}`}
              onClick={() => setDomain(item.key)}
              aria-pressed={domain === item.key}
              aria-label={`${item.label} 분야 선택`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="meta" style={{ marginTop: '0.45rem' }}>
          {DOMAINS.find((item) => item.key === domain)?.hint}
        </div>
      </details>

      {rendered ? (
        <article className="section-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.8rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: 800 }}>{rendered.title}</div>
              <div className="meta" style={{ marginTop: '0.25rem' }}>
                {rendered.short}
              </div>
            </div>
          </div>

          <div className="meta" style={{ marginTop: '0.65rem', whiteSpace: 'pre-wrap', lineHeight: 1.75 }}>
            {rendered.long}
          </div>

          <details className="section-card">
            <summary>근거(사용한 값) 보기</summary>
            <div className="meta" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
              {evidenceLines.join('\n')}
            </div>
            {rendered.sources.length > 0 ? (
              <div className="chip-row" style={{ marginTop: '0.5rem' }}>
                {rendered.sources.map((url) => (
                  <a
                    key={url}
                    className="pill"
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`출처 열기: ${safeHost(url)}`}
                  >
                    {safeHost(url)}
                  </a>
                ))}
              </div>
            ) : null}
          </details>
        </article>
      ) : (
        <div className="meta">Q&A 데이터를 찾지 못했습니다.</div>
      )}
    </div>
  );
}
