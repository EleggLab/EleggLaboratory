import { startTransition, useEffect, useRef, useState } from 'react';
import { useEffectEvent } from 'react';
import { BattleCanvas } from '../components/BattleCanvas';
import {
  FREE_APP_RULES,
  ENEMIES,
  getLessonById,
  getStageById,
  LESSONS,
  LIBRARY_UPGRADES,
  PASSIVES,
  RELICS,
  SCHOOL_LABELS,
  SPELLS,
  STAGES,
} from '../game/content';
import { createBattleSnapshot, createBattleState } from '../game/engine';
import {
  applyBattleOutcome,
  buyLibraryUpgrade,
  clearSave,
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
  UpgradeChoice,
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

function getResultFlow(outcome: BattleOutcome) {
  const currentStageNumber = formatStageId(outcome.stageId);
  const hasNextStage = outcome.status === 'victory' && currentStageNumber < STAGES.length;
  const unlockedFinalStage = outcome.status === 'victory' && currentStageNumber === STAGES.length;

  return {
    hasNextStage,
    nextStageId: hasNextStage ? `stage_${currentStageNumber + 1}` : outcome.stageId,
    nextLabel: hasNextStage
      ? `다음 시험 Stage ${currentStageNumber + 1}`
      : unlockedFinalStage
        ? '최종 시험 다시 보기'
        : '같은 시험 다시 준비',
    rewardNotice: hasNextStage
      ? `${outcome.resultLabel}: 노트 ${outcome.notesReward}, 잉크 ${outcome.inkReward}, 숙련도 +${outcome.masteryGain} / Stage ${currentStageNumber + 1} 개방`
      : unlockedFinalStage
        ? `${outcome.resultLabel}: 노트 ${outcome.notesReward}, 잉크 ${outcome.inkReward}, 숙련도 +${outcome.masteryGain} / 최고 시험까지 완주`
        : `${outcome.resultLabel}: 노트 ${outcome.notesReward}, 잉크 ${outcome.inkReward}, 숙련도 +${outcome.masteryGain}`,
  };
}

function formatIdentityBadge(identity: GameIdentity | null) {
  if (!identity) {
    return '로딩 중';
  }

  return identity.source === 'toss' ? 'Toss Key' : 'Local Key';
}

function confirmDestructiveAction(message: string) {
  if (typeof window === 'undefined') {
    return true;
  }

  return window.confirm(message);
}

function deriveUnlockedStages(save: PersistentSave | null) {
  const highestCleared = save?.highestClearedStage ?? 0;
  const unlockedCount = Math.min(STAGES.length, Math.max(1, highestCleared + 1));
  return STAGES.slice(0, unlockedCount);
}

function getLessonFlavor(lessonId: string) {
  switch (lessonId) {
    case 'lesson_firebolt_practice':
      return {
        difficulty: '쉬움',
        focus: '첫 승리 추천',
        playstyle: '빠르게 주문을 굴려 초반 웨이브를 안정적으로 지우는 표준 빌드예여.',
      };
    case 'lesson_ember_barrier':
      return {
        difficulty: '보통',
        focus: '안정 운영',
        playstyle: '결계를 오래 버티면서 실수를 줄이는 방어형 스타트예여.',
      };
    case 'lesson_meteor_lab':
      return {
        difficulty: '도전',
        focus: '보스 압축',
        playstyle: '초반은 조금 느리지만 보스전에 강한 고점형 스타트예여.',
      };
    default:
      return {
        difficulty: '보통',
        focus: '기본 수업',
        playstyle: '지금 시험에 맞는 기본 빌드예여.',
      };
  }
}

function getBattleObjective(state: BattleState) {
  const stage = getStageById(state.stageId);
  const currentWave = stage.waves[state.waveIndex];
  const bossWave = stage.waves[stage.bossWaveIndex];
  const bossEnemy = ENEMIES[bossWave.enemyId];

  if (!currentWave) {
    return {
      detail: '실기시험을 마무리하는 중이에요.',
      label: '마무리',
      progress: 100,
      status: '최종 정리',
    };
  }

  const currentEnemy = ENEMIES[currentWave.enemyId];
  const spawnedRatio = currentWave.count > 0 ? state.waveSpawnedCount / currentWave.count : 0;
  const progress = Math.min(100, Math.round(((state.waveIndex + spawnedRatio) / stage.waves.length) * 100));
  const wavesUntilBoss = Math.max(0, stage.bossWaveIndex - state.waveIndex);
  const spawnLeft = Math.max(0, currentWave.count - state.waveSpawnedCount);

  if (state.waveIndex >= stage.bossWaveIndex) {
    return {
      detail: `${bossEnemy.name}을 밀어내면 오늘 수업이 끝나요. 결계 체력을 지키면서 집중 화력을 유지하세요.`,
      label: '최종 실기시험',
      progress,
      status: '보스 웨이브',
    };
  }

  if (wavesUntilBoss === 1) {
    return {
      detail: `다음 웨이브에 ${bossEnemy.name}이 등장해요. 지금 레벨업 카드와 결계 체력을 정비해 두세요.`,
      label: '보스 직전',
      progress,
      status: `현재 ${currentEnemy.name} ${spawnLeft} 추가 소환 / 전장 ${state.enemies.length}체`,
    };
  }

  return {
    detail: `${currentEnemy.name} 흐름을 정리하면서 보스까지 버티세요. 템포를 잃지 않으면 다음 선택 카드가 빨리 열려요.`,
    label: `보스까지 ${wavesUntilBoss}웨이브`,
    progress,
    status: `${currentEnemy.name} ${spawnLeft} 추가 소환 / 전장 ${state.enemies.length}체`,
  };
}

function getChoicePresentation(choice: UpgradeChoice, state: BattleState) {
  switch (choice.kind) {
    case 'spell-unlock': {
      const spell = SPELLS[choice.targetId];
      const school = SCHOOL_LABELS[spell.school];
      const role = spell.kind === 'support' ? '회복 루프' : spell.kind === 'pulse' ? '광역 정리' : '단일 압박';
      return {
        badge: '새 주문',
        hint: `${role}을 열어 주는 선택이에여.`,
        meta: `${school.name} / 재사용 ${(spell.baseCooldownMs / 1000).toFixed(1)}초 / 위력 ${spell.baseDamage}`,
        tone: 'spell',
      } as const;
    }
    case 'spell-upgrade': {
      const spell = SPELLS[choice.targetId];
      const currentLevel = state.spellLevels[choice.targetId] ?? 1;
      return {
        badge: `주문 강화 Lv ${currentLevel} -> ${currentLevel + 1}`,
        hint: spell.kind === 'projectile'
          ? '직접 화력이 올라가서 보스 압박이 빨라져여.'
          : spell.kind === 'pulse'
            ? '웨이브 정리가 빨라져서 숨 돌릴 시간이 늘어나여.'
            : '결계 유지력이 좋아져서 실수를 버틸 수 있어여.',
        meta: `${spell.name} / 위력 +30% / 범위 +8`,
        tone: 'spell',
      } as const;
    }
    case 'passive': {
      const passive = PASSIVES[choice.targetId];
      const currentLevel = state.passiveLevels[choice.targetId] ?? 0;
      return {
        badge: `패시브 Lv ${currentLevel} -> ${currentLevel + 1}`,
        hint: passive.description,
        meta: `최대 ${passive.maxLevel}레벨 / 이번 시험 전체에 적용`,
        tone: 'passive',
      } as const;
    }
    case 'relic': {
      const relic = RELICS[choice.targetId];
      return {
        badge: '유물 획득',
        hint: relic.description,
        meta: '이번 시험 동안 유지 / 중복 없이 1회 획득',
        tone: 'relic',
      } as const;
    }
  }
}

function restorePendingResult(lastRun: PersistentSave['lastRun']) {
  if (!lastRun || lastRun.kind !== 'result') {
    return null;
  }

  type StoredResult = Extract<NonNullable<PersistentSave['lastRun']>, { kind: 'result' }>['outcome'];
  const stored = lastRun.outcome as Partial<StoredResult>;
  if (
    !stored
    || !stored.schoolId
    || !stored.stageId
    || !stored.status
    || typeof stored.notesReward !== 'number'
    || typeof stored.inkReward !== 'number'
    || typeof stored.masteryGain !== 'number'
    || typeof stored.resultLabel !== 'string'
    || typeof stored.summary !== 'string'
  ) {
    return null;
  }

  return {
    outcome: {
      stageId: stored.stageId,
      status: stored.status,
      resultLabel: stored.resultLabel,
      summary: stored.summary,
      notesReward: stored.notesReward,
      inkReward: stored.inkReward,
      masteryGain: stored.masteryGain,
      lastRunSnapshot: lastRun,
    } satisfies BattleOutcome,
    schoolId: stored.schoolId,
  };
}

export function App() {
  const [identity, setIdentity] = useState<GameIdentity | null>(null);
  const [save, setSave] = useState<PersistentSave | null>(null);
  const [scene, setScene] = useState<AppScene>({ kind: 'boot' });
  const [notice, setNotice] = useState('게임 데이터를 불러오는 중이에여.');
  const [selectedStageId, setSelectedStageId] = useState('stage_1');
  const [battleBootstrap, setBattleBootstrap] = useState<BattleState | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const soundControllerRef = useRef<MagicSoundController>(new MagicSoundController());
  const activeBattleSceneKeyRef = useRef<string | null>(null);
  const resultClaimGuardRef = useRef(false);

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

      let loadedSave = loadSave(resolvedIdentity.key);
      const restoredResult = restorePendingResult(loadedSave.lastRun);
      if (loadedSave.lastRun?.kind === 'result' && !restoredResult) {
        loadedSave = setLastRun(loadedSave, null);
      }

      setIdentity(resolvedIdentity);
      setSave(loadedSave);
      setSelectedStageId(restoredResult?.outcome.stageId ?? `stage_${Math.min(STAGES.length, Math.max(1, loadedSave.highestClearedStage + 1))}`);
      setNotice(restoredResult ? '미수령 시험 결과를 복구했어여.' : describeIdentityStatus(resolvedIdentity.status));
      startTransition(() => {
        if (restoredResult) {
          setScene({
            kind: 'result',
            outcome: restoredResult.outcome,
            claimed: false,
            schoolId: restoredResult.schoolId,
          });
          return;
        }

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
    document.documentElement.dataset.sound = soundEnabled ? 'on' : 'off';
    soundControllerRef.current.setEnabled(soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    const controller = soundControllerRef.current;
    const onVisibilityChange = () => {
      controller.setAppActive(document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  useEffect(() => {
    if (scene.kind !== 'result') {
      resultClaimGuardRef.current = false;
      return;
    }

    if (!scene.claimed) {
      resultClaimGuardRef.current = false;
    }
  }, [scene]);

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
    if (scene.kind !== 'battle') {
      activeBattleSceneKeyRef.current = null;
      setBattleBootstrap(null);
      return;
    }

    const sceneKey = scene.snapshot
      ? `resume:${scene.stageId}:${scene.lessonId}:${scene.snapshot.elapsedMs}`
      : `fresh:${scene.stageId}:${scene.lessonId}`;

    if (activeBattleSceneKeyRef.current === sceneKey) {
      return;
    }

    if (scene.snapshot) {
      activeBattleSceneKeyRef.current = sceneKey;
      setBattleBootstrap(scene.snapshot);
      return;
    }

    if (!save) {
      return;
    }

    activeBattleSceneKeyRef.current = sceneKey;
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

  const leaveBattleToLobby = () => {
    if (scene.kind !== 'battle' || !battleState || !save) {
      return;
    }

    const nextSave = setLastRun(save, {
      kind: 'battle',
      stageId: battleState.stageId,
      lessonId: battleState.lessonId,
      savedAt: Date.now(),
      state: createBattleSnapshot(battleState),
    });
    setSave(nextSave);
    setSelectedStageId(battleState.stageId);
    setNotice(`Stage ${formatStageId(battleState.stageId)} 진행을 저장하고 로비로 돌아왔어여.`);
    startTransition(() => {
      setScene({ kind: 'lobby' });
    });
  };

  const claimResultRewards = () => {
    if (scene.kind !== 'result' || !save || resultClaimGuardRef.current) {
      return;
    }

    resultClaimGuardRef.current = true;
    const resultFlow = getResultFlow(scene.outcome);
    const nextSave = {
      ...applyBattleOutcome(save, scene.outcome, scene.schoolId),
      lastRun: null,
    };
    setSave(nextSave);
    setNotice(resultFlow.rewardNotice);
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

    if (!confirmDestructiveAction('저장된 학습 노트, 잉크, 진행 기록을 모두 지울까여? 이 작업은 되돌릴 수 없어여.')) {
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

  const clearInterruptedRun = () => {
    if (!save?.lastRun) {
      return;
    }

    if (!confirmDestructiveAction('중단된 시험 기록을 정리할까여? 이어서 시험 보기는 더 이상 할 수 없어여.')) {
      return;
    }

    setSave(setLastRun(save, null));
    setNotice('중단된 시험 기록을 정리했어여.');
  };

  const renderLobby = () => {
    const unlockedStages = deriveUnlockedStages(save);
    const lastRun = save?.lastRun;

    return (
      <section className="screen">
        <div className="hero-card">
          <div className="eyebrow-row">
            <span className="eyebrow">무료 토스 게임 미니앱</span>
            <span className="status-pill">{formatIdentityBadge(identity)}</span>
          </div>
          <h1>오늘의 마법수업</h1>
          <p className="hero-copy">
            수업을 고르고, 결계시험에서 바로 검증하는 2~3분짜리 무료 오토배틀 게임이에여.
          </p>
          <div className="rule-list">
            {FREE_APP_RULES.map((rule) => (
              <span key={rule} className="rule-chip">
                {rule}
              </span>
            ))}
          </div>
        </div>

        <div className="panel-grid">
          <section className="panel">
            <div className="panel-header">
              <h2>오늘의 시험</h2>
              <button className="ghost-button" type="button" onClick={() => setScene({ kind: 'library' })}>
                도서관
              </button>
            </div>
            <p className="muted">
              현재 최고 통과 스테이지: {save?.highestClearedStage ?? 0} / {STAGES.length}
            </p>
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
                  <p>
                    클리어 보상 노트 {stage.completionNotes}
                    {stage.completionInk > 0 ? ` / 잉크 ${stage.completionInk}` : ''}
                  </p>
                </button>
              ))}
            </div>
          </section>

          <section className="panel compact-panel">
            <h2>학생 기록</h2>
            <div className="stat-grid">
              <div>
                <span className="muted">학습 노트</span>
                <strong>{save?.currencies.notes ?? 0}</strong>
              </div>
              <div>
                <span className="muted">마력 잉크</span>
                <strong>{save?.currencies.ink ?? 0}</strong>
              </div>
              <div>
                <span className="muted">화염학 숙련도</span>
                <strong>{save?.schoolMastery.flame ?? 0}</strong>
              </div>
              <div>
                <span className="muted">저장 키</span>
                <strong>{identity?.source === 'toss' ? 'Toss' : 'Local'}</strong>
              </div>
            </div>
          </section>
        </div>

        {lastRun?.kind === 'battle' ? (
          <section className="panel resume-panel">
            <div>
              <h2>중단된 시험</h2>
              <p className="muted">
                Stage {formatStageId(lastRun.stageId)} / {getLessonById(lastRun.lessonId).name} / {Math.round(lastRun.state.elapsedMs / 1000)}초 진행
              </p>
            </div>
            <div className="inline-actions">
              <button
                className="primary-button"
                type="button"
                onClick={() => startBattle(lastRun.stageId, lastRun.lessonId, lastRun.state)}
              >
                이어서 시험 보기
              </button>
              <button
                className="ghost-button"
                type="button"
                onClick={clearInterruptedRun}
              >
                기록 정리
              </button>
            </div>
          </section>
        ) : null}

        <section className="panel compact-panel">
          <div className="panel-header">
            <h2>설정과 도움말</h2>
            <button className="ghost-button" type="button" onClick={() => setScene({ kind: 'settings' })}>
              열기
            </button>
          </div>
          <p className="muted">{notice}</p>
        </section>
      </section>
    );
  };

  const renderClassSelect = (stageId: string) => (
    <section className="screen">
      <div className="panel-header">
        <div>
          <span className="eyebrow">Stage {formatStageId(stageId)}</span>
          <h1 className="screen-title">오늘 들을 수업을 골라여</h1>
        </div>
        <button className="ghost-button" type="button" onClick={() => setScene({ kind: 'lobby' })}>
          로비
        </button>
      </div>

      <section className="panel class-brief">
        {(() => {
          const stage = getStageById(stageId);
          const boss = ENEMIES[stage.waves[stage.bossWaveIndex].enemyId];
          return (
            <>
              <div>
                <span className="eyebrow">시험 브리핑</span>
                <h2>{stage.title}</h2>
                <p>
                  이번 시험의 마지막 상대는 <strong>{boss.name}</strong>이고,
                  기본 보상은 노트 {stage.completionNotes}
                  {stage.completionInk > 0 ? ` / 잉크 ${stage.completionInk}` : ''}예여.
                </p>
              </div>
              <div className="rule-list">
                <span className="rule-chip">보스 웨이브 포함</span>
                <span className="rule-chip">수업 1개만 선택</span>
                <span className="rule-chip">카드 선택으로 빌드 강화</span>
              </div>
            </>
          );
        })()}
      </section>

      <div className="lesson-grid">
        {LESSONS.map((lesson) => {
          const flavor = getLessonFlavor(lesson.id);
          const spellNames = lesson.startingSpellIds.map((spellId) => SPELLS[spellId]?.name ?? spellId);
          const passiveNames = Object.keys(lesson.startingPassives).map(
            (passiveId) => PASSIVES[passiveId]?.name ?? passiveId,
          );

          return (
            <button
              key={lesson.id}
              className="lesson-card"
              type="button"
              onClick={() => startBattle(stageId, lesson.id)}
            >
              <div className="lesson-tag-row">
                <div className="lesson-meta" style={{ color: SCHOOL_LABELS[lesson.school].accent }}>
                  {SCHOOL_LABELS[lesson.school].name}
                </div>
                <span className="lesson-tag">{flavor.focus}</span>
              </div>
              <strong>{lesson.name}</strong>
              <p>{lesson.description}</p>
              <small>{lesson.body}</small>

              <div className="lesson-preview-list">
                <div>
                  <span className="muted">시작 주문</span>
                  <strong>{spellNames.join(' / ')}</strong>
                </div>
                <div>
                  <span className="muted">시작 패시브</span>
                  <strong>{passiveNames.join(' / ')}</strong>
                </div>
                <div>
                  <span className="muted">난이도</span>
                  <strong>{flavor.difficulty}</strong>
                </div>
              </div>

              <div className="lesson-bonus-list">
                <span>영창 속도 {(lesson.castSpeedBonus * 100).toFixed(0)}%</span>
                <span>추가 노트 {(lesson.noteBonus * 100).toFixed(0)}%</span>
              </div>

              <p className="lesson-cta">{flavor.playstyle}</p>
            </button>
          );
        })}
      </div>
    </section>
  );

  const renderBattle = () => {
    const lesson = scene.kind === 'battle' ? getLessonById(scene.lessonId) : null;
    const objective = battleState ? getBattleObjective(battleState) : null;

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

            {objective ? (
              <section className="battle-objective-card">
                <div className="battle-objective-copy">
                  <span className="eyebrow">{objective.label}</span>
                  <strong>{objective.detail}</strong>
                </div>
                <div className="battle-objective-progress">
                  <div className="battle-objective-track">
                    <div className="battle-objective-fill" style={{ width: `${objective.progress}%` }} />
                  </div>
                  <span className="muted">{objective.status}</span>
                </div>
              </section>
            ) : null}

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
                <span>선택 {battleState.choiceCount}회</span>
              </div>
            </div>

            <div className="inline-actions">
              <button className="ghost-button" type="button" onClick={leaveBattleToLobby}>
                진행 저장 후 로비로
              </button>
            </div>

            {battleState.status === 'level-up' ? (
              <div className="overlay">
                <section className="overlay-card">
                  <span className="eyebrow">교수 피드백</span>
                  <h2>다음 강화 카드를 골라여</h2>
                  <p className="muted">한 장만 골라 이번 시험의 템포를 바꿀 수 있어여.</p>
                  <div className="choice-list">
                    {battleState.pendingChoices.map((choice) => {
                      const presentation = getChoicePresentation(choice, battleState);
                      return (
                        <button
                          key={choice.id}
                          className={`choice-card is-${presentation.tone}`}
                          type="button"
                          onClick={() => chooseUpgrade(choice.id)}
                        >
                          <div className="choice-card-head">
                            <span className="choice-card-badge">{presentation.badge}</span>
                            <span className="choice-card-meta">{presentation.meta}</span>
                          </div>
                          <strong>{choice.label}</strong>
                          <p>{choice.body}</p>
                          <small className="choice-card-hint">{presentation.hint}</small>
                        </button>
                      );
                    })}
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

  const renderResult = (outcome: BattleOutcome, claimed: boolean) => {
    const resultFlow = getResultFlow(outcome);

    return (
      <section className="screen">
        <div className="hero-card result-hero">
          <span className="eyebrow">{outcome.status === 'victory' ? '시험 통과' : '재도전 필요'}</span>
          <h1>{outcome.resultLabel}</h1>
          <p className="hero-copy">{outcome.summary}</p>
        </div>

        <section className="panel">
          <div className="stat-grid">
            <div>
              <span className="muted">학습 노트</span>
              <strong>{outcome.notesReward}</strong>
            </div>
            <div>
              <span className="muted">마력 잉크</span>
              <strong>{outcome.inkReward}</strong>
            </div>
            <div>
              <span className="muted">숙련도</span>
              <strong>+{outcome.masteryGain}</strong>
            </div>
            <div>
              <span className="muted">기록</span>
              <strong>{outcome.status === 'victory' ? '통과' : '실패'}</strong>
            </div>
          </div>
        </section>

        <section className="result-actions">
          <button className="primary-button" type="button" onClick={claimResultRewards} disabled={claimed}>
            {claimed ? '보상 반영 완료' : '기본 보상 받기'}
          </button>
          {claimed ? (
            <>
              <button
                className="secondary-button"
                type="button"
                onClick={() => openClassSelect(resultFlow.nextStageId)}
              >
                {resultFlow.nextLabel}
              </button>
              <button className="ghost-button" type="button" onClick={() => setScene({ kind: 'library' })}>
                도서관 가기
              </button>
              <button className="ghost-button" type="button" onClick={() => openClassSelect(outcome.stageId)}>
                다시 하기
              </button>
            </>
          ) : (
            <p className="muted">
              보상을 먼저 반영하면 <strong>{resultFlow.nextLabel}</strong>, 도서관 가기, 다시 하기가 열려여.
            </p>
          )}
        </section>
      </section>
    );
  };

  const renderLibrary = () => (
    <section className="screen">
      <div className="panel-header">
        <div>
          <span className="eyebrow">도서관</span>
          <h1 className="screen-title">영구 성장을 정비해여</h1>
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
          <h1 className="screen-title">도움말과 안전장치</h1>
        </div>
        <button className="ghost-button" type="button" onClick={() => setScene({ kind: 'lobby' })}>
          로비
        </button>
      </div>

      <section className="panel">
        <div className="settings-row">
          <div>
            <strong>사운드</strong>
            <p>간단한 절차형 효과음을 켜거나 끌 수 있어여.</p>
          </div>
          <button
            className="secondary-button"
            type="button"
            onClick={() => setSoundEnabled((current) => !current)}
          >
            {soundEnabled ? '사운드 끄기' : '사운드 켜기'}
          </button>
        </div>
        <div className="settings-row">
          <div>
            <strong>게임 로그인 상태</strong>
            <p>{describeIdentityStatus(identity?.status ?? 'fallback-local')}</p>
          </div>
          <span className="status-pill">{formatIdentityBadge(identity)}</span>
        </div>
      </section>

      <section className="panel">
        <h2>검수 메모</h2>
        <ul className="plain-list">
          <li>광고, 정산, 인앱 결제는 이번 무료 버전에서 제외했어여.</li>
          <li>게임용 토스 WebView 네비게이션과 충돌하지 않도록 상단 안전 영역을 확보했어여.</li>
          <li>브라우저에서는 로컬 테스트 키로 저장하고, Toss 게임 카테고리에서는 실제 게임 로그인을 사용해여.</li>
        </ul>
      </section>

      <section className="panel danger-panel">
        <h2>저장 초기화</h2>
        <p>테스트용으로만 사용해여. 현재 로컬 저장 데이터가 모두 지워져여.</p>
        <button className="danger-button" type="button" onClick={resetProgress}>
          저장 데이터 초기화
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
            <span className="eyebrow">결계시험</span>
            <strong className="banner-title">오늘의 마법수업</strong>
          </div>
          <span className="banner-notice">{notice}</span>
        </header>

        {scene.kind === 'boot' ? (
          <section className="screen">
            <div className="hero-card">
              <span className="eyebrow">부트 중</span>
              <h1>마법학교 입장 준비</h1>
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
