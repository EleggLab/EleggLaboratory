import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

interface RawToolCard {
  slug: string;
  name: string;
  shortDesc: string;
  taskLabels: string[];
  releaseRelative: string;
  releaseDateISO: string | null;
  pricing: string;
  views: number;
  saves: number;
  rating: number | null;
  sourceTaskSlug: string;
  taaftUrl: string;
}

interface ToolWithWebsite extends RawToolCard {
  websiteUrl: string | null;
  websiteDomain: string | null;
  hypestatMonthlyVisitors: number | null;
  hypestatDailyVisitors: number | null;
  hypestatGlobalRank: number | null;
}

const TASK_SLUGS = [
  'astrology',
  'tarot',
  'horoscope',
  'numerology',
  'fortune-telling',
  'zodiac',
  'palm-reading',
  'divination',
  'book-of-changes',
  'i-ching',
  'dream-interpretation',
  'oracle',
  'runes',
  'spirituality',
  'feng-shui',
] as const;

const MIN_RELEASE_DATE = '2024-01-01';
const MIN_VIEWS = 120;
const FETCH_CONCURRENCY = 6;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stripHtml(input: string): string {
  return input
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseIntSafe(input: string | undefined): number {
  if (!input) return 0;
  const parsed = Number(input.replace(/,/g, '').trim());
  return Number.isNaN(parsed) ? 0 : parsed;
}

function parseReleaseRelativeToISO(relative: string, now: Date): string | null {
  const trimmed = relative.trim().toLowerCase();
  const m = trimmed.match(/^([0-9]+)\s*(d|mo|y)\s*ago$/);
  if (!m) return null;
  const amount = Number(m[1]);
  if (Number.isNaN(amount)) return null;
  const date = new Date(now.getTime());
  if (m[2] === 'd') {
    date.setUTCDate(date.getUTCDate() - amount);
  } else if (m[2] === 'mo') {
    date.setUTCMonth(date.getUTCMonth() - amount);
  } else if (m[2] === 'y') {
    date.setUTCFullYear(date.getUTCFullYear() - amount);
  }
  return date.toISOString().slice(0, 10);
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
      },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
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
      await sleep(250);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return out;
}

