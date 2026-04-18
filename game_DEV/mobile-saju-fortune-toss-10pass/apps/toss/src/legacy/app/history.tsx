import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BACKGROUNDS } from '../lib/assets/backgrounds';
import { clearHistory, deleteHistoryEntry, listHistory, migrateLegacyHistoryIfNeeded } from '../lib/features/history/storage';
import type { FortuneHistoryEntry, FortuneHistoryKind, SajuHistoryEntry } from '../lib/features/history/types';
import { buildTodaySeedKey, getDailySelectionLabel } from '../lib/features/today/fortune';
import { formatSavedInputSummary } from '../lib/features/saju/savedInput';
import { encodeDrawnCards, titleForReading } from '../lib/features/tarot/helpers';
import { ScreenScroll } from '../lib/ui/ScreenScroll';
import { HistoryLinkChip } from '../lib/ui/HistoryLinkChip';
import { UI } from '../lib/ui/tokens';
import { useMiniNavigation, useMiniParams } from '../support/miniRouteContext';
import SectionCard from './(tabs)/_components/SectionCard';

const KIND_ORDER: FortuneHistoryKind[] = ['saju', 'tarot', 'today', 'iching'];

function isHistoryKind(value: string | undefined): value is FortuneHistoryKind {
  return value === 'saju' || value === 'tarot' || value === 'today' || value === 'iching';
}

function getKindLabel(kind: FortuneHistoryKind): string {
  if (kind === 'saju') return '사주';
  if (kind === 'tarot') return '타로';
  if (kind === 'today') return '오늘 운세';
  return '주역';
}

function formatEntryTitle(entry: FortuneHistoryEntry): string {
  if (entry.kind === 'saju') {
    return formatSavedInputSummary({
      id: entry.id,
      createdAtISO: entry.createdAtISO,
      ...entry.payload,
    });
  }

  if (entry.kind === 'tarot') {
    return `${titleForReading(entry.payload.type)} · ${entry.payload.drawn.length}장`;
  }

  if (entry.kind === 'today') {
    const base = getDailySelectionLabel(entry.payload.kind, entry.payload.key);
    if (entry.payload.kind === 'chinese' && entry.payload.chineseYear) {
      return `${base} · ${entry.payload.chineseYear}년생`;
    }
    return base;
  }

  return `선택 시각 ${new Date(entry.payload.pickedAtISO).toLocaleString()}`;
}

function formatEntryMeta(entry: FortuneHistoryEntry): string {
  if (entry.kind === 'tarot') {
    return `${entry.payload.dateKey} · ${new Date(entry.createdAtISO).toLocaleString()}`;
  }

  if (entry.kind === 'today') {
    const seed = buildTodaySeedKey(entry.payload.kind, entry.payload.key, entry.payload.chineseYear);
    return `${entry.payload.dateKey} · ${seed}`;
  }

  if (entry.kind === 'iching') {
    return `${new Date(entry.createdAtISO).toLocaleString()} · seed ${entry.payload.pickedAtISO}`;
  }

  return new Date(entry.createdAtISO).toLocaleString();
}

function orderKinds(filterKind: FortuneHistoryKind | null): FortuneHistoryKind[] {
  if (!filterKind) return KIND_ORDER;
  return [filterKind, ...KIND_ORDER.filter((kind) => kind !== filterKind)];
}

