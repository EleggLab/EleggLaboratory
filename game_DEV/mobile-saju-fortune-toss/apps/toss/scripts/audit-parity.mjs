import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const APP_ROOT = process.cwd();
const MOBILE_ROOT = path.resolve(APP_ROOT, '..', 'mobile');
const TOSS_LEGACY_ROOT = path.resolve(APP_ROOT, 'src', 'legacy');
const INTENTIONAL_LIB_DIFFERENCES = new Set([
  'ui/ScreenScroll.tsx',
]);
const INTENTIONAL_EXTRA_LIB_FILES = new Set([
  'features/history/storage.ts',
  'features/history/types.ts',
  'features/iching/fortune.ts',
  'features/saju/savedInput.ts',
  'features/tarot/helpers.ts',
  'features/today/fortune.ts',
  'ui/HistoryLinkChip.tsx',
]);

function walkFiles(rootDir) {
  const collected = [];
  const stack = [rootDir];

  while (stack.length > 0) {
    const currentDir = stack.pop();
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }
      if (/\.backup-\d{8}$/.test(entry.name)) {
        continue;
      }
      collected.push(fullPath);
    }
  }

  return collected.sort();
}

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function compareDirectories(sourceDir, targetDir) {
  const sourceFiles = walkFiles(sourceDir);
  const targetFiles = walkFiles(targetDir);
  const sourceMap = new Map(sourceFiles.map((filePath) => [path.relative(sourceDir, filePath).replace(/\\/g, '/'), filePath]));
  const targetMap = new Map(targetFiles.map((filePath) => [path.relative(targetDir, filePath).replace(/\\/g, '/'), filePath]));

  const missingInTarget = [];
  const missingInSource = [];
  const contentMismatch = [];
  const intentionalMismatch = [];

  for (const [relativePath, sourcePath] of sourceMap) {
    const targetPath = targetMap.get(relativePath);
    if (!targetPath) {
      missingInTarget.push(relativePath);
      continue;
    }

    if (sha256(sourcePath) !== sha256(targetPath)) {
      if (INTENTIONAL_LIB_DIFFERENCES.has(relativePath)) {
        intentionalMismatch.push(relativePath);
      } else {
        contentMismatch.push(relativePath);
      }
    }
  }

  for (const relativePath of targetMap.keys()) {
    if (!sourceMap.has(relativePath)) {
      if (INTENTIONAL_EXTRA_LIB_FILES.has(relativePath)) {
        continue;
      }
      missingInSource.push(relativePath);
    }
  }

  return {
    sourceCount: sourceFiles.length,
    targetCount: targetFiles.length,
    missingInTarget,
    missingInSource,
    contentMismatch,
    intentionalMismatch,
  };
}

function diffStats(sourcePath, targetPath) {
  const result = spawnSync(
    'git',
    ['diff', '--no-index', '--numstat', '--', sourcePath, targetPath],
    { cwd: APP_ROOT, encoding: 'utf8' },
  );

  if (result.status === 0) {
    return { added: 0, deleted: 0, identical: true };
  }

  const line = result.stdout
    .split(/\r?\n/)
    .map((value) => value.trim())
    .find((value) => /^\d+\s+\d+\s+/.test(value));

  if (!line) {
    return { added: null, deleted: null, identical: false };
  }

  const [added, deleted] = line.split(/\s+/);
  return {
    added: Number(added),
    deleted: Number(deleted),
    identical: false,
  };
}

function printGroup(title, lines) {
  console.log(title);
  for (const line of lines) {
    console.log(`- ${line}`);
  }
  console.log('');
}

const assetAudit = compareDirectories(
  path.join(MOBILE_ROOT, 'assets'),
  path.join(TOSS_LEGACY_ROOT, 'assets'),
);

const libAudit = compareDirectories(
  path.join(MOBILE_ROOT, 'lib'),
  path.join(TOSS_LEGACY_ROOT, 'lib'),
);

const screenPairs = [
  ['/', 'app/(tabs)/home.tsx', 'src/legacy/app/(tabs)/home.tsx'],
  ['/today', 'app/(tabs)/today.tsx', 'src/legacy/app/(tabs)/today.tsx'],
  ['/iching', 'app/(tabs)/iching.tsx', 'src/legacy/app/(tabs)/iching.tsx'],
  ['/saju', 'app/(tabs)/saju/index.tsx', 'src/legacy/app/(tabs)/saju/index.tsx'],
  ['/tarot', 'app/(tabs)/tarot/index.tsx', 'src/legacy/app/(tabs)/tarot/index.tsx'],
  ['/tarot/reading', 'app/(tabs)/tarot/reading.tsx', 'src/legacy/app/(tabs)/tarot/reading.tsx'],
  ['/tarot/result', 'app/(tabs)/tarot/result.tsx', 'src/legacy/app/(tabs)/tarot/result.tsx'],
];

const screenAudit = screenPairs.map(([route, mobileRelative, tossRelative]) => {
  const mobilePath = path.join(MOBILE_ROOT, mobileRelative);
  const tossPath = path.join(APP_ROOT, tossRelative);
  const stats = diffStats(mobilePath, tossPath);
  return { route, ...stats };
});

const pageWrappers = [
  ['/', 'pages/index.tsx'],
  ['/today', 'pages/today.tsx'],
  ['/iching', 'pages/iching.tsx'],
  ['/saju', 'pages/saju.tsx'],
  ['/tarot', 'pages/tarot/index.tsx'],
  ['/tarot/reading', 'pages/tarot/reading.tsx'],
  ['/tarot/result', 'pages/tarot/result.tsx'],
];

const missingPageWrappers = pageWrappers
  .filter(([, relativePath]) => !fs.existsSync(path.join(APP_ROOT, relativePath)))
  .map(([route, relativePath]) => `${route} -> ${relativePath}`);

printGroup('Asset parity', [
  `mobile assets: ${assetAudit.sourceCount}`,
  `toss assets: ${assetAudit.targetCount}`,
  `missing in toss: ${assetAudit.missingInTarget.length}`,
  `extra in toss: ${assetAudit.missingInSource.length}`,
  `content mismatch: ${assetAudit.contentMismatch.length}`,
]);

printGroup('Lib parity', [
  `mobile lib files: ${libAudit.sourceCount}`,
  `toss lib files: ${libAudit.targetCount}`,
  `missing in toss: ${libAudit.missingInTarget.length}`,
  `extra in toss: ${libAudit.missingInSource.length}`,
  `content mismatch: ${libAudit.contentMismatch.length}`,
  `intentional mismatch: ${libAudit.intentionalMismatch.length}`,
]);

printGroup(
  'Route parity',
  screenAudit.map((entry) => (
    entry.identical
      ? `${entry.route}: identical`
      : `${entry.route}: added ${entry.added ?? '?'}, deleted ${entry.deleted ?? '?'}`
  )),
);

if (missingPageWrappers.length > 0) {
  printGroup('Missing page wrappers', missingPageWrappers);
}

const failures = [
  ...assetAudit.missingInTarget.map((value) => `missing asset in toss: ${value}`),
  ...assetAudit.missingInSource.map((value) => `extra asset in toss: ${value}`),
  ...libAudit.missingInTarget.map((value) => `missing lib file in toss: ${value}`),
  ...libAudit.missingInSource.map((value) => `extra lib file in toss: ${value}`),
  ...missingPageWrappers.map((value) => `missing page wrapper: ${value}`),
];

if (failures.length > 0) {
  printGroup('Failures', failures);
  process.exit(1);
}

console.log('Parity audit passed.');
