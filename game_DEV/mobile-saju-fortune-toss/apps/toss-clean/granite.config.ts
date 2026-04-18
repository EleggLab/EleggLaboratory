import path from 'node:path';
// @ts-nocheck
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@granite-js/react-native/config';
import { appsInToss } from '@apps-in-toss/framework/plugins';

const appDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(appDir, '..', '..');
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const mobilePreviewTmpRoot = path.join(workspaceRoot, 'tmp', 'mobile-preview-androidstudio');
const nestedLegacyProjectRoot = path.join(workspaceRoot, 'mobile-saju-fortune', 'mobile-saju-fortune');

export default defineConfig({
  scheme: 'intoss',
  appName: 'astra',
  metro: {
    projectRoot: workspaceRoot,
    watchFolders: [workspaceRoot],
    resolver: {
      nodeModulesPaths: [
        path.join(workspaceRoot, 'node_modules'),
        path.join(appDir, 'node_modules'),
      ],
      blockList: [
        new RegExp(`^${escapeRegExp(mobilePreviewTmpRoot)}(?:[/\\\\].*)?$`),
        new RegExp(`^${escapeRegExp(nestedLegacyProjectRoot)}(?:[/\\\\].*)?$`),
      ],
    },
  },
  plugins: [
    appsInToss({
      target: '0.84.0',
      brand: {
        displayName: '아스트라: 오늘의 운세',
        primaryColor: '#F7C948',
        icon: 'https://raw.githubusercontent.com/EleggLab/EleggLaboratory/main/game_DEV/mobile-saju-fortune-toss/apps/toss/assets/console/app-logo.png',
      },
      permissions: [],
    }),
  ],
});
