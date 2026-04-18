import React, { type PropsWithChildren } from 'react';
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ViewStyle,
} from 'react-native';

import { BottomTabs } from './BottomTabs';
import { APP_THEME, type AppRootPath } from './theme';

export function AppShell({
  activePath,
  currentPath = activePath,
  navigation,
  title,
  subtitle: _subtitle,
  contentStyle,
  scrollEnabled = true,
  onTabReselect,
  children,
}: PropsWithChildren<{
  activePath: AppRootPath;
  currentPath?: string;
  navigation: { navigate: (options: { name: string; params?: Record<string, unknown> }) => void };
  title: string;
  subtitle?: string;
  contentStyle?: ViewStyle;
  scrollEnabled?: boolean;
  onTabReselect?: (path: AppRootPath) => void;
}>): React.JSX.Element {
  const { width, height } = useWindowDimensions();
  const compactWidth = width < 380;
  const compactHeight = height < 760;

  return (
    <View style={styles.safeArea}>
      <View style={styles.root}>
        <View
          style={[
            styles.header,
            compactWidth && styles.headerCompactWidth,
            compactHeight && styles.headerCompactHeight,
          ]}
        >
          <Text style={styles.brand}>ASTRA</Text>
          <Text style={styles.separator}>/</Text>
          <Text numberOfLines={1} style={styles.title}>
            {title}
          </Text>
        </View>

        {scrollEnabled ? (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
              styles.content,
              compactWidth && styles.contentCompactWidth,
              compactHeight && styles.contentCompactHeight,
              contentStyle,
            ]}
            showsVerticalScrollIndicator={false}
            bounces={false}
            scrollEnabled
            overScrollMode="never"
          >
            {children}
          </ScrollView>
        ) : (
          <View style={styles.staticBody}>
            <View
              style={[
                styles.content,
                styles.contentFill,
                compactWidth && styles.contentCompactWidth,
                compactHeight && styles.contentCompactHeight,
                contentStyle,
              ]}
            >
              {children}
            </View>
          </View>
        )}

        <BottomTabs
          activePath={activePath}
          currentPath={currentPath}
          navigation={navigation}
          onReselect={onTabReselect}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: APP_THEME.colors.bg,
  },
  root: {
    flex: 1,
    backgroundColor: APP_THEME.colors.bg,
    paddingTop: Platform.OS === 'android' ? Math.max(StatusBar.currentHeight ?? 0, 4) : 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingTop: 1,
    paddingBottom: 0,
  },
  headerCompactWidth: {
    paddingHorizontal: 12,
  },
  headerCompactHeight: {
    paddingTop: 2,
    paddingBottom: 3,
  },
  brand: {
    color: APP_THEME.colors.accent,
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  separator: {
    color: 'rgba(255,255,255,0.44)',
    fontSize: 8.5,
    fontWeight: '900',
  },
  title: {
    flex: 1,
    color: APP_THEME.colors.textOnDark,
    fontSize: 11.5,
    fontWeight: '900',
  },
  scroll: {
    flex: 1,
  },
  staticBody: {
    flex: 1,
    minHeight: 0,
  },
  content: {
    paddingHorizontal: 12,
    paddingTop: 0,
    paddingBottom: 4,
    gap: 6,
  },
  contentCompactWidth: {
    paddingHorizontal: 12,
    gap: 9,
  },
  contentCompactHeight: {
    paddingBottom: 8,
    gap: 8,
  },
  contentFill: {
    flexGrow: 1,
    flex: 1,
    minHeight: 0,
  },
});
