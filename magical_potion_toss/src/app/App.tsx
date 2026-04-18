import { startTransition, useEffect, useMemo, useRef, useState } from 'react';
import { useEffectEvent } from 'react';
import {
  BASE_LIQUID_LABELS,
  getMaterialById,
  getOrderById,
  getUpgradeById,
  MATERIALS,
  ORDERS,
  RUN_RULE_CHIPS,
  TAG_LABELS,
  WORKBENCHES,
} from '../game/content';
import {
  abandonRun,
  applyWorkbench,
  brewDay,
  canUseExtraSlot,
  chooseOrder,
  continueToNextDay,
  createNewRun,
  formatOrderRequirementSummary,
  formatUpgradeSummary,
  getCarryoverEnabled,
  getCurrentWorkbenchLabel,
  getEligibleWorkbenchTargets,
  getPreviewVisibility,
  getUpcomingRentInfo,
  setBagSelection,
  setBrewPlan,
} from '../game/engine';
import { clearSave, commitFinishedRun, loadSave, saveProgress, setLastRun } from '../game/save';
import type { GameIdentity, PersistentSave, RunState, SceneKind } from '../game/types';
import { describeIdentityStatus, resolveGameIdentity } from '../platform/toss';

const STAT_ORDER = [
  'recovery',
  'calm',
  'vigor',
  'detox',
  'purity',
  'sideEffect',
] as const;

type StatKey = typeof STAT_ORDER[number];
type NoticeKind = 'info' | 'progress' | 'success' | 'warning';
type NoticeSnapshot = { kind: NoticeKind; message: string };

function formatIdentityBadge(identity: GameIdentity | null) {
  if (!identity) {
    return '로딩 중';
  }

  return identity.source === 'toss' ? 'Toss Key' : 'Local Key';
}

function statLabel(key: StatKey) {
  switch (key) {
    case 'recovery':
      return '회복';
    case 'calm':
      return '진정';
    case 'vigor':
      return '활력';
    case 'detox':
      return '해독';
    case 'purity':
      return '순도';
    case 'sideEffect':
      return '부작용';
    default:
      return key;
  }
}

function formatPhaseLabel(phase: RunState['activeDay']['phase']) {
  switch (phase) {
    case 'choose-order':
      return '주문 선택';
    case 'choose-bag':
      return '재료 선택';
    case 'workbench':
      return '손질';
    case 'brew':
      return '항아리 조제';
    case 'result':
      return '정산';
    case 'finished':
      return '종료 처리';
    default:
      return phase;
  }
}

function formatOutcomeLabel(outcome: Exclude<RunState['outcome'], null>) {
  switch (outcome) {
    case 'audit-cleared':
      return '감사 통과';
    case 'audit-partial':
      return '감사 부분 성공';
    case 'rent-failed':
      return '임대료 실패';
    case 'abandoned':
      return '중도 정리';
    default:
      return outcome;
  }
}

function formatPercent(value: number, total: number) {
  if (total <= 0) {
    return '0%';
  }

  return `${Math.round((value / total) * 100)}%`;
}

function formatResumeTask(run: RunState) {
  switch (run.activeDay.phase) {
    case 'choose-order':
      return '다음 행동: 오늘 제시된 주문 중 하나를 먼저 고릅니다.';
    case 'choose-bag':
      return run.preservedIngredient
        ? '다음 행동: 보존 재료와 함께 새 재료 4개를 더 골라 가방을 채웁니다.'
        : '다음 행동: 제시된 재료 중 5개를 골라 오늘 가방을 확정합니다.';
    case 'workbench': {
      const currentWorkbench = getCurrentWorkbenchLabel(run);
      const eligibleCount = getEligibleWorkbenchTargets(run).length;
      return `${currentWorkbench?.name ?? '작업대'}에서 손질 후보 ${eligibleCount}개 중 1개를 고릅니다.`;
    }
    case 'brew': {
      const slotTarget = run.activeDay.useExtraSlot ? 5 : 4;
      return `다음 행동: 항아리 순서를 마저 완성합니다. 현재 ${run.activeDay.brewSlots.length}/${slotTarget} 슬롯 선택 상태입니다.`;
    }
    case 'result': {
      const needsUpgrade = run.activeDay.upgradeChoices.length > 0;
      const canCarryover = getCarryoverEnabled(run) && Boolean(run.activeDay.preview?.carryoverCandidates.length);
      if (needsUpgrade && canCarryover) {
        return '다음 행동: 업그레이드와 보존 재료를 정한 뒤 다음 날로 넘어갑니다.';
      }

      if (needsUpgrade) {
        return '다음 행동: 업그레이드 하나를 고른 뒤 다음 날로 넘어갑니다.';
      }

      if (canCarryover) {
        return '다음 행동: 보존 재료를 정하고 다음 날로 넘어갑니다.';
      }

      return '다음 행동: 정산을 확인하고 다음 날 준비로 넘어갑니다.';
    }
    case 'finished':
      return '다음 행동: 종료된 런을 기록으로 정리하고 로비로 돌아갑니다.';
    default:
      return '다음 행동을 이어서 진행합니다.';
  }
}

function getIdentityNoticeKind(status: GameIdentity['status']): NoticeKind {
  switch (status) {
    case 'ready':
      return 'success';
    case 'fallback-invalid-category':
    case 'fallback-unsupported-version':
    case 'fallback-runtime-error':
      return 'warning';
    case 'fallback-local':
    default:
      return 'info';
  }
}

function getOutcomeNoticeKind(outcome: Exclude<RunState['outcome'], null>): NoticeKind {
  switch (outcome) {
    case 'audit-cleared':
    case 'audit-partial':
      return 'success';
    case 'rent-failed':
    case 'abandoned':
      return 'warning';
    default:
      return 'info';
  }
}

