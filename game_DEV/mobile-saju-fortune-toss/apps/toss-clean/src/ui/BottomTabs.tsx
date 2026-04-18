import React from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import {
  LucideClock,
  LucideGrid,
  LucideHouse,
  LucideSparkles,
  LucideSun,
} from './LucideTabIcons';

import { APP_THEME, type AppRootPath } from './theme';

type TabIconKey = 'daily' | 'tarot' | 'home' | 'saju' | 'iching';
type LucideIcon = React.ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
  absoluteStrokeWidth?: boolean;
}>;

const TAB_META: Array<{
  key: TabIconKey;
  label: string;
  path: AppRootPath;
  Icon: LucideIcon;
}> = [
  { key: 'daily', label: '\uB370\uC77C\uB9AC', path: '/today', Icon: LucideSun },
  { key: 'tarot', label: '\uD0C0\uB85C', path: '/tarot', Icon: LucideSparkles },
  { key: 'home', label: '\uD648', path: '/', Icon: LucideHouse },
  { key: 'saju', label: '\uC0AC\uC8FC', path: '/saju', Icon: LucideGrid },
  { key: 'iching', label: '\uC8FC\uC5ED', path: '/iching', Icon: LucideClock },
];

function TabGlyph({
  Icon,
  active,
  home,
}: {
  Icon: LucideIcon;
  active: boolean;
  home: boolean;
}): React.JSX.Element {
  const color = home ? APP_THEME.colors.bg : active ? '#FFFFFF' : 'rgba(248,250,255,0.84)';
  const size = home ? 28 : 20;

  return (
    <Icon
      size={size}
      color={color}
      strokeWidth={home ? 2.1 : 2}
      absoluteStrokeWidth
    />
  );
}

export function BottomTabs({
  activePath,
  currentPath = activePath,
  navigation,
  onReselect,
}: {
  activePath: AppRootPath;
  currentPath?: string;
  navigation: { navigate: (options: { name: string; params?: Record<string, unknown> }) => void };
  onReselect?: (path: AppRootPath) => void;
}): React.JSX.Element {
  const { width, height } = useWindowDimensions();
  const compactWidth = width < 380;
  const compactHeight = height < 760;
  const bubbleSize = compactWidth ? 36 : 40;
  const homeBubbleSize = compactWidth || compactHeight ? 56 : 60;

  return (
    <View style={[styles.shell, compactHeight && styles.shellCompact]}>
      <View style={styles.bar}>
        {TAB_META.map((tab) => {
          const active = tab.path === activePath;
          const isHome = tab.path === '/';

          return (
            <Pressable
              key={tab.path}
              accessibilityRole="button"
              accessibilityState={active ? { selected: true } : {}}
              onPress={() => {
                if (active) {
                  if (onReselect) {
                    onReselect(tab.path);
                    return;
                  }

                  if (currentPath !== tab.path) {
                    navigation.navigate({ name: tab.path, params: { reset: String(Date.now()) } });
                  }
                  return;
                }

                navigation.navigate({ name: tab.path, params: { reset: String(Date.now()) } });
              }}
              style={({ pressed }) => [
                styles.item,
                isHome && styles.homeItem,
                active && !isHome && styles.itemActive,
                pressed && styles.pressed,
              ]}
            >
              <View
                style={[
                  styles.iconWrap,
                  {
                    width: isHome ? homeBubbleSize : bubbleSize,
                    height: isHome ? homeBubbleSize : bubbleSize,
                  },
                  active && !isHome && styles.iconWrapActive,
                  isHome && styles.homeIconWrap,
                ]}
              >
                <TabGlyph Icon={tab.Icon} active={active} home={isHome} />
              </View>
              <Text style={[styles.label, compactWidth && styles.labelCompact, active && styles.labelActive]}>
                {tab.label}
              </Text>
              {active && !isHome ? <View style={styles.activeDot} /> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: 'rgba(7, 11, 22, 0.94)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 9,
    paddingBottom: 9,
    paddingHorizontal: 10,
  },
  shellCompact: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 2,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  itemActive: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  homeItem: {
    flex: 1.2,
    marginTop: -20,
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.992 }],
  },
  iconWrap: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  iconWrapActive: {
    backgroundColor: 'rgba(247, 201, 72, 0.16)',
    borderColor: 'rgba(247, 201, 72, 0.38)',
  },
  homeIconWrap: {
    backgroundColor: APP_THEME.colors.accent,
    borderColor: APP_THEME.colors.accent,
    shadowColor: APP_THEME.colors.accent,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 8,
  },
  label: {
    color: 'rgba(248,250,255,0.82)',
    marginTop: 5,
    fontSize: 10.6,
    fontWeight: '700',
    textAlign: 'center',
  },
  labelCompact: {
    fontSize: 10,
  },
  labelActive: {
    color: '#FFFFFF',
  },
  activeDot: {
    marginTop: 4,
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: APP_THEME.colors.accent,
  },
});
