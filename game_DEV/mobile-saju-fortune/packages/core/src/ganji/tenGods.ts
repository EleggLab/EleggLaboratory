import type { Element, Stem, TenGod, YinYang } from '../types';
import { CONTROLS, GENERATES, STEM_TO_ELEMENT, STEM_TO_YINYANG } from './constants';

function polarityPair(same: boolean, sameLabel: TenGod, diffLabel: TenGod): TenGod {
  return same ? sameLabel : diffLabel;
}

export function getTenGod(dayMasterStem: Stem, targetStem: Stem): TenGod {
  const dmElement = STEM_TO_ELEMENT[dayMasterStem];
  const targetElement = STEM_TO_ELEMENT[targetStem];
  const dmYinYang = STEM_TO_YINYANG[dayMasterStem];
  const targetYinYang = STEM_TO_YINYANG[targetStem];
  const samePolarity = dmYinYang === targetYinYang;

  if (dmElement === targetElement) {
    return polarityPair(samePolarity, '비견', '겁재');
  }

  if (GENERATES[dmElement] === targetElement) {
    return polarityPair(samePolarity, '식신', '상관');
  }

  if (CONTROLS[dmElement] === targetElement) {
    return polarityPair(samePolarity, '편재', '정재');
  }

  if (CONTROLS[targetElement] === dmElement) {
    return polarityPair(samePolarity, '편관', '정관');
  }

  return polarityPair(samePolarity, '편인', '정인');
}

export function elementRelation(dayMasterElement: Element, targetElement: Element):
  | 'same'
  | 'output'
  | 'wealth'
  | 'power'
  | 'resource' {
  if (dayMasterElement === targetElement) {
    return 'same';
  }

  if (GENERATES[dayMasterElement] === targetElement) {
    return 'output';
  }

  if (CONTROLS[dayMasterElement] === targetElement) {
    return 'wealth';
  }

  if (CONTROLS[targetElement] === dayMasterElement) {
    return 'power';
  }

  return 'resource';
}

export function getStemMeta(stem: Stem): { element: Element; yinYang: YinYang } {
  return {
    element: STEM_TO_ELEMENT[stem],
    yinYang: STEM_TO_YINYANG[stem],
  };
}
