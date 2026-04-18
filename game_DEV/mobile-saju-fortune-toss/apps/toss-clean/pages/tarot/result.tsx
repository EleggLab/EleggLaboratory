import { createRoute } from '@granite-js/react-native';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { TAROT_DECK } from '../../src/features/tarot/deck';
import { registerAstraChecklistVisit } from '../../src/features/astra/affection';
import { TAROT_IMAGE_CROP, tarotImageSource } from '../../src/features/tarot/imageSource';
import {
  buildTarotReading,
  isTarotReadingType,
  parseTarotCards,
  tarotCardLabel,
  tarotKeywordText,
  tarotOrientationLabel,
  titleForReading,
} from '../../src/features/tarot/model';
import { AppShell } from '../../src/ui/AppShell';
import { SmartImage } from '../../src/ui/SmartImage';
import { APP_THEME } from '../../src/ui/theme';

export const Route = createRoute('/tarot/result', {
  component: Page,
});

const LABEL_ERROR_TITLE = '\uCE74\uB4DC \uC815\uBCF4\uAC00 \uC544\uC9C1 \uC900\uBE44\uB418\uC9C0 \uC54A\uC558\uC5B4\uC694.';
const LABEL_ERROR_BODY =
  '\uD0C0\uB85C \uD5C8\uBE0C\uB85C \uB3CC\uC544\uAC00\uC11C \uB2E4\uC2DC \uD55C \uBC88 \uB9AC\uB529\uC744 \uC2DC\uC791\uD574 \uC8FC\uC138\uC694.';
const LABEL_READING = '\uD574\uC11D';
const LABEL_BACK = '\uD0C0\uB85C \uD5C8\uBE0C\uB85C';
const LABEL_RETRY = '\uB2E4\uC2DC \uBF51\uAE30';

function Page(): React.JSX.Element {
  const navigation = Route.useNavigation();
  const { width } = useWindowDimensions();
  const params = (Route.useParams() ?? {}) as Record<string, unknown>;
  const type = typeof params.type === 'string' && isTarotReadingType(params.type) ? params.type : 'today';
  const drawn = parseTarotCards(typeof params.cards === 'string' ? params.cards : undefined);
  const cardColumns = width < 360 ? 2 : 3;
  const cardWidth = Math.floor((Math.max(width - 40, 260) - 10 * (cardColumns - 1)) / cardColumns);

  const reading = useMemo(() => {
    if (!drawn) return '';
    return buildTarotReading(type, drawn);
  }, [drawn, type]);

  const cards = useMemo(() => {
    if (!drawn) return [];
    return drawn
      .map((drawnCard) => {
        const definition = TAROT_DECK.find((card) => card.id === drawnCard.id);
        if (!definition) return null;
        return {
          id: drawnCard.id,
          name: tarotCardLabel(drawnCard.id),
          orientation: tarotOrientationLabel(drawnCard.reversed),
          keywords: tarotKeywordText(drawnCard.id, drawnCard.reversed),
          image: tarotImageSource(definition),
          reversed: drawnCard.reversed,
        };
      })
      .filter(Boolean);
  }, [drawn]);

  React.useEffect(() => {
    if (!drawn || cards.length === 0) {
      return;
    }
    void registerAstraChecklistVisit('tarot', 'detail');
  }, [cards.length, drawn]);

  return (
    <AppShell
      activePath="/tarot"
      currentPath="/tarot/result"
      navigation={navigation}
      title={titleForReading(type)}
      onTabReselect={() => navigation.navigate({ name: '/tarot', params: { reset: String(Date.now()) } })}
    >
      {!drawn || cards.length === 0 ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>{LABEL_ERROR_TITLE}</Text>
          <Text style={styles.errorBody}>{LABEL_ERROR_BODY}</Text>
        </View>
      ) : (
        <>
          <View style={styles.cardList}>
            {cards.map((card) => (
              <View key={card?.id} style={[styles.resultCard, { width: cardWidth }]}>
                <View style={styles.resultImageFrame}>
                  <View style={styles.resultImageInner}>
                    <SmartImage
                      source={card?.image}
                      style={[
                        styles.resultImage,
                        {
                          transform: [
                            { scale: TAROT_IMAGE_CROP.scale },
                            { translateY: TAROT_IMAGE_CROP.translateY },
                            ...(card?.reversed ? ([{ rotate: '180deg' }] as const) : []),
                          ],
                        },
                      ]}
                      resizeMode="contain"
                      label={card?.name}
                      placeholderStyle={styles.resultImageFallback}
                      labelStyle={styles.resultImageFallbackText}
                    />
                  </View>
                </View>
                <Text style={styles.resultCardName}>{card?.name}</Text>
                <Text style={styles.resultCardMeta}>{card?.orientation}</Text>
                <Text style={styles.resultCardKeywords}>{card?.keywords}</Text>
              </View>
            ))}
          </View>

          <View style={styles.readingCard}>
            <Text style={styles.readingTitle}>{LABEL_READING}</Text>
            <Text style={styles.readingText}>{reading}</Text>
          </View>
        </>
      )}

      <View style={styles.actions}>
        <Pressable
          onPress={() => navigation.navigate({ name: '/tarot', params: { reset: String(Date.now()) } })}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryButtonText}>{LABEL_BACK}</Text>
        </Pressable>
        <Pressable
          onPress={() => navigation.navigate({ name: '/tarot/reading', params: { type } })}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.primaryButtonText}>{LABEL_RETRY}</Text>
        </Pressable>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  errorCard: {
    borderRadius: 24,
    backgroundColor: APP_THEME.colors.card,
    borderWidth: 1,
    borderColor: '#E6DDCF',
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 8,
  },
  errorTitle: {
    color: APP_THEME.colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  errorBody: {
    color: '#4B5563',
    fontSize: 14,
    lineHeight: 22,
  },
  cardList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  resultCard: {
    borderRadius: 18,
    backgroundColor: APP_THEME.colors.card,
    borderWidth: 1,
    borderColor: '#E6DDCF',
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 4,
  },
  resultImageFrame: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: 14,
    backgroundColor: '#F4F1EB',
    borderWidth: 1,
    borderColor: '#D8D0C2',
    padding: 4,
    marginBottom: 2,
  },
  resultImageInner: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#FAF7F2',
  },
  resultImage: {
    width: '100%',
    height: '100%',
  },
  resultImageFallback: {
    borderRadius: 10,
  },
  resultImageFallbackText: {
    fontSize: 11,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  resultCardName: {
    color: APP_THEME.colors.text,
    fontSize: 13.5,
    fontWeight: '900',
  },
  resultCardMeta: {
    color: '#7C5F12',
    fontSize: 11,
    fontWeight: '800',
  },
  resultCardKeywords: {
    color: '#4B5563',
    fontSize: 10.5,
    lineHeight: 14,
  },
  readingCard: {
    borderRadius: 22,
    backgroundColor: APP_THEME.colors.card,
    borderWidth: 1,
    borderColor: '#E6DDCF',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 6,
  },
  readingTitle: {
    color: APP_THEME.colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  readingText: {
    color: APP_THEME.colors.text,
    fontSize: 12.5,
    lineHeight: 19,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: APP_THEME.colors.card,
    borderWidth: 1,
    borderColor: '#E6DDCF',
  },
  primaryButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: APP_THEME.colors.accent,
    borderWidth: 1,
    borderColor: APP_THEME.colors.accent,
  },
  secondaryButtonText: {
    color: APP_THEME.colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  primaryButtonText: {
    color: APP_THEME.colors.bg,
    fontSize: 14,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
});
