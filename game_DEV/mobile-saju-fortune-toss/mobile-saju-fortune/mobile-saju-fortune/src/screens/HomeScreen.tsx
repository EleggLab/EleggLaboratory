import { useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { BACKGROUNDS } from '../../lib/assets/backgrounds';
import { commonStyles } from '../../lib/ui/commonStyles';
import { ScreenScroll } from '../../lib/ui/ScreenScroll';

const HOME_LINES = [
  '오늘은 가볍게 시작해도 흐름이 잘 붙어요.',
  '하나만 먼저 끝내면 마음이 훨씬 편해져요.',
  '지금 떠오른 메모 하나가 힌트가 될 수 있어요.',
  '서두르기보다 순서를 정하면 실수가 줄어요.',
  '작은 약속 하나를 지키는 게 운을 올려줘요.',
];

function pickNextLine(current: string): string {
  if (HOME_LINES.length <= 1) return current;
  let next = current;
  while (next === current) {
    next = HOME_LINES[Math.floor(Math.random() * HOME_LINES.length)] ?? current;
  }
  return next;
}

export default function HomeScreen(): React.JSX.Element {
  const [lineText, setLineText] = useState(
    () => HOME_LINES[Math.floor(Math.random() * HOME_LINES.length)] ?? HOME_LINES[0] ?? '',
  );

  const bubbleOpacity = useRef(new Animated.Value(1)).current;
  const bubbleLift = useRef(new Animated.Value(0)).current;

  const animateBubble = (nextText: string): void => {
    Animated.parallel([
      Animated.timing(bubbleOpacity, {
        toValue: 0,
        duration: 110,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(bubbleLift, {
        toValue: -3,
        duration: 110,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setLineText(nextText);
      bubbleLift.setValue(3);
      Animated.parallel([
        Animated.timing(bubbleOpacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(bubbleLift, {
          toValue: 0,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleNextLine = (): void => {
    animateBubble(pickNextLine(lineText));
  };

  return (
    <ScreenScroll
      background={BACKGROUNDS.home}
      contentContainerStyle={[commonStyles.screen, styles.container]}
      contentRevealDelayMs={0}
    >
      <View style={styles.tapCanvas}>
        <Pressable
          onPress={handleNextLine}
          style={({ pressed }) => [styles.faceTapZone, pressed && styles.faceTapZonePressed]}
        >
          <View style={styles.faceSpacer} />
        </Pressable>

        <Pressable onPress={handleNextLine} style={({ pressed }) => [styles.toastWrap, pressed && styles.pressed]}>
          <View style={styles.toastBody}>
            <Animated.Text
              style={[styles.toastText, { opacity: bubbleOpacity, transform: [{ translateY: bubbleLift }] }]}
            >
              {lineText}
            </Animated.Text>
          </View>
        </Pressable>
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 0,
    flexGrow: 1,
  },
  tapCanvas: {
    position: 'relative',
    flex: 1,
    minHeight: 520,
    paddingBottom: 14,
  },
  faceSpacer: {
    flex: 1,
  },
  faceTapZone: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
  },
  faceTapZonePressed: {
    opacity: 0.97,
  },
  toastWrap: {
    position: 'absolute',
    left: '4%',
    right: '4%',
    bottom: 10,
  },
  toastBody: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    backgroundColor: 'rgba(11,16,32,0.68)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
    zIndex: 3,
  },
  toastText: {
    color: '#f2f1ef',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 19,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
});
