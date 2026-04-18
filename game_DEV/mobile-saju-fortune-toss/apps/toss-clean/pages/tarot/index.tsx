import { createRoute } from '@granite-js/react-native';
import React, { useEffect } from 'react';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions, type ImageSourcePropType } from 'react-native';

import type { TarotReadingType } from '../../src/features/tarot/deck';
import { registerAstraChecklistVisit } from '../../src/features/astra/affection';
import {
  TAROT_HUB_HERO_DATA_URI_IMAGE,
  TAROT_MODE_LOVE_DATA_URI_IMAGE,
  TAROT_MODE_RELATIONSHIP_DATA_URI_IMAGE,
  TAROT_MODE_WEALTH_DATA_URI_IMAGE,
} from '../../src/features/assets/registry';
import { AppShell } from '../../src/ui/AppShell';
import { APP_THEME } from '../../src/ui/theme';
import { useTopLevelBackBehavior } from '../../src/ui/useTopLevelBackBehavior';

export const Route = createRoute('/tarot', {
  component: Page,
});

const TITLE_TAROT = '\uD0C0\uB85C \uB9AC\uB529';
const MODE_META: Array<{
  type: TarotReadingType;
  kicker: string;
  title: string;
  body: string;
  image?: ImageSourcePropType;
}> = [
  {
    type: 'love',
    kicker: 'LOVE',
    title: '\uC5F0\uC560\uC6B4',
    body: '\uB9C8\uC74C\uC758 \uAC70\uB9AC\uAC10',
    image: TAROT_MODE_LOVE_DATA_URI_IMAGE,
  },
  {
    type: 'money',
    kicker: 'MONEY',
    title: '\uAE08\uC804\uC6B4',
    body: '\uD750\uB974\uB294 \uB3C8\uC758 \uACB0',
    image: TAROT_MODE_WEALTH_DATA_URI_IMAGE,
  },
  {
    type: 'relationship',
    kicker: 'PEOPLE',
    title: '\uC778\uAC04\uAD00\uACC4\uC6B4',
    body: '\uC0AC\uB78C \uC0AC\uC774\uC758 \uC628\uB3C4',
    image: TAROT_MODE_RELATIONSHIP_DATA_URI_IMAGE,
  },
  {
    type: 'study',
    kicker: 'STUDY',
    title: '\uD559\uC5C5\uC6B4',
    body: '\uC9D1\uC911\uACFC \uC131\uACFC',
  },
];

