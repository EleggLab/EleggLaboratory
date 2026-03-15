import { useCallback, useEffect, useRef, useState } from 'react';
import AssetManager from './components/AssetManager/AssetManager';
import NodeEditor from './components/Editor/NodeEditor';
import GamePlayer from './components/GamePlayer/GamePlayer';
import { useAssetStore } from './stores/assetStore';
import { useEditorStore } from './stores/editorStore';
import { useGameStore } from './stores/gameStore';
import { auditProjectGraph } from './utils/graphAudit';

const SCREEN_EDITOR = 'editor';
const SCREEN_ASSETS = 'assets';
const SCREEN_PLAYTEST = 'playtest';
const SETTINGS_STORAGE_KEY = 'ugc_tool_app_settings_v1';

const DEFAULT_APP_SETTINGS = {
  language: 'ko',
  soundEnabled: true,
  soundVolume: 0.35,
};

function loadAppSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_APP_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      language: parsed.language === 'en' ? 'en' : 'ko',
      soundEnabled: parsed.soundEnabled !== false,
      soundVolume: Number.isFinite(parsed.soundVolume)
        ? Math.max(0, Math.min(1, parsed.soundVolume))
        : DEFAULT_APP_SETTINGS.soundVolume,
    };
  } catch {
    return DEFAULT_APP_SETTINGS;
  }
}

