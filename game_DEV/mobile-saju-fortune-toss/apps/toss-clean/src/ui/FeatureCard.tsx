import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { APP_THEME } from './theme';

export function FeatureCard({
  eyebrow,
  title,
  description,
  onPress,
}: {
  eyebrow: string;
  title: string;
  description: string;
  onPress?: () => void;
}): React.JSX.Element {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      <View style={styles.ctaRow}>
        <Text style={styles.cta}>열기</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: APP_THEME.radius.card,
    backgroundColor: APP_THEME.colors.card,
    borderWidth: 1,
    borderColor: '#E6DDCF',
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 8,
  },
  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.992 }],
  },
  eyebrow: {
    color: '#8A6B14',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  title: {
    color: APP_THEME.colors.text,
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
  },
  description: {
    color: '#4B5563',
    fontSize: 15,
    lineHeight: 22,
  },
  ctaRow: {
    marginTop: 6,
  },
  cta: {
    color: '#7C5F12',
    fontSize: 13,
    fontWeight: '800',
  },
});
