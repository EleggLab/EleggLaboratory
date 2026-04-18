import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { UI } from '../lib/ui/tokens';

export default function NotFoundScreen(): React.JSX.Element {
  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <Text style={styles.title}>페이지를 찾을 수 없어요</Text>
        <Text style={styles.desc}>요청한 화면 경로가 유효하지 않습니다. 홈으로 이동해서 다시 시작해 주세요.</Text>

        <Pressable onPress={() => router.replace('/(tabs)/home')} style={({ pressed }) => [styles.btn, pressed && styles.pressed]}>
          <Text style={styles.btnText}>홈으로 이동</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: UI.colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(11,16,32,0.88)',
    paddingVertical: 22,
    paddingHorizontal: 16,
    gap: 8,
  },
  title: {
    color: '#f2f1ef',
    fontSize: 19,
    fontWeight: '900',
  },
  desc: {
    color: 'rgba(242,241,239,0.84)',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
  btn: {
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: UI.colors.gold,
    borderWidth: 1,
    borderColor: UI.colors.gold,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  btnText: {
    color: UI.colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
});
