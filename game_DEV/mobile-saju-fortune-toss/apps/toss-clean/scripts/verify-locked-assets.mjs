import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const appDir = resolve(import.meta.dirname, '..');
const WESTERN_KEYS = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces',
];
const CHINESE_KEYS = [
  'rat',
  'ox',
  'tiger',
  'rabbit',
  'dragon',
  'snake',
  'horse',
  'goat',
  'monkey',
  'rooster',
  'dog',
  'pig',
];
const tigerPath = resolve(appDir, 'assets', 'user-provided', 'today', 'tiger-icon.png');
const tigerIconCopyPath = resolve(appDir, 'assets', 'icons', 'zodiac', 'chinese', 'tiger.png');
const tigerDetailCopyPath = resolve(appDir, 'assets', 'zodiac', 'chinese', 'tiger.png');
const tigerDetailSourcePath = resolve(
  appDir,
  '..',
  '..',
  '..',
  'mobile-saju-fortune-toss-10pass',
  'apps',
  'mobile',
  'assets',
  'zodiac',
  'chinese',
  'tiger.png',
);
const tarotHeroPath = resolve(appDir, 'assets', 'user-provided', 'tarot', 'tarot-hub-hero.png');
const tarotBackPath = resolve(appDir, 'assets', 'user-provided', 'tarot', 'tarot-card-back.png');
const tarotTodayPath = resolve(appDir, 'assets', 'user-provided', 'tarot', 'tarot-mode-today.png');
const tarotLovePath = resolve(appDir, 'assets', 'user-provided', 'tarot', 'tarot-mode-love.png');
const tarotWealthPath = resolve(appDir, 'assets', 'user-provided', 'tarot', 'tarot-mode-wealth.png');
const tarotRelationshipPath = resolve(appDir, 'assets', 'user-provided', 'tarot', 'tarot-mode-relationship.png');
const ichingCtaPath = resolve(appDir, 'assets', 'user-provided', 'iching', 'iching-cta-hero.png');
const inlinePath = resolve(appDir, 'src', 'features', 'assets', 'inline.generated.ts');

function assertExists(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`Missing locked asset: ${filePath}`);
  }
}

function sha256Buffer(buffer) {
  return createHash('sha256').update(buffer).digest('hex').toUpperCase();
}

function sha256File(filePath) {
  return sha256Buffer(readFileSync(filePath));
}

function extractGeneratedDataUri(content, exportName) {
  const escaped = exportName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = content.match(new RegExp(`export const ${escaped} = \\\"([^\\\"]+)\\\";`));
  if (!match?.[1]) {
    throw new Error(`Could not find ${exportName} in inline.generated.ts`);
  }
  return JSON.parse(`"${match[1]}"`);
}

function verifyPngDataUri(label, expectedHash, dataUri) {
  if (!dataUri.startsWith('data:image/png;base64,')) {
    throw new Error(`${label} inline asset is not a PNG data URI`);
  }

  const base64 = dataUri.slice('data:image/png;base64,'.length);
  const buffer = Buffer.from(base64, 'base64');
  const actualHash = sha256Buffer(buffer);

  if (actualHash !== expectedHash) {
    throw new Error(`${label} inline asset hash mismatch. expected=${expectedHash} actual=${actualHash}. Re-run generate-inline-assets.`);
  }
}

function dailyAssetEntries(groupName, keys, pathSegments) {
  return keys.map((key) => ({
    label: `${groupName.toLowerCase()}:${key}`,
    exportName: `DAILY_${groupName}_${key.toUpperCase()}_DATA_URI`,
    filePath: resolve(appDir, ...pathSegments, `${key}.png`),
  }));
}

assertExists(tigerPath);
assertExists(tigerIconCopyPath);
assertExists(tigerDetailCopyPath);
assertExists(tigerDetailSourcePath);
assertExists(tarotHeroPath);
assertExists(tarotBackPath);
assertExists(tarotTodayPath);
assertExists(tarotLovePath);
assertExists(tarotWealthPath);
assertExists(tarotRelationshipPath);
assertExists(ichingCtaPath);
assertExists(inlinePath);

