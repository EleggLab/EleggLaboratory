import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function main(): void {
  const rulesDir = join(process.cwd(), '..', 'data', 'src', 'rules');
  const files = readdirSync(rulesDir).filter((name) => name.endsWith('.json'));

  const missing: string[] = [];

  for (const file of files) {
    const fullPath = join(rulesDir, file);
    const rows = readJson(fullPath) as Array<{
      id?: string;
      evidence?: { sourceUrls?: string[] };
    }>;

    for (const row of rows) {
      if (!row.id) {
        missing.push(`${file}:missing-id`);
        continue;
      }
      if (!row.evidence?.sourceUrls || row.evidence.sourceUrls.length === 0) {
        missing.push(`${file}:${row.id}`);
      }
    }
  }

  if (missing.length > 0) {
    console.error('Missing sourceUrls in rule snippets:');
    for (const item of missing) {
      console.error(`- ${item}`);
    }
    process.exit(1);
  }

  console.log(`sources-check passed (${files.length} files)`);
}

main();
