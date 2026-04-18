import { useCallback, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { BACKGROUNDS } from '../../lib/assets/backgrounds';
import { commonStyles } from '../../lib/ui/commonStyles';
import { ScreenScroll } from '../../lib/ui/ScreenScroll';

const ASTRA_LINES = [
  '저는 아스트라라고 해요. 오늘의 흐름을 함께 읽어드릴게요.',
  '아스트라는 작은 신호를 놓치지 않는 편이에요.',
  '화면을 톡 건드려주면 제가 다른 힌트도 들려드릴게요.',
  '오늘은 해야 할 일 하나만 먼저 끝내도 흐름이 좋아져요.',
  '급하게 달리기보다 한 번 숨을 고르면 운이 더 선명해져요.',
  '사주도 좋고 타로도 좋아요. 끌리는 쪽부터 천천히 가볼까요?',
  '메모처럼 스쳐 간 생각 하나가 오늘의 열쇠가 될 수 있어요.',
  '지금 필요한 건 거창한 결론보다, 마음을 가볍게 해 주는 한 걸음이에요.',
];

function pickNextLine(current: string): string {
  if (ASTRA_LINES.length <= 1) return current;

  let next = current;
  while (next === current) {
    next = ASTRA_LINES[Math.floor(Math.random() * ASTRA_LINES.length)] ?? current;
  }
  return next;
}

export default function HomeScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const [lineText, setLineText] = useState(
    () => ASTRA_LINES[Math.floor(Math.random() * ASTRA_LINES.length)] ?? ASTRA_LINES[0] ?? '',
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

  useFocusEffect(
    useCallback(() => {
      const navAny = navigation as any;
      const unsub = navAny.addListener('tabPress', () => {
        if (!navAny.isFocused()) return;
        setLineText((prev) => pickNextLine(prev));
      });
      return unsub;
    }, [navigation]),
  );

  return (
    <ScreenScroll
      background={BACKGROUNDS.home}
      contentContainerStyle={[commonStyles.screen, styles.container]}
      contentRevealDelayMs={0}
      resetScrollOnFocus
    >
      <Pressable onPress={handleNextLine} style={({ pressed }) => [styles.tapCanvas, pressed && styles.canvasPressed]}>
        <View style={styles.faceArea}>
          <View style={styles.faceSpacer} />
        </View>

        <View style={styles.toastWrap}>
          <View style={styles.toastBody}>
            <Text style={styles.toastName}>아스트라</Text>
            <Animated.Text style={[styles.toastText, { opacity: bubbleOpacity, transform: [{ translateY: bubbleLift }] }]}>
              {lineText}
            </Animated.Text>
          </View>
        </View>
      </Pressable>
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
    minHeight: 980,
    paddingBottom: 14,
  },
  canvasPressed: {
    opacity: 0.985,
  },
  faceArea: {
    flex: 1,
  },
  faceSpacer: {
    flex: 1,
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
  toastName: {
    color: '#ffd979',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  toastText: {
    color: '#f2f1ef',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 19,
  },
});
