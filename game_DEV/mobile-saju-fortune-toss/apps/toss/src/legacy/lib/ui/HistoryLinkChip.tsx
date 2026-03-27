import { Pressable, StyleSheet, Text } from 'react-native';

import { UI } from './tokens';

export function HistoryLinkChip({
  label = '최근 기록',
  onPress,
}: {
  label?: string;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(11,16,32,0.36)',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  label: {
    color: '#f2f1ef',
    fontSize: 12,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
});
