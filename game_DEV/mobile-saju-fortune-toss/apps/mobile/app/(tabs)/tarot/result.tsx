import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';

import { spreadFor, TAROT_DECK, type TarotReadingType } from '../../../lib/features/tarot/deck';
import { TAROT_IMAGE_CROP, tarotImageSource } from '../../../lib/features/tarot/imageSource';
import { loadTodayTarot, type TarotDrawnCard } from '../../../lib/features/tarot/storage';
import { BACKGROUNDS } from '../../../lib/assets/backgrounds';
import { commonStyles } from '../../../lib/ui/commonStyles';
import { ScreenScroll } from '../../../lib/ui/ScreenScroll';
import { UI } from '../../../lib/ui/tokens';
import SectionCard from '../_components/SectionCard';

type ResolvedTarotCard = {
  def: (typeof TAROT_DECK)[number];
  reversed: boolean;
  imageSource: ImageSourcePropType | null;
};

function isReadingType(value: string | undefined): value is TarotReadingType {
  return value === 'today' || value === 'love' || value === 'money' || value === 'relationship' || value === 'study';
}

function parseCards(value: string | undefined): TarotDrawnCard[] | null {
  if (!value) return null;
  const parts = value
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length === 0) return null;
  const parsed: TarotDrawnCard[] = [];

  for (const part of parts) {
    const [id, flag] = part.split(':');
    if (!id) return null;
    parsed.push({ id, reversed: flag === '1' });
  }

  return parsed;
}

function titleFor(type: TarotReadingType): string {
  if (type === 'today') return '오늘의 운세';
  if (type === 'love') return '연애운';
  if (type === 'money') return '금전운';
  if (type === 'relationship') return '인간관계운';
  return '학업운';
}

function buildReading(type: TarotReadingType, drawn: TarotDrawnCard[]): string {
  const spread = spreadFor(type);
  const cards = drawn
    .map((d) => {
      const def = TAROT_DECK.find((c) => c.id === d.id);
      if (!def) return null;
      const meaning = d.reversed ? def.meanings.reversed : def.meanings.upright;
      return {
        name: def.nameKo,
        reversed: d.reversed,
        keywords: meaning.keywords,
        short: meaning.short,
        long: meaning.long,
      };
    })
    .filter(Boolean) as Array<{
    name: string;
    reversed: boolean;
    keywords: string[];
    short: string;
    long: string;
  }>;

  const lines: string[] = [];
  lines.push(`[${titleFor(type)} 해석]`);
  lines.push('');
  lines.push('[뽑은 카드]');

  cards.forEach((c, idx) => {
    const pos = spread.positions[idx] ?? `카드 ${idx + 1}`;
    lines.push(`- ${pos}: ${c.name} ${c.reversed ? '(역방향)' : '(정방향)'} · ${c.keywords.join(', ')}`);
  });

  lines.push('');
  if (type === 'today') {
    const c = cards[0];
    if (!c) return lines.join('\n');
    lines.push('[오늘의 핵심]');
    lines.push(c.long);
    lines.push('');
    lines.push('[실천 팁]');
    lines.push(c.reversed ? '- 속도를 줄이고 확인 과정을 한 번 더 거치세요.' : '- 오늘은 한 가지를 먼저 끝내는 흐름이 좋습니다.');
    lines.push('- 해야 할 일 3개 중 1개를 먼저 완료해보세요.');
    return lines.join('\n');
  }

  lines.push('[카드별 해석]');
  cards.forEach((c, idx) => {
    const pos = spread.positions[idx] ?? `카드 ${idx + 1}`;
    lines.push(`- ${pos}: ${c.short}`);
    lines.push(`  ${c.long}`);
  });

  lines.push('');
  lines.push('[종합 정리]');
  lines.push('- 지금은 큰 결론보다 작은 실행을 먼저 쌓는 방식이 유리합니다.');
  lines.push('- 오늘 끝낼 1가지와 미룰 1가지를 분리하면 흐름이 안정됩니다.');

  return lines.join('\n');
}

