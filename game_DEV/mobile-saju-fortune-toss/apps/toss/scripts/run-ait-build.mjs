import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { delimiter, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const shimDir = join(scriptDir, '.bin-shims');
const appDir = dirname(scriptDir);

mkdirSync(shimDir, { recursive: true });

if (process.platform === 'win32') {
  const shimPath = join(shimDir, 'pnpm.cmd');
  const shimBody = ['@echo off', 'corepack pnpm %*', ''].join('\r\n');
  if (!existsSync(shimPath)) {
    writeFileSync(shimPath, shimBody, 'utf8');
  }
} else {
  const shimPath = join(shimDir, 'pnpm');
  const shimBody = ['#!/usr/bin/env sh', 'exec corepack pnpm "$@"', ''].join('\n');
  if (!existsSync(shimPath)) {
    writeFileSync(shimPath, shimBody, 'utf8');
    chmodSync(shimPath, 0o755);
  }
}

const env = {
  ...process.env,
  PATH: `${shimDir}${delimiter}${process.env.PATH ?? ''}`,
};

const command =
  process.platform === 'win32' ? join(appDir, 'node_modules', '.bin', 'ait.CMD') : join(appDir, 'node_modules', '.bin', 'ait');
const result = spawnSync(command, ['build'], {
  env,
  shell: process.platform === 'win32',
  stdio: 'inherit',
});

if (result.error) {
  console.error(result.error);
  process.exit(result.status ?? 1);
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
