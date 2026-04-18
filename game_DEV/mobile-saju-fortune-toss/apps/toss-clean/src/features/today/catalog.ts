import type { GraniteAssetSource } from '../assets/bundled';
import {
  chineseDetailSource,
  chineseIconSource,
  westernDetailSource,
  westernIconSource,
} from '../assets/registry';

import type { ChineseZodiacKey, DailyKind, WesternZodiacKey } from './daily';

export interface DailyCatalogItem<TKey extends string> {
  key: TKey;
  name: string;
  icon: GraniteAssetSource;
  detail: GraniteAssetSource;
  tileIcon?: GraniteAssetSource;
  detailHero?: GraniteAssetSource;
  detailUnderlay?: GraniteAssetSource | null;
  iconResizeMode?: 'contain' | 'cover';
  tileIconResizeMode?: 'contain' | 'cover';
  detailHeroResizeMode?: 'contain' | 'cover';
  detailHeroAspectRatio?: number;
  iconScale?: number;
  iconTranslateX?: number;
  iconTranslateY?: number;
}

export const WESTERN_DAILY_OPTIONS: Array<DailyCatalogItem<WesternZodiacKey>> = [
  {
    key: 'aries',
    name: '\uC591\uC790\uB9AC',
    icon: westernIconSource('aries'),
    detail: westernDetailSource('aries'),
    tileIcon: westernIconSource('aries'),
    detailHero: westernDetailSource('aries'),
    detailUnderlay: null,
  },
  {
    key: 'taurus',
    name: '\uD669\uC18C\uC790\uB9AC',
    icon: westernIconSource('taurus'),
    detail: westernDetailSource('taurus'),
    tileIcon: westernIconSource('taurus'),
    detailHero: westernDetailSource('taurus'),
    detailUnderlay: null,
  },
  {
    key: 'gemini',
    name: '\uC30D\uB465\uC774\uC790\uB9AC',
    icon: westernIconSource('gemini'),
    detail: westernDetailSource('gemini'),
    tileIcon: westernIconSource('gemini'),
    detailHero: westernDetailSource('gemini'),
    detailUnderlay: null,
  },
  {
    key: 'cancer',
    name: '\uAC8C\uC790\uB9AC',
    icon: westernIconSource('cancer'),
    detail: westernDetailSource('cancer'),
    tileIcon: westernIconSource('cancer'),
    detailHero: westernDetailSource('cancer'),
    detailUnderlay: null,
  },
  {
    key: 'leo',
    name: '\uC0AC\uC790\uC790\uB9AC',
    icon: westernIconSource('leo'),
    detail: westernDetailSource('leo'),
    tileIcon: westernIconSource('leo'),
    detailHero: westernDetailSource('leo'),
    detailUnderlay: null,
  },
  {
    key: 'virgo',
    name: '\uCC98\uB140\uC790\uB9AC',
    icon: westernIconSource('virgo'),
    detail: westernDetailSource('virgo'),
    tileIcon: westernIconSource('virgo'),
    detailHero: westernDetailSource('virgo'),
    detailUnderlay: null,
  },
  {
    key: 'libra',
    name: '\uCC9C\uCE6D\uC790\uB9AC',
    icon: westernIconSource('libra'),
    detail: westernDetailSource('libra'),
    tileIcon: westernIconSource('libra'),
    detailHero: westernDetailSource('libra'),
    detailUnderlay: null,
  },
  {
    key: 'scorpio',
    name: '\uC804\uAC08\uC790\uB9AC',
    icon: westernIconSource('scorpio'),
    detail: westernDetailSource('scorpio'),
    tileIcon: westernIconSource('scorpio'),
    detailHero: westernDetailSource('scorpio'),
    detailUnderlay: null,
  },
  {
    key: 'sagittarius',
    name: '\uC0AC\uC218\uC790\uB9AC',
    icon: westernIconSource('sagittarius'),
    detail: westernDetailSource('sagittarius'),
    tileIcon: westernIconSource('sagittarius'),
    detailHero: westernDetailSource('sagittarius'),
    detailUnderlay: null,
  },
  {
    key: 'capricorn',
    name: '\uC5FC\uC18C\uC790\uB9AC',
    icon: westernIconSource('capricorn'),
    detail: westernDetailSource('capricorn'),
    tileIcon: westernIconSource('capricorn'),
    detailHero: westernDetailSource('capricorn'),
    detailUnderlay: null,
  },
  {
    key: 'aquarius',
    name: '\uBB3C\uBCD1\uC790\uB9AC',
    icon: westernIconSource('aquarius'),
    detail: westernDetailSource('aquarius'),
    tileIcon: westernIconSource('aquarius'),
    detailHero: westernDetailSource('aquarius'),
    detailUnderlay: null,
  },
  {
    key: 'pisces',
    name: '\uBB3C\uACE0\uAE30\uC790\uB9AC',
    icon: westernIconSource('pisces'),
    detail: westernDetailSource('pisces'),
    tileIcon: westernIconSource('pisces'),
    detailHero: westernDetailSource('pisces'),
    detailUnderlay: null,
  },
];

