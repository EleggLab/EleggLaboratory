import { TOSS_RUNTIME_ENV } from '../config/runtimeEnv';

export type TossBannerSlot = 'home_banner_list' | 'home_feed_native' | 'support_banner_list';
export type TossFullscreenSlot = 'interstitial' | 'rewarded';
export type TossAdKind = 'banner' | 'interstitial' | 'rewarded';

export const TOSS_TEST_AD_GROUP_IDS: Record<TossBannerSlot, string> = {
  home_banner_list: 'ait-ad-test-banner-id',
  home_feed_native: 'ait-ad-test-native-image-id',
  support_banner_list: 'ait-ad-test-banner-id',
};

export const TOSS_PROD_AD_GROUP_IDS: Record<TossBannerSlot, string> = {
  home_banner_list: TOSS_RUNTIME_ENV.ads.homeBannerId,
  home_feed_native: TOSS_RUNTIME_ENV.ads.homeFeedId,
  support_banner_list: TOSS_RUNTIME_ENV.ads.supportBannerId,
};

export const TOSS_TEST_FULLSCREEN_AD_GROUP_IDS: Record<TossFullscreenSlot, string> = {
  interstitial: 'ait-ad-test-interstitial-id',
  rewarded: 'ait-ad-test-rewarded-id',
};

export const TOSS_PROD_FULLSCREEN_AD_GROUP_IDS: Record<TossFullscreenSlot, string> = {
  interstitial: '',
  rewarded: '',
};

export const TOSS_FULLSCREEN_ADS_ENABLED = TOSS_RUNTIME_ENV.features.fullscreenAds;

export const TOSS_AD_SLOT_META: Record<
  TossBannerSlot,
  { fixedHeight?: number; tone: 'blackAndWhite' | 'grey'; variant: 'expanded' | 'card' }
> = {
  home_banner_list: { fixedHeight: 96, tone: 'blackAndWhite', variant: 'expanded' },
  home_feed_native: { tone: 'grey', variant: 'card' },
  support_banner_list: { fixedHeight: 96, tone: 'blackAndWhite', variant: 'expanded' },
};

export function resolveBannerAdGroupId(slot: TossBannerSlot): string {
  if (!TOSS_RUNTIME_ENV.features.bannerAds) {
    return '';
  }

  const prod = TOSS_PROD_AD_GROUP_IDS[slot]?.trim();
  if (prod) {
    return prod;
  }

  return __DEV__ ? TOSS_TEST_AD_GROUP_IDS[slot] : '';
}

export function resolveFullscreenAdGroupId(slot: TossFullscreenSlot): string {
  if (!TOSS_FULLSCREEN_ADS_ENABLED) {
    return '';
  }

  const prod = TOSS_PROD_FULLSCREEN_AD_GROUP_IDS[slot]?.trim();
  if (prod) {
    return prod;
  }

  return __DEV__ ? TOSS_TEST_FULLSCREEN_AD_GROUP_IDS[slot] : '';
}