function formatNoticeLabel(kind: NoticeKind) {
  switch (kind) {
    case 'progress':
      return '진행 중';
    case 'success':
      return '안내 완료';
    case 'warning':
      return '주의';
    case 'info':
    default:
      return '안내';
  }
}

function formatFinishedRunFollowUp(lastFinishedRun: NonNullable<PersistentSave['lastFinishedRun']>) {
  switch (lastFinishedRun.outcome) {
    case 'audit-cleared':
      return lastFinishedRun.grade === 'S'
        ? '완벽한 감사 통과였습니다. 다음 목표는 더 빠른 골드 누적과 보너스 주문 최적화입니다.'
        : '감사는 통과했습니다. 다음 런에서는 정제도와 요구 스탯을 더 끌어올려 높은 판정을 노려 보세요.';
    case 'audit-partial':
      return '마지막 감사는 넘겼지만 여유가 크지 않았습니다. 손질 보너스와 예시 루트를 더 적극적으로 활용해 보세요.';
    case 'rent-failed':
      return lastFinishedRun.day <= 3
        ? '초반 임대료 구간에서 멈췄습니다. Day 3 전에는 안전한 주문으로 골드를 먼저 확보하는 편이 좋습니다.'
        : '후반 임대료 구간에서 멈췄습니다. Day 6 전에는 고보상 주문과 보너스 태그를 함께 챙겨 보세요.';
    case 'abandoned':
      return '중단된 런입니다. 로비의 도감과 최근 주문 기록을 보고 다음 루트를 다시 정리해 보세요.';
    default:
      return '이번 런 결과를 바탕으로 다음 주문 루트를 다시 설계해 보세요.';
  }
}

