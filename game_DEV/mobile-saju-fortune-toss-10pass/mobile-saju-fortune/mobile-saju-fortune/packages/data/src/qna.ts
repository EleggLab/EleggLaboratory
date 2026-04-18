import qnaSnippets from './rules/qna_snippets.v1.json';

export { qnaSnippets };

export type QnaSnippet = (typeof qnaSnippets)[number];

