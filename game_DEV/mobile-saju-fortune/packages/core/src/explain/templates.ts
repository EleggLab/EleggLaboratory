import { businessRules, dayPillarArchetypes, faqSnippets } from '@saju/data';

interface ExplainContext {
  dayPillar?: string;
  tags?: string[];
}

interface ExplainResult {
  id: string;
  title: string;
  short: string;
  long?: string;
  questions?: string[];
  sourceUrls: string[];
}

interface RuleSnippet {
  id: string;
  title: string;
  when?: string;
  content: {
    short: string;
    long?: string;
    questions?: string[];
  };
  evidence?: {
    sourceUrls?: string[];
  };
}

function toSnippetList(value: unknown): RuleSnippet[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is RuleSnippet => {
    if (!item || typeof item !== 'object') {
      return false;
    }

    const candidate = item as Partial<RuleSnippet>;
    return (
      typeof candidate.id === 'string' &&
      typeof candidate.title === 'string' &&
      !!candidate.content &&
      typeof candidate.content.short === 'string'
    );
  });
}

function mapResult(snippet: RuleSnippet): ExplainResult {
  const base: ExplainResult = {
    id: snippet.id,
    title: snippet.title,
    short: snippet.content.short,
    sourceUrls: snippet.evidence?.sourceUrls ?? [],
  };

  if (snippet.content.long) {
    base.long = snippet.content.long;
  }
  if (snippet.content.questions) {
    base.questions = snippet.content.questions;
  }

  return base;
}

export function explainFeature(featureId: string, context?: ExplainContext): ExplainResult | undefined {
  const merged = [
    ...toSnippetList(dayPillarArchetypes),
    ...toSnippetList(businessRules),
    ...toSnippetList(faqSnippets),
  ];

  const direct = merged.find((item) => item.id === featureId);
  if (direct) {
    return mapResult(direct);
  }

  if (context?.dayPillar) {
    const day = merged.find((item) => item.when === `dayPillar == '${context.dayPillar}'`);
    if (day) {
      return mapResult(day);
    }
  }

  return undefined;
}
