import { startTransition, useEffect, useRef, useState } from 'react';
import { useEffectEvent } from 'react';
import { BattleCanvas } from '../components/BattleCanvas';
import {
  FREE_APP_RULES,
  getLessonById,
  LESSONS,
  LIBRARY_UPGRADES,
  SCHOOL_LABELS,
  STAGES,
} from '../game/content';
import { createBattleState } from '../game/engine';
import {
  applyBattleOutcome,
  buyLibraryUpgrade,
  clearSave,
  createDefaultSave,
  loadSave,
  saveProgress,
  setLastRun,
} from '../game/save';
import type {
  BattleOutcome,
  BattleState,
  GameIdentity,
  PersistentSave,
  SchoolId,
} from '../game/types';
import { describeIdentityStatus, resolveGameIdentity } from '../platform/toss';
import { MagicSoundController } from '../utils/sound';
import { useBattleLoop } from './useBattleLoop';

type AppScene =
  | { kind: 'boot' }
  | { kind: 'lobby' }
  | { kind: 'class-select'; stageId: string }
  | { kind: 'battle'; stageId: string; lessonId: string; snapshot?: BattleState }
  | { kind: 'result'; claimed: boolean; outcome: BattleOutcome; schoolId: SchoolId }
  | { kind: 'library' }
  | { kind: 'settings' };

function formatStageId(stageId: string) {
  return Number.parseInt(stageId.replace('stage_', ''), 10);
}

function formatIdentityBadge(identity: GameIdentity | null) {
  if (!identity) {
    return '로딩 중';
  }

  return identity.source === 'toss' ? 'Toss Key' : 'Local Key';
}

function deriveUnlockedStages(save: PersistentSave | null) {
  const highestCleared = save?.highestClearedStage ?? 0;
  const unlockedCount = Math.min(STAGES.length, Math.max(1, highestCleared + 1));
  return STAGES.slice(0, unlockedCount);
}

