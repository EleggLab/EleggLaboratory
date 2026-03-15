import { useEffect, useMemo, useState } from 'react';
import presetsFlat from '../../app/src/main/assets/presets_kr_flat.json';
import { buildCatalog, matchPresets } from './presetMatch';
import {
  cycleKeyKst,
  formatHhMmSs,
  formatNowKst,
  formatPlayTime,
  hhmmToMinutes,
  kstDayKey,
  minutesToHhmm,
  remainingSecondsToNextReset,
} from './time';
import './tracker.css';

const STORAGE_KEY = 'tracker_web_state_v1';

function makeId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeTrackedGame(game, nowMs) {
  const nextCycleKey = cycleKeyKst(nowMs, game.resetMinutesKst);
  const nextDayKey = kstDayKey(nowMs);

  let next = game;

  if (game.cycleKey !== nextCycleKey) {
    next = {
      ...next,
      cycleKey: nextCycleKey,
      cleared: false,
      clearedAt: null,
    };
  }

  if (next.playDayKey !== nextDayKey) {
    next = {
      ...next,
      playDayKey: nextDayKey,
      playMillisToday: 0,
    };
  }

  return next;
}

function loadTrackedGames(nowMs) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((entry) => {
        if (!entry || typeof entry !== 'object') return null;
        const resetMinutes = Number(entry.resetMinutesKst);
        if (!Number.isFinite(resetMinutes) || resetMinutes < 0 || resetMinutes > 1439) return null;

        return normalizeTrackedGame(
          {
            id: String(entry.id || makeId()),
            packageName: String(entry.packageName || ''),
            displayName: String(entry.displayName || 'Unknown Game'),
            resetMinutesKst: Math.floor(resetMinutes),
            cleared: Boolean(entry.cleared),
            clearedAt: entry.clearedAt ? Number(entry.clearedAt) : null,
            createdAt: Number(entry.createdAt || Date.now()),
            presetGameKey: entry.presetGameKey ? String(entry.presetGameKey) : null,
            presetConfidence: entry.presetConfidence ? String(entry.presetConfidence) : null,
            playMillisToday: Number(entry.playMillisToday || 0),
            playDayKey: String(entry.playDayKey || kstDayKey(nowMs)),
            cycleKey: String(entry.cycleKey || ''),
          },
          nowMs,
        );
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

function upsertTrackedGame(prev, payload, nowMs) {
  const found = prev.find((g) => g.packageName === payload.packageName);
  const base = {
    id: found?.id || makeId(),
    packageName: payload.packageName,
    displayName: payload.displayName,
    resetMinutesKst: payload.resetMinutesKst,
    cleared: found?.cleared || false,
    clearedAt: found?.clearedAt || null,
    createdAt: found?.createdAt || nowMs,
    presetGameKey: payload.presetGameKey || null,
    presetConfidence: payload.presetConfidence || null,
    playMillisToday: found?.playMillisToday || 0,
    playDayKey: found?.playDayKey || kstDayKey(nowMs),
    cycleKey: found?.cycleKey || cycleKeyKst(nowMs, payload.resetMinutesKst),
  };

  const normalized = normalizeTrackedGame(base, nowMs);
  if (!found) return [...prev, normalized];
  return prev.map((item) => (item.packageName === payload.packageName ? normalized : item));
}

function TrackerWebApp() {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [trackedGames, setTrackedGames] = useState(() => loadTrackedGames(Date.now()));
  const [screen, setScreen] = useState('home');
  const [mobilePreview, setMobilePreview] = useState(true);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortMode, setSortMode] = useState('name');

  const [undoTargetId, setUndoTargetId] = useState(null);
  const [matchDialog, setMatchDialog] = useState(null);
  const [manualDialog, setManualDialog] = useState(null);
  const [showInfo, setShowInfo] = useState(false);

  const presets = useMemo(() => presetsFlat.games || [], []);
  const catalog = useMemo(() => buildCatalog(presets), [presets]);

  const normalizedTrackedGames = useMemo(
    () => trackedGames.map((game) => normalizeTrackedGame(game, nowMs)),
    [trackedGames, nowMs],
  );

  const trackedByPackage = useMemo(() => {
    const map = new Map();
    for (const game of normalizedTrackedGames) map.set(game.packageName, game);
    return map;
  }, [normalizedTrackedGames]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trackedGames));
  }, [trackedGames]);

  const filteredCatalog = useMemo(() => {
    const query = search.trim().toLowerCase();
    const base = catalog.filter((item) => {
      if (filter === 'tracked' && !trackedByPackage.has(item.packageName)) return false;
      if (filter === 'installed' && !item.installed) return false;
      if (!query) return true;
      return (
        item.label.toLowerCase().includes(query) ||
        item.packageName.toLowerCase().includes(query)
      );
    });

    if (sortMode === 'name') {
      base.sort((a, b) => a.label.localeCompare(b.label, 'ko'));
    }
    return base;
  }, [catalog, filter, search, sortMode, trackedByPackage]);

  const sortedTrackedGames = useMemo(
    () => [...normalizedTrackedGames].sort((a, b) => a.displayName.localeCompare(b.displayName, 'ko')),
    [normalizedTrackedGames],
  );

  const totalCount = normalizedTrackedGames.length;
  const completedCount = normalizedTrackedGames.filter((g) => g.cleared).length;
  const progressRatio = totalCount ? completedCount / totalCount : 0;

  function moveToAddScreen() {
    setScreen('add');
  }

  function moveToHomeScreen() {
    setScreen('home');
  }

  function handleCardClick(game) {
    if (!game.cleared) {
      setTrackedGames((prev) =>
        prev.map((item) =>
          item.id === game.id ? { ...item, cleared: true, clearedAt: nowMs } : item,
        ),
      );
      return;
    }
    setUndoTargetId(game.id);
  }

  function handleUndoConfirm() {
    const id = undoTargetId;
    if (!id) return;
    setTrackedGames((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, cleared: false, clearedAt: null } : item,
      ),
    );
    setUndoTargetId(null);
  }

  function handleResetAll() {
    setTrackedGames((prev) => prev.map((item) => ({ ...item, cleared: false, clearedAt: null })));
  }

  function addPlayFiveMinutes(gameId) {
    setTrackedGames((prev) =>
      prev.map((item) =>
        item.id === gameId
          ? { ...item, playMillisToday: item.playMillisToday + 5 * 60_000 }
          : item,
      ),
    );
  }

  function removeTrackedGame(packageName) {
    setTrackedGames((prev) => prev.filter((item) => item.packageName !== packageName));
  }

  function openAddFlow(item) {
    const matches = matchPresets(item.label, item.packageName, presets, 5);

    if (!matches.length) {
      setManualDialog({
        packageName: item.packageName,
        displayName: item.label,
        presetGameKey: null,
        presetConfidence: 'unknown',
        resetTime: '05:00',
      });
      return;
    }

    setMatchDialog({
      packageName: item.packageName,
      appLabel: item.label,
      matches,
    });
  }

  function applyPresetMatch(match) {
    if (!matchDialog) return;
    const preset = match.preset;

    if (preset.resetMinutesKst == null) {
      setManualDialog({
        packageName: matchDialog.packageName,
        displayName: matchDialog.appLabel,
        presetGameKey: preset.gameKey,
        presetConfidence: preset.confidence || 'unknown',
        resetTime: '05:00',
      });
      setMatchDialog(null);
      return;
    }

    setTrackedGames((prev) =>
      upsertTrackedGame(
        prev,
        {
          packageName: matchDialog.packageName,
          displayName: matchDialog.appLabel,
          resetMinutesKst: preset.resetMinutesKst,
          presetGameKey: preset.gameKey,
          presetConfidence: preset.confidence || 'unknown',
        },
        nowMs,
      ),
    );

    setMatchDialog(null);
    setScreen('home');
  }

  function openManualFromMatchDialog() {
    if (!matchDialog) return;
    setManualDialog({
      packageName: matchDialog.packageName,
      displayName: matchDialog.appLabel,
      presetGameKey: matchDialog.matches[0]?.preset?.gameKey || null,
      presetConfidence: matchDialog.matches[0]?.preset?.confidence || 'unknown',
      resetTime: '05:00',
    });
    setMatchDialog(null);
  }

  function submitManual(event) {
    event.preventDefault();
    if (!manualDialog) return;

    const form = new FormData(event.currentTarget);
    const displayName = String(form.get('displayName') || manualDialog.displayName).trim();
    const resetTime = String(form.get('resetTime') || '').trim();
    const resetMinutes = hhmmToMinutes(resetTime);

    if (resetMinutes == null) {
      alert('시간 형식이 올바르지 않습니다. HH:MM 형식으로 입력하세요.');
      return;
    }

    setTrackedGames((prev) =>
      upsertTrackedGame(
        prev,
        {
          packageName: manualDialog.packageName,
          displayName: displayName || manualDialog.displayName,
          resetMinutesKst: resetMinutes,
          presetGameKey: manualDialog.presetGameKey,
          presetConfidence: manualDialog.presetConfidence || 'unknown',
        },
        nowMs,
      ),
    );

    setManualDialog(null);
    setScreen('home');
  }

  return (
    <div className="tracker-shell">
      <div className={`tracker-stage ${mobilePreview ? 'mobile' : 'desktop'}`}>
        <div className="tracker-wrap">
          {screen === 'home' ? (
            <>
              <div className="tracker-top">
                <div>
                  <div className="tracker-title">모바일 게임 숙제 트래커 웹 테스트</div>
                  <div className="tracker-sub">현재 시각: {formatNowKst(nowMs)}</div>
                </div>
                <div className="tracker-row">
                  <button
                    className="tracker-btn"
                    type="button"
                    onClick={() => setMobilePreview((prev) => !prev)}
                  >
                    {mobilePreview ? '데스크톱 비율' : '모바일 비율'}
                  </button>
                  <button className="tracker-btn" type="button" onClick={() => setShowInfo(true)}>
                    정보
                  </button>
                </div>
              </div>

              <div className="tracker-progress-card">
                <div>완료: {completedCount}/{totalCount}</div>
                <div className="tracker-progress-bar">
                  <div
                    className="tracker-progress-fill"
                    style={{ width: `${Math.round(progressRatio * 100)}%` }}
                  />
                </div>
              </div>

              <div className="tracker-banner">
                웹 테스트 모드입니다. Android `UsageStats` 대신 `+5분` 버튼으로 오늘 플레이 시간을 수동 검증하세요.
              </div>

              {sortedTrackedGames.length === 0 ? (
                <div className="tracker-panel tracker-empty">등록된 게임이 없습니다. `+ 게임 추가`를 눌러 시작하세요.</div>
              ) : (
                <div className="tracker-grid">
                  {sortedTrackedGames.map((game) => {
                    const remaining = remainingSecondsToNextReset(nowMs, game.resetMinutesKst);
                    return (
                      <div
                        key={game.id}
                        className={`tracker-card ${game.cleared ? 'cleared' : ''}`}
                        onClick={() => handleCardClick(game)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleCardClick(game);
                          }
                        }}
                      >
                        <div className="tracker-row">
                          <div className="tracker-name">{game.displayName}</div>
                          <span className="tracker-chip">리셋 {minutesToHhmm(game.resetMinutesKst)} KST</span>
                        </div>
                        <div className="tracker-time">{formatHhMmSs(remaining)}</div>
                        <div className="tracker-meta">오늘 {formatPlayTime(game.playMillisToday)}</div>
                        <div className="tracker-row" style={{ marginTop: 8 }}>
                          <button
                            className="tracker-btn ghost"
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              addPlayFiveMinutes(game.id);
                            }}
                          >
                            +5분
                          </button>
                        </div>
                        {game.cleared && <div className="tracker-stamp">완료</div>}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="tracker-bottom">
                <button className="tracker-btn primary" type="button" onClick={moveToAddScreen}>
                  + 게임 추가
                </button>
                <button className="tracker-btn" type="button" onClick={handleResetAll}>
                  전체 초기화
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="tracker-top">
                <div className="tracker-row" style={{ justifyContent: 'flex-start' }}>
                  <button className="tracker-btn" type="button" onClick={moveToHomeScreen}>
                    홈으로
                  </button>
                  <div>
                    <div className="tracker-title">게임 추가</div>
                    <div className="tracker-sub">추가/제거는 이 화면에서만 가능합니다.</div>
                  </div>
                </div>
                <button
                  className="tracker-btn"
                  type="button"
                  onClick={() => setMobilePreview((prev) => !prev)}
                >
                  {mobilePreview ? '데스크톱 비율' : '모바일 비율'}
                </button>
              </div>

              <div className="tracker-panel">
                <div className="tracker-controls">
                  <input
                    className="tracker-input"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="게임명 / 패키지 검색"
                  />
                  <select
                    className="tracker-select"
                    value={sortMode}
                    onChange={(e) => setSortMode(e.target.value)}
                  >
                    <option value="name">이름순</option>
                  </select>
                  <select
                    className="tracker-select"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="all">전체</option>
                    <option value="tracked">내가 등록한 게임만</option>
                    <option value="installed">설치된 게임들(샘플)</option>
                  </select>
                </div>

                <div className="tracker-list">
                  {filteredCatalog.map((item) => {
                    const tracked = trackedByPackage.get(item.packageName);
                    return (
                      <div key={item.packageName} className="tracker-list-item">
                        <div>
                          <div>{item.label}</div>
                          <div className="tracker-small">{item.packageName}</div>
                          <div className="tracker-small">{item.installed ? '설치됨(샘플)' : '미설치(샘플)'}</div>
                        </div>
                        {tracked ? (
                          <button
                            type="button"
                            className="tracker-btn danger"
                            onClick={() => removeTrackedGame(item.packageName)}
                          >
                            제거
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="tracker-btn primary"
                            onClick={() => openAddFlow(item)}
                          >
                            추가
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {undoTargetId && (
        <div className="tracker-dialog-backdrop">
          <div className="tracker-dialog">
            <h3>숙제 안했나요?</h3>
            <p style={{ marginTop: 6 }}>이미 완료로 체크된 게임입니다.</p>
            <div className="tracker-row" style={{ marginTop: 12 }}>
              <button className="tracker-btn" type="button" onClick={() => setUndoTargetId(null)}>
                그대로 둘게요
              </button>
              <button className="tracker-btn danger" type="button" onClick={handleUndoConfirm}>
                안했어요
              </button>
            </div>
          </div>
        </div>
      )}

      {matchDialog && (
        <div className="tracker-dialog-backdrop">
          <div className="tracker-dialog">
            <h3>프리셋 매칭 Top {matchDialog.matches.length}</h3>
            <p style={{ marginTop: 6 }}>앱: {matchDialog.appLabel}</p>
            {matchDialog.matches.map((match) => (
              <div key={`${match.preset.gameKey}-${match.score}`} className="tracker-match">
                <div><strong>{match.preset.displayName}</strong></div>
                <div className="tracker-small">리셋: {match.preset.resetTimeKst || 'Unknown'}</div>
                <div className="tracker-small">confidence: {match.preset.confidence} / score: {match.score} ({match.reason})</div>
                <div className="tracker-small">source: {match.preset.sourceUrl}</div>
                <div style={{ marginTop: 8 }}>
                  <button className="tracker-btn primary" type="button" onClick={() => applyPresetMatch(match)}>
                    이 프리셋 선택
                  </button>
                </div>
              </div>
            ))}
            <div className="tracker-row" style={{ marginTop: 12 }}>
              <button className="tracker-btn" type="button" onClick={() => setMatchDialog(null)}>
                취소
              </button>
              <button className="tracker-btn" type="button" onClick={openManualFromMatchDialog}>
                리셋시간 직접 설정
              </button>
            </div>
          </div>
        </div>
      )}

      {manualDialog && (
        <div className="tracker-dialog-backdrop">
          <div className="tracker-dialog">
            <h3>리셋시간 직접 설정 (KST)</h3>
            <form onSubmit={submitManual}>
              <div style={{ marginTop: 10 }}>
                <div className="tracker-small">표시 이름</div>
                <input
                  className="tracker-input"
                  name="displayName"
                  defaultValue={manualDialog.displayName}
                  style={{ width: '100%', marginTop: 4 }}
                />
              </div>
              <div style={{ marginTop: 10 }}>
                <div className="tracker-small">리셋 시각 (HH:MM, KST)</div>
                <input
                  className="tracker-time-input"
                  type="time"
                  name="resetTime"
                  defaultValue={manualDialog.resetTime || '05:00'}
                  style={{ width: '100%', marginTop: 4 }}
                  required
                />
              </div>
              <div className="tracker-row" style={{ marginTop: 14 }}>
                <button className="tracker-btn" type="button" onClick={() => setManualDialog(null)}>
                  취소
                </button>
                <button className="tracker-btn primary" type="submit">
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showInfo && (
        <div className="tracker-dialog-backdrop">
          <div className="tracker-dialog">
            <h3>정보 / 출처</h3>
            <p style={{ marginTop: 8 }}>- Source: https://gachalist.com/daily-resets</p>
            <p>- Override source: https://kakaogames.oqupie.com/portals/1576/articles/35175</p>
            <p>- 기준 타임존: Asia/Seoul (KST, UTC+9)</p>
            <p>- Unknown 리셋 항목은 자동 확정하지 않고 수동 설정으로 처리합니다.</p>
            <p style={{ marginTop: 8, color: '#92400e' }}>
              외부 데이터 라이선스/이용약관은 별도 확인이 필요합니다.
            </p>
            <div style={{ marginTop: 12 }}>
              <button className="tracker-btn" type="button" onClick={() => setShowInfo(false)}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TrackerWebApp;
