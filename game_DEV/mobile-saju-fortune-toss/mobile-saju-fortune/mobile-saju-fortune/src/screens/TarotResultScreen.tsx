import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { BannerAd, useFullscreenAd } from '../../lib/ads';
import { spreadFor, TAROT_DECK, type TarotReadingType } from '../../lib/features/tarot/deck';
import { TAROT_IMAGE_CROP, tarotImageSource } from '../../lib/features/tarot/imageSource';
import { loadTodayTarot, type TarotDrawnCard } from '../../lib/features/tarot/storage';
import { BACKGROUNDS } from '../../lib/assets/backgrounds';
import { commonStyles } from '../../lib/ui/commonStyles';
import { ScreenScroll } from '../../lib/ui/ScreenScroll';
import { UI } from '../../lib/ui/tokens';
import SectionCard from '../components/SectionCard';

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

function buildBonusReading(type: TarotReadingType, drawn: TarotDrawnCard[]): string {
  const cards = drawn
    .map((d) => {
      const def = TAROT_DECK.find((c) => c.id === d.id);
      if (!def) return null;
      return { name: def.nameKo, reversed: d.reversed, meanings: d.reversed ? def.meanings.reversed : def.meanings.upright };
    })
    .filter(Boolean) as Array<{ name: string; reversed: boolean; meanings: { keywords: string[]; short: string; long: string } }>;

  if (cards.length === 0) return '';

  const lines: string[] = ['[심화 해석]', ''];

  if (type === 'today') {
    const c = cards[0]!;
    lines.push(`[카드 에너지 분석]`);
    lines.push(`${c.name}(${c.reversed ? '역' : '정'})의 에너지는 "${c.meanings.keywords.join(', ')}"입니다.`);
    lines.push('');
    lines.push('[시간대별 조언]');
    lines.push(`- 오전: ${c.reversed ? '무리하지 말고 기본 루틴에 집중하세요.' : '에너지가 높은 시간, 중요한 일을 먼저 처리하세요.'}`);
    lines.push(`- 오후: ${c.reversed ? '예상치 못한 변수에 유연하게 대응하세요.' : '흐름이 좋으니 관계나 소통에 시간을 쓰세요.'}`);
    lines.push(`- 저녁: ${c.reversed ? '하루를 정리하며 내일 계획을 세워보세요.' : '성과를 돌아보고 작은 보상을 주세요.'}`);
  } else {
    cards.forEach((c) => {
      lines.push(`[${c.name} 심화]`);
      lines.push(`핵심 에너지: ${c.meanings.keywords.join(', ')}`);
      lines.push(c.meanings.long);
      lines.push('');
    });
    lines.push('[카드 조합 시너지]');
    lines.push('- 선택한 카드들의 흐름을 종합하면, 지금은 큰 결정보다 작은 실행을 쌓아가는 시기입니다.');
    lines.push('- 첫 번째 카드의 에너지를 기반으로, 마지막 카드가 제시하는 방향으로 움직여보세요.');
  }

  return lines.join('\n');
}

export default function TarotResultScreen({
  type,
  cardsParam,
  onGoHome,
  onReread,
}: {
  type: TarotReadingType;
  cardsParam?: string;
  onGoHome: () => void;
  onReread: (type: TarotReadingType) => void;
}): React.JSX.Element {
  const fromParam = useMemo(() => parseCards(cardsParam), [cardsParam]);

  const [drawn, setDrawn] = useState<TarotDrawnCard[] | null>(fromParam);
  const [loadError, setLoadError] = useState<string>('');

  const rewardedAd = useFullscreenAd('rewarded');
  const [bonusUnlocked, setBonusUnlocked] = useState(false);

  const handleWatchAd = useCallback(() => {
    rewardedAd.show({
      onReward: () => setBonusUnlocked(true),
      onDismiss: () => {},
    });
  }, [rewardedAd]);

  const bonusText = useMemo(() => {
    if (!bonusUnlocked || !drawn) return '';
    return buildBonusReading(type, drawn);
  }, [bonusUnlocked, drawn, type]);

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

  const readingText = useMemo(() => (drawn ? buildReading(type, drawn) : ''), [drawn, type]);

  const drawnDefs = useMemo(() => {
    if (!drawn) return [];
    return drawn
      .map((d) => {
        const def = TAROT_DECK.find((c) => c.id === d.id);
        if (!def) return null;
        return { def, reversed: d.reversed };
      })
      .filter(Boolean) as Array<{ def: (typeof TAROT_DECK)[number]; reversed: boolean }>;
  }, [drawn]);

  const cardsLayout = drawnDefs.length === 1 ? 'single' : drawnDefs.length === 3 ? 'three' : 'grid';

  return (
    <ScreenScroll background={BACKGROUNDS.tarot} contentContainerStyle={[commonStyles.screen, styles.container]}>
      <View style={[commonStyles.hero, styles.header]}>
        <Text style={styles.heroLine}>카드의 정·역 방향을 그대로 반영해 결과를 보여줘요.</Text>
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

      {readingText ? (
        <SectionCard title="풀이">
          <Text style={styles.pre}>{readingText}</Text>
        </SectionCard>
      ) : null}

      {drawn && !bonusUnlocked ? (
        <Pressable
          onPress={handleWatchAd}
          disabled={!rewardedAd.isLoaded && rewardedAd.isSupported}
          style={({ pressed }) => [
            styles.rewardBtn,
            (!rewardedAd.isLoaded && rewardedAd.isSupported) && styles.rewardBtnDisabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.rewardBtnText}>
            {rewardedAd.isLoaded ? '광고 보고 심화 해석 열기' : rewardedAd.isSupported ? '광고 준비 중...' : '심화 해석 보기'}
          </Text>
          <Text style={styles.rewardBtnSub}>카드별 에너지 분석과 시간대별 조언</Text>
        </Pressable>
      ) : null}

      {bonusUnlocked && bonusText ? (
        <SectionCard title="심화 해석">
          <Text style={styles.pre}>{bonusText}</Text>
        </SectionCard>
      ) : null}

      <BannerAd variant="list" theme="light" />

      <View style={styles.actions}>
        <Pressable onPress={onGoHome} style={({ pressed }) => [styles.btn, pressed && styles.pressed]}>
          <Text style={styles.btnText}>타로 홈</Text>
        </Pressable>
        {type !== 'today' ? (
          <Pressable
            onPress={() => onReread(type)}
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
  rewardBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: UI.colors.gold,
    borderWidth: 1,
    borderColor: UI.colors.gold,
    gap: 4,
  },
  rewardBtnDisabled: {
    opacity: 0.5,
  },
  rewardBtnText: {
    color: UI.colors.ink,
    fontWeight: '900',
    fontSize: 14,
  },
  rewardBtnSub: {
    color: 'rgba(11,16,32,0.6)',
    fontSize: 11,
    fontWeight: '700',
  },
});