function sanitizeFilename(input) {
  return input.replace(/[<>:"/\\|?*]+/g, '-').trim() || 'ugc-project';
}

function downloadJson(data, filename) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function ensureSingleStartNode(projectData) {
  const nodes = Array.isArray(projectData?.nodes) ? JSON.parse(JSON.stringify(projectData.nodes)) : [];
  const edges = Array.isArray(projectData?.edges) ? JSON.parse(JSON.stringify(projectData.edges)) : [];
  if (nodes.length === 0) return { projectData, migrated: false };
  const activeNodes = () => nodes.filter((node) => node?.data?.type !== 'note');

  let migrated = false;
  const startNodes = activeNodes().filter((node) => node?.data?.type === 'start');
  if (startNodes.length === 0) {
    migrated = true;
    const startId = `auto-start-${Date.now()}`;
    const startNode = {
      id: startId,
      type: 'startNode',
      position: { x: 40, y: 40 },
      data: {
        type: 'start',
        label: 'Start',
        description: 'Auto-created from legacy graph.',
        descriptionKo: '',
      },
    };

    const incoming = new Set(edges.map((edge) => edge?.target).filter(Boolean));
    const candidates = activeNodes().filter((node) => !incoming.has(node.id));
    const firstTarget = candidates[0] || activeNodes()[0] || nodes[0];

    nodes.unshift(startNode);
    if (firstTarget?.id) {
      edges.unshift({
        id: `auto-edge-${Date.now()}`,
        source: startId,
        target: firstTarget.id,
        type: 'smoothstep',
      });
    }
  }

  const endingNodes = activeNodes().filter((node) => node?.data?.type === 'ending');
  if (endingNodes.length === 0) {
    migrated = true;
    const endingId = `auto-ending-${Date.now()}`;
    const endingNode = {
      id: endingId,
      type: 'endingNode',
      position: { x: 820, y: 120 },
      data: {
        type: 'ending',
        label: 'Ending',
        endingKey: 'auto_ending',
        victory: false,
        title: 'Auto Ending',
        titleKo: '',
        reason: 'Legacy graph fallback ending.',
        reasonKo: '',
      },
    };
    nodes.push(endingNode);

    const outgoing = new Set(edges.map((edge) => edge?.source).filter(Boolean));
    const leafNodes = activeNodes().filter((node) => node.id !== endingId && !outgoing.has(node.id));
    leafNodes.forEach((leaf, idx) => {
      edges.push({
        id: `auto-leaf-edge-${idx}-${Date.now()}`,
        source: leaf.id,
        target: endingId,
        type: 'smoothstep',
      });
    });
  }

  if (!migrated) return { projectData, migrated: false };
  return { projectData: { ...projectData, nodes, edges }, migrated: true };
}

export default function App() {
  const [appSettings, setAppSettings] = useState(() => loadAppSettings());
  const language = appSettings.language;
  const [screen, setScreen] = useState(SCREEN_EDITOR);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const fileInputRef = useRef(null);
  const clickAudioRef = useRef(null);
  const confirmAudioRef = useRef(null);
  const t = (en, ko) => (language === 'ko' ? ko : en);

  const assetsLoading = useAssetStore((s) => s.loading);
  const initializeAssets = useAssetStore((s) => s.initialize);
  const exportAssets = useAssetStore((s) => s.exportAssets);
  const importAssets = useAssetStore((s) => s.importAssets);

  const projectMeta = useEditorStore((s) => s.projectMeta);
  const newProject = useEditorStore((s) => s.newProject);
  const loadTemplate = useEditorStore((s) => s.loadTemplate);
  const loadProject = useEditorStore((s) => s.loadProject);
  const exportProject = useEditorStore((s) => s.exportProject);

  const isPlaying = useGameStore((s) => s.isPlaying);
  const startGame = useGameStore((s) => s.startGame);
  const stopGame = useGameStore((s) => s.stopGame);

  useEffect(() => {
    initializeAssets();
  }, [initializeAssets]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(appSettings));
  }, [appSettings]);

  const playToolSound = useCallback((kind = 'click') => {
    if (!appSettings.soundEnabled) return;
    const target = kind === 'confirm' ? confirmAudioRef.current : clickAudioRef.current;
    if (!target) return;
    target.volume = appSettings.soundVolume;
    target.currentTime = 0;
    target.play().catch(() => {});
  }, [appSettings.soundEnabled, appSettings.soundVolume]);

  useEffect(() => {
    clickAudioRef.current = new Audio('/audio/ui_click.ogg');
    confirmAudioRef.current = new Audio('/audio/ui_confirm.ogg');
    if (clickAudioRef.current) clickAudioRef.current.preload = 'auto';
    if (confirmAudioRef.current) confirmAudioRef.current.preload = 'auto';
    return () => {
      clickAudioRef.current = null;
      confirmAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const onGlobalClick = (event) => {
      const element = event.target instanceof Element ? event.target.closest('button,[role="button"]') : null;
      if (!element) return;
      playToolSound('click');
    };
    document.addEventListener('click', onGlobalClick, true);
    return () => document.removeEventListener('click', onGlobalClick, true);
  }, [playToolSound]);

  const handleStartPlaytest = () => {
    const exported = exportProject();
    const normalized = ensureSingleStartNode(exported);
    const projectData = normalized.projectData;
    if (normalized.migrated) {
      loadProject(projectData);
    }

    const audit = auditProjectGraph(projectData);
    if (audit.errors.length > 0) {
      const message = audit.errors
        .map((error, idx) => `${idx + 1}. ${t(error.messageEn, error.messageKo)}`)
        .join('\n');
      alert(message);
      return;
    }
    const assets = exportAssets();
    startGame(projectData, assets);
    playToolSound('confirm');
    setScreen(SCREEN_PLAYTEST);
  };

  const handleExitPlaytest = () => {
    stopGame();
    setScreen(SCREEN_EDITOR);
  };

  const handleExport = () => {
    const payload = {
      format: 'ugc-project-v1',
      exportedAt: new Date().toISOString(),
      project: exportProject(),
      assets: exportAssets(),
    };
    const base = sanitizeFilename(projectMeta?.title || 'ugc-project');
    downloadJson(payload, `${base}.json`);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const rawText = await file.text();
      const parsed = JSON.parse(rawText);

      const projectData = parsed.project ?? parsed;
      const assets = parsed.assets;

      if (!projectData || !Array.isArray(projectData.nodes) || !Array.isArray(projectData.edges)) {
        throw new Error(t('Invalid project structure: nodes/edges are missing.', '프로젝트 구조가 올바르지 않습니다: nodes/edges가 없습니다.'));
      }
      if (!assets || !Array.isArray(assets.characters) || !Array.isArray(assets.items)) {
        throw new Error(t('Invalid asset structure: characters/items are missing.', '에셋 구조가 올바르지 않습니다: characters/items가 없습니다.'));
      }

      loadProject(projectData);
      await importAssets(assets);
      setScreen(SCREEN_EDITOR);
      alert(t('Project imported.', '프로젝트를 불러왔습니다.'));
    } catch (error) {
      alert(t(`Import failed: ${error.message}`, `불러오기 실패: ${error.message}`));
    } finally {
      event.target.value = '';
    }
  };

  const title = projectMeta?.title || 'Untitled Project';
  const soundPercent = Math.round(appSettings.soundVolume * 100);

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <div className="app-brand-block">
          <div className="app-brand-title">Steam UGC Story Studio</div>
          <div className="app-brand-subtitle">
            {assetsLoading ? t('Loading assets...', '에셋 불러오는 중...') : title}
          </div>
        </div>

        <div className="app-top-actions">
          <div className="app-action-group">
            <button
              type="button"
              className="app-btn"
              onClick={() => {
                stopGame();
                newProject();
                setScreen(SCREEN_EDITOR);
              }}
            >
              {t('New', '새 프로젝트')}
            </button>
            <button
              type="button"
              className="app-btn"
              onClick={() => {
                stopGame();
                loadTemplate();
                setScreen(SCREEN_EDITOR);
              }}
            >
              {t('Sample', '샘플')}
            </button>
            <button type="button" className="app-btn" onClick={handleImportClick}>
              {t('Import', '불러오기')}
            </button>
            <button type="button" className="app-btn" onClick={handleExport}>
              {t('Export', '내보내기')}
            </button>
            <button
              type="button"
              className="app-btn app-btn-muted"
              onClick={() => setShowSettingsModal(true)}
            >
              {t('Settings', '설정')}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImportFile}
              className="hidden"
            />
          </div>

          <div className="app-tab-group">
            <button
              type="button"
              className={`app-tab ${screen === SCREEN_EDITOR ? 'is-active' : ''}`}
              onClick={() => setScreen(SCREEN_EDITOR)}
            >
              {t('Editor', '에디터')}
            </button>
            <button
              type="button"
              className={`app-tab ${screen === SCREEN_ASSETS ? 'is-active' : ''}`}
              onClick={() => setScreen(SCREEN_ASSETS)}
            >
              {t('Assets', '에셋')}
            </button>
            <button
              type="button"
              className={`app-tab app-tab-play ${screen === SCREEN_PLAYTEST ? 'is-active' : ''}`}
              onClick={handleStartPlaytest}
            >
              {t('Playtest', '플레이테스트')}
            </button>
          </div>
        </div>
      </header>

      <div className="app-notice">
        {t(
          'Local tool notice: this app does not publish user content. If a user uploads or distributes created content, legal responsibility belongs to that user.',
          '로컬 툴 안내: 이 앱은 사용자 콘텐츠를 대신 게시하지 않습니다. 사용자가 제작물을 업로드하거나 배포할 경우 법적 책임은 해당 사용자에게 있습니다.'
        )}
      </div>

      <main className="app-main">
        {screen === SCREEN_EDITOR && <NodeEditor language={language} />}

        {screen === SCREEN_ASSETS && (
          <div className="app-screen-scroll">
            <AssetManager language={language} />
          </div>
        )}

        {screen === SCREEN_PLAYTEST && isPlaying && (
          <GamePlayer
            language={language}
            onExit={handleExitPlaytest}
            soundEnabled={appSettings.soundEnabled}
            soundVolume={appSettings.soundVolume}
          />
        )}
      </main>

      {showSettingsModal && (
        <div
          className="app-modal-overlay"
          onClick={() => setShowSettingsModal(false)}
        >
          <div
            className="app-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="app-modal-title">{t('Settings', '설정')}</h2>

            <div className="app-modal-fieldset">
              <label className="app-modal-label">{t('Language', '언어')}</label>
              <select
                value={appSettings.language}
                onChange={(event) => setAppSettings((prev) => ({ ...prev, language: event.target.value === 'en' ? 'en' : 'ko' }))}
                className="app-modal-input"
              >
                <option value="ko">한국어 (기본)</option>
                <option value="en">English</option>
              </select>
            </div>

            <div className="app-modal-fieldset">
              <label className="app-modal-checkbox">
                <input
                  type="checkbox"
                  checked={appSettings.soundEnabled}
                  onChange={(event) => setAppSettings((prev) => ({ ...prev, soundEnabled: event.target.checked }))}
                />
                <span>{t('Enable Tool Sounds', '툴 사운드 사용')}</span>
              </label>
            </div>

            <div className="app-modal-fieldset">
              <label className="app-modal-label">
                {t('Sound Volume', '사운드 볼륨')} ({soundPercent}%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={soundPercent}
                onChange={(event) => {
                  const value = Math.max(0, Math.min(100, parseInt(event.target.value, 10) || 0));
                  setAppSettings((prev) => ({ ...prev, soundVolume: value / 100 }));
                }}
                className="app-modal-slider"
              />
              <button
                type="button"
                className="app-btn app-btn-muted"
                onClick={() => playToolSound('confirm')}
                disabled={!appSettings.soundEnabled}
              >
                {t('Test Sound', '사운드 테스트')}
              </button>
            </div>

            <div className="app-modal-actions">
              <button
                type="button"
                className="app-btn"
                onClick={() => {
                  setAppSettings(DEFAULT_APP_SETTINGS);
                  playToolSound('confirm');
                }}
              >
                {t('Reset', '초기화')}
              </button>
              <button
                type="button"
                className="app-btn app-btn-primary"
                onClick={() => {
                  setShowSettingsModal(false);
                  playToolSound('confirm');
                }}
              >
                {t('Done', '완료')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

