#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);

function usage() {
  console.log(`vibe-starter usage:\n\n  vibe-starter init <webapp|bot|cli> <name> [targetDir]\n  vibe-starter verify [rootDir]\n  vibe-starter report [outputFile]\n`);
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function replaceProjectName(dir, name) {
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    for (const entry of fs.readdirSync(cur, { withFileTypes: true })) {
      const p = path.join(cur, entry.name);
      if (entry.isDirectory()) stack.push(p);
      else {
        try {
          const raw = fs.readFileSync(p, 'utf8');
          if (raw.includes('{{PROJECT_NAME}}')) {
            fs.writeFileSync(p, raw.replaceAll('{{PROJECT_NAME}}', name), 'utf8');
          }
        } catch (_) {}
      }
    }
  }
}

function init(stack, name, targetDir) {
  const allowed = new Set(['webapp', 'bot', 'cli']);
  if (!allowed.has(stack)) {
    console.error(`unknown stack: ${stack}`);
    process.exit(1);
  }
  const src = path.join(root, 'templates', stack);
  const dest = path.resolve(targetDir || path.join(process.cwd(), name));
  copyDir(src, dest);
  replaceProjectName(dest, name);
  console.log(`initialized: ${dest} (stack=${stack})`);
}

function verify(dir) {
  const base = path.resolve(dir || root);
  const requiredFiles = [
    'README.md',
    'prompts/system.base.md',
    'prompts/task.template.md',
    'checklists/release-checklist.md'
  ];
  const requiredDirs = ['locales/ko', 'locales/en', 'scripts'];
  for (const f of requiredFiles) {
    if (!fs.existsSync(path.join(base, f))) {
      console.error(`[verify][fail] missing file: ${f}`);
      process.exit(1);
    }
  }
  for (const d of requiredDirs) {
    if (!fs.existsSync(path.join(base, d))) {
      console.error(`[verify][fail] missing dir: ${d}`);
      process.exit(1);
    }
  }
  console.log(`[verify][ok] template structure looks good: ${base}`);
}

function report(outputFile) {
  const out = path.resolve(outputFile || path.join(process.cwd(), 'starter-report.md'));
  const now = new Date().toISOString();
  const files = [];
  function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else files.push(path.relative(root, p));
    }
  }
  walk(root);
  const content = [
    '# Starter Change Report',
    '',
    `Generated: ${now}`,
    '',
    '## Key Files',
    ...files.sort().map(f => `- ${f}`),
    ''
  ].join('\n');
  fs.writeFileSync(out, content, 'utf8');
  console.log(`report written: ${out}`);
}

if (args.length === 0) {
  usage();
  process.exit(0);
}

const cmd = args[0];
if (cmd === 'init') {
  const stack = args[1];
  const name = args[2];
  const target = args[3];
  if (!stack || !name) return usage();
  init(stack, name, target);
} else if (cmd === 'verify') {
  verify(args[1]);
} else if (cmd === 'report') {
  report(args[1]);
} else {
  usage();
}
