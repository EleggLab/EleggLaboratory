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
      </View>

      <View style={styles.grid}>
        <CardButton
          title={todayReady ? '오늘의 운세 (완료)' : '오늘의 운세'}
          subtitle="하루 1회만"
          style={styles.todayBtn}
          onPress={() => void goReading('today')}
        />

        <View style={styles.twoByTwo}>
          <CardButton title="연애운" onPress={() => void goReading('love')} style={styles.halfBtn} />
          <CardButton title="금전운" onPress={() => void goReading('money')} style={styles.halfBtn} />
          <CardButton title="인간관계운" onPress={() => void goReading('relationship')} style={styles.halfBtn} />
          <CardButton title="학업운" onPress={() => void goReading('study')} style={styles.halfBtn} />
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
  grid: {
    flex: 1,
    gap: 12,
    justifyContent: 'flex-start',
    minHeight: 420,
  },
  todayBtn: {
    minHeight: 92,
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
