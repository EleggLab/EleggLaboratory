import { appsInToss } from '@apps-in-toss/framework/plugins';
import { env } from '@granite-js/plugin-env';
import { defineConfig } from '@granite-js/react-native/config';

function readEnv(name: string, fallback: string): string {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : fallback;
}

const runtimeEnv = {
  TOSS_APP_NAME: readEnv('TOSS_APP_NAME', 'fortune-suite'),
  TOSS_BRAND_DISPLAY_NAME: readEnv('TOSS_BRAND_DISPLAY_NAME', '종합 운세'),
  TOSS_BRAND_PRIMARY_COLOR: readEnv('TOSS_BRAND_PRIMARY_COLOR', '#F7C948'),
  TOSS_BRAND_ICON_URL: readEnv('TOSS_BRAND_ICON_URL', 'https://placehold.co/512x512/png?text=fortune-suite'),
  TOSS_AD_HOME_BANNER_ID: readEnv('TOSS_AD_HOME_BANNER_ID', ''),
  TOSS_AD_TODAY_BANNER_ID: readEnv('TOSS_AD_TODAY_BANNER_ID', ''),
  TOSS_AD_TAROT_RESULT_BANNER_ID: readEnv('TOSS_AD_TAROT_RESULT_BANNER_ID', ''),
  TOSS_ENABLE_FULLSCREEN_ADS: readEnv('TOSS_ENABLE_FULLSCREEN_ADS', 'false'),
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
