import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Button } from '@toss/tds-react-native';

import { spreadFor, TAROT_DECK, type TarotReadingType } from '../../../lib/features/tarot/deck';
import { TAROT_IMAGE_CROP, tarotImageSource } from '../../../lib/features/tarot/imageSource';
import { loadTodayTarot, type TarotDrawnCard } from '../../../lib/features/tarot/storage';
import { BACKGROUNDS } from '../../../lib/assets/backgrounds';
import { commonStyles } from '../../../lib/ui/commonStyles';
import { ScreenScroll } from '../../../lib/ui/ScreenScroll';
import { UI } from '../../../lib/ui/tokens';
import { useMiniNavigation, useMiniParams } from '../../../support/miniRouteContext';
import SectionCard from '../_components/SectionCard';

function isReadingType(value: string | undefined): value is TarotReadingType {
  return value === 'today' || value === 'love' || value === 'money' || value === 'relationship' || value === 'study';
}

function parseCards(value: string | undefined): TarotDrawnCard[] | null {
  if (!value) return null;

  const parts = value
    .split(',')
    .map((part) => part.trim())
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
    .map((drawnCard) => {
      const def = TAROT_DECK.find((card) => card.id === drawnCard.id);
      if (!def) return null;

      const meaning = drawnCard.reversed ? def.meanings.reversed : def.meanings.upright;
      return {
        keywords: meaning.keywords,
        long: meaning.long,
        name: def.nameKo,
        reversed: drawnCard.reversed,
        short: meaning.short,
      };
    })
    .filter(Boolean) as Array<{
    keywords: string[];
    long: string;
    name: string;
    reversed: boolean;
    short: string;
  }>;

  const lines: string[] = [];
  lines.push(`[${titleFor(type)} 해석]`);
  lines.push('');
  lines.push('[뽑은 카드]');

  cards.forEach((card, idx) => {
    const pos = spread.positions[idx] ?? `카드 ${idx + 1}`;
    lines.push(`- ${pos}: ${card.name} ${card.reversed ? '(역방향)' : '(정방향)'} · ${card.keywords.join(', ')}`);
  });

  lines.push('');
  if (type === 'today') {
    const card = cards[0];
    if (!card) return lines.join('\n');

    lines.push('[오늘의 흐름]');
    lines.push(card.long);
    lines.push('');
    lines.push('[실행 팁]');
    lines.push(
      card.reversed
        ? '- 속도를 줄이고, 놓친 조건이나 감정의 결을 먼저 확인해 보세요.'
        : '- 오늘은 한 가지를 먼저 정해서 밀어붙이면 흐름이 더 좋아집니다.',
    );
    lines.push('- 하루 일정 3개 중 1개만 먼저 완료 처리해 보세요.');
    return lines.join('\n');
  }

  lines.push('[카드별 해석]');
  cards.forEach((card, idx) => {
    const pos = spread.positions[idx] ?? `카드 ${idx + 1}`;
    lines.push(`- ${pos}: ${card.short}`);
    lines.push(`  ${card.long}`);
  });

  lines.push('');
  lines.push('[종합 정리]');
  lines.push('- 지금은 결론보다 작은 실행을 먼저 쌓는 편이 더 유리합니다.');
  lines.push('- 오늘 해야 할 일 1개와 미룰 일 1개를 분리하면 흐름이 안정됩니다.');

  return lines.join('\n');
}

export default function TarotResult({
  afterCardsSlot,
}: {
  afterCardsSlot?: ReactNode;
}): React.JSX.Element {
  const miniNavigation = useMiniNavigation();
  const params = useMiniParams<{ cards?: string; type?: string }>();
  const type: TarotReadingType = isReadingType(params.type) ? params.type : 'today';
  const fromParam = useMemo(() => parseCards(params.cards), [params.cards]);

  const [drawn, setDrawn] = useState<TarotDrawnCard[] | null>(fromParam);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (drawn || type !== 'today') return;

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
      .catch((error) => {
        if (!mounted) return;
        setLoadError(error instanceof Error ? error.message : '결과를 불러오지 못했어요.');
      });

    return () => {
      mounted = false;
    };
  }, [drawn, type]);

  const readingText = useMemo(() => (drawn ? buildReading(type, drawn) : ''), [drawn, type]);

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
        <Text style={styles.heroLine}>카드의 방향과 조합을 그대로 반영한 결과입니다.</Text>
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
        <SectionCard title="결과">
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
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
});
