import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

interface DomainSeed {
  domain: string;
  query: string;
  sourceUrl: string;
}

interface WebCompetitorRow {
  domain: string;
  sourceQueries: string[];
  sourceUrls: string[];
  title: string | null;
  description: string | null;
  category: string | null;
  creationDate: string | null;
  is2024PlusByCreationDate: boolean;
  dailyVisitors: number | null;
  monthlyVisitors: number | null;
  globalRank: number | null;
  relevanceScore: number;
  relevanceSignals: string[];
  hypestatUrl: string;
}

const BING_FIRSTS = [1, 41, 81];
const MAX_DOMAINS = 700;
const DETAIL_CONCURRENCY = 5;
const REQUEST_DELAY_MS = 350;

const QUERIES = [
  'ai tarot reading online',
  'daily horoscope website ai',
  'online astrology chart ai',
  'zodiac compatibility online reading',
  'online i ching oracle web',
  'book of changes online reading',
  'numerology ai reading website',
  'palm reading ai online',
  'fortune teller ai website',
  'bazi four pillars online calculator',
  'saju online reading service',
  'korean saju web app',
  'daily luck prediction ai web',
  'spiritual guidance ai chat web',
  'oracle card reading online',
  'birth chart compatibility ai',
  'moon sign calculator online ai',
  'tarot spread online reading',
  'love horoscope ai website',
  'career horoscope ai online',
  'tarot app web version',
  'astrology app web dashboard',
  'zodiac ai assistant website',
  'fortune web app 2024 launch',
  'astrology ai startup 2024',
  'tarot ai startup 2024',
  'new horoscope websites 2024',
  'new divination website 2024',
  'iching ai tool 2024',
  'numerology platform 2024',
  'saju ai 2024',
  '八字 在线 排盘 ai',
  '塔罗 在线 ai 解读',
  '운세 ai 웹',
  '사주 ai 서비스',
  '주역 ai 웹',
  '占星 ai web',
  'oracle ai website spiritual',
  'energy reading ai online',
  'daily ritual app web ai',
] as const;

const EXCLUDED_DOMAINS = new Set([
  'google.com',
  'youtube.com',
  'youtu.be',
  'facebook.com',
  'instagram.com',
  'tiktok.com',
  'x.com',
  'twitter.com',
  'wikipedia.org',
  'reddit.com',
  'pinterest.com',
  'linkedin.com',
  'medium.com',
  'github.com',
  'play.google.com',
  'apps.apple.com',
  'hypestat.com',
  'duckduckgo.com',
  'bing.com',
  'amazon.com',
  'fandom.com',
  'imdb.com',
  'quora.com',
  'news.google.com',
]);

const RELEVANCE_KEYWORDS = [
  'tarot',
  'astrology',
  'horoscope',
  'zodiac',
  'numerology',
  'fortune',
  'oracle',
  'i ching',
  'iching',
  'book of changes',
  'palm',
  'bazi',
  'four pillars',
  'saju',
  '운세',
  '사주',
  '주역',
  '占星',
  '塔罗',
  '八字',
] as const;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeDomain(input: string): string | null {
  const raw = input.trim().toLowerCase();
  if (!raw) return null;
  let host = raw;
  if (host.startsWith('http://') || host.startsWith('https://')) {
    try {
      host = new URL(host).hostname.toLowerCase();
    } catch {
      return null;
    }
  }
  host = host.replace(/^www\./, '');
  if (!host.includes('.') || host.length < 4) return null;
  if (EXCLUDED_DOMAINS.has(host)) return null;
  if (host.endsWith('.gov') || host.endsWith('.edu')) return null;
  return host;
}

function decodeSearchTarget(href: string): string | null {
  const trimmed = href.replaceAll('&amp;', '&').trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;

  if (trimmed.startsWith('/l/?') || trimmed.includes('duckduckgo.com/l/?')) {
    const probe = trimmed.startsWith('http') ? trimmed : `https://duckduckgo.com${trimmed}`;
    try {
      const u = new URL(probe);
      const target = u.searchParams.get('uddg');
      if (target) return decodeURIComponent(target);
    } catch {
      return null;
    }
  }
  return null;
}

function parseBingAnchors(html: string): string[] {
  const out: string[] = [];
  const regex = /<h2[^>]*><a[^>]+href="([^"]+)"/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    const href = match[1] ?? '';
    const predecoded = decodeSearchTarget(href);
    if (!predecoded) continue;
    try {
      const u = new URL(predecoded);
      if (u.hostname.endsWith('bing.com') && u.pathname.startsWith('/ck/a')) {
        const encodedTarget = u.searchParams.get('u');
        if (encodedTarget) {
          const raw = encodedTarget.startsWith('a1') ? encodedTarget.slice(2) : encodedTarget;
          const decoded = Buffer.from(raw, 'base64').toString('utf8');
          const unwrapped = decodeSearchTarget(decoded);
          if (unwrapped) out.push(unwrapped);
          continue;
        }
      }
      out.push(predecoded);
    } catch {
      continue;
    }
  }
  return out;
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

