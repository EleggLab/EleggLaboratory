import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { BACKGROUNDS } from '../../lib/assets/backgrounds';
import { hashSeed, makeRng } from '../../lib/features/tarot/random';
import { commonStyles } from '../../lib/ui/commonStyles';
import { ScreenScroll } from '../../lib/ui/ScreenScroll';
import { UI } from '../../lib/ui/tokens';
import SectionCard from './_components/SectionCard';

type LineValue = 6 | 7 | 8 | 9;

type TrigramKey = 'qian' | 'kun' | 'zhen' | 'xun' | 'kan' | 'li' | 'gen' | 'dui';

const LINE_LABELS = ['초효', '이효', '삼효', '사효', '오효', '상효'] as const;

const TRIGRAMS: Record<
  string,
  { key: TrigramKey; ko: string; hanja: string; symbol: string; keywords: string[]; vibe: string }
> = {
  '111': { key: 'qian', ko: '건(하늘)', hanja: '乾', symbol: '☰', keywords: ['결단', '시작', '주도권'], vibe: '위로 끌어올리는 힘' },
  '000': { key: 'kun', ko: '곤(땅)', hanja: '坤', symbol: '☷', keywords: ['수용', '안정', '지속'], vibe: '받아들이고 키우는 힘' },
  '100': { key: 'zhen', ko: '진(우레)', hanja: '震', symbol: '☳', keywords: ['각성', '돌파', '속도'], vibe: '움직여서 깨우는 힘' },
  '011': { key: 'xun', ko: '손(바람)', hanja: '巽', symbol: '☴', keywords: ['침투', '설득', '유연'], vibe: '스며들어 바꾸는 힘' },
  '010': { key: 'kan', ko: '감(물)', hanja: '坎', symbol: '☵', keywords: ['위험', '깊이', '집중'], vibe: '깊이를 요구하는 힘' },
  '101': { key: 'li', ko: '리(불)', hanja: '離', symbol: '☲', keywords: ['명확', '표현', '주목'], vibe: '밝히고 드러내는 힘' },
  '001': { key: 'gen', ko: '간(산)', hanja: '艮', symbol: '☶', keywords: ['멈춤', '경계', '정리'], vibe: '멈추고 지키는 힘' },
  '110': { key: 'dui', ko: '태(못)', hanja: '兌', symbol: '☱', keywords: ['기쁨', '교류', '완화'], vibe: '교류로 풀어내는 힘' },
};

