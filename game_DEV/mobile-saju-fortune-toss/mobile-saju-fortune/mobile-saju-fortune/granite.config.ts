import { appsInToss } from '@apps-in-toss/framework/plugins';
import { router } from '@granite-js/plugin-router';
import { defineConfig } from '@granite-js/react-native/config';

const config: ReturnType<typeof defineConfig> = defineConfig({
  scheme: 'intoss',
  appName: 'saju-fortune',
  plugins: [
    ...appsInToss({
      brand: {
        displayName: '사주포춘',
        primaryColor: '#f7c948',
        icon: '',
      },
      permissions: [],
    }),
    router(),
  ],
});

export default config;
