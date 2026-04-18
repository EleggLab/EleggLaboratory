import { createServer } from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createEntryBodySchema,
  generateDraftBodySchema,
  listEntriesQuerySchema,
  notionBootstrapBodySchema,
  projectUpsertBodySchema,
  publishDraftBodySchema,
  refineDraftBodySchema,
  updateSettingsBodySchema,
  type AppSnapshot,
  type DraftBundle,
} from "@tong/shared";
import { generateDrafts, getCodexStatus, refineDrafts } from "./codex";
import { bootstrapNotionWorkspace, getNotionStatus, publishDraftBundle, syncProjectPages } from "./notion";
import { buildPreviewHtml } from "./render";
import {
  createEntry,
  getAppSnapshot,
  getDataRoot,
  getTodayDateKey,
  guessMimeType,
  listEntries,
  loadDraftBundle,
  loadProjects,
  loadState,
  markEntriesPublished,
  readUploadFile,
  resolveEntriesForDraft,
  saveDailyMapping,
  saveDraftBundle,
  saveLastPublishedEntryId,
  saveNotionState,
  updateSettings,
  upsertProject,
} from "./storage";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_DIST_DIR = path.resolve(__dirname, "../../worklog-web/dist");
const PORT = 8788;

function sendJson(response: import("node:http").ServerResponse, statusCode: number, payload: unknown): void {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

function sendText(response: import("node:http").ServerResponse, statusCode: number, body: string, contentType: string): void {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", contentType);
  response.end(body);
}

async function readBody(request: import("node:http").IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function readJsonBody<T>(request: import("node:http").IncomingMessage): Promise<T> {
  const raw = await readBody(request);
  return (raw ? JSON.parse(raw) : {}) as T;
}

function draftTargetsForDate(state: Awaited<ReturnType<typeof loadState>>, date: string): DraftBundle["notionTargets"] {
  const mapping = state.dailyMappings[date];
  return {
    ...(mapping?.overallPageId ? { overallPageId: mapping.overallPageId } : {}),
    ...(mapping?.overallPageUrl ? { overallPageUrl: mapping.overallPageUrl } : {}),
    projectPageIds: Object.fromEntries(
      Object.entries(mapping?.projectPages ?? {}).map(([projectId, page]) => [projectId, page.pageId]),
    ),
    projectPageUrls: Object.fromEntries(
      Object.entries(mapping?.projectPages ?? {}).map(([projectId, page]) => [projectId, page.url ?? ""]),
    ),
  };
}

async function buildSnapshot(date = getTodayDateKey()): Promise<AppSnapshot> {
  const snapshot = await getAppSnapshot(date);
  const [codexStatus, notionStatus] = await Promise.all([
    getCodexStatus(),
    getNotionStatus(snapshot.state.notion),
  ]);
  return {
    ...snapshot,
    codexStatus,
    notionStatus,
  };
}

async function serveUpload(pathname: string, response: import("node:http").ServerResponse): Promise<void> {
  const dataRoot = await getDataRoot();
  const uploadsRoot = path.resolve(dataRoot, "uploads");
  const relative = pathname
    .replace(/^\/uploads\//, "")
    .split("/")
    .map((segment) => decodeURIComponent(segment))
    .join(path.sep);
  const absolutePath = path.resolve(uploadsRoot, relative);
  if (!absolutePath.startsWith(uploadsRoot)) {
    sendJson(response, 400, { message: "잘못된 업로드 경로입니다." });
    return;
  }
  try {
    const body = await fs.readFile(absolutePath);
    response.statusCode = 200;
    response.setHeader("Content-Type", guessMimeType(relative));
    response.end(body);
  } catch {
    sendJson(response, 404, { message: "이미지를 찾지 못했습니다." });
  }
}

async function serveStatic(pathname: string, response: import("node:http").ServerResponse): Promise<void> {
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.resolve(WEB_DIST_DIR, `.${requestedPath}`);
  try {
    const stat = await fs.stat(filePath);
    if (stat.isFile()) {
      const body = await fs.readFile(filePath);
      const contentType = filePath.endsWith(".html")
        ? "text/html; charset=utf-8"
        : filePath.endsWith(".css")
          ? "text/css; charset=utf-8"
          : filePath.endsWith(".js")
            ? "application/javascript; charset=utf-8"
            : "application/octet-stream";
      response.statusCode = 200;
      response.setHeader("Content-Type", contentType);
      response.end(body);
      return;
    }
  } catch {
    // Fallback handled below.
  }

  try {
    const indexHtml = await fs.readFile(path.join(WEB_DIST_DIR, "index.html"), "utf8");
    sendText(response, 200, indexHtml, "text/html; charset=utf-8");
  } catch {
    sendJson(response, 404, { message: "정적 파일을 찾지 못했습니다. worklog 웹앱을 먼저 실행해주세요." });
  }
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://127.0.0.1:${PORT}`);
  try {
    if (request.method === "OPTIONS") {
      response.statusCode = 204;
      response.end();
      return;
    }

    if (url.pathname.startsWith("/uploads/") && request.method === "GET") {
      await serveUpload(url.pathname, response);
      return;
    }

    if (!url.pathname.startsWith("/api/")) {
      await serveStatic(url.pathname, response);
      return;
    }

    if (url.pathname === "/api/app" && request.method === "GET") {
      const date = url.searchParams.get("date") ?? getTodayDateKey();
      sendJson(response, 200, await buildSnapshot(date));
      return;
    }

    if (url.pathname === "/api/health" && request.method === "GET") {
      sendJson(response, 200, { ok: true, port: PORT });
      return;
    }

    if (url.pathname === "/api/projects" && request.method === "GET") {
      sendJson(response, 200, { projects: await loadProjects() });
      return;
    }

    if (url.pathname === "/api/projects" && request.method === "POST") {
      const body = projectUpsertBodySchema.parse(await readJsonBody(request));
      const projectInput = {
        ...(body.id ? { id: body.id } : {}),
        slug: body.slug,
        name: body.name,
        active: body.active,
        ...(body.defaultPromptHint ? { defaultPromptHint: body.defaultPromptHint } : {}),
      };
      const projects = await upsertProject(projectInput);
      const state = await loadState();
      if (state.notion) {
        const notion = await syncProjectPages(state.notion, projects);
        await saveNotionState(notion);
      }
      sendJson(response, 200, { projects });
      return;
    }

    if (url.pathname === "/api/settings" && request.method === "POST") {
      const body = updateSettingsBodySchema.parse(await readJsonBody(request));
      const state = await updateSettings(body.defaultProjectId);
      sendJson(response, 200, { state });
      return;
    }

    if (url.pathname === "/api/entries" && request.method === "GET") {
      const query = listEntriesQuerySchema.parse({
        date: url.searchParams.get("date") ?? undefined,
        projectId: url.searchParams.get("projectId") ?? undefined,
      });
      const entryQuery = {
        ...(query.date ? { date: query.date } : {}),
        ...(query.projectId ? { projectId: query.projectId } : {}),
      };
      sendJson(response, 200, { entries: await listEntries(entryQuery) });
      return;
    }

    if (url.pathname === "/api/entries" && request.method === "POST") {
      const body = createEntryBodySchema.parse(await readJsonBody(request));
      const entry = await createEntry(body);
      sendJson(response, 200, { entry, recentEntries: await listEntries({}) });
      return;
    }

    if (url.pathname === "/api/drafts" && request.method === "GET") {
      const date = url.searchParams.get("date") ?? getTodayDateKey();
      sendJson(response, 200, { draftBundle: await loadDraftBundle(date) });
      return;
    }

    if (url.pathname === "/api/drafts/generate" && request.method === "POST") {
      const body = generateDraftBodySchema.parse(await readJsonBody(request));
      const [entries, projects, state, codexStatus] = await Promise.all([
        resolveEntriesForDraft(body.date),
        loadProjects(),
        loadState(),
        getCodexStatus(),
      ]);
      if (!codexStatus.ok) {
        throw new Error(codexStatus.message || "Codex를 사용할 수 없습니다.");
      }
      const generated = await generateDrafts(body.date, entries, projects);
      const draftBundle: DraftBundle = {
        date: body.date,
        generatedAt: new Date().toISOString(),
        sourceEntryIds: entries.map((entry) => entry.id),
        overallDraft: generated.overallDraft,
        projectDrafts: generated.projectDrafts,
        previewHtml: "",
        notionTargets: draftTargetsForDate(state, body.date),
        revisionCount: 0,
      };
      const finalBundle: DraftBundle = {
        ...draftBundle,
        previewHtml: buildPreviewHtml(draftBundle),
      };
      await saveDraftBundle(finalBundle);
      sendJson(response, 200, { draftBundle: finalBundle });
      return;
    }

    if (url.pathname === "/api/drafts/refine" && request.method === "POST") {
      const body = refineDraftBodySchema.parse(await readJsonBody(request));
      const [entries, projects, existingDraft, codexStatus] = await Promise.all([
        resolveEntriesForDraft(body.date),
        loadProjects(),
        loadDraftBundle(body.date),
        getCodexStatus(),
      ]);
      if (!codexStatus.ok) {
        throw new Error(codexStatus.message || "Codex를 사용할 수 없습니다.");
      }
      const refined = await refineDrafts(
        body.date,
        entries,
        projects,
        body.overallDraft,
        body.projectDrafts,
      );
      const draftBundle: DraftBundle = {
        date: body.date,
        generatedAt: new Date().toISOString(),
        sourceEntryIds: entries.map((entry) => entry.id),
        overallDraft: refined.overallDraft,
        projectDrafts: refined.projectDrafts,
        previewHtml: "",
        notionTargets:
          existingDraft?.notionTargets ?? draftTargetsForDate(await loadState(), body.date),
        revisionCount: (existingDraft?.revisionCount ?? 0) + 1,
      };
      const finalBundle: DraftBundle = {
        ...draftBundle,
        previewHtml: buildPreviewHtml(draftBundle),
      };
      await saveDraftBundle(finalBundle);
      sendJson(response, 200, { draftBundle: finalBundle });
      return;
    }

    if (url.pathname === "/api/publish" && request.method === "POST") {
      const body = publishDraftBodySchema.parse(await readJsonBody(request));
      const [draftBundle, state, projects] = await Promise.all([
        loadDraftBundle(body.date),
        loadState(),
        loadProjects(),
      ]);
      if (!draftBundle) {
        throw new Error("등록할 초안이 없습니다.");
      }
      if (!state.notion) {
        throw new Error("Notion 설정을 먼저 완료해주세요.");
      }

      const syncedNotion = await syncProjectPages(state.notion, projects);
      await saveNotionState(syncedNotion);

      const published = await publishDraftBundle({
        notion: syncedNotion,
        ...(state.dailyMappings[body.date] ? { mapping: state.dailyMappings[body.date] } : {}),
        bundle: draftBundle,
        projects,
        entries: [],
        loadUpload: async (relativePath) => {
          const buffer = await readUploadFile(relativePath);
          return {
            buffer,
            mimeType: guessMimeType(relativePath),
            fileName: path.basename(relativePath),
          };
        },
      });

      await saveDailyMapping(published.mapping);
      await markEntriesPublished(draftBundle.sourceEntryIds);
      await saveLastPublishedEntryId(
        draftBundle.sourceEntryIds[draftBundle.sourceEntryIds.length - 1] ?? state.lastPublishedEntryId,
      );

      const savedBundle: DraftBundle = {
        ...draftBundle,
        notionTargets: {
          ...(published.mapping.overallPageId
            ? { overallPageId: published.mapping.overallPageId }
            : {}),
          ...(published.mapping.overallPageUrl
            ? { overallPageUrl: published.mapping.overallPageUrl }
            : {}),
          projectPageIds: Object.fromEntries(
            Object.entries(published.mapping.projectPages).map(([projectId, page]) => [projectId, page.pageId]),
          ),
          projectPageUrls: Object.fromEntries(
            Object.entries(published.mapping.projectPages).map(([projectId, page]) => [projectId, page.url ?? ""]),
          ),
        },
      };
      await saveDraftBundle(savedBundle);
      sendJson(response, 200, { mapping: published.mapping, draftBundle: savedBundle });
      return;
    }

    if (url.pathname === "/api/setup/notion/bootstrap" && request.method === "POST") {
      const body = notionBootstrapBodySchema.parse(await readJsonBody(request));
      const [projects, state] = await Promise.all([loadProjects(), loadState()]);
      if (state.notion && !body.forceRecreate) {
        throw new Error("이미 Notion 구조가 연결되어 있습니다. 재연결이 필요하면 Settings에서 재연결 모드를 열고 다시 시도해주세요.");
      }
      const notion = await bootstrapNotionWorkspace({
        token: body.token,
        parentPageIdOrUrl: body.parentPageIdOrUrl,
        projects,
      });
      await saveNotionState(notion);
      sendJson(response, 200, { notionStatus: await getNotionStatus(notion) });
      return;
    }

    if (url.pathname === "/api/status/codex" && request.method === "GET") {
      sendJson(response, 200, await getCodexStatus());
      return;
    }

    if (url.pathname === "/api/status/notion" && request.method === "GET") {
      const state = await loadState();
      sendJson(response, 200, await getNotionStatus(state.notion));
      return;
    }

    sendJson(response, 404, { message: "API 경로를 찾지 못했습니다." });
  } catch (error) {
    sendJson(response, 400, {
      message: error instanceof Error ? error.message : "요청을 처리하지 못했습니다.",
    });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`worklog server listening on http://127.0.0.1:${PORT}`);
});
