import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const scriptPath = fileURLToPath(import.meta.url);
const STARTER_ROOT = path.resolve(path.dirname(scriptPath), '..');
const APP_NAME = 'toss-smoke-app';
const WITH_BUILD = process.argv.includes('--with-build');
const KEEP_TEMP = process.argv.includes('--keep-temp');
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'toss-rn-starter-'));
const projectRoot = path.join(tempRoot, APP_NAME);
const cacheRoot = path.join(tempRoot, '.cache');
const baseEnv = {
  ...process.env,
  PNPM_HOME: path.join(cacheRoot, 'pnpm-home'),
  pnpm_config_store_dir: path.join(cacheRoot, 'pnpm-store'),
  npm_config_cache: path.join(cacheRoot, 'npm-cache'),
};

function cleanup() {
  if (!KEEP_TEMP && fs.existsSync(tempRoot)) {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

function run(command, args, options = {}) {
  const stdio = options.expectFailure ? 'pipe' : options.stdio ?? 'inherit';
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? STARTER_ROOT,
    env: options.env ?? baseEnv,
    stdio,
    shell: process.platform === 'win32',
  });

  if (options.expectFailure) {
    if (result.status === 0) {
      throw new Error(`${command} ${args.join(' ')} was expected to fail but passed`);
    }
    console.log(`${command} ${args.join(' ')} failed as expected.`);
    return result;
  }

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status ?? 1}`);
  }

  return result;
}

function writeTinyPng(relativePath) {
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aYV0AAAAASUVORK5CYII=';
  const outputPath = path.join(projectRoot, relativePath);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, Buffer.from(pngBase64, 'base64'));
}

function createConsoleAssets() {
  [
    'assets/console/app-logo.png',
    'assets/console/thumbnail-square.png',
    'assets/console/thumbnail-landscape.png',
    'assets/console/screenshot-portrait-1.png',
    'assets/console/screenshot-portrait-2.png',
    'assets/console/screenshot-portrait-3.png',
  ].forEach(writeTinyPng);
}

function getReleaseEnv() {
  return {
    ...baseEnv,
    TOSS_APP_NAME: APP_NAME,
    TOSS_CONSOLE_APP_NAME: APP_NAME,
    TOSS_BRAND_DISPLAY_NAME: 'Toss Smoke App',
    TOSS_BRAND_PRIMARY_COLOR: '#3182F6',
    TOSS_BRAND_ICON_URL: 'https://example.com/toss-smoke-app.png',
    TOSS_AD_HOME_BANNER_ID: 'prod-home-banner-id',
    TOSS_AD_HOME_FEED_ID: 'prod-home-feed-id',
    TOSS_AD_SUPPORT_BANNER_ID: 'prod-support-banner-id',
    TOSS_ENABLE_BANNER_ADS: 'true',
    TOSS_ENABLE_FULLSCREEN_ADS: 'false',
    TOSS_CUSTOMER_SERVICE_EMAIL: 'support@example.com',
    TOSS_CUSTOMER_SERVICE_PHONE: '+82 2-1234-5678',
    TOSS_CUSTOMER_SERVICE_CHAT_URL: 'https://example.com/support',
  };
}

try {
  run('node', ['scripts/vibe-starter.js', 'init', 'toss-rn-miniapp', APP_NAME, projectRoot]);

  fs.mkdirSync(baseEnv.PNPM_HOME, { recursive: true });
  fs.mkdirSync(baseEnv.pnpm_config_store_dir, { recursive: true });
  fs.mkdirSync(baseEnv.npm_config_cache, { recursive: true });

  run('corepack', ['pnpm', 'install', '--reporter', 'append-only'], { cwd: projectRoot });
  run('corepack', ['pnpm', 'run', 'typecheck'], { cwd: projectRoot });
  run('corepack', ['pnpm', 'run', 'validate:release-env'], {
    cwd: projectRoot,
    expectFailure: true,
  });

  createConsoleAssets();
  const releaseEnv = getReleaseEnv();
  run('corepack', ['pnpm', 'run', 'validate:release-env'], {
    cwd: projectRoot,
    env: releaseEnv,
  });

  if (WITH_BUILD) {
    run('corepack', ['pnpm', 'run', 'build'], {
      cwd: projectRoot,
      env: releaseEnv,
    });
  }

  console.log(`toss-rn-miniapp smoke test passed${WITH_BUILD ? ' with build' : ''}.`);
} catch (error) {
  cleanup();
  throw error;
}

cleanup();
