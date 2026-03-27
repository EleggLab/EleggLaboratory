import { TOSS_RUNTIME_ENV } from '../config/runtimeEnv';

export type TossBannerSlot = 'home_banner_list' | 'today_banner_inline' | 'tarot_result_banner_list';
export type TossFullscreenSlot = 'interstitial' | 'rewarded';
export type TossAdKind = 'banner' | 'interstitial' | 'rewarded';

export const TOSS_TEST_AD_GROUP_IDS: Record<TossBannerSlot, string> = {
  home_banner_list: 'ait-ad-test-banner-id',
  today_banner_inline: 'ait-ad-test-native-image-id',
  tarot_result_banner_list: 'ait-ad-test-banner-id',
};

export const TOSS_PROD_AD_GROUP_IDS: Record<TossBannerSlot, string> = {
  home_banner_list: TOSS_RUNTIME_ENV.ads.homeBannerId,
  today_banner_inline: TOSS_RUNTIME_ENV.ads.todayBannerId,
  tarot_result_banner_list: TOSS_RUNTIME_ENV.ads.tarotResultBannerId,
};

export const TOSS_TEST_FULLSCREEN_AD_GROUP_IDS: Record<TossFullscreenSlot, string> = {
  interstitial: 'ait-ad-test-interstitial-id',
  rewarded: 'ait-ad-test-rewarded-id',
};

export const TOSS_PROD_FULLSCREEN_AD_GROUP_IDS: Record<TossFullscreenSlot, string> = {
  interstitial: '',
  rewarded: '',
};

// v1 keeps fullscreen ads disabled while preserving the integration surface for later rollout.
export const TOSS_FULLSCREEN_ADS_ENABLED = TOSS_RUNTIME_ENV.enableFullscreenAds;

export const TOSS_AD_SLOT_META: Record<
  TossBannerSlot,
  { fixedHeight?: number; variant: 'expanded' | 'card' }
> = {
  home_banner_list: { fixedHeight: 96, variant: 'expanded' },
  today_banner_inline: { variant: 'card' },
  tarot_result_banner_list: { fixedHeight: 96, variant: 'expanded' },
};

export function resolveBannerAdGroupId(slot: TossBannerSlot): string {
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
