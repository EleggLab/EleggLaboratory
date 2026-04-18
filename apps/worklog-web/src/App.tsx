import { useEffect, useMemo, useState } from "react";
import type { AppSnapshot, DraftBundle, Project } from "@tong/shared";
import {
  bootstrapNotion,
  createEntry,
  fetchAppSnapshot,
  generateDraft,
  publishDraft,
  refineDraft,
  saveProject,
  saveSettings,
} from "./lib/api";
import { buildPreviewHtml, uploadPreviewUrl } from "./lib/preview";

type TabKey = "inbox" | "review" | "settings";
type DraftTabKey = "overall" | string;
type Tone = "neutral" | "success" | "error";
type StepState = "complete" | "active" | "pending";
type EntryScope = "selected" | "recent";
type IconName = "inbox" | "review" | "settings" | "calendar" | "image" | "draft" | "project" | "status";

type PendingImage = {
  id: string;
  name: string;
  mimeType: string;
  dataBase64: string;
  previewUrl: string;
};

function UiIcon({ name }: { name: IconName }) {
  const props = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "ui-icon",
    "aria-hidden": true,
  };

  switch (name) {
    case "inbox":
      return (
        <svg {...props}>
          <path d="M4 6.5h16v10.5a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" />
          <path d="M4 13h4l2 3h4l2 -3h4" />
        </svg>
      );
    case "review":
      return (
        <svg {...props}>
          <path d="M4.5 6.5h9l6 6v5a2 2 0 0 1 -2 2h-13a2 2 0 0 1 -2 -2v-9a2 2 0 0 1 2 -2z" />
          <path d="M13.5 6.5v6h6" />
          <path d="M8 15h6" />
        </svg>
      );
    case "settings":
      return (
        <svg {...props}>
          <path d="M12 8.5a3.5 3.5 0 1 0 0 7a3.5 3.5 0 0 0 0 -7z" />
          <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a1.2 1.2 0 0 1 0 1.7l-1.2 1.2a1.2 1.2 0 0 1 -1.7 0l-.1-.1a1 1 0 0 0 -1.1 -.2a1 1 0 0 0 -.6 .9v.3a1.2 1.2 0 0 1 -1.2 1.2h-1.6a1.2 1.2 0 0 1 -1.2 -1.2v-.2a1 1 0 0 0 -.7 -1a1 1 0 0 0 -1 .2l-.2 .1a1.2 1.2 0 0 1 -1.7 0l-1.2 -1.2a1.2 1.2 0 0 1 0 -1.7l.1-.1a1 1 0 0 0 .2 -1.1a1 1 0 0 0 -.9 -.6h-.3a1.2 1.2 0 0 1 -1.2 -1.2v-1.6a1.2 1.2 0 0 1 1.2 -1.2h.2a1 1 0 0 0 1 -.7a1 1 0 0 0 -.2 -1l-.1-.2a1.2 1.2 0 0 1 0 -1.7l1.2 -1.2a1.2 1.2 0 0 1 1.7 0l.1 .1a1 1 0 0 0 1.1 .2a1 1 0 0 0 .6 -.9v-.3a1.2 1.2 0 0 1 1.2 -1.2h1.6a1.2 1.2 0 0 1 1.2 1.2v.2a1 1 0 0 0 .7 1a1 1 0 0 0 1 -.2l.2-.1a1.2 1.2 0 0 1 1.7 0l1.2 1.2a1.2 1.2 0 0 1 0 1.7l-.1 .1a1 1 0 0 0 -.2 1.1a1 1 0 0 0 .9 .6h.3a1.2 1.2 0 0 1 1.2 1.2v1.6a1.2 1.2 0 0 1 -1.2 1.2h-.2a1 1 0 0 0 -1 .7z" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...props}>
          <path d="M5 6h14a1.5 1.5 0 0 1 1.5 1.5v10A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1 -1.5 -1.5v-10A1.5 1.5 0 0 1 5 6z" />
          <path d="M8 4v4" />
          <path d="M16 4v4" />
          <path d="M3.5 10.5h17" />
        </svg>
      );
    case "image":
      return (
        <svg {...props}>
          <rect x="4" y="5" width="16" height="14" rx="2" />
          <path d="M8 14l2.5 -2.5a1.5 1.5 0 0 1 2.1 0l4.4 4.5" />
          <path d="M14 13l1.3 -1.3a1.5 1.5 0 0 1 2.1 0l2.1 2.3" />
          <circle cx="9" cy="9.5" r="1.2" />
        </svg>
      );
    case "draft":
      return (
        <svg {...props}>
          <path d="M6 4.5h8l4 4v11a1.5 1.5 0 0 1 -1.5 1.5h-10A1.5 1.5 0 0 1 5 19.5v-13A1.5 1.5 0 0 1 6.5 5z" />
          <path d="M14 4.5v4h4" />
          <path d="M8 12h8" />
          <path d="M8 16h5" />
        </svg>
      );
    case "project":
      return (
        <svg {...props}>
          <path d="M4 7.5h7v5H4z" />
          <path d="M13 7.5h7v5h-7z" />
          <path d="M4 14.5h7v5H4z" />
          <path d="M13 14.5h7v5h-7z" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v5" />
          <path d="M12 16h.01" />
        </svg>
      );
  }
}

function IconBadge({ name, tone = "default" }: { name: IconName; tone?: "default" | "success" | "warn" | "accent" }) {
  return (
    <span className={`icon-badge ${tone}`}>
      <UiIcon name={name} />
    </span>
  );
}

const MAX_IMAGES = 12;
const TAB_META: Record<TabKey, { label: string; description: string }> = {
  inbox: { label: "기록", description: "메모와 캡처 저장" },
  review: { label: "검토", description: "초안 생성과 발행" },
  settings: { label: "설정", description: "프로젝트와 Notion 연결" },
};