export default function HistoryScreen(): React.JSX.Element {
  const miniNavigation = useMiniNavigation();
  const params = useMiniParams<{ type?: string }>();
  const filterKind = isHistoryKind(params.type) ? params.type : null;

  const [entries, setEntries] = useState<FortuneHistoryEntry[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      await migrateLegacyHistoryIfNeeded();
      const nextEntries = await listHistory();
      setEntries(nextEntries);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '기록을 불러오지 못했어요.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  const sectionOrder = useMemo(() => orderKinds(filterKind), [filterKind]);

  const groupedEntries = useMemo(() => {
    const grouped: Record<FortuneHistoryKind, FortuneHistoryEntry[]> = {
      saju: [],
      tarot: [],
      today: [],
      iching: [],
    };

    entries.forEach((entry) => {
      grouped[entry.kind].push(entry);
    });

    return grouped;
  }, [entries]);

  const openEntry = useCallback(
    (entry: FortuneHistoryEntry): void => {
      if (entry.kind === 'saju') {
        miniNavigation.navigate('/saju', {
          historyPayload: JSON.stringify(entry.payload),
        });
        return;
      }

      if (entry.kind === 'tarot') {
        miniNavigation.navigate('/tarot/result', {
          cards: encodeDrawnCards(entry.payload.drawn),
          historyDateKey: entry.payload.dateKey,
          type: entry.payload.type,
        });
        return;
      }

      if (entry.kind === 'today') {
        miniNavigation.navigate('/today', {
          historyChineseYear:
            entry.payload.chineseYear !== undefined ? String(entry.payload.chineseYear) : undefined,
          historyDateKey: entry.payload.dateKey,
          historyKey: entry.payload.key,
          historyKind: entry.payload.kind,
        });
        return;
      }

      miniNavigation.navigate('/iching', {
        pickedAtISO: entry.payload.pickedAtISO,
      });
    },
    [miniNavigation],
  );

  const handleDelete = useCallback(async (kind: FortuneHistoryKind, id: string) => {
    try {
      const next = await deleteHistoryEntry(kind, id);
      setEntries((prev) => [...prev.filter((entry) => entry.kind !== kind), ...next]);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '삭제하지 못했어요.');
    }
  }, []);

  const handleClear = useCallback(async (kind: FortuneHistoryKind) => {
    try {
      await clearHistory(kind);
      setEntries((prev) => prev.filter((entry) => entry.kind !== kind));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '전체 삭제에 실패했어요.');
    }
  }, []);

  return (
    <ScreenScroll
      background={BACKGROUNDS.home}
      contentContainerStyle={styles.container}
      resetScrollOnFocus
      scrollToTopKey={filterKind ?? 'history-all'}
    >
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>최근 기록</Text>
        <Text style={styles.heroLine}>입력값을 다시 불러와 같은 기준으로 결과를 바로 열 수 있어요.</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? <Text style={styles.meta}>기록을 불러오는 중이에요...</Text> : null}

      {sectionOrder.map((kind) => {
        const items = groupedEntries[kind];
        const isFocused = filterKind === kind;

        return (
          <SectionCard key={kind} title={`${getKindLabel(kind)} 기록`}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.meta, isFocused && styles.focusedMeta]}>
                {items.length > 0
                  ? `${items.length}개의 최근 기록`
                  : '아직 저장된 기록이 없어요.'}
              </Text>
              {items.length > 0 ? <HistoryLinkChip label="전체 비우기" onPress={() => void handleClear(kind)} /> : null}
            </View>

            {items.length === 0 ? (
              <Text style={styles.emptyText}>이 영역의 기록은 결과를 만든 뒤 자동 또는 수동 저장되면 여기에 모입니다.</Text>
            ) : (
              <View style={styles.list}>
                {items.map((entry) => (
                  <View key={entry.id} style={styles.item}>
                    <View style={styles.itemBody}>
                      <Text style={styles.itemTitle}>{formatEntryTitle(entry)}</Text>
                      <Text style={styles.itemMeta}>{formatEntryMeta(entry)}</Text>
                    </View>
                    <View style={styles.actions}>
                      <Pressable onPress={() => openEntry(entry)} style={({ pressed }) => [styles.actionButton, styles.actionPrimary, pressed && styles.pressed]}>
                        <Text style={[styles.actionText, styles.actionPrimaryText]}>열기</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => void handleDelete(entry.kind, entry.id)}
                        style={({ pressed }) => [styles.actionButton, styles.actionDanger, pressed && styles.pressed]}
                      >
                        <Text style={[styles.actionText, styles.actionDangerText]}>삭제</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </SectionCard>
        );
      })}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 24,
  },
  hero: {
    gap: 6,
  },
  heroTitle: {
    color: '#f2f1ef',
    fontSize: 22,
    fontWeight: '900',
  },
  heroLine: {
    color: '#f2f1ef',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  meta: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  focusedMeta: {
    color: '#92400e',
  },
  error: {
    color: UI.colors.danger,
    fontSize: 12,
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  emptyText: {
    color: UI.colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  list: {
    gap: 10,
  },
  item: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: UI.colors.line,
    backgroundColor: '#ffffff',
    padding: 12,
    gap: 10,
  },
  itemBody: {
    gap: 4,
  },
  itemTitle: {
    color: UI.colors.text,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 18,
  },
  itemMeta: {
    color: UI.colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    minWidth: 74,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPrimary: {
    borderColor: '#d4b45d',
    backgroundColor: '#fbf3d6',
  },
  actionDanger: {
    borderColor: '#fca5a5',
    backgroundColor: '#fff5f5',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '900',
  },
  actionPrimaryText: {
    color: '#7c5800',
  },
  actionDangerText: {
    color: '#b91c1c',
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
});
