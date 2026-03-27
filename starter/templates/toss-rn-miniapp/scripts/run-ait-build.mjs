import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const defaultPnpmHome = process.platform === 'win32'
  ? path.join(os.homedir(), 'AppData', 'Local', 'pnpm-home')
  : path.join(os.homedir(), '.local', 'share', 'pnpm');

const pnpmHome = process.env.PNPM_HOME?.trim() || defaultPnpmHome;
fs.mkdirSync(pnpmHome, { recursive: true });

const enableResult = spawnSync('corepack', ['enable', '--install-directory', pnpmHome, 'pnpm'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (enableResult.status !== 0) {
  process.exit(enableResult.status ?? 1);
}

const env = {
  ...process.env,
  PNPM_HOME: pnpmHome,
  PATH: `${pnpmHome}${path.delimiter}${process.env.PATH ?? ''}`,
};

const buildResult = spawnSync('ait', ['build'], {
  env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (buildResult.status !== 0) {
  process.exit(buildResult.status ?? 1);
}
