import { startTransition, useEffect, useMemo, useRef, useState } from 'react';
import { useEffectEvent } from 'react';
import { BrickBreakerCanvas } from '../components/BrickBreakerCanvas';
import {
  AUGMENTS,
  BLOCK_CATALOG,
  BOSSES,
  CREWS,
  HOME_RULE_CHIPS,
  SUPPLY_REWARDS,
  getAugmentById,
  getBossById,
  getCrewById,
} from '../game/content';
import {
  BOARD_ROWS,
  beginAim,
  chooseAugment,
  createNewRun,
  createRunSummary,
  getBossWavePreview,
  getBossWaveRoadmap,
  getTrajectoryPreview,
  moveAim,
  releaseAim,
  stepRun,
  useCrewSkill,
} from '../game/engine';
import {
  claimDailySupply,
  createInitialSave,
  finishRun,
  getRunRewardBreakdown,
  getDateKey,
  loadSave,
  normalizeDailySupply,
  saveProgress,
  selectCrew,
  unlockCrew,
  withMergedDiscovery,
  withRunSnapshot,
} from '../game/save';
import type { AppScene, CrewId, HomeTab, NoticeTone, PersistentSave, RunState } from '../game/types';
import { describeIdentityStatus, resolveGameIdentity } from '../platform/toss';

function formatIdentityBadge(ready: boolean) {
  return ready ? 'Toss Key' : 'Local Key';
}

function formatPercent(current: number, total: number) {
  if (total === 0) {
    return '0%';
  }

  return `${Math.round((current / total) * 100)}%`;
}

function formatSeed(seed: number) {
  return `0x${(seed >>> 0).toString(16).toUpperCase().padStart(8, '0')}`;
}

