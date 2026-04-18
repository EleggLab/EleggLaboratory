import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { UI } from '../../lib/ui/tokens';

export type TabKey = 'today' | 'tarot' | 'home' | 'saju' | 'iching';

const TAB_ORDER: TabKey[] = ['today', 'tarot', 'home', 'saju', 'iching'];

const TAB_META: Record<TabKey, { label: string; icon: string }> = {
  today: { label: '데일리', icon: '☀️' },
  tarot: { label: '타로', icon: '✨' },
  home: { label: '홈', icon: '🏠' },
  saju: { label: '사주', icon: '📊' },
  iching: { label: '주역', icon: '🕐' },
};

function TabBarItem({
  name,
  focused,
  onPress,
}: {
  name: TabKey;
  focused: boolean;
  onPress: () => void;
}): React.JSX.Element {
  const meta = TAB_META[name];
  const isHome = name === 'home';
  const anim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: focused ? 1 : 0,
      useNativeDriver: true,
      speed: 18,
      bounciness: 8,
    }).start();
  }, [anim, focused]);

  const iconScale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  const iconTranslateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -1],
  });

  const labelOpacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.84, 1],
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={focused ? { selected: true } : {}}
      accessibilityLabel={meta.label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.item,
        isHome && styles.homeItem,
        focused && !isHome && styles.itemFocused,
        pressed && !isHome && styles.pressed,
      ]}
    >
      <Animated.View
        style={[
          styles.iconWrap,
          isHome && styles.homeIconWrap,
          focused && !isHome && styles.iconWrapFocused,
          {
            transform: [{ scale: iconScale }, { translateY: iconTranslateY }],
          },
        ]}
      >
        <Text style={[styles.iconText, isHome && styles.homeIconText]}>{meta.icon}</Text>
      </Animated.View>

      <Animated.Text
        style={[
          styles.label,
          isHome && styles.homeLabel,
          focused && styles.labelFocused,
          {
            opacity: labelOpacity,
          },
        ]}
      >
        {meta.label}
      </Animated.Text>

      {focused && !isHome ? <View style={styles.activeDot} /> : null}
    </Pressable>
  );
}

export default function TabBar({
  activeTab,
  onTabPress,
}: {
  activeTab: TabKey;
  onTabPress: (tab: TabKey) => void;
}): React.JSX.Element {
  return (
    <View style={styles.shell}>
      <View style={styles.bar}>
        {TAB_ORDER.map((name) => (
          <TabBarItem
            key={name}
            name={name}
            focused={activeTab === name}
            onPress={() => onTabPress(name)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: UI.colors.ink,
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  bar: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: 6,
    borderRadius: 16,
  },
  itemFocused: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  homeItem: {
    flex: 1.2,
    marginTop: -24,
  },
  pressed: {
    opacity: 0.9,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  iconWrapFocused: {
    backgroundColor: 'rgba(247,201,72,0.22)',
    borderColor: 'rgba(247,201,72,0.66)',
  },
  homeIconWrap: {
    width: 60,
    height: 60,
    backgroundColor: UI.colors.gold,
    borderColor: UI.colors.gold,
    shadowColor: UI.colors.gold,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  iconText: {
    fontSize: 20,
  },
  homeIconText: {
    fontSize: 28,
  },
  label: {
    marginTop: 6,
    fontSize: 11,
    color: 'rgba(242,241,239,0.85)',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  labelFocused: {
    color: '#ffffff',
  },
  homeLabel: {
    color: '#ffffff',
  },
  activeDot: {
    marginTop: 4,
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: UI.colors.gold,
  },
});
