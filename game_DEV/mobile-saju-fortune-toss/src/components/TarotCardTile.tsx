import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, View } from 'react-native';

import type { TarotCardDef } from '../../lib/features/tarot/deck';
import { TAROT_IMAGE_CROP, tarotImageSource } from '../../lib/features/tarot/imageSource';
import { UI } from '../../lib/ui/tokens';

export default function TarotCardTile({
  card,
  faceUp,
  reversed = false,
  selected,
  disabled,
  shuffleToken = 0,
  slotIndex = 0,
  onPress,
}: {
  card: TarotCardDef;
  faceUp: boolean;
  reversed?: boolean;
  selected: boolean;
  disabled?: boolean;
  shuffleToken?: number;
  slotIndex?: number;
  onPress: () => void;
}): React.JSX.Element {
  const progress = useRef(new Animated.Value(faceUp ? 1 : 0)).current;
  const shuffle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: faceUp ? 1 : 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [faceUp, progress]);

  useEffect(() => {
    if (!shuffleToken) return;
    const delayMs = (slotIndex % 8) * 18;
    shuffle.setValue(0);
    Animated.sequence([
      Animated.delay(delayMs),
      Animated.timing(shuffle, {
        toValue: 1,
        duration: 170,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(shuffle, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [shuffle, shuffleToken, slotIndex]);

  const backRotateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const frontRotateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const shuffleRotate = useMemo(
    () =>
      shuffle.interpolate({
        inputRange: [0, 0.25, 0.5, 0.75, 1],
        outputRange: ['0deg', '-6deg', '5deg', '-3deg', '0deg'],
      }),
    [shuffle],
  );

  const shuffleLift = useMemo(
    () =>
      shuffle.interpolate({
        inputRange: [0, 0.35, 0.7, 1],
        outputRange: [0, -8, 3, 0],
      }),
    [shuffle],
  );

  const shuffleSlideX = useMemo(
    () =>
      shuffle.interpolate({
        inputRange: [0, 0.35, 0.65, 1],
        outputRange: [0, (slotIndex % 2 === 0 ? -1 : 1) * 5, (slotIndex % 2 === 0 ? 1 : -1) * 3, 0],
      }),
    [shuffle, slotIndex],
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.wrap,
        selected && styles.selected,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Animated.View
        style={[styles.motion, { transform: [{ rotateZ: shuffleRotate }, { translateY: shuffleLift }, { translateX: shuffleSlideX }] }]}
      >
        <View style={styles.inner}>
          <Animated.View style={[styles.face, { transform: [{ perspective: 800 }, { rotateY: backRotateY }] }]}>
            <View style={styles.back}>
              <View style={styles.backInner}>
                <View style={styles.backCornerTopLeft} />
                <View style={styles.backCornerTopRight} />
                <View style={styles.backCornerBottomLeft} />
                <View style={styles.backCornerBottomRight} />
                <View style={styles.backCore}>
                  <View style={styles.backCoreDiamond} />
                </View>
              </View>
            </View>
          </Animated.View>

          <Animated.View style={[styles.face, { transform: [{ perspective: 800 }, { rotateY: frontRotateY }] }]}>
            <View style={styles.front}>
              <View style={styles.frontInner}>
                <Image
                  source={tarotImageSource(card)}
                  style={[
                    styles.image,
                    {
                      transform: [
                        { scale: TAROT_IMAGE_CROP.scale },
                        { translateY: TAROT_IMAGE_CROP.translateY },
                        ...(reversed ? ([{ rotate: '180deg' }] as const) : []),
                      ],
                    },
                  ]}
                  resizeMode="contain"
                />
              </View>
            </View>
          </Animated.View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#cfc6bc',
    backgroundColor: '#f4f1eb',
  },
  motion: {
    width: '100%',
  },
  pressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.95,
  },
  selected: {
    borderColor: UI.colors.gold,
    shadowColor: UI.colors.gold,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 6,
  },
  disabled: {
    opacity: 0.55,
  },
  inner: {
    width: '100%',
    aspectRatio: 2 / 3,
  },
  face: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backfaceVisibility: 'hidden',
  },
  front: {
    width: '100%',
    height: '100%',
    padding: 5,
    backgroundColor: '#f4f1eb',
  },
  frontInner: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cdc5ba',
    backgroundColor: '#f9f7f2',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  back: {
    width: '100%',
    height: '100%',
    padding: 5,
    backgroundColor: '#0b1020',
  },
  backInner: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(247,201,72,0.42)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backCornerTopLeft: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 10,
    height: 10,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: 'rgba(247,201,72,0.55)',
  },
  backCornerTopRight: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(247,201,72,0.55)',
  },
  backCornerBottomLeft: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    width: 10,
    height: 10,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderColor: 'rgba(247,201,72,0.55)',
  },
  backCornerBottomRight: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 10,
    height: 10,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(247,201,72,0.55)',
  },
  backCore: {
    width: 36,
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(247,201,72,0.60)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  backCoreDiamond: {
    width: 10,
    height: 10,
    transform: [{ rotate: '45deg' }],
    backgroundColor: 'rgba(247,201,72,0.82)',
  },
});
