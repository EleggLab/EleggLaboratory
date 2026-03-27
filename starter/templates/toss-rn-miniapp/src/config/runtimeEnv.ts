import type { TossRuntimeEnv } from '../types/runtime';

function readString(name: string, fallback: string): string {
  const env = import.meta.env as Record<string, string | undefined>;
  const value = env[name]?.trim();
  return value && value.length > 0 ? value : fallback;
}

function readFirst(names: string[], fallback: string): string {
  for (const name of names) {
    const value = readString(name, '');
    if (value) {
      return value;
    }
  }

  return fallback;
}

function readBoolean(name: string, fallback: boolean): boolean {
  const value = readString(name, fallback ? 'true' : 'false').toLowerCase();
  return value === '1' || value === 'true' || value === 'yes' || value === 'on';
}

function resolveOperationalEnvironment(): TossRuntimeEnv['operationalEnvironment'] {
  try {
    const framework = require('@apps-in-toss/framework');
    const value = framework.getOperationalEnvironment?.();
    if (value === 'sandbox' || value === 'toss') {
      return value;
    }
  } catch {
    return 'unknown';
  }

  return 'unknown';
}

export const TOSS_RUNTIME_ENV: TossRuntimeEnv = {
  appName: readString('TOSS_APP_NAME', '{{PROJECT_NAME}}'),
  consoleAppName: readString('TOSS_CONSOLE_APP_NAME', '__SET_IN_CONSOLE__'),
  brandDisplayName: readString('TOSS_BRAND_DISPLAY_NAME', '__SET_DISPLAY_NAME__'),
  brandPrimaryColor: readString('TOSS_BRAND_PRIMARY_COLOR', '#3182F6'),
  brandIconUrl: readString(
    'TOSS_BRAND_ICON_URL',
    'https://placehold.co/600x600/png?text={{PROJECT_NAME}}',
  ),
  customerService: {
    email: readFirst(['TOSS_CUSTOMER_SERVICE_EMAIL', 'TOSS_SUPPORT_EMAIL'], ''),
    phone: readFirst(['TOSS_CUSTOMER_SERVICE_PHONE', 'TOSS_SUPPORT_PHONE'], ''),
    chatUrl: readFirst(['TOSS_CUSTOMER_SERVICE_CHAT_URL', 'TOSS_SUPPORT_CHAT_URL'], ''),
  },
  ads: {
    homeBannerId: readString('TOSS_AD_HOME_BANNER_ID', ''),
    homeFeedId: readString('TOSS_AD_HOME_FEED_ID', ''),
    supportBannerId: readString('TOSS_AD_SUPPORT_BANNER_ID', ''),
  },
  features: {
    analytics: readBoolean('TOSS_ENABLE_ANALYTICS', true),
    bannerAds: readBoolean('TOSS_ENABLE_BANNER_ADS', true),
    fullscreenAds: readBoolean('TOSS_ENABLE_FULLSCREEN_ADS', false),
    iap: readBoolean('TOSS_ENABLE_IAP', false),
    login: readBoolean('TOSS_ENABLE_LOGIN', false),
    marketing: readBoolean('TOSS_ENABLE_MARKETING', false),
    share: readBoolean('TOSS_ENABLE_SHARE', false),
  },
  operationalEnvironment: resolveOperationalEnvironment(),
};
