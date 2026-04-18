import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

interface ToolRow {
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
  websiteUrl: string | null;
  websiteDomain: string | null;
  hypestatMonthlyVisitors: number | null;
  hypestatDailyVisitors: number | null;
  hypestatGlobalRank: number | null;
}

interface ResearchInput {
  summary: Record<string, unknown>;
  tools: ToolRow[];
}

interface CuratedRow extends ToolRow {
  relevanceTier: 'core' | 'adjacent';
}

interface FeatureSignal {
  id: string;
  title: string;
  keywords: string[];
  description: string;
}

interface FeatureMatch {
  id: string;
  title: string;
  description: string;
  supportCount: number;
  exampleTools: string[];
}

const MIN_RELEASE_DATE = '2024-01-01';
const MIN_VIEWS = 500;

const POSITIVE_KEYWORDS = [
  'astrolog',
  'horoscope',
  'zodiac',
  'tarot',
  'numerology',
  'fortune',
  'divination',
  'i ching',
  'iching',
  'rune',
  'oracle',
  'dream',
  'spiritual',
  'feng shui',
  'palm',
  'psychic',
  'birth chart',
  'natal',
  'destiny',
  'bazi',
  'saju',
] as const;

const NEGATIVE_KEYWORDS = [
  'interior design',
] as const;

const FEATURE_SIGNALS: readonly FeatureSignal[] = [
  {
    id: 'daily-entry',
    title: 'Daily quick entry',
    keywords: ['daily', 'today', 'horoscope', 'fortune'],
    description: 'One-tap daily reading entry remains a dominant retention pattern.',
  },
  {
    id: 'tarot-core',
    title: 'Tarot core flow',
    keywords: ['tarot', 'card reading', 'spread'],
    description: 'Tarot category depth is consistently high with multiple spread formats.',
  },
  {
    id: 'astrology-chart',
    title: 'Birth chart based analysis',
    keywords: ['astrology', 'birth chart', 'natal'],
    description: 'Birth-chart and natal interpretation are stable demand anchors.',
  },
  {
    id: 'zodiac-feed',
    title: 'Zodiac feed',
    keywords: ['zodiac', 'sign'],
    description: 'Sign-based short content feed is used as low-friction repeat content.',
  },
  {
    id: 'dream-reading',
    title: 'Dream interpretation module',
    keywords: ['dream'],
    description: 'Dream input to symbolic interpretation appears frequently in recent products.',
  },
  {
    id: 'oracle-runes',
    title: 'Oracle / rune branch',
    keywords: ['oracle', 'rune'],
    description: 'Oracle/rune modes are used as adjacent divination content for session extension.',
  },
  {
    id: 'numerology-branch',
    title: 'Numerology branch',
    keywords: ['numerology', 'life path'],
    description: 'Numerology calculators are common secondary features near astrology/tarot.',
  },
  {
    id: 'palm-reading',
    title: 'Palm reading',
    keywords: ['palm', 'palmistry'],
    description: 'Palm reading appears as a visual-input divination category in multi-mode apps.',
  },
  {
    id: 'iching-branch',
    title: 'I Ching branch',
    keywords: ['i ching', 'iching', 'book of changes'],
    description: 'I Ching style time/coin based branch exists in specialized divination tools.',
  },
  {
    id: 'chat-companion',
    title: 'Companion chat framing',
    keywords: ['chat', 'assistant', 'talk'],
    description: 'Companion-style conversational framing is used to increase completion rates.',
  },
] as const;

function toSearchText(row: ToolRow): string {
  return [row.name, row.shortDesc, row.taskLabels.join(' ')].join(' ').toLowerCase();
}

function toContextText(row: ToolRow): string {
  return [toSearchText(row), row.sourceTaskSlug].join(' ');
}

function includesAny(text: string, words: readonly string[]): boolean {
  return words.some((word) => text.includes(word));
}

function formatNum(value: number | null): string {
  if (value === null) return '-';
  return value.toLocaleString('en-US');
}

function pickExamples(rows: readonly CuratedRow[], words: readonly string[], max = 3): string[] {
  return rows
    .filter((row) => includesAny(toSearchText(row), words))
    .slice(0, max)
    .map((row) => row.name);
}

function buildFeatureMatches(rows: readonly CuratedRow[]): FeatureMatch[] {
  return FEATURE_SIGNALS.map((signal) => {
    const supportCount = rows.filter((row) => includesAny(toSearchText(row), signal.keywords)).length;
    return {
      id: signal.id,
      title: signal.title,
      description: signal.description,
      supportCount,
      exampleTools: pickExamples(rows, signal.keywords),
    };
  })
    .filter((item) => item.supportCount > 0)
    .sort((a, b) => b.supportCount - a.supportCount);
}

