const DEFAULT_APP_NAME = 'fortune-suite';
const DEFAULT_ICON_URL = 'https://placehold.co/512x512/png?text=fortune-suite';

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

function isValidIconUrl(value) {
  return /^https:\/\/.+/i.test(value) && value !== DEFAULT_ICON_URL;
}

function collectIssues(strict) {
  const issues = [];
  const appName = readEnv('TOSS_APP_NAME', DEFAULT_APP_NAME);
  const displayName = readEnv('TOSS_BRAND_DISPLAY_NAME', '종합 운세');
  const primaryColor = readEnv('TOSS_BRAND_PRIMARY_COLOR', '#F7C948');
  const iconUrl = readEnv('TOSS_BRAND_ICON_URL', DEFAULT_ICON_URL);
  const fullscreenAds = readEnv('TOSS_ENABLE_FULLSCREEN_ADS', 'false').toLowerCase();
  const bannerIds = [
    ['TOSS_AD_HOME_BANNER_ID', readEnv('TOSS_AD_HOME_BANNER_ID')],
    ['TOSS_AD_TODAY_BANNER_ID', readEnv('TOSS_AD_TODAY_BANNER_ID')],
    ['TOSS_AD_TAROT_RESULT_BANNER_ID', readEnv('TOSS_AD_TAROT_RESULT_BANNER_ID')],
  ];

  if (!hasKebabCase(appName)) {
    issues.push('`TOSS_APP_NAME` 은 kebab-case 여야 합니다.');
  }

  if (!displayName) {
    issues.push('`TOSS_BRAND_DISPLAY_NAME` 이 비어 있습니다.');
  }

  if (!isHexColor(primaryColor)) {
    issues.push('`TOSS_BRAND_PRIMARY_COLOR` 은 `#RRGGBB` 형식이어야 합니다.');
  }

  if (strict && appName === DEFAULT_APP_NAME) {
    issues.push('릴리즈 전 `TOSS_APP_NAME` 을 토스 콘솔의 실제 앱 이름으로 교체해야 합니다.');
  }

  if (strict && !isValidIconUrl(iconUrl)) {
    issues.push('릴리즈 전 `TOSS_BRAND_ICON_URL` 을 콘솔 앱 정보의 실제 아이콘 URL로 교체해야 합니다.');
  }

  if (strict) {
    for (const [name, value] of bannerIds) {
      if (!value) {
        issues.push(`릴리즈 전 \`${name}\` 값을 실제 광고 그룹 ID로 채워야 합니다.`);
      }
    }
  }

  if (fullscreenAds !== 'false') {
    issues.push('v1 정책상 `TOSS_ENABLE_FULLSCREEN_ADS` 는 `false` 로 유지해야 합니다.');
  }

  return issues;
}

const strict = process.argv.includes('--strict');
const issues = collectIssues(strict);

if (issues.length === 0) {
  console.log(strict ? 'Toss release env validation passed.' : 'Toss env sanity check passed.');
  process.exit(0);
}

const header = strict
  ? 'Toss release env validation failed:'
  : 'Toss env sanity check found issues:';

console.error(header);
for (const issue of issues) {
  console.error(`- ${issue}`);
}

process.exit(strict ? 1 : 0);
