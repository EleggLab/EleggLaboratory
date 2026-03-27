import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@toss/tds-react-native';

import { BACKGROUNDS } from '../../lib/assets/backgrounds';
import { saveHistoryEntry } from '../../lib/features/history/storage';
import { TRIGRAMS, buildIChingResult, nowTimeText, type LineValue } from '../../lib/features/iching/fortune';
import { commonStyles } from '../../lib/ui/commonStyles';
import { HistoryLinkChip } from '../../lib/ui/HistoryLinkChip';
import { ScreenScroll } from '../../lib/ui/ScreenScroll';
import { UI } from '../../lib/ui/tokens';
import { useMiniNavigation, useMiniParams, useMiniRouteSignals } from '../../support/miniRouteContext';

export default function IChingScreen(): React.JSX.Element {
  const miniNavigation = useMiniNavigation();
  const params = useMiniParams<{ pickedAtISO?: string }>();
  const { tabPressToken, visitToken } = useMiniRouteSignals();

  const [now, setNow] = useState<Date>(() => new Date());
  const [pickedAt, setPickedAt] = useState<Date | null>(null);
  const [lines, setLines] = useState<LineValue[] | null>(null);
  const skipNextHistorySave = useRef(false);

  useEffect(() => {
    if (!visitToken && !tabPressToken) return;
    setLines(null);
    setPickedAt(null);
  }, [tabPressToken, visitToken]);

  useEffect(() => {
    if (typeof params.pickedAtISO !== 'string' || params.pickedAtISO.length === 0) return;
    const restored = new Date(params.pickedAtISO);
    if (Number.isNaN(restored.getTime())) return;

    skipNextHistorySave.current = true;
    setPickedAt(restored);
    setLines(buildIChingResult(restored.toISOString()).lines);
  }, [params.pickedAtISO]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 250);
    return () => clearInterval(timer);
  }, []);

  const pick = (): void => {
    const nextPickedAt = new Date();
    const nextResult = buildIChingResult(nextPickedAt.toISOString());
    const createdAtISO = new Date().toISOString();

    setPickedAt(nextPickedAt);
    setLines(nextResult.lines);

    void saveHistoryEntry({
      id: `iching-${nextPickedAt.toISOString()}`,
      kind: 'iching',
      createdAtISO,
      payload: {
        createdAtISO,
        pickedAtISO: nextPickedAt.toISOString(),
      },
    });
  };

  const { upperBits, lowerBits, movingCount, readingText } = useMemo(() => {
    if (!lines) {
      return { upperBits: '', lowerBits: '', movingCount: 0, readingText: '' };
    }
    return buildIChingResult((pickedAt ?? new Date()).toISOString());
  }, [lines, pickedAt]);

  useEffect(() => {
    if (!pickedAt || !lines) return;
    if (skipNextHistorySave.current) {
      skipNextHistorySave.current = false;
    }
  }, [lines, pickedAt]);

  return (
    <ScreenScroll background={BACKGROUNDS.iching} contentContainerStyle={[commonStyles.screen, styles.container]}>
      <View style={[commonStyles.hero, styles.hero]}>
        <Text style={styles.heroLine}>지금 시간을 기준으로 6효를 만들고 오늘의 흐름을 간단히 보여줘요.</Text>
        <HistoryLinkChip label="최근 기록" onPress={() => miniNavigation.navigate('/history', { type: 'iching' })} />

        <Pressable onPress={pick} style={({ pressed }) => [styles.clock, pressed && styles.pressed]}>
          <Text style={styles.clockText}>{nowTimeText(now)}</Text>
          <Text style={styles.clockHint}>탭해서 이 시간으로 점치기</Text>
        </Pressable>
      </View>

      {lines ? (
        <View style={styles.result}>
          <Text style={styles.resultTitle}>결과</Text>
          <Text style={styles.meta}>
            선택 시각: {pickedAt ? pickedAt.toLocaleString() : '-'} · 동효 {movingCount}개
          </Text>

          <View style={styles.triRow}>
            <View style={styles.triCard}>
              <Text style={styles.triTitle}>상괘</Text>
              <Text style={styles.triValue}>
                {TRIGRAMS[upperBits]?.symbol ?? '—'} {TRIGRAMS[upperBits]?.ko ?? '—'}
              </Text>
            </View>
            <View style={styles.triCard}>
              <Text style={styles.triTitle}>하괘</Text>
              <Text style={styles.triValue}>
                {TRIGRAMS[lowerBits]?.symbol ?? '—'} {TRIGRAMS[lowerBits]?.ko ?? '—'}
              </Text>
            </View>
          </View>

          <Text style={styles.pre}>{readingText}</Text>

          <View style={styles.buttonWrap}>
            <Button display="full" onPress={pick} size="medium" style="fill" type="primary">
              다시 점치기
            </Button>
          </View>
        </View>
      ) : null}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  hero: {
    gap: 10,
  },
  heroLine: {
    color: '#f2f1ef',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  clock: {
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    gap: 6,
  },
  clockText: {
    color: UI.colors.gold,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 1,
  },
  clockHint: {
    color: 'rgba(242,241,239,0.78)',
    fontSize: 12,
    fontWeight: '800',
  },
  meta: {
    color: UI.colors.inkSoft,
    fontSize: 12,
    lineHeight: 17,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  result: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: UI.colors.line,
    backgroundColor: UI.colors.card,
    padding: 14,
    gap: 10,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
  },
  triRow: {
    flexDirection: 'row',
    gap: 10,
  },
  triCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: UI.colors.line,
    backgroundColor: '#ffffff',
    padding: 12,
    gap: 6,
  },
  triTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#6b7280',
  },
  triValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111827',
  },
  pre: {
    fontSize: 13,
    lineHeight: 20,
    color: '#111827',
  },
  buttonWrap: {
    marginTop: 4,
  },
});
