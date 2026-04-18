const path = require('path');
const { appsInToss } = require('@apps-in-toss/plugins');
const { env } = require('@granite-js/plugin-env');
const { router } = require('@granite-js/plugin-router');
const { defineConfig } = require('react-native-bedrock/config');

const appRoot = __dirname;
const workspaceRoot = path.resolve(__dirname, '..', '..');

function readEnv(name, fallback) {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : fallback;
}

const runtimeEnv = {
  TOSS_APP_NAME: readEnv('TOSS_APP_NAME', 'astra'),
  TOSS_BRAND_DISPLAY_NAME: readEnv('TOSS_BRAND_DISPLAY_NAME', '아스트라: 오늘의 운세'),
  TOSS_BRAND_PRIMARY_COLOR: readEnv('TOSS_BRAND_PRIMARY_COLOR', '#F7C948'),
  TOSS_BRAND_ICON_URL: readEnv(
    'TOSS_BRAND_ICON_URL',
    'https://raw.githubusercontent.com/EleggLab/EleggLaboratory/main/game_DEV/mobile-saju-fortune-toss/apps/mobile/assets/app-icon.png',
  ),
  TOSS_ENABLE_BANNER_ADS: readEnv('TOSS_ENABLE_BANNER_ADS', 'false'),
  TOSS_AD_HOME_BANNER_ID: readEnv('TOSS_AD_HOME_BANNER_ID', ''),
  TOSS_AD_TODAY_BANNER_ID: readEnv('TOSS_AD_TODAY_BANNER_ID', ''),
  TOSS_AD_TAROT_RESULT_BANNER_ID: readEnv('TOSS_AD_TAROT_RESULT_BANNER_ID', ''),
  TOSS_ENABLE_FULLSCREEN_ADS: readEnv('TOSS_ENABLE_FULLSCREEN_ADS', 'false'),
};

module.exports = defineConfig({
  scheme: 'intoss',
  appName: runtimeEnv.TOSS_APP_NAME,
  cwd: appRoot,
  entryFile: './index.ts',
  metro: {
    watchFolders: [path.resolve(workspaceRoot, 'node_modules')],
    resetCache: true,
    resolver: {
      unstable_enableSymlinks: true,
      nodeModulesPaths: [path.resolve(appRoot, 'node_modules'), path.resolve(workspaceRoot, 'node_modules')],
    },
  },
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
