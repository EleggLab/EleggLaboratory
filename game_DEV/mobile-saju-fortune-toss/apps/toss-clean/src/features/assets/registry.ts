import type { ImageSourcePropType } from 'react-native';

import type { GraniteAssetSource } from './bundled';
import { bundledAssetSource } from './bundled';
import * as inline from './inline.generated';
import { assetSource } from './remote';

import type { ChineseZodiacKey, WesternZodiacKey } from '../today/daily';

const WESTERN_KEYS: WesternZodiacKey[] = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces',
];

const CHINESE_KEYS: ChineseZodiacKey[] = [
  'rat',
  'ox',
  'tiger',
  'rabbit',
  'dragon',
  'snake',
  'horse',
  'goat',
  'monkey',
  'rooster',
  'dog',
  'pig',
];

function inlineDataUriImage(uri: string): ImageSourcePropType {
  return { uri };
}

function inlineGraniteSource(uri: string): GraniteAssetSource {
  return {
    uri,
    cache: 'immutable',
  };
}

function readInlineString(exportName: keyof typeof inline): string {
  return inline[exportName] as string;
}

function buildDailyRegistry<TKey extends string>(
  keys: readonly TKey[],
  prefix: 'DAILY_WESTERN_ICON' | 'DAILY_WESTERN_DETAIL' | 'DAILY_CHINESE_ICON' | 'DAILY_CHINESE_DETAIL',
): Record<TKey, GraniteAssetSource> {
  return Object.fromEntries(
    keys.map((key) => {
      const exportName = `${prefix}_${String(key).toUpperCase()}_DATA_URI` as keyof typeof inline;
      return [key, inlineGraniteSource(readInlineString(exportName))];
    }),
  ) as Record<TKey, GraniteAssetSource>;
}

export const TAROT_HUB_HERO_DATA_URI_IMAGE: ImageSourcePropType = inlineDataUriImage(
  readInlineString('TAROT_HUB_HERO_DATA_URI'),
);
export const TAROT_CARD_BACK_DATA_URI_IMAGE: ImageSourcePropType = inlineDataUriImage(
  readInlineString('TAROT_CARD_BACK_DATA_URI'),
);
export const TAROT_MODE_TODAY_DATA_URI_IMAGE: ImageSourcePropType = inlineDataUriImage(
  readInlineString('TAROT_MODE_TODAY_DATA_URI'),
);
export const TAROT_MODE_LOVE_DATA_URI_IMAGE: ImageSourcePropType = inlineDataUriImage(
  readInlineString('TAROT_MODE_LOVE_DATA_URI'),
);
export const TAROT_MODE_WEALTH_DATA_URI_IMAGE: ImageSourcePropType = inlineDataUriImage(
  readInlineString('TAROT_MODE_WEALTH_DATA_URI'),
);
export const TAROT_MODE_RELATIONSHIP_DATA_URI_IMAGE: ImageSourcePropType = inlineDataUriImage(
  readInlineString('TAROT_MODE_RELATIONSHIP_DATA_URI'),
);
export const ICHING_CTA_HERO_DATA_URI_IMAGE: ImageSourcePropType = inlineDataUriImage(
  readInlineString('ICHING_CTA_HERO_DATA_URI'),
);
export const TABBAR_DAILY_ICON_DATA_URI_IMAGE: ImageSourcePropType = inlineDataUriImage(
  readInlineString('TABBAR_DAILY_ICON_DATA_URI'),
);
export const TABBAR_TAROT_ICON_DATA_URI_IMAGE: ImageSourcePropType = inlineDataUriImage(
  readInlineString('TABBAR_TAROT_ICON_DATA_URI'),
);
export const TABBAR_HOME_ICON_DATA_URI_IMAGE: ImageSourcePropType = inlineDataUriImage(
  readInlineString('TABBAR_HOME_ICON_DATA_URI'),
);
export const TABBAR_SAJU_ICON_DATA_URI_IMAGE: ImageSourcePropType = inlineDataUriImage(
  readInlineString('TABBAR_SAJU_ICON_DATA_URI'),
);
export const TABBAR_ICHING_ICON_DATA_URI_IMAGE: ImageSourcePropType = inlineDataUriImage(
  readInlineString('TABBAR_ICHING_ICON_DATA_URI'),
);

