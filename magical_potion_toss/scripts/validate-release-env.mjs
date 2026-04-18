import fs from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = process.cwd();
const ASSET_MANIFEST_PATH = path.join(PROJECT_ROOT, 'assets', 'console', 'asset-manifest.json');

function readEnv(name, fallback = '') {
  const value = process.env[name];
  if (typeof value !== 'string') {
    return fallback;
  }

  return value.trim();
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
  return filePath ? fs.existsSync(path.resolve(PROJECT_ROOT, filePath)) : false;
}

function readAssetManifest() {
  try {
    return JSON.parse(fs.readFileSync(ASSET_MANIFEST_PATH, 'utf8'));
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'unknown error' };
  }
}

function validateAssets(manifest, issues) {
  if (!manifest || manifest.error) {
    issues.push('`assets/console/asset-manifest.json` could not be read.');
    return;
  }

  const singles = [
    ['appLogoPath', manifest.appLogoPath],
    ['thumbnailSquarePath', manifest.thumbnailSquarePath],
    ['thumbnailLandscapePath', manifest.thumbnailLandscapePath],
  ];

  for (const [field, filePath] of singles) {
    if (!isValidPngPath(filePath)) {
      issues.push(`Asset manifest field \`${field}\` must point to a .png file.`);
      continue;
    }

    if (!pathExists(filePath)) {
      issues.push(`Asset manifest field \`${field}\` does not exist: ${filePath}`);
    }
  }

  const portraitPaths = Array.isArray(manifest.portraitScreenshotPaths)
    ? manifest.portraitScreenshotPaths
    : [];

  const validPortrait = portraitPaths.length >= 3
    && portraitPaths.every((filePath) => isValidPngPath(filePath) && pathExists(filePath));

  if (!validPortrait) {
    issues.push('Add 3 valid portrait screenshots in `assets/console/asset-manifest.json`.');
  }
}

function collectIssues(strict) {
  const issues = [];
  const appName = readEnv('TOSS_APP_NAME', 'magical-potion-shop');
  const consoleAppName = readEnv('TOSS_CONSOLE_APP_NAME', appName);
  const displayName = readEnv('TOSS_BRAND_DISPLAY_NAME', '마녀의 만병항아리');
  const primaryColor = readEnv('TOSS_BRAND_PRIMARY_COLOR', '#D47F39');
  const iconUrl = readEnv('TOSS_BRAND_ICON_URL', 'https://placehold.co/600x600/png?text=Potion+Cauldron');
  const customerServiceEmail = readEnv('TOSS_CUSTOMER_SERVICE_EMAIL', 'support@example.com');
  const customerServicePhone = readEnv('TOSS_CUSTOMER_SERVICE_PHONE', '+82-2-0000-0000');
  const customerServiceChatUrl = readEnv(
    'TOSS_CUSTOMER_SERVICE_CHAT_URL',
    'https://example.com/support',
  );

  if (!hasKebabCase(appName)) {
    issues.push('`TOSS_APP_NAME` must use kebab-case.');
  }

  if (!displayName) {
    issues.push('`TOSS_BRAND_DISPLAY_NAME` must be filled.');
  }

  if (!isHexColor(primaryColor)) {
    issues.push('`TOSS_BRAND_PRIMARY_COLOR` must use the `#RRGGBB` format.');
  }

  if (consoleAppName !== appName) {
    issues.push('`TOSS_CONSOLE_APP_NAME` must exactly match `TOSS_APP_NAME`.');
  }

  if (!isValidUrl(iconUrl)) {
    issues.push('`TOSS_BRAND_ICON_URL` must use an `https://` URL.');
  }

  if (!isValidEmail(customerServiceEmail)) {
    issues.push('Customer service email is missing or invalid.');
  }

  if (!isValidPhone(customerServicePhone)) {
    issues.push('Customer service phone is missing or invalid.');
  }

  if (!isValidUrl(customerServiceChatUrl)) {
    issues.push('Customer service chat URL is missing or invalid.');
  }

  if (strict) {
    validateAssets(readAssetManifest(), issues);
  }

  return issues;
}

const strict = process.argv.includes('--strict');
const issues = collectIssues(strict);

if (issues.length === 0) {
  console.log(strict ? 'Magical Potion Toss release env validation passed.' : 'Magical Potion Toss env sanity check passed.');
  process.exit(0);
}

console.error(strict ? 'Magical Potion Toss release env validation failed:' : 'Magical Potion Toss env sanity check found issues:');
for (const issue of issues) {
  console.error(`- ${issue}`);
}

process.exit(1);
