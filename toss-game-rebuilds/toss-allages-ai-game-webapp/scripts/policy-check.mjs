import fs from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = process.cwd();
const SRC_ROOT = path.join(PROJECT_ROOT, 'src');

const FORBIDDEN_PATTERNS = [
  /\bfetch\s*\(/g,
  /axios/gi,
  /supabase/gi,
  /firebase/gi,
  /admob/gi,
  /billing/gi,
  /settlement/gi,
  /payment/gi,
  /websocket/gi,
];

const ALLOWLIST_FILES = new Set([
  // Toss game identity API is allowed.
  'src/platform/toss.ts',
]);

function walkFiles(dir, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(full, out);
      continue;
    }
    if (!entry.isFile()) continue;
    if (!/\.(ts|tsx|js|jsx)$/.test(entry.name)) continue;
    out.push(full);
  }
  return out;
}

const files = walkFiles(SRC_ROOT);
const violations = [];

for (const file of files) {
  const rel = path.relative(PROJECT_ROOT, file).replace(/\\/g, '/');
  if (ALLOWLIST_FILES.has(rel)) continue;
  const text = fs.readFileSync(file, 'utf8');

  for (const pattern of FORBIDDEN_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) {
      violations.push({ file: rel, pattern: String(pattern) });
    }
  }
}

if (violations.length > 0) {
  console.error('Magic Toss policy check failed (free/no-server mode):');
  for (const v of violations) {
    console.error(`- ${v.file} matched ${v.pattern}`);
  }
  process.exit(1);
}

console.log('Magic Toss policy check passed (free/no-server mode).');
