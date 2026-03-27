import type { Branch, Element, Stem, YinYang } from '../types';

export const STEMS: Stem[] = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
export const BRANCHES: Branch[] = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

export const STEM_HANJA: Record<Stem, string> = {
  갑: '甲',
  을: '乙',
  병: '丙',
  정: '丁',
  무: '戊',
  기: '己',
  경: '庚',
  신: '辛',
  임: '壬',
  계: '癸',
};

export const BRANCH_HANJA: Record<Branch, string> = {
  자: '子',
  축: '丑',
  인: '寅',
  묘: '卯',
  진: '辰',
  사: '巳',
  오: '午',
  미: '未',
  신: '申',
  유: '酉',
  술: '戌',
  해: '亥',
};

export const STEM_TO_ELEMENT: Record<Stem, Element> = {
  갑: '목',
  을: '목',
  병: '화',
  정: '화',
  무: '토',
  기: '토',
  경: '금',
  신: '금',
  임: '수',
  계: '수',
};

export const STEM_TO_YINYANG: Record<Stem, YinYang> = {
  갑: '양',
  을: '음',
  병: '양',
  정: '음',
  무: '양',
  기: '음',
  경: '양',
  신: '음',
  임: '양',
  계: '음',
};

export const BRANCH_TO_ELEMENT: Record<Branch, Element> = {
  자: '수',
  축: '토',
  인: '목',
  묘: '목',
  진: '토',
  사: '화',
  오: '화',
  미: '토',
  신: '금',
  유: '금',
  술: '토',
  해: '수',
};

export const BRANCH_TO_YINYANG: Record<Branch, YinYang> = {
  자: '양',
  축: '음',
  인: '양',
  묘: '음',
  진: '양',
  사: '음',
  오: '양',
  미: '음',
  신: '양',
  유: '음',
  술: '양',
  해: '음',
};

export const BRANCH_HIDDEN_STEMS: Record<Branch, Stem[]> = {
  자: ['계'],
  축: ['기', '계', '신'],
  인: ['갑', '병', '무'],
  묘: ['을'],
  진: ['무', '을', '계'],
  사: ['병', '무', '경'],
  오: ['정', '기'],
  미: ['기', '정', '을'],
  신: ['경', '임', '무'],
  유: ['신'],
  술: ['무', '신', '정'],
  해: ['임', '갑'],
};

export const GENERATES: Record<Element, Element> = {
  목: '화',
  화: '토',
  토: '금',
  금: '수',
  수: '목',
};

export const CONTROLS: Record<Element, Element> = {
  목: '토',
  화: '금',
  토: '수',
  금: '목',
  수: '화',
};

export function isStem(value: string): value is Stem {
  return STEMS.includes(value as Stem);
}

export function isBranch(value: string): value is Branch {
  return BRANCHES.includes(value as Branch);
}