function parseSeedOverride(search: string) {
  const params = new URLSearchParams(search);
  const raw = params.get('seed');
  if (!raw) {
    return null;
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = /^0x/i.test(trimmed)
    ? Number.parseInt(trimmed.slice(2), 16)
    : Number.parseInt(trimmed, 10);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed >>> 0;
}

function buildSeedUrl(seed: number) {
  if (typeof window === 'undefined') {
    return `?seed=${seed}`;
  }

  const url = new URL(window.location.href);
  url.searchParams.set('seed', String(seed >>> 0));
  return url.toString();
}

function buildQaSnapshot(run: RunState, source: string) {
  const bossLabel = run.boss && run.boss.alive
    ? `${run.boss.bossId} ${run.boss.hp}/${run.boss.maxHp}`
    : 'none';

  return [
    'Bounce Stack QA Snapshot',
    `source: ${source}`,
    `qa_url: ${buildSeedUrl(run.initialSeed)}`,
    `seed: ${formatSeed(run.initialSeed)}`,
    `run_id: ${run.runId}`,
    `crew: ${getCrewById(run.crewId).name} (${run.crewId})`,
    `loop: ${run.loop}`,
    `turn: ${run.turn}`,
    `phase: ${run.phase}`,
    `score: ${run.score}`,
    `balls_owned: ${run.ballsOwned}`,
    `guard_charges: ${run.guardCharges}`,
    `skill_charge: ${run.skillCharge}`,
    `skill_ready: ${run.skillReady}`,
    `boss: ${bossLabel}`,
    `augments: ${run.augments.length > 0 ? run.augments.join(', ') : 'none'}`,
    `notice: ${run.notice}`,
    `captured_at: ${new Date().toISOString()}`,
  ].join('\n');
}

function formatRunRewardSummary(baseSummary: string, reward: ReturnType<typeof getRunRewardBreakdown>) {
  if (reward.gems <= 0) {
    return baseSummary;
  }

  const parts: string[] = [];
  if (reward.newAugments > 0) {
    parts.push(`새 증강 ${reward.newAugments}`);
  }
  if (reward.newBosses > 0) {
    parts.push(`새 보스 ${reward.newBosses}`);
  }
  if (reward.newLoopMilestone) {
    parts.push('새 보스 구간 도달');
  }

  return `${baseSummary} 연구 보너스 젬 +${reward.gems}${parts.length > 0 ? ` (${parts.join(', ')})` : ''}.`;
}

function formatAugmentToneLabel(tone: ReturnType<typeof getAugmentById>['tone']) {
  switch (tone) {
    case 'control':
      return '제어';
    case 'defense':
      return '안전';
    case 'tempo':
    default:
      return '템포';
  }
}

function getAugmentStackState(run: RunState, augmentId: ReturnType<typeof getAugmentById>['id']) {
  const augment = getAugmentById(augmentId);
  const current = run.augmentStacks[augmentId] ?? 0;
  const next = Math.min(augment.maxStacks, current + 1);

  return {
    augment,
    currentLabel: current > 0 ? `현재 ${current}/${augment.maxStacks}스택` : '현재 미보유',
    nextLabel: `선택 후 ${next}/${augment.maxStacks}스택`,
  };
}

function getRunPhaseDisplay(run: RunState) {
  switch (run.phase) {
    case 'launch':
      return {
        label: '발사 중',
        toneClass: 'tone-warning',
        helper: '공이 복귀하면 다음 샷과 스킬 타이밍을 다시 준비할 수 있습니다.',
      };
    case 'augment':
      return {
        label: '증강 선택',
        toneClass: 'tone-success',
        helper: '보스 보상 3개 중 다음 루프 운영에 맞는 증강을 고르세요.',
      };
    case 'gameover':
      return {
        label: '런 정리',
        toneClass: 'tone-warning',
        helper: '이번 런 요약과 메타 보상을 확인하고 다음 선택으로 넘어가세요.',
      };
    case 'aim':
    default:
      return {
        label: '조준 중',
        toneClass: 'tone-info',
        helper: '드래그로 조준하고 놓으면 발사됩니다.',
      };
  }
}

async function copyToClipboard(value: string) {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  if (typeof document === 'undefined') {
    throw new Error('Clipboard unavailable');
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'absolute';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

type RunCoach = {
  badge: string;
  title: string;
  body: string;
  tone: NoticeTone;
};

function getRunCoach(run: RunState): RunCoach {
  const dangerBlocks = run.blocks.filter((block) => block.alive && block.row >= (BOARD_ROWS - 2)).length;
  const bossName = run.boss && run.boss.alive ? getBossById(run.boss.bossId).name : null;

  if (run.phase === 'augment') {
    return {
      badge: '증강 선택',
      title: '이번 루프 방향을 정할 카드 1개를 골라 주세요',
      body: '증강은 즉시 적용됩니다. 지금 부족한 화력, 안정성, 예측력을 기준으로 하나만 고르면 됩니다.',
      tone: 'success',
    };
  }

  if (run.phase === 'gameover') {
    return {
      badge: '런 정리',
      title: '기록 저장 여부를 결정할 차례입니다',
      body: '홈으로 저장하면 기록과 결과가 남고, 다시 시작을 누르면 같은 승무원으로 즉시 재도전할 수 있습니다.',
      tone: 'warning',
    };
  }

  if (run.phase === 'launch') {
    return {
      badge: '공 회수 중',
      title: '발사 결과를 기다리며 다음 출발점을 확인하세요',
      body: bossName
        ? `${bossName}에게 타격이 들어가고 있어요. 공이 모두 돌아오면 다음 발사 위치가 정해집니다.`
        : '공이 모두 바닥으로 돌아오면 다음 턴과 새 런처 위치가 확정됩니다.',
      tone: 'info',
    };
  }

  if (run.skillReady) {
    return {
      badge: '스킬 가능',
      title: bossName ? `${bossName} 전에 스킬 각도를 먼저 계산하세요` : '이번 턴은 스킬과 샷 순서를 같이 선택할 수 있어요',
      body: bossName
        ? `보스 체력 ${run.boss?.hp}/${run.boss?.maxHp}. 먼저 스킬을 써도 되고, 각도를 잡은 뒤 바로 발사해도 됩니다.`
        : '캔버스에서 드래그해 바로 쏘거나, 승무원 스킬로 이번 턴의 보드를 먼저 정리할 수 있습니다.',
      tone: 'success',
    };
  }

  if (bossName) {
    return {
      badge: '보스 집중',
      title: `${bossName}을 먼저 압박해야 다음 루프가 열립니다`,
      body: `보스 체력 ${run.boss?.hp}/${run.boss?.maxHp}. 상단 타격 각도를 먼저 열고, 하단 청소는 그 다음으로 미뤄도 됩니다.`,
      tone: 'warning',
    };
  }

  if (dangerBlocks > 0) {
    return {
      badge: '위험선 경고',
      title: '하단 가까운 블록부터 먼저 비우세요',
      body: `위험선 바로 위에 블록 ${dangerBlocks}개가 있습니다. 가장 낮은 열을 먼저 걷어내면 다음 턴 압박이 크게 줄어듭니다.`,
      tone: 'warning',
    };
  }

  if (run.turn === 1) {
    return {
      badge: '첫 샷',
      title: '아래에서 위로 드래그해 천장 반사를 먼저 만드세요',
      body: '첫 턴은 넓게 퍼지는 각도가 유리합니다. 천장이나 측면을 한 번 맞히면 초반 공간을 만들기 쉽습니다.',
      tone: 'info',
    };
  }

  return {
    badge: '조준 중',
    title: '다음 샷으로 가장 위험한 열을 먼저 정리하세요',
    body: `현재 볼 ${run.ballsOwned}개로 연사됩니다. 낮은 줄과 픽업 블록이 겹친 열을 먼저 노리면 다음 턴이 편해집니다.`,
    tone: 'info',
  };
}

export function App() {
  const [scene, setScene] = useState<AppScene>('boot');
  const [tab, setTab] = useState<HomeTab>('play');
  const [save, setSave] = useState<PersistentSave>(createInitialSave());
  const [run, setRun] = useState<RunState | null>(null);
  const [identityReady, setIdentityReady] = useState(false);
  const [identityStatus, setIdentityStatus] = useState(describeIdentityStatus('fallback-local'));
  const [bannerNotice, setBannerNotice] = useState('토스 인앱용 브릭브레이커 런을 준비 중입니다.');
  const runRef = useRef<RunState | null>(null);
  const saveRef = useRef<PersistentSave>(save);
  const identityKeyRef = useRef<string>('bootstrap');
  const crewLineupRef = useRef<HTMLElement | null>(null);
  const seedOverride = useMemo(() => (
    typeof window === 'undefined' ? null : parseSeedOverride(window.location.search)
  ), []);

  const persistSave = useEffectEvent((nextSave: PersistentSave) => {
    saveProgress(identityKeyRef.current, nextSave);
  });

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const resolvedIdentity = await resolveGameIdentity();
      if (cancelled) {
        return;
      }

      identityKeyRef.current = resolvedIdentity.key;
      const loadedSave = normalizeDailySupply(loadSave(resolvedIdentity.key), getDateKey());
      setIdentityReady(resolvedIdentity.source === 'toss');
      setIdentityStatus(describeIdentityStatus(resolvedIdentity.status));
      setBannerNotice(loadedSave.lastRun
        ? '중단된 런이 있어요. 홈에서 이어하기로 바로 복구할 수 있습니다.'
        : seedOverride !== null
          ? `QA 시드 ${formatSeed(seedOverride)}가 준비됐어요. 새 런 시작으로 같은 오프닝을 재현할 수 있습니다.`
          : describeIdentityStatus(resolvedIdentity.status));
      setSave(loadedSave);
      startTransition(() => setScene('home'));
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [seedOverride]);

  useEffect(() => {
    persistSave(save);
  }, [persistSave, save]);

  useEffect(() => {
    runRef.current = run;
  }, [run]);

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  const snapshotRunForRecovery = useEffectEvent((notice: string) => {
    const current = runRef.current;
    if (!current) {
      return;
    }

    const nextSave = withRunSnapshot(withMergedDiscovery(saveRef.current, current.discovery), current);
    saveRef.current = nextSave;
    setSave(nextSave);
    persistSave(nextSave);
    setBannerNotice(notice);
  });

  useEffect(() => {
    if (scene !== 'run') {
      return;
    }

    let frameId = 0;
    let previous = performance.now();

    const tick = (now: number) => {
      if (document.visibilityState === 'hidden') {
        previous = now;
        frameId = window.requestAnimationFrame(tick);
        return;
      }

      const delta = Math.min(24, now - previous);
      previous = now;

      setRun((current) => {
        if (!current || current.phase !== 'launch') {
          return current;
        }

        return stepRun(current, delta);
      });

      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [scene]);

  useEffect(() => {
    if (scene !== 'run') {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        snapshotRunForRecovery('앱 전환을 감지해 현재 런을 저장했어요. 다시 열면 이어서 플레이할 수 있습니다.');
      }
    };

    const handlePageHide = () => {
      snapshotRunForRecovery('현재 런을 안전하게 저장했어요. 홈의 이어하기 카드에서 복구할 수 있습니다.');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [scene, snapshotRunForRecovery]);

  useEffect(() => {
    if (scene !== 'run') {
      return;
    }

    const intervalId = window.setInterval(() => {
      const current = runRef.current;
      if (!current) {
        return;
      }

      setSave((previous) => withRunSnapshot(withMergedDiscovery(previous, current.discovery), current));
    }, 1200);

    return () => window.clearInterval(intervalId);
  }, [scene]);

  useEffect(() => {
    if (!run) {
      return;
    }

    if (run.phase === 'augment' || run.phase === 'gameover') {
      setSave((previous) => withRunSnapshot(withMergedDiscovery(previous, run.discovery), run));
    }

    setBannerNotice(run.notice);
  }, [run]);

  const selectedCrew = getCrewById(save.selectedCrewId);
  const supplySave = normalizeDailySupply(save, getDateKey());
  const nextSupplyReward = SUPPLY_REWARDS[supplySave.dailySupply.claimedCount] ?? null;
  const runPreview = useMemo(() => (run ? getTrajectoryPreview(run) : []), [run]);
  const runCoach = useMemo(() => (run ? getRunCoach(run) : null), [run]);
  const seedOverrideLabel = seedOverride === null ? null : formatSeed(seedOverride);

  const startRun = () => {
    const nextRun = createNewRun(
      save.selectedCrewId,
      seedOverride === null ? undefined : { seed: seedOverride },
    );
    setRun(nextRun);
    setSave((previous) => withRunSnapshot(withMergedDiscovery(previous, nextRun.discovery), nextRun));
    setBannerNotice(nextRun.notice);
    startTransition(() => setScene('run'));
  };

  const copySeedLink = useEffectEvent(async () => {
    if (seedOverride === null) {
      setBannerNotice('현재 URL에는 복사할 QA 시드가 없습니다.');
      return;
    }

    try {
      await copyToClipboard(buildSeedUrl(seedOverride));
      setBannerNotice(`QA 링크를 복사했어요. ${formatSeed(seedOverride)} 시드로 같은 오프닝을 공유할 수 있습니다.`);
    } catch {
      setBannerNotice('QA 링크 복사에 실패했어요. 브라우저 클립보드 권한을 확인해 주세요.');
    }
  });

  const copyRunSnapshot = useEffectEvent(async (targetRun: RunState | null, source: string) => {
    if (!targetRun) {
      setBannerNotice('복사할 런 상태가 아직 없습니다.');
      return;
    }

    try {
      await copyToClipboard(buildQaSnapshot(targetRun, source));
      setBannerNotice(`QA 스냅샷을 복사했어요. 시드 ${formatSeed(targetRun.initialSeed)}로 같은 상황을 다시 열 수 있습니다.`);
    } catch {
      setBannerNotice('QA 스냅샷 복사에 실패했어요. 브라우저 클립보드 권한을 확인해 주세요.');
    }
  });

  const resumeRun = () => {
    if (!save.lastRun) {
      startRun();
      return;
    }

    setRun(save.lastRun);
    setBannerNotice(save.lastRun.notice);
    startTransition(() => setScene('run'));
  };

  const primaryPlayAction = seedOverride !== null ? startRun : save.lastRun ? resumeRun : startRun;
  const primaryPlayLabel = seedOverride !== null ? '고정 시드 새 런 시작' : save.lastRun ? '중단 런 이어하기' : '새 런 시작';

  const stashRunAndLeave = () => {
    snapshotRunForRecovery('런을 홈에 보관했어요. 토스 인앱에서도 이어하기로 바로 복귀할 수 있습니다.');
    setRun(null);
    startTransition(() => {
      setScene('home');
      setTab('play');
    });
  };

  const abandonCurrentRun = () => {
    const current = runRef.current;
    if (!current) {
      return;
    }

    const confirmed = window.confirm('이번 런을 포기할까요? 기록은 남지 않지만 도감 발견 내용은 유지됩니다.');
    if (!confirmed) {
      return;
    }

    const nextSave = withRunSnapshot(withMergedDiscovery(saveRef.current, current.discovery), null);
    saveRef.current = nextSave;
    setSave(nextSave);
    setBannerNotice('이번 런을 포기했어요. 도감 발견 내용은 유지했고, 기록은 남기지 않았습니다.');
    setRun(null);
    startTransition(() => {
      setScene('home');
      setTab('play');
    });
  };

  const finishCurrentRun = () => {
    const current = runRef.current;
    if (!current) {
      return;
    }

    const reward = getRunRewardBreakdown(saveRef.current, current);
    const summary = formatRunRewardSummary(createRunSummary(current), reward);
    setSave((previous) => finishRun(previous, current, summary, reward.gems));
    setBannerNotice(summary);
    setRun(null);
    startTransition(() => {
      setScene('home');
      setTab('play');
    });
  };

  const claimSupplyReward = () => {
    if (!nextSupplyReward) {
      return;
    }

    const nextSave = claimDailySupply(supplySave, nextSupplyReward.gems);
    setSave(nextSave);
    setBannerNotice(`${nextSupplyReward.label} 보급으로 젬 ${nextSupplyReward.gems}개를 받았어요. 잠긴 승무원을 열 수 있습니다.`);
  };

  const unlockCrewCard = (crewId: CrewId, cost: number) => {
    const nextSave = unlockCrew(save, crewId, cost);
    setSave(nextSave);
    setBannerNotice(`${getCrewById(crewId).name}을 해금했어요. 플레이 탭에서 바로 선택해 보세요.`);
  };

  const selectCrewCard = (crewId: CrewId) => {
    const nextSave = selectCrew(save, crewId);
    setSave(nextSave);
    setBannerNotice(`${getCrewById(crewId).name}을 이번 런의 기본 승무원으로 설정했어요.`);
  };

  const discoveredBlockRate = formatPercent(save.discovered.blocks.length, BLOCK_CATALOG.length);
  const discoveredAugmentRate = formatPercent(save.discovered.augments.length, AUGMENTS.length);
  const discoveredBossRate = formatPercent(save.discovered.bosses.length, BOSSES.length);
  const bossRoadmap = getBossWaveRoadmap(4);
  const savedBossPreview = save.lastRun ? getBossWavePreview(save.lastRun.loop, Boolean(save.lastRun.boss?.alive)) : null;

  const renderSupplyTab = () => (
    <section className="screen">
      <section className="hero-card">
        <div className="eyebrow-row">
          <span className="eyebrow">매일 보급</span>
          <span className="status-pill">젬 {save.gems}</span>
        </div>
        <h1>광고 대신 데일리 보급으로 승무원을 해금합니다</h1>
        <p className="hero-copy">
          기존 프로젝트의 보상 탭 성격은 유지하되, 토스 인앱 흐름에 맞게 진입 즉시 광고를 띄우지 않고
          사용자가 원할 때만 보급을 수령하도록 바꿨습니다.
        </p>
        <div className="rule-list">
          {SUPPLY_REWARDS.map((reward) => (
            <span
              key={reward.step}
              className={`rule-chip ${supplySave.dailySupply.claimedCount >= reward.step ? 'is-done-chip' : ''}`}
            >
              {reward.label} +{reward.gems}
            </span>
          ))}
        </div>
        <div className="hero-actions">
          <button
            className="primary-button"
            type="button"
            onClick={claimSupplyReward}
            disabled={!nextSupplyReward}
          >
            {nextSupplyReward ? `${nextSupplyReward.label} 받기` : '오늘 보급 완료'}
          </button>
          <button className="ghost-button" type="button" onClick={() => setTab('play')}>
            승무원 해금하러 가기
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>오늘의 진행</h2>
          <span className="muted">{supplySave.dailySupply.claimedCount} / {SUPPLY_REWARDS.length}</span>
        </div>
        <div className="supply-track">
          {SUPPLY_REWARDS.map((reward) => (
            <div
              key={reward.step}
              className={`supply-step ${supplySave.dailySupply.claimedCount >= reward.step ? 'is-complete' : ''}`}
            >
              <strong>{reward.step}</strong>
              <span>{reward.label}</span>
            </div>
          ))}
        </div>
      </section>
    </section>
  );

  const renderPlayTab = () => (
    <section className="screen">
      <section className="hero-card play-hero">
        <div className="eyebrow-row">
          <span className="eyebrow">Swipe Brick Breaker</span>
          <span className="status-pill">{formatIdentityBadge(identityReady)}</span>
        </div>
        <h1>무엇을 해야 하는지 바로 보이는 홈으로 다시 짰습니다</h1>
        <p className="hero-copy">
          첫 진입에서 가장 중요한 행동은 하나입니다. 승무원을 고르고, 아래에서 위로 드래그해 첫 샷을 쏘는 것.
          그래서 플레이 홈은 선택 상태, 이어하기, 새 런 시작만 가장 먼저 보이게 정리했습니다.
        </p>
        <div className="rule-list">
          {HOME_RULE_CHIPS.map((chip) => (
            <span key={chip} className="rule-chip">
              {chip}
            </span>
          ))}
          {seedOverrideLabel ? (
            <span className="rule-chip">QA 시드 {seedOverrideLabel}</span>
          ) : null}
        </div>
        <div className="hero-actions">
          <button className="primary-button" type="button" onClick={primaryPlayAction}>
            {primaryPlayLabel}
          </button>
          <button className="secondary-button" type="button" onClick={() => setTab('codex')}>
            블록/증강 도감
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>보스 로드맵</h2>
          <span className="muted">엔진 기준 루프 5 간격</span>
        </div>
        <div className="boss-roadmap-grid">
          {bossRoadmap.map((guide) => (
            <article key={guide.cycle} className="boss-roadmap-card">
              <div className="crew-card-head">
                <span className="status-pill tone-info">루프 {guide.loop}</span>
                <span className="muted">{guide.hpBand}</span>
              </div>
              <strong>{guide.bossName}</strong>
              <p>{guide.summary}</p>
              <small>{guide.flankLabel}</small>
            </article>
          ))}
        </div>
      </section>

      {seedOverrideLabel ? (
        <section className="panel compact-panel">
          <div className="panel-header">
            <h2>QA 고정 시드</h2>
            <span className="status-pill tone-info">{seedOverrideLabel}</span>
          </div>
          <p className="muted">
            이 URL에서는 새 런 시작을 누를 때마다 같은 오프닝 보드를 재현합니다. 이어하기는 저장된 런을 그대로 복구합니다.
          </p>
          <div className="inline-actions qa-actions">
            <button className="ghost-button" type="button" onClick={() => void copySeedLink()}>
              QA 링크 복사
            </button>
          </div>
        </section>
      ) : null}

      {save.lastRun ? (
        <section className="panel compact-panel resume-panel">
          <div>
            {savedBossPreview ? (
              <p className="muted boss-brief-copy">
                {savedBossPreview.isCurrent
                  ? `현재 보스: ${savedBossPreview.guide.bossName} / ${savedBossPreview.guide.hpBand} / ${savedBossPreview.guide.flankLabel}`
                  : `다음 보스: ${savedBossPreview.distance}루프 뒤 ${savedBossPreview.guide.bossName} / ${savedBossPreview.guide.hpBand}`}
              </p>
            ) : null}
            <h2>복구 가능한 런</h2>
            <p className="muted">
              {getCrewById(save.lastRun.crewId).name} / 루프 {save.lastRun.loop} / 점수 {save.lastRun.score} / 시드 {formatSeed(save.lastRun.initialSeed)}
            </p>
          </div>
          <div className="inline-actions qa-actions">
            <button className="secondary-button" type="button" onClick={resumeRun}>
              이어서 플레이
            </button>
            <button className="ghost-button" type="button" onClick={() => void copyRunSnapshot(save.lastRun, 'resume-card')}>
              상태 복사
            </button>
          </div>
        </section>
      ) : null}

      <section className="panel">
        <div className="panel-header">
          <h2>현재 선택 승무원</h2>
          <span className="status-pill" style={{ background: `${selectedCrew.accent}1A`, color: selectedCrew.accent }}>
            {selectedCrew.role}
          </span>
        </div>
        <strong className="selected-crew-name">{selectedCrew.name}</strong>
        <p className="muted">{selectedCrew.oneLine}</p>
        <div className="stat-grid">
          <div>
            <span className="muted">패시브</span>
            <strong>{selectedCrew.passive}</strong>
          </div>
          <div>
            <span className="muted">액티브</span>
            <strong>{selectedCrew.active}</strong>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>승무원 라인업</h2>
          <span className="muted">잠긴 승무원은 젬 1개로 즉시 해금</span>
        </div>
        <div className="crew-grid">
          {CREWS.map((crew) => {
            const unlocked = save.unlockedCrewIds.includes(crew.id);
            const selected = save.selectedCrewId === crew.id;
            return (
              <article
                key={crew.id}
                className={`crew-card ${selected ? 'is-selected' : ''} ${unlocked ? '' : 'is-locked'}`}
              >
                <div className="crew-card-head">
                  <span className="crew-role" style={{ background: `${crew.accent}14`, color: crew.accent }}>
                    {crew.role}
                  </span>
                  <span className="muted">{unlocked ? '사용 가능' : `잠김 · 젬 ${crew.unlockCost}`}</span>
                </div>
                <strong>{crew.name}</strong>
                <p>{crew.oneLine}</p>
                <small>{crew.passive}</small>
                <div className="inline-actions">
                  {unlocked ? (
                    <button className={selected ? 'secondary-button' : 'ghost-button'} type="button" onClick={() => selectCrewCard(crew.id)}>
                      {selected ? '선택됨' : '선택'}
                    </button>
                  ) : (
                    <button
                      className="secondary-button"
                      type="button"
                      disabled={save.gems < crew.unlockCost}
                      onClick={() => unlockCrewCard(crew.id, crew.unlockCost)}
                    >
                      {save.gems < crew.unlockCost ? '젬 부족' : '해금'}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="panel-grid">
        <section className="panel">
          <h2>런 기록</h2>
          <div className="stat-grid">
            <div>
              <span className="muted">완료 런</span>
              <strong>{save.records.completedRuns}</strong>
            </div>
            <div>
              <span className="muted">최고 루프</span>
              <strong>{save.records.bestLoop}</strong>
            </div>
            <div>
              <span className="muted">최고 점수</span>
              <strong>{save.records.bestScore}</strong>
            </div>
            <div>
              <span className="muted">누적 보스 격파</span>
              <strong>{save.records.totalBossesDefeated}</strong>
            </div>
          </div>
        </section>
        <section className="panel">
          <h2>최근 정리</h2>
          {save.lastResult ? (
            <p className="muted">{save.lastResult.summary}</p>
          ) : (
            <p className="muted">아직 정리된 런이 없습니다. 첫 런을 시작하면 최근 기록이 여기에 남습니다.</p>
          )}
        </section>
      </section>
    </section>
  );

  const renderPlayTabRefined = () => (
    <section className="screen">
      <section className="hero-card play-hero">
        <div className="eyebrow-row">
          <span className="eyebrow">Swipe Brick Breaker</span>
          <span className="status-pill">{formatIdentityBadge(identityReady)}</span>
        </div>
        <h1>설명 다음에 바로 준비 카드가 나오도록 플레이 흐름을 다시 묶었습니다</h1>
        <p className="hero-copy">
          처음 보는 사람도 이 화면에서 바로 순서를 읽을 수 있게, 시작 설명 다음에 준비 카드와 승무원 라인업을 붙였습니다.
          이어하기, 새 런 시작, QA 시드, 보스 준비 정보도 한 덩어리 안에서 보이게 정리했습니다.
        </p>
        <div className="rule-list">
          {HOME_RULE_CHIPS.map((chip) => (
            <span key={chip} className="rule-chip">
              {chip}
            </span>
          ))}
          {seedOverrideLabel ? (
            <span className="rule-chip">QA 시드 {seedOverrideLabel}</span>
          ) : null}
        </div>
        <div className="hero-actions">
          <button
            className="primary-button"
            type="button"
            onClick={save.lastRun || seedOverrideLabel ? primaryPlayAction : () => crewLineupRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          >
            {save.lastRun || seedOverrideLabel ? primaryPlayLabel : '승무원 확인하고 시작'}
          </button>
          <button className="secondary-button" type="button" onClick={() => setTab('codex')}>
            블록/증강 도감
          </button>
        </div>
      </section>

      <section className="panel play-launch-panel">
        <div className="panel-header">
          <h2>이번 런 준비</h2>
          <span className="status-pill" style={{ background: `${selectedCrew.accent}1A`, color: selectedCrew.accent }}>
            {selectedCrew.role}
          </span>
        </div>
        <div className="play-launch-grid">
          <div className="selected-crew-brief">
            <strong className="selected-crew-name">{selectedCrew.name}</strong>
            <p className="muted">{selectedCrew.oneLine}</p>
            <div className="brief-stat-list">
              <div>
                <span className="muted">패시브</span>
                <strong>{selectedCrew.passive}</strong>
              </div>
              <div>
                <span className="muted">액티브</span>
                <strong>{selectedCrew.active}</strong>
              </div>
            </div>
            {save.lastRun && savedBossPreview ? (
              <p className="muted boss-brief-copy">
                {savedBossPreview.isCurrent
                  ? `현재 보스: ${savedBossPreview.guide.bossName} / ${savedBossPreview.guide.hpBand} / ${savedBossPreview.guide.flankLabel}`
                  : `다음 보스: ${savedBossPreview.distance}루프 뒤 ${savedBossPreview.guide.bossName} / ${savedBossPreview.guide.hpBand}`}
              </p>
            ) : (
              <p className="muted boss-brief-copy">새 런은 현재 선택된 승무원 기준으로 바로 시작됩니다.</p>
            )}
          </div>
          <div className="play-launch-cta">
            <button className="primary-button" type="button" onClick={primaryPlayAction}>
              {seedOverrideLabel ? '고정 시드 새 런 시작' : save.lastRun ? '중단 런 이어하기' : `${selectedCrew.name}으로 새 런 시작`}
            </button>
            {save.lastRun ? (
              <button className="secondary-button" type="button" onClick={startRun}>
                {selectedCrew.name}으로 새 런 시작
              </button>
            ) : null}
            <div className="inline-actions qa-actions">
              {seedOverrideLabel ? (
                <button className="ghost-button" type="button" onClick={() => void copySeedLink()}>
                  QA 링크 복사
                </button>
              ) : null}
              {save.lastRun ? (
                <button className="ghost-button" type="button" onClick={() => void copyRunSnapshot(save.lastRun, 'resume-card')}>
                  중단 런 상태 복사
                </button>
              ) : null}
            </div>
            <p className="action-helper muted">
              {save.lastRun
                ? '이어하기는 중단된 런을 복구하고, 새 런 시작은 지금 선택한 승무원과 규칙으로 다시 출발합니다.'
                : seedOverrideLabel
                  ? `현재 URL의 QA 시드 ${seedOverrideLabel}를 그대로 사용해 같은 오프닝으로 시작합니다.`
                  : '승무원을 바꾸면 이 준비 카드의 시작 버튼 기준도 바로 함께 바뀝니다.'}
            </p>
          </div>
        </div>
      </section>

      <section ref={crewLineupRef} className="panel">
        <div className="panel-header">
          <h2>승무원 라인업</h2>
          <span className="muted">선택을 바꾸면 위 준비 카드의 시작 기준도 함께 바뀝니다</span>
        </div>
        <div className="crew-grid">
          {CREWS.map((crew) => {
            const unlocked = save.unlockedCrewIds.includes(crew.id);
            const selected = save.selectedCrewId === crew.id;
            return (
              <article
                key={crew.id}
                className={`crew-card ${selected ? 'is-selected' : ''} ${unlocked ? '' : 'is-locked'}`}
              >
                <div className="crew-card-head">
                  <span className="crew-role" style={{ background: `${crew.accent}14`, color: crew.accent }}>
                    {crew.role}
                  </span>
                  <span className="muted">{unlocked ? '사용 가능' : `잠김 · 젬 ${crew.unlockCost}`}</span>
                </div>
                <strong>{crew.name}</strong>
                <p>{crew.oneLine}</p>
                <small>{crew.passive}</small>
                <div className="inline-actions">
                  {unlocked ? (
                    <button className={selected ? 'secondary-button' : 'ghost-button'} type="button" onClick={() => selectCrewCard(crew.id)}>
                      {selected ? '선택됨' : '선택'}
                    </button>
                  ) : (
                    <button
                      className="secondary-button"
                      type="button"
                      disabled={save.gems < crew.unlockCost}
                      onClick={() => unlockCrewCard(crew.id, crew.unlockCost)}
                    >
                      {save.gems < crew.unlockCost ? '젬 부족' : '해금'}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>보스 로드맵</h2>
          <span className="muted">기본 주기 루프 5 간격</span>
        </div>
        <div className="boss-roadmap-grid">
          {bossRoadmap.map((guide) => (
            <article key={guide.cycle} className="boss-roadmap-card">
              <div className="crew-card-head">
                <span className="status-pill tone-info">루프 {guide.loop}</span>
                <span className="muted">{guide.hpBand}</span>
              </div>
              <strong>{guide.bossName}</strong>
              <p>{guide.summary}</p>
              <small>{guide.flankLabel}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="panel-grid">
        <section className="panel">
          <h2>런 기록</h2>
          <div className="stat-grid">
            <div>
              <span className="muted">완료 런</span>
              <strong>{save.records.completedRuns}</strong>
            </div>
            <div>
              <span className="muted">최고 루프</span>
              <strong>{save.records.bestLoop}</strong>
            </div>
            <div>
              <span className="muted">최고 점수</span>
              <strong>{save.records.bestScore}</strong>
            </div>
            <div>
              <span className="muted">누적 보스 격파</span>
              <strong>{save.records.totalBossesDefeated}</strong>
            </div>
          </div>
        </section>
        <section className="panel">
          <h2>최근 정리</h2>
          {save.lastResult ? (
            <p className="muted">{save.lastResult.summary}</p>
          ) : (
            <p className="muted">아직 정리된 런이 없습니다. 첫 런을 시작하면 최근 결과가 여기에 남습니다.</p>
          )}
        </section>
      </section>
    </section>
  );

  const renderCodexTab = () => (
    <section className="screen">
      <section className="hero-card codex-hero">
        <div className="eyebrow-row">
          <span className="eyebrow">Codex</span>
          <span className="status-pill">블록 {discoveredBlockRate}</span>
        </div>
        <h1>도감은 설명형 문장과 실제 효과 기준으로 정리했습니다</h1>
        <p className="hero-copy">
          보기 좋은 카드보다 지금 무엇을 경계해야 하는지 이해되도록, 각 항목을 “언제 위험한가” 중심 카피로 다시 썼습니다.
        </p>
        <div className="rule-list">
          <span className="rule-chip">증강 {discoveredAugmentRate}</span>
          <span className="rule-chip">보스 {discoveredBossRate}</span>
          <span className="rule-chip">승무원 {save.unlockedCrewIds.length}/{CREWS.length}</span>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>블록 도감</h2>
          <span className="muted">{save.discovered.blocks.length} / {BLOCK_CATALOG.length}</span>
        </div>
        <div className="catalog-grid">
          {BLOCK_CATALOG.map((block) => {
            const seen = save.discovered.blocks.includes(block.kind);
            return (
              <article key={block.kind} className={`catalog-card ${seen ? '' : 'is-locked'}`}>
                <strong>{block.name}</strong>
                <p>{seen ? block.body : '플레이 중 만나면 자동으로 도감이 열립니다.'}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>증강 도감</h2>
          <span className="muted">{save.discovered.augments.length} / {AUGMENTS.length}</span>
        </div>
        <div className="catalog-grid">
          {AUGMENTS.map((augment) => {
            const seen = save.discovered.augments.includes(augment.id);
            return (
              <article key={augment.id} className={`catalog-card ${seen ? '' : 'is-locked'}`}>
                <strong>{augment.name}</strong>
                <p>{seen ? augment.body : '보스 웨이브를 넘기면 3지선다로 열립니다.'}</p>
              </article>
            );
          })}
        </div>
      </section>
    </section>
  );

  const renderHome = () => (
    <section className="screen">
      <nav className="segmented-tabs" aria-label="홈 탭">
        {([
          ['supply', '보급'],
          ['play', '플레이'],
          ['codex', '도감'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            className={`segment-button ${tab === key ? 'is-active' : ''}`}
            type="button"
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </nav>
      {tab === 'supply' ? renderSupplyTab() : null}
      {tab === 'play' ? renderPlayTabRefined() : null}
      {tab === 'codex' ? renderCodexTab() : null}
    </section>
  );

  const renderRun = () => {
    if (!run) {
      return null;
    }

    const bossPreview = getBossWavePreview(run.loop, Boolean(run.boss?.alive));
    const phaseDisplay = getRunPhaseDisplay(run);

    return (
      <section className="screen run-screen">
        <section className="run-top-grid">
          <section className="panel compact-panel">
            <div className="panel-header">
              <h2>현재 런</h2>
              <span className="status-pill">루프 {run.loop}</span>
            </div>
            <div className="run-stat-row">
              <span>볼 {run.ballsOwned}</span>
              <span>보호막 {run.guardCharges}</span>
              <span>점수 {run.score}</span>
            </div>
            <div className="rule-list">
              <span className="rule-chip">시드 {formatSeed(run.initialSeed)}</span>
              {seedOverride !== null && run.initialSeed === seedOverride ? (
                <span className="rule-chip">QA 재현 런</span>
              ) : null}
            </div>
            <div className="inline-actions qa-actions">
              <button className="ghost-button" type="button" onClick={() => void copyRunSnapshot(run, 'run-panel')}>
                현재 상태 복사
              </button>
            </div>
            <div className={`run-notice is-${run.noticeTone}`}>
              {run.notice}
            </div>
          </section>
          <section className="panel compact-panel">
            <div className="panel-header">
              <h2>스킬 게이지</h2>
              <span className={`status-pill ${run.skillReady ? 'tone-success' : 'tone-info'}`}>
                {run.skillReady ? '사용 가능' : `${run.skillCharge}%`}
              </span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${run.skillCharge}%` }} />
            </div>
            <p className="muted">{getCrewById(run.crewId).active}</p>
          </section>
        </section>

        <section className="panel compact-panel boss-brief-panel">
          <div className="panel-header">
            <h2>보스 브리프</h2>
            <span className={`status-pill ${bossPreview.isCurrent ? 'tone-warning' : 'tone-info'}`}>
              {bossPreview.isCurrent ? '현재 보스' : `${bossPreview.distance}루프 뒤`}
            </span>
          </div>
          <strong className="coach-title">
            {bossPreview.isCurrent
              ? `${bossPreview.guide.bossName} 상대 중`
              : `${bossPreview.guide.bossName} 준비 구간`}
          </strong>
          <div className="rule-list run-context-meta">
            <span className="rule-chip">{bossPreview.guide.hpBand}</span>
            <span className="rule-chip">{bossPreview.guide.flankLabel}</span>
          </div>
          <p className="muted">{bossPreview.guide.summary}</p>
        </section>

        {runCoach ? (
          <section className={`panel compact-panel coach-panel is-${runCoach.tone}`}>
            <div className="panel-header">
              <h2>지금 할 일</h2>
              <span className={`status-pill tone-${runCoach.tone}`}>{runCoach.badge}</span>
            </div>
            <strong className="coach-title">{runCoach.title}</strong>
            <div className="rule-list run-context-meta">
              <span className="rule-chip">{phaseDisplay.label}</span>
              <span className={`rule-chip ${run.skillReady ? 'is-done-chip' : ''}`}>
                {run.skillReady ? '스킬 준비 완료' : `${run.skillCharge}% 충전`}
              </span>
            </div>
            <p className="muted">{runCoach.body}</p>
          </section>
        ) : null}

        <section className="panel canvas-panel">
          <div className="panel-header">
            <h2>전장</h2>
            <span className={`status-pill ${phaseDisplay.toneClass}`}>{phaseDisplay.label}</span>
          </div>
          <p className="muted canvas-helper">{runCoach ? runCoach.title : phaseDisplay.helper}</p>
          <BrickBreakerCanvas
            state={run}
            preview={runPreview}
            onAimStart={(pointerId, x, y) => setRun((current) => (current ? beginAim(current, pointerId, x, y) : current))}
            onAimMove={(pointerId, x, y) => setRun((current) => (current ? moveAim(current, pointerId, x, y) : current))}
            onAimEnd={() => setRun((current) => {
              if (!current) {
                return current;
              }

              return current.phase === 'aim' && current.aim.active ? releaseAim(current) : current;
            })}
          />
        </section>

        <section className="panel compact-panel run-action-panel">
          <div className="rule-list run-action-meta">
            <span className={`rule-chip ${run.skillReady ? 'is-done-chip' : ''}`}>
              {run.skillReady ? '스킬 즉시 사용 가능' : `스킬 ${run.skillCharge}% 충전`}
            </span>
            <span className="rule-chip">백그라운드 자동 저장</span>
          </div>
          <div className="inline-actions">
            <button
              className={`primary-button ${run.skillReady ? '' : 'is-disabled-button'}`}
              type="button"
              disabled={!run.skillReady || run.phase !== 'aim'}
              onClick={() => setRun((current) => (current ? useCrewSkill(current) : current))}
            >
              {run.skillReady ? '승무원 스킬 사용' : '스킬 충전 필요'}
            </button>
            <button className="ghost-button" type="button" onClick={stashRunAndLeave}>
              홈에 보관하고 나가기
            </button>
            <button className="danger-button" type="button" onClick={abandonCurrentRun}>
              이번 런 포기
            </button>
          </div>
          <p className="muted action-helper">토스 인앱이 백그라운드로 가면 현재 런을 자동 저장해 이어하기 카드로 복구할 수 있어요.</p>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>현재 증강</h2>
            <span className="muted">{run.augments.length}개 적용 중</span>
          </div>
          {run.augments.length > 0 ? (
            <div className="augment-state-grid">
              {run.augments.map((augmentId) => {
                const stackState = getAugmentStackState(run, augmentId);

                return (
                  <article key={augmentId} className={`augment-state-card is-${stackState.augment.tone}`}>
                    <div className="choice-card-head">
                      <span className={`choice-card-badge is-${stackState.augment.tone}`}>
                        {formatAugmentToneLabel(stackState.augment.tone)}
                      </span>
                      <span className="choice-card-meta">{stackState.currentLabel}</span>
                    </div>
                    <strong>{stackState.augment.name}</strong>
                    <p>{stackState.augment.summary}</p>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="muted">첫 보스를 넘기면 3지선다 증강이 열립니다.</p>
          )}
        </section>

        {run.phase === 'augment' ? (
          <div className="overlay">
            <section className="overlay-card is-scrollable">
              <span className="eyebrow">보스 돌파 보상</span>
              <h2>다음 루프 방향을 정할 증강 1개를 고르세요</h2>
              <p className="muted">효과가 바로 적용되며, CTA 문구가 실제 결과를 설명하도록 다시 정리했습니다.</p>
              <div className="overlay-card-header">
                <div className="rule-list overlay-brief">
                  <span className="rule-chip">보유 증강 {run.augments.length}</span>
                  <span className="rule-chip">보유 공 {run.ballsOwned}</span>
                  <span className={`rule-chip ${run.skillReady ? 'is-done-chip' : ''}`}>
                    {run.skillReady ? '스킬 준비 완료' : `스킬 ${run.skillCharge}%`}
                  </span>
                </div>
              </div>
              <div className="choice-list">
                {run.pendingOffer.map((augmentId) => {
                  const stackState = getAugmentStackState(run, augmentId);
                  const { augment } = stackState;
                  return (
                    <button
                      key={augmentId}
                      className={`choice-card is-${augment.tone}`}
                      type="button"
                      onClick={() => setRun((current) => (current ? chooseAugment(current, augmentId) : current))}
                    >
                      <div className="choice-card-head">
                        <span className={`choice-card-badge is-${augment.tone}`}>
                          {formatAugmentToneLabel(augment.tone)}
                        </span>
                        <span className="choice-card-meta">현재 · {stackState.currentLabel}</span>
                      </div>
                      <strong>{augment.name}</strong>
                      <p className="choice-card-summary">{augment.summary}</p>
                      <small className="choice-card-detail">{augment.body}</small>
                      <span className="choice-card-meta is-emphasis">선택 직후 · {stackState.nextLabel}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        ) : null}

        {run.phase === 'gameover' ? (
          <div className="overlay">
            <section className="overlay-card">
              <span className="eyebrow">런 정리</span>
              <h2>이번 기록을 홈으로 저장할까요?</h2>
              <p className="muted">{createRunSummary(run)}</p>
              <div className="stat-grid">
                <div>
                  <span className="muted">점수</span>
                  <strong>{run.score}</strong>
                </div>
                <div>
                  <span className="muted">최고 콤보</span>
                  <strong>{run.bestCombo}</strong>
                </div>
                <div>
                  <span className="muted">격파 블록</span>
                  <strong>{run.stats.blocksBroken}</strong>
                </div>
                <div>
                  <span className="muted">보스 격파</span>
                  <strong>{run.stats.bossesDefeated}</strong>
                </div>
              </div>
              <div className="inline-actions">
                <button className="primary-button" type="button" onClick={finishCurrentRun}>
                  기록 저장하고 홈으로
                </button>
                <button className="ghost-button" type="button" onClick={startRun}>
                  같은 승무원으로 다시 시작
                </button>
              </div>
            </section>
          </div>
        ) : null}
      </section>
    );
  };

  return (
    <main className="app-shell">
      <div className="app-background" />
      <div className="app-frame">
        <header className="top-banner">
          <div>
            <span className="eyebrow">Toss In-App Game</span>
            <strong className="banner-title">바운스 스택</strong>
          </div>
          <span className="banner-notice">{bannerNotice}</span>
        </header>

        {scene === 'boot' ? (
          <section className="screen">
            <div className="hero-card">
              <span className="eyebrow">부팅 중</span>
              <h1>토스용 브릭브레이커 런을 불러오고 있습니다</h1>
              <p className="hero-copy">{identityStatus}</p>
            </div>
          </section>
        ) : null}

        {scene === 'home' ? renderHome() : null}
        {scene === 'run' ? renderRun() : null}
      </div>
    </main>
  );
}
