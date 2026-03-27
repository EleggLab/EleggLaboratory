const { appsInToss } = require('@apps-in-toss/framework/plugins');
const { env } = require('@granite-js/plugin-env');
const { router } = require('@granite-js/plugin-router');
const { defineConfig } = require('react-native-bedrock/config');

function readEnv(name, fallback) {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : fallback;
}

const runtimeEnv = {
  TOSS_APP_NAME: readEnv('TOSS_APP_NAME', 'fortune-suite'),
  TOSS_BRAND_DISPLAY_NAME: readEnv('TOSS_BRAND_DISPLAY_NAME', '종합 운세'),
  TOSS_BRAND_PRIMARY_COLOR: readEnv('TOSS_BRAND_PRIMARY_COLOR', '#F7C948'),
  TOSS_BRAND_ICON_URL: readEnv(
    'TOSS_BRAND_ICON_URL',
    'https://placehold.co/512x512/png?text=fortune-suite',
  ),
  TOSS_ENABLE_BANNER_ADS: readEnv('TOSS_ENABLE_BANNER_ADS', 'false'),
  TOSS_AD_HOME_BANNER_ID: readEnv('TOSS_AD_HOME_BANNER_ID', ''),
  TOSS_AD_TODAY_BANNER_ID: readEnv('TOSS_AD_TODAY_BANNER_ID', ''),
  TOSS_AD_TAROT_RESULT_BANNER_ID: readEnv('TOSS_AD_TAROT_RESULT_BANNER_ID', ''),
  TOSS_ENABLE_FULLSCREEN_ADS: readEnv('TOSS_ENABLE_FULLSCREEN_ADS', 'false'),
};

module.exports = defineConfig({
  appName: runtimeEnv.TOSS_APP_NAME,
  plugins: [
    ...appsInToss({
      brand: {
        displayName: runtimeEnv.TOSS_BRAND_DISPLAY_NAME,
        primaryColor: runtimeEnv.TOSS_BRAND_PRIMARY_COLOR,
        icon: runtimeEnv.TOSS_BRAND_ICON_URL,
      },
      permissions: [],
    }),
    router(),
    env(runtimeEnv),
  ],
});
