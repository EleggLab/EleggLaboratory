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
        <Text style={styles.kicker}>ASTRA DIAGNOSTIC</Text>
        <Text style={styles.title}>토스 최소 진단 화면</Text>
        <Text style={styles.body}>
          이 화면이 보이면 Granite 라우트와 앱 등록 자체는 정상입니다.
        </Text>
        <Text selectable style={styles.body}>
          {`builtAt=${new Date().toISOString()}`}
        </Text>
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>diagnostic-ok</Text>
        </Pressable>
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
