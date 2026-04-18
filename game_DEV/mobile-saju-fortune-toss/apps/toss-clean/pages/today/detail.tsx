import { createRoute } from '@granite-js/react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ImageSourcePropType,
} from 'react-native';

import type { GraniteAssetSource } from '../../src/features/assets/bundled';
import { getDailyCatalogItem } from '../../src/features/today/catalog';
import {
  buildDailySections,
  kstDateKey,
  yearsForChineseZodiac,
  type ChineseZodiacKey,
} from '../../src/features/today/daily';
import { registerAstraChecklistVisit } from '../../src/features/astra/affection';
import { AppShell } from '../../src/ui/AppShell';
import { APP_THEME } from '../../src/ui/theme';

export const Route = createRoute('/today/detail', {
  component: Page,
});

const TITLE_TODAY = '\uC624\uB298\uC758 \uC6B4\uC138';
const LABEL_BACK = '\uC624\uB298\uC758 \uC6B4\uC138\uB85C';
const LABEL_SELECT_YEAR = '\uD0DC\uC5B4\uB09C \uD574\uB97C \uC120\uD0DD\uD558\uC138\uC694';
const LABEL_EMPTY_OPTION = '\uC120\uD0DD\uD55C \uD56D\uBAA9\uC774 \uC5C6\uC5B4\uC694';

function toNativeImageSource(source?: GraniteAssetSource): ImageSourcePropType | undefined {
  if (!source?.uri) {
    return undefined;
  }
  return { uri: source.uri };
}

