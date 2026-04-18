import { defineConfig } from '@apps-in-toss/web-framework/config';

function readEnv(name: string, fallback: string): string {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : fallback;
}

const runtimeEnv = {
  TOSS_APP_NAME: readEnv('TOSS_APP_NAME', 'magical-potion-shop'),
  TOSS_CONSOLE_APP_NAME: readEnv('TOSS_CONSOLE_APP_NAME', 'magical-potion-shop'),
  TOSS_BRAND_DISPLAY_NAME: readEnv('TOSS_BRAND_DISPLAY_NAME', '마녀의 만병항아리'),
  TOSS_BRAND_PRIMARY_COLOR: readEnv('TOSS_BRAND_PRIMARY_COLOR', '#D47F39'),
  TOSS_BRAND_ICON_URL: readEnv(
    'TOSS_BRAND_ICON_URL',
    'https://placehold.co/600x600/png?text=Potion+Cauldron',
  ),
};

export default defineConfig({
  appName: runtimeEnv.TOSS_APP_NAME,
  brand: {
    displayName: runtimeEnv.TOSS_BRAND_DISPLAY_NAME,
    primaryColor: runtimeEnv.TOSS_BRAND_PRIMARY_COLOR,
    icon: runtimeEnv.TOSS_BRAND_ICON_URL,
  },
  web: {
    host: 'localhost',
    port: 5173,
    commands: {
      dev: 'vite --host',
      build: 'vite build',
    },
  },
  permissions: [],
  outdir: 'dist',
  webViewProps: {
    type: 'game',
  },
});