export const TAROT_HUB_HERO_SOURCE = bundledAssetSource(TAROT_HUB_HERO_DATA_URI_IMAGE);
export const TAROT_CARD_BACK_SOURCE = bundledAssetSource(TAROT_CARD_BACK_DATA_URI_IMAGE);
export const TAROT_MODE_TODAY_SOURCE = bundledAssetSource(TAROT_MODE_TODAY_DATA_URI_IMAGE);
export const TAROT_MODE_LOVE_SOURCE = bundledAssetSource(TAROT_MODE_LOVE_DATA_URI_IMAGE);
export const TAROT_MODE_WEALTH_SOURCE = bundledAssetSource(TAROT_MODE_WEALTH_DATA_URI_IMAGE);
export const TAROT_MODE_RELATIONSHIP_SOURCE = bundledAssetSource(TAROT_MODE_RELATIONSHIP_DATA_URI_IMAGE);

export const WESTERN_ICON_REGISTRY = buildDailyRegistry(WESTERN_KEYS, 'DAILY_WESTERN_ICON');
export const WESTERN_DETAIL_REGISTRY = buildDailyRegistry(WESTERN_KEYS, 'DAILY_WESTERN_DETAIL');
export const CHINESE_ICON_REGISTRY = buildDailyRegistry(CHINESE_KEYS, 'DAILY_CHINESE_ICON');
export const CHINESE_DETAIL_REGISTRY = buildDailyRegistry(CHINESE_KEYS, 'DAILY_CHINESE_DETAIL');

export function westernIconSource(key: WesternZodiacKey): GraniteAssetSource {
  return WESTERN_ICON_REGISTRY[key];
}

export function westernDetailSource(key: WesternZodiacKey): GraniteAssetSource {
  return WESTERN_DETAIL_REGISTRY[key];
}

export function chineseIconSource(key: ChineseZodiacKey): GraniteAssetSource {
  return CHINESE_ICON_REGISTRY[key];
}

export function chineseDetailSource(key: ChineseZodiacKey): GraniteAssetSource {
  return CHINESE_DETAIL_REGISTRY[key];
}

export const TIGER_REFERENCE_ICON_SOURCE = CHINESE_ICON_REGISTRY.tiger;

const TAROT_REMOTE_IMAGE_REGISTRY: Record<string, string> = {
  'rws-00-fool': 'tarot/major/rws-00-fool.png',
  'rws-01-magician': 'tarot/major/rws-01-magician.png',
  'rws-02-high-priestess': 'tarot/major/rws-02-high-priestess.png',
  'rws-03-empress': 'tarot/major/rws-03-empress.png',
  'rws-04-emperor': 'tarot/major/rws-04-emperor.png',
  'rws-05-hierophant': 'tarot/major/rws-05-hierophant.png',
  'rws-06-lovers': 'tarot/major/rws-06-lovers.png',
  'rws-07-chariot': 'tarot/major/rws-07-chariot.png',
  'rws-08-strength': 'tarot/major/rws-08-strength.png',
  'rws-09-hermit': 'tarot/major/rws-09-hermit.png',
  'rws-10-wheel': 'tarot/major/rws-10-wheel-of-fortune.png',
  'rws-11-justice': 'tarot/major/rws-11-justice.png',
  'rws-12-hanged-man': 'tarot/major/rws-12-hanged-man.png',
  'rws-13-death': 'tarot/major/rws-13-death.png',
  'rws-14-temperance': 'tarot/major/rws-14-temperance.png',
  'rws-15-devil': 'tarot/major/rws-15-devil.png',
  'rws-16-tower': 'tarot/major/rws-16-tower.png',
  'rws-17-star': 'tarot/major/rws-17-star.png',
  'rws-18-moon': 'tarot/major/rws-18-moon.png',
  'rws-19-sun': 'tarot/major/rws-19-sun.png',
  'rws-20-judgement': 'tarot/major/rws-20-judgement.png',
  'rws-21-world': 'tarot/major/rws-21-world.png',
};

export function tarotImageSourceFromId(cardId: string): GraniteAssetSource | undefined {
  const path = TAROT_REMOTE_IMAGE_REGISTRY[cardId];
  return path ? assetSource(path) : undefined;
}