function Page(): React.JSX.Element {
  const navigation = Route.useNavigation();
  const params = (Route.useParams() ?? {}) as Record<string, unknown>;
  const resetToken = typeof params.reset === 'string' ? params.reset : '';
  const { width, height } = useWindowDimensions();
  const compactWidth = width < 380;
  const compactHeight = height < 760;
  const gap = compactWidth ? 8 : 10;
  const contentWidth = Math.max(width - 24, 280);
  const modeWidth = Math.floor((contentWidth - gap) / 2);
  const heroHeight = compactHeight ? 142 : 152;
  const modeCardHeight = compactHeight ? 84 : 92;

  useTopLevelBackBehavior({ activePath: '/tarot', navigation });

  useEffect(() => {
    void registerAstraChecklistVisit('tarot', 'root');
  }, [resetToken]);

  const openReading = (type: TarotReadingType) => {
    navigation.navigate({ name: '/tarot/reading', params: { type, reset: resetToken } });
  };

  return (
    <AppShell
      activePath="/tarot"
      currentPath="/tarot"
      navigation={navigation}
      title={TITLE_TAROT}
      scrollEnabled={false}
      onTabReselect={() => {
        // Already at hub.
      }}
    >
      <View style={styles.page}>
        <View style={styles.guideBand}>
          <View style={styles.guideChip}>
            <View style={styles.guideDot} />
            <Text style={styles.guideChipText}>{'\uD55C \uBC88\uC5D0 \uD558\uB098\uC758 \uC9C8\uBB38\uB9CC \uC7A1\uC73C\uBA74 \uB354 \uC120\uBA85\uD574\uC694'}</Text>
          </View>
        </View>

        <Pressable
          onPress={() => openReading('today')}
          style={({ pressed }) => [
            styles.heroCard,
            { minHeight: heroHeight },
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.heroCopy}>
            <Text style={styles.heroKicker}>ASTRA TAROT</Text>
            <Text style={[styles.heroTitle, compactWidth && styles.heroTitleCompact]}>
              {'\uC624\uB298\uC758 \uC6B4\uC138'}
            </Text>
            <Text numberOfLines={2} style={styles.heroBody}>
              {'\uCE74\uB4DC \uD55C \uC7A5\uC73C\uB85C \uC624\uB298 \uD750\uB984\uACFC \uAE30\uBD84\uC758 \uACB0\uC744 \uAC00\uBC3D\uAC8C \uD655\uC778\uD574\uBCF4\uC138\uC694.'}
            </Text>

            <View style={styles.heroFooter}>
              <View style={styles.heroChip}>
                <Text style={styles.heroChipText}>{'\uD558\uB8E8 1\uD68C \uAE30\uBCF8 \uB9AC\uB529'}</Text>
              </View>
              <View style={styles.heroAction}>
                <Text style={styles.heroActionText}>{'\uCE74\uB4DC \uBCF4\uAE30'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.heroArtShell}>
            <Image source={TAROT_HUB_HERO_DATA_URI_IMAGE} style={styles.heroArtImage} resizeMode="cover" />
            <View style={styles.heroArtShade} />
            <View style={styles.heroArtGlow} />
          </View>
        </Pressable>

        <View style={[styles.grid, { gap }]}>
          {MODE_META.map((mode) => (
            <ModeCard
              key={mode.type}
              kicker={mode.kicker}
              title={mode.title}
              body={mode.body}
              width={modeWidth}
              height={modeCardHeight}
              image={mode.image}
              onPress={() => openReading(mode.type)}
            />
          ))}
        </View>
      </View>
    </AppShell>
  );
}

function ModeCard({
  kicker,
  title,
  body,
  width,
  height,
  image,
  onPress,
}: {
  kicker: string;
  title: string;
  body: string;
  width: number;
  height: number;
  image?: ImageSourcePropType;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.modeCard, { width, minHeight: height }, pressed && styles.pressed]}
    >
      <View style={styles.modeCopy}>
        <Text style={styles.modeKicker}>{kicker}</Text>
        <Text numberOfLines={1} style={styles.modeTitle}>
          {title}
        </Text>
        <Text numberOfLines={2} style={styles.modeBody}>
          {body}
        </Text>
      </View>

      {image ? (
        <View style={styles.modeArtWrap}>
          <Image source={image} style={styles.modeArtImage} resizeMode="cover" />
          <View style={styles.modeArtShade} />
        </View>
      ) : (
        <View style={styles.modeGlyphWrap}>
          <View style={styles.modeGlyphRing} />
          <View style={styles.modeGlyphCore} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: 6,
  },
  guideBand: {
    gap: 4,
  },
  guideChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: 'rgba(8,13,28,0.52)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  guideDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: APP_THEME.colors.accent,
  },
  guideChipText: {
    color: '#F2F1EF',
    fontSize: 9.8,
    fontWeight: '900',
  },
  heroCard: {
    flexDirection: 'row',
    borderRadius: 22,
    backgroundColor: '#121A2B',
    borderWidth: 1,
    borderColor: 'rgba(247,201,72,0.22)',
    overflow: 'hidden',
  },
  heroCopy: {
    flex: 1,
    paddingHorizontal: 13,
    paddingVertical: 11,
    justifyContent: 'space-between',
    gap: 3,
  },
  heroKicker: {
    color: '#F7C948',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  heroTitle: {
    color: '#F8FAFF',
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 20,
  },
  heroTitleCompact: {
    fontSize: 15.8,
    lineHeight: 18,
  },
  heroBody: {
    color: 'rgba(240,244,250,0.8)',
    fontSize: 10.2,
    lineHeight: 13.2,
    fontWeight: '700',
    maxWidth: 168,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  heroChip: {
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 7,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  heroChipText: {
    color: '#F7F4EE',
    fontSize: 8,
    fontWeight: '900',
  },
  heroAction: {
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 7,
    backgroundColor: 'rgba(247,201,72,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(247,201,72,0.28)',
  },
  heroActionText: {
    color: '#FFD979',
    fontSize: 8,
    fontWeight: '900',
  },
  heroArtShell: {
    width: '38%',
    minWidth: 104,
    backgroundColor: '#0F1627',
    position: 'relative',
  },
  heroArtImage: {
    ...StyleSheet.absoluteFillObject,
  },
  heroArtShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 13, 28, 0.22)',
  },
  heroArtGlow: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 226, 155, 0.12)',
    right: -18,
    top: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'flex-start',
    marginTop: 0,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 16,
    backgroundColor: '#F7F4EE',
    borderWidth: 1,
    borderColor: '#E6DDCF',
    overflow: 'hidden',
  },
  modeCopy: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 9,
    justifyContent: 'center',
    gap: 1,
  },
  modeKicker: {
    color: '#7C5F12',
    fontSize: 7.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  modeTitle: {
    color: APP_THEME.colors.text,
    fontSize: 11.6,
    fontWeight: '900',
    lineHeight: 13,
  },
  modeBody: {
    color: '#4B5563',
    fontSize: 8.1,
    lineHeight: 10.8,
    fontWeight: '700',
  },
  modeArtWrap: {
    width: '39%',
    minWidth: 52,
    position: 'relative',
    backgroundColor: '#131B2D',
  },
  modeArtImage: {
    ...StyleSheet.absoluteFillObject,
  },
  modeArtShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 11, 24, 0.14)',
  },
  modeGlyphWrap: {
    width: '32%',
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#131B2D',
  },
  modeGlyphRing: {
    width: 28,
    height: 28,
    borderRadius: 999,
    borderWidth: 1.2,
    borderColor: 'rgba(247,201,72,0.48)',
  },
  modeGlyphCore: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(247,201,72,0.64)',
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.992 }],
  },
});
