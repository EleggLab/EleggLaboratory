import { createRoute } from '@granite-js/react-native';
import React, { useMemo, useRef, useState } from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { TAROT_DECK, spreadFor, type TarotReadingType } from '../../src/features/tarot/deck';
import { registerAstraChecklistVisit } from '../../src/features/astra/affection';
import { TAROT_CARD_BACK_DATA_URI_IMAGE } from '../../src/features/assets/registry';
import { tarotImageSource } from '../../src/features/tarot/imageSource';
import {
  encodeTarotCards,
  isTarotReadingType,
  tarotCardLabel,
  type TarotDrawnCard,
} from '../../src/features/tarot/model';
import { hashSeed, makeRng, shuffle } from '../../src/features/tarot/random';
import { AppShell } from '../../src/ui/AppShell';
import { SmartImage } from '../../src/ui/SmartImage';
import { APP_THEME } from '../../src/ui/theme';

export const Route = createRoute('/tarot/reading', {
  component: Page,
});

const TITLE_PICK = '\uCE74\uB4DC \uC120\uD0DD';
const LABEL_RESHUFFLE = '\uB2E4\uC2DC \uC11E\uAE30';
const LABEL_COMPLETE = '\uC120\uD0DD \uC644\uB8CC';
const LABEL_BACK = '\uD0C0\uB85C \uD5C8\uBE0C\uB85C';
const LABEL_PICKED = '\uC120\uD0DD';

