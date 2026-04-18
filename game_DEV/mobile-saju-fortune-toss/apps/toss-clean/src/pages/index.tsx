import { createRoute } from '@granite-js/react-native';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export const Route = createRoute('/', {
  component: Page,
});

function Page() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>ASTRA DIAGNOSTIC</Text>
          <Text style={styles.title}>Minimal Toss shell is running.</Text>
          <Text style={styles.subtitle}>
            If this screen appears, the host boot path is healthy and the remaining issue is in our app tree.
          </Text>
          <Text style={styles.meta}>appName: astra</Text>
          <Text style={styles.meta}>route: /</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0E1420',
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#0E1420',
  },
  card: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: '#162033',
    borderWidth: 1,
    borderColor: 'rgba(247, 201, 72, 0.28)',
  },
  eyebrow: {
    color: '#F7C948',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#F8FAFF',
    marginBottom: 16,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 17,
    color: '#C7D1E3',
    marginBottom: 24,
    lineHeight: 26,
  },
  meta: {
    fontSize: 14,
    color: '#9FB0CD',
    marginBottom: 6,
  },
});
