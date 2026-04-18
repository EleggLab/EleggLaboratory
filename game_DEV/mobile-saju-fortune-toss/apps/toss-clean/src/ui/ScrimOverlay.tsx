import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

export function ScrimOverlay({
  topHeight,
  bottomHeight,
  topOpacity,
  bottomOpacity,
}: {
  topHeight: number;
  bottomHeight: number;
  topOpacity: number;
  bottomOpacity: number;
}): React.JSX.Element {
  return (
    <>
      <View pointerEvents="none" style={[styles.layer, { top: 0, height: topHeight }]}>
        <Svg width="100%" height="100%" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="scrimTop" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={`rgba(7, 10, 22, ${topOpacity.toFixed(4)})`} />
              <Stop offset="0.14" stopColor={`rgba(7, 10, 22, ${(topOpacity * 0.42).toFixed(4)})`} />
              <Stop offset="0.34" stopColor={`rgba(7, 10, 22, ${(topOpacity * 0.12).toFixed(4)})`} />
              <Stop offset="0.66" stopColor={`rgba(7, 10, 22, ${(topOpacity * 0.03).toFixed(4)})`} />
              <Stop offset="1" stopColor="rgba(7, 10, 22, 0)" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#scrimTop)" />
        </Svg>
      </View>

      <View pointerEvents="none" style={[styles.layer, { bottom: 0, height: bottomHeight }]}>
        <Svg width="100%" height="100%" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="scrimBottom" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="rgba(7, 10, 22, 0)" />
              <Stop offset="0.36" stopColor={`rgba(7, 10, 22, ${(bottomOpacity * 0.03).toFixed(4)})`} />
              <Stop offset="0.68" stopColor={`rgba(7, 10, 22, ${(bottomOpacity * 0.12).toFixed(4)})`} />
              <Stop offset="1" stopColor={`rgba(7, 10, 22, ${bottomOpacity.toFixed(4)})`} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#scrimBottom)" />
        </Svg>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});
