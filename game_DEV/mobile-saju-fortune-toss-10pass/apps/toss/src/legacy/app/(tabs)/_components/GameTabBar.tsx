import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { StackActions } from '@react-navigation/native';
import { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { UI } from '../../../lib/ui/tokens';

type TabKey = 'tarot' | 'saju' | 'home' | 'iching' | 'today';

const TAB_ORDER: TabKey[] = ['today', 'tarot', 'home', 'saju', 'iching'];

const TAB_META: Record<TabKey, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  today: { label: '데일리', icon: 'sunny' },
  tarot: { label: '타로', icon: 'sparkles' },
  home: { label: '홈', icon: 'home' },
  saju: { label: '사주', icon: 'grid' },
  iching: { label: '주역', icon: 'time' },
};

function TabBarItem({
  name,
  focused,
  onPress,
  onLongPress,
  accessibilityLabel,
  testID,
}: {
  name: TabKey;
  focused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  accessibilityLabel: string | undefined;
  testID: string | undefined;
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
      accessibilityLabel={accessibilityLabel ?? meta.label}
      testID={testID}
      onPress={onPress}
      onLongPress={onLongPress}
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
        <Ionicons name={meta.icon} size={isHome ? 31 : 22} color={focused ? '#0b1020' : '#f2f1ef'} />
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

export default function GameTabBar({ state, descriptors, navigation }: BottomTabBarProps): React.JSX.Element {
  return (
    <View style={styles.shell}>
      <View style={styles.bar}>
        {TAB_ORDER.map((name) => {
          const route = state.routes.find((r) => r.name === name);
          if (!route) return null;

          const isFocused = state.index === state.routes.indexOf(route);

          const onPress = (): void => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (event.defaultPrevented) return;

            if (isFocused) {
              navigation.dispatch({
                ...StackActions.popToTop(),
                target: route.key,
              });
              navigation.navigate(route.name);
              return;
            }

            navigation.navigate(route.name);
          };

          const onLongPress = (): void => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };

          return (
            <TabBarItem
              key={route.key}
              name={name}
              focused={isFocused}
              onPress={onPress}
              onLongPress={onLongPress}
              accessibilityLabel={descriptors[route.key]?.options.tabBarAccessibilityLabel}
              testID={descriptors[route.key]?.options.tabBarButtonTestID}
            />
          );
        })}
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
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0px 10px 16px rgba(247,201,72,0.25)',
        }
      : {
          shadowColor: UI.colors.gold,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.25,
          shadowRadius: 16,
          elevation: 8,
        }),
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