function parseTaskCards(html: string, sourceTaskSlug: string, now: Date): RawToolCard[] {
  const chunks = html.split('<div class="li_row">').slice(1);
  const rows: RawToolCard[] = [];

  for (const chunk of chunks) {
    const href = (chunk.match(/<a class="ai_link[^"]*"[^>]*href="([^"]+)"/) ?? [])[1];
    const name = stripHtml(
      (chunk.match(/<a class="ai_link[^"]*"[^>]*>[\s\S]*?<span class="">([^<]+)<\/span>/) ?? [])[1] ?? '',
    );
    if (!href || !name) continue;
    if (!href.includes('/ai/')) continue;

    const slugMatch = href.match(/\/ai\/([^/?]+)\//);
    const slug = slugMatch?.[1]?.trim();
    if (!slug) continue;

    const shortDesc = stripHtml((chunk.match(/<div class="short_desc">([\s\S]*?)<\/div>/) ?? [])[1] ?? '');
    const taskLabelMatches = Array.from(chunk.matchAll(/<a class="task_label"[^>]*>([^<]+)<\/a>/g));
    const taskLabels = taskLabelMatches.map((m) => stripHtml(m[1] ?? '')).filter(Boolean);

    const releaseRelative = stripHtml((chunk.match(/<span class="relative">([^<]+)<\/span>/) ?? [])[1] ?? '');
    const releaseDateISO = parseReleaseRelativeToISO(releaseRelative, now);
    const pricing = stripHtml((chunk.match(/<a class="ai_launch_date"[^>]*>([^<]*)<\/a>/) ?? [])[1] ?? '');

    const views = parseIntSafe((chunk.match(/<div class='stats_views'[\s\S]*?<span>([0-9,]+)<\/span>/) ?? [])[1]);
    const saves = parseIntSafe((chunk.match(/<div class='saves'>([0-9,]+)<\/div>/) ?? [])[1]);
    const ratingRaw = (chunk.match(/<div class='average_rating'>[\s\S]*?([0-9.]+)<\/div>/) ?? [])[1];
    const rating = ratingRaw ? Number(ratingRaw) : null;

    rows.push({
      slug,
      name,
      shortDesc,
      taskLabels,
      releaseRelative,
      releaseDateISO,
      pricing,
      views,
      saves,
      rating: rating !== null && !Number.isNaN(rating) ? rating : null,
      sourceTaskSlug,
      taaftUrl: `https://theresanaiforthat.com/ai/${slug}/`,
    });
  }

  return rows;
}

function normalizeDomain(url: string): string | null {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    if (!host.includes('.')) return null;
    return host;
  } catch {
    return null;
  }
}

function parseHypestatMetrics(markdown: string): {
  monthlyVisitors: number | null;
  dailyVisitors: number | null;
  globalRank: number | null;
} {
  function parseCompact(value: string | null): number | null {
    if (!value) return null;
    const m = value.replace(/,/g, '').trim().toUpperCase().match(/^([0-9]+(?:\.[0-9]+)?)([KMB])?$/);
    if (!m) return null;
    const base = Number(m[1]);
    if (Number.isNaN(base)) return null;
    const unit = m[2];
    if (unit === 'K') return Math.round(base * 1_000);
    if (unit === 'M') return Math.round(base * 1_000_000);
    if (unit === 'B') return Math.round(base * 1_000_000_000);
    return Math.round(base);
  }

  const rankMatch = markdown.match(/ranks\s+\*\*#([0-9,]+)\*\*/i) ?? markdown.match(/ranked #([0-9,]+)/i);
  const a = markdown.match(
    /receives approximately\s+\*\*([0-9.,]+[KMB]?) visitors\*\*.*?equates to about\s+\*\*([0-9.,]+[KMB]?) monthly visitors\*\*/is,
  );
  const b = markdown.match(/estimated\s+([0-9.,]+[KMB]?) visitors daily.*?about\s+([0-9.,]+[KMB]?) monthly visitors/is);

  const dailyVisitors = parseCompact(a?.[1] ?? b?.[1] ?? null);
  const monthlyVisitors = parseCompact(a?.[2] ?? b?.[2] ?? null);
  const rankRaw = rankMatch?.[1];
  const globalRank = rankRaw ? Number(rankRaw.replace(/,/g, '')) : null;

  return {
    monthlyVisitors,
    dailyVisitors,
    globalRank: globalRank !== null && !Number.isNaN(globalRank) ? globalRank : null,
  };
}

async function main(): Promise<void> {
  const now = new Date();
  const rawRows: RawToolCard[] = [];

  for (const taskSlug of TASK_SLUGS) {
    const url = `https://theresanaiforthat.com/s/${taskSlug}/`;
    const html = await fetchText(url);
    if (!html) continue;
    rawRows.push(...parseTaskCards(html, taskSlug, now));
    await sleep(350);
  }

  const dedupMap = new Map<string, RawToolCard>();
  for (const row of rawRows) {
    const key = row.slug;
    const existing = dedupMap.get(key);
    if (!existing) {
      dedupMap.set(key, row);
      continue;
    }
    if (row.views > existing.views) {
      dedupMap.set(key, row);
    }
  }

  const deduped = Array.from(dedupMap.values());
  const filtered = deduped.filter(
    (row) =>
      row.releaseDateISO !== null &&
      row.releaseDateISO >= MIN_RELEASE_DATE &&
      row.views >= MIN_VIEWS,
  );

  const withWebsites = await mapLimit(filtered, FETCH_CONCURRENCY, async (row) => {
    const toolHtml = await fetchText(row.taaftUrl);
    let websiteUrl: string | null = null;
    let websiteDomain: string | null = null;

    if (toolHtml) {
      const websiteMatch =
        toolHtml.match(/class="ai_top_link visit_website_btn"[^>]*href="([^"]+)"/) ??
        toolHtml.match(/href="([^"]+)"[^>]*class="ai_top_link visit_website_btn"/);
      websiteUrl = websiteMatch?.[1] ? websiteMatch[1].replaceAll('&amp;', '&') : null;
      if (websiteUrl) {
        websiteDomain = normalizeDomain(websiteUrl);
      }
    }

    let hypestatMonthlyVisitors: number | null = null;
    let hypestatDailyVisitors: number | null = null;
    let hypestatGlobalRank: number | null = null;

    if (websiteDomain) {
      const hypestatMarkdown = await fetchText(`https://r.jina.ai/http://hypestat.com/info/${websiteDomain}`);
      if (hypestatMarkdown) {
        const parsed = parseHypestatMetrics(hypestatMarkdown);
        hypestatMonthlyVisitors = parsed.monthlyVisitors;
        hypestatDailyVisitors = parsed.dailyVisitors;
        hypestatGlobalRank = parsed.globalRank;
      }
    }

    const out: ToolWithWebsite = {
      ...row,
      websiteUrl,
      websiteDomain,
      hypestatMonthlyVisitors,
      hypestatDailyVisitors,
      hypestatGlobalRank,
    };
    return out;
  });

  const sorted = withWebsites.sort((a, b) => {
    if (b.views !== a.views) return b.views - a.views;
    if (b.saves !== a.saves) return b.saves - a.saves;
    return (b.rating ?? 0) - (a.rating ?? 0);
  });

  const summary = {
    generatedAtUTC: new Date().toISOString(),
    sourceTaskSlugs: TASK_SLUGS,
    totalRawCards: rawRows.length,
    totalDedupedTools: deduped.length,
    totalFiltered2024PlusAndTraffic: sorted.length,
    filterRule: `releaseDateISO >= ${MIN_RELEASE_DATE} && views >= ${MIN_VIEWS}`,
    notes: [
      'Release date is inferred from the TAAFT "Released X ago" label.',
      'Views/Saves/Rating are TAAFT in-platform popularity metrics.',
      'Hypestat values are optional directional estimates for external website traffic.',
    ],
  };

  const repoRoot = resolve(process.cwd(), '..', '..');
  const researchDir = join(repoRoot, 'docs', 'research');
  mkdirSync(researchDir, { recursive: true });

  writeFileSync(
    join(researchDir, 'taaft-spiritual-2024plus.json'),
    JSON.stringify({ summary, tools: sorted }, null, 2),
    'utf-8',
  );

  const md: string[] = [];
  md.push('# WEB RESEARCH 2024+ (TAAFT + Hypestat)');
  md.push('');
  md.push(`- Generated at (UTC): ${summary.generatedAtUTC}`);
  md.push(`- Source tasks: ${TASK_SLUGS.join(', ')}`);
  md.push(`- Raw cards: ${summary.totalRawCards}`);
  md.push(`- Deduped tools: ${summary.totalDedupedTools}`);
  md.push(`- 2024+ and traffic-filtered tools: ${summary.totalFiltered2024PlusAndTraffic}`);
  md.push(`- Rule: ${summary.filterRule}`);
  md.push('');
  md.push('## Top Tools');
  md.push('');
  md.push('| # | Tool | Release (inferred) | Views | Saves | Rating | Website | Hypestat Monthly (est.) |');
  md.push('| - | - | - | - | - | - | - | - |');

  sorted.slice(0, 160).forEach((row, index) => {
    md.push(
      `| ${index + 1} | ${row.name.replace(/\|/g, '/')} | ${row.releaseDateISO ?? '-'} | ${row.views.toLocaleString(
        'en-US',
      )} | ${row.saves.toLocaleString('en-US')} | ${row.rating ?? '-'} | ${
        row.websiteDomain ?? row.taaftUrl
      } | ${row.hypestatMonthlyVisitors?.toLocaleString('en-US') ?? '-'} |`,
    );
  });

  writeFileSync(join(repoRoot, 'docs', 'WEB_RESEARCH_2024PLUS_100.md'), `${md.join('\n')}\n`, 'utf-8');

  console.log(`[taaft] filtered tools=${sorted.length}`);
  console.log(`[taaft] wrote json=${join(researchDir, 'taaft-spiritual-2024plus.json')}`);
  console.log(`[taaft] wrote markdown=${join(repoRoot, 'docs', 'WEB_RESEARCH_2024PLUS_100.md')}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(message);
  process.exit(1);
});
