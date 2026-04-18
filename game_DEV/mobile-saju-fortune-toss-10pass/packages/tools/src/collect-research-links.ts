import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

interface SitemapTarget {
  label: string;
  url: string;
  include: RegExp;
  max: number;
}

const SITEMAPS: SitemapTarget[] = [
  {
    label: 'Next.js',
    url: 'https://nextjs.org/sitemap.xml',
    include: /nextjs\.org\/docs\//i,
    max: 35,
  },
  {
    label: 'AI SDK',
    url: 'https://ai-sdk.dev/sitemap.xml',
    include: /ai-sdk\.dev\/(docs|cookbook|providers)\//i,
    max: 35,
  },
  {
    label: 'ECharts',
    url: 'https://echarts.apache.org/sitemap.xml',
    include: /echarts\.apache\.org\/handbook\//i,
    max: 20,
  },
  {
    label: 'Expo',
    url: 'https://docs.expo.dev/sitemap.xml',
    include: /docs\.expo\.dev\//i,
    max: 20,
  },
  {
    label: 'React Native',
    url: 'https://reactnative.dev/sitemap.xml',
    include: /reactnative\.dev\/docs\//i,
    max: 20,
  },
  {
    label: 'Vitest',
    url: 'https://vitest.dev/sitemap.xml',
    include: /vitest\.dev\/guide\//i,
    max: 10,
  },
];

const MANUAL_LINKS = [
  'https://platform.openai.com/docs/guides/streaming-responses',
  'https://platform.openai.com/docs/guides/reasoning-best-practices',
  'https://platform.openai.com/docs/guides/function-calling',
  'https://platform.openai.com/docs/api-reference/responses',
  'https://platform.openai.com/docs/api-reference/responses/create',
  'https://astro.kasi.re.kr/information/pageView/31',
  'https://www.data.go.kr/data/15012679/openapi.do',
  'https://github.com/yhj1024/manseryeok',
  'https://github.com/usingsky/KoreanLunarCalendar',
  'https://github.com/6tail/lunar-javascript',
  'https://github.com/waterbeside/lunisolar/blob/master/packages/lunisolar/docs/faq.md',
  'https://arxiv.org/abs/2510.23337',
];

function parseLocs(xml: string): string[] {
  const matches = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)];
  return matches.map((match) => match[1] ?? '').filter(Boolean);
}

async function fetchLinks(target: SitemapTarget): Promise<string[]> {
  const res = await fetch(target.url);
  if (!res.ok) {
    throw new Error(`failed to fetch ${target.url}: ${res.status}`);
  }

  const xml = await res.text();
  const links = parseLocs(xml)
    .filter((url) => target.include.test(url))
    .slice(0, target.max);

  return links;
}

async function main(): Promise<void> {
  const grouped: Array<{ label: string; links: string[] }> = [];
  const all = new Set<string>(MANUAL_LINKS);

  for (const target of SITEMAPS) {
    try {
      const links = await fetchLinks(target);
      grouped.push({ label: target.label, links });
      for (const link of links) {
        all.add(link);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      grouped.push({ label: `${target.label} (fetch failed: ${message})`, links: [] });
    }
  }

  const sorted = [...all].sort((a, b) => a.localeCompare(b));
  const lines: string[] = [];
  lines.push('# RESEARCH LINKS (100+)');
  lines.push('');
  lines.push(`Total links: ${sorted.length}`);
  lines.push('');

  for (const group of grouped) {
    lines.push(`## ${group.label}`);
    if (group.links.length === 0) {
      lines.push('- (no links)');
      lines.push('');
      continue;
    }
    for (const link of group.links) {
      lines.push(`- ${link}`);
    }
    lines.push('');
  }

  lines.push('## Manual');
  for (const link of MANUAL_LINKS) {
    lines.push(`- ${link}`);
  }
  lines.push('');

  lines.push('## Deduplicated Catalog');
  for (const link of sorted) {
    lines.push(`- ${link}`);
  }
  lines.push('');

  const file = join(process.cwd(), '..', '..', 'docs', 'RESEARCH_LINKS.md');
  writeFileSync(file, `${lines.join('\n')}\n`, 'utf8');

  console.log(`wrote ${file}`);
  console.log(`total links: ${sorted.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
