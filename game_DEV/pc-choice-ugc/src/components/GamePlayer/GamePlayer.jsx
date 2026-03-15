import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useGameStore, EXPEDITION_CONFIG, WEATHER_LABELS } from '../../stores/gameStore';
import { pickLocalized } from '../../utils/i18n';
import './GamePlayer.css';

// Unique ID generator to avoid duplicate keys
let logIdCounter = 0;
const generateLogId = () => `log-${++logIdCounter}-${Math.random().toString(36).substr(2, 9)}`;

// Default layout settings fallback
const defaultLayout = {
  theme: {
    primaryColor: '#f4d03f',
    backgroundColor: '#1a1a1a',
    panelColor: '#2a2a2a',
    borderColor: '#444',
    textColor: '#ffffff',
    dangerColor: '#e74c3c',
    successColor: '#2ecc71',
    warningColor: '#f39c12',
  },
  characterPanel: { position: 'left', width: 256, showStats: true, statsDisplayStyle: 'bar', showStateEffects: true },
  inventoryPanel: { position: 'right', width: 224, showResourceCounts: true },
  eventPanel: { maxWidth: 672, backgroundColor: '#2a3a4a', dialogueBoxStyle: 'modern', showCharacterPortrait: true, portraitSize: 48 },
  header: { showDayCounter: true, showExitButton: true },
  choiceButtons: { backgroundColor: '#4a3a2a', hoverColor: '#5a4a3a', borderColor: '#8a6a4a', borderRadius: 4 },
  gameOverScreen: { victoryBackgroundColor: '#1a2d1a', defeatBackgroundColor: '#2d1a1a' },
};

const defaultSoundTemplate = {
  enabled: true,
  masterVolume: 0.4,
  bgmUrl: '',
  sfx: {
    click: '/audio/ui_click.ogg',
    confirm: '/audio/ui_confirm.ogg',
    alert: '/audio/ui_alert.ogg',
  },
};

