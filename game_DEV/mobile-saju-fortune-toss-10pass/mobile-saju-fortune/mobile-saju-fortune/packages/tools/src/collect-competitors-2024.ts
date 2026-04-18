import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import gplay from 'google-play-scraper';

interface CandidateMeta {
  appId: string;
  terms: Set<string>;
  countries: Set<string>;
}

interface CompetitorRow {
  appId: string;
  title: string;
  url: string;
  released: string;
  score: number | null;
  ratings: number | null;
  installs: string | null;
  genre: string | null;
  icon: string | null;
  summary: string;
  sourceTerms: string[];
  sourceCountries: string[];
}

const MIN_RELEASE_ISO = '2024-01-01';
const TARGET_MIN_APPS = 100;
const SEARCH_RESULT_LIMIT = 80;
const MAX_CANDIDATES = 2600;
const DETAIL_CONCURRENCY = 8;

const COUNTRIES = ['us', 'kr', 'jp', 'tw', 'in', 'id', 'br', 'mx'] as const;

const TERMS = [
  'tarot',
  'daily tarot',
  'horoscope',
  'daily horoscope',
  'astrology',
  'zodiac',
  'birth chart',
  'natal chart',
  'fortune teller',
  'psychic reading',
  'oracle cards',
  'numerology',
  'angel numbers',
  'palm reading',
  'moon sign',
  'compatibility horoscope',
  'love horoscope',
  'runes',
  'i ching',
  'iching',
  'bazi',
  'four pillars',
  'saju',
  '사주',
  '운세',
  '타로',
  '주역',
  '점성술',
  '占い',
  'タロット',
  '星座占い',
  '八字',
  '命理',
  '占星',
  '易经',
  'rashifal',
  'kundli',
  'jyotish',
  'fortune app',
] as const;

const STRONG_RELEVANCE_KEYWORDS = [
  'tarot',
  'horoscope',
  'astrolog',
  'zodiac',
  'numerology',
  'palm',
  'iching',
  'i ching',
  'oracle',
  'bazi',
  'saju',
  'kundli',
  'jyotish',
  'rashifal',
  'divination',
  'fortune teller',
  'four pillars',
  '주역',
  '사주',
  '운세',
  '타로',
  '점성',
  '八字',
  '命理',
  '易经',
  '占い',
  '星座占い',
] as const;

const EXCLUDE_KEYWORDS = [
  'slot',
  'slots',
  'casino',
  'bingo',
  'poker',
  'rummy',
  'solitaire',
  'blackjack',
  'lottery',
  'bet',
  'board adventure',
  'match-3',
  'merge game',
] as const;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseReleaseToIso(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const cleaned = value
    .replace(/\u00a0/g, ' ')
    .replace(/\b(\d{1,2})(st|nd|rd|th)\b/gi, '$1')
    .trim();
  if (!cleaned) return null;
  const ts = Date.parse(cleaned);
  if (Number.isNaN(ts)) return null;
  return new Date(ts).toISOString().slice(0, 10);
}

function nonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const v = value.trim();
  return v.length > 0 ? v : null;
}

function normalizeSummary(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim();
}

function includesAny(haystack: string, needles: readonly string[]): boolean {
  return needles.some((needle) => haystack.includes(needle));
}

function isRelevantApp(title: string, summary: string, genre: string | null): boolean {
  const hay = `${title} ${summary} ${genre ?? ''}`.toLowerCase();
  const hasStrong = includesAny(hay, STRONG_RELEVANCE_KEYWORDS);
  if (!hasStrong) return false;
  const hasExclude = includesAny(hay, EXCLUDE_KEYWORDS);
  return !hasExclude;
}

async function mapLimit<T, R>(items: readonly T[], limit: number, task: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;

  async function worker(): Promise<void> {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) return;
      out[index] = await task(items[index] as T, index);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return out;
}

