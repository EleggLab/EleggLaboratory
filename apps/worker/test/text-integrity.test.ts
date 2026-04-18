import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const targets = [
  "README.md",
  "apps/web/src",
  "apps/worker/src",
  "apps/worker/test",
  "packages/shared/src",
  "scripts",
];

const allowedExtensions = new Set([".css", ".html", ".json", ".md", ".mjs", ".toml", ".ts", ".tsx"]);

function marker(...parts: string[]): string {
  return parts.join("");
}

const suspiciousMarkers = [
  marker("?", "쒕"),
  marker("?", "붿"),
  marker("?", "몄"),
  marker("?", "섎"),
  marker("?", "댁"),
  marker("?", "곌"),
  marker("?", "뚰"),
  marker("?", "뺤"),
  marker("?", "④"),
  marker("?", "앸"),
  marker("?", "쒕룄"),
  marker("硫", "붿"),
  marker("泥", "섎━"),
  marker("紐", "삵"),
  marker("듬", "땲"),
  marker("寃", "쎈"),
  marker("諛", "⑹"),
  marker("諛", "붾"),
  "\uFFFD",
];

function shouldScanFile(filePath: string): boolean {
  return allowedExtensions.has(extname(filePath));
}

function collectFiles(startPath: string): string[] {
  const absolutePath = join(repoRoot, startPath);
  const stat = statSync(absolutePath);

  if (stat.isFile()) {
    return shouldScanFile(absolutePath) ? [absolutePath] : [];
  }

  const files: string[] = [];
  for (const entry of readdirSync(absolutePath, { withFileTypes: true })) {
    if (entry.name === "dist" || entry.name === "node_modules") {
      continue;
    }

    const nextRelativePath = join(startPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(nextRelativePath));
      continue;
    }

    const nextAbsolutePath = join(repoRoot, nextRelativePath);
    if (shouldScanFile(nextAbsolutePath)) {
      files.push(nextAbsolutePath);
    }
  }

  return files;
}

function findSuspiciousMarker(content: string): string | undefined {
  return suspiciousMarkers.find((currentMarker) => content.includes(currentMarker));
}

describe("text integrity", () => {
  it("flags mojibake-like fragments without tripping on normal Korean copy or nullish operators", () => {
    expect(findSuspiciousMarker("서버 메시지를 읽지 못했습니다.")).toBeUndefined();
    expect(findSuspiciousMarker("const value = playerToken ?? null;")).toBeUndefined();
    expect(findSuspiciousMarker([marker("?", "쒕"), "쾭 메시지"].join(""))).toBe(marker("?", "쒕"));
    expect(findSuspiciousMarker(["요청을 ", marker("泥", "섎━"), "하지 못했습니다."].join(""))).toBe(
      marker("泥", "섎━"),
    );
  });

  it("does not leave known mojibake markers in tracked project files", () => {
    const offenders: string[] = [];

    for (const target of targets) {
      for (const filePath of collectFiles(target)) {
        const content = readFileSync(filePath, "utf8");
        const matchedMarker = findSuspiciousMarker(content);
        if (matchedMarker) {
          const relativePath = filePath.slice(repoRoot.length + 1);
          offenders.push(`${relativePath} -> ${matchedMarker}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});