export const CHINESE_DAILY_OPTIONS: Array<DailyCatalogItem<ChineseZodiacKey>> = [
  {
    key: 'rat',
    name: '\uC950\uB760',
    icon: chineseIconSource('rat'),
    detail: chineseDetailSource('rat'),
    tileIcon: chineseIconSource('rat'),
    detailHero: chineseDetailSource('rat'),
    detailUnderlay: null,
  },
  {
    key: 'ox',
    name: '\uC18C\uB760',
    icon: chineseIconSource('ox'),
    detail: chineseDetailSource('ox'),
    tileIcon: chineseIconSource('ox'),
    detailHero: chineseDetailSource('ox'),
    detailUnderlay: null,
  },
  {
    key: 'tiger',
    name: '\uD638\uB791\uC774\uB760',
    icon: chineseIconSource('tiger'),
    detail: chineseDetailSource('tiger'),
    tileIcon: chineseIconSource('tiger'),
    detailHero: chineseDetailSource('tiger'),
    detailUnderlay: null,
  },
  {
    key: 'rabbit',
    name: '\uD1A0\uB07C\uB760',
    icon: chineseIconSource('rabbit'),
    detail: chineseDetailSource('rabbit'),
    tileIcon: chineseIconSource('rabbit'),
    detailHero: chineseDetailSource('rabbit'),
    detailUnderlay: null,
  },
  {
    key: 'dragon',
    name: '\uC6A9\uB760',
    icon: chineseIconSource('dragon'),
    detail: chineseDetailSource('dragon'),
    tileIcon: chineseIconSource('dragon'),
    detailHero: chineseDetailSource('dragon'),
    detailUnderlay: null,
  },
  {
    key: 'snake',
    name: '\uBC40\uB760',
    icon: chineseIconSource('snake'),
    detail: chineseDetailSource('snake'),
    tileIcon: chineseIconSource('snake'),
    detailHero: chineseDetailSource('snake'),
    detailUnderlay: null,
  },
  {
    key: 'horse',
    name: '\uB9D0\uB760',
    icon: chineseIconSource('horse'),
    detail: chineseDetailSource('horse'),
    tileIcon: chineseIconSource('horse'),
    detailHero: chineseDetailSource('horse'),
    detailUnderlay: null,
  },
  {
    key: 'goat',
    name: '\uC591\uB760',
    icon: chineseIconSource('goat'),
    detail: chineseDetailSource('goat'),
    tileIcon: chineseIconSource('goat'),
    detailHero: chineseDetailSource('goat'),
    detailUnderlay: null,
  },
  {
    key: 'monkey',
    name: '\uC6D0\uC22D\uC774\uB760',
    icon: chineseIconSource('monkey'),
    detail: chineseDetailSource('monkey'),
    tileIcon: chineseIconSource('monkey'),
    detailHero: chineseDetailSource('monkey'),
    detailUnderlay: null,
  },
  {
    key: 'rooster',
    name: '\uB2ED\uB760',
    icon: chineseIconSource('rooster'),
    detail: chineseDetailSource('rooster'),
    tileIcon: chineseIconSource('rooster'),
    detailHero: chineseDetailSource('rooster'),
    detailUnderlay: null,
  },
  {
    key: 'dog',
    name: '\uAC1C\uB760',
    icon: chineseIconSource('dog'),
    detail: chineseDetailSource('dog'),
    tileIcon: chineseIconSource('dog'),
    detailHero: chineseDetailSource('dog'),
    detailUnderlay: null,
  },
  {
    key: 'pig',
    name: '\uB3FC\uC9C0\uB760',
    icon: chineseIconSource('pig'),
    detail: chineseDetailSource('pig'),
    tileIcon: chineseIconSource('pig'),
    detailHero: chineseDetailSource('pig'),
    detailUnderlay: null,
  },
];

export function getDailyCatalogItem(kind: DailyKind, key: string) {
  const source = kind === 'western' ? WESTERN_DAILY_OPTIONS : CHINESE_DAILY_OPTIONS;
  return source.find((item) => item.key === key) ?? null;
}
