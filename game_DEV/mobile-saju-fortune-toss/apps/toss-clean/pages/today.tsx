import { createRoute } from '@granite-js/react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ImageSourcePropType,
  type LayoutChangeEvent,
} from 'react-native';

import type { GraniteAssetSource } from '../src/features/assets/bundled';
import { CHINESE_DAILY_OPTIONS, WESTERN_DAILY_OPTIONS } from '../src/features/today/catalog';
import { registerAstraChecklistVisit } from '../src/features/astra/affection';
import { AppShell } from '../src/ui/AppShell';
import { APP_THEME } from '../src/ui/theme';
import { useTopLevelBackBehavior } from '../src/ui/useTopLevelBackBehavior';

export const Route = createRoute('/today', {
  component: Page,
});

type TodayTab = 'western' | 'chinese';

const LABEL_WESTERN = '\uBCC4\uC790\uB9AC';
const LABEL_CHINESE = '\uC0DD\uB144\uC6D4\uC77C';
const GRID_HEADER_BY_TAB: Record<TodayTab, string> = {
  western: '\uBCC4\uC790\uB9AC',
  chinese: '12\uC9C0\uC2E0',
};

function toNativeImageSource(source?: GraniteAssetSource): ImageSourcePropType | undefined {
  if (!source?.uri) {
    return undefined;
  }
  return { uri: source.uri };
}

function DailyTileVisual({
  item,
  kicker,
}: {
  item: (typeof WESTERN_DAILY_OPTIONS | typeof CHINESE_DAILY_OPTIONS)[number];
  kicker: string;
}): React.JSX.Element {
  const visualSource = toNativeImageSource(item.tileIcon ?? item.icon);
  const scale = item.iconScale ?? 1.06;
  const translateX = item.iconTranslateX ?? 0;
  const translateY = item.iconTranslateY ?? 0;

  return (
    <View style={styles.tileStage}>
      {visualSource ? (
        <Image
          source={visualSource}
          style={[
            styles.tileImage,
            {
              transform: [{ translateX }, { translateY }, { scale }],
            },
          ]}
          resizeMode="cover"
          fadeDuration={0}
        />
      ) : (
        <View style={[styles.tileImageFallback, styles.tileImage]}>
          <Text style={styles.tileImageFallbackText}>{item.name}</Text>
        </View>
      )}
      <View style={styles.tileHighlight} />
      <View style={styles.tileShade} />
      <View style={styles.tileTextWrap}>
        <Text numberOfLines={1} style={styles.tileKicker}>
          {kicker}
        </Text>
        <Text numberOfLines={2} ellipsizeMode="tail" style={styles.tileLabel}>
          {item.name}
        </Text>
      </View>
    </View>
  );
}

