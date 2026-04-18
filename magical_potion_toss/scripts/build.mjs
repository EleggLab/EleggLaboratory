import { spawn } from 'node:child_process';
import path from 'node:path';

function run(command, args) {
  return new Promise((resolve, reject) => {
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
      if (code === 0) {
        resolve(undefined);
        return;
      }

      reject(new Error(`${command} ${args.join(' ')} exited with code ${code ?? 1}`));
    });
  });
}

await run('node', ['./scripts/validate-release-env.mjs', '--strict']);
await run('ait', ['build']);