const tigerHash = sha256File(tigerPath);
const tigerIconCopyHash = sha256File(tigerIconCopyPath);
const tigerDetailCopyHash = sha256File(tigerDetailCopyPath);
const tigerDetailSourceHash = sha256File(tigerDetailSourcePath);
const tarotHeroHash = sha256File(tarotHeroPath);
const tarotBackHash = sha256File(tarotBackPath);
const tarotTodayHash = sha256File(tarotTodayPath);
const tarotLoveHash = sha256File(tarotLovePath);
const tarotWealthHash = sha256File(tarotWealthPath);
const tarotRelationshipHash = sha256File(tarotRelationshipPath);
const ichingCtaHash = sha256File(ichingCtaPath);
const dailyAssets = [
  ...dailyAssetEntries('WESTERN_ICON', WESTERN_KEYS, ['assets', 'icons', 'zodiac', 'western']),
  ...dailyAssetEntries('WESTERN_DETAIL', WESTERN_KEYS, ['assets', 'zodiac', 'western']),
  ...dailyAssetEntries('CHINESE_ICON', CHINESE_KEYS, ['assets', 'icons', 'zodiac', 'chinese']),
  ...dailyAssetEntries('CHINESE_DETAIL', CHINESE_KEYS, ['assets', 'zodiac', 'chinese']),
];

const inlineContent = readFileSync(inlinePath, 'utf8');
const tarotHeroDataUri = extractGeneratedDataUri(inlineContent, 'TAROT_HUB_HERO_DATA_URI');
const tarotBackDataUri = extractGeneratedDataUri(inlineContent, 'TAROT_CARD_BACK_DATA_URI');
const tarotTodayDataUri = extractGeneratedDataUri(inlineContent, 'TAROT_MODE_TODAY_DATA_URI');
const tarotLoveDataUri = extractGeneratedDataUri(inlineContent, 'TAROT_MODE_LOVE_DATA_URI');
const tarotWealthDataUri = extractGeneratedDataUri(inlineContent, 'TAROT_MODE_WEALTH_DATA_URI');
const tarotRelationshipDataUri = extractGeneratedDataUri(inlineContent, 'TAROT_MODE_RELATIONSHIP_DATA_URI');
const ichingCtaDataUri = extractGeneratedDataUri(inlineContent, 'ICHING_CTA_HERO_DATA_URI');

verifyPngDataUri('Tarot hero', tarotHeroHash, tarotHeroDataUri);
verifyPngDataUri('Tarot card back', tarotBackHash, tarotBackDataUri);
verifyPngDataUri('Tarot today mode', tarotTodayHash, tarotTodayDataUri);
verifyPngDataUri('Tarot love mode', tarotLoveHash, tarotLoveDataUri);
verifyPngDataUri('Tarot wealth mode', tarotWealthHash, tarotWealthDataUri);
verifyPngDataUri('Tarot relationship mode', tarotRelationshipHash, tarotRelationshipDataUri);
verifyPngDataUri('IChing CTA hero', ichingCtaHash, ichingCtaDataUri);

for (const asset of dailyAssets) {
  assertExists(asset.filePath);
  verifyPngDataUri(asset.label, sha256File(asset.filePath), extractGeneratedDataUri(inlineContent, asset.exportName));
}

if (tigerIconCopyHash !== tigerHash) {
  throw new Error(`Tiger icon copy hash mismatch. expected=${tigerHash} actual=${tigerIconCopyHash}. Re-run generate-inline-assets.`);
}

if (tigerDetailCopyHash !== tigerDetailSourceHash) {
  throw new Error(`Tiger detail copy hash mismatch. expected=${tigerDetailSourceHash} actual=${tigerDetailCopyHash}. Re-run generate-inline-assets.`);
}

process.stdout.write(
  [
    'Locked asset verification passed:',
    `- tiger-icon.png: ${tigerHash}`,
    `- tiger icon copy: ${tigerIconCopyHash}`,
    `- tiger detail source: ${tigerDetailSourceHash}`,
    `- tiger detail copy: ${tigerDetailCopyHash}`,
    `- tarot-hub-hero.png: ${tarotHeroHash}`,
    `- tarot-card-back.png: ${tarotBackHash}`,
    `- tarot-mode-today.png: ${tarotTodayHash}`,
    `- tarot-mode-love.png: ${tarotLoveHash}`,
    `- tarot-mode-wealth.png: ${tarotWealthHash}`,
    `- tarot-mode-relationship.png: ${tarotRelationshipHash}`,
    `- iching-cta-hero.png: ${ichingCtaHash}`,
    `- daily assets verified: ${dailyAssets.length}`,
  ].join('\n') + '\n',
);