export default function GamePlayer({ language, onExit, soundEnabled = true, soundVolume = 0.35 }) {
  const {
    isPlaying,
    day,
    phase,
    characters,
    food,
    water,
    inventory,
    currentNodeId,
    gameData,
    assets,
    setCurrentNode,
    setPhase,
    feedCharacter,
    waterCharacter,
    getEligibleTriggers,
    getNextNode,
    applyResult,
    processDay,
    checkGameEnd,
    getExpeditionBonus,
    recordExpeditionResult,
    followNodeChain,
    healCharacter,
    boostSanity,
    removeItem,
    useItem: consumeItemAction,
    // New systems
    sendExpedition,
    expeditions,
    expeditionResults,
    environment,
    getAvailableRecipes,
    craftItem,
    getSkillBonus,
    hasSkill,
    getEnvironmentEffects,
    gameStats,
  } = useGameStore();

  const [currentEvent, setCurrentEvent] = useState(null);
  const [activeEventImageId, setActiveEventImageId] = useState(null);
  const [eventLog, setEventLog] = useState([]);
  const [showFeedModal, setShowFeedModal] = useState(false);
  const [gameEnded, setGameEnded] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [resultDisplay, setResultDisplay] = useState(null);
  const [showExpeditionModal, setShowExpeditionModal] = useState(false);
  const [showCraftModal, setShowCraftModal] = useState(false);
  const [showUtilityModal, setShowUtilityModal] = useState(false);
  const [rationPlan, setRationPlan] = useState({});
  const [pendingDayEffects, setPendingDayEffects] = useState([]);

  // Track if game has been initialized to prevent infinite loop
  const initializedRef = useRef(false);
  const eventQueueRef = useRef([]);
  const usedTriggersRef = useRef(new Set());
  const storyStartedRef = useRef(false);
  const pendingDayEffectsRef = useRef([]);
  const clickSfxRef = useRef(null);
  const confirmSfxRef = useRef(null);
  const alertSfxRef = useRef(null);
  const bgmRef = useRef(null);

  const t = useCallback((en, ko) => pickLocalized(language, en, ko), [language]);

  useEffect(() => {
    pendingDayEffectsRef.current = pendingDayEffects;
  }, [pendingDayEffects]);

  const soundTemplate = useMemo(() => {
    const projectSound = gameData?.soundSettings || {};
    return {
      ...defaultSoundTemplate,
      ...projectSound,
      sfx: {
        ...defaultSoundTemplate.sfx,
        ...(projectSound.sfx || {}),
      },
    };
  }, [gameData?.soundSettings]);

  const effectiveSoundVolume = Math.max(0, Math.min(1, soundVolume * (soundTemplate.masterVolume ?? 0.4)));

  const playSfx = useCallback((kind = 'click') => {
    if (!soundEnabled || soundTemplate.enabled === false) return;
    const target =
      kind === 'confirm' ? confirmSfxRef.current :
      kind === 'alert' ? alertSfxRef.current :
      clickSfxRef.current;
    if (!target) return;
    target.volume = effectiveSoundVolume;
    target.currentTime = 0;
    target.play().catch(() => {});
  }, [effectiveSoundVolume, soundEnabled, soundTemplate.enabled]);

  useEffect(() => {
    clickSfxRef.current = new Audio(soundTemplate.sfx.click);
    confirmSfxRef.current = new Audio(soundTemplate.sfx.confirm);
    alertSfxRef.current = new Audio(soundTemplate.sfx.alert);
    clickSfxRef.current.preload = 'auto';
    confirmSfxRef.current.preload = 'auto';
    alertSfxRef.current.preload = 'auto';
    return () => {
      clickSfxRef.current = null;
      confirmSfxRef.current = null;
      alertSfxRef.current = null;
    };
  }, [soundTemplate.sfx.alert, soundTemplate.sfx.click, soundTemplate.sfx.confirm]);

  useEffect(() => {
    if (!soundTemplate.bgmUrl || !soundEnabled || soundTemplate.enabled === false || !isPlaying) {
      if (bgmRef.current) {
        bgmRef.current.pause();
        bgmRef.current = null;
      }
      return;
    }
    const bgm = new Audio(soundTemplate.bgmUrl);
    bgm.loop = true;
    bgm.volume = Math.min(0.7, effectiveSoundVolume);
    bgm.play().catch(() => {});
    bgmRef.current = bgm;
    return () => {
      bgm.pause();
      bgmRef.current = null;
    };
  }, [effectiveSoundVolume, isPlaying, soundEnabled, soundTemplate.bgmUrl, soundTemplate.enabled]);

  // Get layout settings with fallback
  const layout = useMemo(() => {
    const l = gameData?.layoutSettings || defaultLayout;
    return {
      theme: { ...defaultLayout.theme, ...l.theme },
      characterPanel: { ...defaultLayout.characterPanel, ...l.characterPanel },
      inventoryPanel: { ...defaultLayout.inventoryPanel, ...l.inventoryPanel },
      eventPanel: { ...defaultLayout.eventPanel, ...l.eventPanel },
      header: { ...defaultLayout.header, ...l.header },
      choiceButtons: { ...defaultLayout.choiceButtons, ...l.choiceButtons },
      gameOverScreen: { ...defaultLayout.gameOverScreen, ...l.gameOverScreen },
    };
  }, [gameData?.layoutSettings]);

  const isStoryGraphMode = useMemo(() => {
    return (gameData?.nodes || []).some((node) => node?.data?.type === 'start');
  }, [gameData?.nodes]);

  const displayedLogs = useMemo(() => {
    if (phase === 'status' || phase === 'action') {
      return eventLog
        .filter((log) => ['day', 'danger', 'warning', 'success'].includes(log.type))
        .slice(-2);
    }
    return (isStoryGraphMode ? eventLog.slice(-3) : eventLog.slice(-4));
  }, [eventLog, isStoryGraphMode, phase]);

  const displayCharacters = useMemo(() => (
    [...characters].sort((a, b) => (b.isPlayer === true ? 1 : 0) - (a.isPlayer === true ? 1 : 0))
  ), [characters]);

  // Add log entry with unique ID
  const addLog = useCallback((text, type = 'info') => {
    setEventLog((prev) => [...prev, { text, type, id: generateLogId() }]);
  }, []);

  // Get character image based on state
  const getCharacterImage = useCallback((char) => {
    const charAsset = assets?.characters?.find((c) => c.id === char.id);
    if (!charAsset) return null;

    const state = char.alive ? (char.state || 'normal') : 'dead';
    return charAsset.images?.[state] || charAsset.images?.normal;
  }, [assets]);

  const resolveFlowNode = useCallback((node) => {
    if (!node) return null;
    if (node.data?.type === 'branch' || node.data?.type === 'flag' || node.data?.type === 'note') {
      return followNodeChain(node.id);
    }
    return node;
  }, [followNodeChain]);

  const getNodeById = useCallback((nodeId) => {
    if (!nodeId) return null;
    return (gameData?.nodes || []).find((node) => node.id === nodeId) || null;
  }, [gameData?.nodes]);

  const reachEndingNode = useCallback((endingNode) => {
    if (!endingNode || endingNode.data?.type !== 'ending') return false;
    const data = endingNode.data || {};
    const defaultEndingText = 'The story has ended.';
    const fallbackTitle = data.title || data.titleKo || data.label || 'Ending';
    const fallbackReason = data.reason || data.title || defaultEndingText;
    setGameEnded({
      ended: true,
      victory: data.victory !== false,
      endingType: data.endingKey || 'custom_ending',
      endingLabel: t(fallbackTitle, data.titleKo || fallbackTitle),
      reason: fallbackReason,
      reasonKo: pickLocalized('ko', fallbackReason, data.reasonKo || data.reason || data.titleKo || fallbackTitle || defaultEndingText),
    });
    return true;
  }, [t]);

  // === EVENT QUEUE SYSTEM ===

  // Advance to next event in queue, or go to night phase
  const advanceEventQueue = useCallback(() => {
    if (isStoryGraphMode) {
      setCurrentEvent(null);
      setActiveEventImageId(null);
      setPhase('night');
      return;
    }

    while (eventQueueRef.current.length > 0) {
      const trigger = eventQueueRef.current.shift();
      setCurrentNode(trigger.id);
      setActiveEventImageId(trigger?.data?.eventImageId || null);
      let nextNode = resolveFlowNode(getNextNode(trigger.id));
      if (nextNode && nextNode.data.type === 'dialogue') {
        addLog(t('Another event starts.', '다른 이벤트가 시작됩니다.'), 'info');
        setCurrentNode(nextNode.id);
        setCurrentEvent(nextNode);
        setPhase('event');
        return;
      }
    }
    setCurrentEvent(null);
    setActiveEventImageId(null);
    setPhase('night');
  }, [isStoryGraphMode, setCurrentNode, resolveFlowNode, getNextNode, addLog, t, setPhase]);

  // Roll 1-3 events for the day
  const rollEvents = useCallback(() => {
    const allEligible = getEligibleTriggers('event', false);
    const eligibleTriggers = allEligible.filter(tr => !usedTriggersRef.current.has(tr.id));

    if (eligibleTriggers.length === 0) {
      addLog(t('No event occurred today.', '오늘은 이벤트가 발생하지 않았습니다.'), 'info');
      setPhase('night');
      return;
    }

    // Pick 1-3 events randomly
    const maxEvents = Math.min(3, eligibleTriggers.length);
    const count = Math.max(1, Math.ceil(Math.random() * maxEvents));
    const shuffled = [...eligibleTriggers].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);

    // Mark as used so they don't repeat
    selected.forEach(tr => usedTriggersRef.current.add(tr.id));

    // Queue remaining events (all but first)
    eventQueueRef.current = selected.slice(1);

    // Process first event
    const firstTrigger = selected[0];
    setCurrentNode(firstTrigger.id);
    setActiveEventImageId(firstTrigger?.data?.eventImageId || null);
    let nextNode = resolveFlowNode(getNextNode(firstTrigger.id));
    if (nextNode && nextNode.data.type === 'dialogue') {
      setCurrentNode(nextNode.id);
      setCurrentEvent(nextNode);
      setPhase('event');
    } else {
      advanceEventQueue();
    }
  }, [getEligibleTriggers, resolveFlowNode, getNextNode, setCurrentNode, setPhase, addLog, t, advanceEventQueue]);

  const runCommonPhaseNodes = useCallback((timing) => {
    const triggers = getEligibleTriggers(timing, true);
    if (!triggers.length) return false;

    for (const trigger of triggers) {
      const key = `${day}:${timing}:${trigger.id}`;
      if (usedTriggersRef.current.has(key)) continue;
      usedTriggersRef.current.add(key);

      setCurrentNode(trigger.id);
      const first = resolveFlowNode(getNextNode(trigger.id));
      if (!first) continue;

      if (first.data.type === 'ending') {
        if (reachEndingNode(first)) return true;
        continue;
      }

      if (first.data.type === 'result') {
        const success = Math.random() <= (first.data.successChance ?? 1);
        const result = success ? first.data.onSuccess : first.data.onFailure;
        const text = t(result?.text || result?.textKo || '', result?.textKo || result?.text || '');
        if (result) applyResult(result);
        if (text) addLog(`[${timing}] ${text}`, success ? 'success' : 'warning');
        continue;
      }

      if (first.data.type === 'dialogue') {
        const text = t(first.data.text || first.data.textKo || '', first.data.textKo || first.data.text || '');
        if (text) addLog(`[${timing}] ${text}`, 'info');

        const second = resolveFlowNode(getNextNode(first.id));
        if (second?.data?.type === 'result') {
          const success = Math.random() <= (second.data.successChance ?? 1);
          const result = success ? second.data.onSuccess : second.data.onFailure;
          const resultText = t(result?.text || result?.textKo || '', result?.textKo || result?.text || '');
          if (result) applyResult(result);
          if (resultText) addLog(`[${timing}] ${resultText}`, success ? 'success' : 'warning');
          continue;
        }

        if (second?.data?.type === 'ending' && reachEndingNode(second)) {
          return true;
        }
      }
    }

    return false;
  }, [day, getEligibleTriggers, setCurrentNode, resolveFlowNode, getNextNode, reachEndingNode, applyResult, addLog, t]);

  // Start day: status phase -> action phase -> event phase
  const startMorning = useCallback((currentDay, carryoverMessages = []) => {
    usedTriggersRef.current = new Set();
    eventQueueRef.current = [];
    setCurrentEvent(null);
    setActiveEventImageId(null);
    setResultDisplay(null);
    setRationPlan({});
    setPendingDayEffects([]);
    setPhase('status');
    addLog(`=== ${t('Day', '일차')} ${currentDay} ===`, 'day');
    if (carryoverMessages.length > 0) {
      addLog(t('--- Previous Day Results ---', '--- 전날 결과 ---'), 'day');
      carryoverMessages.forEach((entry) => {
        addLog(entry.text, entry.type || 'info');
      });
    }

    if (isStoryGraphMode) {
      const aliveCount = characters.filter((c) => c.alive).length;
      if (aliveCount === 0) {
        setGameEnded({
          ended: true,
          victory: false,
          endingType: 'death_all',
          reason: 'All family members have died.',
          reasonKo: '모든 가족이 사망했습니다.',
        });
        return;
      }
    } else {
      const endCheck = checkGameEnd();
      if (endCheck.ended) {
        setGameEnded(endCheck);
        return;
      }
    }

    // Status warnings
    characters.forEach((char) => {
      if (!char.alive) return;
      const stats = char.stats || {};
      const enabledStats = (gameData?.customStats || []).filter(s => s.enabled);

      enabledStats.forEach(statDef => {
        const value = stats[statDef.id] ?? statDef.defaultValue;
        const isCritical = statDef.direction === 'up'
          ? value >= statDef.criticalThreshold
          : value <= statDef.criticalThreshold;

        if (isCritical) {
          if (statDef.id === 'hunger') {
            addLog(`${char.name} ${t('is starving!', '굶주림 상태입니다!')}`, 'danger');
          } else if (statDef.id === 'thirst') {
            addLog(`${char.name} ${t('is dehydrated!', '탈수 상태입니다!')}`, 'danger');
          } else if (statDef.id === 'sanity') {
            addLog(`${char.name} ${t('is losing sanity!', '정신력이 위험합니다!')}`, 'warning');
          } else {
            const displayName = t(statDef.name || statDef.nameKo || statDef.id, statDef.nameKo || statDef.name || statDef.id);
            addLog(`${char.name} - ${statDef.icon} ${displayName} ${t('is critical!', '위험 수치입니다!')}`, 'danger');
          }
        }
      });
    });

    // Show expedition results
    if (expeditionResults && expeditionResults.length > 0) {
      expeditionResults.forEach((result) => {
        if (result.success) {
          let msg = `${result.characterName} ${t('returned from expedition!', '탐험에서 돌아왔습니다!')} +${result.food} ${t('food', '식량')}, +${result.water} ${t('water', '물')}`;
          if (result.item) msg += `, ${t('found', '획득')}: ${result.item}`;
          addLog(msg, 'success');
        } else {
          let msg = `${result.characterName} ${t('failed the expedition...', '탐험에 실패했습니다...')}`;
          if (result.consequences?.includes('injured')) msg += ` ${t('Got injured!', '부상을 입었습니다!')}`;
          if (result.consequences?.includes('sick')) msg += ` ${t('Got sick!', '질병에 걸렸습니다!')}`;
          if (result.consequences?.includes('dead')) msg += ` ${t('Did not return...', '돌아오지 못했습니다...')}`;
          addLog(msg, 'danger');
        }
      });
    }

    // Show environment effects
    if (gameData?.globalStats?.environmentEnabled !== false) {
      const envEffects = getEnvironmentEffects();
      envEffects.forEach((eff) => {
        addLog(eff.message, eff.severity === 'danger' ? 'danger' : eff.severity === 'warning' ? 'warning' : 'info');
      });
    }

    if (runCommonPhaseNodes('status')) return;
  }, [characters, gameData, checkGameEnd, addLog, t, expeditionResults, getEnvironmentEffects, isStoryGraphMode, setPhase, runCommonPhaseNodes]);

  const queuePendingResult = useCallback((decisionKey, result, success, resultText) => {
    if (!result || !decisionKey) return;
    setPendingDayEffects((prev) => {
      const kept = prev.filter((entry) => entry.decisionKey !== decisionKey);
      return [
        ...kept,
        {
          decisionKey,
          result,
          success,
          text: resultText || '',
          type: success ? 'success' : 'danger',
          category: 'event',
        },
      ];
    });
    addLog(
      t(
        'Decision saved. It will be finalized when you press Next Day.',
        '선택이 임시 저장되었습니다. 다음 날 버튼을 눌렀을 때 최종 반영됩니다.'
      ),
      'info'
    );
  }, [addLog, t]);

  const toggleRation = useCallback((characterId, kind) => {
    setRationPlan((prev) => {
      const current = prev[characterId] || { feed: false, water: false };
      const nextValue = !current[kind];

      if (nextValue) {
        const usedFood = Object.values(prev).reduce((sum, plan) => sum + (plan.feed ? 1 : 0), 0);
        const usedWater = Object.values(prev).reduce((sum, plan) => sum + (plan.water ? 1 : 0), 0);
        if (kind === 'feed' && usedFood >= food) return prev;
        if (kind === 'water' && usedWater >= water) return prev;
      }

      return {
        ...prev,
        [characterId]: {
          ...current,
          [kind]: nextValue,
        },
      };
    });
  }, [food, water]);

  // Handle choice selection
  const handleChoice = useCallback((choiceIndex) => {
    playSfx('confirm');
    const sourceNodeId = currentEvent?.data?.type === 'choice' ? currentEvent.id : currentEvent?.id;
    let choiceNode = getNextNode(sourceNodeId, `choice-${choiceIndex}`);

    if (!choiceNode) {
      setCurrentEvent(null);
      advanceEventQueue();
      return;
    }

    choiceNode = resolveFlowNode(choiceNode);
    if (!choiceNode) {
      setCurrentEvent(null);
      advanceEventQueue();
      return;
    }

    if (choiceNode.data.type === 'ending') {
      reachEndingNode(choiceNode);
      return;
    }

    if (choiceNode.data.type === 'result') {
      // Process result
      const { successChance, onSuccess, onFailure } = choiceNode.data;
      const bonus = getExpeditionBonus();
      const roll = Math.random();
      const success = roll <= (successChance + bonus);

      recordExpeditionResult(success);

      const result = success ? onSuccess : onFailure;
      const resultText = t(result?.text || result?.textKo || '', result?.textKo || result?.text || '');
      queuePendingResult(sourceNodeId || choiceNode.id, result, success, resultText);

      if (resultText) {
        // Show preview text with Continue button. Actual effect is applied on Next Day.
        setResultDisplay({
          text: resultText,
          type: success ? 'success' : 'danger',
          choiceNodeId: choiceNode.id,
          success,
          pending: true,
          sourceNodeId,
          decisionKey: sourceNodeId || choiceNode.id,
        });
        setCurrentEvent(null);
      } else {
        // No result text, continue flow directly
        let nextNode = resolveFlowNode(getNextNode(choiceNode.id, success ? 'success' : 'failure'));
        if (nextNode && nextNode.data.type === 'dialogue') {
          setCurrentEvent(nextNode);
        } else if (nextNode && nextNode.data.type === 'ending') {
          reachEndingNode(nextNode);
        } else {
          setCurrentEvent(null);
          advanceEventQueue();
        }
      }
    } else if (choiceNode.data.type === 'dialogue') {
      setCurrentEvent(choiceNode);
    } else {
      setCurrentEvent(null);
      advanceEventQueue();
    }
  }, [currentEvent, getNextNode, resolveFlowNode, reachEndingNode, getExpeditionBonus, recordExpeditionResult, advanceEventQueue, queuePendingResult, playSfx, t]);

  // Continue after result display (user clicks Continue button)
  const handleResultContinue = useCallback(() => {
    if (!resultDisplay) return;
    playSfx('confirm');
    const { choiceNodeId, success } = resultDisplay;
    setResultDisplay(null);

    let nextNode = resolveFlowNode(getNextNode(choiceNodeId, success ? 'success' : 'failure'));

    if (nextNode && nextNode.data.type === 'dialogue') {
      setCurrentEvent(nextNode);
      setPhase('event');
    } else if (nextNode && nextNode.data.type === 'ending') {
      reachEndingNode(nextNode);
    } else {
      advanceEventQueue();
    }
  }, [resultDisplay, getNextNode, resolveFlowNode, reachEndingNode, advanceEventQueue, playSfx, setPhase]);

  const handleRechoose = useCallback(() => {
    if (!resultDisplay?.sourceNodeId) return;
    const sourceNode = getNodeById(resultDisplay.sourceNodeId);
    setPendingDayEffects((prev) => prev.filter((entry) => entry.decisionKey !== resultDisplay.decisionKey));
    setResultDisplay(null);
    if (sourceNode) {
      setCurrentEvent(sourceNode);
      setPhase('event');
    }
  }, [resultDisplay, getNodeById, setPhase]);

  // Continue for dialogues without choices (informational dialogues)
  const handleEventContinue = useCallback(() => {
    if (!currentEvent) return;
    playSfx('click');

    let nextNode = resolveFlowNode(getNextNode(currentEvent.id));

    if (nextNode) {
      if (nextNode.data.type === 'dialogue') {
        setCurrentEvent(nextNode);
      } else if (nextNode.data.type === 'ending') {
        reachEndingNode(nextNode);
      } else if (nextNode.data.type === 'result') {
        // Auto-process result
        const { successChance, onSuccess, onFailure } = nextNode.data;
        const success = Math.random() <= successChance;
        const result = success ? onSuccess : onFailure;
        const resultText = t(result?.text || result?.textKo || '', result?.textKo || result?.text || '');
        queuePendingResult(nextNode.id, result, success, resultText);

        if (resultText) {
          setResultDisplay({
            text: resultText,
            type: success ? 'success' : 'danger',
            choiceNodeId: nextNode.id,
            success,
            pending: true,
          });
          setCurrentEvent(null);
        } else {
          setCurrentEvent(null);
          advanceEventQueue();
        }
      } else if (nextNode.data.type === 'choice') {
        // Next is a choice node - let the UI render it naturally
        // The computed `choices` variable below will pick it up
        return;
      } else {
        setCurrentEvent(null);
        advanceEventQueue();
      }
    } else {
      setCurrentEvent(null);
      advanceEventQueue();
    }
  }, [currentEvent, getNextNode, resolveFlowNode, reachEndingNode, queuePendingResult, advanceEventQueue, playSfx, t]);

  const handleProceedToActions = useCallback(() => {
    playSfx('confirm');
    setPhase('action');
    if (runCommonPhaseNodes('action')) return;
  }, [playSfx, runCommonPhaseNodes, setPhase]);

  const handleBackToStatus = useCallback(() => {
    playSfx('click');
    setPhase('status');
  }, [playSfx, setPhase]);

  const handleBackToActions = useCallback(() => {
    playSfx('click');
    setCurrentEvent(null);
    setActiveEventImageId(null);
    setResultDisplay(null);
    setPhase('action');
    setPendingDayEffects((prev) => prev.filter((entry) => entry.category !== 'event'));
    eventQueueRef.current = [];
    addLog(
      t(
        'Event decisions were cleared. You can choose events again.',
        '이벤트 선택이 초기화되었습니다. 다시 선택할 수 있습니다.'
      ),
      'warning'
    );
  }, [addLog, playSfx, setPhase, t]);

  const handleReviewDecision = useCallback((decisionKey) => {
    if (!decisionKey) return;
    playSfx('click');
    const entry = (pendingDayEffectsRef.current || []).find((candidate) => candidate.decisionKey === decisionKey);
    if (!entry) return;

    setPhase('event');
    setCurrentEvent(null);
    setResultDisplay({
      text: entry.text || t('Draft decision preview', '임시 결정 미리보기'),
      type: entry.type || 'info',
      choiceNodeId: entry.choiceNodeId,
      success: entry.success,
      pending: true,
      sourceNodeId: entry.sourceNodeId,
      decisionKey: entry.decisionKey,
    });
  }, [playSfx, setPhase, t]);

  const handleStartEventPhase = useCallback(() => {
    playSfx('confirm');
    setResultDisplay(null);
    setCurrentEvent(null);
    setActiveEventImageId(null);
    setPhase('event');
    if (runCommonPhaseNodes('event')) return;

    if (isStoryGraphMode) {
      if (!storyStartedRef.current) {
        storyStartedRef.current = true;
        const startNode = (gameData?.nodes || []).find((node) => node?.data?.type === 'start');
        if (!startNode) {
          addLog('No Start node found. Add one Start node in editor.', 'warning');
          setPhase('night');
          return;
        }

        setCurrentNode(startNode.id);
        const nextNode = resolveFlowNode(getNextNode(startNode.id));
        if (nextNode?.data?.type === 'dialogue' || nextNode?.data?.type === 'choice') {
          setCurrentNode(nextNode.id);
          setCurrentEvent(nextNode);
          return;
        }
        if (nextNode?.data?.type === 'ending') {
          reachEndingNode(nextNode);
          return;
        }
        addLog('Start node should connect to a Dialogue or Choice node.', 'warning');
        setPhase('night');
        return;
      }

      if (currentEvent || resultDisplay) return;

      let nextNode = currentNodeId ? resolveFlowNode(getNextNode(currentNodeId)) : null;
      if (!nextNode) {
        const triggered = getEligibleTriggers('event', false);
        if (triggered.length > 0) {
          rollEvents();
          return;
        }
        addLog('No story event today.', 'info');
        setPhase('night');
        return;
      }

      if (nextNode.data.type === 'dialogue' || nextNode.data.type === 'choice') {
        setCurrentNode(nextNode.id);
        setCurrentEvent(nextNode);
        return;
      }
      if (nextNode.data.type === 'ending') {
        reachEndingNode(nextNode);
        return;
      }
      setPhase('night');
      return;
    }

    rollEvents();
  }, [isStoryGraphMode, gameData?.nodes, addLog, setPhase, setCurrentNode, getNextNode, resolveFlowNode, reachEndingNode, currentEvent, resultDisplay, currentNodeId, getEligibleTriggers, playSfx, rollEvents, runCommonPhaseNodes]);

  const handleNextDay = useCallback(() => {
    playSfx('confirm');
    const carryoverMessages = [];

    const eventDecisions = pendingDayEffectsRef.current || [];
    if (eventDecisions.length > 0) {
      eventDecisions.forEach((entry) => {
        if (entry.result) applyResult(entry.result);
        if (entry.text) carryoverMessages.push({ text: entry.text, type: entry.type || 'info' });
      });
    }

    Object.entries(rationPlan).forEach(([characterId, plan]) => {
      const character = characters.find((c) => c.id === characterId);
      if (!character?.alive) return;
      if (plan.feed && feedCharacter(characterId)) {
        carryoverMessages.push({
          text: `${character.name} ${t('received food ration.', '에게 식량이 배급되었습니다.')}`,
          type: 'info',
        });
      }
      if (plan.water && waterCharacter(characterId)) {
        carryoverMessages.push({
          text: `${character.name} ${t('received water ration.', '에게 물이 배급되었습니다.')}`,
          type: 'info',
        });
      }
    });

    setPendingDayEffects([]);
    setRationPlan({});

    addLog(t('Night falls...', '밤이 되었습니다...'), 'info');
    processDay();

    const nextDay = useGameStore.getState().day;
    const aliveCount = useGameStore.getState().characters.filter((c) => c.alive).length;
    if (aliveCount === 0) {
      setGameEnded({
        ended: true,
        victory: false,
        endingType: 'death_all',
        reason: 'All family members have died.',
        reasonKo: '모든 가족이 사망했습니다.',
      });
      return;
    }

    if (!isStoryGraphMode) {
      const endCheck = checkGameEnd();
      if (endCheck.ended) {
        setGameEnded(endCheck);
        return;
      }
    }

    setEventLog([]);
    setResultDisplay(null);
    setActiveEventImageId(null);
    startMorning(nextDay, carryoverMessages);
  }, [processDay, checkGameEnd, isStoryGraphMode, addLog, playSfx, t, startMorning, applyResult, rationPlan, characters, feedCharacter, waterCharacter]);

  // Initialize game on mount - only once
  useEffect(() => {
    if (isPlaying && !initializedRef.current) {
      initializedRef.current = true;
      storyStartedRef.current = false;
      usedTriggersRef.current = new Set();
      eventQueueRef.current = [];
      setPhase('status');
      startMorning(day);
    }
  }, [isPlaying]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset initialization when game stops
  useEffect(() => {
    if (!isPlaying) {
      initializedRef.current = false;
      storyStartedRef.current = false;
      usedTriggersRef.current = new Set();
      eventQueueRef.current = [];
      setEventLog([]);
      setCurrentEvent(null);
      setActiveEventImageId(null);
      setGameEnded(null);
      setResultDisplay(null);
      setShowUtilityModal(false);
      setRationPlan({});
      setPendingDayEffects([]);
    }
  }, [isPlaying]);

  if (!isPlaying) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500">{t('No game in progress', '진행 중인 게임이 없습니다.')}</p>
      </div>
    );
  }

  // Game over screen
  if (gameEnded) {
    const bgColor = gameEnded.victory
      ? layout.gameOverScreen.victoryBackgroundColor
      : layout.gameOverScreen.defeatBackgroundColor;
    const bgImage = gameEnded.victory
      ? layout.gameOverScreen.victoryImage
      : layout.gameOverScreen.defeatImage;

    return (
      <div
        className="h-full flex flex-col items-center justify-center bg-cover bg-center"
        style={{
          backgroundColor: bgColor,
          backgroundImage: bgImage ? `url(${bgImage})` : undefined,
        }}
      >
        <div className="bg-black/50 p-8 rounded-lg text-center max-w-lg">
          <h1
            className="text-4xl font-bold mb-2"
            style={{ color: gameEnded.victory ? layout.theme.successColor : layout.theme.dangerColor }}
          >
            {gameEnded.victory ? t('RESCUED!', '구조 성공') : t('GAME OVER', '게임 오버')}
          </h1>
          {gameEnded.endingType && gameEnded.endingType !== 'rescue' && gameEnded.endingType !== 'death_all' && (
            <div className="text-sm mb-3 px-3 py-1 rounded inline-block" style={{ backgroundColor: `${layout.theme.primaryColor}33`, color: layout.theme.primaryColor }}>
              {gameEnded.endingType === 'all_alive' && t('Perfect Ending', '퍼펙트 엔딩')}
              {gameEnded.endingType === 'lone_survivor' && t('Lone Survivor Ending', '고독한 생존자 엔딩')}
              {gameEnded.endingType === 'escape' && t('Escape Ending', '탈출 엔딩')}
              {gameEnded.endingType === 'scientist' && t('Scientist Ending', '과학자 엔딩')}
              {gameEnded.endingType === 'raider_king' && t('Raider King Ending', '약탈자 왕 엔딩')}
              {gameEnded.endingType === 'trader' && t('Trader Ending', '교역 엔딩')}
              {gameEnded.endingType === 'underground' && t('Secret Ending', '비밀 엔딩')}
              {gameEnded.endingType === 'military' && t('Military Ending', '군 초소 엔딩')}
              {gameEnded.endingType === 'self_sufficient' && t('Self-Sufficient Ending', '자급자족 엔딩')}
              {gameEnded.endingType === 'rescue_requested' && t('Rescue Request Ending', '구조 요청 엔딩')}
              {!['all_alive', 'lone_survivor', 'escape', 'scientist', 'raider_king', 'trader', 'underground', 'military', 'self_sufficient', 'rescue_requested'].includes(gameEnded.endingType) && (
                gameEnded.endingLabel || t('Custom Ending', '커스텀 엔딩')
              )}
            </div>
          )}
          <p className="text-xl mb-6" style={{ color: layout.theme.textColor }}>
            {t(gameEnded.reason || gameEnded.reasonKo || '', gameEnded.reasonKo || gameEnded.reason || '')}
          </p>
          <div className="mb-6 text-left p-4 rounded" style={{ backgroundColor: `${layout.theme.backgroundColor}cc`, color: `${layout.theme.textColor}99` }}>
            <p className="mb-1">{t('Days Survived', '생존 일수')}: <span style={{ color: layout.theme.primaryColor }}>{day}</span></p>
            <p className="mb-1">{t('Survivors', '생존자')}: <span style={{ color: layout.theme.primaryColor }}>{characters.filter((c) => c.alive).length}/{characters.length}</span></p>
            {gameStats && (
              <>
                <p className="mb-1">{t('Expeditions', '탐험 횟수')}: <span style={{ color: layout.theme.primaryColor }}>{gameStats.successfulExpeditions}/{gameStats.totalExpeditions}</span></p>
                <p className="mb-1">{t('Items Crafted', '제작 수')}: <span style={{ color: layout.theme.primaryColor }}>{gameStats.itemsCrafted}</span></p>
                <p>{t('Total Food Gathered', '총 식량 확보')}: <span style={{ color: layout.theme.primaryColor }}>{gameStats.totalFoodGathered}</span></p>
              </>
            )}
          </div>
          <button
            onClick={onExit}
            className="px-6 py-3 rounded font-bold transition-colors"
            style={{
              backgroundColor: layout.theme.primaryColor,
              color: layout.theme.backgroundColor,
            }}
          >
            {t('Return to Editor', '에디터로 돌아가기')}
          </button>
        </div>
      </div>
    );
  }

  const currentEventText = currentEvent?.data
    ? t(currentEvent.data.text || currentEvent.data.textKo || '', currentEvent.data.textKo || currentEvent.data.text || '')
    : null;

  // Get background and character for current event
  const resolvedBackgroundId = currentEvent?.data?.backgroundId || activeEventImageId;
  const currentBackground = resolvedBackgroundId
    ? assets?.backgrounds?.find((b) => b.id === resolvedBackgroundId)
    : null;
  const currentSpeaker = currentEvent?.data?.characterId
    ? assets?.characters?.find((c) => c.id === currentEvent.data.characterId)
    : null;
  const currentSpeakerState = currentSpeaker
    ? characters.find((c) => c.id === currentSpeaker.id)
    : null;
  const currentSpeakerImage = currentSpeaker
    ? (currentSpeakerState?.alive === false
        ? currentSpeaker.images?.dead
        : currentSpeaker.images?.[currentSpeakerState?.state] || currentSpeaker.images?.normal)
    : null;

  // Get next node after current event, following through any branches
  let choiceNode = null;
  if (currentEvent?.data?.type === 'choice') {
    choiceNode = currentEvent;
  } else if (currentEvent) {
    choiceNode = resolveFlowNode(getNextNode(currentEvent.id));
  }
  const choices = choiceNode?.data?.type === 'choice' ? choiceNode.data.choices : null;

  // Check if current event has no choices (informational only, needs Continue button)
  const needsContinueButton = currentEvent && !choices && !resultDisplay;
  const leftPanelWidth = isStoryGraphMode ? 188 : layout.characterPanel.width;
  const rightPanelWidth = isStoryGraphMode ? 198 : layout.inventoryPanel.width;
  const eventMaxWidth = isStoryGraphMode ? 1180 : layout.eventPanel.maxWidth;
  const phaseStep = phase === 'night' ? 4 : phase === 'event' ? 3 : phase === 'action' ? 2 : 1;
  const centerColumnWidth = isStoryGraphMode ? 1180 : 980;
  const plannedFoodUse = Object.values(rationPlan).reduce((sum, plan) => sum + (plan.feed ? 1 : 0), 0);
  const plannedWaterUse = Object.values(rationPlan).reduce((sum, plan) => sum + (plan.water ? 1 : 0), 0);

  return (
    <div className="play-root">
      <div
        className="play-shell"
        style={{
          backgroundColor: layout.theme.backgroundColor,
          '--play-primary': layout.theme.primaryColor,
          '--play-bg': layout.theme.backgroundColor,
          '--play-panel': layout.theme.panelColor,
          '--play-border': layout.theme.borderColor,
          '--play-text': layout.theme.textColor,
          '--play-danger': layout.theme.dangerColor,
          '--play-success': layout.theme.successColor,
          '--play-warning': layout.theme.warningColor,
        }}
      >
        <div className="play-layout">
          {/* Left: Characters */}
          <aside
        className="play-party-panel play-side-panel play-side-panel-left p-4 overflow-y-auto"
        style={{
          width: layout.characterPanel.position !== 'hidden' ? leftPanelWidth : 0,
          display: layout.characterPanel.position === 'hidden' ? 'none' : 'block',
          backgroundColor: layout.characterPanel.backgroundColor || layout.theme.panelColor,
          borderRight: `1px solid ${layout.theme.borderColor}`,
          backgroundImage: layout.characterPanel.backgroundImage ? `url(${layout.characterPanel.backgroundImage})` : undefined,
          order: layout.characterPanel.position === 'right' ? 3 : 1,
        }}
      >
        <h3 className="play-section-title font-bold mb-4" style={{ color: layout.theme.primaryColor }}>{t('Family', '가족')}</h3>
        {displayCharacters.map((char) => (
          <div
            key={char.id}
            className={`play-character-card mb-4 p-3 rounded-lg ${
              char.alive ? '' : 'opacity-50'
            } ${layout.characterPanel.showStateEffects && char.state === 'sick' ? 'border-l-4 border-purple-500' : ''} ${
              layout.characterPanel.showStateEffects && char.state === 'injured' ? 'border-l-4 border-red-500' : ''
            } ${layout.characterPanel.showStateEffects && char.state === 'insane' ? 'border-l-4 border-pink-500' : ''}`}
            style={{ backgroundColor: char.alive ? `${layout.theme.backgroundColor}cc` : `${layout.theme.backgroundColor}66` }}
          >
            <div className="flex items-center gap-3 mb-2">
              {getCharacterImage(char) ? (
                <img src={getCharacterImage(char)} alt={char.name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg" style={{ backgroundColor: layout.theme.borderColor }}>
                  {char.name[0]}
                </div>
              )}
              <div>
                <div className="font-medium" style={{ color: layout.theme.textColor }}>{char.name}</div>
                {char.isPlayer && (
                  <span className="text-xs px-1.5 py-0.5 rounded mr-1" style={{ backgroundColor: '#334155', color: '#93c5fd' }}>
                    {t('YOU', '주체')}
                  </span>
                )}
                {!char.alive && <span className="text-xs" style={{ color: layout.theme.dangerColor }}>{t('DEAD', '사망')}</span>}
                {char.onExpedition && char.alive && (
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: '#2a4a2a', color: '#4ade80' }}>
                    {t('On Expedition', '탐험 중')}
                    {(() => { const exp = expeditions.find(e => e.characterId === char.id); return exp ? ` D-${exp.daysRemaining}` : ''; })()}
                  </span>
                )}
                {char.state !== 'normal' && char.alive && !char.onExpedition && layout.characterPanel.showStateEffects && (
                  <span className="text-xs text-purple-400 capitalize">{char.state}</span>
                )}
              </div>
            </div>

            {/* Skills display */}
            {char.alive && (char.skills || []).length > 0 && (
              <div className="flex gap-1 mt-1 mb-1 flex-wrap">
                {(char.skills || []).map((skill) => (
                  <span
                    key={skill.id}
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: `${layout.theme.primaryColor}22`, color: layout.theme.primaryColor }}
                    title={`${t(skill.name || skill.nameKo || '', skill.nameKo || skill.name || '')}: +${Math.round(skill.bonus * 100)}%`}
                  >
                    {skill.icon} {t(skill.name || skill.nameKo || '', skill.nameKo || skill.name || '')}
                  </span>
                ))}
              </div>
            )}

            {char.alive && layout.characterPanel.showStats && (
              <div className="space-y-1 text-xs">
                {(gameData?.customStats || []).filter((s) => s.enabled).map((statDef) => {
                  const value = char.stats?.[statDef.id] ?? statDef.defaultValue;
                  const percentage = ((value - statDef.min) / (statDef.max - statDef.min)) * 100;
                  const displayName = t(statDef.name || statDef.nameKo || statDef.id, statDef.nameKo || statDef.name || statDef.id);
                  const isCritical = statDef.direction === 'up'
                    ? value >= statDef.criticalThreshold
                    : value <= statDef.criticalThreshold;

                  // Number only style
                  if (layout.characterPanel.statsDisplayStyle === 'number') {
                    return (
                      <div key={statDef.id} className="flex justify-between" style={{ color: isCritical ? layout.theme.dangerColor : `${layout.theme.textColor}99` }}>
                        <span>{statDef.icon} {displayName}</span>
                        <span>{Math.round(value)}/{statDef.max}</span>
                      </div>
                    );
                  }

                  // Icon only style
                  if (layout.characterPanel.statsDisplayStyle === 'icon') {
                    return (
                      <div key={statDef.id} className="flex items-center gap-1" style={{ color: isCritical ? layout.theme.dangerColor : `${layout.theme.textColor}99` }}>
                        <span className="text-base">{statDef.icon}</span>
                        <span>{Math.round(value)}</span>
                      </div>
                    );
                  }

                  // Bar style (default)
                  return (
                    <div key={statDef.id}>
                      <div className="flex justify-between" style={{ color: isCritical ? layout.theme.dangerColor : `${layout.theme.textColor}99` }}>
                        <span>{statDef.icon} {displayName}</span>
                        <span>{Math.round(value)}</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: layout.theme.backgroundColor }}>
                        <div
                          className="h-full transition-all"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: statDef.color,
                            opacity: isCritical ? 1 : 0.7,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
          </aside>

          {/* Center: Event */}
          <section
        className="play-main-panel play-center flex flex-col min-h-0"
        style={{
          order: 2,
          flex: 1,
          minWidth: 0,
          maxWidth: centerColumnWidth,
        }}
      >
        {/* Header */}
        <div
          className="play-main-header play-header px-6 py-3 flex justify-between items-center"
          style={{
            backgroundColor: layout.header.backgroundColor || layout.theme.panelColor,
            borderBottom: `1px solid ${layout.theme.borderColor}`,
            backgroundImage: layout.header.backgroundImage ? `url(${layout.header.backgroundImage})` : undefined,
          }}
        >
          {layout.header.showDayCounter && (
            <div className="flex items-center gap-4">
              <div className="play-day-pill text-xl font-bold" style={{ color: layout.theme.primaryColor }}>
                {t('Day', '일차')} {day}
              </div>
              {/* Environment indicators */}
              {gameData?.globalStats?.environmentEnabled !== false && (
                <div className="flex items-center gap-2 text-sm" style={{ color: `${layout.theme.textColor}99` }}>
                  <span title={t(WEATHER_LABELS[environment.weather]?.nameEn || '', WEATHER_LABELS[environment.weather]?.name || '')}>
                    {WEATHER_LABELS[environment.weather]?.icon || '?'}
                  </span>
                  <span title={t('Temperature', '기온')}>
                    {environment.temperature}°C
                  </span>
                  <span
                    title={t('Radiation', '방사능')}
                    style={{
                      color: environment.radiation > 60
                        ? layout.theme.dangerColor
                        : environment.radiation > 30
                          ? layout.theme.warningColor
                          : `${layout.theme.textColor}66`,
                    }}
                  >
                    RAD {environment.radiation}
                  </span>
                  {environment.severity >= 3 && (
                    <span style={{ color: layout.theme.dangerColor }} title={t('Danger Level', '위험도')}>
                      Lv.{environment.severity}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
          <div className="play-header-actions flex items-center gap-2">
            {layout.header.showExitButton && (
              <button
                onClick={onExit}
                className="play-btn play-btn-secondary px-3 py-1 rounded text-sm transition-colors"
                style={{ backgroundColor: layout.theme.borderColor, color: layout.theme.textColor }}
              >
                {t('Exit', '종료')}
              </button>
            )}
          </div>
        </div>

        {/* Story / phase content */}
        <div className="play-scroll-shell flex-1 p-6 overflow-y-auto">
          <div className="mx-auto space-y-3" style={{ maxWidth: eventMaxWidth }}>
            {displayedLogs.length > 0 && (
              <div className="play-log-stack space-y-2">
                {displayedLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`play-log-entry p-3 rounded ${
                      log.type === 'day' ? 'font-bold text-center play-log-day' :
                      log.type === 'danger' ? 'play-log-danger' :
                      log.type === 'success' ? 'play-log-success' :
                      log.type === 'warning' ? 'play-log-warning' :
                      'play-log-info'
                    }`}
                  >
                    {log.text}
                  </div>
                ))}
              </div>
            )}

            {/* Current event with background and character */}
            {currentEventText && (
              <div
                className={`play-event-card play-vn-stage rounded-lg overflow-hidden ${isStoryGraphMode ? 'is-story-mode' : ''}`}
                style={{
                  border: `1px solid ${layout.theme.borderColor}`,
                  backgroundImage: `url(${currentBackground?.image || '/editor-skin/home_bg.jpg'})`,
                }}
              >
                {/* Background image */}
                <div className="play-event-background bg-cover bg-center relative">
                  <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${layout.theme.backgroundColor}, transparent 50%)` }} />
                </div>

                {/* Dialogue box */}
                <div
                  className={`play-dialogue-box play-vn-dialogue p-4`}
                  style={{
                    backgroundColor: layout.eventPanel.dialogueBoxStyle === 'minimal' ? 'transparent' : layout.eventPanel.backgroundColor,
                    border: layout.eventPanel.dialogueBoxStyle === 'classic' ? `2px solid ${layout.theme.primaryColor}` : 'none',
                  }}
                >
                  {/* Character portrait and name */}
                  {currentSpeaker && layout.eventPanel.showCharacterPortrait && (
                    <div className="play-speaker-row flex items-center gap-3 mb-3">
                      {currentSpeakerImage ? (
                        <img
                          src={currentSpeakerImage}
                          alt={currentSpeaker.name}
                          className="rounded-full object-cover"
                          style={{
                            width: layout.eventPanel.portraitSize,
                            height: layout.eventPanel.portraitSize,
                            border: `2px solid ${layout.theme.primaryColor}`,
                          }}
                        />
                      ) : (
                        <div
                          className="rounded-full flex items-center justify-center text-xl"
                          style={{
                            width: layout.eventPanel.portraitSize,
                            height: layout.eventPanel.portraitSize,
                            backgroundColor: layout.theme.borderColor,
                            border: `2px solid ${layout.theme.primaryColor}`,
                          }}
                        >
                          {currentSpeaker.name[0]}
                        </div>
                      )}
                      <span className="play-speaker-name font-bold" style={{ color: layout.theme.primaryColor }}>{currentSpeaker.name}</span>
                    </div>
                  )}

                  {/* Dialogue text */}
                  <div className="play-dialogue-text leading-relaxed" style={{ color: layout.theme.textColor }}>
                    {currentEventText}
                  </div>
                </div>
              </div>
            )}

            {/* Result display - prominent result text with Continue button */}
            {resultDisplay && !currentEvent && (
              <div
                className="play-result-panel rounded-lg overflow-hidden mt-4"
                style={{
                  border: `2px solid ${resultDisplay.type === 'success' ? layout.theme.successColor : layout.theme.dangerColor}`,
                }}
              >
                <div
                  className="play-result-content p-5"
                  style={{
                    backgroundColor: resultDisplay.type === 'success'
                      ? `${layout.theme.successColor}22`
                      : `${layout.theme.dangerColor}22`,
                  }}
                >
                  <div
                    className="text-base font-medium leading-relaxed mb-2"
                    style={{
                      color: resultDisplay.type === 'success' ? layout.theme.successColor : layout.theme.dangerColor,
                    }}
                  >
                    {resultDisplay.type === 'success'
                      ? t('Result Preview (Success)', '결과 미리보기 (성공)')
                      : t('Result Preview (Failure)', '결과 미리보기 (실패)')}
                  </div>
                  <div
                    className="text-lg leading-relaxed mb-4"
                    style={{ color: layout.theme.textColor }}
                  >
                    {resultDisplay.text}
                  </div>
                  {resultDisplay.pending && (
                    <div className="text-xs mb-1" style={{ color: `${layout.theme.textColor}99` }}>
                      {t(
                        'This result is draft and will be applied at Next Day.',
                        '이 결과는 임시 상태이며 다음 날 버튼에서 최종 반영됩니다.'
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Status phase */}
            {phase === 'status' && !currentEvent && !resultDisplay && (
              <div className="space-y-3 mt-6">
                <div className="play-result-panel rounded-lg overflow-hidden">
                  <div className="play-result-content p-5">
                    <div className="text-lg font-semibold mb-2">{t('Status Briefing', '상태 브리핑')}</div>
                    <div className="text-sm opacity-85">
                      {t('Review family condition first, then move to daily actions.', '가족 상태를 먼저 확인한 다음, 일일 행동 단계로 진행하세요.')}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Daily action phase */}
            {phase === 'action' && !currentEvent && !resultDisplay && (
              <div className="space-y-3 mt-6">
                <div className="play-result-panel rounded-lg overflow-hidden">
                  <div className="play-result-content p-5">
                    <div className="text-lg font-semibold mb-2">{t('Daily Actions (Food / Water)', '일일 행동 (식량 / 물)')}</div>
                    <div className="text-sm opacity-85">
                      {t('Set ration first, then proceed to event choices.', '배급을 먼저 정한 뒤 이벤트 선택지 단계로 진행하세요.')}
                    </div>
                  </div>
                </div>

                <div className="play-result-panel rounded-lg overflow-hidden">
                  <div className="play-result-content p-4 space-y-2">
                    <div className="text-sm font-semibold">{t('Ration Planner', '배급 플래너')}</div>
                    {displayCharacters.filter((c) => c.alive).map((char) => {
                      const plan = rationPlan[char.id] || { feed: false, water: false };
                      return (
                        <div key={char.id} className="play-ration-row flex items-center justify-between p-2 rounded" style={{ backgroundColor: `${layout.theme.backgroundColor}88` }}>
                          <div className="text-sm">
                            {char.name}
                            {char.isPlayer && <span className="ml-2 text-xs" style={{ color: '#93c5fd' }}>{t('(YOU)', '(주체)')}</span>}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => toggleRation(char.id, 'feed')}
                              className="play-btn play-ration-toggle px-3 py-1 rounded text-xs"
                              style={{
                                backgroundColor: plan.feed ? `${layout.theme.successColor}66` : `${layout.theme.borderColor}88`,
                                color: layout.theme.textColor,
                              }}
                            >
                              {t('Food', '식량')}
                            </button>
                            <button
                              onClick={() => toggleRation(char.id, 'water')}
                              className="play-btn play-ration-toggle px-3 py-1 rounded text-xs"
                              style={{
                                backgroundColor: plan.water ? '#3b82f666' : `${layout.theme.borderColor}88`,
                                color: layout.theme.textColor,
                              }}
                            >
                              {t('Water', '물')}
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    <div className="text-xs" style={{ color: `${layout.theme.textColor}bb` }}>
                      {t('Planned Use', '예정 사용')}:
                      {' '}
                      {t('Food', '식량')} {plannedFoodUse}/{food},
                      {' '}
                      {t('Water', '물')} {plannedWaterUse}/{water}
                    </div>
                    <div className="text-xs" style={{ color: `${layout.theme.textColor}99` }}>
                      {t(
                        'These actions are draft only. They are applied when Next Day is pressed.',
                        '이 배급은 임시 저장입니다. 다음 날 버튼을 눌렀을 때 반영됩니다.'
                      )}
                    </div>
                  </div>
                </div>

                {/* Active expeditions summary */}
                {expeditions.length > 0 && (
                  <div className="text-xs text-center" style={{ color: `${layout.theme.textColor}66` }}>
                    {expeditions.map(exp => (
                      <span key={exp.id} className="mr-3">
                        {exp.characterName} D-{exp.daysRemaining}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Night phase */}
            {phase === 'night' && (
              <div className="text-center mt-6">
                <div className="mb-3 text-sm" style={{ color: `${layout.theme.textColor}bb` }}>
                  {t(
                    'Press Next Day to finalize today status/action/event decisions.',
                    '다음 날 버튼을 눌러 오늘의 상태/배급/이벤트 결정을 최종 확정하세요.'
                  )}
                </div>
                <div className="mb-3 text-xs" style={{ color: `${layout.theme.textColor}99` }}>
                  {t('Pending Event Decisions', '이벤트 임시결정')}: {pendingDayEffects.length}
                  {' | '}
                  {t('Ration Plan', '배급 계획')}: {plannedFoodUse}/{food} {t('Food', '식량')}, {plannedWaterUse}/{water} {t('Water', '물')}
                </div>
                {pendingDayEffects.length > 0 && (
                  <div className="mb-3 space-y-2 text-left">
                    {pendingDayEffects.map((entry, idx) => (
                      <div
                        key={entry.decisionKey || `decision-${idx}`}
                        className="flex items-center justify-between gap-2 p-2 rounded"
                        style={{ backgroundColor: `${layout.theme.backgroundColor}88`, color: layout.theme.textColor }}
                      >
                        <span className="text-xs">
                          {(entry.text || t('Draft decision', '임시 결정')).slice(0, 64)}
                        </span>
                        <button
                          onClick={() => handleReviewDecision(entry.decisionKey)}
                          className="play-btn play-btn-secondary px-2 py-1 rounded text-xs"
                          style={{ backgroundColor: `${layout.theme.borderColor}cc`, color: layout.theme.textColor }}
                        >
                          {t('Change', '수정')}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
        </div>

        {/* Bottom fixed controls */}
        <div
          className="play-control-dock px-4 py-3"
          style={{
            backgroundColor: `${layout.theme.panelColor}f2`,
            borderTop: `1px solid ${layout.theme.borderColor}`,
          }}
        >
          <div className="play-phase-track flex flex-wrap items-center justify-center gap-2 mb-2">
            {[
              t('1. Status', '1. 상태 보기'),
              t('2. Daily Actions', '2. 일일 행동'),
              t('3. Event / Choices', '3. 이벤트 / 선택지'),
            ].map((label, idx) => {
              const step = idx + 1;
              const active = phaseStep === step;
              const done = phaseStep > step;
              return (
                <span
                  key={label}
                  className="play-phase-chip px-3 py-1 rounded-full text-xs font-semibold"
                  style={{
                    border: `1px solid ${active || done ? layout.theme.primaryColor : `${layout.theme.borderColor}aa`}`,
                    color: active || done ? layout.theme.primaryColor : `${layout.theme.textColor}99`,
                    backgroundColor: active ? `${layout.theme.primaryColor}22` : done ? `${layout.theme.primaryColor}16` : `${layout.theme.backgroundColor}88`,
                  }}
                >
                  {label}
                </span>
              );
            })}
          </div>

          <div className="text-xs mb-2 text-center" style={{ color: `${layout.theme.textColor}bb` }}>
            {phase === 'status' && t('Check current status, then go to ration planning.', '현재 상태를 확인한 뒤 배급 단계로 이동하세요.')}
            {phase === 'action' && t('Choose ration now. This is still editable until Next Day.', '지금 배급을 선택하세요. 다음 날 확정 전까지 수정할 수 있습니다.')}
            {phase === 'event' && t('Choose from the popup choices. Decisions are saved as draft until Next Day.', '팝업 선택지에서 고르세요. 선택은 다음 날 버튼까지 임시 저장됩니다.')}
            {phase === 'night' && t('Review today decisions, then finalize with Next Day.', '오늘 결정을 검토한 뒤 다음 날로 확정하세요.')}
          </div>

          <div className="play-dock-actions flex flex-wrap justify-center gap-2">
            {phase === 'status' && !currentEvent && !resultDisplay && (
              <button
                onClick={handleProceedToActions}
                className="play-btn play-btn-primary px-6 py-2 rounded font-bold transition-colors"
                style={{ backgroundColor: layout.theme.primaryColor, color: layout.theme.backgroundColor }}
              >
                {t('Next: Daily Actions', '다음: 일일 행동')}
              </button>
            )}

            {phase === 'action' && !currentEvent && !resultDisplay && (
              <>
                <button
                  onClick={handleBackToStatus}
                  className="play-btn play-btn-secondary px-5 py-2 rounded font-bold transition-colors"
                  style={{ backgroundColor: `${layout.theme.borderColor}bb`, color: layout.theme.textColor }}
                >
                  {t('Prev: Status', '이전: 상태')}
                </button>
                <button
                  onClick={handleStartEventPhase}
                  className="play-btn play-btn-primary px-6 py-2 rounded font-bold transition-colors"
                  style={{ backgroundColor: layout.theme.primaryColor, color: layout.theme.backgroundColor }}
                >
                  {t('Next: Event Choices', '다음: 이벤트 선택지')}
                </button>
              </>
            )}

            {needsContinueButton && (
              <button
                onClick={handleEventContinue}
                className="play-btn play-btn-primary px-6 py-2 rounded font-bold transition-colors"
                style={{ backgroundColor: layout.theme.primaryColor, color: layout.theme.backgroundColor }}
              >
                {t('Continue', '계속')}
              </button>
            )}

            {resultDisplay && !currentEvent && (
              <>
                {resultDisplay.sourceNodeId && (
                  <button
                    onClick={handleRechoose}
                    className="play-btn play-btn-secondary px-4 py-2 rounded font-bold transition-colors"
                    style={{ backgroundColor: `${layout.theme.borderColor}bb`, color: layout.theme.textColor }}
                  >
                    {t('Change Choice', '선택 다시 하기')}
                  </button>
                )}
                <button
                  onClick={handleResultContinue}
                  className="play-btn play-btn-primary px-6 py-2 rounded font-bold transition-colors"
                  style={{ backgroundColor: layout.theme.primaryColor, color: layout.theme.backgroundColor }}
                >
                  {t('Continue', '계속')}
                </button>
              </>
            )}

            {phase === 'event' && !choices && !needsContinueButton && !resultDisplay && (
              <button
                onClick={handleBackToActions}
                className="play-btn play-btn-secondary px-4 py-2 rounded font-bold transition-colors"
                style={{ backgroundColor: `${layout.theme.borderColor}bb`, color: layout.theme.textColor }}
              >
                {t('Back to Daily Actions', '일일 행동으로 돌아가기')}
              </button>
            )}

            {phase === 'night' && (
              <>
                <button
                  onClick={handleBackToActions}
                  className="play-btn play-btn-secondary px-4 py-2 rounded font-bold transition-colors"
                  style={{ backgroundColor: `${layout.theme.borderColor}bb`, color: layout.theme.textColor }}
                >
                  {t('Prev: Daily Actions', '이전: 일일 행동')}
                </button>
                <button
                  onClick={handleNextDay}
                  className="play-btn play-btn-primary px-6 py-3 rounded font-bold transition-colors"
                  style={{ backgroundColor: layout.theme.primaryColor, color: layout.theme.backgroundColor }}
                >
                  {t('Next Day', '다음 날')}
                </button>
              </>
            )}
          </div>
        </div>
        </div>
          </section>

          {/* Right: Inventory */}
          <aside
        className="play-hud-panel play-side-panel play-side-panel-right p-4"
        style={{
          width: layout.inventoryPanel.position !== 'hidden' ? rightPanelWidth : 0,
          display: layout.inventoryPanel.position === 'hidden' ? 'none' : 'block',
          backgroundColor: layout.inventoryPanel.backgroundColor || layout.theme.panelColor,
          borderLeft: `1px solid ${layout.theme.borderColor}`,
          backgroundImage: layout.inventoryPanel.backgroundImage ? `url(${layout.inventoryPanel.backgroundImage})` : undefined,
          order: layout.inventoryPanel.position === 'left' ? 1 : 3,
        }}
      >
        {layout.inventoryPanel.showResourceCounts && (
          <>
            <h3 className="play-section-title font-bold mb-4" style={{ color: layout.theme.primaryColor }}>{t('Resources', '자원')}</h3>
            <div className="space-y-2 mb-6">
              <div className="play-resource-row flex items-center justify-between p-2 rounded" style={{ backgroundColor: `${layout.theme.backgroundColor}99`, color: layout.theme.textColor }}>
                <span>{t('Food', '식량')}</span>
                <span className="font-bold" style={{ color: layout.theme.primaryColor }}>{food}</span>
              </div>
              <div className="play-resource-row flex items-center justify-between p-2 rounded" style={{ backgroundColor: `${layout.theme.backgroundColor}99`, color: layout.theme.textColor }}>
                <span>{t('Water', '물')}</span>
                <span className="font-bold" style={{ color: '#3498db' }}>{water}</span>
              </div>
            </div>
          </>
        )}

        <h3 className="play-section-title font-bold mb-2" style={{ color: layout.theme.primaryColor }}>{t('Inventory', '인벤토리')}</h3>
        <div className="space-y-1">
          {inventory.map((inv) => {
            const item = assets?.items?.find((i) => i.id === inv.itemId);
            const hasEffects = item?.effects && Object.keys(item.effects).some((k) => item.effects[k]);
            return (
              <div
                key={inv.itemId}
                className={`play-inventory-item flex items-center gap-2 p-2 rounded text-sm ${hasEffects ? 'cursor-pointer' : ''}`}
                style={{
                  backgroundColor: `${layout.theme.backgroundColor}99`,
                  color: layout.theme.textColor,
                  border: `1px solid transparent`,
                }}
                onClick={() => hasEffects && setSelectedItem(item)}
                onMouseEnter={(e) => hasEffects && (e.currentTarget.style.borderColor = layout.theme.primaryColor)}
                onMouseLeave={(e) => hasEffects && (e.currentTarget.style.borderColor = 'transparent')}
                title={hasEffects ? t('Click to use', '클릭하여 사용') : ''}
              >
                {item?.icon && <img src={item.icon} alt="" className="w-6 h-6" />}
                <span className="flex-1">{item?.name || inv.itemId}</span>
                <span style={{ color: `${layout.theme.textColor}66` }}>x{inv.count}</span>
              </div>
            );
          })}
          {inventory.length === 0 && (
            <p className="text-sm" style={{ color: `${layout.theme.textColor}66` }}>{t('Empty', '비어 있음')}</p>
          )}
        </div>

        <div className="play-hud-actions mt-4 space-y-2">
          <button
            onClick={() => setShowFeedModal(true)}
            className="play-btn play-btn-secondary w-full px-3 py-2 rounded text-sm text-center"
            style={{ backgroundColor: '#3a4258', color: layout.theme.textColor }}
          >
            {t('Care & Item Use', '캐릭터 케어')}
          </button>
          <button
            onClick={() => setShowUtilityModal(true)}
            className="play-btn play-btn-secondary w-full px-3 py-2 rounded text-sm text-center"
            style={{ backgroundColor: '#2f3b52', color: layout.theme.textColor }}
          >
            {t('System Menu', '시스템 메뉴')}
          </button>
        </div>
          </aside>

        </div>

      {phase === 'event' && choices && !resultDisplay && (
        <div className="play-choice-overlay">
          <div className="play-choice-popup">
            <div className="play-choice-popup-title">
              {t('Choose Your Action', '행동을 선택하세요')}
            </div>
            <div className="text-xs mt-1 mb-3" style={{ color: `${layout.theme.textColor}bb` }}>
              {t('Choices remain editable until Next Day is finalized.', '선택지는 다음 날 확정 전까지 변경할 수 있습니다.')}
            </div>
            <div className="space-y-2">
              {choices.map((choice, idx) => {
                const hasRequired = !choice.requiredItem || inventory.some((i) => i.itemId === choice.requiredItem && i.count > 0);
                const choiceText = t(choice.text || choice.textKo || '', choice.textKo || choice.text || '');
                const requiredItem = choice.requiredItem
                  ? assets?.items?.find((i) => i.id === choice.requiredItem)
                  : null;

                return (
                  <button
                    key={choice.id || `choice-${idx}`}
                    onClick={() => handleChoice(idx)}
                    disabled={!hasRequired}
                    className="play-choice-btn w-full p-3 text-center transition-colors"
                    style={{
                      backgroundColor: hasRequired ? layout.choiceButtons.backgroundColor : layout.theme.panelColor,
                      color: hasRequired ? layout.choiceButtons.textColor || layout.theme.textColor : `${layout.theme.textColor}66`,
                      border: `1px solid ${hasRequired ? layout.choiceButtons.borderColor : layout.theme.borderColor}`,
                      borderRadius: layout.choiceButtons.borderRadius,
                      cursor: hasRequired ? 'pointer' : 'not-allowed',
                      opacity: hasRequired ? 1 : 0.6,
                      '--choice-hover': layout.choiceButtons.hoverColor,
                    }}
                  >
                    {choiceText}
                    {requiredItem && (
                      <span className="ml-2 text-xs" style={{ color: hasRequired ? '#3498db' : layout.theme.dangerColor }}>
                        [{requiredItem.name} {t('required', '필요')}]
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex justify-center">
              <button
                onClick={handleBackToActions}
                className="play-btn play-btn-secondary px-3 py-1.5 rounded text-xs"
                style={{ backgroundColor: `${layout.theme.borderColor}bb`, color: layout.theme.textColor }}
              >
                {t('Back to Daily Actions', '일일 행동으로 돌아가기')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feed Modal */}
      {showFeedModal && (
        <div className="play-modal-backdrop fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowFeedModal(false)}>
          <div className="play-modal bg-[#2a2a2a] p-6 rounded-lg max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="play-modal-title text-xl font-bold text-[#f4d03f] mb-4">{t('Care for Family', '가족 케어')}</h2>
            <p className="text-sm text-gray-400 mb-4">{food} | {water}</p>
            <div className="space-y-3">
              {characters.filter((c) => c.alive).map((char) => {
                const medicalItems = inventory.filter((inv) => {
                  const item = assets?.items?.find((i) => i.id === inv.itemId);
                  return item?.category === 'medical' && inv.count > 0;
                });
                const sanityItems = inventory.filter((inv) => {
                  const item = assets?.items?.find((i) => i.id === inv.itemId);
                  return (item?.category === 'misc' || item?.category === 'tool') && inv.count > 0;
                });

                return (
                  <div key={char.id} className="p-3 bg-[#333] rounded">
                    <div className="font-medium mb-1">{char.name}</div>
                    <div className="text-xs text-gray-400 mb-2">
                      {(gameData?.customStats || [])
                        .filter((s) => s.enabled)
                        .map((statDef) => {
                          const value = char.stats?.[statDef.id] ?? statDef.defaultValue;
                          const displayName = t(statDef.name || statDef.nameKo || statDef.id, statDef.nameKo || statDef.name || statDef.id);
                          return `${displayName}: ${Math.round(value)}`;
                        })
                        .join(' | ')}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          if (feedCharacter(char.id)) addLog(`${char.name} ${t('was fed.', '식량을 배급받았습니다.')}`, 'info');
                        }}
                        disabled={food <= 0}
                        className="px-2 py-1 bg-[#4a3a2a] hover:bg-[#5a4a3a] rounded text-sm disabled:opacity-50"
                      >
                        {t('Feed', '식량 배급')}
                      </button>
                      <button
                        onClick={() => {
                          if (waterCharacter(char.id)) addLog(`${char.name} ${t('was given water.', '물을 배급받았습니다.')}`, 'info');
                        }}
                        disabled={water <= 0}
                        className="px-2 py-1 bg-[#2a3a4a] hover:bg-[#3a4a5a] rounded text-sm disabled:opacity-50"
                      >
                        {t('Water', '물')}
                      </button>
                      {(char.state === 'sick' || char.state === 'injured') && medicalItems.length > 0 && (
                        <button
                          onClick={() => {
                            const medItem = medicalItems[0];
                            const result = healCharacter(char.id, medItem.itemId);
                            if (result.success) {
                              const itemName = assets?.items?.find((i) => i.id === medItem.itemId)?.name || 'medicine';
                              addLog(`${char.name} ${t('was healed with', '치료되었습니다:')} ${itemName}`, 'success');
                            }
                          }}
                          className="px-2 py-1 bg-[#4a2a4a] hover:bg-[#5a3a5a] rounded text-sm"
                        >
                          {t('Heal', '치료')}
                        </button>
                      )}
                      {(char.stats?.sanity ?? 100) < 50 && sanityItems.length > 0 && (
                        <button
                          onClick={() => {
                            const sanityItem = sanityItems[0];
                            removeItem(sanityItem.itemId, 1);
                            boostSanity(char.id, 25);
                            const itemName = assets?.items?.find((i) => i.id === sanityItem.itemId)?.name || 'item';
                            addLog(`${char.name} ${t('feels better after using', '사용 후 상태가 호전되었습니다:')} ${itemName}`, 'success');
                          }}
                          className="px-2 py-1 bg-[#2a4a4a] hover:bg-[#3a5a5a] rounded text-sm"
                        >
                          {t('Comfort', '안정')}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => setShowFeedModal(false)}
              className="play-btn play-btn-secondary mt-4 w-full py-2 bg-[#444] hover:bg-[#555] rounded"
            >
              {t('Close', '닫기')}
            </button>
          </div>
        </div>
      )}

      {/* Item Use Modal */}
      {selectedItem && (
        <div className="play-modal-backdrop fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setSelectedItem(null)}>
          <div className="play-modal bg-[#2a2a2a] p-6 rounded-lg max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              {selectedItem.icon && <img src={selectedItem.icon} alt="" className="w-12 h-12 rounded" />}
              <div>
                <h2 className="play-modal-title text-xl font-bold text-[#f4d03f]">{selectedItem.name}</h2>
                <p className="text-xs text-gray-400">
                  {selectedItem.effects?.food && `+${selectedItem.effects.food} ${t('Food', '식량')} `}
                  {selectedItem.effects?.water && `+${selectedItem.effects.water} ${t('Water', '물')} `}
                  {selectedItem.effects?.hunger && `-${selectedItem.effects.hunger} ${t('Hunger', '허기')} `}
                  {selectedItem.effects?.thirst && `-${selectedItem.effects.thirst} ${t('Thirst', '갈증')} `}
                  {selectedItem.effects?.sanity && `+${selectedItem.effects.sanity} ${t('Sanity', '정신력')} `}
                  {selectedItem.effects?.heal && t('Heals', '치료 효과')}
                </p>
              </div>
            </div>

            {(selectedItem.effects?.hunger || selectedItem.effects?.thirst || selectedItem.effects?.sanity || selectedItem.effects?.heal) ? (
              <>
                <p className="text-sm text-gray-400 mb-3">{t('Select a character to use on:', '대상 캐릭터를 선택하세요:')}</p>
                <div className="space-y-2">
                  {characters.filter((c) => c.alive).map((char) => (
                    <button
                      key={char.id}
                      onClick={() => {
                        const result = consumeItemAction(selectedItem.id, char.id);
                        if (result.success) addLog(`${char.name}: ${result.message}`, 'success');
                        setSelectedItem(null);
                      }}
                      className="w-full p-3 bg-[#333] hover:bg-[#444] rounded flex items-center gap-3 text-left"
                    >
                      {getCharacterImage(char) ? (
                        <img src={getCharacterImage(char)} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#555] flex items-center justify-center">{char.name[0]}</div>
                      )}
                      <div>
                        <div className="font-medium">{char.name}</div>
                        <div className="text-xs text-gray-400">
                          {(gameData?.customStats || [])
                            .filter((s) => s.enabled)
                            .slice(0, 3)
                            .map((statDef) => {
                              const value = char.stats?.[statDef.id] ?? statDef.defaultValue;
                              return `${statDef.icon}${Math.round(value)}`;
                            })
                            .join(' ')}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <button
                onClick={() => {
                  const result = consumeItemAction(selectedItem.id);
                  if (result.success) addLog(result.message, 'success');
                  setSelectedItem(null);
                }}
                className="play-btn play-btn-primary w-full py-2 bg-[#2ecc71] hover:bg-[#27ae60] rounded font-medium"
              >
                {t('Use Item', '아이템 사용')}
              </button>
            )}

            <button
              onClick={() => setSelectedItem(null)}
              className="play-btn play-btn-secondary mt-3 w-full py-2 bg-[#444] hover:bg-[#555] rounded"
            >
              {t('Cancel', '취소')}
            </button>
          </div>
        </div>
      )}

      {/* Utility Modal (optional systems) */}
      {showUtilityModal && (
        <div className="play-modal-backdrop fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowUtilityModal(false)}>
          <div className="play-modal bg-[#2a2a2a] p-6 rounded-lg max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="play-modal-title text-xl font-bold text-[#f4d03f] mb-2">{t('Optional Systems', '보조 시스템')}</h2>
            <p className="text-sm text-gray-300 mb-4">
              {t(
                'These are outside the main daily flow. Use them only when needed.',
                '메인 일일 진행과 분리된 기능입니다. 필요할 때만 열어 사용하세요.'
              )}
            </p>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setShowUtilityModal(false);
                  setShowExpeditionModal(true);
                }}
                disabled={characters.filter((c) => c.alive && !c.onExpedition).length === 0}
                className="play-btn play-btn-secondary w-full px-4 py-3 rounded text-center disabled:opacity-50"
                style={{ backgroundColor: '#2a4a2a', color: layout.theme.textColor }}
              >
                <div className="font-semibold">{t('Expedition', '탐험')}</div>
                <div className="text-xs opacity-80">{t('Send characters for extra supplies.', '캐릭터를 보내 추가 자원을 탐색합니다.')}</div>
              </button>
              <button
                onClick={() => {
                  setShowUtilityModal(false);
                  setShowCraftModal(true);
                }}
                disabled={inventory.length === 0}
                className="play-btn play-btn-secondary w-full px-4 py-3 rounded text-center disabled:opacity-50"
                style={{ backgroundColor: '#4a3a2a', color: layout.theme.textColor }}
              >
                <div className="font-semibold">{t('Craft', '제작')}</div>
                <div className="text-xs opacity-80">{t('Combine items into useful tools.', '재료를 조합해 유용한 도구를 만듭니다.')}</div>
              </button>
            </div>
            <button
              onClick={() => setShowUtilityModal(false)}
              className="play-btn play-btn-secondary mt-4 w-full py-2 bg-[#444] hover:bg-[#555] rounded"
            >
              {t('Close', '닫기')}
            </button>
          </div>
        </div>
      )}

      {/* Expedition Modal */}
      {showExpeditionModal && (
        <div className="play-modal-backdrop fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowExpeditionModal(false)}>
          <div className="play-modal bg-[#2a2a2a] p-6 rounded-lg max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="play-modal-title text-xl font-bold text-[#f4d03f] mb-2">[EXP] {t('Send Expedition', '탐험 보내기')}</h2>

            {environment.weather === 'dust' && (
              <div className="p-2 rounded mb-3 text-sm" style={{ backgroundColor: '#4a2a2a', color: '#e74c3c' }}>
                [WARN] {t('Dust storm! Expeditions blocked.', '먼지폭풍으로 탐험이 불가합니다.')}
              </div>
            )}
            {environment.weather === 'storm' && (
              <div className="p-2 rounded mb-3 text-sm" style={{ backgroundColor: '#4a3a2a', color: '#f39c12' }}>
                [WARN] {t('Storm reduces success rate by 20%', '폭풍으로 성공 확률이 20% 감소합니다.')}
              </div>
            )}

            <p className="text-sm text-gray-400 mb-3">{t('Select character and expedition type:', '캐릭터와 탐험 유형을 선택하세요:')}</p>
            <div className="space-y-3">
              {characters.filter((c) => c.alive && !c.onExpedition).map((char) => (
                <div key={char.id} className="p-3 bg-[#333] rounded">
                  <div className="font-medium mb-2 flex items-center gap-2">
                    {char.name}
                    {(char.skills || []).map((s) => (
                      <span key={s.id} className="text-xs px-1 rounded" style={{ backgroundColor: '#4a3a2a', color: '#f4d03f' }}>
                        {s.icon} {t(s.name || s.nameKo || '', s.nameKo || s.name || '')}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(EXPEDITION_CONFIG).map(([type, config]) => (
                      <button
                        key={type}
                        onClick={() => {
                          const result = sendExpedition(char.id, type);
                          if (result.success) {
                            addLog(`${char.name} ${t('departed on', '출발')} ${t(config.labelEn || config.label || '', config.label || config.labelEn || '')}!`, 'info');
                            setShowExpeditionModal(false);
                          } else {
                            addLog(result.message, 'danger');
                          }
                        }}
                        disabled={environment.weather === 'dust'}
                        className="px-3 py-2 rounded text-sm disabled:opacity-30 transition-colors"
                        style={{ backgroundColor: '#2a4a2a', color: '#fff', border: '1px solid #4a6a4a' }}
                      >
                        <div className="font-medium">{t(config.labelEn || config.label || '', config.label || config.labelEn || '')}</div>
                        <div className="text-xs text-gray-400">
                          {config.days}{t('d', '일')} | {Math.round(config.baseSuccess * 100)}% | Food {config.food[0]}-{config.food[1]}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {characters.filter((c) => c.alive && !c.onExpedition).length === 0 && (
                <p className="text-sm text-gray-400">{t('No available characters', '가능한 캐릭터가 없습니다')}</p>
              )}
            </div>

            {expeditions.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-bold text-gray-400 mb-2">{t('Active Expeditions', '진행 중 탐험')}</h3>
                {expeditions.map((exp) => (
                  <div key={exp.id} className="flex items-center justify-between p-2 bg-[#333] rounded mb-1">
                    <span className="text-sm">{exp.characterName} - {t(EXPEDITION_CONFIG[exp.type]?.labelEn || '', EXPEDITION_CONFIG[exp.type]?.label || '')}</span>
                    <span className="text-xs text-gray-400">D-{exp.daysRemaining}</span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowExpeditionModal(false)}
              className="play-btn play-btn-secondary mt-4 w-full py-2 bg-[#444] hover:bg-[#555] rounded"
            >
              {t('Close', '닫기')}
            </button>
          </div>
        </div>
      )}

      {/* Craft Modal */}
      {showCraftModal && (
        <div className="play-modal-backdrop fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowCraftModal(false)}>
          <div className="play-modal bg-[#2a2a2a] p-6 rounded-lg max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="play-modal-title text-xl font-bold text-[#f4d03f] mb-2">[CRAFT] {t('Crafting', '제작')}</h2>

            {hasSkill('repair') && (
              <div className="p-2 rounded mb-3 text-sm" style={{ backgroundColor: '#2a3a4a', color: '#3498db' }}>
                {t('Repair skill bonus: +', '수리 스킬 보너스: +')}{Math.round(getSkillBonus('repair') * 100)}%
              </div>
            )}

            <div className="space-y-3">
              {getAvailableRecipes().map((recipe) => {
                const ingredientNames = recipe.ingredients.map((ing) => {
                  const item = assets?.items?.find((i) => i.id === ing.itemId);
                  const hasEnough = inventory.some((inv) => inv.itemId === ing.itemId && inv.count >= ing.count);
                  return { name: item?.name || ing.itemId, count: ing.count, has: hasEnough };
                });

                return (
                  <div
                    key={recipe.id}
                    className="p-3 rounded"
                    style={{
                      backgroundColor: recipe.canCraft ? '#2a3a2a' : '#333',
                      border: `1px solid ${recipe.canCraft ? '#4a6a4a' : '#444'}`,
                      opacity: recipe.canCraft ? 1 : 0.6,
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium" style={{ color: recipe.canCraft ? '#4ade80' : '#888' }}>
                        {t(recipe.name || recipe.nameKo || '', recipe.nameKo || recipe.name || '')}
                      </span>
                      <span className="text-xs" style={{ color: '#888' }}>
                        {t('Success', '성공률')}: {Math.round((recipe.successChance + (hasSkill('repair') ? getSkillBonus('repair') : 0)) * 100)}%
                      </span>
                    </div>
                    <div className="text-xs mb-2" style={{ color: '#888' }}>
                      {ingredientNames.map((ing, idx) => (
                        <span key={idx} style={{ color: ing.has ? '#4ade80' : '#e74c3c' }}>
                          {ing.name} x{ing.count}{idx < ingredientNames.length - 1 ? ' + ' : ''}
                        </span>
                      ))}
                      <span> -&gt; {t(recipe.name || recipe.nameKo || '', recipe.nameKo || recipe.name || '')}</span>
                    </div>
                    <div className="text-xs mb-2" style={{ color: '#666' }}>
                      {t(recipe.description || recipe.descriptionKo || '', recipe.descriptionKo || recipe.description || '')}
                    </div>
                    <button
                      onClick={() => {
                        const result = craftItem(recipe.id);
                        addLog(`[CRAFT] ${result.message}`, result.success ? 'success' : 'danger');
                      }}
                      disabled={!recipe.canCraft}
                      className="px-3 py-1 rounded text-sm disabled:opacity-50"
                      style={{ backgroundColor: recipe.canCraft ? '#4a6a4a' : '#444', color: '#fff' }}
                    >
                      {t('Craft', '제작')}
                    </button>
                  </div>
                );
              })}
              {getAvailableRecipes().length === 0 && (
                <p className="text-sm text-gray-400">{t('No recipes available', '제작식이 없습니다')}</p>
              )}
            </div>

            <button
              onClick={() => setShowCraftModal(false)}
              className="play-btn play-btn-secondary mt-4 w-full py-2 bg-[#444] hover:bg-[#555] rounded"
            >
              {t('Close', '닫기')}
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}





