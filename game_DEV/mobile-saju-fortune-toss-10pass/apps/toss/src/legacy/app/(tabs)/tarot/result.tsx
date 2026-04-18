import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Button } from '@toss/tds-react-native';

import { TAROT_DECK, type TarotReadingType } from '../../../lib/features/tarot/deck';
import { buildTarotReading, isTarotReadingType, parseDrawnCards } from '../../../lib/features/tarot/helpers';
import { TAROT_IMAGE_CROP, tarotImageSource } from '../../../lib/features/tarot/imageSource';
import { loadTodayTarot, type TarotDrawnCard } from '../../../lib/features/tarot/storage';
import { BACKGROUNDS } from '../../../lib/assets/backgrounds';
import { commonStyles } from '../../../lib/ui/commonStyles';
import { HistoryLinkChip } from '../../../lib/ui/HistoryLinkChip';
import { ScreenScroll } from '../../../lib/ui/ScreenScroll';
import { UI } from '../../../lib/ui/tokens';
import { useMiniNavigation, useMiniParams } from '../../../support/miniRouteContext';
import SectionCard from '../_components/SectionCard';

export default function TarotResult({
  afterCardsSlot,
}: {
  afterCardsSlot?: ReactNode;
}): React.JSX.Element {
  const miniNavigation = useMiniNavigation();
  const params = useMiniParams<{ cards?: string; historyDateKey?: string; type?: string }>();
  const type: TarotReadingType = isTarotReadingType(params.type) ? params.type : 'today';
  const fromParam = useMemo(() => parseDrawnCards(params.cards), [params.cards]);

  const [drawn, setDrawn] = useState<TarotDrawnCard[] | null>(fromParam);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    setDrawn(fromParam);
  }, [fromParam]);

  useEffect(() => {
    if (drawn || type !== 'today') return;

    let mounted = true;
    loadTodayTarot()
      .then((saved) => {
        if (!mounted) return;
        if (!saved) {
          setLoadError('오늘의 운세 결과를 찾지 못했어요. 다시 뽑아 주세요.');
          return;
        }
        setDrawn(saved.drawn);
      })
      .catch((error) => {
        if (!mounted) return;
        setLoadError(error instanceof Error ? error.message : '결과를 불러오지 못했어요.');
      });

    return () => {
      mounted = false;
    };
  }, [drawn, type]);

  const readingText = useMemo(() => (drawn ? buildTarotReading(type, drawn) : ''), [drawn, type]);

  const drawnDefs = useMemo(() => {
    if (!drawn) return [];
    return drawn
      .map((drawnCard) => {
        const def = TAROT_DECK.find((card) => card.id === drawnCard.id);
        if (!def) return null;
        return { def, reversed: drawnCard.reversed };
      })
      .filter(Boolean) as Array<{ def: (typeof TAROT_DECK)[number]; reversed: boolean }>;
  }, [drawn]);

  const cardsLayout = drawnDefs.length === 1 ? 'single' : drawnDefs.length === 3 ? 'three' : 'grid';

  return (
    <ScreenScroll background={BACKGROUNDS.tarot} contentContainerStyle={[commonStyles.screen, styles.container]}>
      <View style={[commonStyles.hero, styles.header]}>
        <Text style={styles.heroLine}>카드의 방향과 배치를 그대로 반영한 결과를 보여줘요.</Text>
        <HistoryLinkChip label="최근 기록" onPress={() => miniNavigation.navigate('/history', { type: 'tarot' })} />
      </View>

      {loadError ? <Text style={styles.error}>{loadError}</Text> : null}

      {drawnDefs.length > 0 ? (
        <SectionCard title="뽑은 카드">
          <View
            style={[
              styles.cardsRow,
              cardsLayout === 'single' && styles.cardsRowSingle,
              cardsLayout === 'three' && styles.cardsRowThree,
            ]}
          >
            {drawnDefs.map(({ def, reversed }) => (
              <View
                key={def.id}
                style={[
                  styles.cardWrap,
                  cardsLayout === 'single' && styles.cardWrapSingle,
                  cardsLayout === 'three' && styles.cardWrapThree,
                ]}
              >
                <View style={styles.cardFrame}>
                  <View style={styles.cardFrameInner}>
                    <Image
                      source={tarotImageSource(def)}
                      style={[
                        styles.cardImg,
                        {
                          transform: [
                            { scale: TAROT_IMAGE_CROP.scale },
                            { translateY: TAROT_IMAGE_CROP.translateY },
                            ...(reversed ? ([{ rotate: '180deg' }] as const) : []),
                          ],
                        },
                      ]}
                      resizeMode="contain"
                    />
                  </View>
                </View>
                <Text style={styles.cardName}>
                  {def.nameKo} {reversed ? '(역)' : '(정)'}
                </Text>
              </View>
            ))}
          </View>
        </SectionCard>
      ) : null}

      {afterCardsSlot ? <View>{afterCardsSlot}</View> : null}

      {readingText ? (
        <SectionCard title="풀이">
          <Text style={styles.pre}>{readingText}</Text>
        </SectionCard>
      ) : null}

      <View style={styles.actions}>
        <View style={styles.actionButton}>
          <Button display="full" onPress={() => miniNavigation.switchTab('/tarot')} size="medium" style="weak" type="dark">
            타로 홈
          </Button>
        </View>
        {type !== 'today' ? (
          <View style={styles.actionButton}>
            <Button
              display="full"
              onPress={() => miniNavigation.navigate('/tarot/reading', { type })}
              size="medium"
              style="fill"
              type="primary"
            >
              다시 뽑기
            </Button>
          </View>
        ) : null}
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  header: {
    gap: 10,
  },
  heroLine: {
    color: '#f2f1ef',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  error: {
    color: UI.colors.danger,
    fontWeight: '900',
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  cardsRowSingle: {
    justifyContent: 'center',
  },
  cardsRowThree: {
    flexWrap: 'nowrap',
  },
  cardWrap: {
    width: 110,
    gap: 6,
  },
  cardWrapSingle: {
    width: '72%',
    maxWidth: 280,
    alignItems: 'center',
  },
  cardWrapThree: {
    width: undefined,
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
  },
  cardFrame: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#cec6bb',
    backgroundColor: '#f4f1eb',
    padding: 5,
  },
  cardFrameInner: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d7d0c6',
    backgroundColor: '#faf7f2',
    overflow: 'hidden',
  },
  cardImg: {
    width: '100%',
    height: '100%',
  },
  cardName: {
    color: UI.colors.text,
    fontWeight: '900',
    fontSize: 12,
    textAlign: 'center',
  },
  pre: {
    color: UI.colors.text,
    fontSize: 13,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
});