function main(): void {
  const repoRoot = resolve(process.cwd(), '..', '..');
  const inputPath = join(repoRoot, 'docs', 'research', 'taaft-spiritual-2024plus.json');
  const raw = readFileSync(inputPath, 'utf-8');
  const input = JSON.parse(raw) as ResearchInput;

  const curated: CuratedRow[] = input.tools
    .map((row) => {
      const directText = toSearchText(row);
      const contextText = toContextText(row);
      const hasDirectSignal = includesAny(directText, POSITIVE_KEYWORDS);
      const hasContextSignal = includesAny(contextText, POSITIVE_KEYWORDS);

      if (!row.releaseDateISO || row.releaseDateISO < MIN_RELEASE_DATE) return false;
      if (row.views < MIN_VIEWS) return false;
      if (!hasContextSignal) return false;
      if (includesAny(contextText, NEGATIVE_KEYWORDS)) return false;

      return {
        ...row,
        relevanceTier: hasDirectSignal ? 'core' : 'adjacent',
      } as CuratedRow;
    })
    .filter((row): row is CuratedRow => row !== false)
    .sort((a, b) => {
      if (b.views !== a.views) return b.views - a.views;
      if (b.saves !== a.saves) return b.saves - a.saves;
      return (b.rating ?? 0) - (a.rating ?? 0);
    });

  const coreRows = curated.filter((row) => row.relevanceTier === 'core');
  const adjacentRows = curated.filter((row) => row.relevanceTier === 'adjacent');

  const bySourceSlug = curated.reduce<Record<string, number>>((acc, row) => {
    acc[row.sourceTaskSlug] = (acc[row.sourceTaskSlug] ?? 0) + 1;
    return acc;
  }, {});

  const featureMatches = buildFeatureMatches(coreRows);

  const summary = {
    generatedAtUTC: new Date().toISOString(),
    source: 'docs/research/taaft-spiritual-2024plus.json',
    filterRule: `releaseDateISO >= ${MIN_RELEASE_DATE} && views >= ${MIN_VIEWS} && domain keywords`,
    notes: [
      'Release date is inferred from TAAFT relative release labels.',
      'Traffic proxy uses TAAFT views; Hypestat is optional when domain lookup is available.',
      'This curated set removes obvious off-domain noise such as interior-design rows.',
    ],
    totalInputRows: input.tools.length,
    totalCuratedRows: curated.length,
    totalCoreRows: coreRows.length,
    totalAdjacentRows: adjacentRows.length,
    withWebsiteDomain: curated.filter((row) => row.websiteDomain !== null).length,
    withHypestatMonthly: curated.filter((row) => row.hypestatMonthlyVisitors !== null).length,
    bySourceSlug,
  };

  const outJson = {
    summary,
    features: featureMatches,
    tools: curated,
  };

  const researchDir = join(repoRoot, 'docs', 'research');
  mkdirSync(researchDir, { recursive: true });
  writeFileSync(
    join(researchDir, 'web-research-2024plus-curated.json'),
    JSON.stringify(outJson, null, 2),
    'utf-8',
  );

  const md: string[] = [];
  md.push('# WEB RESEARCH 2024+ (Curated Similar-Web Set)');
  md.push('');
  md.push(`- Generated at (UTC): ${summary.generatedAtUTC}`);
  md.push(`- Input rows: ${summary.totalInputRows}`);
  md.push(`- Curated rows: ${summary.totalCuratedRows}`);
  md.push(`- Core rows (direct keyword match): ${summary.totalCoreRows}`);
  md.push(`- Adjacent rows (source-context match): ${summary.totalAdjacentRows}`);
  md.push(`- Filter rule: ${summary.filterRule}`);
  md.push(`- Website domain found: ${summary.withWebsiteDomain}`);
  md.push(`- Hypestat monthly estimate found: ${summary.withHypestatMonthly}`);
  md.push('');
  md.push('## Scope Notes');
  md.push('- This report focuses on post-2024 launch signals and popularity proxy within web-listed products.');
  md.push('- For web traffic, TAAFT views are used as the primary comparable signal.');
  md.push('- Domain-level traffic estimates are included only when external lookup is available.');
  md.push('');
  md.push('## 1) 100+ Similar Webs (2024+)');
  md.push('');
  md.push('| # | Tool | Tier | Release | Views | Saves | Rating | Source Tag | Website | TAAFT URL |');
  md.push('| - | - | - | - | - | - | - | - | - | - |');
  curated.forEach((row, index) => {
    const safeName = row.name.replaceAll('|', '/');
    const site = row.websiteDomain ?? '-';
    md.push(
      `| ${index + 1} | ${safeName} | ${row.relevanceTier} | ${row.releaseDateISO ?? '-'} | ${formatNum(row.views)} | ${formatNum(
        row.saves,
      )} | ${row.rating ?? '-'} | ${row.sourceTaskSlug} | ${site} | ${row.taaftUrl} |`,
    );
  });
  md.push('');
  md.push('## 2) Good Features / Materials from the List');
  md.push('');
  md.push('| Feature | Support | Why this matters | Example tools |');
  md.push('| - | - | - | - |');
  featureMatches.forEach((feature) => {
    md.push(
      `| ${feature.title} | ${feature.supportCount} | ${feature.description} | ${feature.exampleTools.join(', ') || '-'} |`,
    );
  });
  md.push('');
  md.push('## 3) Candidate Items We Can Apply (No immediate implementation)');
  md.push('');
  md.push('| Priority | Candidate | Why fit for our app | Implementation note |');
  md.push('| - | - | - | - |');
  md.push('| P1 | Daily card: one-line guidance + one-tap drill-down | Matches high-frequency daily entry pattern | Add to Home + Daily tabs with cached daily key |');
  md.push('| P1 | Tarot spread presets (1-card / 3-card / custom) | Tarot mode is the strongest repeated interaction | Keep current deck flow, add preset selector only |');
  md.push('| P1 | Zodiac + 12 animals card-first detail view | Fast glance-to-detail structure is repeatedly used | Use existing image assets, enlarge detail card container |');
  md.push('| P1 | Domain Q&A packs (money/love/work/family) | Topic packs reduce empty-state confusion | Expand static rule text packs by category and month/year |');
  md.push('| P1 | Result persistence (today done -> direct reopen) | Increases return experience continuity | Save today result hash and skip replay flow |');
  md.push('| P2 | Dream interpretation tab (symbol dictionary first) | High support in 2024+ spiritual tools | Add simple keyword dictionary + fallback narrative |');
  md.push('| P2 | Oracle/rune side mode | Extends session depth without touching core saju engine | Reuse card layout and result screen scaffold |');
  md.push('| P2 | Numerology mini-calculator | Common adjacent module with low implementation cost | Birthdate-based life path + monthly cycle cards |');
  md.push('| P2 | I Ching quick mode templates | Aligns with existing I Ching tab direction | Add situation presets before time-based cast |');
  md.push('| P3 | Companion voice line packs by tab context | Improves emotional continuity on home screen | Rotate short lines based on current tab/action |');
  md.push('| P3 | Reading history timeline | Common value-add for frequent users | Store summaries locally first, cloud later |');
  md.push('| P3 | Shareable summary cards | Social loop and retention support | Export compact image from result components |');
  md.push('');
  md.push('## Source URLs');
  md.push('- https://theresanaiforthat.com/s/astrology/');
  md.push('- https://theresanaiforthat.com/s/tarot/');
  md.push('- https://theresanaiforthat.com/s/horoscope/');
  md.push('- https://theresanaiforthat.com/s/numerology/');
  md.push('- https://theresanaiforthat.com/s/fortune-telling/');
  md.push('- https://theresanaiforthat.com/s/zodiac/');
  md.push('- https://theresanaiforthat.com/s/palm-reading/');
  md.push('- https://theresanaiforthat.com/s/divination/');
  md.push('- https://theresanaiforthat.com/s/i-ching/');
  md.push('- https://theresanaiforthat.com/s/oracle/');
  md.push('- https://theresanaiforthat.com/s/runes/');
  md.push('- https://theresanaiforthat.com/s/dream-interpretation/');
  md.push('- https://theresanaiforthat.com/s/spirituality/');
  md.push('- https://hypestat.com/');

  writeFileSync(join(repoRoot, 'docs', 'WEB_RESEARCH_2024PLUS_CURATED.md'), `${md.join('\n')}\n`, 'utf-8');

  console.log(`[curate-web] curated rows=${curated.length}`);
  console.log(`[curate-web] wrote json=${join(researchDir, 'web-research-2024plus-curated.json')}`);
  console.log(`[curate-web] wrote markdown=${join(repoRoot, 'docs', 'WEB_RESEARCH_2024PLUS_CURATED.md')}`);
}

main();