export function App() {
  const [identity, setIdentity] = useState<GameIdentity | null>(null);
  const [save, setSave] = useState<PersistentSave | null>(null);
  const [scene, setScene] = useState<AppScene>({ kind: 'boot' });
  const [notice, setNotice] = useState('게임 데이터를 불러오는 중이에여.');
  const [selectedStageId, setSelectedStageId] = useState('stage_1');
  const [battleBootstrap, setBattleBootstrap] = useState<BattleState | null>(null);
  const soundControllerRef = useRef<MagicSoundController>(new MagicSoundController());

  const persistSave = useEffectEvent((nextSave: PersistentSave) => {
    if (!identity) {
      return;
    }

    saveProgress(identity.key, nextSave);
  });

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const resolvedIdentity = await resolveGameIdentity();
      if (cancelled) {
        return;
      }

      const loadedSave = loadSave(resolvedIdentity.key);
      setIdentity(resolvedIdentity);
      setSave(loadedSave);
      setSelectedStageId(`stage_${Math.min(STAGES.length, Math.max(1, loadedSave.highestClearedStage + 1))}`);
      setNotice(describeIdentityStatus(resolvedIdentity.status));
      startTransition(() => {
        setScene({ kind: 'lobby' });
      });
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!identity || !save) {
      return;
    }

    persistSave(save);
  }, [identity, persistSave, save]);

  useEffect(() => {
    const controller = soundControllerRef.current;
    const onVisibilityChange = () => {
      controller.setAppActive(document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  const battleActive = scene.kind === 'battle';
  const { battleState, chooseUpgrade } = useBattleLoop({
    active: battleActive,
    initialState: battleActive ? battleBootstrap : null,
    save,
    soundController: soundControllerRef.current,
    onBattleStateSnapshot: (snapshot) => {
      if (!save) {
        return;
      }

      const nextSave = setLastRun(save, {
        kind: 'battle',
        stageId: snapshot.stageId,
        lessonId: snapshot.lessonId,
        savedAt: Date.now(),
        state: snapshot,
      });
      setSave(nextSave);
    },
    onComplete: (outcome, finalState) => {
      if (!save) {
        return;
      }

      const lesson = getLessonById(finalState.lessonId);
      const stagedSave = setLastRun(save, outcome.lastRunSnapshot);
      setSave(stagedSave);
      startTransition(() => {
        setScene({
          kind: 'result',
          outcome,
          claimed: false,
          schoolId: lesson.school,
        });
      });
    },
  });

  useEffect(() => {
    if (!scene || scene.kind !== 'battle' || !save) {
      return;
    }

    if (scene.snapshot) {
      setBattleBootstrap(scene.snapshot);
      return;
    }

    setBattleBootstrap(createBattleState(scene.stageId, scene.lessonId, save));
  }, [save, scene]);

  const openClassSelect = (stageId: string) => {
    setSelectedStageId(stageId);
    startTransition(() => {
      setScene({ kind: 'class-select', stageId });
    });
  };

  const startBattle = (stageId: string, lessonId: string, snapshot?: BattleState) => {
    startTransition(() => {
      setScene({ kind: 'battle', stageId, lessonId, snapshot });
    });
  };

  const claimResultRewards = () => {
    if (scene.kind !== 'result' || !save) {
      return;
    }

    const nextSave = applyBattleOutcome(save, scene.outcome, scene.schoolId);
    setSave(nextSave);
    setNotice(
      `${scene.outcome.resultLabel}: 노트 ${scene.outcome.notesReward}, 잉크 ${scene.outcome.inkReward}, 숙련도 +${scene.outcome.masteryGain}`,
    );
    startTransition(() => {
      setScene({
        ...scene,
        claimed: true,
      });
    });
  };

  const resetProgress = () => {
    if (!identity) {
      return;
    }

    const nextSave = clearSave(identity.key);
    setSave(nextSave);
    setSelectedStageId('stage_1');
    setNotice('테스트 저장 데이터를 초기화했어여.');
    startTransition(() => {
      setScene({ kind: 'lobby' });
    });
  };

  const renderLobby = () => {
    const unlockedStages = deriveUnlockedStages(save);
    const quickStage = unlockedStages.at(-1) ?? STAGES[0];

    return (
      <section className="screen">
        <div className="hero-card">
          <div className="eyebrow-row">
            <span className="eyebrow">전체이용가 토스 게임</span>
            <span className="status-pill">3초 시작</span>
          </div>
          <h1>컬러 파크 러시</h1>
          <p className="hero-copy">가볍게 한 판, 바로 다음 판! 누구나 쉽게 즐기는 2~3분 라운드예요.</p>
          <div className="inline-actions">
            <button className="primary-button" type="button" onClick={() => openClassSelect(quickStage.id)}>
              지금 시작
            </button>
            <button className="secondary-button" type="button" onClick={() => setScene({ kind: 'library' })}>
              컬렉션
            </button>
            <button className="ghost-button" type="button" onClick={() => setScene({ kind: 'settings' })}>
              설정
            </button>
          </div>
        </div>

        <section className="panel compact-panel">
          <h2>30초 튜토리얼 L20</h2>
          <ul className="plain-list">
            <li>1) 모드 선택 후 바로 시작</li>
            <li>2) 전투 중 레벨업 카드 1장 선택</li>
            <li>3) 결과에서 보상 받고 바로 재도전</li>
          </ul>
        </section>

        <section className="panel compact-panel">
          <div className="panel-header">
            <h2>라운드 선택</h2>
            <span className="muted">최고 {save?.highestClearedStage ?? 0} / {STAGES.length}</span>
          </div>
          <div className="stage-list">
            {unlockedStages.map((stage) => (
              <button
                key={stage.id}
                className={`stage-card ${selectedStageId === stage.id ? 'is-active' : ''}`}
                type="button"
                onClick={() => openClassSelect(stage.id)}
              >
                <div className="stage-card-top">
                  <span>{stage.title}</span>
                  <strong>Stage {formatStageId(stage.id)}</strong>
                </div>
              </button>
            ))}
          </div>
        </section>
      </section>
    );
  };

  const renderClassSelect = (stageId: string) => (
    <section className="screen">
      <div className="panel-header">
        <div>
          <span className="eyebrow">Stage {formatStageId(stageId)}</span>
          <h1 className="screen-title">모드를 골라여</h1>
        </div>
        <div className="inline-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              const pick = LESSONS[Math.floor(Math.random() * LESSONS.length)];
              if (pick) startBattle(stageId, pick.id);
            }}
          >
            랜덤 시작
          </button>
          <button className="ghost-button" type="button" onClick={() => setScene({ kind: 'lobby' })}>
            로비
          </button>
        </div>
      </div>

      <div className="lesson-grid">
        {LESSONS.map((lesson) => (
          <button
            key={lesson.id}
            className="lesson-card"
            type="button"
            onClick={() => startBattle(stageId, lesson.id)}
          >
            <div className="lesson-meta" style={{ color: SCHOOL_LABELS[lesson.school].accent }}>
              {SCHOOL_LABELS[lesson.school].name}
            </div>
            <strong>{lesson.name}</strong>
            <p>{lesson.description}</p>
          </button>
        ))}
      </div>
    </section>
  );

  const renderBattle = () => {
    const lesson = scene.kind === 'battle' ? getLessonById(scene.lessonId) : null;

    return (
      <section className="battle-screen">
        {battleState ? (
          <>
            <div className="battle-hud">
              <div className="battle-hud-card">
                <span className="eyebrow">Stage {formatStageId(battleState.stageId)}</span>
                <strong>{lesson?.name}</strong>
              </div>
              <div className="battle-hud-card">
                <span className="muted">결계</span>
                <strong>
                  {Math.ceil(battleState.barrierHp)} / {battleState.barrierMaxHp}
                </strong>
              </div>
              <div className="battle-hud-card">
                <span className="muted">노트</span>
                <strong>{battleState.notesCollected}</strong>
              </div>
            </div>

            <BattleCanvas state={battleState} />

            <div className="battle-footer">
              <div className="xp-bar">
                <div
                  className="xp-fill"
                  style={{ width: `${(battleState.xp / battleState.nextLevelXp) * 100}%` }}
                />
              </div>
              <div className="battle-footer-row">
                <span>레벨 {battleState.level}</span>
                <span>처치 {battleState.totalKills}</span>
                <span>남은 {Math.max(0, 180 - Math.round(battleState.elapsedMs / 1000))}초</span>
                <span>경과 {Math.max(1, Math.round(battleState.elapsedMs / 1000))}초</span>
                <button className="ghost-button" type="button" onClick={() => setScene({ kind: 'class-select', stageId: battleState.stageId })}>
                  빠른 재시작
                </button>
              </div>
            </div>

            {battleState.status === 'level-up' ? (
              <div className="overlay">
                <section className="overlay-card">
                  <span className="eyebrow">라운드 보너스</span>
                  <h2>다음 강화 카드를 골라여</h2>
                  <div className="choice-list">
                    {battleState.pendingChoices.map((choice) => (
                      <button
                        key={choice.id}
                        className="choice-card"
                        type="button"
                        onClick={() => chooseUpgrade(choice.id)}
                      >
                        <strong>{choice.label}</strong>
                        <p>{choice.body}</p>
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            ) : null}
          </>
        ) : (
          <div className="panel compact-panel">
            <h2>시험장을 준비하는 중이에여...</h2>
          </div>
        )}
      </section>
    );
  };

  const renderResult = (outcome: BattleOutcome, claimed: boolean) => (
    <section className="screen">
      <div className="hero-card result-hero">
        <span className="eyebrow">{outcome.status === 'victory' ? '클리어' : '재도전'}</span>
        <h1>{outcome.resultLabel}</h1>
        <p className="hero-copy">{outcome.summary}</p>
      </div>

      <section className="panel compact-panel">
        <div className="battle-footer-row">
          <strong>노트 +{outcome.notesReward}</strong>
          <strong>잉크 +{outcome.inkReward}</strong>
          <strong>숙련도 +{outcome.masteryGain}</strong>
        </div>
        {outcome.timeBonusNotes > 0 ? (
          <p className="muted">⏱ 3분 챌린지 보너스 +{outcome.timeBonusNotes} 노트 (기록 {outcome.elapsedSec}초)</p>
        ) : (
          <p className="muted">⏱ 3분 챌린지 목표: {outcome.timeLimitSec}초 이내 클리어</p>
        )}
      </section>

      <section className="panel compact-panel">
        <div className="panel-header">
          <h2>시간제한 챌린지</h2>
          <span className="muted">3분 내 클리어 목표</span>
        </div>
        <ul className="plain-list">
          <li>3분 안에 클리어하는 속도 플레이 도전</li>
          <li>다른 모드를 선택해 빌드 다양성 확보</li>
          <li>클리어 후 즉시 재도전으로 템포 유지</li>
        </ul>
      </section>

      <section className="result-actions">
        <button className="primary-button" type="button" onClick={claimResultRewards} disabled={claimed}>
          {claimed ? '보상 완료' : '보상 받기'}
        </button>
        <button
          className="secondary-button"
          type="button"
          disabled={!claimed}
          onClick={() => setScene({ kind: 'class-select', stageId: outcome.stageId })}
        >
          다시 플레이
        </button>
        <button className="ghost-button" type="button" disabled={!claimed} onClick={() => setScene({ kind: 'lobby' })}>
          로비
        </button>
      </section>
    </section>
  );

  const renderLibrary = () => (
    <section className="screen">
      <div className="panel-header">
        <div>
          <span className="eyebrow">컬렉션</span>
          <h1 className="screen-title">컬렉션 업그레이드를 정비해여</h1>
        </div>
        <button className="ghost-button" type="button" onClick={() => setScene({ kind: 'lobby' })}>
          로비
        </button>
      </div>

      <section className="panel">
        <div className="currency-row">
          <span>학습 노트 {save?.currencies.notes ?? 0}</span>
          <span>마력 잉크 {save?.currencies.ink ?? 0}</span>
        </div>
      </section>

      <div className="upgrade-list">
        {LIBRARY_UPGRADES.map((upgrade) => {
          const currentLevel = save?.libraryLevels[upgrade.id] ?? 0;
          const canBuy = Boolean(save) && currentLevel < upgrade.maxLevel && (save?.currencies.notes ?? 0) >= upgrade.noteCost;
          return (
            <section key={upgrade.id} className="panel upgrade-card">
              <div>
                <strong>{upgrade.name}</strong>
                <p>{upgrade.body}</p>
              </div>
              <div className="upgrade-footer">
                <span>
                  Lv {currentLevel} / {upgrade.maxLevel}
                </span>
                <button
                  className="secondary-button"
                  type="button"
                  disabled={!canBuy}
                  onClick={() => save && setSave(buyLibraryUpgrade(save, upgrade.id))}
                >
                  {upgrade.noteCost} 노트 연구
                </button>
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );

  const renderSettings = () => (
    <section className="screen">
      <div className="panel-header">
        <div>
          <span className="eyebrow">설정</span>
          <h1 className="screen-title">필수 설정</h1>
        </div>
        <button className="ghost-button" type="button" onClick={() => setScene({ kind: 'lobby' })}>
          로비
        </button>
      </div>

      <section className="panel compact-panel">
        <div className="settings-row">
          <div>
            <strong>사운드</strong>
            <p>효과음을 켜거나 끄기</p>
          </div>
          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              const nextEnabled = document.documentElement.dataset.sound !== 'off';
              document.documentElement.dataset.sound = nextEnabled ? 'off' : 'on';
              soundControllerRef.current.setEnabled(!nextEnabled);
            }}
          >
            {document.documentElement.dataset.sound === 'off' ? '사운드 켜기' : '사운드 끄기'}
          </button>
        </div>
      </section>

      <section className="panel compact-panel">
        <button className="danger-button" type="button" onClick={resetProgress}>
          저장 초기화
        </button>
      </section>
    </section>
  );

    return (
    <main className="app-shell">
      <div className="app-background" />
      <div className="app-frame">
        <header className="top-banner">
          <div>
            <span className="eyebrow">컬러 파크</span>
            <strong className="banner-title">컬러 파크 러시</strong>
          </div>
          <span className="banner-notice">{notice}</span>
        </header>

        {scene.kind === 'boot' ? (
          <section className="screen">
            <div className="hero-card">
              <span className="eyebrow">부트 중</span>
              <h1>게임 입장 준비</h1>
              <p className="hero-copy">토스 게임 로그인과 로컬 저장소를 확인하는 중이에여.</p>
            </div>
          </section>
        ) : null}
        {scene.kind === 'lobby' ? renderLobby() : null}
        {scene.kind === 'class-select' ? renderClassSelect(scene.stageId) : null}
        {scene.kind === 'battle' ? renderBattle() : null}
        {scene.kind === 'result' ? renderResult(scene.outcome, scene.claimed) : null}
        {scene.kind === 'library' ? renderLibrary() : null}
        {scene.kind === 'settings' ? renderSettings() : null}
      </div>
    </main>
  );
}