function nowTimeText(now: Date): string {
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function tossLines(seedText: string): LineValue[] {
  const rng = makeRng(hashSeed(seedText));
  const lines: LineValue[] = [];
  for (let i = 0; i < 6; i += 1) {
    let sum: 6 | 7 | 8 | 9 = 6;
    for (let c = 0; c < 3; c += 1) {
      sum = (sum + (rng() < 0.5 ? 0 : 1)) as 6 | 7 | 8 | 9;
    }
    lines.push(sum);
  }
  return lines;
}

function isYang(v: LineValue): boolean {
  return v === 7 || v === 9;
}

function isMoving(v: LineValue): boolean {
  return v === 6 || v === 9;
}

function trigramBits(linesBottomToTop: LineValue[]): string {
  return linesBottomToTop.map((v) => (isYang(v) ? '1' : '0')).join('');
}

function movementTone(movingCount: number): string {
  if (movingCount >= 4) return '큰 변화';
  if (movingCount >= 2) return '변화 감지';
  if (movingCount === 1) return '미세 조정';
  return '흐름 유지';
}

function buildReadingText(upperBits: string, lowerBits: string, movingCount: number): string {
  const upper = TRIGRAMS[upperBits];
  const lower = TRIGRAMS[lowerBits];
  const u = upper ?? { ko: '알 수 없음', hanja: '', symbol: '', keywords: [], vibe: '' };
  const l = lower ?? { ko: '알 수 없음', hanja: '', symbol: '', keywords: [], vibe: '' };

  const intensity =
    movingCount >= 4 ? '변화가 큰 날' : movingCount >= 2 ? '변화가 있는 날' : movingCount === 1 ? '미세 조정의 날' : '흐름 유지의 날';

  const keywords = [...u.keywords, ...l.keywords].slice(0, 6);

  return [
    `[괘상 요약]`,
    `- 상괘: ${u.symbol} ${u.ko} ${u.hanja ? `(${u.hanja})` : ''}`,
    `- 하괘: ${l.symbol} ${l.ko} ${l.hanja ? `(${l.hanja})` : ''}`,
    `- 변화(동효): ${movingCount}개 → ${intensity}`,
    '',
    `[핵심 키워드]`,
    `- ${keywords.join(' · ') || '—'}`,
    '',
    `[해석]`,
    `- 상괘는 “${u.vibe}”, 하괘는 “${l.vibe}”에 가깝습니다.`,
    `- 오늘은 ${intensity}로 읽히며, “${u.keywords[0] ?? '정리'}”와 “${l.keywords[0] ?? '균형'}” 사이의 균형이 포인트가 될 수 있습니다.`,
    '',
    `[조언]`,
    `- 크게 바꾸기보다, 기준(규칙) 1개를 정하고 그 기준에 맞춰 행동을 줄여보세요.`,
    `- 일이든 관계든 “합의할 문장 1개”를 남기면 흐름이 안정됩니다.`,
    '',
    `[주의]`,
    `- ${movingCount >= 2 ? '변화가 있는 날에는 과속/충돌이 나기 쉬워요. 속도보다 순서를 챙기세요.' : '흐름이 유지되는 날에는 미루기가 늘 수 있어요. 30분짜리 행동 1개로 리듬을 올리세요.'}`,
    '',
    `[실천 3줄]`,
    `- (1) 오늘 해야 할 일 3개를 적고, 1개만 “완료”`,
    `- (2) 지출/약속/작업 중 하나만 “한도” 정하기`,
    `- (3) 답답하면 10분 산책 또는 호흡 20회`,
  ].join('\n');
}

export default function IChingScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const [now, setNow] = useState<Date>(() => new Date());
  const [pickedAt, setPickedAt] = useState<Date | null>(null);
  const [lines, setLines] = useState<LineValue[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      setLines(null);
      setPickedAt(null);
      return undefined;
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      const navAny = navigation as any;
      const unsub = navAny.addListener('tabPress', () => {
        if (!navAny.isFocused()) return;
        setLines(null);
        setPickedAt(null);
      });
      return unsub;
    }, [navigation]),
  );

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 250);
    return () => clearInterval(t);
  }, []);

  const pick = (): void => {
    const t = new Date();
    setPickedAt(t);
    setLines(tossLines(t.toISOString()));
  };

  const { movingCount, readingText, upperTrigram, lowerTrigram, keywords, summaryLine, toneLabel } = useMemo(() => {
    if (!lines) {
      return {
        movingCount: 0,
        readingText: '',
        upperTrigram: null,
        lowerTrigram: null,
        keywords: [] as string[],
        summaryLine: '',
        toneLabel: '',
      };
    }

    const lower = lines.slice(0, 3);
    const upper = lines.slice(3, 6);
    const lowerBits = trigramBits(lower);
    const upperBits = trigramBits(upper);
    const mc = lines.filter(isMoving).length;
    const upperMeta = TRIGRAMS[upperBits] ?? null;
    const lowerMeta = TRIGRAMS[lowerBits] ?? null;
    const keywordList = [...(upperMeta?.keywords ?? []), ...(lowerMeta?.keywords ?? [])].slice(0, 5);
    const tone = movementTone(mc);

    return {
      movingCount: mc,
      readingText: buildReadingText(upperBits, lowerBits, mc),
      upperTrigram: upperMeta,
      lowerTrigram: lowerMeta,
      keywords: keywordList,
      summaryLine:
        upperMeta && lowerMeta
          ? `${upperMeta.ko}의 방향과 ${lowerMeta.ko}의 기반이 겹치며 ${tone.toLowerCase()} 흐름이 잡혀요.`
          : `${tone} 흐름으로 읽히는 하루예요.`,
      toneLabel: tone,
    };
  }, [lines]);

  return (
    <ScreenScroll background={BACKGROUNDS.iching} contentContainerStyle={[commonStyles.screen, styles.container]}>
      <View style={[commonStyles.hero, styles.hero]}>
        <View style={styles.heroTopRow}>
          <Text style={styles.heroEyebrow}>I CHING TIME CAST</Text>
          <View style={styles.heroChip}>
            <Text style={styles.heroChipText}>현재 시각 6효</Text>
          </View>
        </View>
        <Text style={commonStyles.heroTitle}>지금 흐름을 육효로 읽어봐요</Text>
        <Text style={styles.heroLine}>지금 시간을 기준으로 6효를 만들고 오늘의 흐름을 간단히 보여줘요.</Text>

        <Pressable onPress={pick} style={({ pressed }) => [styles.clock, pressed && styles.pressed]}>
          <Text style={styles.clockText}>{nowTimeText(now)}</Text>
          <Text style={styles.clockHint}>탭해서 이 시간으로 점치기</Text>
        </Pressable>

        <View style={styles.heroFootRow}>
          <Text style={styles.heroFootItem}>탭 1회</Text>
          <Text style={styles.heroFootDivider}>·</Text>
          <Text style={styles.heroFootItem}>6효 생성</Text>
          <Text style={styles.heroFootDivider}>·</Text>
          <Text style={styles.heroFootItem}>흐름 해석</Text>
        </View>
      </View>

      {lines ? (
        <>
          <SectionCard title="괘상 한눈에 보기">
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLine}>{summaryLine}</Text>
              <View style={[styles.resultChip, movingCount >= 2 && styles.resultChipActive]}>
                <Text style={[styles.resultChipText, movingCount >= 2 && styles.resultChipTextActive]}>{toneLabel}</Text>
              </View>
            </View>

            <Text style={styles.meta}>
              선택 시각: {pickedAt ? pickedAt.toLocaleString() : '-'} · 동효 {movingCount}개
            </Text>

            <View style={styles.triRow}>
              <View style={styles.triCard}>
                <Text style={styles.triTitle}>상괘</Text>
                <Text style={styles.triValue}>
                  {upperTrigram?.symbol ?? '—'} {upperTrigram?.ko ?? '—'}
                </Text>
                <Text style={styles.triHint}>{upperTrigram?.vibe ?? '방향을 읽는 힘'}</Text>
              </View>
              <View style={styles.triCard}>
                <Text style={styles.triTitle}>하괘</Text>
                <Text style={styles.triValue}>
                  {lowerTrigram?.symbol ?? '—'} {lowerTrigram?.ko ?? '—'}
                </Text>
                <Text style={styles.triHint}>{lowerTrigram?.vibe ?? '기반을 읽는 힘'}</Text>
              </View>
            </View>

            {keywords.length ? (
              <View style={styles.keywordRow}>
                {keywords.map((keyword) => (
                  <View key={keyword} style={styles.keywordChip}>
                    <Text style={styles.keywordChipText}>{keyword}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.lineStack}>
              {lines
                .slice()
                .reverse()
                .map((line, index) => {
                  const originalIndex = lines.length - 1 - index;
                  const moving = isMoving(line);
                  const yang = isYang(line);

                  return (
                    <View key={`${LINE_LABELS[originalIndex]}-${line}-${index}`} style={styles.lineRow}>
                      <Text style={styles.lineLabel}>{LINE_LABELS[originalIndex]}</Text>
                      <View style={styles.lineTrack}>
                        {yang ? (
                          <View style={styles.yangLine} />
                        ) : (
                          <View style={styles.yinWrap}>
                            <View style={styles.yinHalf} />
                            <View style={styles.yinGap} />
                            <View style={styles.yinHalf} />
                          </View>
                        )}
                      </View>
                      <View style={[styles.motionChip, moving && styles.motionChipActive]}>
                        <Text style={[styles.motionChipText, moving && styles.motionChipTextActive]}>{moving ? '동' : '정'}</Text>
                      </View>
                    </View>
                  );
                })}
            </View>
          </SectionCard>

          <SectionCard title="오늘의 해석">
            <Text style={styles.detailLead}>먼저 괘상의 방향과 변화량을 보고, 아래 문장으로 오늘의 리듬을 읽어보세요.</Text>
            <Text style={styles.pre}>{readingText}</Text>
          </SectionCard>

          <Pressable onPress={pick} style={({ pressed }) => [commonStyles.primaryBtn, styles.recastBtn, pressed && commonStyles.pressed]}>
            <Text style={commonStyles.primaryBtnText}>다시 점치기</Text>
          </Pressable>
        </>
      ) : (
        <SectionCard title="읽는 방식" tone="ink">
          <View style={styles.guideList}>
            <View style={styles.guideItem}>
              <View style={styles.guideBadge}>
                <Text style={styles.guideBadgeText}>1</Text>
              </View>
              <Text style={styles.guideText}>시계를 탭하면 그 시각을 기준으로 6효가 바로 생성돼요.</Text>
            </View>
            <View style={styles.guideItem}>
              <View style={styles.guideBadge}>
                <Text style={styles.guideBadgeText}>2</Text>
              </View>
              <Text style={styles.guideText}>상괘, 하괘, 동효 개수를 먼저 보고 오늘의 변화량을 읽어요.</Text>
            </View>
            <View style={styles.guideItem}>
              <View style={styles.guideBadge}>
                <Text style={styles.guideBadgeText}>3</Text>
              </View>
              <Text style={styles.guideText}>마지막 실천 3줄만 뽑아도 오늘 행동 기준을 세우기 좋아요.</Text>
            </View>
          </View>
        </SectionCard>
      )}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  hero: {
    gap: 12,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    flexWrap: 'wrap',
  },
  heroEyebrow: {
    color: 'rgba(242,241,239,0.68)',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  heroChip: {
    borderRadius: UI.radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(8,13,28,0.42)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  heroChipText: {
    color: '#f2f1ef',
    fontSize: 11,
    fontWeight: '900',
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
  heroFootRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  heroFootItem: {
    color: 'rgba(242,241,239,0.74)',
    fontSize: 11,
    fontWeight: '800',
  },
  heroFootDivider: {
    color: 'rgba(242,241,239,0.34)',
    fontSize: 12,
    fontWeight: '900',
  },
  meta: {
    color: UI.colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  guideList: {
    gap: 12,
  },
  guideItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  guideBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(247,201,72,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(247,201,72,0.34)',
  },
  guideBadgeText: {
    color: UI.colors.gold,
    fontSize: 12,
    fontWeight: '900',
  },
  guideText: {
    flex: 1,
    color: '#f2f1ef',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  summaryLine: {
    flex: 1,
    color: UI.colors.text,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
  },
  resultChip: {
    borderRadius: UI.radius.pill,
    borderWidth: 1,
    borderColor: UI.colors.line,
    backgroundColor: UI.colors.paperSoft,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  resultChipActive: {
    borderColor: UI.colors.gold,
    backgroundColor: '#fff6d6',
  },
  resultChipText: {
    color: UI.colors.text,
    fontSize: 11,
    fontWeight: '900',
  },
  resultChipTextActive: {
    color: UI.colors.text,
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
  triHint: {
    color: UI.colors.muted,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
  },
  keywordRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  keywordChip: {
    borderRadius: UI.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: '#f4efe7',
    borderWidth: 1,
    borderColor: '#e3dacf',
  },
  keywordChipText: {
    color: UI.colors.text,
    fontSize: 11,
    fontWeight: '900',
  },
  lineStack: {
    gap: 8,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  lineLabel: {
    width: 38,
    color: UI.colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  lineTrack: {
    flex: 1,
    minHeight: 16,
    justifyContent: 'center',
  },
  yangLine: {
    height: 6,
    borderRadius: 999,
    backgroundColor: UI.colors.ink,
  },
  yinWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  yinHalf: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    backgroundColor: UI.colors.ink,
  },
  yinGap: {
    width: 18,
  },
  motionChip: {
    minWidth: 34,
    borderRadius: UI.radius.pill,
    borderWidth: 1,
    borderColor: UI.colors.line,
    backgroundColor: UI.colors.paperSoft,
    paddingVertical: 5,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  motionChipActive: {
    borderColor: UI.colors.gold,
    backgroundColor: '#fff6d6',
  },
  motionChipText: {
    color: UI.colors.muted,
    fontSize: 11,
    fontWeight: '900',
  },
  motionChipTextActive: {
    color: UI.colors.text,
  },
  detailLead: {
    color: UI.colors.muted,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
  },
  pre: {
    fontSize: 13,
    lineHeight: 20,
    color: '#111827',
  },
  recastBtn: {
    marginTop: -4,
  },
});
