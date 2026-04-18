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
  appName: readString('TOSS_APP_NAME', 'astra'),
  brandDisplayName: readString('TOSS_BRAND_DISPLAY_NAME', 'Astra: Fortune'),
  brandPrimaryColor: readString('TOSS_BRAND_PRIMARY_COLOR', '#F7C948'),
  brandIconUrl: readString(
    'TOSS_BRAND_ICON_URL',
    'https://raw.githubusercontent.com/EleggLab/EleggLaboratory/main/game_DEV/mobile-saju-fortune-toss/apps/mobile/assets/app-icon.png',
  ),
  enableBannerAds: readBoolean('TOSS_ENABLE_BANNER_ADS', false),
  ads: {
    homeBannerId: readString('TOSS_AD_HOME_BANNER_ID', ''),
    todayBannerId: readString('TOSS_AD_TODAY_BANNER_ID', ''),
    tarotResultBannerId: readString('TOSS_AD_TAROT_RESULT_BANNER_ID', ''),
  },
  enableFullscreenAds: readBoolean('TOSS_ENABLE_FULLSCREEN_ADS', false),
} as const;
