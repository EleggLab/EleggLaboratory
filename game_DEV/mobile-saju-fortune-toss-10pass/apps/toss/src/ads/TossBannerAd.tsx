import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { resolveBannerAdGroupId, TOSS_AD_SLOT_META, type TossBannerSlot } from './adConfig';
import { logAdEvent } from './adState';

let InlineAdComponent: any = null;
try {
  InlineAdComponent = require('@apps-in-toss/framework').InlineAd;
} catch {
  InlineAdComponent = null;
}

export function TossBannerAd({
  slot,
}: {
  slot: TossBannerSlot;
}): React.JSX.Element | null {
  const adGroupId = resolveBannerAdGroupId(slot);
  const meta = TOSS_AD_SLOT_META[slot];
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(Boolean(adGroupId));
  }, [adGroupId, slot]);

  if (!InlineAdComponent || !adGroupId || !visible) {
    return null;
  }

  return (
    <View style={[styles.wrap, meta.fixedHeight ? { height: meta.fixedHeight } : null]}>
      <InlineAdComponent
        adGroupId={adGroupId}
        impressFallbackOnMount
        theme="auto"
        tone="blackAndWhite"
        variant={meta.variant}
        onAdClicked={(payload: unknown) => logAdEvent('banner', slot, 'clicked', payload)}
        onAdFailedToRender={(payload: unknown) => {
          logAdEvent('banner', slot, 'failed', payload);
          setVisible(false);
        }}
        onAdImpression={(payload: unknown) => logAdEvent('banner', slot, 'impression', payload)}
        onAdRendered={(payload: unknown) => {
          logAdEvent('banner', slot, 'rendered', payload);
          setVisible(true);
        }}
        onAdViewable={(payload: unknown) => logAdEvent('banner', slot, 'viewable', payload)}
        onNoFill={(payload: unknown) => {
          logAdEvent('banner', slot, 'no-fill', payload);
          setVisible(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: 12,
  },
});
