'use client';

import { useMemo, useState } from 'react';
import type { Pillar, SajuChartResult, Stem, TenGod } from '@saju/core';
import { getTenGod } from '@saju/core';
import { branches, stems } from '@saju/data';

type PillarKey = 'year' | 'month' | 'day' | 'hour';

const PILLAR_LABEL: Record<PillarKey, string> = {
  year: '년주',
  month: '월주',
  day: '일주',
  hour: '시주',
};

const ELEMENT_CLASS: Record<string, string> = {
  목: 'el-wood',
  화: 'el-fire',
  토: 'el-earth',
  금: 'el-metal',
  수: 'el-water',
};

function safeFixed(value: number | undefined, digits = 1): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }
  return value.toFixed(digits);
}

function tenGodForStem(dayMaster: Stem, pillar: Pillar | undefined, pillarKey: PillarKey): TenGod | '일간' | '-' {
  if (!pillar) {
    return '-';
  }
  if (pillarKey === 'day') {
    return '일간';
  }
  return getTenGod(dayMaster, pillar.stem);
}

function formatStem(
  stem: string,
  opts: { showHanja: boolean; showMeta: boolean },
  meta: { hanja?: string; element?: string; yinYang?: string } | null,
): React.JSX.Element {
  const elClass = meta?.element ? ELEMENT_CLASS[meta.element] : '';
  return (
    <div className="ganji-cell">
      <div className="ganji-main">
        <span className="ganji-big">{stem}</span>
        {opts.showHanja && meta?.hanja ? <span className="ganji-hanja">{meta.hanja}</span> : null}
      </div>
      {opts.showMeta && meta?.element ? (
        <div className="ganji-sub">
          <span className={`element-badge ${elClass}`}>{meta.element}</span>
          {meta.yinYang ? <span className="meta-inline">{meta.yinYang}</span> : null}
        </div>
      ) : null}
    </div>
  );
}

function formatBranch(
  branch: string,
  opts: { showHanja: boolean; showMeta: boolean },
  meta: { hanja?: string; element?: string } | null,
): React.JSX.Element {
  const elClass = meta?.element ? ELEMENT_CLASS[meta.element] : '';
  return (
    <div className="ganji-cell">
      <div className="ganji-main">
        <span className="ganji-big">{branch}</span>
        {opts.showHanja && meta?.hanja ? <span className="ganji-hanja">{meta.hanja}</span> : null}
      </div>
      {opts.showMeta && meta?.element ? (
        <div className="ganji-sub">
          <span className={`element-badge ${elClass}`}>{meta.element}</span>
        </div>
      ) : null}
    </div>
  );
}

function formatHiddenStems(dayMaster: Stem, pillar: Pillar | undefined): React.JSX.Element {
  const items = pillar?.hiddenStems;
  if (!items || items.length === 0) {
    return <span className="meta">-</span>;
  }

  return (
    <div className="mini-chips">
      {items.map((hs, index) => {
        const tenGod = hs.tenGodToDayMaster ?? getTenGod(dayMaster, hs.stem);
        const weightText = safeFixed(hs.weight);
        const elClass = hs.element ? ELEMENT_CLASS[hs.element] : '';
        return (
          <span key={`${hs.stem}-${index}`} className="mini-chip">
            <span className="mini-chip-head">
              <span className={`element-dot ${elClass}`} aria-hidden />
              <strong>{hs.stem}</strong>
            </span>
            <span className="mini-chip-body">
              {tenGod}
              {weightText ? <span className="meta-inline">w={weightText}</span> : null}
            </span>
          </span>
        );
      })}
    </div>
  );
}

export default function PillarsMatrix({ chart }: { chart: SajuChartResult }): React.JSX.Element {
  const [showHanja, setShowHanja] = useState(true);
  const [showMeta, setShowMeta] = useState(true);

  const stemMeta = useMemo(() => new Map(stems.map((row) => [row.stem, row] as const)), []);
  const branchMeta = useMemo(() => new Map(branches.map((row) => [row.branch, row] as const)), []);

  const pillars: Record<PillarKey, Pillar | undefined> = {
    year: chart.fourPillars.year,
    month: chart.fourPillars.month,
    day: chart.fourPillars.day,
    hour: chart.fourPillars.hour,
  };

  const dayMaster = chart.fourPillars.day.stem;

  return (
    <div>
      <div className="matrix-toolbar">
        <button type="button" className="secondary" onClick={() => setShowHanja((prev) => !prev)}>
          {showHanja ? '한자 숨기기' : '한자 보기'}
        </button>
        <button type="button" className="secondary" onClick={() => setShowMeta((prev) => !prev)}>
          {showMeta ? '오행/음양 숨기기' : '오행/음양 보기'}
        </button>
      </div>

      <div className="table-wrap">
        <table className="pillars-matrix" aria-label="사주 명조 표">
          <thead>
            <tr>
              <th scope="col" className="row-head">
                구분
              </th>
              {(['year', 'month', 'day', 'hour'] as const).map((key) => (
                <th
                  key={key}
                  scope="col"
                  className={key === 'day' ? 'day-col' : undefined}
                  aria-label={`${PILLAR_LABEL[key]} 열`}
                >
                  {PILLAR_LABEL[key]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">천간</th>
              {(['year', 'month', 'day', 'hour'] as const).map((key) => {
                const pillar = pillars[key];
                if (!pillar) {
                  return (
                    <td key={key} className={key === 'day' ? 'day-col' : undefined}>
                      <span className="meta">미정</span>
                    </td>
                  );
                }
                const meta = stemMeta.get(pillar.stem);
                return (
                  <td key={key} className={key === 'day' ? 'day-col' : undefined}>
                    {formatStem(
                      pillar.stem,
                      { showHanja, showMeta },
                      meta
                        ? { hanja: meta.hanja, element: pillar.stemElement, yinYang: pillar.stemYinYang }
                        : { element: pillar.stemElement, yinYang: pillar.stemYinYang },
                    )}
                  </td>
                );
              })}
            </tr>

            <tr>
              <th scope="row">십성(천간)</th>
              {(['year', 'month', 'day', 'hour'] as const).map((key) => (
                <td key={key} className={key === 'day' ? 'day-col' : undefined}>
                  <span className="pill">{tenGodForStem(dayMaster, pillars[key], key)}</span>
                </td>
              ))}
            </tr>

            <tr>
              <th scope="row">지지</th>
              {(['year', 'month', 'day', 'hour'] as const).map((key) => {
                const pillar = pillars[key];
                if (!pillar) {
                  return (
                    <td key={key} className={key === 'day' ? 'day-col' : undefined}>
                      <span className="meta">미정</span>
                    </td>
                  );
                }
                const meta = branchMeta.get(pillar.branch);
                return (
                  <td key={key} className={key === 'day' ? 'day-col' : undefined}>
                    {formatBranch(
                      pillar.branch,
                      { showHanja, showMeta },
                      meta
                        ? { hanja: meta.hanja, element: pillar.branchElementPrimary }
                        : { element: pillar.branchElementPrimary },
                    )}
                  </td>
                );
              })}
            </tr>

            <tr>
              <th scope="row">지장간</th>
              {(['year', 'month', 'day', 'hour'] as const).map((key) => (
                <td key={key} className={key === 'day' ? 'day-col' : undefined}>
                  {formatHiddenStems(dayMaster, pillars[key])}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <p className="meta" style={{ marginTop: '0.45rem' }}>
        표의 십성은 <strong>일간</strong>(일주의 천간)을 기준으로 계산됩니다.
      </p>
    </div>
  );
}

