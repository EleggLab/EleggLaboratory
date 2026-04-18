import type {
  AppSnapshot,
  DraftBundle,
  Entry,
  NotionStatus,
  Project,
  ProjectDraft,
  WorklogState,
} from "@tong/shared";

async function parseJsonOrThrow<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as { message?: string };
  if (!response.ok) {
    throw new Error(payload.message ?? "요청을 처리하지 못했습니다.");
  }
  return payload as T;
}

export async function fetchAppSnapshot(date: string): Promise<AppSnapshot> {
  return parseJsonOrThrow<AppSnapshot>(await fetch(`/api/app?date=${encodeURIComponent(date)}`));
}

export async function saveProject(project: Omit<Project, "id"> & { id?: string }): Promise<Project[]> {
  const response = await fetch("/api/projects", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(project),
  });
  return (await parseJsonOrThrow<{ projects: Project[] }>(response)).projects;
}

export async function saveSettings(defaultProjectId?: string): Promise<WorklogState> {
  const response = await fetch("/api/settings", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(defaultProjectId ? { defaultProjectId } : {}),
  });
  return (await parseJsonOrThrow<{ state: WorklogState }>(response)).state;
}

export async function createEntry(input: {
  projectId: string;
  text: string;
  images: Array<{ name: string; mimeType: string; dataBase64: string }>;
}): Promise<{ entry: Entry; recentEntries: Entry[] }> {
  const response = await fetch("/api/entries", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...input, source: "manual" }),
  });
  return parseJsonOrThrow<{ entry: Entry; recentEntries: Entry[] }>(response);
}

export async function generateDraft(date: string): Promise<DraftBundle> {
  const response = await fetch("/api/drafts/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ date }),
  });
  return (await parseJsonOrThrow<{ draftBundle: DraftBundle }>(response)).draftBundle;
}

export async function refineDraft(
  date: string,
  overallDraft: string,
  projectDrafts: ProjectDraft[],
): Promise<DraftBundle> {
  const response = await fetch("/api/drafts/refine", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ date, overallDraft, projectDrafts }),
  });
  return (await parseJsonOrThrow<{ draftBundle: DraftBundle }>(response)).draftBundle;
}

export async function publishDraft(date: string): Promise<{ draftBundle: DraftBundle }> {
  const response = await fetch("/api/publish", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ date }),
  });
  return parseJsonOrThrow<{ draftBundle: DraftBundle }>(response);
}

export async function bootstrapNotion(
  token: string,
  parentPageIdOrUrl: string,
  forceRecreate = false,
): Promise<NotionStatus> {
  const response = await fetch("/api/setup/notion/bootstrap", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token, parentPageIdOrUrl, forceRecreate }),
  });
  return (await parseJsonOrThrow<{ notionStatus: NotionStatus }>(response)).notionStatus;
}