function todayKey(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function dateKey(iso: string): string {
  return iso.slice(0, 10);
}

function formatAt(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function ensureSlug(value: string): string {
  const slug = slugify(value);
  if (!slug) {
    throw new Error("슬러그는 영문, 숫자, 하이픈만 사용할 수 있습니다.");
  }
  return slug;
}

function extractPossibleNotionId(value: string): string | null {
  const match = value.trim().match(/[0-9a-fA-F]{32}|[0-9a-fA-F-]{36}/);
  return match ? match[0].replaceAll("-", "").toLowerCase() : null;
}

function compactValue(value: string | undefined, fallback = "미설정", maxLength = 28): string {
  if (!value?.trim()) {
    return fallback;
  }
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function draftView(bundle: DraftBundle | null, draftTab: DraftTabKey) {
  if (!bundle) {
    return null;
  }
  if (draftTab === "overall") {
    return { title: "전체 보고", body: bundle.overallDraft };
  }
  const projectDraft = bundle.projectDrafts.find((draft) => draft.projectId === draftTab);
  return projectDraft ? { title: projectDraft.projectName, body: projectDraft.body } : null;
}

function updateDraft(bundle: DraftBundle | null, draftTab: DraftTabKey, body: string) {
  if (!bundle) {
    return null;
  }
  const next =
    draftTab === "overall"
      ? { ...bundle, overallDraft: body }
      : {
          ...bundle,
          projectDrafts: bundle.projectDrafts.map((draft) =>
            draft.projectId === draftTab ? { ...draft, body } : draft,
          ),
        };
  return { ...next, previewHtml: buildPreviewHtml(next) };
}

async function toPendingImage(file: File): Promise<PendingImage> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("이미지를 읽지 못했습니다."));
    reader.readAsDataURL(file);
  });
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: file.name || `capture-${Date.now()}.png`,
    mimeType: file.type || "image/png",
    dataBase64: dataUrl.split(",", 2)[1] || "",
    previewUrl: dataUrl,
  };
}

