import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';

interface AssetMeta {
  absPath: string;
  relPath: string;
  size: number;
}

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp']);
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const IGNORE_DIRS = new Set(['node_modules', 'dist', 'android', 'ios', '.expo', 'build-artifacts']);

function walkFiles(rootDir: string, predicate: (absPath: string) => boolean): string[] {
  const out: string[] = [];
  const stack = [rootDir];

  while (stack.length > 0) {
    const current = stack.pop() as string;
    const entries = readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const absPath = join(current, entry.name);
      if (entry.isDirectory()) {
        if (!IGNORE_DIRS.has(entry.name)) {
          stack.push(absPath);
        }
        continue;
      }
      if (predicate(absPath)) {
        out.push(absPath);
      }
    }
  }

  return out;
}

function bytesToMb(bytes: number): number {
  return bytes / (1024 * 1024);
}

function parseRequireAssets(filePath: string): string[] {
  const content = readFileSync(filePath, 'utf-8');
  // Ignore commented-out `require(...)` examples in docs/comments.
  const codeOnly = content.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  const matches: string[] = [];
  const regex = /require\((['"])([^'"]*assets\/[^'"]+)\1\)/g;
  let found = regex.exec(codeOnly);
  while (found) {
    const assetRaw = found[2] as string;
    if (assetRaw) {
      matches.push(assetRaw);
    }
    found = regex.exec(codeOnly);
  }
  return matches;
}

function parseAppJsonAssets(appJsonPath: string): string[] {
  if (!existsSync(appJsonPath)) return [];
  const json = JSON.parse(readFileSync(appJsonPath, 'utf-8')) as {
    expo?: {
      icon?: string;
      splash?: { image?: string };
      ios?: { icon?: string };
      android?: { adaptiveIcon?: { foregroundImage?: string; monochromeImage?: string } };
    };
  };
  const expo = json.expo;
  if (!expo) return [];
  return [
    expo.icon,
    expo.splash?.image,
    expo.ios?.icon,
    expo.android?.adaptiveIcon?.foregroundImage,
    expo.android?.adaptiveIcon?.monochromeImage,
  ].filter((v): v is string => Boolean(v));
}

function createAssetMeta(absPath: string, repoRoot: string): AssetMeta {
  return {
    absPath,
    relPath: relative(repoRoot, absPath).replaceAll('\\', '/'),
    size: statSync(absPath).size,
  };
}

