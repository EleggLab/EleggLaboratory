import type {
  DailyPublishMapping,
  DraftBundle,
  Entry,
  NotionBootstrapState,
  NotionStatus,
  Project,
} from "@tong/shared";
import { markdownishToNotionBlocks } from "./render";

const LEGACY_VERSION = "2022-06-28";
const MEDIA_VERSION = "2026-03-11";

function notionHeaders(token: string, version: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "Notion-Version": version,
    "Content-Type": "application/json",
  };
}

async function notionJsonFetch<T>(
  token: string,
  path: string,
  init: RequestInit,
  version = LEGACY_VERSION,
): Promise<T> {
  const response = await fetch(`https://api.notion.com${path}`, {
    ...init,
    headers: { ...notionHeaders(token, version), ...(init.headers ?? {}) },
  });
  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(typeof payload.message === "string" ? payload.message : `Notion 요청 실패 (${response.status})`);
  }
  return payload as T;
}

async function notionMultipartFetch<T>(token: string, path: string, formData: FormData): Promise<T> {
  const response = await fetch(`https://api.notion.com${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Notion-Version": MEDIA_VERSION },
    body: formData,
  });
  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(typeof payload.message === "string" ? payload.message : `Notion 업로드 실패 (${response.status})`);
  }
  return payload as T;
}

function richText(content: string): Array<Record<string, unknown>> {
  return [{ type: "text", text: { content } }];
}

function extractNotionPageId(input: string): string {
  const direct = input.trim().match(/[0-9a-fA-F]{32}|[0-9a-fA-F-]{36}/);
  if (!direct) {
    throw new Error("유효한 Notion 페이지 ID 또는 URL이 필요합니다.");
  }
  const compact = direct[0].replaceAll("-", "");
  return [compact.slice(0, 8), compact.slice(8, 12), compact.slice(12, 16), compact.slice(16, 20), compact.slice(20, 32)].join("-");
}

async function createDatabase(token: string, parentPageId: string, title: string, properties: Record<string, unknown>) {
  return notionJsonFetch<{ id: string }>(
    token,
    "/v1/databases",
    { method: "POST", body: JSON.stringify({ parent: { type: "page_id", page_id: parentPageId }, title: richText(title), properties }) },
    LEGACY_VERSION,
  );
}

async function createDatabasePage(token: string, databaseId: string, properties: Record<string, unknown>) {
  return notionJsonFetch<{ id: string; url: string }>(
    token,
    "/v1/pages",
    { method: "POST", body: JSON.stringify({ parent: { database_id: databaseId }, properties }) },
    LEGACY_VERSION,
  );
}

async function updatePageProperties(token: string, pageId: string, properties: Record<string, unknown>) {
  return notionJsonFetch<{ id: string; url: string }>(
    token,
    `/v1/pages/${pageId}`,
    { method: "PATCH", body: JSON.stringify({ properties }) },
    LEGACY_VERSION,
  );
}

async function appendBlocks(token: string, pageId: string, children: Record<string, unknown>[]) {
  if (!children.length) {
    return;
  }
  await notionJsonFetch(token, `/v1/blocks/${pageId}/children`, { method: "PATCH", body: JSON.stringify({ children }) }, MEDIA_VERSION);
}

async function createFileUpload(token: string): Promise<{ id: string }> {
  return notionJsonFetch(token, "/v1/file_uploads", { method: "POST", body: JSON.stringify({}) }, MEDIA_VERSION);
}

async function sendFileUpload(
  token: string,
  fileUploadId: string,
  fileName: string,
  mimeType: string,
  fileBuffer: Buffer,
): Promise<string> {
  const formData = new FormData();
  formData.append("file", new Blob([new Uint8Array(fileBuffer)], { type: mimeType }), fileName);
  return (await notionMultipartFetch<{ id: string }>(token, `/v1/file_uploads/${fileUploadId}/send`, formData)).id;
}

function projectProperties(project: Project): Record<string, unknown> {
  return {
    Name: { title: richText(project.name) },
    Slug: { rich_text: richText(project.slug) },
    Active: { checkbox: project.active },
    "Default Prompt Hint": { rich_text: project.defaultPromptHint ? richText(project.defaultPromptHint) : [] },
  };
}

function dailyReportProperties(date: string): Record<string, unknown> {
  return {
    Name: { title: richText(`${date} 전체 작업 보고`) },
    DateKey: { rich_text: richText(date) },
    "Last Published At": { rich_text: richText(new Date().toISOString()) },
  };
}

function projectUpdateProperties(date: string, project: Project): Record<string, unknown> {
  return {
    Name: { title: richText(`${date} ${project.name} 업데이트`) },
    DateKey: { rich_text: richText(date) },
    "Project Slug": { rich_text: richText(project.slug) },
    "Project Name": { rich_text: richText(project.name) },
    "Last Published At": { rich_text: richText(new Date().toISOString()) },
  };
}

async function syncProjectsToNotion(notion: NotionBootstrapState, projects: Project[]) {
  const projectsPageIds = { ...notion.projectsPageIds };
  for (const project of projects) {
    const pageId = projectsPageIds[project.id];
    if (pageId) {
      await updatePageProperties(notion.token, pageId, projectProperties(project));
      continue;
    }
    projectsPageIds[project.id] = (await createDatabasePage(notion.token, notion.projectsDatabaseId, projectProperties(project))).id;
  }
  return { ...notion, projectsPageIds };
}

export async function bootstrapNotionWorkspace(input: {
  token: string;
  parentPageIdOrUrl: string;
  projects: Project[];
}): Promise<NotionBootstrapState> {
  const parentPageId = extractNotionPageId(input.parentPageIdOrUrl);
  const [projectsDb, dailyReportsDb, projectUpdatesDb] = await Promise.all([
    createDatabase(input.token, parentPageId, "Projects", { Name: { title: {} }, Slug: { rich_text: {} }, Active: { checkbox: {} }, "Default Prompt Hint": { rich_text: {} } }),
    createDatabase(input.token, parentPageId, "Daily Reports", { Name: { title: {} }, DateKey: { rich_text: {} }, "Last Published At": { rich_text: {} } }),
    createDatabase(input.token, parentPageId, "Project Updates", { Name: { title: {} }, DateKey: { rich_text: {} }, "Project Slug": { rich_text: {} }, "Project Name": { rich_text: {} }, "Last Published At": { rich_text: {} } }),
  ]);

  return syncProjectsToNotion(
    {
      token: input.token,
      parentPageId,
      projectsDatabaseId: projectsDb.id,
      dailyReportsDatabaseId: dailyReportsDb.id,
      projectUpdatesDatabaseId: projectUpdatesDb.id,
      projectsPageIds: {},
    },
    input.projects,
  );
}

export async function syncProjectPages(notion: NotionBootstrapState, projects: Project[]) {
  return syncProjectsToNotion(notion, projects);
}

export async function getNotionStatus(notion?: NotionBootstrapState): Promise<NotionStatus> {
  if (!notion) {
    return { ok: false, message: "Notion이 아직 설정되지 않았습니다.", configured: false, bootstrapComplete: false };
  }
  try {
    await notionJsonFetch(notion.token, `/v1/pages/${notion.parentPageId}`, { method: "GET" }, LEGACY_VERSION);
    return {
      ok: true,
      message: "Notion 연결이 정상입니다.",
      configured: true,
      bootstrapComplete: true,
      parentPageId: notion.parentPageId,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Notion 상태를 확인하지 못했습니다.",
      configured: true,
      bootstrapComplete: true,
      parentPageId: notion.parentPageId,
    };
  }
}

function sectionHeading(title: string): Record<string, unknown> {
  return { object: "block", type: "heading_2", heading_2: { rich_text: richText(title) } };
}

function projectLinksBlocks(projectLinks: Array<{ title: string; url: string }>): Record<string, unknown>[] {
  if (!projectLinks.length) {
    return [];
  }
  return [
    sectionHeading("프로젝트별 상세 페이지"),
    ...projectLinks.map((projectLink) => ({
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [{ type: "text", text: { content: projectLink.title, link: { url: projectLink.url } } }],
      },
    })),
  ];
}

async function ensureOverallPage(notion: NotionBootstrapState, mapping: DailyPublishMapping, date: string) {
  if (mapping.overallPageId) {
    const updated = await updatePageProperties(notion.token, mapping.overallPageId, dailyReportProperties(date));
    return { pageId: updated.id, url: updated.url };
  }
  const created = await createDatabasePage(notion.token, notion.dailyReportsDatabaseId, dailyReportProperties(date));
  return { pageId: created.id, url: created.url };
}

async function ensureProjectPage(
  notion: NotionBootstrapState,
  mapping: DailyPublishMapping,
  date: string,
  project: Project,
) {
  const existing = mapping.projectPages[project.id];
  if (existing?.pageId) {
    const updated = await updatePageProperties(notion.token, existing.pageId, projectUpdateProperties(date, project));
    return { pageId: updated.id, url: updated.url };
  }
  const created = await createDatabasePage(notion.token, notion.projectUpdatesDatabaseId, projectUpdateProperties(date, project));
  return { pageId: created.id, url: created.url };
}

export async function publishDraftBundle(input: {
  notion: NotionBootstrapState;
  mapping?: DailyPublishMapping;
  bundle: DraftBundle;
  projects: Project[];
  entries: Entry[];
  loadUpload: (relativePath: string) => Promise<{ buffer: Buffer; mimeType: string; fileName: string }>;
}): Promise<{ mapping: DailyPublishMapping; notion: NotionBootstrapState }> {
  const mapping: DailyPublishMapping = input.mapping ?? { date: input.bundle.date, projectPages: {}, publishedEntryIds: [] };
  const projectById = new Map(input.projects.map((project) => [project.id, project]));
  const uploadCache = new Map<string, string>();

  const resolveUploadId = async (relativePath: string, caption: string) => {
    const cached = uploadCache.get(relativePath);
    if (cached) {
      return cached;
    }
    const upload = await createFileUpload(input.notion.token);
    const file = await input.loadUpload(relativePath);
    const uploadId = await sendFileUpload(input.notion.token, upload.id, file.fileName || caption || "image", file.mimeType, file.buffer);
    uploadCache.set(relativePath, uploadId);
    return uploadId;
  };

  const overallPage = await ensureOverallPage(input.notion, mapping, input.bundle.date);
  const projectPages: DailyPublishMapping["projectPages"] = { ...mapping.projectPages };
  const projectLinks: Array<{ title: string; url: string }> = [];

  for (const draft of input.bundle.projectDrafts) {
    const project = projectById.get(draft.projectId);
    if (!project) {
      continue;
    }
    const page = await ensureProjectPage(input.notion, mapping, input.bundle.date, project);
    projectPages[draft.projectId] = { pageId: page.pageId, url: page.url };
    projectLinks.push({ title: `${project.name} 상세`, url: page.url });
    await appendBlocks(input.notion.token, page.pageId, [
      sectionHeading(`${new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })} 업데이트`),
      ...(await markdownishToNotionBlocks(draft.body, resolveUploadId)),
    ]);
  }

  await appendBlocks(input.notion.token, overallPage.pageId, [
    sectionHeading(`${new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })} 업데이트`),
    ...projectLinksBlocks(projectLinks),
    ...(await markdownishToNotionBlocks(input.bundle.overallDraft, resolveUploadId)),
  ]);

  return {
    notion: input.notion,
    mapping: {
      date: input.bundle.date,
      overallPageId: overallPage.pageId,
      overallPageUrl: overallPage.url,
      projectPages,
      publishedEntryIds: [...new Set([...mapping.publishedEntryIds, ...input.bundle.sourceEntryIds])],
      lastPublishedAt: new Date().toISOString(),
    },
  };
}
