import { createRoute } from '@granite-js/react-native';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

export const Route = createRoute('/', {
  screenOptions: { headerShown: false },
  validateParams: (params: Readonly<object | undefined>) => (params ?? {}) as Record<string, unknown>,
  component: Page,
});

function Page(): React.JSX.Element {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        <Text style={styles.kicker}>ASTRA DEV CONTEXT</Text>
        <Text style={styles.title}>최소 routes 컨텍스트 진단</Text>
        <Text style={styles.body}>이 화면이 보이면 기존 pages 트리 중 하나가 초기화 실패를 내고 있는 겁니다.</Text>
        <Text selectable style={styles.body}>
          {`builtAt=${new Date().toISOString()}`}
        </Text>
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>dev-context-ok</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#081121',
  },
  root: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    gap: 14,
  },
  kicker: {
    color: '#f7c948',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  title: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
  },
  body: {
    color: '#cbd5e1',
    fontSize: 15,
    lineHeight: 22,
  },
  button: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#f7c948',
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  buttonText: {
    color: '#101625',
    fontSize: 14,
    fontWeight: '900',
  },
});
