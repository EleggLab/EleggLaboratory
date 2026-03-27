import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AD_IDS } from './config';

/**
 * InlineAd를 직접 import합니다.
 * 토스 앱 환경에서만 실행되므로 항상 네이티브 경로를 사용합니다.
 */
let InlineAd: any = null;
try {
  InlineAd = require('@apps-in-toss/framework').InlineAd;
} catch {
  // @apps-in-toss/framework 미설치 환경 — 무시
}

type BannerVariant = 'list' | 'feed';

interface BannerAdProps {
  /** 배너 종류: list(96px) 또는 feed(410px) */
  variant?: BannerVariant;
  /** 색상 테마 */
  theme?: 'auto' | 'light' | 'dark';
}

/**
 * 토스 인앱 배너 광고 컴포넌트.
 *
 * - list: 리스트형 배너 (높이 96px)
 * - feed: 피드형 배너 (높이 410px)
 *
 * SDK 미설치 환경에서는 빈 View를 렌더링합니다.
 */
export function BannerAd({ variant = 'list', theme = 'auto' }: BannerAdProps): React.JSX.Element | null {
  const [visible, setVisible] = useState(true);

  if (!InlineAd || !visible) return null;

  const adGroupId = variant === 'feed' ? AD_IDS.bannerFeed : AD_IDS.bannerList;
  const height = variant === 'feed' ? 410 : 96;

  return (
    <View style={[styles.container, { height }]}>
      <InlineAd
        adGroupId={adGroupId}
        theme={theme}
        tone="blackAndWhite"
        variant="expanded"
        impressFallbackOnMount
        onNoFill={() => setVisible(false)}
        onAdFailedToRender={() => setVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: 12,
  },
});