export default function TarotResult(): React.JSX.Element {
  const params = useLocalSearchParams<{ type?: string; cards?: string; cached?: string }>();
  const type: TarotReadingType = isReadingType(params.type) ? params.type : 'today';
  const fromParam = useMemo(() => parseCards(params.cards), [params.cards]);

  const [drawn, setDrawn] = useState<TarotDrawnCard[] | null>(fromParam);
  const [loadError, setLoadError] = useState<string>('');

  useEffect(() => {
    if (drawn) return;
    if (type !== 'today') return;

    let mounted = true;
    loadTodayTarot()
      .then((saved) => {
        if (!mounted) return;
        if (!saved) {
          setLoadError('오늘의 운세 결과를 찾지 못했어요. 다시 뽑아주세요.');
          return;
        }
        setDrawn(saved.drawn);
      })
      .catch((e) => {
        if (!mounted) return;
        setLoadError(e instanceof Error ? e.message : '결과를 불러오지 못했어요.');
      });

    return () => {
      mounted = false;
    };
  }, [drawn, type]);

  const readingState = useMemo(() => {
    try {
      return {
        text: drawn ? buildReading(type, drawn) : '',
        error: '',
      };
    } catch (error) {
      console.error('TAROT_RESULT_READING_ERROR', error);
      return {
        text: '',
        error: '타로 결과를 정리하는 중 문제가 생겼어요. 다시 카드를 골라주세요.',
      };
    }
  }, [drawn, type]);

  const drawnDefsState = useMemo(() => {
    if (!drawn) {
      return {
        cards: [] as ResolvedTarotCard[],
        error: '',
      };
    }

    try {
      const cards = drawn
        .map((d) => {
          const def = TAROT_DECK.find((c) => c.id === d.id);
          if (!def) return null;

          let imageSource: ImageSourcePropType | null = null;
          try {
            imageSource = typeof tarotImageSource === 'function' ? tarotImageSource(def) : null;
          } catch (error) {
            console.error('TAROT_RESULT_IMAGE_SOURCE_ERROR', def.id, error);
          }

          return { def, reversed: d.reversed, imageSource };
        })
        .filter(Boolean) as ResolvedTarotCard[];

      return {
        cards,
        error: '',
      };
    } catch (error) {
      console.error('TAROT_RESULT_CARD_RESOLVE_ERROR', error);
      return {
        cards: [] as ResolvedTarotCard[],
        error: '타로 카드 정보를 불러오는 중 문제가 생겼어요. 다시 시도해주세요.',
      };
    }
  }, [drawn]);

  const drawnDefs = drawnDefsState.cards;
  const readingText = readingState.text;
  const screenError = loadError || drawnDefsState.error || readingState.error;

  const cardsLayout = drawnDefs.length === 1 ? 'single' : drawnDefs.length === 3 ? 'three' : 'grid';

  return (
    <ScreenScroll background={BACKGROUNDS.tarot} contentContainerStyle={[commonStyles.screen, styles.container]}>
      <View style={[commonStyles.hero, styles.header]}>
        <Text style={styles.heroLine}>카드의 정·역 방향을 그대로 반영해 결과를 보여줘요.</Text>
      </View>

      {screenError ? <Text style={styles.error}>{screenError}</Text> : null}

      {drawnDefs.length > 0 ? (
        <SectionCard title="뽑은 카드">
          <View
            style={[
              styles.cardsRow,
              cardsLayout === 'single' && styles.cardsRowSingle,
              cardsLayout === 'three' && styles.cardsRowThree,
            ]}
          >
            {drawnDefs.map(({ def, reversed, imageSource }) => (
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
                    {imageSource ? (
                      <Image
                        source={imageSource}
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
                    ) : (
                      <View style={styles.cardFallback}>
                        <Text style={styles.cardFallbackText}>{def.nameKo}</Text>
                      </View>
                    )}
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

      {readingText ? (
        <SectionCard title="풀이">
          <Text style={styles.pre}>{readingText}</Text>
        </SectionCard>
      ) : null}

      <View style={styles.actions}>
        <Pressable onPress={() => router.push('/(tabs)/tarot')} style={({ pressed }) => [styles.btn, pressed && styles.pressed]}>
          <Text style={styles.btnText}>타로 홈</Text>
        </Pressable>
        {type !== 'today' ? (
          <Pressable
            onPress={() => router.replace(`/(tabs)/tarot/reading?type=${type}`)}
            style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && styles.pressed]}
          >
            <Text style={[styles.btnText, styles.btnPrimaryText]}>다시 뽑기</Text>
          </Pressable>
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
    gap: 0,
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
  cardFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#f7f1e7',
  },
  cardFallbackText: {
    color: UI.colors.ink,
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 18,
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
  btn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: UI.colors.card,
    borderWidth: 1,
    borderColor: UI.colors.line,
  },
  btnPrimary: {
    backgroundColor: UI.colors.gold,
    borderColor: UI.colors.gold,
  },
  btnText: {
    color: UI.colors.text,
    fontWeight: '900',
  },
  btnPrimaryText: {
    color: UI.colors.ink,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
});
