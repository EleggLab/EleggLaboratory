import stems from './stems.v1.json';
import branches from './branches.v1.json';
import tenGods from './tenGods.v1.json';
import relations from './relations.v1.json';
import dayPillarArchetypes from './rules/dayPillar_archetypes.v1.json';
import businessRules from './rules/business_rules.v1.json';
import faqSnippets from './rules/faq_snippets.v1.json';
import qnaSnippets from './rules/qna_snippets.v1.json';

export const dataVersion = 'v1';

export {
  stems,
  branches,
  tenGods,
  relations,
  dayPillarArchetypes,
  businessRules,
  faqSnippets,
  qnaSnippets,
};

export type StemRow = (typeof stems)[number];
export type BranchRow = (typeof branches)[number];
export type QnaSnippet = (typeof qnaSnippets)[number];
