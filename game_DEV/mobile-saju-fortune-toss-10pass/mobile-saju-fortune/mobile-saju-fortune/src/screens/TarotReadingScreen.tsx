import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useFullscreenAd } from '../../lib/ads';
import { spreadFor, TAROT_DECK, type TarotReadingType } from '../../lib/features/tarot/deck';
import { hashSeed, makeRng, shuffle } from '../../lib/features/tarot/random';
import { kstDateKey, saveTodayTarot, type TarotDrawnCard } from '../../lib/features/tarot/storage';
import { BACKGROUNDS } from '../../lib/assets/backgrounds';
import { commonStyles } from '../../lib/ui/commonStyles';
import { ScreenScroll } from '../../lib/ui/ScreenScroll';
import { UI } from '../../lib/ui/tokens';
import TarotCardTile from '../components/TarotCardTile';

function chunkIntoRows<T>(items: readonly T[], columns: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += columns) {
    rows.push(items.slice(i, i + columns));
  }
  return rows;
}

function encodeCards(cards: TarotDrawnCard[]): string {
  return cards.map((c) => `${c.id}:${c.reversed ? 1 : 0}`).join(',');
}

export default function TarotReadingScreen({
  type,
  onComplete,
  onBack,
}: {
  type: TarotReadingType;
  onComplete: (type: TarotReadingType, cards: string) => void;
  onBack: () => void;
}): React.JSX.Element {
  const spread = useMemo(() => spreadFor(type), [type]);
  const columns = 4;

  const [seed, setSeed] = useState<number>(() => Date.now());
  const [selected, setSelected] = useState<TarotDrawnCard[]>([]);
  const [shuffleToken, setShuffleToken] = useState(0);
  const [isShuffling, setIsShuffling] = useState(false);
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  const interstitialAd = useFullscreenAd('interstitial');

  useEffect(
    () => () => {
      timers.current.forEach((timer) => clearTimeout(timer));
      timers.current = [];
    },
    [],
  );

  const order = useMemo(() => {
    const rng = makeRng(hashSeed(`order:${seed}`));
    return shuffle(TAROT_DECK, rng);
  }, [seed]);

  const rows = useMemo(() => chunkIntoRows(order, columns), [columns, order]);

  const reversedById = useMemo(() => {
    const rng = makeRng(hashSeed(`rev:${seed}`));
    const map: Record<string, boolean> = {};
    for (const card of TAROT_DECK) {
      map[card.id] = rng() < 0.5;
    }
    return map;
  }, [seed]);

  const reshuffle = (): void => {
    if (isShuffling) return;
    setIsShuffling(true);
    setSelected([]);
    setShuffleToken((prev) => prev + 1);

    const reseedTimer = setTimeout(() => setSeed(Date.now()), 140);
    const doneTimer = setTimeout(() => setIsShuffling(false), 620);
    timers.current.push(reseedTimer, doneTimer);
  };

  const togglePick = (id: string): void => {
    if (isShuffling) return;
    setSelected((prev) => {
      const existing = prev.find((p) => p.id === id);
      if (existing) {
        return prev.filter((p) => p.id !== id);
      }
      if (prev.length >= spread.count) {
        return prev;
      }
      const reversed = reversedById[id] ?? false;
      return [...prev, { id, reversed }];
    });
  };

  const complete = async (): Promise<void> => {
    if (isShuffling || selected.length !== spread.count) return;

    if (type === 'today') {
      await saveTodayTarot({
        type,
        dateKey: kstDateKey(),
        drawn: selected,
        createdAtISO: new Date().toISOString(),
      });
    }

    const navigateToResult = () => {
      onComplete(type, encodeCards(selected));
    };

    if (interstitialAd.isLoaded) {
      interstitialAd.show({ onDismiss: navigateToResult });
    } else {
      navigateToResult();
    }
  };

  return (
    <ScreenScroll background={BACKGROUNDS.tarot} contentContainerStyle={[commonStyles.screen, styles.container]}>
      <View style={[commonStyles.hero, styles.header]}>
        <Text style={styles.heroLine}>
          {type === 'today'
            ? '오늘의 운세는 하루 1회, 나머지는 3장 스프레드로 흐름을 봅니다.'
            : '3장 카드를 선택하면 현재·흐름·조언이 순서대로 정리됩니다.'}
        </Text>
      </View>

      <View style={styles.toolbar}>
        <Text style={styles.counter}>
          선택 {selected.length}/{spread.count}
        </Text>

        <View style={styles.toolbarRight}>
          {isShuffling ? <Text style={styles.shuffleText}>섞는 중...</Text> : null}

          <Pressable
            onPress={reshuffle}
            disabled={isShuffling}
            style={({ pressed }) => [styles.toolBtn, isShuffling && styles.toolBtnDisabled, pressed && styles.pressed]}
          >
            <Text style={styles.toolBtnText}>다시 섞기</Text>
          </Pressable>

          <Pressable
            onPress={() => void complete()}
            disabled={selected.length !== spread.count || isShuffling}
            style={({ pressed }) => [
              styles.toolBtn,
              styles.toolBtnPrimary,
              (selected.length !== spread.count || isShuffling) && styles.toolBtnDisabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.toolBtnText, styles.toolBtnPrimaryText]}>선택 완료</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.grid}>
        {rows.map((row, rowIdx) => (
          <View key={`row:${rowIdx}`} style={styles.gridRow}>
            {row.map((card, colIdx) => {
              const slotIndex = rowIdx * columns + colIdx;
              const pickedCard = selected.find((s) => s.id === card.id);
              const picked = Boolean(pickedCard);
              const reversed = pickedCard?.reversed ?? false;
              const disabled = isShuffling || (!picked && selected.length >= spread.count);

              return (
                <View key={card.id} style={styles.gridCell}>
                  <TarotCardTile
                    card={card}
                    faceUp={picked}
                    reversed={reversed}
                    selected={picked}
                    disabled={disabled}
                    shuffleToken={shuffleToken}
                    slotIndex={slotIndex}
                    onPress={() => togglePick(card.id)}
                  />
                </View>
              );
            })}

            {row.length < columns
              ? Array.from({ length: columns - row.length }).map((_, i) => (
                  <View key={`row:${rowIdx}:empty:${i}`} style={styles.gridCell} />
                ))
              : null}
          </View>
        ))}
      </View>

      <Pressable onPress={onBack} style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}>
        <Text style={styles.backBtnText}>뒤로</Text>
      </Pressable>
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
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  toolbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shuffleText: {
    color: UI.colors.gold,
    fontWeight: '800',
    fontSize: 11,
  },
  counter: {
    color: UI.colors.gold,
    fontWeight: '900',
  },
  toolBtn: {
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: UI.colors.card,
    borderWidth: 1,
    borderColor: UI.colors.line,
  },
  toolBtnPrimary: {
    backgroundColor: UI.colors.gold,
    borderColor: UI.colors.gold,
  },
  toolBtnDisabled: {
    opacity: 0.45,
  },
  toolBtnText: {
    color: UI.colors.text,
    fontWeight: '900',
    fontSize: 12,
  },
  toolBtnPrimaryText: {
    color: UI.colors.ink,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  grid: {
    gap: 10,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  gridCell: {
    flex: 1,
  },
  backBtn: {
    marginTop: 4,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: UI.colors.card,
    borderWidth: 1,
    borderColor: UI.colors.line,
  },
  backBtnText: {
    color: UI.colors.text,
    fontWeight: '900',
  },
});