export default function App() {
  const [date, setDate] = useState(todayKey);
  const [activeTab, setActiveTab] = useState<TabKey>("inbox");
  const [draftTab, setDraftTab] = useState<DraftTabKey>("overall");
  const [snapshot, setSnapshot] = useState<AppSnapshot | null>(null);
  const [draftBundle, setDraftBundle] = useState<DraftBundle | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [entryScope, setEntryScope] = useState<EntryScope>("selected");
  const [entryText, setEntryText] = useState("");
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [projectsForm, setProjectsForm] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectSlug, setNewProjectSlug] = useState("");
  const [notionToken, setNotionToken] = useState("");
  const [notionParentPage, setNotionParentPage] = useState("");
  const [notionResetArmed, setNotionResetArmed] = useState(false);
  const [notionResetPhrase, setNotionResetPhrase] = useState("");
  const [showNotionAdvanced, setShowNotionAdvanced] = useState(false);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<Tone>("neutral");
  const [busy, setBusy] = useState(false);

  const defaultProjectSlug = useMemo(
    () => new URLSearchParams(window.location.search).get("project") ?? "",
    [],
  );
  const selectedDraft = useMemo(() => draftView(draftBundle, draftTab), [draftBundle, draftTab]);
  const projectMap = useMemo(
    () => new Map((snapshot?.projects ?? []).map((project) => [project.id, project])),
    [snapshot?.projects],
  );
  const entriesForDate = useMemo(
    () => (snapshot?.recentEntries ?? []).filter((entry) => dateKey(entry.createdAt) === date),
    [snapshot?.recentEntries, date],
  );
  const selectedDateImageCount = useMemo(
    () => entriesForDate.reduce((count, entry) => count + entry.imagePaths.length, 0),
    [entriesForDate],
  );
  const activeProjectCount = useMemo(
    () => (snapshot?.projects ?? []).filter((project) => project.active).length,
    [snapshot?.projects],
  );
  const selectedProjectName = useMemo(
    () => projectMap.get(selectedProjectId)?.name ?? "프로젝트 선택 필요",
    [projectMap, selectedProjectId],
  );
  const feedEntries = useMemo(
    () => (entryScope === "selected" ? entriesForDate : snapshot?.recentEntries ?? []),
    [entryScope, entriesForDate, snapshot?.recentEntries],
  );

  const codexReady = snapshot?.codexStatus.ok ?? false;
  const notionReady = snapshot?.notionStatus.configured ?? false;
  const notionWorkspaceCreated = Boolean(snapshot?.state.settings.notionParentPageId);
  const notionRebuildConfirmed = notionResetArmed && notionResetPhrase.trim() === "재생성";
  const currentParentId = extractPossibleNotionId(snapshot?.state.settings.notionParentPageId ?? "") ?? "";
  const pendingParentId = extractPossibleNotionId(notionParentPage) ?? "";
  const pendingMatchesCurrentParent = Boolean(currentParentId && pendingParentId && currentParentId === pendingParentId);
  const notionDatabaseCount = [
    snapshot?.state.notion?.projectsDatabaseId,
    snapshot?.state.notion?.dailyReportsDatabaseId,
    snapshot?.state.notion?.projectUpdatesDatabaseId,
  ].filter(Boolean).length;
  const notionActionSummary = !notionWorkspaceCreated
    ? "입력한 Parent Page 아래에 데이터베이스 3개를 처음 생성합니다."
    : !notionResetArmed
      ? "현재 연결을 유지합니다. 발행 기능만 계속 사용할 수 있습니다."
      : !notionParentPage.trim()
        ? "새 Parent Page를 입력하면 재연결 대상을 미리 볼 수 있습니다."
        : !notionRebuildConfirmed
          ? "확인 문구를 입력하면 재연결용 데이터베이스 3개를 다시 만들 수 있습니다."
          : pendingMatchesCurrentParent
            ? "현재와 같은 Parent Page 아래에 데이터베이스 3개를 다시 생성합니다."
            : "새 Parent Page 아래에 데이터베이스 3개를 다시 생성하고 연결 대상을 바꿉니다.";
  const connectionTone =
    !notionWorkspaceCreated ? "accent" : notionRebuildConfirmed || notionResetArmed ? "warn" : "default";
  const publishedForDate = Boolean(
    snapshot?.state.dailyMappings[date]?.overallPageId || snapshot?.state.dailyMappings[date]?.overallPageUrl,
  );
  const canGenerate = !busy && entriesForDate.length > 0 && codexReady;
  const canRefine = !busy && Boolean(draftBundle) && codexReady;
  const canPublish = !busy && Boolean(draftBundle) && notionReady;
  const canBootstrapNotion =
    !busy &&
    Boolean(notionToken.trim()) &&
    Boolean(notionParentPage.trim()) &&
    (!notionWorkspaceCreated || notionRebuildConfirmed);
  const reviewChecks = [
    {
      label: "Codex 연결",
      ok: codexReady,
      detail: codexReady ? "초안 생성과 재작성이 가능합니다." : "Codex 로그인 상태를 먼저 확인해야 합니다.",
    },
    {
      label: "선택 날짜 기록",
      ok: entriesForDate.length > 0,
      detail:
        entriesForDate.length > 0
          ? `${entriesForDate.length}개의 기록이 초안 대상입니다.`
          : "선택한 날짜에 아직 저장된 기록이 없습니다.",
    },
    {
      label: "초안 준비",
      ok: Boolean(draftBundle),
      detail: draftBundle ? "초안을 열어 직접 수정할 수 있습니다." : "초안을 먼저 생성해야 합니다.",
    },
    {
      label: "Notion 연결",
      ok: notionReady,
      detail: notionReady ? "등록 버튼으로 바로 발행할 수 있습니다." : "Settings에서 Notion 구조를 먼저 생성해야 합니다.",
    },
  ];

  const steps: Array<{
    id: TabKey;
    title: string;
    summary: string;
    action: string;
    state: StepState;
  }> = [
    {
      id: "settings",
      title: "환경 연결",
      summary: notionReady
        ? "프로젝트와 Notion 연결이 준비됐습니다."
        : "프로젝트를 정리하고 Notion 구조를 먼저 만들어 두세요.",
      action: notionReady ? "설정 확인" : "설정하기",
      state: notionReady ? "complete" : "active",
    },
    {
      id: "inbox",
      title: "작업 기록",
      summary:
        entriesForDate.length > 0
          ? `${entriesForDate.length}개의 기록이 선택한 날짜에 저장되어 있습니다.`
          : "메모와 캡처를 빠르게 저장하세요.",
      action: entriesForDate.length > 0 ? "기록 보기" : "기록 저장",
      state: entriesForDate.length > 0 ? "complete" : notionReady ? "active" : "pending",
    },
    {
      id: "review",
      title: "초안 정리",
      summary: draftBundle
        ? `초안 준비 완료, 현재 ${draftBundle.revisionCount}회 재작성되었습니다.`
        : "전체 보고와 프로젝트별 업데이트 초안을 생성합니다.",
      action: draftBundle ? "초안 검토" : "초안 만들기",
      state: draftBundle ? "complete" : entriesForDate.length > 0 ? "active" : "pending",
    },
    {
      id: "review",
      title: "최종 등록",
      summary: publishedForDate
        ? "같은 날짜 페이지에 다시 발행하면 내용을 덧붙여 갱신합니다."
        : "검토가 끝난 초안을 Daily Reports와 Project Updates에 등록합니다.",
      action: publishedForDate ? "발행 상태 보기" : "발행 준비 보기",
      state: publishedForDate ? "complete" : draftBundle && notionReady ? "active" : "pending",
    },
  ];

  const nextStep = steps.find((step) => step.state === "active") ?? steps[0]!;

  async function refresh(nextDate = date) {
    const next = await fetchAppSnapshot(nextDate);
    setSnapshot(next);
    setDraftBundle(next.draftBundle);
    setProjectsForm(next.projects);
    setSelectedProjectId((current) => {
      if (current && next.projects.some((project) => project.id === current)) {
        return current;
      }
      return (
        next.projects.find((project) => project.slug === defaultProjectSlug)?.id ||
        next.state.settings.defaultProjectId ||
        next.projects[0]?.id ||
        ""
      );
    });
  }

  useEffect(() => {
    void refresh(date);
  }, [date]);

  useEffect(() => {
    if (!draftBundle) {
      setDraftTab("overall");
      return;
    }
    if (draftTab !== "overall" && !draftBundle.projectDrafts.some((draft) => draft.projectId === draftTab)) {
      setDraftTab("overall");
    }
  }, [draftBundle, draftTab]);

  function pushMessage(text: string, nextTone: Tone) {
    setMessage(text);
    setTone(nextTone);
  }

  async function runTask(task: () => Promise<void>) {
    setBusy(true);
    try {
      setMessage("");
      await task();
    } catch (error) {
      pushMessage(error instanceof Error ? error.message : "작업을 처리하지 못했습니다.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function attachFiles(files: FileList | File[]) {
    const images = [...files].filter((file) => file.type.startsWith("image/"));
    if (!images.length) {
      return;
    }
    const remaining = Math.max(0, MAX_IMAGES - pendingImages.length);
    const accepted = images.slice(0, remaining);
    if (!accepted.length) {
      pushMessage(`이미지는 최대 ${MAX_IMAGES}개까지 첨부할 수 있습니다.`, "error");
      return;
    }
    const converted = await Promise.all(accepted.map(toPendingImage));
    setPendingImages((current) => [...current, ...converted]);
    if (accepted.length < images.length) {
      pushMessage(`이미지는 최대 ${MAX_IMAGES}개까지만 첨부됩니다.`, "neutral");
    }
  }

  async function submitEntry() {
    if (!selectedProjectId) {
      pushMessage("프로젝트를 먼저 선택해 주세요.", "error");
      return;
    }
    if (!entryText.trim() && !pendingImages.length) {
      pushMessage("메모나 이미지를 하나 이상 넣어 주세요.", "error");
      return;
    }
    await runTask(async () => {
      await createEntry({
        projectId: selectedProjectId,
        text: entryText,
        images: pendingImages.map((image) => ({
          name: image.name,
          mimeType: image.mimeType,
          dataBase64: image.dataBase64,
        })),
      });
      setEntryText("");
      setPendingImages([]);
      pushMessage("기록을 저장했습니다.", "success");
      await refresh();
    });
  }

  return (
    <div className="page-shell">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />
      <header className="hero-panel">
        <div>
          <p className="eyebrow">WORKLOG LOCAL INBOX</p>
          <h1>기록, 초안, Notion 등록까지 한 흐름으로 정리합니다</h1>
          <p className="hero-copy">
            메모와 캡처를 저장하고, 선택한 날짜의 기록만 모아 보고서형 초안으로 정리한 뒤, 만족하면
            Notion에 등록하는 작업일지입니다.
          </p>
          <div className="hero-summary">
            <span className="summary-pill">로컬 원본 저장</span>
            <span className="summary-pill">선택 날짜 기준 초안</span>
            <span className="summary-pill">전체 보고 + 프로젝트별 업데이트</span>
          </div>
        </div>
        <div className="hero-actions">
          <label className="date-control">
            <span>작업 날짜</span>
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </label>
          <div className="status-grid">
            <div className={`status-pill ${codexReady ? "ok" : "warn"}`}>
              <div className="status-head">
                <IconBadge name="status" tone={codexReady ? "success" : "warn"} />
                <strong>Codex</strong>
              </div>
              <span>{snapshot?.codexStatus.message ?? "상태를 확인하고 있습니다."}</span>
            </div>
            <div className={`status-pill ${snapshot?.notionStatus.ok ? "ok" : "warn"}`}>
              <div className="status-head">
                <IconBadge name="status" tone={snapshot?.notionStatus.ok ? "success" : "warn"} />
                <strong>Notion</strong>
              </div>
              <span>{snapshot?.notionStatus.message ?? "상태를 확인하고 있습니다."}</span>
            </div>
          </div>
          <div className="next-action-card">
            <p className="next-action-label">지금 가장 먼저 할 일</p>
            <strong>{nextStep.title}</strong>
            <p>{nextStep.summary}</p>
            <button type="button" className="action-button accent" onClick={() => setActiveTab(nextStep.id)}>
              {nextStep.action}
            </button>
          </div>
        </div>
      </header>
      <section className="workflow-grid" aria-label="workflow">
        {steps.map((step, index) => (
          <button key={`${step.title}-${index}`} type="button" className={`workflow-card ${step.state}`} onClick={() => setActiveTab(step.id)}>
            <div className="workflow-topline">
              <span className="step-index">STEP {index + 1}</span>
              <span className={`step-state ${step.state}`}>
                {step.state === "complete" ? "완료" : step.state === "active" ? "다음 행동" : "준비 중"}
              </span>
            </div>
            <strong>{step.title}</strong>
            <p>{step.summary}</p>
          </button>
        ))}
      </section>
      <section className="metric-strip" aria-label="workspace summary">
        <article className="metric-card">
          <div className="metric-topline">
            <IconBadge name="calendar" tone="accent" />
            <span className="metric-label">선택 날짜 기록</span>
          </div>
          <strong className="metric-value">{entriesForDate.length}</strong>
          <p>초안 생성에 반영될 원본 항목 수</p>
        </article>
        <article className="metric-card">
          <div className="metric-topline">
            <IconBadge name="image" tone="accent" />
            <span className="metric-label">첨부 이미지</span>
          </div>
          <strong className="metric-value">{selectedDateImageCount}</strong>
          <p>선택 날짜 기록에 연결된 캡처 수</p>
        </article>
        <article className={`metric-card ${draftBundle ? "ready" : "pending"}`}>
          <div className="metric-topline">
            <IconBadge name="draft" tone={draftBundle ? "success" : "warn"} />
            <span className="metric-label">초안 상태</span>
          </div>
          <strong className="metric-value">{draftBundle ? "준비됨" : "없음"}</strong>
          <p>{draftBundle ? `재작성 ${draftBundle.revisionCount}회` : "검토 탭에서 생성 필요"}</p>
        </article>
        <article className="metric-card">
          <div className="metric-topline">
            <IconBadge name="project" tone="accent" />
            <span className="metric-label">활성 프로젝트</span>
          </div>
          <strong className="metric-value">{activeProjectCount}</strong>
          <p>현재 작업일지 분류에 사용되는 프로젝트 수</p>
        </article>
      </section>
      <nav className="tab-strip" aria-label="main tabs">
        {(Object.keys(TAB_META) as TabKey[]).map((tab) => (
          <button key={tab} type="button" className={activeTab === tab ? "tab-button active" : "tab-button"} onClick={() => setActiveTab(tab)}>
            <span className="tab-title">
              <IconBadge name={tab} tone={activeTab === tab ? "accent" : "default"} />
              <span>{TAB_META[tab].label}</span>
            </span>
            <small>{TAB_META[tab].description}</small>
          </button>
        ))}
      </nav>
      {message && <div className={`message-bar ${tone}`}>{message}</div>}
      <main className="content-grid">
        {activeTab === "inbox" && (
          <>
            <section className="panel compose-panel">
              <div className="panel-header">
                <div className="panel-heading-row">
                  <IconBadge name="inbox" tone="accent" />
                  <div>
                    <p className="panel-label">Quick Capture</p>
                    <h2>메모와 캡처를 바로 저장</h2>
                    <p className="section-note">텍스트만, 이미지만, 둘 다 저장 가능합니다. Enter는 저장, Shift+Enter는 줄바꿈입니다.</p>
                    <div className="context-badges">
                      <span className="context-chip accent">작업 날짜 {date}</span>
                      <span className="context-chip">현재 프로젝트 {selectedProjectName}</span>
                      {pendingImages.length > 0 && <span className="context-chip success">대기 이미지 {pendingImages.length}장</span>}
                    </div>
                  </div>
                </div>
                <button type="button" className="action-button" disabled={busy} onClick={() => void submitEntry()}>
                  {busy ? "저장 중..." : "기록 저장"}
                </button>
              </div>
              <div className="field-grid">
                <label className="field">
                  <span>프로젝트</span>
                  <select value={selectedProjectId} onChange={(event) => setSelectedProjectId(event.target.value)}>
                    {(snapshot?.projects ?? []).map((project) => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </label>
                <label className="field field-textarea">
                  <span>메모</span>
                  <textarea
                    value={entryText}
                    placeholder="예: 신청서 제출, 파일 생성, 시안 수정, 확인 요청, 피드백 반영"
                    onChange={(event) => setEntryText(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void submitEntry();
                      }
                    }}
                    onPaste={(event) => {
                      const files = [...event.clipboardData.files];
                      if (files.length) {
                        event.preventDefault();
                        void attachFiles(files);
                      }
                    }}
                  />
                </label>
                <div className="drop-zone" onDragOver={(event) => event.preventDefault()} onDrop={(event) => {
                  event.preventDefault();
                  void attachFiles(event.dataTransfer.files);
                }}>
                  <strong>이미지 붙여넣기 또는 드래그</strong>
                  <span>캡처 이미지를 바로 넣으면 기록과 함께 저장됩니다. 최대 12장까지 첨부할 수 있습니다.</span>
                  <input type="file" accept="image/*" multiple onChange={(event) => {
                    if (event.target.files) {
                      void attachFiles(event.target.files);
                      event.target.value = "";
                    }
                  }} />
                </div>
              </div>
              {pendingImages.length > 0 && (
                <div className="thumbnail-grid">
                  {pendingImages.map((image) => (
                    <article key={image.id} className="thumbnail-card">
                      <img src={image.previewUrl} alt={image.name} />
                      <div className="thumbnail-meta">
                        <strong>{image.name}</strong>
                        <button type="button" onClick={() => setPendingImages((current) => current.filter((item) => item.id !== image.id))}>삭제</button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
            <section className="panel feed-panel">
              <div className="panel-header">
                <div className="panel-heading-row">
                  <IconBadge name="inbox" tone="default" />
                  <div>
                    <p className="panel-label">Recent Entries</p>
                    <h2>최근 기록</h2>
                    <p className="section-note">선택한 날짜 기록 {entriesForDate.length}개가 초안 생성 대상으로 잡힙니다.</p>
                    <div className="context-badges">
                      <span className={`context-chip ${entryScope === "selected" ? "accent" : "default"}`}>
                        {entryScope === "selected" ? "현재 날짜 기준 보기" : "전체 최근 기록 보기"}
                      </span>
                      <span className="context-chip">현재 {feedEntries.length}개 표시 중</span>
                    </div>
                  </div>
                </div>
                <button type="button" className="ghost-button" onClick={() => void refresh()}>새로고침</button>
              </div>
              <div className="scope-strip" role="tablist" aria-label="entry scope">
                <button
                  type="button"
                  className={entryScope === "selected" ? "scope-chip active" : "scope-chip"}
                  onClick={() => setEntryScope("selected")}
                >
                  현재 날짜 기록
                  <span>{entriesForDate.length}</span>
                </button>
                <button
                  type="button"
                  className={entryScope === "recent" ? "scope-chip active" : "scope-chip"}
                  onClick={() => setEntryScope("recent")}
                >
                  전체 최근 기록
                  <span>{snapshot?.recentEntries.length ?? 0}</span>
                </button>
              </div>
              <div className="entry-feed">
                {feedEntries.length === 0 && (
                  <div className="empty-state">
                    <strong>아직 저장된 기록이 없습니다.</strong>
                    <p>첫 메모나 캡처를 저장하면 여기에서 최근 기록 흐름을 바로 확인할 수 있습니다.</p>
                  </div>
                )}
                {feedEntries.map((entry) => (
                  <article key={entry.id} className="entry-card">
                    <header>
                      <div>
                        <strong>{projectMap.get(entry.projectId)?.name ?? entry.projectId}</strong>
                        <span>{formatAt(entry.createdAt)}</span>
                      </div>
                      <span className={`entry-status ${entry.status}`}>{entry.status === "published" ? "등록됨" : "저장됨"}</span>
                    </header>
                    {dateKey(entry.createdAt) === date && <div className="entry-highlight">현재 선택한 날짜의 기록</div>}
                    {entry.text && <p>{entry.text}</p>}
                    {entry.imagePaths.length > 0 && (
                      <div className="entry-image-row">
                        {entry.imagePaths.map((image) => (
                          <img key={image.relativePath} src={uploadPreviewUrl(image.relativePath)} alt={image.name} />
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
        {activeTab === "review" && (
          <>
            <section className="panel review-controls">
              <div className="panel-header">
                <div className="panel-heading-row">
                  <IconBadge name="review" tone="accent" />
                  <div>
                    <p className="panel-label">Draft Flow</p>
                    <h2>초안 생성, 수정, 최종 등록</h2>
                    <p className="section-note">
                    {!codexReady
                      ? "Codex 로그인을 먼저 확인해야 초안 생성과 재작성이 가능합니다."
                      : entriesForDate.length === 0
                        ? "먼저 기록 탭에서 작업을 1개 이상 저장하세요."
                        : !draftBundle
                          ? "선택한 날짜의 기록이 준비됐습니다. 이제 초안을 생성하면 됩니다."
                          : !notionReady
                            ? "초안은 준비됐습니다. Notion 연결을 마치면 바로 발행할 수 있습니다."
                            : "초안을 직접 다듬은 뒤 Notion에 올리면 같은 날짜 페이지를 갱신합니다."}
                    </p>
                    <div className="context-badges">
                      <span className="context-chip accent">검토 날짜 {date}</span>
                      <span className="context-chip">
                        {draftBundle ? `초안 반영 기록 ${draftBundle.sourceEntryIds.length}개` : "초안 미생성"}
                      </span>
                      <span className={`context-chip ${publishedForDate ? "success" : "warn"}`}>
                        {publishedForDate ? "기존 날짜 페이지 갱신 모드" : "첫 발행 예정"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="readiness-grid">
                {reviewChecks.map((check) => (
                  <article key={check.label} className={`readiness-card ${check.ok ? "ok" : "warn"}`}>
                    <div className="readiness-topline">
                      <span className={`state-dot ${check.ok ? "ok" : "warn"}`} />
                      <strong>{check.label}</strong>
                    </div>
                    <p>{check.detail}</p>
                  </article>
                ))}
              </div>
              <div className="button-row">
                <button
                  type="button"
                  className="action-button"
                  disabled={!canGenerate}
                  onClick={() =>
                    void runTask(async () => {
                      const bundle = await generateDraft(date);
                      setDraftBundle(bundle);
                      setDraftTab("overall");
                      setActiveTab("review");
                      pushMessage("선택한 날짜의 기록으로 초안을 만들었습니다.", "success");
                      await refresh(date);
                    })
                  }
                >
                  {busy ? "생성 중..." : "초안 만들기"}
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  disabled={!canRefine}
                  onClick={() =>
                    void runTask(async () => {
                      if (!draftBundle) {
                        return;
                      }
                      const bundle = await refineDraft(date, draftBundle.overallDraft, draftBundle.projectDrafts);
                      setDraftBundle(bundle);
                      pushMessage("현재 수정본을 기준으로 다시 정리했습니다.", "success");
                      await refresh(date);
                    })
                  }
                >
                  수정본 기준 재작성
                </button>
                <button
                  type="button"
                  className="action-button accent"
                  disabled={!canPublish}
                  onClick={() =>
                    void runTask(async () => {
                      if (!draftBundle) {
                        return;
                      }
                      const result = await publishDraft(date);
                      setDraftBundle(result.draftBundle);
                      pushMessage("Notion에 등록했습니다.", "success");
                      await refresh(date);
                    })
                  }
                >
                  Notion 등록
                </button>
              </div>
              <div className="status-inline">
                {!codexReady
                  ? "Codex 연결이 복구되면 초안 만들기와 재작성 버튼이 활성화됩니다."
                  : !draftBundle
                    ? "먼저 초안을 생성해야 편집과 등록 단계로 넘어갈 수 있습니다."
                    : !notionReady
                      ? "Notion 연결을 마치면 현재 초안을 바로 등록할 수 있습니다."
                      : "현재 초안을 그대로 등록하거나 직접 수정한 뒤 재작성할 수 있습니다."}
              </div>
              <div className="info-grid">
                <div className="info-card">
                  <strong>선택 날짜 기록</strong>
                  <span>{entriesForDate.length}개</span>
                </div>
                <div className="info-card">
                  <strong>초안 반영 기록</strong>
                  <span>{draftBundle?.sourceEntryIds.length ?? 0}개</span>
                </div>
                <div className="info-card">
                  <strong>재작성 횟수</strong>
                  <span>{draftBundle?.revisionCount ?? 0}회</span>
                </div>
                <div className="info-card">
                  <strong>발행 상태</strong>
                  <span>{publishedForDate ? "기존 날짜 페이지 갱신" : "아직 발행 전"}</span>
                </div>
              </div>
              {!draftBundle && (
                <div className="empty-state">
                  <strong>아직 초안이 없습니다.</strong>
                  <p>기록 탭에서 메모를 저장한 뒤 초안 만들기를 누르면 전체 보고와 프로젝트별 업데이트가 동시에 생성됩니다.</p>
                </div>
              )}
              <div className="draft-tab-strip">
                <button type="button" className={draftTab === "overall" ? "draft-tab active" : "draft-tab"} onClick={() => setDraftTab("overall")}>
                  전체 보고
                </button>
                {(draftBundle?.projectDrafts ?? []).map((projectDraft) => (
                  <button
                    key={projectDraft.projectId}
                    type="button"
                    className={draftTab === projectDraft.projectId ? "draft-tab active" : "draft-tab"}
                    onClick={() => setDraftTab(projectDraft.projectId)}
                  >
                    {projectDraft.projectName}
                  </button>
                ))}
              </div>
            </section>
            <section className="panel editor-panel">
              <div className="editor-layout">
                <div className="editor-column">
                  <div className="panel-header compact">
                    <div>
                      <p className="panel-label">Editor</p>
                      <h2>{selectedDraft?.title ?? "초안을 먼저 생성해 주세요."}</h2>
                    </div>
                  </div>
                  <textarea
                    className="draft-editor"
                    value={selectedDraft?.body ?? ""}
                    onChange={(event) => setDraftBundle((current) => updateDraft(current, draftTab, event.target.value))}
                    placeholder="생성된 초안은 여기에서 직접 수정할 수 있습니다."
                  />
                </div>
                <div className="preview-column">
                  <div className="panel-header compact">
                    <div>
                      <p className="panel-label">Preview</p>
                      <h2>전체 미리보기</h2>
                    </div>
                  </div>
                  <div
                    className="preview-surface"
                    dangerouslySetInnerHTML={{
                      __html: draftBundle?.previewHtml || "<p class='empty-preview'>생성된 초안이 없습니다.</p>",
                    }}
                  />
                </div>
              </div>
            </section>
          </>
        )}
        {activeTab === "settings" && (
          <>
            <section className="panel settings-panel">
              <div className="panel-header">
                <div className="panel-heading-row">
                  <IconBadge name="settings" tone="accent" />
                  <div>
                    <p className="panel-label">Workspace</p>
                    <h2>프로젝트 목록 관리</h2>
                    <p className="section-note">프로젝트는 초안을 나누는 기준입니다. 기본 프로젝트는 Inbox에서 먼저 선택됩니다.</p>
                    <div className="context-badges">
                      <span className="context-chip accent">기본 프로젝트 {selectedProjectName}</span>
                      <span className="context-chip">활성 프로젝트 {activeProjectCount}개</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="ghost-button"
                  disabled={busy}
                  onClick={() =>
                    void runTask(async () => {
                      await saveSettings(selectedProjectId);
                      pushMessage("기본 프로젝트를 저장했습니다.", "success");
                      await refresh(date);
                    })
                  }
                >
                  기본 프로젝트 저장
                </button>
              </div>
              <label className="field">
                <span>기본 프로젝트</span>
                <select value={selectedProjectId} onChange={(event) => setSelectedProjectId(event.target.value)}>
                  {projectsForm.map((project) => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </label>
              <div className="project-list">
                {projectsForm.map((project) => (
                  <article key={project.id} className="project-card">
                    <label className="field">
                      <span>이름</span>
                      <input
                        value={project.name}
                        onChange={(event) =>
                          setProjectsForm((current) =>
                            current.map((item) => item.id === project.id ? { ...item, name: event.target.value } : item),
                          )
                        }
                      />
                    </label>
                    <label className="field">
                      <span>슬러그</span>
                      <input
                        value={project.slug}
                        onChange={(event) =>
                          setProjectsForm((current) =>
                            current.map((item) => item.id === project.id ? { ...item, slug: slugify(event.target.value) } : item),
                          )
                        }
                      />
                    </label>
                    <label className="field">
                      <span>프롬프트 힌트</span>
                      <input
                        value={project.defaultPromptHint ?? ""}
                        onChange={(event) =>
                          setProjectsForm((current) =>
                            current.map((item) =>
                              item.id === project.id ? { ...item, defaultPromptHint: event.target.value } : item,
                            ),
                          )
                        }
                      />
                    </label>
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={project.active}
                        onChange={(event) =>
                          setProjectsForm((current) =>
                            current.map((item) => item.id === project.id ? { ...item, active: event.target.checked } : item),
                          )
                        }
                      />
                      <span>활성 프로젝트</span>
                    </label>
                    <button
                      type="button"
                      className="action-button"
                      disabled={busy}
                      onClick={() =>
                        void runTask(async () => {
                          const projects = await saveProject({ ...project, slug: ensureSlug(project.slug) });
                          setProjectsForm(projects);
                          pushMessage("프로젝트를 저장했습니다.", "success");
                          await refresh(date);
                        })
                      }
                    >
                      저장
                    </button>
                  </article>
                ))}
              </div>
              <div className="inline-form">
                <input
                  value={newProjectName}
                  placeholder="새 프로젝트 이름"
                  onChange={(event) => {
                    setNewProjectName(event.target.value);
                    if (!newProjectSlug.trim()) {
                      setNewProjectSlug(slugify(event.target.value));
                    }
                  }}
                />
                <input value={newProjectSlug} placeholder="slug" onChange={(event) => setNewProjectSlug(slugify(event.target.value))} />
                <button
                  type="button"
                  className="action-button"
                  disabled={busy}
                  onClick={() =>
                    void runTask(async () => {
                      if (!newProjectName.trim()) {
                        throw new Error("새 프로젝트 이름을 입력해 주세요.");
                      }
                      const projects = await saveProject({
                        slug: ensureSlug(newProjectSlug || newProjectName),
                        name: newProjectName.trim(),
                        active: true,
                        defaultPromptHint: "",
                      });
                      setProjectsForm(projects);
                      setNewProjectName("");
                      setNewProjectSlug("");
                      pushMessage("새 프로젝트를 추가했습니다.", "success");
                      await refresh(date);
                    })
                  }
                >
                  추가
                </button>
              </div>
            </section>
            <section className="panel settings-panel">
              <div className="panel-header">
                <div className="panel-heading-row">
                  <IconBadge name="settings" tone="warn" />
                  <div>
                    <p className="panel-label">Notion Bootstrap</p>
                    <h2>Notion 구조 생성</h2>
                    <p className="section-note">처음 한 번만 실행하면 Projects, Daily Reports, Project Updates 데이터베이스를 자동으로 만듭니다.</p>
                    <div className="context-badges">
                      <span className={`context-chip ${notionWorkspaceCreated ? "success" : "warn"}`}>
                        {notionWorkspaceCreated ? "워크스페이스 연결 완료" : "아직 Notion 구조 미생성"}
                      </span>
                      <span className={`context-chip ${notionWorkspaceCreated && notionResetArmed ? "warn" : "default"}`}>
                        {notionWorkspaceCreated
                          ? notionResetArmed
                            ? "재연결 모드 열림"
                            : "안전 잠금 상태"
                          : "최초 연결 모드"}
                      </span>
                      <span className="context-chip">
                        Parent {snapshot?.state.settings.notionParentPageId ?? "미설정"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className={`callout-card ${notionWorkspaceCreated ? "warn" : "accent"}`}>
                <strong>
                  {notionWorkspaceCreated
                    ? "이미 Notion 구조가 생성되어 있습니다."
                    : "처음 한 번만 실행하는 연결 단계입니다."}
                </strong>
                <p>
                  {notionWorkspaceCreated
                    ? "다시 실행하면 Projects, Daily Reports, Project Updates 데이터베이스가 중복 생성될 수 있습니다. 현재 상태에서는 발행만 진행하세요."
                    : "이 버튼은 작업일지용 데이터베이스 3개를 한 번에 만들고 현재 워크스페이스에 연결합니다."}
                </p>
              </div>
              {notionWorkspaceCreated && (
                <div className={`callout-card ${notionResetArmed ? "warn strong" : "default"}`}>
                  <strong>다른 Parent Page에 다시 연결해야 할 때만 안전 잠금을 해제하세요.</strong>
                  <p>
                    재연결은 기존 Notion 데이터베이스를 수정하는 작업이 아니라 새 데이터베이스 3개를 다시 만드는 동작입니다.
                    정말 필요할 때만 아래 확인 단계를 거쳐 주세요.
                  </p>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={notionResetArmed}
                      onChange={(event) => {
                        setNotionResetArmed(event.target.checked);
                        if (!event.target.checked) {
                          setNotionResetPhrase("");
                        }
                      }}
                    />
                    <span>재연결 모드 열기</span>
                  </label>
                  <label className="field">
                    <span>확인 문구 입력</span>
                    <input
                      value={notionResetPhrase}
                      onChange={(event) => setNotionResetPhrase(event.target.value)}
                      placeholder="재생성"
                      disabled={!notionResetArmed}
                    />
                  </label>
                  <p className="danger-note">
                    확인 문구로 <strong>재생성</strong>을 입력해야 버튼이 다시 활성화됩니다.
                  </p>
                </div>
              )}
              <label className="field">
                <span>Notion Integration Token</span>
                <input type="password" value={notionToken} onChange={(event) => setNotionToken(event.target.value)} placeholder="ntn_..." />
              </label>
              <label className="field">
                <span>Parent Page URL or ID</span>
                <input value={notionParentPage} onChange={(event) => setNotionParentPage(event.target.value)} placeholder="https://www.notion.so/... 또는 페이지 ID" />
              </label>
              <div className="connection-grid">
                <article className="connection-card">
                  <p className="panel-label">Current Connection</p>
                  <h3>현재 연결</h3>
                  <div className="connection-list">
                    <div><strong>Parent</strong><span>{compactValue(snapshot?.state.settings.notionParentPageId)}</span></div>
                    <div>
                      <strong>연결 상태</strong>
                      <span>{notionWorkspaceCreated ? "작업일지용 Notion 워크스페이스가 연결되어 있습니다." : "아직 Notion 구조를 만들지 않았습니다."}</span>
                    </div>
                    <div>
                      <strong>연결된 데이터베이스</strong>
                      <span>{notionWorkspaceCreated ? `${notionDatabaseCount}개 연결됨` : "아직 없음"}</span>
                    </div>
                  </div>
                </article>
                <article className={`connection-card ${connectionTone}`}>
                  <p className="panel-label">Next Action</p>
                  <h3>이번 입력으로 바뀌는 내용</h3>
                  <div className="connection-list">
                    <div><strong>입력 Parent</strong><span>{compactValue(notionParentPage, "입력 대기중", 34)}</span></div>
                    <div>
                      <strong>현재 Parent와 비교</strong>
                      <span>
                        {!notionParentPage.trim()
                          ? "비교할 값이 아직 없습니다."
                          : pendingMatchesCurrentParent
                            ? "현재와 같은 Parent입니다."
                            : "현재와 다른 Parent로 해석됩니다."}
                      </span>
                    </div>
                    <div><strong>실행 결과</strong><span>{notionActionSummary}</span></div>
                  </div>
                </article>
              </div>
              <div className="advanced-toggle-row">
                <button
                  type="button"
                  className="ghost-button disclosure-button"
                  onClick={() => setShowNotionAdvanced((current) => !current)}
                >
                  {showNotionAdvanced ? "고급 연결 정보 접기" : "고급 연결 정보 보기"}
                </button>
                <span className="disclosure-hint">데이터베이스 ID와 로컬 저장 설정은 필요할 때만 펼쳐서 확인합니다.</span>
              </div>
              {showNotionAdvanced && (
                <div className="advanced-grid">
                  <article className="connection-card">
                    <p className="panel-label">Database IDs</p>
                    <h3>연결된 데이터베이스</h3>
                    <div className="connection-list">
                      <div><strong>Projects DB</strong><span>{compactValue(snapshot?.state.notion?.projectsDatabaseId)}</span></div>
                      <div><strong>Daily Reports DB</strong><span>{compactValue(snapshot?.state.notion?.dailyReportsDatabaseId)}</span></div>
                      <div><strong>Project Updates DB</strong><span>{compactValue(snapshot?.state.notion?.projectUpdatesDatabaseId)}</span></div>
                    </div>
                  </article>
                  <article className="connection-card">
                    <p className="panel-label">Local Settings</p>
                    <h3>로컬 저장 설정</h3>
                    <div className="meta-table compact">
                      <div><strong>저장 경로</strong><span>{snapshot?.state.settings.dataDir ?? "-"}</span></div>
                      <div><strong>기본 언어</strong><span>{snapshot?.state.settings.defaultLanguage ?? "ko"}</span></div>
                      <div><strong>Notion Parent</strong><span>{snapshot?.state.settings.notionParentPageId ?? "-"}</span></div>
                    </div>
                  </article>
                </div>
              )}
              <div className="button-row">
                <button
                  type="button"
                  className="action-button accent"
                  disabled={!canBootstrapNotion}
                  onClick={() =>
                    void runTask(async () => {
                      await bootstrapNotion(notionToken, notionParentPage, notionRebuildConfirmed);
                      setNotionToken("");
                      setNotionParentPage("");
                      setNotionResetArmed(false);
                      setNotionResetPhrase("");
                      pushMessage(
                        notionRebuildConfirmed ? "Notion 구조를 다시 생성했습니다." : "Notion 구조를 생성했습니다.",
                        "success",
                      );
                      await refresh(date);
                    })
                  }
                >
                  {notionWorkspaceCreated
                    ? notionRebuildConfirmed
                      ? "Notion 구조 다시 만들기"
                      : "안전 잠금 해제 필요"
                    : "Notion 구조 만들기"}
                </button>
              </div>
              <p className="button-hint">{notionActionSummary}</p>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
