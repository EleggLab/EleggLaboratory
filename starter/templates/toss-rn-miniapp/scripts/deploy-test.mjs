import { spawnSync } from 'node:child_process';

const apiKey = process.env.TOSS_TEST_API_KEY?.trim() || process.env.AIT_API_KEY?.trim() || '';

if (!apiKey) {
  console.error('Missing TOSS_TEST_API_KEY or AIT_API_KEY.');
  console.error('Issue an API key from Toss console > workspace > keys, then rerun `pnpm deploy:test`.');
  process.exit(1);
}

const result = spawnSync('npx', ['ait', 'deploy', '--api-key', apiKey], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
