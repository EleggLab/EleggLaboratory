import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { CodexStatus, DraftBundle, Entry, Project, ProjectDraft } from "@tong/shared";
import { getTmpDir, resolveUploadAbsolutePath } from "./storage";

interface CodexDraftOutput {
  overallDraft: string;
  projectDrafts: Array<{ projectId: string; body: string }>;
}

const DRAFT_OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["overallDraft", "projectDrafts"],
  properties: {
    overallDraft: { type: "string", minLength: 1 },
    projectDrafts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["projectId", "body"],
        properties: {
          projectId: { type: "string", minLength: 1 },
          body: { type: "string", minLength: 1 },
        },
      },
    },
  },
} as const;

function runCommand(command: string, args: string[], input?: string) {
  return new Promise<{ code: number; stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["pipe", "pipe", "pipe"], windowsHide: true });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code: code ?? 1, stdout, stderr }));
    if (input) {
      child.stdin.write(input);
    }
    child.stdin.end();
  });
}

function fallbackDraft(project: Project, entries: Entry[]): ProjectDraft {
  const lines = [`# ${project.name}`, "## 작업 항목"];
  for (const entry of entries) {
    const textLines = entry.text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (textLines.length) {
      lines.push(...textLines.map((line) => `- ${line}`));
    } else {
      lines.push("- 이미지 또는 캡처만 첨부됨");
    }
    for (const image of entry.imagePaths) {
      lines.push(`![${image.name}](upload://${image.relativePath})`);
    }
  }
  return {
    projectId: project.id,
    projectName: project.name,
    body: lines.join("\n"),
    sourceEntryIds: entries.map((entry) => entry.id),
  };
}

async function ensureSchemaPath(): Promise<string> {
  const schemaPath = path.join(await getTmpDir(), "codex-worklog-schema.json");
  await fs.writeFile(schemaPath, JSON.stringify(DRAFT_OUTPUT_SCHEMA, null, 2), "utf8");
  return schemaPath;
}

async function parseCodexJson(outputPath: string): Promise<CodexDraftOutput> {
  return JSON.parse(await fs.readFile(outputPath, "utf8")) as CodexDraftOutput;
}

function buildEntrySection(entries: Entry[], projects: Project[]): string {
  const projectById = new Map(projects.map((project) => [project.id, project]));
  return entries
    .map((entry, index) => {
      const project = projectById.get(entry.projectId);
      return [
        `ENTRY ${index + 1}`,
        `- id: ${entry.id}`,
        `- createdAt: ${entry.createdAt}`,
        `- projectId: ${entry.projectId}`,
        `- projectName: ${project?.name ?? entry.projectId}`,
        "- text:",
        entry.text || "(no text)",
        "- images:",
        ...(entry.imagePaths.length
          ? entry.imagePaths.map(
              (image) =>
                `  - upload://${image.relativePath} | filename=${image.name} | mime=${image.mimeType}`,
            )
          : ["  - none"]),
      ].join("\n");
    })
    .join("\n\n");
}

async function collectImageArgs(entries: Entry[]): Promise<string[]> {
  const seen = new Set<string>();
  const args: string[] = [];
  for (const entry of entries) {
    for (const image of entry.imagePaths) {
      if (seen.has(image.relativePath)) {
        continue;
      }
      seen.add(image.relativePath);
      args.push("--image", await resolveUploadAbsolutePath(image.relativePath));
    }
  }
  return args;
}

async function runCodexDraft(prompt: string, entries: Entry[]): Promise<CodexDraftOutput> {
  const schemaPath = await ensureSchemaPath();
  const outputPath = path.join(await getTmpDir(), `codex-output-${randomUUID()}.json`);
  const result = await runCommand(
    "codex",
    ["exec", "--sandbox", "workspace-write", "--color", "never", "--output-schema", schemaPath, "--output-last-message", outputPath, ...(await collectImageArgs(entries))],
    prompt,
  );
  if (result.code !== 0) {
    throw new Error(result.stderr.trim() || result.stdout.trim() || "Codex 실행에 실패했습니다.");
  }
  try {
    return await parseCodexJson(outputPath);
  } finally {
    await fs.rm(outputPath, { force: true }).catch(() => undefined);
  }
}

function normalizeDrafts(output: CodexDraftOutput, entries: Entry[], projects: Project[]) {
  const entriesByProject = new Map<string, Entry[]>();
  for (const entry of entries) {
    const current = entriesByProject.get(entry.projectId) ?? [];
    current.push(entry);
    entriesByProject.set(entry.projectId, current);
  }

  const projectById = new Map(projects.map((project) => [project.id, project]));
  const projectDrafts: ProjectDraft[] = [];
  for (const [projectId, projectEntries] of entriesByProject) {
    const project = projectById.get(projectId);
    if (!project) {
      continue;
    }
    const generated = output.projectDrafts.find((draft) => draft.projectId === projectId);
    projectDrafts.push(
      generated?.body?.trim()
        ? {
            projectId,
            projectName: project.name,
            body: generated.body.trim(),
            sourceEntryIds: projectEntries.map((entry) => entry.id),
          }
        : fallbackDraft(project, projectEntries),
    );
  }

  const overallDraft = output.overallDraft?.trim()
    ? output.overallDraft.trim()
    : [
        `# ${entries[0] ? entries[0].createdAt.slice(0, 10) : ""} 전체 작업 보고`,
        "## 전체 요약",
        ...projectDrafts.map((draft) => `- ${draft.projectName}: 신규 기록 ${draft.sourceEntryIds.length}건 반영`),
      ].join("\n");

  return { overallDraft, projectDrafts } satisfies Pick<DraftBundle, "overallDraft" | "projectDrafts">;
}

