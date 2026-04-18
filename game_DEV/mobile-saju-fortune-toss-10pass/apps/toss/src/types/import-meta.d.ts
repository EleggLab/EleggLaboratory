interface ImportMetaEnv {
  readonly TOSS_APP_NAME?: string;
  readonly TOSS_BRAND_DISPLAY_NAME?: string;
  readonly TOSS_BRAND_PRIMARY_COLOR?: string;
  readonly TOSS_BRAND_ICON_URL?: string;
  readonly TOSS_AD_HOME_BANNER_ID?: string;
  readonly TOSS_AD_TODAY_BANNER_ID?: string;
  readonly TOSS_AD_TAROT_RESULT_BANNER_ID?: string;
  readonly TOSS_ENABLE_FULLSCREEN_ADS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
