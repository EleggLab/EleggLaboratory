import { appsInToss } from '@apps-in-toss/framework/plugins';
import { env } from '@granite-js/plugin-env';
import { defineConfig } from '@granite-js/react-native/config';

function readEnv(name: string, fallback: string): string {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : fallback;
}

const runtimeEnv = {
  TOSS_APP_NAME: readEnv('TOSS_APP_NAME', '{{PROJECT_NAME}}'),
  TOSS_CONSOLE_APP_NAME: readEnv('TOSS_CONSOLE_APP_NAME', '__SET_IN_CONSOLE__'),
  TOSS_BRAND_DISPLAY_NAME: readEnv('TOSS_BRAND_DISPLAY_NAME', '__SET_DISPLAY_NAME__'),
  TOSS_BRAND_PRIMARY_COLOR: readEnv('TOSS_BRAND_PRIMARY_COLOR', '#3182F6'),
  TOSS_BRAND_ICON_URL: readEnv(
    'TOSS_BRAND_ICON_URL',
    'https://placehold.co/600x600/png?text={{PROJECT_NAME}}',
  ),
  TOSS_AD_HOME_BANNER_ID: readEnv('TOSS_AD_HOME_BANNER_ID', ''),
  TOSS_AD_HOME_FEED_ID: readEnv('TOSS_AD_HOME_FEED_ID', ''),
  TOSS_AD_SUPPORT_BANNER_ID: readEnv('TOSS_AD_SUPPORT_BANNER_ID', ''),
  TOSS_ENABLE_BANNER_ADS: readEnv('TOSS_ENABLE_BANNER_ADS', 'true'),
  TOSS_ENABLE_FULLSCREEN_ADS: readEnv('TOSS_ENABLE_FULLSCREEN_ADS', 'false'),
  TOSS_ENABLE_LOGIN: readEnv('TOSS_ENABLE_LOGIN', 'false'),
  TOSS_ENABLE_IAP: readEnv('TOSS_ENABLE_IAP', 'false'),
  TOSS_ENABLE_SHARE: readEnv('TOSS_ENABLE_SHARE', 'false'),
  TOSS_ENABLE_MARKETING: readEnv('TOSS_ENABLE_MARKETING', 'false'),
  TOSS_ENABLE_ANALYTICS: readEnv('TOSS_ENABLE_ANALYTICS', 'true'),
  TOSS_CUSTOMER_SERVICE_EMAIL: readEnv(
    'TOSS_CUSTOMER_SERVICE_EMAIL',
    '__SET_CUSTOMER_SERVICE_EMAIL__',
  ),
  TOSS_CUSTOMER_SERVICE_PHONE: readEnv(
    'TOSS_CUSTOMER_SERVICE_PHONE',
    '__SET_CUSTOMER_SERVICE_PHONE__',
  ),
  TOSS_CUSTOMER_SERVICE_CHAT_URL: readEnv(
    'TOSS_CUSTOMER_SERVICE_CHAT_URL',
    '__SET_CUSTOMER_SERVICE_CHAT_URL__',
  ),
  TOSS_SUPPORT_EMAIL: readEnv('TOSS_SUPPORT_EMAIL', ''),
  TOSS_SUPPORT_PHONE: readEnv('TOSS_SUPPORT_PHONE', ''),
  TOSS_SUPPORT_CHAT_URL: readEnv('TOSS_SUPPORT_CHAT_URL', ''),
};

export default defineConfig({
  scheme: 'intoss',
  appName: runtimeEnv.TOSS_APP_NAME,
  plugins: [
    appsInToss({
      brand: {
        displayName: runtimeEnv.TOSS_BRAND_DISPLAY_NAME,
        primaryColor: runtimeEnv.TOSS_BRAND_PRIMARY_COLOR,
        icon: runtimeEnv.TOSS_BRAND_ICON_URL,
      },
      permissions: [],
    }),
    env(runtimeEnv),
  ],
});
