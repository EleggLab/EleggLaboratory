import { spawn } from 'node:child_process';
import path from 'node:path';

const [, , command, ...args] = process.argv;

if (!command) {
  console.error('Missing command for run-local-bin.mjs');
  process.exit(1);
}

const toolsPath = path.join(process.cwd(), 'tools');
const env = {
  ...process.env,
  PATH: `${toolsPath}${path.delimiter}${process.env.PATH ?? ''}`,
};

const child = spawn(command, args, {
  stdio: 'inherit',
  shell: true,
  env,
});

child.on('exit', (code) => {
  process.exit(code ?? 1);
});