function buildGeneratePrompt(date: string, entries: Entry[], projects: Project[]): string {
  return `
당신은 한국어 작업일지 편집기입니다.

목표:
- 날짜 ${date}의 기록만 바탕으로 보고서형 작업일지를 작성합니다.
- 감상, 기분, 잡담, 응원 문구는 쓰지 않습니다.
- 사실 전달, 불릿 중심, 짧고 단정한 문체를 유지합니다.
- 전체 보고 1개와 프로젝트별 상세 초안들을 함께 만듭니다.
- 프로젝트별 초안에서는 관련 이미지가 있으면 해당 항목 바로 아래에 배치합니다.

이미지 규칙:
- 이미지는 아래 형식만 사용합니다.
- ![이미지 설명](upload://relative/path/to/file.png)
- 이미지가 필요 없으면 쓰지 않습니다.

출력 규칙:
- 반드시 JSON 스키마에 맞는 값만 반환합니다.
- overallDraft와 projectDrafts[].body는 markdown 텍스트입니다.
- projectDrafts[].projectId에는 아래 프로젝트 id만 사용합니다.

문체 규칙:
- 제목/소제목 다음에는 불릿 목록을 중심으로 작성합니다.
- 파일 생성, 제출, 수정, 요청, 확인, 캡처, 산출물을 분명히 적습니다.

프로젝트 목록:
${projects.map((project) => `- ${project.id}: ${project.name}`).join("\n")}

원본 기록:
${buildEntrySection(entries, projects)}
`.trim();
}

function buildRefinePrompt(
  date: string,
  entries: Entry[],
  projects: Project[],
  overallDraft: string,
  projectDrafts: ProjectDraft[],
): string {
  return `
당신은 한국어 작업일지 편집기입니다.

목표:
- 사용자가 직접 수정한 초안을 더 또렷한 보고서형 문체로 다시 정리합니다.
- 새로운 내용을 임의로 추가하지 말고, 사용자의 수정 의도를 보존합니다.
- 감상, 기분, 잡담은 금지합니다.
- 불릿 중심, 사실 중심, 짧고 단정한 문체를 유지합니다.
- 프로젝트별 초안에서 관련 이미지는 문맥상 가장 가까운 항목 아래에 둡니다.

이미지 형식:
- ![이미지 설명](upload://relative/path/to/file.png)

반드시 JSON 스키마에 맞춰 반환하세요.

프로젝트 목록:
${projects.map((project) => `- ${project.id}: ${project.name}`).join("\n")}

사용자 수정본 전체 초안:
${overallDraft}

사용자 수정본 프로젝트 초안:
${projectDrafts.map((draft) => [`PROJECT ${draft.projectId} (${draft.projectName})`, draft.body].join("\n")).join("\n\n")}

참고용 원본 기록:
${buildEntrySection(entries, projects)}
`.trim();
}

export async function getCodexStatus(): Promise<CodexStatus> {
  try {
    const [versionResult, loginResult] = await Promise.all([
      runCommand("codex", ["--version"]),
      runCommand("codex", ["login", "status"]),
    ]);
    const version = versionResult.stdout.trim();
    const loginStatus = loginResult.stdout.trim() || loginResult.stderr.trim();
    return {
      ok: versionResult.code === 0 && loginResult.code === 0 && /logged in/i.test(loginStatus),
      message: loginStatus || "Codex 상태를 확인했습니다.",
      version,
      loginStatus,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Codex 상태를 확인하지 못했습니다.",
    };
  }
}

export async function generateDrafts(
  date: string,
  entries: Entry[],
  projects: Project[],
): Promise<Pick<DraftBundle, "overallDraft" | "projectDrafts">> {
  if (entries.length === 0) {
    throw new Error("선택한 날짜에 초안으로 만들 기록이 없습니다.");
  }
  return normalizeDrafts(await runCodexDraft(buildGeneratePrompt(date, entries, projects), entries), entries, projects);
}

export async function refineDrafts(
  date: string,
  entries: Entry[],
  projects: Project[],
  overallDraft: string,
  projectDrafts: ProjectDraft[],
): Promise<Pick<DraftBundle, "overallDraft" | "projectDrafts">> {
  if (entries.length === 0) {
    throw new Error("재작성할 기준 기록이 없습니다.");
  }
  return normalizeDrafts(
    await runCodexDraft(buildRefinePrompt(date, entries, projects, overallDraft, projectDrafts), entries),
    entries,
    projects,
  );
}
