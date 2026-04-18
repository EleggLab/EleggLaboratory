import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@toss/tds-react-native';

import { spreadFor, TAROT_DECK, type TarotReadingType } from '../../../lib/features/tarot/deck';
import { encodeDrawnCards, isTarotReadingType } from '../../../lib/features/tarot/helpers';
import { hashSeed, makeRng, shuffle } from '../../../lib/features/tarot/random';
import { kstDateKey, saveTodayTarot, type TarotDrawnCard } from '../../../lib/features/tarot/storage';
import { BACKGROUNDS } from '../../../lib/assets/backgrounds';
import { saveHistoryEntry } from '../../../lib/features/history/storage';
import { commonStyles } from '../../../lib/ui/commonStyles';
import { HistoryLinkChip } from '../../../lib/ui/HistoryLinkChip';
import { ScreenScroll } from '../../../lib/ui/ScreenScroll';
import { UI } from '../../../lib/ui/tokens';
import { useMiniNavigation, useMiniParams } from '../../../support/miniRouteContext';
import TarotCardTile from './TarotCardTile';

function chunkIntoRows<T>(items: readonly T[], columns: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += columns) {
    rows.push(items.slice(i, i + columns));
  }
  return rows;
}

export default function TarotReading(): React.JSX.Element {
  const miniNavigation = useMiniNavigation();
  const params = useMiniParams<{ type?: string }>();
  const type: TarotReadingType = isTarotReadingType(params.type) ? params.type : 'today';

  const spread = useMemo(() => spreadFor(type), [type]);
  const columns = 4;

  const [seed, setSeed] = useState<number>(() => Date.now());
  const [selected, setSelected] = useState<TarotDrawnCard[]>([]);
  const [shuffleToken, setShuffleToken] = useState(0);
  const [isShuffling, setIsShuffling] = useState(false);
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);

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
      const existing = prev.find((item) => item.id === id);
      if (existing) {
        return prev.filter((item) => item.id !== id);
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

    const createdAtISO = new Date().toISOString();
    const dateKey = kstDateKey();

    if (type === 'today') {
      await saveTodayTarot({
        type,
        dateKey,
        drawn: selected,
        createdAtISO,
      });
    }

    await saveHistoryEntry({
      id: `tarot-${type}-${dateKey}-${createdAtISO}`,
      kind: 'tarot',
      createdAtISO,
      payload: {
        createdAtISO,
        dateKey,
        drawn: selected,
        type,
      },
    });

    miniNavigation.navigate('/tarot/result', {
      cards: encodeDrawnCards(selected),
      type,
    });
  };

  return (
    <ScreenScroll background={BACKGROUNDS.tarot} contentContainerStyle={[commonStyles.screen, styles.container]}>
      <View style={[commonStyles.hero, styles.header]}>
        <Text style={styles.heroLine}>
          {type === 'today'
            ? '오늘의 운세는 한 장, 나머지는 3장 스프레드로 흐름을 읽어요.'
            : '3장 카드를 고르면 현재·흐름·조언 순서로 결과를 정리해 드려요.'}
        </Text>
        <HistoryLinkChip label="최근 기록" onPress={() => miniNavigation.navigate('/history', { type: 'tarot' })} />
      </View>

      <View style={styles.toolbar}>
        <Text style={styles.counter}>선택 {selected.length}/{spread.count}</Text>

        <View style={styles.toolbarRight}>
          {isShuffling ? <Text style={styles.shuffleText}>섞는 중...</Text> : null}

          <View style={styles.toolbarButton}>
            <Button disabled={isShuffling} display="full" onPress={reshuffle} size="tiny" style="weak" type="dark">
              다시 섞기
            </Button>
          </View>

          <View style={styles.toolbarButton}>
            <Button
              disabled={selected.length !== spread.count || isShuffling}
              display="full"
              onPress={() => void complete()}
              size="tiny"
              style="fill"
              type="primary"
            >
              선택 완료
            </Button>
          </View>
        </View>
      </View>

      <View style={styles.grid}>
        {rows.map((row, rowIdx) => (
          <View key={`row:${rowIdx}`} style={styles.gridRow}>
            {row.map((card, colIdx) => {
              const slotIndex = rowIdx * columns + colIdx;
              const pickedCard = selected.find((item) => item.id === card.id);
              const picked = Boolean(pickedCard);
              const reversed = pickedCard?.reversed ?? false;
              const disabled = isShuffling || (!picked && selected.length >= spread.count);

              return (
                <View key={card.id} style={styles.gridCell}>
                  <TarotCardTile
                    card={card}
                    disabled={disabled}
                    faceUp={picked}
                    onPress={() => togglePick(card.id)}
                    reversed={reversed}
                    selected={picked}
                    shuffleToken={shuffleToken}
                    slotIndex={slotIndex}
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

      <View style={styles.backButtonWrap}>
        <Button display="full" onPress={miniNavigation.back} size="medium" style="weak" type="dark">
          뒤로
        </Button>
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
  toolbarButton: {
    minWidth: 94,
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
  backButtonWrap: {
    marginTop: 4,
  },
});
