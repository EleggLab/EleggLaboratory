import fs from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = process.cwd();
const DEFAULT_APP_NAME = '{{PROJECT_NAME}}';
const DEFAULT_ICON_URL = 'https://placehold.co/600x600/png?text={{PROJECT_NAME}}';
const PLACEHOLDER_PREFIX = '__SET_';
const ASSET_MANIFEST_PATH = path.join(PROJECT_ROOT, 'assets', 'console', 'asset-manifest.json');

function readEnv(name, fallback = '') {
  const value = process.env[name];
  if (typeof value !== 'string') {
    return fallback;
  }
  return value.trim();
}

function readBoolean(name, fallback) {
  const value = readEnv(name, fallback ? 'true' : 'false').toLowerCase();
  return value === '1' || value === 'true' || value === 'yes' || value === 'on';
}

function isPlaceholder(value) {
  return !value || value.startsWith(PLACEHOLDER_PREFIX);
}

function hasKebabCase(value) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function isHexColor(value) {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

function isValidUrl(value) {
  return /^https:\/\/.+/i.test(value);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhone(value) {
  return /^[0-9+()\-\s]{7,}$/.test(value);
}

function isValidPngPath(filePath) {
  return typeof filePath === 'string' && filePath.toLowerCase().endsWith('.png');
}

function pathExists(filePath) {
  if (!filePath) {
    return false;
  }

  return fs.existsSync(path.resolve(PROJECT_ROOT, filePath));
}

function readAssetManifest() {
  try {
    return JSON.parse(fs.readFileSync(ASSET_MANIFEST_PATH, 'utf8'));
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'unknown error',
    };
  }
}

function validateAssets(manifest, issues) {
  if (!manifest || manifest.error) {
    issues.push('`assets/console/asset-manifest.json` could not be read.');
    return;
  }

  const {
    appLogoPath = '',
    thumbnailSquarePath = '',
    thumbnailLandscapePath = '',
    portraitScreenshotPaths = [],
    landscapeScreenshotPaths = [],
  } = manifest;

  const requiredSingles = [
    ['appLogoPath', appLogoPath],
    ['thumbnailSquarePath', thumbnailSquarePath],
    ['thumbnailLandscapePath', thumbnailLandscapePath],
  ];

  for (const [name, filePath] of requiredSingles) {
    if (!isValidPngPath(filePath)) {
      issues.push(`Asset manifest field \`${name}\` must point to a .png file.`);
      continue;
    }

    if (!pathExists(filePath)) {
      issues.push(`Asset manifest field \`${name}\` does not exist: ${filePath}`);
    }
  }

  const portraitValid = Array.isArray(portraitScreenshotPaths)
    && portraitScreenshotPaths.length >= 3
    && portraitScreenshotPaths.every((filePath) => isValidPngPath(filePath) && pathExists(filePath));

  const landscapeValid = Array.isArray(landscapeScreenshotPaths)
    && landscapeScreenshotPaths.length >= 1
    && landscapeScreenshotPaths.every((filePath) => isValidPngPath(filePath) && pathExists(filePath));

  if (!portraitValid && !landscapeValid) {
    issues.push(
      'Add either 3 valid portrait screenshots or 1 valid landscape screenshot in `assets/console/asset-manifest.json`.',
    );
  }
}

function collectIssues(strict) {
  const issues = [];
  const appName = readEnv('TOSS_APP_NAME', DEFAULT_APP_NAME);
  const consoleAppName = readEnv('TOSS_CONSOLE_APP_NAME', '__SET_IN_CONSOLE__');
  const displayName = readEnv('TOSS_BRAND_DISPLAY_NAME', '__SET_DISPLAY_NAME__');
  const primaryColor = readEnv('TOSS_BRAND_PRIMARY_COLOR', '#3182F6');
  const iconUrl = readEnv('TOSS_BRAND_ICON_URL', DEFAULT_ICON_URL);
  const bannerAdsEnabled = readBoolean('TOSS_ENABLE_BANNER_ADS', true);
  const fullscreenAdsEnabled = readBoolean('TOSS_ENABLE_FULLSCREEN_ADS', false);
  const customerServiceEmail = readEnv(
    'TOSS_CUSTOMER_SERVICE_EMAIL',
    readEnv('TOSS_SUPPORT_EMAIL', ''),
  );
  const customerServicePhone = readEnv(
    'TOSS_CUSTOMER_SERVICE_PHONE',
    readEnv('TOSS_SUPPORT_PHONE', ''),
  );
  const customerServiceChatUrl = readEnv(
    'TOSS_CUSTOMER_SERVICE_CHAT_URL',
    readEnv('TOSS_SUPPORT_CHAT_URL', ''),
  );

  const bannerIds = [
    ['TOSS_AD_HOME_BANNER_ID', readEnv('TOSS_AD_HOME_BANNER_ID')],
    ['TOSS_AD_HOME_FEED_ID', readEnv('TOSS_AD_HOME_FEED_ID')],
    ['TOSS_AD_SUPPORT_BANNER_ID', readEnv('TOSS_AD_SUPPORT_BANNER_ID')],
  ];

  if (!hasKebabCase(appName)) {
    issues.push('`TOSS_APP_NAME` must use kebab-case.');
  }

  if (!displayName || isPlaceholder(displayName)) {
    issues.push('`TOSS_BRAND_DISPLAY_NAME` must be filled.');
  }

  if (!isHexColor(primaryColor)) {
    issues.push('`TOSS_BRAND_PRIMARY_COLOR` must use the `#RRGGBB` format.');
  }

  if (strict && (isPlaceholder(consoleAppName) || consoleAppName === DEFAULT_APP_NAME)) {
    issues.push('`TOSS_CONSOLE_APP_NAME` must be set to the real console app name before release.');
  }

  if (strict && consoleAppName !== appName) {
    issues.push('`TOSS_CONSOLE_APP_NAME` must exactly match `TOSS_APP_NAME`.');
  }

  if (strict && (!isValidUrl(iconUrl) || iconUrl === DEFAULT_ICON_URL)) {
    issues.push('`TOSS_BRAND_ICON_URL` must point to the real Toss console icon URL.');
  }

  if (!isValidEmail(customerServiceEmail) || isPlaceholder(customerServiceEmail)) {
    issues.push('Customer service email is missing or invalid.');
  }

  if (!isValidPhone(customerServicePhone) || isPlaceholder(customerServicePhone)) {
    issues.push('Customer service phone is missing or invalid.');
  }

  if (!isValidUrl(customerServiceChatUrl) || isPlaceholder(customerServiceChatUrl)) {
    issues.push('Customer service chat URL is missing or invalid.');
  }

  if (fullscreenAdsEnabled) {
    issues.push('`TOSS_ENABLE_FULLSCREEN_ADS` must remain `false` in the shared starter baseline.');
  }

  if (strict && bannerAdsEnabled) {
    for (const [name, value] of bannerIds) {
      if (!value) {
        issues.push(`Fill \`${name}\` with the real production ad group ID before release.`);
      }
    }
  }

  if (strict) {
    validateAssets(readAssetManifest(), issues);
  }

  return issues;
}

const strict = process.argv.includes('--strict');
const issues = collectIssues(strict);

if (issues.length === 0) {
  console.log(strict ? 'Toss release env validation passed.' : 'Toss env sanity check passed.');
  process.exit(0);
}

console.error(strict ? 'Toss release env validation failed:' : 'Toss env sanity check found issues:');
for (const issue of issues) {
  console.error(`- ${issue}`);
}

process.exit(strict ? 1 : 0);
