import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

if (process.platform !== 'win32') {
  process.exit(0);
}

const require = createRequire(import.meta.url);
const packageJsonPath = require.resolve('@granite-js/plugin-micro-frontend/package.json', {
  paths: [join(__dirname, '..')],
});
const packageDir = dirname(packageJsonPath);
const targetFiles = [join(packageDir, 'dist', 'index.js'), join(packageDir, 'dist', 'index.cjs')];
const replacements = [
  {
    search: "path.resolve(modulePath)",
    replace: "path.resolve(modulePath).replace(/\\\\/g, '/')",
  },
  {
    search: "path.default.resolve(modulePath)",
    replace: "path.default.resolve(modulePath).replace(/\\\\/g, '/')",
  },
];

let patchedCount = 0;

for (const targetFile of targetFiles) {
  if (!existsSync(targetFile)) {
    continue;
  }

  const source = readFileSync(targetFile, 'utf8');
  let nextSource = source;
  let changed = false;

  for (const { search, replace } of replacements) {
    if (nextSource.includes(replace)) {
      continue;
    }
    if (!nextSource.includes(search)) {
      continue;
    }
    nextSource = nextSource.replaceAll(search, replace);
    changed = true;
  }

  if (changed) {
    writeFileSync(targetFile, nextSource, 'utf8');
    patchedCount += 1;
  }
}

if (patchedCount > 0) {
  console.log(`Patched Granite micro-frontend Windows imports in ${patchedCount} file(s).`);
}
