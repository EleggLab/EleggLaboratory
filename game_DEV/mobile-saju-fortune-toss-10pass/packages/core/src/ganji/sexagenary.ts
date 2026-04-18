import { DevError } from '../errors';
import type { Branch, Stem } from '../types';
import { BRANCHES, BRANCH_HANJA, STEMS, STEM_HANJA } from './constants';

const SEXAGENARY: Array<`${Stem}${Branch}`> = [];

for (let i = 0; i < 60; i += 1) {
  const stem = STEMS[i % 10]!;
  const branch = BRANCHES[i % 12]!;
  SEXAGENARY.push(`${stem}${branch}`);
}

export function getSexagenaryList(): Array<`${Stem}${Branch}`> {
  return [...SEXAGENARY];
}

export function getSexagenaryByIndex(index: number): `${Stem}${Branch}` {
  const normalized = ((index % 60) + 60) % 60;
  return SEXAGENARY[normalized] as `${Stem}${Branch}`;
}

export function getSexagenaryIndex(value: string): number {
  return SEXAGENARY.indexOf(value as `${Stem}${Branch}`);
}

export function splitPillar(value: string): { stem: Stem; branch: Branch } {
  const trimmed = value.trim();
  const chars = [...trimmed];
  if (chars.length !== 2) {
    throw new DevError('INVALID_PILLAR', '간지 문자열 길이가 2가 아닙니다.', { value });
  }

  const [stem, branch] = chars;
  if (!STEMS.includes(stem as Stem) || !BRANCHES.includes(branch as Branch)) {
    throw new DevError('INVALID_PILLAR', '간지 문자열이 유효하지 않습니다.', { value });
  }

  return { stem: stem as Stem, branch: branch as Branch };
}

export function shiftPillar(value: string, delta: number): `${Stem}${Branch}` {
  const index = getSexagenaryIndex(value);
  if (index === -1) {
    throw new DevError('INVALID_PILLAR', '60갑자 목록에서 간지를 찾지 못했습니다.', { value, delta });
  }
  return getSexagenaryByIndex(index + delta);
}

export function getYearPillarBySolarYear(year: number): `${Stem}${Branch}` {
  // 1984년 = 갑자년 기준
  const index = year - 1984;
  return getSexagenaryByIndex(index);
}

export function pillarToHanja(pillar: `${Stem}${Branch}`): string {
  const { stem, branch } = splitPillar(pillar);
  return `${STEM_HANJA[stem]}${BRANCH_HANJA[branch]}`;
}
