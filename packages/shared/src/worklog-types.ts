export type WorklogEntrySource = "manual";
export type WorklogEntryStatus = "recorded" | "published";

export interface Project {
  id: string;
  slug: string;
  name: string;
  active: boolean;
  defaultPromptHint?: string;
}

export interface StoredImageAsset {
  name: string;
  mimeType: string;
  relativePath: string;
}

export interface Entry {
  id: string;
  createdAt: string;
  projectId: string;
  text: string;
  imagePaths: StoredImageAsset[];
  source: WorklogEntrySource;
  status: WorklogEntryStatus;
}

export interface ProjectDraft {
  projectId: string;
  projectName: string;
  body: string;
  sourceEntryIds: string[];
}

export interface NotionTargets {
  overallPageId?: string;
  overallPageUrl?: string;
  projectPageIds: Record<string, string>;
  projectPageUrls: Record<string, string>;
}

export interface DraftBundle {
  date: string;
  generatedAt: string;
  sourceEntryIds: string[];
  overallDraft: string;
  projectDrafts: ProjectDraft[];
  previewHtml: string;
  notionTargets: NotionTargets;
  revisionCount: number;
}

export interface DailyPublishMapping {
  date: string;
  overallPageId?: string;
  overallPageUrl?: string;
  projectPages: Record<string, { pageId: string; url?: string }>;
  publishedEntryIds: string[];
  lastPublishedAt?: string;
}

export interface NotionBootstrapState {
  token: string;
  parentPageId: string;
  projectsDatabaseId: string;
  dailyReportsDatabaseId: string;
  projectUpdatesDatabaseId: string;
  projectsPageIds: Record<string, string>;
}

export interface WorklogSettings {
  defaultLanguage: "ko";
  dataDir: string;
  defaultProjectId?: string;
  notionParentPageId?: string;
}

export interface WorklogState {
  lastPublishedEntryId: string | null;
  dailyMappings: Record<string, DailyPublishMapping>;
  notion?: NotionBootstrapState;
  settings: WorklogSettings;
}

export interface StatusCheck {
  ok: boolean;
  message: string;
}

export interface CodexStatus extends StatusCheck {
  version?: string;
  loginStatus?: string;
}

export interface NotionStatus extends StatusCheck {
  configured: boolean;
  parentPageId?: string;
  bootstrapComplete: boolean;
}

export interface CreateEntryImageInput {
  name: string;
  mimeType: string;
  dataBase64: string;
}

export interface AppSnapshot {
  projects: Project[];
  recentEntries: Entry[];
  draftBundle: DraftBundle | null;
  state: WorklogState;
  codexStatus: CodexStatus;
  notionStatus: NotionStatus;
}
