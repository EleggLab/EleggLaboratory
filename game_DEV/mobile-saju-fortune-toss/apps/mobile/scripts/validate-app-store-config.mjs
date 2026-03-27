import fs from 'node:fs';
import path from 'node:path';

const appDir = process.cwd();
const appJsonPath = path.join(appDir, 'app.json');
const easJsonPath = path.join(appDir, 'eas.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function fileExists(relativePath) {
  return fs.existsSync(path.join(appDir, relativePath));
}

const appJson = readJson(appJsonPath);
const easJson = readJson(easJsonPath);
const expo = appJson.expo ?? {};
const ios = expo.ios ?? {};

const errors = [];
const warnings = [];

if (!expo.name || typeof expo.name !== 'string') {
  errors.push('`expo.name` 이 비어 있습니다.');
}

if (!expo.slug || typeof expo.slug !== 'string') {
  errors.push('`expo.slug` 이 비어 있습니다.');
}

if (!expo.version || typeof expo.version !== 'string') {
  errors.push('`expo.version` 이 비어 있습니다.');
}

if (!ios.bundleIdentifier || typeof ios.bundleIdentifier !== 'string') {
  errors.push('`expo.ios.bundleIdentifier` 이 필요합니다.');
}

if (!ios.buildNumber || typeof ios.buildNumber !== 'string') {
  errors.push('`expo.ios.buildNumber` 이 필요합니다.');
}

if (ios.config?.usesNonExemptEncryption !== false) {
  errors.push('`expo.ios.config.usesNonExemptEncryption` 을 `false` 로 명시해 주세요.');
}

for (const assetPath of [expo.icon, ios.icon, expo.splash?.image].filter(Boolean)) {
  if (!fileExists(assetPath)) {
    errors.push(`필수 에셋 파일이 없습니다: ${assetPath}`);
  }
}

if (!easJson.build?.production) {
  errors.push('`eas.json` 에 `build.production` 프로필이 필요합니다.');
}

if (!easJson.submit?.production) {
  errors.push('`eas.json` 에 `submit.production` 프로필이 필요합니다.');
}

if (!expo.extra?.eas?.projectId) {
  warnings.push('`expo.extra.eas.projectId` 가 없습니다. 첫 EAS 연결 시 설정이 필요할 수 있습니다.');
}

if (!easJson.submit?.production?.ios?.ascAppId) {
  warnings.push('`eas.json` 의 `submit.production.ios.ascAppId` 가 없습니다. 자동 제출 전에 채워 주세요.');
}

if (errors.length > 0) {
  console.error('App Store release config validation failed:');
  for (const issue of errors) {
    console.error(`- ${issue}`);
  }
  if (warnings.length > 0) {
    console.error('Warnings:');
    for (const issue of warnings) {
      console.error(`- ${issue}`);
    }
  }
  process.exit(1);
}

if (warnings.length > 0) {
  console.warn('App Store release config validation passed with warnings:');
  for (const issue of warnings) {
    console.warn(`- ${issue}`);
  }
} else {
  console.log('App Store release config validation passed.');
}
