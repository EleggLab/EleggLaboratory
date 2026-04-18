import fs from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = process.cwd();
const DEFAULT_APP_NAME = 'set-real-app-name';
const DEFAULT_ICON_URL = 'https://placehold.co/512x512/png?text=astra';
const PLACEHOLDER_PREFIX = '__SET_';
const ASSET_MANIFEST_PATH = path.join(PROJECT_ROOT, 'assets', 'console', 'asset-manifest.json');
const BOOLEAN_LITERALS = new Set(['true', 'false', '1', '0', 'yes', 'no', 'on', 'off']);

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

function isPlaceholder(value) {
  return !value || value.startsWith(PLACEHOLDER_PREFIX);
}

function isValidPngPath(filePath) {
  return typeof filePath === 'string' && filePath.toLowerCase().endsWith('.png');
}

function fileExists(filePath) {
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

function readPngSize(filePath) {
  const buffer = fs.readFileSync(filePath);
  const pngSignature = '89504e470d0a1a0a';
  if (buffer.length < 24 || buffer.subarray(0, 8).toString('hex') !== pngSignature) {
    throw new Error('not a valid PNG file');
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function validatePngAsset(issues, label, filePath, expectedWidth, expectedHeight) {
  if (!isValidPngPath(filePath)) {
    issues.push(`Asset manifest field \`${label}\` must point to a .png file.`);
    return;
  }

  const absolutePath = path.resolve(PROJECT_ROOT, filePath);
  if (!fs.existsSync(absolutePath)) {
    issues.push(`Asset manifest field \`${label}\` does not exist: ${filePath}`);
    return;
  }

  try {
    const { width, height } = readPngSize(absolutePath);
    if (width !== expectedWidth || height !== expectedHeight) {
      issues.push(`Asset \`${label}\` must be ${expectedWidth}x${expectedHeight}, got ${width}x${height}.`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    issues.push(`Asset \`${label}\` could not be read as PNG: ${message}`);
  }
}

function validateAssets(issues) {
  const manifest = readAssetManifest();
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

  validatePngAsset(issues, 'appLogoPath', appLogoPath, 600, 600);
  validatePngAsset(issues, 'thumbnailSquarePath', thumbnailSquarePath, 1000, 1000);
  validatePngAsset(issues, 'thumbnailLandscapePath', thumbnailLandscapePath, 1932, 828);

  const portraitValid = Array.isArray(portraitScreenshotPaths)
    && portraitScreenshotPaths.length >= 3
    && portraitScreenshotPaths.every((filePath) => {
      if (!fileExists(filePath)) {
        return false;
      }
      const { width, height } = readPngSize(path.resolve(PROJECT_ROOT, filePath));
      return width === 636 && height === 1048;
    });

  const landscapeValid = Array.isArray(landscapeScreenshotPaths)
    && landscapeScreenshotPaths.length >= 1
    && landscapeScreenshotPaths.every((filePath) => {
      if (!fileExists(filePath)) {
        return false;
      }
      const { width, height } = readPngSize(path.resolve(PROJECT_ROOT, filePath));
      return width === 1504 && height === 741;
    });

  if (!portraitValid && !landscapeValid) {
    issues.push(
      'Add either 3 portrait screenshots at 636x1048 or 1+ landscape screenshots at 1504x741 in `assets/console/asset-manifest.json`.',
    );
  }
}

function collectIssues(strict) {
  const issues = [];
  const appName = readEnv('TOSS_APP_NAME', DEFAULT_APP_NAME);
  const consoleAppName = readEnv('TOSS_CONSOLE_APP_NAME', `${PLACEHOLDER_PREFIX}CONSOLE_APP_NAME__`);
  const displayName = readEnv('TOSS_BRAND_DISPLAY_NAME', '종합 운세');
  const primaryColor = readEnv('TOSS_BRAND_PRIMARY_COLOR', '#F7C948');
  const iconUrl = readEnv('TOSS_BRAND_ICON_URL', DEFAULT_ICON_URL);
  const bannerAdsLiteral = readEnv('TOSS_ENABLE_BANNER_ADS', 'false').toLowerCase();
  const fullscreenAdsLiteral = readEnv('TOSS_ENABLE_FULLSCREEN_ADS', 'false').toLowerCase();
  const bannerAdsEnabled = readBoolean('TOSS_ENABLE_BANNER_ADS', false);
  const fullscreenAdsEnabled = readBoolean('TOSS_ENABLE_FULLSCREEN_ADS', false);
  const customerServiceEmail = readEnv('TOSS_CUSTOMER_SERVICE_EMAIL', readEnv('TOSS_SUPPORT_EMAIL', ''));
  const customerServicePhone = readEnv('TOSS_CUSTOMER_SERVICE_PHONE', readEnv('TOSS_SUPPORT_PHONE', ''));
  const customerServiceChatUrl = readEnv(
    'TOSS_CUSTOMER_SERVICE_CHAT_URL',
    readEnv('TOSS_SUPPORT_CHAT_URL', ''),
  );
  const bannerIds = [
    ['TOSS_AD_HOME_BANNER_ID', readEnv('TOSS_AD_HOME_BANNER_ID')],
    ['TOSS_AD_TODAY_BANNER_ID', readEnv('TOSS_AD_TODAY_BANNER_ID')],
    ['TOSS_AD_TAROT_RESULT_BANNER_ID', readEnv('TOSS_AD_TAROT_RESULT_BANNER_ID')],
  ];

  if (!hasKebabCase(appName)) {
    issues.push('`TOSS_APP_NAME` must be kebab-case.');
  }

  if (!displayName || isPlaceholder(displayName)) {
    issues.push('`TOSS_BRAND_DISPLAY_NAME` must be filled.');
  }

  if (!isHexColor(primaryColor)) {
    issues.push('`TOSS_BRAND_PRIMARY_COLOR` must use `#RRGGBB` format.');
  }

  if (!BOOLEAN_LITERALS.has(bannerAdsLiteral)) {
    issues.push('`TOSS_ENABLE_BANNER_ADS` must be a boolean-like value.');
  }

  if (!BOOLEAN_LITERALS.has(fullscreenAdsLiteral)) {
    issues.push('`TOSS_ENABLE_FULLSCREEN_ADS` must be a boolean-like value.');
  }

  if (strict && appName === DEFAULT_APP_NAME) {
    issues.push('Release builds must replace `TOSS_APP_NAME` with the real Toss console app name.');
  }

  if (strict && (isPlaceholder(consoleAppName) || consoleAppName !== appName)) {
    issues.push('`TOSS_CONSOLE_APP_NAME` must exactly match the real Toss console app name and `TOSS_APP_NAME`.');
  }

  if (strict && (!isValidUrl(iconUrl) || iconUrl === DEFAULT_ICON_URL)) {
    issues.push('Release builds must replace `TOSS_BRAND_ICON_URL` with the real Toss console icon URL.');
  }

  if (strict && (!isValidEmail(customerServiceEmail) || isPlaceholder(customerServiceEmail))) {
    issues.push('Customer service email is missing or invalid.');
  }

  if (strict && (!isValidPhone(customerServicePhone) || isPlaceholder(customerServicePhone))) {
    issues.push('Customer service phone is missing or invalid.');
  }

  if (strict && (!isValidUrl(customerServiceChatUrl) || isPlaceholder(customerServiceChatUrl))) {
    issues.push('Customer service chat URL is missing or invalid.');
  }

  if (strict && bannerAdsEnabled) {
    for (const [name, value] of bannerIds) {
      if (!value) {
        issues.push(`Release builds with banner ads enabled must set \`${name}\`.`);
      }
    }
  }

  if (fullscreenAdsEnabled) {
    issues.push('v1 policy keeps `TOSS_ENABLE_FULLSCREEN_ADS` set to `false`.');
  }

  if (strict) {
    validateAssets(issues);
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
