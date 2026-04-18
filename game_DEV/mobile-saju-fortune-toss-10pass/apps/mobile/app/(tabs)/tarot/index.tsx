import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import type { TarotReadingType } from '../../../lib/features/tarot/deck';
import { loadTodayTarot } from '../../../lib/features/tarot/storage';
import { BACKGROUNDS } from '../../../lib/assets/backgrounds';
import { commonStyles } from '../../../lib/ui/commonStyles';
import { ScreenScroll } from '../../../lib/ui/ScreenScroll';
import { UI } from '../../../lib/ui/tokens';

function CardButton({
  title,
  subtitle,
  onPress,
  style,
}: {
  title: string;
  subtitle?: string;
  onPress: () => void;
  style?: object;
}): React.JSX.Element {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.btn, style, pressed && styles.pressed]}>
      <Text style={styles.btnTitle}>{title}</Text>
      {subtitle ? <Text style={styles.btnSub}>{subtitle}</Text> : null}
    </Pressable>
  );
}

export default function TarotHome(): React.JSX.Element {
  const navigation = useNavigation();
  const [todayReady, setTodayReady] = useState<boolean>(false);
  const [resetToken, setResetToken] = useState(0);

  useEffect(() => {
    let mounted = true;
    loadTodayTarot()
      .then((saved) => {
        if (!mounted) return;
        setTodayReady(Boolean(saved));
      })
      .catch(() => {
        if (!mounted) return;
        setTodayReady(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      const navAny = navigation as any;
      const unsub = navAny.addListener('tabPress', () => {
        if (!navAny.isFocused()) return;
        setResetToken((prev) => prev + 1);
      });
      return unsub;
    }, [navigation]),
  );

  const goReading = async (type: TarotReadingType): Promise<void> => {
    if (type === 'today') {
      const saved = await loadTodayTarot();
      if (saved) {
        router.push('/(tabs)/tarot/result?type=today&cached=1');
        return;
      }
    }
    router.push(`/(tabs)/tarot/reading?type=${type}`);
  };

  return (
    <ScreenScroll
      background={BACKGROUNDS.tarot}
      contentContainerStyle={[commonStyles.screen, styles.container]}
      scrollToTopKey={resetToken}
      resetScrollOnFocus
    >
      <View style={[commonStyles.hero, styles.hero]}>
        <Text style={styles.heroLine}>보고 싶은 운세를 고르세요.</Text>
        <Text style={styles.heroSub}>오늘의 결을 빠르게 보고 싶다면 오늘 운세, 더 깊게 묻고 싶다면 분야별 리딩을 골라보세요.</Text>
      </View>

      <View style={styles.guideBand}>
        <View style={styles.guideChip}>
          <View style={styles.guideDot} />
          <Text style={styles.guideChipText}>한 번에 하나의 질문만 잡는 편이 더 선명해요</Text>
        </View>
      </View>

      <View style={styles.grid}>
        <CardButton
          title={todayReady ? '오늘의 운세 (완료)' : '오늘의 운세'}
          subtitle={todayReady ? '오늘 저장된 리딩 다시 보기' : '하루 1회, 오늘의 기본 흐름'}
          style={styles.todayBtn}
          onPress={() => void goReading('today')}
        />

        <View style={styles.twoByTwo}>
          <CardButton title="연애운" subtitle="마음과 거리감" onPress={() => void goReading('love')} style={styles.halfBtn} />
          <CardButton title="금전운" subtitle="흐르는 돈의 결" onPress={() => void goReading('money')} style={styles.halfBtn} />
          <CardButton title="인간관계운" subtitle="사람 사이의 온도" onPress={() => void goReading('relationship')} style={styles.halfBtn} />
          <CardButton title="학업운" subtitle="집중과 성과의 방향" onPress={() => void goReading('study')} style={styles.halfBtn} />
        </View>
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    gap: 16,
  },
  hero: {
    gap: 0,
  },
  heroLine: {
    color: '#f2f1ef',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  heroSub: {
    color: 'rgba(242,241,239,0.78)',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  guideBand: {
    gap: 8,
    paddingTop: 2,
  },
  guideChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: UI.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(8,13,28,0.54)',
  },
  guideDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: UI.colors.gold,
  },
  guideChipText: {
    color: '#f2f1ef',
    fontSize: 11,
    fontWeight: '900',
  },
  grid: {
    flex: 1,
    gap: 12,
    justifyContent: 'flex-start',
    minHeight: 420,
  },
  todayBtn: {
    minHeight: 92,
    borderColor: 'rgba(247,201,72,0.6)',
    backgroundColor: '#fff9e8',
  },
  twoByTwo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    flex: 1,
    alignContent: 'stretch',
  },
  halfBtn: {
    flexBasis: '48%',
    flexGrow: 1,
    minHeight: 100,
    justifyContent: 'center',
  },
  btn: {
    borderRadius: 18,
    backgroundColor: UI.colors.card,
    borderWidth: 1,
    borderColor: UI.colors.line,
    padding: 16,
    gap: 6,
    shadowColor: '#0b1020',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  btnTitle: {
    color: UI.colors.text,
    fontWeight: '900',
    fontSize: 18,
  },
  btnSub: {
    color: UI.colors.muted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
});
