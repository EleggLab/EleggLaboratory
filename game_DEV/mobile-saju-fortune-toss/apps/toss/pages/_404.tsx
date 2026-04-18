import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function NotFoundPage(): React.JSX.Element {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        <Text style={styles.kicker}>ASTRA</Text>
        <Text style={styles.title}>페이지를 찾을 수 없어요</Text>
        <Text style={styles.body}>잘못된 경로이거나, 현재 테스트 환경에서 지원되지 않는 화면일 수 있어요.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  root: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  kicker: {
    color: '#f7c948',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  title: {
    color: '#f8fafc',
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 32,
  },
  body: {
    color: '#cbd5e1',
    fontSize: 15,
    lineHeight: 22,
  },
});
