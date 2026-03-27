import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { UI } from '../../lib/ui/tokens';

export default function SectionCard({
  title,
  tone = 'card',
  children,
}: {
  title?: string;
  tone?: 'card' | 'ink';
  children: React.ReactNode;
}): React.JSX.Element {
  const reveal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(reveal, {
      toValue: 1,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [reveal]);

  return (
    <Animated.View
      style={[
        styles.card,
        tone === 'ink' && styles.cardInk,
        {
          opacity: reveal,
          transform: [
            {
              translateY: reveal.interpolate({
                inputRange: [0, 1],
                outputRange: [10, 0],
              }),
            },
          ],
        },
      ]}
    >
      {title ? <Text style={[styles.title, tone === 'ink' && styles.titleInk]}>{title}</Text> : null}
      <View style={styles.body}>{children}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: UI.radius.lg,
    borderWidth: 1,
    borderColor: UI.colors.line,
    backgroundColor: UI.colors.card,
    padding: UI.space.cardPad,
    shadowColor: '#0b1020',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  cardInk: {
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: UI.colors.ink,
  },
  title: {
    fontSize: 15,
    fontWeight: '900',
    color: UI.colors.text,
    marginBottom: 12,
  },
  titleInk: {
    color: '#f2f1ef',
  },
  body: {
    gap: 16,
  },
});
