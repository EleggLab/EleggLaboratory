import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const validateScript = path.join(__dirname, 'validate-app-store-config.mjs');

const [action = 'build'] = process.argv.slice(2);

const validActions = new Set(['build', 'submit']);
if (!validActions.has(action)) {
  console.error(`Unknown action: ${action}`);
  console.error('Usage: node ./scripts/run-eas-release.mjs <build|submit>');
  process.exit(1);
}

const validate = spawnSync(process.execPath, [validateScript], {
  cwd: process.cwd(),
  stdio: 'inherit',
});

if (validate.status !== 0) {
  process.exit(validate.status ?? 1);
}

const versionCheck = spawnSync('eas', ['--version'], {
  cwd: process.cwd(),
  stdio: 'pipe',
  shell: true,
  encoding: 'utf8',
});

if (versionCheck.status !== 0) {
  console.error('EAS CLI is not available in this environment.');
  console.error('Next step: install EAS CLI, log in, then rerun this command.');
  console.error('Recommended command: npm install -g eas-cli');
  process.exit(1);
}

const easArgs =
  action === 'build'
    ? ['build', '--platform', 'ios', '--profile', 'production']
    : ['submit', '--platform', 'ios', '--profile', 'production'];

const result = spawnSync('eas', easArgs, {
  cwd: process.cwd(),
  stdio: 'inherit',
  shell: true,
});

process.exit(result.status ?? 1);
