import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

const appDir = resolve(import.meta.dirname, '..');
const repoRoot = resolve(appDir, '..', '..');
const uploadDir = resolve(repoRoot, 'upload-ready');
const aitPath = join(appDir, 'astra.ait');
const distDir = join(appDir, 'dist');
const latestUploadPath = join(uploadDir, 'LATEST_UPLOAD.md');

const now = new Date();
const stamp = [
  now.getFullYear(),
  String(now.getMonth() + 1).padStart(2, '0'),
  String(now.getDate()).padStart(2, '0'),
  '-',
  String(now.getHours()).padStart(2, '0'),
  String(now.getMinutes()).padStart(2, '0'),
  String(now.getSeconds()).padStart(2, '0'),
].join('');

const requestedTag = process.argv
  .slice(2)
  .find((arg) => arg.startsWith('--tag='))
  ?.slice('--tag='.length)
  .trim();

const tag = (requestedTag || 'upload')
  .toLowerCase()
  .replace(/[^a-z0-9-]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .replace(/-{2,}/g, '-');

const artifactName = `astra-toss-clean-${tag}-${stamp}.ait`;
const memoName = `UPLOAD_READY_TOSS_CLEAN_${tag.toUpperCase().replace(/-/g, '_')}_${stamp}.md`;
const artifactPath = join(uploadDir, artifactName);
const memoPath = join(uploadDir, memoName);

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: appDir,
    stdio: 'pipe',
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status}`);
  }

  return result;
}

function ensureDir(dirPath) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

function stripSourceMaps() {
  if (!existsSync(distDir)) {
    return;
  }

  for (const entry of readdirSync(distDir)) {
    if (!entry.endsWith('.map')) {
      continue;
    }
    rmSync(join(distDir, entry), { force: true });
  }
}

function sha256(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex').toUpperCase();
}

function extractDeploymentId(output) {
  const patterns = [/deploymentId[^0-9a-z-]*([0-9a-f-]{36})/i, /_deploymentId=([0-9a-f-]{36})/i];

  for (const pattern of patterns) {
    const match = output.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return 'pending-after-upload';
}

ensureDir(uploadDir);

run('node', ['./scripts/generate-inline-assets.mjs']);
run('node', ['./scripts/verify-locked-assets.mjs']);
run('node', ['./scripts/patch-granite-windows.mjs']);
run('pnpm', ['exec', 'granite', 'build']);
stripSourceMaps();
const aitBuild = run('pnpm', ['exec', 'ait', 'build']);

if (!existsSync(aitPath)) {
  throw new Error(`Expected artifact not found: ${aitPath}`);
}

copyFileSync(aitPath, artifactPath);

const deploymentId = extractDeploymentId(`${aitBuild.stdout}\n${aitBuild.stderr}`);
const size = statSync(artifactPath).size.toLocaleString('en-US');
const hash = sha256(artifactPath);

const memo = `# Toss Clean Upload Ready

- App: \`astra\`
- Build target: \`apps/toss-clean\`
- Artifact: \`${artifactName}\`
- Source build: \`${basename(aitPath)}\`
- Deployment ID: \`${deploymentId}\`
- SHA256: \`${hash}\`
- Size: \`${size} bytes\`

## Verification

- \`node ./scripts/generate-inline-assets.mjs\`
- \`node ./scripts/verify-locked-assets.mjs\`
- \`node ./scripts/patch-granite-windows.mjs\`
- \`granite build\`
- \`pnpm exec ait build\`

## Notes

- Upload artifact path: \`${artifactPath}\`
- A fresh memo was generated automatically by \`scripts/build-upload-ready.mjs\`.
- If Android shows a chooser, open with \`Toss\`, not \`MiniApp\`.
`;

writeFileSync(memoPath, memo, 'utf8');

const latestUpload = `# Latest Upload

- Current candidate \`.ait\`:
  - \`${artifactName}\`
- Path:
  - \`${artifactPath}\`
- Matching note:
  - \`${memoName}\`

## Current status

- Passed:
  - \`corepack pnpm --filter @saju/toss-clean typecheck\`
  - \`corepack pnpm --filter @saju/toss-clean build\`
  - \`corepack pnpm --filter @saju/toss-clean run build:upload -- --tag=${tag}\`
- Latest local deploymentId:
  - \`${deploymentId}\`
- SHA256:
  - \`${hash}\`

## What changed in this candidate

- Daily western/chinese icon/detail assets now use the same inline-locked asset pipeline as the working home and tarot assets.
- Tiger now travels through the same standard daily asset path as the other zodiac entries, with the user source copied into the standard icon/detail files during build.
- Daily detail no longer defaults to a second icon underlay, so duplicate-image framing is avoided.
- Daily cards keep tighter text overflow rules and larger bottom reserve above the tab bar.
- Tarot hub hero density and home scrim were polished in the same candidate.

## Immediate verification focus

- Daily western and birth-year list images should no longer render as blank on the real phone.
- Tiger tile and tiger detail should now match the user-provided source through the standard daily pipeline.
- Western detail heroes should render consistently without blank frames.
- Tarot hub top hero density, bottom-tab icon finish, and home scrim smoothness.
- Tab reselect reset and checklist reward flow.

## QA rule

- If Android shows a chooser, open with \`Toss\`, not \`MiniApp\`.
- Treat \`Toss main app\` as the release baseline.
`;

writeFileSync(latestUploadPath, latestUpload, 'utf8');

process.stdout.write(
  `\nCreated upload-ready artifact:\n- ${artifactPath}\n- ${memoPath}\n- deploymentId: ${deploymentId}\n- sha256: ${hash}\n`,
);
