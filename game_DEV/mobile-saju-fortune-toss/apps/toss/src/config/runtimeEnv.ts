function readString(name: string, fallback: string): string {
  const env = import.meta.env as Record<string, string | undefined>;
  const value = env[name]?.trim();
  return value && value.length > 0 ? value : fallback;
}

function readBoolean(name: string, fallback: boolean): boolean {
  const value = readString(name, fallback ? 'true' : 'false').toLowerCase();
  return value === '1' || value === 'true' || value === 'yes' || value === 'on';
}

export const TOSS_RUNTIME_ENV = {
  appName: readString('TOSS_APP_NAME', 'fortune-suite'),
  brandDisplayName: readString('TOSS_BRAND_DISPLAY_NAME', '종합 운세'),
  brandPrimaryColor: readString('TOSS_BRAND_PRIMARY_COLOR', '#F7C948'),
  brandIconUrl: readString('TOSS_BRAND_ICON_URL', 'https://placehold.co/512x512/png?text=fortune-suite'),
  enableBannerAds: readBoolean('TOSS_ENABLE_BANNER_ADS', false),
  ads: {
    homeBannerId: readString('TOSS_AD_HOME_BANNER_ID', ''),
    todayBannerId: readString('TOSS_AD_TODAY_BANNER_ID', ''),
    tarotResultBannerId: readString('TOSS_AD_TAROT_RESULT_BANNER_ID', ''),
  },
  enableFullscreenAds: readBoolean('TOSS_ENABLE_FULLSCREEN_ADS', false),
} as const;
