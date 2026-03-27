interface ImportMetaEnv {
  readonly TOSS_APP_NAME?: string;
  readonly TOSS_CONSOLE_APP_NAME?: string;
  readonly TOSS_BRAND_DISPLAY_NAME?: string;
  readonly TOSS_BRAND_PRIMARY_COLOR?: string;
  readonly TOSS_BRAND_ICON_URL?: string;
  readonly TOSS_AD_HOME_BANNER_ID?: string;
  readonly TOSS_AD_HOME_FEED_ID?: string;
  readonly TOSS_AD_SUPPORT_BANNER_ID?: string;
  readonly TOSS_ENABLE_BANNER_ADS?: string;
  readonly TOSS_ENABLE_FULLSCREEN_ADS?: string;
  readonly TOSS_ENABLE_LOGIN?: string;
  readonly TOSS_ENABLE_IAP?: string;
  readonly TOSS_ENABLE_SHARE?: string;
  readonly TOSS_ENABLE_MARKETING?: string;
  readonly TOSS_ENABLE_ANALYTICS?: string;
  readonly TOSS_CUSTOMER_SERVICE_EMAIL?: string;
  readonly TOSS_CUSTOMER_SERVICE_PHONE?: string;
  readonly TOSS_CUSTOMER_SERVICE_CHAT_URL?: string;
  readonly TOSS_SUPPORT_EMAIL?: string;
  readonly TOSS_SUPPORT_PHONE?: string;
  readonly TOSS_SUPPORT_CHAT_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
