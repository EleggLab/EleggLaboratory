import { useCallback, useEffect, useRef, useState } from 'react';
import { resolveFullscreenAdGroupId, type TossFullscreenSlot } from './adConfig';
import { logAdEvent } from './adState';

type FullscreenAdCallbacks = {
  onDismiss?: () => void;
  onReward?: (unitType: string, unitAmount: number) => void;
};

type FullscreenAdEvent = {
  data?: {
    unitAmount?: number;
    unitType?: string;
  };
  type: string;
};

type LoadFullscreenAd = (options: {
  onError?: (error: unknown) => void;
  onEvent?: (event: FullscreenAdEvent) => void;
  options: { adGroupId: string };
}) => (() => void) | void;

type ShowFullscreenAd = (options: {
  onError?: (error: unknown) => void;
  onEvent?: (event: FullscreenAdEvent) => void;
  options: { adGroupId: string };
}) => void;

let loadFullscreenAdImpl: LoadFullscreenAd | null = null;
let showFullscreenAdImpl: ShowFullscreenAd | null = null;

try {
  const framework = require('@apps-in-toss/framework');
  loadFullscreenAdImpl = framework.loadFullScreenAd ?? null;
  showFullscreenAdImpl = framework.showFullScreenAd ?? null;
} catch {
  loadFullscreenAdImpl = null;
  showFullscreenAdImpl = null;
}

export type UseFullscreenAdResult = {
  isLoaded: boolean;
  isSupported: boolean;
  reload: () => void;
  show: (callbacks?: FullscreenAdCallbacks) => void;
};

export function useFullscreenAd(slot: TossFullscreenSlot): UseFullscreenAdResult {
  const [isLoaded, setIsLoaded] = useState(false);
  const unregisterRef = useRef<(() => void) | null>(null);
  const adGroupId = resolveFullscreenAdGroupId(slot);
  const isSupported = Boolean(adGroupId) && Boolean(loadFullscreenAdImpl) && Boolean(showFullscreenAdImpl);

  const clearRegistration = useCallback(() => {
    unregisterRef.current?.();
    unregisterRef.current = null;
  }, []);

  const reload = useCallback(() => {
    clearRegistration();
    setIsLoaded(false);

    if (!isSupported || !loadFullscreenAdImpl || !adGroupId) {
      return;
    }

    logAdEvent(slot, slot, 'load-started', { adGroupId });

    const unregister = loadFullscreenAdImpl({
      options: { adGroupId },
      onEvent: (event) => {
        logAdEvent(slot, slot, event.type, event);
        if (event.type === 'loaded') {
          setIsLoaded(true);
        }
      },
      onError: (error) => {
        logAdEvent(slot, slot, 'load-error', error);
        setIsLoaded(false);
      },
    });

    unregisterRef.current = typeof unregister === 'function' ? unregister : null;
  }, [adGroupId, clearRegistration, isSupported, slot]);

  useEffect(() => {
    reload();
    return clearRegistration;
  }, [clearRegistration, reload]);

  const show = useCallback(
    (callbacks?: FullscreenAdCallbacks) => {
      if (!isSupported || !showFullscreenAdImpl || !adGroupId || !isLoaded) {
        callbacks?.onDismiss?.();
        return;
      }

      logAdEvent(slot, slot, 'show-started', { adGroupId });

      showFullscreenAdImpl({
        options: { adGroupId },
        onEvent: (event) => {
          logAdEvent(slot, slot, event.type, event);

          switch (event.type) {
            case 'userEarnedReward':
              callbacks?.onReward?.(event.data?.unitType ?? '', event.data?.unitAmount ?? 0);
              break;
            case 'dismissed':
              setIsLoaded(false);
              reload();
              callbacks?.onDismiss?.();
              break;
            case 'failedToShow':
              setIsLoaded(false);
              reload();
              callbacks?.onDismiss?.();
              break;
          }
        },
        onError: (error) => {
          logAdEvent(slot, slot, 'show-error', error);
          setIsLoaded(false);
          reload();
          callbacks?.onDismiss?.();
        },
      });
    },
    [adGroupId, isLoaded, isSupported, reload, slot],
  );

  return {
    isLoaded,
    isSupported,
    reload,
    show,
  };
}