function Page(): React.JSX.Element {
  const navigation = Route.useNavigation();
  const params = (Route.useParams() ?? {}) as Record<string, unknown>;
  const resetToken = typeof params.reset === 'string' ? params.reset : '';
  const { width, height } = useWindowDimensions();
  const [tab, setTab] = useState<TodayTab>('western');
  const [gridViewport, setGridViewport] = useState({ width: 0, height: 0 });

  useTopLevelBackBehavior({ activePath: '/today', navigation });

  useEffect(() => {
    setTab('western');
  }, [resetToken]);

  useEffect(() => {
    void registerAstraChecklistVisit('today', 'root');
  }, [resetToken]);

  const compactWidth = width < 380;
  const compactHeight = height < 760;
  const isWesternTab = tab === 'western';
  const items = tab === 'western' ? WESTERN_DAILY_OPTIONS : CHINESE_DAILY_OPTIONS;
  const columnCount = 3;
  const rows = 4;
  const gridGap = compactWidth ? 8 : 9;
  const shellWidth = gridViewport.width || Math.max(width - 24, 280);
  const tileWidth = Math.floor((shellWidth - gridGap * (columnCount - 1)) / columnCount);
  const viewportHeight = gridViewport.height || Math.max(height - (compactHeight ? 266 : 294), 424);
  const reservedBottom = compactHeight ? 34 : 42;
  const safeViewportHeight = Math.max(viewportHeight - reservedBottom, 344);
  const availableTileHeight = Math.floor((safeViewportHeight - gridGap * (rows - 1)) / rows);
  const tileHeight = Math.max(availableTileHeight, compactHeight ? 100 : 112);
  const tileKicker = isWesternTab ? LABEL_WESTERN : LABEL_CHINESE;

  const handleGridLayout = useCallback((event: LayoutChangeEvent) => {
    const { width: nextWidth, height: nextHeight } = event.nativeEvent.layout;
    setGridViewport((current) => {
      if (Math.abs(current.width - nextWidth) < 2 && Math.abs(current.height - nextHeight) < 2) {
        return current;
      }
      return { width: nextWidth, height: nextHeight };
    });
  }, []);

  const openItem = useCallback(
    (key: string) => {
      navigation.navigate({
        name: '/today/detail',
        params: {
          kind: tab === 'western' ? 'western' : 'chinese',
          key,
        },
      });
    },
    [navigation, tab],
  );

  return (
    <AppShell
      activePath="/today"
      currentPath="/today"
      navigation={navigation}
      title={'\uC624\uB298\uC758 \uC6B4\uC138'}
      scrollEnabled={false}
      onTabReselect={() => setTab('western')}
    >
      <View style={styles.page}>
        <View style={styles.tabRow}>
          <Pressable
            onPress={() => setTab('western')}
            style={({ pressed }) => [
              styles.tabButton,
              tab === 'western' && styles.tabButtonActive,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.tabText, tab === 'western' && styles.tabTextActive]}>{LABEL_WESTERN}</Text>
          </Pressable>
          <Pressable
            onPress={() => setTab('chinese')}
            style={({ pressed }) => [
              styles.tabButton,
              tab === 'chinese' && styles.tabButtonActive,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.tabText, tab === 'chinese' && styles.tabTextActive]}>{LABEL_CHINESE}</Text>
          </Pressable>
        </View>

        <View style={styles.gridHeader}>
          <Text style={styles.gridHeaderText}>{GRID_HEADER_BY_TAB[tab]}</Text>
        </View>

        <View style={styles.gridViewport} onLayout={handleGridLayout}>
          <View style={[styles.grid, { rowGap: gridGap, columnGap: gridGap }]}>
            {items.map((item) => (
              <Pressable
                key={item.key}
                onPress={() => openItem(item.key)}
                style={({ pressed }) => [
                  styles.tile,
                  {
                    width: tileWidth,
                    minWidth: tileWidth,
                    height: tileHeight,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <DailyTileVisual item={item} kicker={tileKicker} />
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    minHeight: 0,
    gap: 4,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 4,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tabButton: {
    flex: 1,
    minHeight: 36,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D6D3CE',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: APP_THEME.colors.cardSoft,
    borderColor: '#E8C86A',
  },
  tabText: {
    color: APP_THEME.colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  tabTextActive: {
    color: APP_THEME.colors.text,
  },
  gridHeader: {
    paddingHorizontal: 2,
    marginBottom: 1,
  },
  gridHeaderText: {
    color: APP_THEME.colors.textOnDark,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  gridViewport: {
    flex: 1,
    minHeight: 0,
    paddingBottom: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignContent: 'flex-start',
  },
  tile: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
    backgroundColor: '#171518',
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  tileStage: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#1B181D',
  },
  tileImage: {
    width: '100%',
    height: '100%',
  },
  tileImageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#26212A',
    paddingHorizontal: 10,
  },
  tileImageFallbackText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  tileHighlight: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    borderRadius: 18,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  tileShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7,5,10,0.26)',
  },
  tileTextWrap: {
    position: 'absolute',
    left: 6,
    right: 6,
    bottom: 4,
    paddingHorizontal: 8,
    paddingVertical: 9.5,
    borderRadius: 14,
    backgroundColor: 'rgba(7,6,10,0.38)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    gap: 2,
  },
  tileKicker: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 8.8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  tileLabel: {
    color: '#FFF8EA',
    fontSize: 10.9,
    fontWeight: '900',
    lineHeight: 13.2,
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.99 }],
  },
});