async function collectCandidates(): Promise<Map<string, CandidateMeta>> {
  const byId = new Map<string, CandidateMeta>();
  let searchCalls = 0;

  for (const country of COUNTRIES) {
    for (const term of TERMS) {
      if (byId.size >= MAX_CANDIDATES) break;

      try {
        const results = await gplay.search({
          term,
          num: SEARCH_RESULT_LIMIT,
          country,
          lang: 'en',
          throttle: 0,
        });
        searchCalls += 1;

        for (const item of results) {
          const appId = nonEmptyString((item as { appId?: unknown }).appId);
          if (!appId) continue;
          const existing = byId.get(appId);
          if (existing) {
            existing.terms.add(term);
            existing.countries.add(country);
          } else {
            byId.set(appId, {
              appId,
              terms: new Set([term]),
              countries: new Set([country]),
            });
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`[search] failed term="${term}" country="${country}" -> ${message}`);
      }

      await sleep(90);
    }
  }

  console.log(`[collect] search calls=${searchCalls}, candidates=${byId.size}`);
  return byId;
}

async function fetchDetailWithFallback(appId: string, countryHints: readonly string[]): Promise<unknown | null> {
  const countries = Array.from(new Set(['us', ...countryHints]));
  for (const country of countries) {
    try {
      return await gplay.app({
        appId,
        country,
        lang: 'en',
        throttle: 0,
      });
    } catch {
      // continue
    }
  }
  return null;
}

function extractTopTokens(rows: readonly CompetitorRow[]): Array<{ token: string; count: number }> {
  const stopWords = new Set([
    'the',
    'and',
    'for',
    'your',
    'you',
    'with',
    'daily',
    'app',
    'free',
    'plus',
    'new',
    'of',
    'to',
    'in',
    'on',
    'a',
    'an',
    'by',
    'astrology',
    'horoscope',
    'tarot',
    'fortune',
  ]);

  const counts = new Map<string, number>();
  for (const row of rows) {
    const source = `${row.title} ${row.summary}`.toLowerCase();
    const tokens = source
      .split(/[^a-z0-9+]+/g)
      .map((t) => t.trim())
      .filter((t) => t.length >= 3 && !stopWords.has(t));
    const seen = new Set(tokens);
    for (const token of seen) {
      counts.set(token, (counts.get(token) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([token, count]) => ({ token, count }));
}

function buildMarkdown(rows: readonly CompetitorRow[], topTokens: readonly { token: string; count: number }[]): string {
  const lines: string[] = [];
  lines.push('# COMPETITORS 2024+ (Google Play)');
  lines.push('');
  lines.push(`- Generated at (UTC): ${new Date().toISOString()}`);
  lines.push(`- Filter: release date >= ${MIN_RELEASE_ISO}`);
  lines.push(`- Total apps: ${rows.length}`);
  lines.push(`- Source: Google Play app detail pages`);
  lines.push('');

  lines.push('## Token Trends (Title + Summary)');
  for (const token of topTokens.slice(0, 15)) {
    lines.push(`- ${token.token}: ${token.count}`);
  }
  lines.push('');

  lines.push('## Apps');
  lines.push('');
  lines.push('| # | App | Release | Genre | Installs | Score | URL |');
  lines.push('| - | - | - | - | - | - | - |');
  rows.forEach((row, idx) => {
    const appName = row.title.replace(/\|/g, '\\|');
    const genre = (row.genre ?? '-').replace(/\|/g, '\\|');
    const installs = (row.installs ?? '-').replace(/\|/g, '\\|');
    const score = row.score !== null ? row.score.toFixed(2) : '-';
    lines.push(`| ${idx + 1} | ${appName} | ${row.released} | ${genre} | ${installs} | ${score} | ${row.url} |`);
  });
  lines.push('');

  lines.push('## URL Catalog (100+)');
  rows.forEach((row) => {
    lines.push(`- ${row.url}`);
  });
  lines.push('');
  return `${lines.join('\n')}\n`;
}

async function main(): Promise<void> {
  const candidates = await collectCandidates();

  const candidateList = [...candidates.values()]
    .sort((a, b) => b.terms.size - a.terms.size)
    .slice(0, MAX_CANDIDATES);

  console.log(`[collect] detail fetch queue=${candidateList.length}`);

  let checked = 0;
  const details = await mapLimit(candidateList, DETAIL_CONCURRENCY, async (candidate) => {
    checked += 1;
    if (checked % 100 === 0) {
      console.log(`[detail] checked=${checked}/${candidateList.length}`);
    }

    const detailRaw = await fetchDetailWithFallback(candidate.appId, [...candidate.countries]);
    if (!detailRaw || typeof detailRaw !== 'object') return null;

    const detail = detailRaw as Record<string, unknown>;
    const releasedIso = parseReleaseToIso(detail.released);
    if (!releasedIso) return null;
    if (releasedIso < MIN_RELEASE_ISO) return null;

    const appId = nonEmptyString(detail.appId) ?? candidate.appId;
    const title = nonEmptyString(detail.title);
    if (!title) return null;

    const summary = normalizeSummary(detail.summary);
    const genre = nonEmptyString(detail.genre);
    if (!isRelevantApp(title, summary, genre)) return null;

    const url = `https://play.google.com/store/apps/details?id=${appId}`;
    return {
      appId,
      title,
      url,
      released: releasedIso,
      score: typeof detail.score === 'number' ? detail.score : null,
      ratings: typeof detail.ratings === 'number' ? detail.ratings : null,
      installs: nonEmptyString(detail.installs),
      genre,
      icon: nonEmptyString(detail.icon),
      summary,
      sourceTerms: [...candidate.terms].sort(),
      sourceCountries: [...candidate.countries].sort(),
    } satisfies CompetitorRow;
  });

  const dedup = new Map<string, CompetitorRow>();
  for (const row of details) {
    if (!row) continue;
    if (!dedup.has(row.appId)) dedup.set(row.appId, row);
  }

  const rows = [...dedup.values()].sort((a, b) => {
    if (a.released !== b.released) return a.released < b.released ? 1 : -1;
    const scoreA = a.score ?? -1;
    const scoreB = b.score ?? -1;
    return scoreB - scoreA;
  });

  const topTokens = extractTopTokens(rows);
  const md = buildMarkdown(rows, topTokens);

  const researchDir = join(process.cwd(), '..', '..', 'docs', 'research');
  mkdirSync(researchDir, { recursive: true });

  const jsonPath = join(researchDir, 'competitive-apps-2024plus.json');
  const mdPath = join(process.cwd(), '..', '..', 'docs', 'COMPETITORS_2024PLUS.md');
  writeFileSync(
    jsonPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        minRelease: MIN_RELEASE_ISO,
        total: rows.length,
        terms: TERMS,
        countries: COUNTRIES,
        topTokens,
        apps: rows,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
  writeFileSync(mdPath, md, 'utf8');

  console.log(`[done] ${rows.length} apps (release >= ${MIN_RELEASE_ISO})`);
  console.log(`[done] wrote ${jsonPath}`);
  console.log(`[done] wrote ${mdPath}`);

  if (rows.length < TARGET_MIN_APPS) {
    console.warn(`[warn] found ${rows.length} apps, below target ${TARGET_MIN_APPS}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