function parseNumberCompact(input: string | null): number | null {
  if (!input) return null;
  const clean = input.replace(/,/g, '').trim().toUpperCase();
  const hit = clean.match(/^([0-9]+(?:\.[0-9]+)?)([KMB])?$/);
  if (!hit) return null;
  const base = Number(hit[1]);
  if (Number.isNaN(base)) return null;
  const unit = hit[2];
  if (unit === 'K') return Math.round(base * 1_000);
  if (unit === 'M') return Math.round(base * 1_000_000);
  if (unit === 'B') return Math.round(base * 1_000_000_000);
  return Math.round(base);
}

function parseHypestatMetrics(markdown: string): {
  title: string | null;
  description: string | null;
  category: string | null;
  creationDate: string | null;
  dailyVisitors: number | null;
  monthlyVisitors: number | null;
  globalRank: number | null;
} {
  const titleMatch = markdown.match(/^Title:\s*(.+)$/m);
  const descMatch = markdown.match(/Description:\s*(.+)$/m);
  const categoryMatch = markdown.match(/Category:\[(.+?)\]/m);
  const creationMatch = markdown.match(/Creation Date:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/i);
  const rankMatch =
    markdown.match(/ranks\s+\*\*#([0-9,]+)\*\*/i) ?? markdown.match(/ranked #([0-9,]+)/i);

  let dailyVisitors: number | null = null;
  let monthlyVisitors: number | null = null;

  const dailyMonthlyA = markdown.match(
    /receives approximately\s+\*\*([0-9.,]+[KMB]?) visitors\*\*.*?equates to about\s+\*\*([0-9.,]+[KMB]?) monthly visitors\*\*/is,
  );
  if (dailyMonthlyA) {
    dailyVisitors = parseNumberCompact(dailyMonthlyA[1] ?? null);
    monthlyVisitors = parseNumberCompact(dailyMonthlyA[2] ?? null);
  } else {
    const dailyMonthlyB = markdown.match(
      /estimated\s+([0-9.,]+[KMB]?) visitors daily.*?about\s+([0-9.,]+[KMB]?) monthly visitors/is,
    );
    if (dailyMonthlyB) {
      dailyVisitors = parseNumberCompact(dailyMonthlyB[1] ?? null);
      monthlyVisitors = parseNumberCompact(dailyMonthlyB[2] ?? null);
    }
  }

  return {
    title: titleMatch?.[1]?.trim() ?? null,
    description: descMatch?.[1]?.trim() ?? null,
    category: categoryMatch?.[1]?.trim() ?? null,
    creationDate: creationMatch?.[1] ?? null,
    dailyVisitors,
    monthlyVisitors,
    globalRank: rankMatch?.[1] ? Number(rankMatch[1].replace(/,/g, '')) : null,
  };
}

function computeRelevance(title: string | null, description: string | null, category: string | null): {
  score: number;
  signals: string[];
} {
  const hay = `${title ?? ''} ${description ?? ''} ${category ?? ''}`.toLowerCase();
  const signals: string[] = [];
  for (const keyword of RELEVANCE_KEYWORDS) {
    if (hay.includes(keyword)) signals.push(keyword);
  }
  return {
    score: signals.length,
    signals,
  };
}

async function collectDomainSeeds(): Promise<Map<string, DomainSeed>> {
  const byDomain = new Map<string, DomainSeed>();
  for (const query of QUERIES) {
    for (const first of BING_FIRSTS) {
      const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}&count=40&first=${first}&cc=us&mkt=en-US&setlang=en-us&ensearch=1`;
      const html = await fetchText(url);
      if (!html) {
        await sleep(REQUEST_DELAY_MS);
        continue;
      }
      const links = parseBingAnchors(html);
      for (const link of links) {
        try {
          const domain = normalizeDomain(new URL(link).hostname);
          if (!domain) continue;
          const existing = byDomain.get(domain);
          if (existing) continue;
          byDomain.set(domain, { domain, query, sourceUrl: link });
          if (byDomain.size >= MAX_DOMAINS) return byDomain;
        } catch {
          continue;
        }
      }
      await sleep(REQUEST_DELAY_MS);
    }
  }
  return byDomain;
}

async function mapLimit<T, R>(items: readonly T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let index = 0;

  async function worker(): Promise<void> {
    while (true) {
      const i = index;
      index += 1;
      if (i >= items.length) return;
      out[i] = await fn(items[i] as T, i);
      await sleep(REQUEST_DELAY_MS);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return out;
}

async function main(): Promise<void> {
  const seeds = await collectDomainSeeds();
  const domains = Array.from(seeds.keys());
  console.log(`[web-research] collected domains from search=${domains.length}`);

  const rows = await mapLimit(domains, DETAIL_CONCURRENCY, async (domain) => {
    const hypestatUrl = `https://r.jina.ai/http://hypestat.com/info/${domain}`;
    const markdown = await fetchText(hypestatUrl);
    if (!markdown) return null;
    if (markdown.includes('404 Not Found')) return null;
    if (markdown.includes('Too Many Requests')) return null;

    const parsed = parseHypestatMetrics(markdown);
    const relevance = computeRelevance(parsed.title, parsed.description, parsed.category);
    if (relevance.score === 0) return null;

    const seed = seeds.get(domain);
    const creationDate = parsed.creationDate;
    const is2024PlusByCreationDate =
      creationDate !== null ? creationDate >= '2024-01-01' : false;

    const row: WebCompetitorRow = {
      domain,
      sourceQueries: seed ? [seed.query] : [],
      sourceUrls: seed ? [seed.sourceUrl] : [],
      title: parsed.title,
      description: parsed.description,
      category: parsed.category,
      creationDate,
      is2024PlusByCreationDate,
      dailyVisitors: parsed.dailyVisitors,
      monthlyVisitors: parsed.monthlyVisitors,
      globalRank: parsed.globalRank,
      relevanceScore: relevance.score,
      relevanceSignals: relevance.signals,
      hypestatUrl,
    };
    return row;
  });

  const validRows = rows.filter((r): r is WebCompetitorRow => r !== null);
  const sorted = validRows.sort((a, b) => {
    const am = a.monthlyVisitors ?? 0;
    const bm = b.monthlyVisitors ?? 0;
    if (bm !== am) return bm - am;
    const ar = a.globalRank ?? Number.MAX_SAFE_INTEGER;
    const br = b.globalRank ?? Number.MAX_SAFE_INTEGER;
    return ar - br;
  });

  const strict2024Plus = sorted.filter(
    (r) =>
      r.is2024PlusByCreationDate &&
      (r.monthlyVisitors ?? 0) >= 30_000 &&
      r.relevanceScore >= 1,
  );

  const summary = {
    generatedAtUTC: new Date().toISOString(),
    candidatesFromSearch: domains.length,
    relevantRows: sorted.length,
    strict2024PlusRows: strict2024Plus.length,
    strictRule: 'creationDate >= 2024-01-01 && monthlyVisitors >= 30000',
    notes: [
      'Traffic and creation date are parsed from hypestat.com snapshots via r.jina.ai mirror.',
      'Monthly visitors are estimates and should be treated as directional signals.',
    ],
  };

  const repoRoot = resolve(process.cwd(), '..', '..');
  const outDir = join(repoRoot, 'docs', 'research');
  mkdirSync(outDir, { recursive: true });

  writeFileSync(
    join(outDir, 'web-competitors-2024plus.json'),
    JSON.stringify({ summary, strict2024Plus, allRelevant: sorted }, null, 2),
    'utf-8',
  );

  const top100 = strict2024Plus.slice(0, 120);
  const mdLines: string[] = [];
  mdLines.push('# WEB COMPETITORS 2024+ (Traffic Filtered)');
  mdLines.push('');
  mdLines.push(`- Generated at (UTC): ${summary.generatedAtUTC}`);
  mdLines.push(`- Search candidate domains: ${summary.candidatesFromSearch}`);
  mdLines.push(`- Relevant domains parsed: ${summary.relevantRows}`);
  mdLines.push(`- Strict 2024+ rows: ${summary.strict2024PlusRows}`);
  mdLines.push(`- Rule: ${summary.strictRule}`);
  mdLines.push('');
  mdLines.push('## Top Rows (up to 120)');
  mdLines.push('');
  mdLines.push('| # | Domain | Creation Date | Monthly Visitors (est.) | Daily Visitors (est.) | Global Rank | Signals |');
  mdLines.push('| - | - | - | - | - | - | - |');

  top100.forEach((row, index) => {
    mdLines.push(
      `| ${index + 1} | ${row.domain} | ${row.creationDate ?? '-'} | ${
        row.monthlyVisitors?.toLocaleString('en-US') ?? '-'
      } | ${row.dailyVisitors?.toLocaleString('en-US') ?? '-'} | ${
        row.globalRank?.toLocaleString('en-US') ?? '-'
      } | ${row.relevanceSignals.slice(0, 5).join(', ')} |`,
    );
  });

  writeFileSync(join(repoRoot, 'docs', 'WEB_COMPETITORS_2024PLUS_TRAFFIC.md'), `${mdLines.join('\n')}\n`, 'utf-8');

  console.log(`[web-research] wrote json=${join(outDir, 'web-competitors-2024plus.json')}`);
  console.log(
    `[web-research] wrote markdown=${join(repoRoot, 'docs', 'WEB_COMPETITORS_2024PLUS_TRAFFIC.md')}`,
  );
  console.log(`[web-research] strict rows=${strict2024Plus.length}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(message);
  process.exit(1);
});