export function App() {
  const [identity, setIdentity] = useState<GameIdentity | null>(null);
  const [scene, setScene] = useState<SceneKind>('boot');
  const [noticeKind, setNoticeKind] = useState<NoticeKind>('progress');
  const [notice, setNotice] = useState('저장 키와 작업 기록을 불러오는 중입니다.');
  const [save, setSave] = useState(loadSave('bootstrap-placeholder'));
  const [abandonArmed, setAbandonArmed] = useState(false);
  const [resetArmed, setResetArmed] = useState(false);
  const [selectedOfferIds, setSelectedOfferIds] = useState<string[]>([]);
  const [selectedCarryoverId, setSelectedCarryoverId] = useState<string | null>(null);
  const [selectedUpgradeId, setSelectedUpgradeId] = useState<string | null>(null);
  const resetNoticeRestoreRef = useRef<NoticeSnapshot | null>(null);
  const abandonNoticeRestoreRef = useRef<NoticeSnapshot | null>(null);

  const run = save.lastRun;
  const hasActiveRun = Boolean(run && !run.outcome);

  const applyNotice = (kind: NoticeKind, message: string) => {
    setNoticeKind(kind);
    setNotice(message);
  };

  const captureNotice = (): NoticeSnapshot => ({
    kind: noticeKind,
    message: notice,
  });

  const restoreNotice = (snapshot: NoticeSnapshot | null) => {
    if (!snapshot) {
      return;
    }

    applyNotice(snapshot.kind, snapshot.message);
  };

  const persistSave = useEffectEvent((nextSave: typeof save) => {
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
      applyNotice(
        loadedSave.lastRun ? 'info' : getIdentityNoticeKind(resolvedIdentity.status),
        loadedSave.lastRun ? '중단된 런을 복구할 수 있습니다.' : describeIdentityStatus(resolvedIdentity.status),
      );
      startTransition(() => {
        setScene('lobby');
      });
    }

    void boot();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!identity) {
      return;
    }

    persistSave(save);
  }, [identity, persistSave, save]);

  useEffect(() => {
    setSelectedOfferIds([]);
    setSelectedCarryoverId(null);
    setSelectedUpgradeId(null);
  }, [run?.day, run?.activeDay.phase]);

  useEffect(() => {
    if (abandonArmed) {
      restoreNotice(abandonNoticeRestoreRef.current);
      abandonNoticeRestoreRef.current = null;
      setAbandonArmed(false);
    }

    if (resetArmed) {
      restoreNotice(resetNoticeRestoreRef.current);
      resetNoticeRestoreRef.current = null;
      setResetArmed(false);
    }
  }, [scene]);

  useEffect(() => {
    if (!abandonArmed) {
      return;
    }

    restoreNotice(abandonNoticeRestoreRef.current);
    abandonNoticeRestoreRef.current = null;
    setAbandonArmed(false);
  }, [run?.id, run?.day, run?.activeDay.phase]);

  const updateRun = (transform: (current: RunState) => RunState) => {
    if (!run) {
      return;
    }

    setSave((currentSave) => setLastRun(currentSave, transform(currentSave.lastRun as RunState)));
  };

  const armAbandon = () => {
    abandonNoticeRestoreRef.current = captureNotice();
    setAbandonArmed(true);
    applyNotice('warning', '런 중단이 대기 중입니다. 한 번 더 누르면 현재 런을 포기합니다.');
  };

  const confirmAbandon = () => {
    abandonNoticeRestoreRef.current = null;
    setAbandonArmed(false);
    updateRun((draft) => abandonRun(draft));
  };

  const cancelAbandon = () => {
    setAbandonArmed(false);
    restoreNotice(abandonNoticeRestoreRef.current);
    abandonNoticeRestoreRef.current = null;
  };

  const startRun = () => {
    if (hasActiveRun) {
      resumeRun();
      return;
    }

    const nextRun = createNewRun(save);
    setSave((currentSave) => setLastRun(currentSave, nextRun));
    applyNotice('success', '새 런을 시작했습니다. 오늘 주문부터 골라 보세요.');
    startTransition(() => setScene('run'));
  };

  const resumeRun = () => {
    if (!run) {
      return;
    }

    applyNotice('info', `Day ${run.day} 진행 중인 런을 이어갑니다.`);
    startTransition(() => setScene('run'));
  };

  const finalizeRun = () => {
    if (!run?.outcome) {
      return;
    }

    const nextSave = commitFinishedRun(save, run);
    setSave(nextSave);
    applyNotice(getOutcomeNoticeKind(run.outcome), run.summaryNote);
    startTransition(() => setScene('lobby'));
  };

  const resetAllData = () => {
    if (!identity) {
      return;
    }

    const nextSave = clearSave(identity.key);
    setSave(nextSave);
    setResetArmed(false);
    resetNoticeRestoreRef.current = null;
    applyNotice('info', '마법 물약 테스트 저장 데이터를 초기화했습니다.');
    startTransition(() => setScene('lobby'));
  };

  const armReset = () => {
    resetNoticeRestoreRef.current = captureNotice();
    setResetArmed(true);
    applyNotice('warning', '저장 초기화가 대기 중입니다. 한 번 더 누르면 실제로 삭제됩니다.');
  };

  const cancelReset = () => {
    setResetArmed(false);
    restoreNotice(resetNoticeRestoreRef.current);
    resetNoticeRestoreRef.current = null;
  };

  const targetBagCount = run?.preservedIngredient ? 4 : 5;
  const currentWorkbench = run ? getCurrentWorkbenchLabel(run) : null;
  const eligibleWorkbenchTargets = run ? getEligibleWorkbenchTargets(run) : [];
  const previewVisible = run ? getPreviewVisibility(run) : false;
  const carryoverEnabled = run ? getCarryoverEnabled(run) : false;
  const extraSlotEnabled = run ? canUseExtraSlot(run) : false;
  const slotTarget = run?.activeDay.useExtraSlot ? 5 : 4;
  const upcomingRent = run ? getUpcomingRentInfo(run.day) : null;
  const successRate = save.completedRuns > 0 ? formatPercent(save.successfulRuns, save.completedRuns) : null;
  const materialDiscoveryRate = formatPercent(save.discoveredMaterialIds.length, MATERIALS.length);
  const orderDiscoveryRate = formatPercent(save.discoveredOrderIds.length, ORDERS.length);
  const carryoverOptions = run?.activeDay.preview?.carryoverCandidates
    .map((instanceId) => run.activeDay.bag.find((ingredient) => ingredient.instanceId === instanceId))
    .filter((ingredient): ingredient is NonNullable<typeof ingredient> => Boolean(ingredient)) ?? [];

  const materialLookup = useMemo(
    () => Object.fromEntries(MATERIALS.map((material) => [material.id, material])),
    [],
  );

  const orderLookup = useMemo(
    () => Object.fromEntries(ORDERS.map((order) => [order.id, order])),
    [],
  );

  const renderOrderGuide = (orderId: string | null, eyebrow = '주문 메모') => {
    if (!orderId) {
      return null;
    }

    const order = orderLookup[orderId];
    if (!order) {
      return null;
    }

    return (
      <section className="panel compact-panel">
        <div className="hint-strip">
          <span className="eyebrow">{eyebrow}</span>
          <p className="muted">{order.note}</p>
          <p className="muted">예시 루트: {order.exampleCombo}</p>
        </div>
      </section>
    );
  };

  const renderLobby = () => (
    <section className="screen">
      <section className="hero-card hero-cauldron">
        <div className="eyebrow-row">
          <span className="eyebrow">Toss WebView Game</span>
          <span className="status-pill">{formatIdentityBadge(identity)}</span>
        </div>
        <h1>마녀의 만병항아리</h1>
        <p className="hero-copy">
          재료 5개를 들고 들어가 4개를 어떤 순서로 넣을지 계산해 주문 컷라인과 임대료를 넘기는
          7일 런 퍼즐 로그라이크입니다.
        </p>
        <div className="rule-list">
          {RUN_RULE_CHIPS.map((chip) => (
            <span key={chip} className="rule-chip">
              {chip}
            </span>
          ))}
        </div>
        <div className="hero-actions">
          <button className="primary-button" type="button" onClick={hasActiveRun ? resumeRun : startRun}>
            {hasActiveRun ? '중단된 런 이어서' : '새 런 시작'}
          </button>
          {run ? (
            <button className="secondary-button" type="button" onClick={() => setScene('records')}>
              기록 / 도감
            </button>
          ) : null}
          {!run ? (
            <button className="ghost-button" type="button" onClick={() => setScene('records')}>
              기록 / 도감
            </button>
          ) : null}
        </div>
      </section>

      <section className="panel compact-panel">
        <div className="panel-header">
          <h2>현재 메모</h2>
          <span className={`status-pill tone-${noticeKind}`}>{formatNoticeLabel(noticeKind)}</span>
        </div>
        <p className="muted">{notice}</p>
        <p className="muted">
          {hasActiveRun
            ? '이어서 진행을 누르면 저장된 런으로 바로 복귀합니다.'
            : identity?.source === 'toss'
              ? '지금 상태는 토스 게임 키와 연결되어 저장됩니다.'
              : '지금 상태는 로컬 테스트 키에 저장되고 있습니다.'}
        </p>
      </section>

      <section className="panel-grid">
        <section className="panel">
          <h2>런 기록</h2>
          <div className="stat-grid">
            <div>
              <span className="muted">완주 수</span>
              <strong>{save.completedRuns}</strong>
            </div>
            <div>
              <span className="muted">감사 도달 수</span>
              <strong>{save.successfulRuns}</strong>
            </div>
            <div>
              <span className="muted">최고 보유 골드</span>
              <strong>{save.bestGold}</strong>
            </div>
            <div>
              <span className="muted">최고 도달 일차</span>
              <strong>Day {Math.max(0, save.highestDayReached)}</strong>
            </div>
          </div>
          <p className="muted">
            {successRate
              ? `감사 도달률 ${successRate} · ${save.successfulRuns}/${save.completedRuns}회`
              : '아직 완주 기록이 없습니다. 첫 런을 끝내면 도달률이 기록됩니다.'}
          </p>
        </section>

        <section className="panel">
          <h2>도감 진행도</h2>
          <div className="stat-grid">
            <div>
              <span className="muted">발견한 재료</span>
              <strong>
                {save.discoveredMaterialIds.length} / {MATERIALS.length}
              </strong>
            </div>
            <div>
              <span className="muted">본 주문</span>
              <strong>
                {save.discoveredOrderIds.length} / {ORDERS.length}
              </strong>
            </div>
            <div>
              <span className="muted">저장 키</span>
              <strong>{identity?.source === 'toss' ? 'Toss' : 'Local'}</strong>
            </div>
            <div>
              <span className="muted">런 복구</span>
              <strong>{run ? `Day ${run.day}` : '없음'}</strong>
            </div>
          </div>
          <p className="muted">도감 해금률: 재료 {materialDiscoveryRate} / 주문 {orderDiscoveryRate}</p>
        </section>
      </section>

      {save.lastFinishedRun ? (
        <section className="panel">
          <div className="panel-header">
            <h2>최근 종료 런</h2>
            <span className={`status-pill tone-${getOutcomeNoticeKind(save.lastFinishedRun.outcome)}`}>
              {formatOutcomeLabel(save.lastFinishedRun.outcome)}
            </span>
          </div>
          {save.lastFinishedRun.orderId ? (
            <p className="muted">
              마지막 주문: {orderLookup[save.lastFinishedRun.orderId]?.name ?? save.lastFinishedRun.orderId}
              {save.lastFinishedRun.grade ? ` / 판정 ${save.lastFinishedRun.grade}` : ''}
            </p>
          ) : null}
          <p className="muted">{save.lastFinishedRun.summaryNote}</p>
          <p className="muted">{formatFinishedRunFollowUp(save.lastFinishedRun)}</p>
          <div className="inline-summary">
            <span>Day {save.lastFinishedRun.day}</span>
            <span>{save.lastFinishedRun.gold}골드</span>
            {save.lastFinishedRun.grade ? <span>{save.lastFinishedRun.grade} 등급</span> : null}
          </div>
          {save.lastFinishedRun.wasBestGold || save.lastFinishedRun.wasBestDay ? (
            <p className="muted">
              {save.lastFinishedRun.wasBestGold ? '최고 보유 골드 갱신' : ''}
              {save.lastFinishedRun.wasBestGold && save.lastFinishedRun.wasBestDay ? ' / ' : ''}
              {save.lastFinishedRun.wasBestDay ? '최고 도달 일차 갱신' : ''}
            </p>
          ) : null}
        </section>
      ) : null}

      {hasActiveRun && run ? (
        <section className="panel">
          <div className="panel-header">
            <h2>보관 중인 런</h2>
            <span className="status-pill">Day {run.day}</span>
          </div>
          <p className="muted">
            현재 단계: {formatPhaseLabel(run.activeDay.phase)}
            {run.activeDay.selectedOrderId ? ` / ${orderLookup[run.activeDay.selectedOrderId].name}` : ''}
          </p>
          <div className="inline-summary">
            <span>{run.gold}골드</span>
            <span>업그레이드 {run.chosenUpgradeIds.length}개</span>
            <span>보존 재료 {run.preservedIngredient ? run.preservedIngredient.name : '없음'}</span>
          </div>
          <p className="muted">{formatResumeTask(run)}</p>
          {upcomingRent ? (
            <p className="muted">
              {upcomingRent.isDueToday
                ? `오늘 임대료 ${upcomingRent.amount}골드 정산일입니다.`
                : `다음 임대료는 Day ${upcomingRent.day} / ${upcomingRent.amount}골드입니다.`}
            </p>
          ) : (
            <p className="muted">이제 남은 목표는 마지막 감사 주문입니다.</p>
          )}
          <div className="inline-actions">
            <button className="primary-button" type="button" onClick={resumeRun}>
              이어서 진행
            </button>
            <button className="ghost-button" type="button" onClick={() => setScene('records')}>
              도감 먼저 보기
            </button>
          </div>
        </section>
      ) : null}
    </section>
  );

  const renderRecords = () => (
    <section className="screen">
      <div className="panel-header">
        <div>
          <span className="eyebrow">기록 / 도감</span>
          <h1 className="screen-title">런 기록과 발견 목록</h1>
        </div>
        <button className="ghost-button" type="button" onClick={() => setScene('lobby')}>
          로비
        </button>
      </div>

      <section className="panel">
        <h2>발견한 재료</h2>
        <div className="catalog-grid">
          {MATERIALS.map((material) => {
            const discovered = save.discoveredMaterialIds.includes(material.id);
            const processedWorkbenchName = material.processed?.workbenchId
              ? WORKBENCHES[material.processed.workbenchId].name
              : null;
            return (
              <div key={material.id} className={`catalog-card ${discovered ? 'is-open' : 'is-locked'}`}>
                <strong>{discovered ? material.name : '???'}</strong>
                <p>{discovered ? material.role : '아직 만나지 못한 재료입니다.'}</p>
                {discovered ? (
                  <>
                    <small className="catalog-note">{material.note}</small>
                    <small className="catalog-note">
                      손질:
                      {' '}
                      {material.processed
                        ? `${processedWorkbenchName ?? '작업대'} -> ${material.processed.name}`
                        : '없음'}
                    </small>
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <h2>확인한 주문</h2>
        <div className="catalog-grid">
          {ORDERS.map((order) => {
            const discovered = save.discoveredOrderIds.includes(order.id);
            return (
              <div key={order.id} className={`catalog-card ${discovered ? 'is-open' : 'is-locked'}`}>
                <strong>{discovered ? order.name : '???'}</strong>
                <p>{discovered ? formatOrderRequirementSummary(order.id).join(' / ') : '아직 보지 못한 주문입니다.'}</p>
                {discovered ? (
                  <>
                    <small className="catalog-note">{order.note}</small>
                    <small className="catalog-note">예시 루트: {order.exampleCombo}</small>
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel danger-panel">
        <h2>테스트 저장 초기화</h2>
        <p>
          {resetArmed
            ? '한 번 더 누르면 현재 로컬 저장 데이터와 중단 런 기록을 전부 지웁니다.'
            : '현재 로컬 저장 데이터와 중단 런 기록을 전부 지웁니다.'}
        </p>
        {resetArmed ? (
          <p className="warning-copy">이 작업은 되돌릴 수 없습니다. 정말 초기화할 때만 한 번 더 눌러 주세요.</p>
        ) : null}
        <div className="inline-actions">
          <button
            className="danger-button"
            type="button"
            onClick={() => {
              if (resetArmed) {
                resetAllData();
                return;
              }

              armReset();
            }}
          >
            {resetArmed ? '초기화 확인' : '저장 초기화'}
          </button>
          {resetArmed ? (
            <button className="ghost-button" type="button" onClick={cancelReset}>
              취소
            </button>
          ) : null}
        </div>
      </section>
    </section>
  );

  const renderOrderStep = (currentRun: RunState) => (
    <section className="panel">
      <div className="panel-header">
        <div>
          <span className="eyebrow">Day {currentRun.day}</span>
          <h2>오늘 주문을 고르세요</h2>
        </div>
        <span className="status-pill">{currentRun.gold}골드</span>
      </div>
      <div className="choice-list">
        {currentRun.activeDay.orderChoices.map((orderId) => {
          const order = orderLookup[orderId];
          return (
            <button
              key={orderId}
              className="choice-card is-order"
              type="button"
              onClick={() => updateRun((draft) => chooseOrder(draft, orderId))}
            >
              <div className="choice-card-head">
                <span className="choice-card-badge">{order.customerLabel}</span>
                <span className="choice-card-meta">
                  기본 {order.baseReward} / 보너스 {order.bonusReward}
                </span>
              </div>
              <strong>{order.name}</strong>
              <p>{formatOrderRequirementSummary(orderId).join(' / ')}</p>
              <small className="choice-card-hint">{order.note}</small>
              <p className="muted">예시 루트: {order.exampleCombo}</p>
            </button>
          );
        })}
      </div>
    </section>
  );

  const renderBagStep = (currentRun: RunState) => {
    const selectedOffers = currentRun.activeDay.materialOffers.filter((ingredient) =>
      selectedOfferIds.includes(ingredient.instanceId),
    );
    const predictedBag = currentRun.preservedIngredient
      ? [currentRun.preservedIngredient, ...selectedOffers]
      : selectedOffers;
    const selectedWorkbenchReadyCount = currentRun.activeDay.workbenchId
      ? predictedBag.filter(
          (ingredient) => materialLookup[ingredient.materialId].processed?.workbenchId === currentRun.activeDay.workbenchId,
        ).length
      : 0;
    const bagIsReady = selectedOfferIds.length === targetBagCount;

    return (
      <>
      <section className="panel compact-panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">주문 선택 완료</span>
            <h2>{currentRun.activeDay.selectedOrderId ? orderLookup[currentRun.activeDay.selectedOrderId].name : '주문'}</h2>
          </div>
          <span className="status-pill">
            {selectedOfferIds.length} / {targetBagCount}
          </span>
        </div>
        <p className="muted">
          {currentRun.preservedIngredient
            ? `전날 남겨 둔 ${currentRun.preservedIngredient.name}을 들고 갑니다. 오늘은 새 재료 ${targetBagCount}개를 더 고르면 됩니다.`
            : `8개 중 5개를 골라 가방을 채웁니다. 실제 조제에는 4개만 쓰니 1개는 보험 재료 역할을 합니다.`}
        </p>
        <div className="hint-strip">
          <span className="eyebrow">{currentRun.activeDay.workbenchId ? '오늘의 손질' : '오늘의 흐름'}</span>
          {currentRun.activeDay.workbenchId && currentWorkbench ? (
            <p className="muted">
              작업대: {currentWorkbench.name} · 현재 선택 기준 손질 가능 {selectedWorkbenchReadyCount}개
              {bagIsReady
                ? selectedWorkbenchReadyCount > 0
                  ? ' · 가방 확정 후 손질 단계가 열립니다.'
                  : ' · 손질 가능한 재료가 없어 바로 조제로 넘어갑니다.'
                : ' · 가방을 모두 고르면 다음 단계가 확정됩니다.'}
            </p>
          ) : (
            <p className="muted">오늘은 손질 단계 없이 가방 확정 후 바로 조제로 넘어갑니다.</p>
          )}
        </div>
      </section>

      {renderOrderGuide(currentRun.activeDay.selectedOrderId, '주문 힌트')}

      <section className="material-grid">
        {currentRun.activeDay.materialOffers.map((ingredient) => {
          const material = materialLookup[ingredient.materialId];
          const selected = selectedOfferIds.includes(ingredient.instanceId);
          return (
            <button
              key={ingredient.instanceId}
              className={`material-card ${selected ? 'is-selected' : ''}`}
              type="button"
              onClick={() => {
                setSelectedOfferIds((current) => {
                  if (current.includes(ingredient.instanceId)) {
                    return current.filter((id) => id !== ingredient.instanceId);
                  }

                  if (current.length >= targetBagCount) {
                    return current;
                  }

                  return [...current, ingredient.instanceId];
                });
              }}
            >
              <div className="material-card-top">
                <span className="material-family">{material.role}</span>
                <span className="material-rarity">{material.rarity}</span>
              </div>
              <strong>{material.name}</strong>
              <p>{material.note}</p>
            </button>
          );
        })}
      </section>

      <section className="panel compact-panel">
        <div className="inline-actions">
          <button
            className="primary-button"
            type="button"
            disabled={selectedOfferIds.length !== targetBagCount}
            onClick={() => updateRun((draft) => setBagSelection(draft, selectedOfferIds))}
          >
            가방 확정
          </button>
          <button className="ghost-button" type="button" onClick={() => setSelectedOfferIds([])}>
            다시 고르기
          </button>
        </div>
      </section>
      </>
    );
  };

  const renderWorkbenchStep = (currentRun: RunState) => (
    <section className="screen">
      <section className="panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">손질 페이지</span>
            <h2>{currentWorkbench?.name}</h2>
          </div>
          <span className="status-pill">1개만 손질 가능</span>
        </div>
        <p className="muted">{currentWorkbench?.body}</p>
        <div className="hint-strip">
          <span className="eyebrow">손질 안내</span>
          <p className="muted">
            이번 작업대에서 실제로 바뀌는 재료는 {eligibleWorkbenchTargets.length}개입니다.
            1개만 선택할 수 있고, 선택하지 않으면 원형 그대로 조제로 넘어갑니다.
          </p>
        </div>
      </section>

      <div className="material-grid">
        {currentRun.activeDay.bag.map((ingredient) => {
          const material = materialLookup[ingredient.materialId];
          const processedForm = material.processed;
          const eligible = eligibleWorkbenchTargets.some((candidate) => candidate.instanceId === ingredient.instanceId);
          return (
            <button
              key={ingredient.instanceId}
              className={`material-card ${eligible ? 'is-eligible' : 'is-disabled'}`}
              type="button"
              disabled={!eligible}
              onClick={() => updateRun((draft) => applyWorkbench(draft, ingredient.instanceId))}
            >
              <div className="material-card-top">
                <span className="material-family">{material.role}</span>
                <span className="material-rarity">{eligible ? '손질 가능' : '해당 없음'}</span>
              </div>
              <strong>{ingredient.name}</strong>
              {eligible && processedForm ? (
                <>
                  <small className="transform-copy">손질 결과: {processedForm.name}</small>
                  <p>{processedForm.effects[0]?.description ?? '이 작업대에 맞는 손질형으로 바뀝니다.'}</p>
                </>
              ) : (
                <p>이번 작업대와 맞는 손질형이 없습니다.</p>
              )}
            </button>
          );
        })}
      </div>

      <section className="panel compact-panel">
        <div className="inline-actions">
          <button className="secondary-button" type="button" onClick={() => updateRun((draft) => applyWorkbench(draft, null))}>
            손질 없이 진행
          </button>
        </div>
      </section>
    </section>
  );

  const renderBrewStep = (currentRun: RunState) => {
    const selectedOrder = currentRun.activeDay.selectedOrderId
      ? orderLookup[currentRun.activeDay.selectedOrderId]
      : null;
    const preview = currentRun.activeDay.preview;
    const slotsFull = currentRun.activeDay.brewSlots.length >= slotTarget;

    return (
      <>
        <section className="panel brew-layout">
          <div>
            <span className="eyebrow">Day {currentRun.day} 조제</span>
            <h2>{selectedOrder?.name}</h2>
            <p className="muted">{selectedOrder ? formatOrderRequirementSummary(selectedOrder.id).join(' / ') : ''}</p>
          </div>
          <div className="bag-summary">
            <span>{currentRun.gold}골드</span>
            <span>{currentRun.activeDay.bag.length}개 준비</span>
          </div>
        </section>

        {renderOrderGuide(currentRun.activeDay.selectedOrderId, '조제 메모')}

        <section className="panel compact-panel">
          <div className="hint-strip">
            <span className="eyebrow">조제 안내</span>
            <p className="muted">
              재료 카드를 누르면 항아리의 마지막 빈 슬롯에 들어갑니다.
              순서가 그대로 판정에 반영되며, 슬롯 카드를 누르면 해당 위치 이후가 당겨지며 제거됩니다.
            </p>
          </div>
        </section>

        <section className="panel cauldron-panel">
          <div className="cauldron-head">
            <div>
              <span className="eyebrow">항아리</span>
              <strong>{currentRun.activeDay.brewSlots.length} / {slotTarget} 슬롯 선택</strong>
            </div>
            {extraSlotEnabled ? (
              <button
                className={`ghost-button ${currentRun.activeDay.useExtraSlot ? 'is-active-toggle' : ''}`}
                type="button"
                onClick={() => {
                  const nextUseExtra = !currentRun.activeDay.useExtraSlot;
                  const nextSlots = nextUseExtra
                    ? currentRun.activeDay.brewSlots
                    : currentRun.activeDay.brewSlots.slice(0, 4);
                  updateRun((draft) => setBrewPlan(draft, nextSlots, nextUseExtra));
                }}
              >
                {currentRun.activeDay.useExtraSlot ? '예비 슬롯 사용 중' : '예비 슬롯 열기'}
              </button>
            ) : null}
          </div>

          <div className="slot-row">
            {Array.from({ length: slotTarget }).map((_, index) => {
              const ingredientId = currentRun.activeDay.brewSlots[index];
              const ingredient = currentRun.activeDay.bag.find((candidate) => candidate.instanceId === ingredientId);
              return (
                <button
                  key={`${ingredientId ?? 'empty'}-${index + 1}`}
                  className={`slot-card ${ingredient ? 'is-filled' : ''}`}
                  type="button"
                  onClick={() => {
                    const nextSlots = currentRun.activeDay.brewSlots.filter((_, slotIndex) => slotIndex !== index);
                    updateRun((draft) => setBrewPlan(draft, nextSlots, currentRun.activeDay.useExtraSlot));
                  }}
                >
                  <span className="slot-index">#{index + 1}</span>
                  <strong>{ingredient?.name ?? '빈 슬롯'}</strong>
                </button>
              );
            })}
          </div>

          <div className="material-grid compact-grid">
            {currentRun.activeDay.bag.map((ingredient) => {
              const selectedSlotIndex = currentRun.activeDay.brewSlots.indexOf(ingredient.instanceId);
              const selected = selectedSlotIndex >= 0;
              const lockedOut = slotsFull && !selected;
              return (
                <button
                  key={ingredient.instanceId}
                  className={`material-card ${selected ? 'is-selected is-slotted' : ''} ${lockedOut ? 'is-disabled' : ''}`}
                  type="button"
                  disabled={lockedOut}
                  onClick={() => {
                    if (selected) {
                      const nextSlots = currentRun.activeDay.brewSlots.filter((id) => id !== ingredient.instanceId);
                      updateRun((draft) => setBrewPlan(draft, nextSlots, currentRun.activeDay.useExtraSlot));
                      return;
                    }

                    if (currentRun.activeDay.brewSlots.length >= slotTarget) {
                      return;
                    }

                    const nextSlots = [...currentRun.activeDay.brewSlots, ingredient.instanceId];
                    updateRun((draft) => setBrewPlan(draft, nextSlots, currentRun.activeDay.useExtraSlot));
                  }}
                >
                  <div className="material-card-top">
                    <span className="material-family">{ingredient.formKey === 'processed' ? '손질형' : '원형'}</span>
                    <span className="material-rarity">
                      {selected ? `투입 #${selectedSlotIndex + 1}` : ingredient.source === 'carryover' ? '보존' : '오늘 구매'}
                    </span>
                  </div>
                  <strong>{ingredient.name}</strong>
                  <p>
                    {selected
                      ? '다시 누르면 선택이 해제되고 뒤 슬롯 재료가 앞으로 당겨집니다.'
                      : lockedOut
                        ? '슬롯이 가득 찼습니다. 빈 슬롯을 만들려면 위 슬롯을 누르세요.'
                        : materialLookup[ingredient.materialId].note}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {preview ? (
          <section className="panel preview-panel">
            <div className="panel-header">
              <div>
                <span className="eyebrow">프리뷰</span>
                <h2>예상 판정 {preview.grade}</h2>
              </div>
              <span className="status-pill">보상 {preview.rewardGold}골드</span>
            </div>
            <div className="preview-metrics">
              <span>기반액 {BASE_LIQUID_LABELS[preview.baseLiquid]}</span>
              <span>태그 {preview.tags.map((tag) => TAG_LABELS[tag]).join(', ') || '없음'}</span>
            </div>
            <div className="stat-grid">
              {STAT_ORDER.map((key) => (
                <div key={key}>
                  <span className="muted">{statLabel(key)}</span>
                  <strong>{preview.score[key]}</strong>
                </div>
              ))}
            </div>
            {!preview.hardRequirementsMet ? (
              <p className="warning-copy">미달 조건: {preview.missingReasons.join(' / ')}</p>
            ) : null}
            {previewVisible ? (
              <ul className="plain-list">
                {preview.logs.map((log) => (
                  <li key={log}>{log}</li>
                ))}
              </ul>
            ) : (
              <p className="muted">예측 문양판 업그레이드를 얻으면 세부 반응 로그까지 미리 볼 수 있습니다.</p>
            )}
            <div className="inline-actions">
              <button className="primary-button" type="button" onClick={() => updateRun((draft) => brewDay(draft))}>
                항아리 조제 확정
              </button>
            </div>
          </section>
        ) : (
          <section className="panel compact-panel">
            <p className="muted">슬롯을 {slotTarget}개 채우면 판정 프리뷰가 열립니다.</p>
          </section>
        )}
      </>
    );
  };

  const renderResultStep = (currentRun: RunState) => {
    const preview = currentRun.activeDay.preview;
    if (!preview) {
      return null;
    }

    const selectedCarryover = carryoverOptions.find((ingredient) => ingredient.instanceId === selectedCarryoverId) ?? null;
    const selectedUpgradeSummary = selectedUpgradeId ? formatUpgradeSummary(selectedUpgradeId) : null;
    const nextActionDisabled = currentRun.outcome
      ? false
      : currentRun.activeDay.upgradeChoices.length > 0 && !selectedUpgradeId;

    return (
      <>
        <section className="hero-card result-hero">
          <span className="eyebrow">
            {currentRun.outcome === 'rent-failed'
              ? '임대료 실패'
              : currentRun.outcome
                ? '런 종료'
                : '하루 정산'}
          </span>
          <h1>{getOrderById(preview.orderId).name}</h1>
          <p className="hero-copy">{currentRun.outcome ? currentRun.summaryNote : '오늘 조제 결과를 정리하고 다음 날 준비를 선택하세요.'}</p>
        </section>

        <section className="panel">
          <div className="stat-grid">
            {STAT_ORDER.map((key) => (
              <div key={key}>
                <span className="muted">{statLabel(key)}</span>
                <strong>{preview.score[key]}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>정산 메모</h2>
          <ul className="plain-list">
            {currentRun.activeDay.resultCopy.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>

        {carryoverEnabled && carryoverOptions.length > 0 && !currentRun.outcome ? (
          <section className="panel">
            <div className="panel-header">
              <h2>보존 서랍</h2>
              <span className="muted">하나만 다음 날로 넘길 수 있습니다.</span>
            </div>
            <div className="material-grid compact-grid">
              {carryoverOptions.map((ingredient) => (
                <button
                  key={ingredient.instanceId}
                  className={`material-card ${selectedCarryoverId === ingredient.instanceId ? 'is-selected' : ''}`}
                  type="button"
                  onClick={() => setSelectedCarryoverId((current) => current === ingredient.instanceId ? null : ingredient.instanceId)}
                >
                  <strong>{ingredient.name}</strong>
                  <p>{materialLookup[ingredient.materialId].note}</p>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {currentRun.activeDay.upgradeChoices.length > 0 && !currentRun.outcome ? (
          <section className="panel">
            <div className="panel-header">
              <h2>무료 업그레이드 3택 1</h2>
              <span className="muted">오늘 런 방향을 결정합니다.</span>
            </div>
            <div className="choice-list">
              {currentRun.activeDay.upgradeChoices.map((upgradeId) => {
                const upgrade = getUpgradeById(upgradeId);
                return (
                  <button
                    key={upgradeId}
                    className={`choice-card is-upgrade ${selectedUpgradeId === upgradeId ? 'is-selected' : ''}`}
                    type="button"
                    onClick={() => setSelectedUpgradeId(upgradeId)}
                  >
                    <div className="choice-card-head">
                      <span className="choice-card-badge">{upgrade.group}</span>
                      <span className="choice-card-meta">Day {upgrade.availableDay} 이후 등장</span>
                    </div>
                    <strong>{upgrade.label}</strong>
                    <p>{upgrade.body}</p>
                    <small className="choice-card-hint">{upgrade.note}</small>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {!currentRun.outcome ? (
          <section className="panel compact-panel">
            <div className="hint-strip">
              <span className="eyebrow">다음 날 체크</span>
              <p className="muted">
                업그레이드: {selectedUpgradeSummary ?? (currentRun.activeDay.upgradeChoices.length > 0 ? '아직 선택하지 않음' : '이번 정산에는 없음')}
              </p>
              <p className="muted">
                보존 재료: {selectedCarryover ? selectedCarryover.name : carryoverEnabled && carryoverOptions.length > 0 ? '선택하지 않음' : '이번 정산에는 없음'}
              </p>
              {nextActionDisabled ? (
                <p className="warning-copy">다음 날로 넘어가려면 업그레이드 1개를 먼저 선택해야 합니다.</p>
              ) : null}
            </div>
          </section>
        ) : null}

        <section className="panel compact-panel">
          <div className="inline-actions">
            {currentRun.outcome ? (
              <button className="primary-button" type="button" onClick={finalizeRun}>
                기록 저장하고 로비로
              </button>
            ) : (
              <button
                className="primary-button"
                type="button"
                disabled={nextActionDisabled}
                onClick={() => updateRun((draft) => continueToNextDay(draft, selectedUpgradeId, selectedCarryoverId))}
              >
                {nextActionDisabled ? '업그레이드 선택 필요' : '다음 날 준비'}
              </button>
            )}
          </div>
        </section>
      </>
    );
  };

  const renderRun = () => {
    if (!run) {
      return null;
    }

    return (
      <section className="screen">
        <section className="panel compact-panel progress-panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">진행 현황</span>
              <h2>Day {run.day} / 7</h2>
            </div>
            <span className="status-pill">{run.gold}골드</span>
          </div>
          <div className="progress-meta">
            <span>획득 업그레이드 {run.chosenUpgradeIds.length}개</span>
            <span>보존 재료 {run.preservedIngredient ? run.preservedIngredient.name : '없음'}</span>
            <span>
              {upcomingRent
                ? upcomingRent.isDueToday
                  ? `오늘 임대료 ${upcomingRent.amount}골드`
                  : `다음 임대료 Day ${upcomingRent.day} / ${upcomingRent.amount}골드`
                : '다음 목표: 감사 주문'}
            </span>
          </div>
          <div className="progress-strip">
            {Array.from({ length: 7 }).map((_, index) => (
              <span
                key={index}
                className={`progress-step ${index + 1 < run.day ? 'is-done' : index + 1 === run.day ? 'is-current' : ''}`}
              />
            ))}
          </div>
        </section>

        <section className="panel compact-panel">
          <div className="inline-actions">
            <button className="ghost-button" type="button" onClick={() => setScene('lobby')}>
              로비 보기
            </button>
            {!run.outcome ? (
              <>
                <button
                  className="danger-button"
                  type="button"
                  onClick={() => {
                    if (abandonArmed) {
                      confirmAbandon();
                      return;
                    }

                    armAbandon();
                  }}
                >
                  {abandonArmed ? '중단 확인' : '런 중단'}
                </button>
                {abandonArmed ? (
                  <button className="ghost-button" type="button" onClick={cancelAbandon}>
                    취소
                  </button>
                ) : null}
              </>
            ) : null}
          </div>
          {abandonArmed && !run.outcome ? (
            <p className="warning-copy">현재 진행 중인 런을 포기합니다. 한 번 더 누를 때만 실제로 중단됩니다.</p>
          ) : null}
        </section>

        {run.activeDay.phase === 'choose-order' ? renderOrderStep(run) : null}
        {run.activeDay.phase === 'choose-bag' ? renderBagStep(run) : null}
        {run.activeDay.phase === 'workbench' ? renderWorkbenchStep(run) : null}
        {run.activeDay.phase === 'brew' ? renderBrewStep(run) : null}
        {(run.activeDay.phase === 'result' || run.activeDay.phase === 'finished') ? renderResultStep(run) : null}
      </section>
    );
  };

  return (
    <main className="app-shell">
      <div className="app-background" />
      <div className="app-frame">
        <header className="top-banner">
          <div>
            <span className="eyebrow">항아리 순서 퍼즐</span>
            <strong className="banner-title">마녀의 만병항아리</strong>
          </div>
          <span className="banner-notice">{notice}</span>
        </header>

        {scene === 'boot' ? (
          <section className="screen">
            <div className="hero-card">
              <span className="eyebrow">부트 중</span>
              <h1>항아리와 주문서를 준비하는 중입니다</h1>
              <p className="hero-copy">토스 게임 로그인과 저장 데이터를 확인하고 있습니다.</p>
            </div>
          </section>
        ) : null}
        {scene === 'lobby' ? renderLobby() : null}
        {scene === 'records' ? renderRecords() : null}
        {scene === 'run' ? renderRun() : null}
      </div>
    </main>
  );
}
