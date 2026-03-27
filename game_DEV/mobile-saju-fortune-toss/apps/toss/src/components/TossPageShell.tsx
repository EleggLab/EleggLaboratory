import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Navbar } from '@toss/tds-react-native';
import { UI } from '../legacy/lib/ui/tokens';
import { TOSS_RUNTIME_ENV } from '../config/runtimeEnv';
import type { MiniRootTabPath } from '../platform/miniRouteContext';

const TAB_META: Array<{ label: string; path: MiniRootTabPath }> = [
  { label: '오늘', path: '/today' },
  { label: '타로', path: '/tarot' },
  { label: '홈', path: '/' },
  { label: '사주', path: '/saju' },
  { label: '주역', path: '/iching' },
];

export function TossPageShell({
  activeTab,
  children,
  footerSlot,
  onBackPress,
  onTabPress,
  subtitle,
  title,
}: PropsWithChildren<{
  activeTab?: MiniRootTabPath;
  footerSlot?: ReactNode;
  onBackPress?: () => void;
  onTabPress?: (path: MiniRootTabPath) => void;
  subtitle?: string;
  title: string;
}>): React.JSX.Element {
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Navbar
          left={onBackPress ? <Navbar.BackButton onPress={onBackPress} /> : <View style={styles.navSpacer} />}
          title={title}
        />
        <View style={styles.headerCopy}>
          <Text style={styles.headerEyebrow}>{TOSS_RUNTIME_ENV.brandDisplayName}</Text>
          {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
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
                    <Text style={[styles.tabBubbleText, isHome && styles.homeBubbleText]}>{tab.label}</Text>
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
    paddingBottom: 10,
  },
  navSpacer: {
    width: 24,
  },
  headerCopy: {
    paddingHorizontal: 20,
    gap: 4,
  },
  headerEyebrow: {
    color: '#6b7280',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    color: '#4b5563',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
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
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
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
    fontSize: 12,
    fontWeight: '900',
  },
  homeBubbleText: {
    color: UI.colors.ink,
    fontSize: 15,
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