function main(): void {
  const strict = process.env.ASSET_BUDGET_STRICT === '1';
  const warnPerAssetMb = Number(process.env.ASSET_WARN_MB ?? '3');
  const failPerAssetMb = Number(process.env.ASSET_FAIL_MB ?? '8');
  const warnTotalMb = Number(process.env.ASSET_TOTAL_WARN_MB ?? '120');
  const failTotalMb = Number(process.env.ASSET_TOTAL_FAIL_MB ?? '170');

  const repoRoot = resolve(process.cwd(), '..', '..');
  const mobileRoot = join(repoRoot, 'apps', 'mobile');
  const assetsRoot = join(mobileRoot, 'assets');
  const appRoot = join(mobileRoot, 'app');
  const libRoot = join(mobileRoot, 'lib');
  const appJsonPath = join(mobileRoot, 'app.json');

  const allImageFiles = walkFiles(
    assetsRoot,
    (absPath) => IMAGE_EXTENSIONS.has(extname(absPath).toLowerCase()),
  );
  const allMeta = allImageFiles.map((absPath) => createAssetMeta(absPath, repoRoot));

  const sourceFiles = [
    ...walkFiles(appRoot, (absPath) => SOURCE_EXTENSIONS.has(extname(absPath).toLowerCase())),
    ...walkFiles(libRoot, (absPath) => SOURCE_EXTENSIONS.has(extname(absPath).toLowerCase())),
  ];

  const requiredAbs = new Set<string>();
  const missingRefs: string[] = [];

  const resolveRef = (filePath: string, refRaw: string): void => {
    const absPath = resolve(filePath, '..', refRaw);
    const isImage = IMAGE_EXTENSIONS.has(extname(absPath).toLowerCase());
    if (!isImage) return;
    if (existsSync(absPath)) {
      requiredAbs.add(absPath);
    } else {
      missingRefs.push(`${relative(repoRoot, filePath).replaceAll('\\', '/')} -> ${refRaw}`);
    }
  };

  sourceFiles.forEach((filePath) => {
    parseRequireAssets(filePath).forEach((refRaw) => resolveRef(filePath, refRaw));
  });

  parseAppJsonAssets(appJsonPath).forEach((refRaw) => {
    const absPath = resolve(mobileRoot, refRaw);
    if (IMAGE_EXTENSIONS.has(extname(absPath).toLowerCase()) && existsSync(absPath)) {
      requiredAbs.add(absPath);
    } else {
      missingRefs.push(`apps/mobile/app.json -> ${refRaw}`);
    }
  });

  const referencedMeta = [...requiredAbs].map((absPath) => createAssetMeta(absPath, repoRoot));

  const referencedTotalBytes = referencedMeta.reduce((sum, item) => sum + item.size, 0);
  const allTotalBytes = allMeta.reduce((sum, item) => sum + item.size, 0);

  const sortedReferenced = [...referencedMeta].sort((a, b) => b.size - a.size);
  const overWarnAssets = sortedReferenced.filter((item) => bytesToMb(item.size) >= warnPerAssetMb);
  const overFailAssets = sortedReferenced.filter((item) => bytesToMb(item.size) >= failPerAssetMb);

  const lines: string[] = [];
  lines.push('# Mobile Asset Audit');
  lines.push('');
  lines.push(`- strict: ${strict ? 'true' : 'false'}`);
  lines.push(`- referenced image files: ${referencedMeta.length}`);
  lines.push(`- referenced total: ${bytesToMb(referencedTotalBytes).toFixed(2)} MB`);
  lines.push(`- all assets image files: ${allMeta.length}`);
  lines.push(`- all assets total: ${bytesToMb(allTotalBytes).toFixed(2)} MB`);
  lines.push(`- warn threshold (per asset): ${warnPerAssetMb} MB`);
  lines.push(`- fail threshold (per asset): ${failPerAssetMb} MB`);
  lines.push(`- warn threshold (total referenced): ${warnTotalMb} MB`);
  lines.push(`- fail threshold (total referenced): ${failTotalMb} MB`);
  lines.push('');
  lines.push('## Largest Referenced Assets');
  lines.push('| path | size_mb |');
  lines.push('| - | -: |');
  sortedReferenced.slice(0, 20).forEach((item) => {
    lines.push(`| ${item.relPath} | ${bytesToMb(item.size).toFixed(2)} |`);
  });

  if (missingRefs.length > 0) {
    lines.push('');
    lines.push('## Missing References');
    missingRefs.slice(0, 30).forEach((line) => lines.push(`- ${line}`));
  }

  const docsDir = join(repoRoot, 'docs');
  mkdirSync(docsDir, { recursive: true });
  const reportPath = join(docsDir, 'ASSET_AUDIT.md');
  writeFileSync(reportPath, `${lines.join('\n')}\n`, 'utf-8');

  console.log(`[assets] report: ${reportPath}`);
  console.log(`[assets] referenced: ${referencedMeta.length} files, ${bytesToMb(referencedTotalBytes).toFixed(2)} MB`);
  console.log(`[assets] all assets: ${allMeta.length} files, ${bytesToMb(allTotalBytes).toFixed(2)} MB`);
  console.log(`[assets] over ${warnPerAssetMb}MB: ${overWarnAssets.length}`);

  if (missingRefs.length > 0) {
    console.warn(`[assets] missing refs: ${missingRefs.length}`);
  }

  const shouldWarnTotal = bytesToMb(referencedTotalBytes) >= warnTotalMb;
  if (shouldWarnTotal) {
    console.warn(
      `[assets] warning: referenced total ${bytesToMb(referencedTotalBytes).toFixed(2)} MB exceeds warn budget ${warnTotalMb} MB`,
    );
  }

  if (!strict) {
    return;
  }

  const shouldFail =
    overFailAssets.length > 0 || bytesToMb(referencedTotalBytes) >= failTotalMb || missingRefs.length > 0;

  if (shouldFail) {
    if (overFailAssets.length > 0) {
      console.error(
        `[assets] fail: ${overFailAssets.length} assets exceed per-file fail threshold ${failPerAssetMb} MB`,
      );
    }
    if (bytesToMb(referencedTotalBytes) >= failTotalMb) {
      console.error(
        `[assets] fail: referenced total ${bytesToMb(referencedTotalBytes).toFixed(2)} MB exceeds ${failTotalMb} MB`,
      );
    }
    if (missingRefs.length > 0) {
      console.error(`[assets] fail: ${missingRefs.length} missing asset references`);
    }
    process.exit(1);
  }
}

main();
