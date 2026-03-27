import { useCallback, useEffect, useRef, useState } from 'react';

import { AD_IDS } from './config';

/**
 * 토스 인앱 전면/보상형 광고 SDK를 직접 import합니다.
 * 토스 앱 환경에서만 실행되므로 항상 네이티브 경로를 사용합니다.
 */
let loadFullScreenAd: any = null;
let showFullScreenAd: any = null;
try {
  const fw = require('@apps-in-toss/framework');
  loadFullScreenAd = fw.loadFullScreenAd;
  showFullScreenAd = fw.showFullScreenAd;
} catch {
  // SDK 미설치 환경
}

type AdType = 'interstitial' | 'rewarded';

interface UseFullscreenAdResult {
  /** 광고가 로드되어 노출 가능한 상태 */
  isLoaded: boolean;
  /** SDK를 사용할 수 있는 환경인지 */
  isSupported: boolean;
  /** 광고 노출. onDismiss 콜백은 광고가 닫힌 뒤 호출됨 */
  show: (callbacks?: {
    onDismiss?: () => void;
    onReward?: (unitType: string, unitAmount: number) => void;
  }) => void;
  /** 수동으로 다시 로드 */
  reload: () => void;
}

/**
 * 토스 인앱 전면/보상형 광고 훅.
 *
 * ```ts
 * const ad = useFullscreenAd('rewarded');
 * // ad.isLoaded가 true일 때
 * ad.show({ onReward: (type, amount) => grantReward() });
 * ```
 */
export function useFullscreenAd(type: AdType): UseFullscreenAdResult {
  const [isLoaded, setIsLoaded] = useState(false);
  const unregisterRef = useRef<(() => void) | null>(null);

  const supported = Boolean(loadFullScreenAd) && Boolean(showFullScreenAd);
  const adGroupId = type === 'rewarded' ? AD_IDS.rewarded : AD_IDS.interstitial;

  const load = useCallback(() => {
    if (!supported) return;
    setIsLoaded(false);

    // 이전 리스너 해제
    unregisterRef.current?.();

    unregisterRef.current = loadFullScreenAd({
      options: { adGroupId },
      onEvent: (event: { type: string }) => {
        if (event.type === 'loaded') {
          setIsLoaded(true);
        }
      },
      onError: () => {
        setIsLoaded(false);
      },
    });
  }, [adGroupId, supported]);

  useEffect(() => {
    load();
    return () => {
      unregisterRef.current?.();
    };
  }, [load]);

  const show = useCallback(
    (callbacks?: {
      onDismiss?: () => void;
      onReward?: (unitType: string, unitAmount: number) => void;
    }) => {
      if (!supported || !isLoaded) {
        // 광고를 보여줄 수 없으면 바로 dismiss 콜백 실행
        callbacks?.onDismiss?.();
        return;
      }

      showFullScreenAd({
        options: { adGroupId },
        onEvent: (event: { type: string; data?: { unitType: string; unitAmount: number } }) => {
          switch (event.type) {
            case 'userEarnedReward':
              if (event.data) {
                callbacks?.onReward?.(event.data.unitType, event.data.unitAmount);
              }
              break;
            case 'dismissed':
              setIsLoaded(false);
              // 닫힌 뒤 다음 광고를 미리 로드
              load();
              callbacks?.onDismiss?.();
              break;
            case 'failedToShow':
              setIsLoaded(false);
              load();
              callbacks?.onDismiss?.();
              break;
          }
        },
        onError: () => {
          setIsLoaded(false);
          load();
          callbacks?.onDismiss?.();
        },
      });
    },
    [adGroupId, isLoaded, load, supported],
  );

  return {
    isLoaded,
    isSupported: supported,
    show,
    reload: load,
  };
}