function Page(): React.JSX.Element {
  const navigation = Route.useNavigation();
  const { width } = useWindowDimensions();
  const params = (Route.useParams() ?? {}) as Record<string, unknown>;
  const type: TarotReadingType =
    typeof params.type === 'string' && isTarotReadingType(params.type) ? params.type : 'today';
  const spread = useMemo(() => spreadFor(type), [type]);
  const compactWidth = width < 380;
  const cardColumns = width < 430 ? 3 : 4;
  const cardGap = compactWidth ? 8 : 10;
  const contentWidth = Math.max(width - 28, 260);
  const cardWidth = Math.floor((contentWidth - cardGap * (cardColumns - 1)) / cardColumns);

  const [seed, setSeed] = useState<number>(() => Date.now());
  const [selected, setSelected] = useState<TarotDrawnCard[]>([]);
  const shuffleMotion = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    void registerAstraChecklistVisit('tarot', 'detail');
  }, [type]);

  const order = useMemo(() => {
    const rng = makeRng(hashSeed(`tarot-order:${type}:${seed}`));
    return shuffle(TAROT_DECK, rng);
  }, [seed, type]);

  const reversedById = useMemo(() => {
    const rng = makeRng(hashSeed(`tarot-reversed:${type}:${seed}`));
    return Object.fromEntries(TAROT_DECK.map((card) => [card.id, rng() < 0.5])) as Record<string, boolean>;
  }, [seed, type]);

  const toggleCard = (cardId: string) => {
    setSelected((current) => {
      const existing = current.find((card) => card.id === cardId);
      if (existing) {
        return current.filter((card) => card.id !== cardId);
      }
      if (current.length >= spread.count) {
        return current;
      }
      return [...current, { id: cardId, reversed: reversedById[cardId] ?? false }];
    });
  };

  const reshuffle = () => {
    setSelected([]);
    setSeed(Date.now());
    shuffleMotion.setValue(0);
    Animated.sequence([
      Animated.timing(shuffleMotion, {
        toValue: 1,
        duration: 150,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(shuffleMotion, {
        toValue: 0,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const complete = () => {
    if (selected.length !== spread.count) return;
    navigation.navigate({
      name: '/tarot/result',
      params: {
        type,
        cards: encodeTarotCards(selected),
      },
    });
  };

  return (
    <AppShell
      activePath="/tarot"
      currentPath="/tarot/reading"
      navigation={navigation}
      title={TITLE_PICK}
      contentStyle={styles.pageContent}
      onTabReselect={() => navigation.navigate({ name: '/tarot', params: { reset: String(Date.now()) } })}
    >
      <View style={[styles.toolbar, compactWidth && styles.toolbarCompact]}>
        <Text style={styles.counter}>
          {LABEL_PICKED} {selected.length}/{spread.count}
        </Text>
        <View style={[styles.toolbarActions, compactWidth && styles.toolbarActionsCompact]}>
          <Pressable onPress={reshuffle} style={({ pressed }) => [styles.smallButton, pressed && styles.pressed]}>
            <Text style={styles.smallButtonText}>{LABEL_RESHUFFLE}</Text>
          </Pressable>
          <Pressable
            onPress={complete}
            style={({ pressed }) => [
              styles.smallButton,
              styles.primaryButton,
              selected.length !== spread.count && styles.disabledButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.smallButtonText, styles.primaryButtonText]}>{LABEL_COMPLETE}</Text>
          </Pressable>
        </View>
      </View>

      <Animated.View
        style={[
          styles.grid,
          { rowGap: cardGap, columnGap: cardGap },
          {
            opacity: shuffleMotion.interpolate({
              inputRange: [0, 0.14, 0.42, 1],
              outputRange: [1, 0.92, 0.84, 1],
            }),
            transform: [
              {
                scale: shuffleMotion.interpolate({
                  inputRange: [0, 0.4, 1],
                  outputRange: [1, 0.982, 1],
                }),
              },
              {
                rotate: shuffleMotion.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: ['0deg', '-1deg', '0deg'],
                }),
              },
              {
                translateY: shuffleMotion.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, -3, 0],
                }),
              },
            ],
          },
        ]}
      >
        {order.map((card) => {
          const pickedCard = selected.find((picked) => picked.id === card.id);
          const pickedIndex = pickedCard ? selected.findIndex((picked) => picked.id === card.id) : -1;
          const picked = pickedIndex >= 0;
          const disabled = !picked && selected.length >= spread.count;

          return (
            <Pressable
              key={card.id}
              onPress={() => toggleCard(card.id)}
              style={({ pressed }) => [
                styles.cardShell,
                { width: cardWidth, minWidth: cardWidth, borderRadius: 18 },
                picked && styles.cardShellPicked,
                disabled && styles.cardShellDisabled,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.cardFrame}>
                <View style={styles.cardInner}>
                  {picked ? (
                    <SmartImage
                      source={tarotImageSource(card)}
                      style={[
                        styles.cardImage,
                        pickedCard?.reversed ? styles.cardImageReversed : null,
                      ]}
                      resizeMode="cover"
                      label={tarotCardLabel(card.id)}
                      placeholderStyle={styles.cardImageFallback}
                      labelStyle={styles.cardImageFallbackText}
                    />
                  ) : (
                    <View style={styles.cardBack}>
                      <Image source={TAROT_CARD_BACK_DATA_URI_IMAGE} style={styles.cardBackImage} resizeMode="cover" />
                      <View style={styles.cardBackShade} />
                    </View>
                  )}
                </View>
              </View>
              {picked ? (
                <>
                  <View style={styles.pickBadge}>
                    <Text style={styles.pickBadgeText}>{pickedIndex + 1}</Text>
                  </View>
                  {pickedCard?.reversed ? (
                    <View style={styles.reverseBadge}>
                      <Text style={styles.reverseBadgeText}>{'\uC5ED\uBC29\uD5A5'}</Text>
                    </View>
                  ) : null}
                </>
              ) : null}
            </Pressable>
          );
        })}
      </Animated.View>

      <Pressable
        onPress={() => navigation.navigate({ name: '/tarot', params: { reset: String(Date.now()) } })}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
      >
        <Text style={styles.backButtonText}>{LABEL_BACK}</Text>
      </Pressable>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  pageContent: {
    paddingBottom: 112,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
  },
  toolbarCompact: {
    flexWrap: 'wrap',
  },
  counter: {
    color: APP_THEME.colors.textOnDark,
    fontSize: 12.5,
    fontWeight: '900',
  },
  toolbarActions: {
    flexDirection: 'row',
    gap: 8,
  },
  toolbarActionsCompact: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  smallButton: {
    borderRadius: 13,
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: APP_THEME.colors.card,
    borderWidth: 1,
    borderColor: '#E6DDCF',
  },
  primaryButton: {
    backgroundColor: APP_THEME.colors.accent,
    borderColor: APP_THEME.colors.accent,
  },
  disabledButton: {
    opacity: 0.45,
  },
  smallButtonText: {
    color: APP_THEME.colors.text,
    fontSize: 9.4,
    fontWeight: '900',
  },
  primaryButtonText: {
    color: APP_THEME.colors.bg,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cardShell: {
    aspectRatio: 2 / 3,
    borderRadius: 18,
    position: 'relative',
  },
  cardShellPicked: {
    transform: [{ translateY: -2 }],
  },
  cardShellDisabled: {
    opacity: 0.48,
  },
  cardFrame: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#171E30',
    borderWidth: 1,
    borderColor: 'rgba(247,201,72,0.35)',
    padding: 3,
  },
  cardInner: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#101827',
  },
  cardBack: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0E1628',
  },
  cardBackImage: {
    ...StyleSheet.absoluteFillObject,
  },
  cardBackShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 10, 20, 0.1)',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImageReversed: {
    transform: [{ rotate: '180deg' }],
  },
  cardImageFallback: {
    borderRadius: 10,
  },
  cardImageFallbackText: {
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  pickBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: APP_THEME.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickBadgeText: {
    color: APP_THEME.colors.bg,
    fontSize: 11,
    fontWeight: '900',
  },
  reverseBadge: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 7,
    backgroundColor: 'rgba(11,16,32,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  reverseBadgeText: {
    color: '#F7F4EE',
    fontSize: 8.4,
    fontWeight: '900',
  },
  backButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  backButtonText: {
    color: APP_THEME.colors.textOnDark,
    fontSize: 12,
    fontWeight: '900',
  },
});
