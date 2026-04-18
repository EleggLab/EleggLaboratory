import { useEffect, useEffectEvent, useRef, useState } from 'react';
import {
  applyUpgradeChoice,
  buildBattleOutcome,
  createBattleSnapshot,
  hydrateBattleState,
  stepBattle,
} from '../game/engine';
import type { BattleOutcome, BattleState, PersistentSave } from '../game/types';
import { MagicSoundController } from '../utils/sound';

type UseBattleLoopArgs = {
  active: boolean;
  initialState: BattleState | null;
  onBattleStateSnapshot: (state: BattleState) => void;
  onComplete: (outcome: BattleOutcome, finalState: BattleState) => void;
  save: PersistentSave | null;
  soundController: MagicSoundController;
};

export function useBattleLoop({
  active,
  initialState,
  onBattleStateSnapshot,
  onComplete,
  save,
  soundController,
}: UseBattleLoopArgs) {
  const [battleState, setBattleState] = useState<BattleState | null>(initialState);
  const battleStateRef = useRef<BattleState | null>(initialState);
  const completionGuardRef = useRef(false);
  const saveRef = useRef<PersistentSave | null>(save);

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  const handleSnapshot = useEffectEvent((state: BattleState) => {
    onBattleStateSnapshot(createBattleSnapshot(state));
  });

  const handleComplete = useEffectEvent((state: BattleState) => {
    const currentSave = saveRef.current;
    if (!currentSave || completionGuardRef.current) {
      return;
    }

    completionGuardRef.current = true;
    onComplete(buildBattleOutcome(state, currentSave), createBattleSnapshot(state));
  });

  useEffect(() => {
    if (!initialState) {
      return;
    }

    completionGuardRef.current = false;
    const hydrated = hydrateBattleState(initialState);
    battleStateRef.current = hydrated;
    setBattleState(hydrated);
  }, [initialState]);

  useEffect(() => {
    if (!active || !battleStateRef.current || !saveRef.current) {
      return;
    }

    let frameId = 0;
    let previousTime = performance.now();

    const loop = (now: number) => {
      const current = battleStateRef.current;
      if (!current) {
        return;
      }

      const delta = Math.min(48, now - previousTime);
      previousTime = now;

      if (document.visibilityState === 'hidden') {
        frameId = window.requestAnimationFrame(loop);
        return;
      }

      if (current.status === 'victory' || current.status === 'defeat') {
        handleComplete(current);
        return;
      }

      if (current.status === 'level-up') {
        frameId = window.requestAnimationFrame(loop);
        return;
      }

      const currentSave = saveRef.current;
      if (!currentSave) {
        frameId = window.requestAnimationFrame(loop);
        return;
      }

      const next = stepBattle(current, currentSave, delta);
      battleStateRef.current = next;
      setBattleState(next);

      if (next.lastStepEvents.length > 0) {
        soundController.emit(next.lastStepEvents);
      }

      if (next.status === 'victory' || next.status === 'defeat') {
        handleComplete(next);
        return;
      }

      frameId = window.requestAnimationFrame(loop);
    };

    frameId = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(frameId);
  }, [active, handleComplete, soundController]);

  useEffect(() => {
    if (!active) {
      return;
    }

    const intervalId = window.setInterval(() => {
      const current = battleStateRef.current;
      if (!current || current.status === 'victory' || current.status === 'defeat') {
        return;
      }

      handleSnapshot(current);
    }, 1200);

    return () => window.clearInterval(intervalId);
  }, [active, handleSnapshot]);

  const chooseUpgrade = (choiceId: string) => {
    const current = battleStateRef.current;
    const currentSave = saveRef.current;
    if (!current || !currentSave) {
      return;
    }

    const next = applyUpgradeChoice(current, choiceId, currentSave);
    battleStateRef.current = next;
    setBattleState(next);
    handleSnapshot(next);
  };

  return {
    battleState,
    chooseUpgrade,
  };
}
