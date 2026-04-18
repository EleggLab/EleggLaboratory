import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type {
  CreateEntryImageInput,
  DailyPublishMapping,
  DraftBundle,
  Entry,
  NotionBootstrapState,
  Project,
  WorklogState,
} from "@tong/shared";

interface StoredEntryRecord {
  dateKey: string;
  filePath: string;
  entry: Entry;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const DATA_ROOT = path.join(REPO_ROOT, "data", "worklog");
const PROJECTS_PATH = path.join(DATA_ROOT, "projects", "projects.json");
const STATE_PATH = path.join(DATA_ROOT, "state", "state.json");
const DRAFTS_DIR = path.join(DATA_ROOT, "drafts");
const ENTRIES_DIR = path.join(DATA_ROOT, "entries");
const UPLOADS_DIR = path.join(DATA_ROOT, "uploads");
const TMP_DIR = path.join(DATA_ROOT, "tmp");

const DEFAULT_PROJECT: Project = {
  id: "project-general",
  slug: "general",
  name: "General",
  active: true,
};

function getCurrentDateKey(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function sanitizeFilePart(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "file";
}

function fileExtensionForMimeType(mimeType: string): string {
  const map: Record<string, string> = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/svg+xml": ".svg",
    "image/bmp": ".bmp",
  };
  return map[mimeType] ?? ".bin";
}

async function ensureDir(targetDir: string): Promise<void> {
  await fs.mkdir(targetDir, { recursive: true });
}

async function ensureBaseDirs(): Promise<void> {
  await Promise.all([
    ensureDir(path.dirname(PROJECTS_PATH)),
    ensureDir(path.dirname(STATE_PATH)),
    ensureDir(DRAFTS_DIR),
    ensureDir(ENTRIES_DIR),
    ensureDir(UPLOADS_DIR),
    ensureDir(TMP_DIR),
  ]);
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJsonFile(filePath: string, value: unknown): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function createDefaultState(): WorklogState {
  return {
    lastPublishedEntryId: null,
    dailyMappings: {},
    settings: {
      defaultLanguage: "ko",
      dataDir: DATA_ROOT,
      defaultProjectId: DEFAULT_PROJECT.id,
    },
  };
}

export async function getDataRoot(): Promise<string> {
  await ensureBaseDirs();
  return DATA_ROOT;
}

export async function getTmpDir(): Promise<string> {
  await ensureBaseDirs();
  return TMP_DIR;
}

export async function loadProjects(): Promise<Project[]> {
  await ensureBaseDirs();
  const existing = await readJsonFile<Project[]>(PROJECTS_PATH, []);
  if (existing.length > 0) {
    return existing;
  }
  await writeJsonFile(PROJECTS_PATH, [DEFAULT_PROJECT]);
  return [DEFAULT_PROJECT];
}

export async function saveProjects(projects: Project[]): Promise<Project[]> {
  const nextProjects = projects.length > 0 ? projects : [DEFAULT_PROJECT];
  await writeJsonFile(PROJECTS_PATH, nextProjects);
  const state = await loadState();
  if (!nextProjects.some((project) => project.id === state.settings.defaultProjectId)) {
    await saveState({
      ...state,
      settings: {
        ...state.settings,
        defaultProjectId: nextProjects[0]!.id,
      },
    });
  }
  return nextProjects;
}

export async function upsertProject(projectInput: Omit<Project, "id"> & { id?: string }): Promise<Project[]> {
  const projects = await loadProjects();
  const nextProject: Project = {
    id: projectInput.id ?? `project-${randomUUID()}`,
    slug: projectInput.slug,
    name: projectInput.name,
    active: projectInput.active,
    ...(projectInput.defaultPromptHint ? { defaultPromptHint: projectInput.defaultPromptHint } : {}),
  };
  const index = projects.findIndex((project) => project.id === nextProject.id);
  if (index >= 0) {
    projects[index] = nextProject;
  } else {
    projects.push(nextProject);
  }
  return saveProjects(projects);
}

export async function loadState(): Promise<WorklogState> {
  await ensureBaseDirs();
  const state = await readJsonFile<WorklogState>(STATE_PATH, createDefaultState());
  return {
    lastPublishedEntryId: state.lastPublishedEntryId ?? null,
    dailyMappings: state.dailyMappings ?? {},
    ...(state.notion ? { notion: state.notion } : {}),
    settings: {
      defaultLanguage: "ko",
      dataDir: DATA_ROOT,
      ...(state.settings?.defaultProjectId
        ? { defaultProjectId: state.settings.defaultProjectId }
        : { defaultProjectId: DEFAULT_PROJECT.id }),
      ...(state.settings?.notionParentPageId
        ? { notionParentPageId: state.settings.notionParentPageId }
        : {}),
    },
  };
}

export async function saveState(nextState: WorklogState): Promise<WorklogState> {
  await writeJsonFile(STATE_PATH, nextState);
  return nextState;
}

export async function updateSettings(defaultProjectId?: string): Promise<WorklogState> {
  const state = await loadState();
  const nextState: WorklogState = {
    ...state,
    settings: {
      ...state.settings,
      ...(defaultProjectId ? { defaultProjectId } : {}),
    },
  };
  return saveState(nextState);
}

export async function saveNotionState(notion: NotionBootstrapState): Promise<WorklogState> {
  const state = await loadState();
  const nextState: WorklogState = {
    ...state,
    notion,
    settings: {
      ...state.settings,
      notionParentPageId: notion.parentPageId,
    },
  };
  return saveState(nextState);
}

export async function saveDailyMapping(mapping: DailyPublishMapping): Promise<WorklogState> {
  const state = await loadState();
  const nextState: WorklogState = {
    ...state,
    dailyMappings: {
      ...state.dailyMappings,
      [mapping.date]: mapping,
    },
  };
  return saveState(nextState);
}

export async function saveLastPublishedEntryId(entryId: string | null): Promise<WorklogState> {
  const state = await loadState();
  const nextState: WorklogState = {
    ...state,
    lastPublishedEntryId: entryId,
  };
  return saveState(nextState);
}

async function listEntryFilesForDate(dateKey: string): Promise<StoredEntryRecord[]> {
  const dateDir = path.join(ENTRIES_DIR, dateKey);
  try {
    const files = await fs.readdir(dateDir);
    const records = await Promise.all(
      files
        .filter((fileName) => fileName.endsWith(".json"))
        .map(async (fileName) => {
          const filePath = path.join(dateDir, fileName);
          const raw = await fs.readFile(filePath, "utf8");
          return {
            dateKey,
            filePath,
            entry: JSON.parse(raw) as Entry,
          } satisfies StoredEntryRecord;
        }),
    );
    return records;
  } catch {
    return [];
  }
}

async function listAllEntryRecords(): Promise<StoredEntryRecord[]> {
  await ensureBaseDirs();
  try {
    const dirs = await fs.readdir(ENTRIES_DIR, { withFileTypes: true });
    const records = await Promise.all(
      dirs
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => listEntryFilesForDate(dirent.name)),
    );
    return records
      .flat()
      .sort((left, right) => Date.parse(left.entry.createdAt) - Date.parse(right.entry.createdAt));
  } catch {
    return [];
  }
}

export async function listEntries(options?: { date?: string; projectId?: string }): Promise<Entry[]> {
  const records = options?.date
    ? await listEntryFilesForDate(options.date)
    : await listAllEntryRecords();
  return records
    .map((record) => record.entry)
    .filter((entry) => !options?.projectId || entry.projectId === options.projectId)
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
}

export async function listRecentEntries(limit = 20): Promise<Entry[]> {
  const entries = await listEntries();
  return entries.slice(0, limit);
}

export async function createEntry(input: {
  projectId: string;
  text: string;
  images: CreateEntryImageInput[];
  source: Entry["source"];
}): Promise<Entry> {
  const projects = await loadProjects();
  if (!projects.some((project) => project.id === input.projectId)) {
    throw new Error("존재하지 않는 프로젝트입니다.");
  }

  const entryId = `entry-${randomUUID()}`;
  const dateKey = getCurrentDateKey();
  const createdAt = new Date().toISOString();
  const uploadsForEntry: Entry["imagePaths"] = [];
  const uploadDir = path.join(UPLOADS_DIR, dateKey, entryId);
  await ensureDir(uploadDir);

  for (const [index, image] of input.images.entries()) {
    const extension = fileExtensionForMimeType(image.mimeType);
    const baseName = sanitizeFilePart(path.parse(image.name).name || `image-${index + 1}`);
    const fileName = `${String(index + 1).padStart(2, "0")}-${baseName}${extension}`;
    const absolutePath = path.join(uploadDir, fileName);
    const relativePath = path.posix.join(dateKey, entryId, fileName);
    const buffer = Buffer.from(image.dataBase64, "base64");
    await fs.writeFile(absolutePath, buffer);
    uploadsForEntry.push({
      name: image.name,
      mimeType: image.mimeType,
      relativePath,
    });
  }

  const entry: Entry = {
    id: entryId,
    createdAt,
    projectId: input.projectId,
    text: input.text.trim(),
    imagePaths: uploadsForEntry,
    source: input.source,
    status: "recorded",
  };

  const filePath = path.join(ENTRIES_DIR, dateKey, `${entryId}.json`);
  await writeJsonFile(filePath, entry);
  return entry;
}

export async function resolveEntriesForDraft(date: string): Promise<Entry[]> {
  const state = await loadState();
  const records = await listAllEntryRecords();
  const cursorIndex = state.lastPublishedEntryId
    ? records.findIndex((record) => record.entry.id === state.lastPublishedEntryId)
    : -1;
  return records
    .filter((record, index) => record.dateKey === date && index > cursorIndex)
    .map((record) => record.entry);
}

export async function markEntriesPublished(entryIds: string[]): Promise<void> {
  if (entryIds.length === 0) {
    return;
  }
  const records = await listAllEntryRecords();
  const targets = new Map(records.map((record) => [record.entry.id, record]));
  await Promise.all(
    entryIds.map(async (entryId) => {
      const record = targets.get(entryId);
      if (!record) {
        return;
      }
      const nextEntry: Entry = {
        ...record.entry,
        status: "published",
      };
      await writeJsonFile(record.filePath, nextEntry);
    }),
  );
}

export async function loadDraftBundle(date: string): Promise<DraftBundle | null> {
  const draftPath = path.join(DRAFTS_DIR, `${date}.json`);
  return readJsonFile<DraftBundle | null>(draftPath, null);
}

export async function saveDraftBundle(bundle: DraftBundle): Promise<DraftBundle> {
  const draftPath = path.join(DRAFTS_DIR, `${bundle.date}.json`);
  await writeJsonFile(draftPath, bundle);
  return bundle;
}

export async function getAppSnapshot(date = getCurrentDateKey()): Promise<{
  projects: Project[];
  recentEntries: Entry[];
  draftBundle: DraftBundle | null;
  state: WorklogState;
}> {
  const [projects, recentEntries, draftBundle, state] = await Promise.all([
    loadProjects(),
    listRecentEntries(20),
    loadDraftBundle(date),
    loadState(),
  ]);
  return { projects, recentEntries, draftBundle, state };
}

export function getTodayDateKey(): string {
  return getCurrentDateKey();
}

export async function readUploadFile(relativePath: string): Promise<Buffer> {
  const absolutePath = path.join(UPLOADS_DIR, relativePath);
  return fs.readFile(absolutePath);
}

export async function resolveUploadAbsolutePath(relativePath: string): Promise<string> {
  return path.join(UPLOADS_DIR, relativePath);
}

export function guessMimeType(relativePath: string): string {
  const extension = path.extname(relativePath).toLowerCase();
  const map: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".bmp": "image/bmp",
  };
  return map[extension] ?? "application/octet-stream";
}
