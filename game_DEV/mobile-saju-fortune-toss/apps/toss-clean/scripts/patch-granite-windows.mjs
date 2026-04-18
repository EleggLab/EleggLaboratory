import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

if (process.platform !== 'win32') {
  process.exit(0);
}

const appDir = join(__dirname, '..');
const seenStores = new Set();
const pnpmStoreRoots = [];

let cursor = appDir;
for (let depth = 0; depth < 6; depth += 1) {
  const storeRoot = join(cursor, 'node_modules', '.pnpm');
  if (existsSync(storeRoot) && !seenStores.has(storeRoot)) {
    seenStores.add(storeRoot);
    pnpmStoreRoots.push(storeRoot);
  }

  const parent = dirname(cursor);
  if (parent === cursor) {
    break;
  }
  cursor = parent;
}

const microFrontendTargets = pnpmStoreRoots.flatMap((pnpmStoreRoot) =>
  readdirSync(pnpmStoreRoot)
    .filter((entry) => entry.startsWith('@granite-js+plugin-micro-fr'))
    .flatMap((entry) => [
      join(pnpmStoreRoot, entry, 'node_modules', '@granite-js', 'plugin-micro-frontend', 'dist', 'index.js'),
      join(pnpmStoreRoot, entry, 'node_modules', '@granite-js', 'plugin-micro-frontend', 'dist', 'index.cjs'),
    ]),
);

for (const target of microFrontendTargets) {
  if (!existsSync(target)) {
    continue;
  }

  const source = readFileSync(target, 'utf8');
  let nextSource = source;

  if (nextSource.includes('path.resolve(modulePath)')) {
    nextSource = nextSource.replaceAll(
      'path.resolve(modulePath)',
      "path.resolve(modulePath).replace(/\\\\/g, '/')",
    );
  }

  if (nextSource.includes('path.default.resolve(modulePath)')) {
    nextSource = nextSource.replaceAll(
      'path.default.resolve(modulePath)',
      "path.default.resolve(modulePath).replace(/\\\\/g, '/')",
    );
  }

  if (nextSource !== source) {
    writeFileSync(target, nextSource, 'utf8');
    console.log(`Patched Windows module path handling in ${target}`);
  }
}

const routerGenPath = join(appDir, 'src', 'router.gen.ts');
if (existsSync(routerGenPath)) {
  const routerGenSource = readFileSync(routerGenPath, 'utf8');
  const fixedRouterGenSource = routerGenSource
    .replaceAll("from '../pages/';", "from '../pages/index';")
    .replaceAll('from "../pages/";', 'from "../pages/index";');

  if (fixedRouterGenSource !== routerGenSource) {
    writeFileSync(routerGenPath, fixedRouterGenSource, 'utf8');
    console.log(`Patched root route import in ${routerGenPath}`);
  }
}
