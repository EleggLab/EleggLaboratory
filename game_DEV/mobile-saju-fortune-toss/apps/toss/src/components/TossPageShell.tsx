import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { UI } from '../legacy/lib/ui/tokens';
import type { MiniRootTabPath } from '../platform/miniRouteContext';

const TAB_META: Array<{ bubble: string; label: string; path: MiniRootTabPath }> = [
  { bubble: '일', label: '데일리', path: '/today' },
  { bubble: '타', label: '타로', path: '/tarot' },
  { bubble: '홈', label: '홈', path: '/' },
  { bubble: '사', label: '사주', path: '/saju' },
  { bubble: '역', label: '주역', path: '/iching' },
];

export function TossPageShell({
  activeTab,
  children,
  footerSlot,
  onBackPress,
  onTabPress,
  title,
}: PropsWithChildren<{
  activeTab?: MiniRootTabPath;
  footerSlot?: ReactNode;
  onBackPress?: () => void;
  onTabPress?: (path: MiniRootTabPath) => void;
  title: string;
}>): React.JSX.Element {
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.navRow}>
          <View style={styles.navSide}>
            {onBackPress ? (
              <Pressable
                accessibilityLabel="뒤로"
                accessibilityRole="button"
                onPress={onBackPress}
                style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
              >
                <Text style={styles.backButtonGlyph}>{'<'}</Text>
                <Text style={styles.backButtonText}>뒤로</Text>
              </Pressable>
            ) : (
              <View style={styles.navSpacer} />
            )}
          </View>
          <View style={styles.navCenter}>
            <Text numberOfLines={1} style={styles.navTitle}>
              {title}
            </Text>
          </View>
          <View style={styles.navSide}>
            <View style={styles.navSpacer} />
          </View>
        </View>
      </View>

      <View style={styles.content}>{children}</View>

      {footerSlot ? <View style={styles.footerSlot}>{footerSlot}</View> : null}

      {activeTab && onTabPress ? (
        <View style={styles.tabShell}>
          <View style={styles.tabBar}>
            {TAB_META.map((tab) => {
              const active = tab.path === activeTab;
              const isHome = tab.path === '/';

              return (
                <Pressable
                  key={tab.path}
                  accessibilityRole="button"
                  accessibilityState={active ? { selected: true } : {}}
                  onPress={() => onTabPress(tab.path)}
                  style={({ pressed }) => [
                    styles.tabItem,
                    isHome && styles.homeItem,
                    active && !isHome && styles.tabItemActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <View
                    style={[
                      styles.tabBubble,
                      isHome && styles.homeBubble,
                      active && !isHome && styles.tabBubbleActive,
                    ]}
                  >
                    <Text style={[styles.tabBubbleText, isHome && styles.homeBubbleText]}>{tab.bubble}</Text>
                  </View>
                  <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
                  {active && !isHome ? <View style={styles.activeDot} /> : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: UI.colors.ink,
  },
  header: {
    backgroundColor: '#fffdf9',
    borderBottomWidth: 1,
    borderBottomColor: '#ece5da',
    paddingTop: 10,
    paddingBottom: 12,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  navSide: {
    width: 72,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  navCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  backButton: {
    minHeight: 34,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backButtonGlyph: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 18,
  },
  backButtonText: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '800',
  },
  navSpacer: {
    width: 56,
    minHeight: 34,
  },
  content: {
    flex: 1,
  },
  footerSlot: {
    backgroundColor: UI.colors.ink,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  tabShell: {
    backgroundColor: UI.colors.ink,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: 6,
    borderRadius: 18,
  },
  tabItemActive: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  homeItem: {
    flex: 1.15,
    marginTop: -22,
  },
  tabBubble: {
    minWidth: 46,
    height: 46,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  tabBubbleActive: {
    backgroundColor: 'rgba(247,201,72,0.22)',
    borderColor: 'rgba(247,201,72,0.66)',
  },
  homeBubble: {
    minWidth: 62,
    height: 62,
    backgroundColor: UI.colors.gold,
    borderColor: UI.colors.gold,
    shadowColor: UI.colors.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  tabBubbleText: {
    color: '#f2f1ef',
    fontSize: 15,
    fontWeight: '900',
  },
  homeBubbleText: {
    color: UI.colors.ink,
    fontSize: 16,
  },
  tabLabel: {
    marginTop: 6,
    color: 'rgba(242,241,239,0.85)',
    fontSize: 11,
    fontWeight: '700',
  },
  tabLabelActive: {
    color: '#ffffff',
  },
  activeDot: {
    marginTop: 4,
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: UI.colors.gold,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
});