function Page(): React.JSX.Element {
  const navigation = Route.useNavigation();
  const { width, height } = useWindowDimensions();
  const params = (Route.useParams() ?? {}) as Record<string, unknown>;

  const kind = typeof params.kind === 'string' && params.kind === 'chinese' ? 'chinese' : 'western';
  const key = typeof params.key === 'string' ? params.key : '';
  const option = getDailyCatalogItem(kind, key);
  const dateKey = useMemo(() => kstDateKey(), []);
  const compactWidth = width < 380;
  const detailHeroSource = toNativeImageSource(option?.detailHero ?? option?.detail ?? option?.icon);
  const detailUnderlaySource = toNativeImageSource(option?.detailUnderlay ?? undefined);
  const heroAspectRatio = option?.detailHeroAspectRatio ?? 0.78;
  const squareHero = heroAspectRatio >= 0.96;
  const heroResizeMode = option?.detailHeroResizeMode ?? (squareHero ? 'cover' : 'contain');
  const heroWidth = squareHero
      ? compactWidth
        ? '94%'
        : '90%'
      : compactWidth
        ? '84%'
        : '78%';
  const heroMaxHeight = squareHero
    ? Math.min(320, Math.max(228, Math.round(height * 0.34)))
    : Math.min(324, Math.max(212, Math.round(height * 0.4)));

  useEffect(() => {
    if (!option) {
      return;
    }
    void registerAstraChecklistVisit('today', 'detail');
  }, [kind, key, option]);

  const yearChoices = useMemo(() => {
    if (kind !== 'chinese' || !option) return [];
    return yearsForChineseZodiac(option.key as ChineseZodiacKey);
  }, [kind, option]);

  const [selectedYear, setSelectedYear] = useState<number | null>(yearChoices[2] ?? yearChoices[0] ?? null);
  const seedKey = useMemo(() => {
    if (!option) return 'today:fallback';
    if (kind === 'western') return `western:${option.key}`;
    return `chinese:${option.key}:${selectedYear ?? yearChoices[2] ?? yearChoices[0] ?? 1996}`;
  }, [kind, option, selectedYear, yearChoices]);

  const sections = useMemo(() => buildDailySections(dateKey, seedKey), [dateKey, seedKey]);

  return (
    <AppShell
      activePath="/today"
      currentPath="/today/detail"
      navigation={navigation}
      title={option ? `${option.name} \uC6B4\uC138` : TITLE_TODAY}
      onTabReselect={() => navigation.navigate({ name: '/today', params: { reset: String(Date.now()) } })}
    >
      <Pressable
        onPress={() => navigation.navigate({ name: '/today', params: { reset: String(Date.now()) } })}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
      >
        <Text style={styles.backButtonText}>{LABEL_BACK}</Text>
      </Pressable>

      <View style={styles.hero}>
        <Text style={styles.heroKicker}>{kind === 'western' ? 'ASTRA ZODIAC' : 'ASTRA ANIMAL'}</Text>
        <Text style={[styles.heroTitle, compactWidth && styles.heroTitleCompact]}>
          {option?.name ?? LABEL_EMPTY_OPTION}
        </Text>
        <View style={styles.heroVisual}>
          <View
            style={[
              styles.heroImageFrame,
              {
                aspectRatio: heroAspectRatio,
                width: heroWidth,
                maxHeight: heroMaxHeight,
              },
            ]}
          >
            {detailUnderlaySource ? (
              <Image
                source={detailUnderlaySource}
                style={[styles.heroImageLayer, styles.heroImageUnderlay]}
                resizeMode="cover"
                fadeDuration={0}
              />
            ) : null}
            {detailHeroSource ? (
              <Image
                source={detailHeroSource}
                style={styles.heroImageLayer}
                resizeMode={heroResizeMode}
                fadeDuration={0}
              />
            ) : (
              <View style={[styles.heroImageLayer, styles.heroImageFallback]}>
                <Text style={styles.heroImageFallbackText}>{option?.name ?? LABEL_EMPTY_OPTION}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {kind === 'chinese' && yearChoices.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{LABEL_SELECT_YEAR}</Text>
          <View style={styles.chipRow}>
            {yearChoices.map((year) => (
              <Pressable
                key={year}
                onPress={() => setSelectedYear(year)}
                style={({ pressed }) => [
                  styles.yearChip,
                  selectedYear === year && styles.yearChipActive,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.yearChipText, selectedYear === year && styles.yearChipTextActive]}>
                  {String(year)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.sectionCard}>
            {section.lines.map((line) => (
              <Text key={line} style={styles.sectionLine}>
                {line}
              </Text>
            ))}
          </View>
        </View>
      ))}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  backButtonText: {
    color: APP_THEME.colors.textOnDark,
    fontSize: 12,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  hero: {
    borderRadius: 24,
    backgroundColor: APP_THEME.colors.panel,
    borderWidth: 1,
    borderColor: APP_THEME.colors.line,
    paddingHorizontal: 18,
    paddingVertical: 15,
    gap: 6,
  },
  heroKicker: {
    color: APP_THEME.colors.accent,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  heroTitle: {
    color: APP_THEME.colors.textOnDark,
    fontSize: 24,
    fontWeight: '900',
  },
  heroTitleCompact: {
    fontSize: 21,
  },
  heroVisual: {
    paddingTop: 6,
    alignItems: 'center',
  },
  heroImageFrame: {
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#F5F1E8',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    minHeight: 208,
  },
  heroImageLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  heroImageUnderlay: {
    opacity: 0.08,
  },
  heroImageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  heroImageFallbackText: {
    color: APP_THEME.colors.text,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: APP_THEME.colors.textOnDark,
    fontSize: 18,
    fontWeight: '900',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  yearChip: {
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: APP_THEME.colors.card,
    borderWidth: 1,
    borderColor: '#E6DDCF',
  },
  yearChipActive: {
    backgroundColor: '#FFF1BF',
    borderColor: APP_THEME.colors.accent,
  },
  yearChipText: {
    color: APP_THEME.colors.text,
    fontSize: 12,
    fontWeight: '900',
  },
  yearChipTextActive: {
    color: APP_THEME.colors.text,
  },
  sectionCard: {
    borderRadius: 22,
    backgroundColor: APP_THEME.colors.card,
    borderWidth: 1,
    borderColor: '#E6DDCF',
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 6,
  },
  sectionLine: {
    color: APP_THEME.colors.text,
    fontSize: 12.2,
    lineHeight: 17,
  },
});
