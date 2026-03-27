import { StyleSheet, Text, View } from 'react-native';

export function FeatureCard({
  body,
  eyebrow,
  title,
}: {
  body: string;
  eyebrow: string;
  title: string;
}): React.JSX.Element {
  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#d9e3f0',
    backgroundColor: '#ffffff',
    padding: 20,
    gap: 10,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: '#5b6b82',
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: '#17253b',
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    color: '#475569',
  },
});
