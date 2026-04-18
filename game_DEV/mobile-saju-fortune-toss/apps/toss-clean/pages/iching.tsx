import { createRoute } from '@granite-js/react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { registerAstraChecklistVisit } from '../src/features/astra/affection';
import { ICHING_CTA_HERO_DATA_URI_IMAGE } from '../src/features/assets/registry';
import { AppShell } from '../src/ui/AppShell';
import { APP_THEME } from '../src/ui/theme';
import { useTopLevelBackBehavior } from '../src/ui/useTopLevelBackBehavior';

type LineValue = 6 | 7 | 8 | 9;

type TrigramMeta = {
  ko: string;
  hanja: string;
  symbol: string;
  keywords: string[];
  vibe: string;
};

const TRIGRAMS: Record<string, TrigramMeta> = {
  '111': {
    ko: '\uAC74',
    hanja: '\u4E7E',
    symbol: '\u2630',
    keywords: ['\uACB0\uB2E8', '\uC2DC\uC791', '\uC8FC\uB3C4'],
    vibe: '\uBC14\uAE65\uC73C\uB85C \uBC00\uC5B4 \uB098\uAC00\uB294 \uD798',
  },
  '000': {
    ko: '\uACE4',
    hanja: '\u5764',
    symbol: '\u2637',
    keywords: ['\uC218\uC6A9', '\uC548\uC815', '\uAE30\uBC18'],
    vibe: '\uBC1B\uC544\uB4E4\uC774\uACE0 \uBC1B\uCCD0 \uC8FC\uB294 \uD750\uB984',
  },
  '100': {
    ko: '\uC9C4',
    hanja: '\u9707',
    symbol: '\u2633',
    keywords: ['\uAC01\uC131', '\uB3CC\uD30C', '\uC18D\uB3C4'],
    vibe: '\uD280\uC5B4 \uC624\uB974\uBA70 \uAE68\uC6B0\uB294 \uD750\uB984',
  },
  '011': {
    ko: '\uC190',
    hanja: '\u5DFD',
    symbol: '\u2634',
    keywords: ['\uCE68\uD22C', '\uC801\uC751', '\uC720\uC5F0'],
    vibe: '\uBD80\uB4DC\uB7FD\uAC8C \uC2A4\uBA70\uB4DC\uB294 \uD750\uB984',
  },
  '010': {
    ko: '\uAC10',
    hanja: '\u574E',
    symbol: '\u2635',
    keywords: ['\uAE4A\uC774', '\uC9D1\uC911', '\uACBD\uACC4'],
    vibe: '\uAE4A\uC774 \uD751\uB7EC \uB0B4\uB824\uAC00\uB294 \uD750\uB984',
  },
  '101': {
    ko: '\uB9AC',
    hanja: '\u96E2',
    symbol: '\u2632',
    keywords: ['\uBA85\uD655', '\uD45C\uD604', '\uC2DC\uC120'],
    vibe: '\uBC1D\uAC8C \uBE44\uCD94\uACE0 \uBCF4\uC5EC \uC8FC\uB294 \uD750\uB984',
  },
  '001': {
    ko: '\uAC04',
    hanja: '\u826E',
    symbol: '\u2636',
    keywords: ['\uBA48\uCDA4', '\uC815\uB9AC', '\uACBD\uACC4'],
    vibe: '\uBA48\uCD94\uACE0 \uC815\uB9AC\uD558\uB294 \uD750\uB984',
  },
  '110': {
    ko: '\uD0DC',
    hanja: '\u514C',
    symbol: '\u2631',
    keywords: ['\uAE30\uC068', '\uAD50\uB958', '\uC720\uC5F0'],
    vibe: '\uBD80\uB4DC\uB7FD\uAC8C \uD37C\uC838 \uB098\uAC00\uB294 \uD750\uB984',
  },
};

const TITLE_ICHING = '\uC9C0\uAE08\uC758 \uC6B4';
const LABEL_HEADER = 'I-CHING';
const LABEL_TITLE = '\uC9C0\uAE08\uC758 \uC6B4\uC744 \uD655\uC778\uD569\uB2C8\uB2E4';
const LABEL_RESULT = '\uC9C0\uAE08\uC758 \uAD18';
const LABEL_UPPER = '\uC0C1\uAD18';
const LABEL_LOWER = '\uD558\uAD18';
const LABEL_RETRY = '\uB2E4\uC2DC \uC810\uCE58\uAE30';

function nowTimeText(now: Date): string {
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function hashSeed(text: string): number {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function makeRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let x = Math.imul(state ^ (state >>> 15), 1 | state);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function tossLines(seedText: string): LineValue[] {
  const rng = makeRng(hashSeed(seedText));
  const lines: LineValue[] = [];

  for (let lineIndex = 0; lineIndex < 6; lineIndex += 1) {
    let sum: LineValue = 6;
    for (let coinIndex = 0; coinIndex < 3; coinIndex += 1) {
      sum = (sum + (rng() < 0.5 ? 0 : 1)) as LineValue;
    }
    lines.push(sum);
  }

  return lines;
}

function isYang(value: LineValue): boolean {
  return value === 7 || value === 9;
}

function isMoving(value: LineValue): boolean {
  return value === 6 || value === 9;
}

function trigramBits(linesBottomToTop: LineValue[]): string {
  return linesBottomToTop.map((value) => (isYang(value) ? '1' : '0')).join('');
}

function lineLabel(value: LineValue): string {
  if (value === 6) return '\uC74C\uD6A8 \u00B7 \uBCC0\uD6A8';
  if (value === 7) return '\uC591\uD6A8';
  if (value === 8) return '\uC74C\uD6A8';
  return '\uC591\uD6A8 \u00B7 \uBCC0\uD6A8';
}

function buildReadingText(upperBits: string, lowerBits: string, movingCount: number): string {
  const upper = TRIGRAMS[upperBits];
  const lower = TRIGRAMS[lowerBits];
  const upperSafe = upper ?? { ko: '\uBBF8\uC0C1', hanja: '', symbol: '?', keywords: [], vibe: '' };
  const lowerSafe = lower ?? { ko: '\uBBF8\uC0C1', hanja: '', symbol: '?', keywords: [], vibe: '' };
  const intensity =
    movingCount >= 4
      ? '\uBCC0\uD654\uAC00 \uD070 \uD750\uB984'
      : movingCount >= 2
        ? '\uBCC0\uD654\uAC00 \uC788\uB294 \uD750\uB984'
        : movingCount === 1
          ? '\uBBF8\uC138\uD55C \uC870\uC815\uC758 \uD750\uB984'
          : '\uC720\uC9C0\uB418\uB294 \uD750\uB984';
  const keywords = [...upperSafe.keywords, ...lowerSafe.keywords].slice(0, 6);

  return [
    '[\uC9C0\uAE08\uC758 \uD750\uB984 \uC694\uC57D]',
    `- \uC0C1\uAD18: ${upperSafe.symbol} ${upperSafe.ko}${upperSafe.hanja ? ` (${upperSafe.hanja})` : ''}`,
    `- \uD558\uAD18: ${lowerSafe.symbol} ${lowerSafe.ko}${lowerSafe.hanja ? ` (${lowerSafe.hanja})` : ''}`,
    `- \uBCC0\uD654: ${movingCount}\uAC1C \u00B7 ${intensity}`,
    '',
    '[\uC6C0\uC9C1\uC774\uB294 \uD0A4\uC6CC\uB4DC]',
    `- ${keywords.join(' \u00B7 ') || '\uC815\uB9AC \u00B7 \uBC29\uD5A5 \u00B7 \uADE0\uD615'}`,
    '',
    '[\uD574\uC11D]',
    `- ${upperSafe.vibe}\uACFC ${lowerSafe.vibe}\uC774 \uC9C0\uAE08\uC758 \uD750\uB984 \uC548\uC5D0\uC11C \uD568\uAED8 \uC791\uC6A9\uD558\uACE0 \uC788\uC2B5\uB2C8\uB2E4.`,
    `- \uC9C0\uAE08\uC740 ${intensity}\uC774\uB77C ${upperSafe.keywords[0] ?? '\uC815\uB9AC'}\uC640 ${
      lowerSafe.keywords[0] ?? '\uADE0\uD615'
    } \uC0AC\uC774\uC758 \uBE44\uC911\uC744 \uB9DE\uCD94\uB294 \uAC83\uC774 \uC911\uC694\uD569\uB2C8\uB2E4.`,
    '',
    '[\uC870\uC5B8]',
    '- \uC624\uB298 \uAC00\uC7A5 \uBA3C\uC800 \uBCF4\uACE0 \uB118\uC5B4\uAC08 \uAE30\uC900 \uD558\uB098\uB97C \uC815\uD558\uACE0 \uADF8 \uAE30\uC900\uC5D0 \uB9DE\uB294 \uD589\uB3D9\uB9CC \uAEBC\uB0B4 \uBCF4\uC138\uC694.',
    '- \uBC18\uC751\uBCF4\uB2E4 \uB9AC\uB4EC\uC744 \uBA3C\uC800 \uC9C0\uD0A4\uBA74 \uC9C0\uAE08\uC758 \uD750\uB984\uC774 \uB354 \uC120\uBA85\uD558\uAC8C \uBCF4\uC785\uB2C8\uB2E4.',
  ].join('\n');
}

export const Route = createRoute('/iching', {
  component: Page,
});

function Page(): React.JSX.Element {
  const navigation = Route.useNavigation();
  useTopLevelBackBehavior({ activePath: '/iching', navigation });
  const [now, setNow] = useState<Date>(() => new Date());
  const [pickedAt, setPickedAt] = useState<Date | null>(null);
  const [lines, setLines] = useState<LineValue[] | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 250);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    void registerAstraChecklistVisit('iching', 'root');
  }, []);

  useEffect(() => {
    if (!lines) {
      return;
    }
    void registerAstraChecklistVisit('iching', 'detail');
  }, [lines]);

  const pick = () => {
    const target = new Date();
    setPickedAt(target);
    setLines(tossLines(target.toISOString()));
  };

  const reset = () => {
    setPickedAt(null);
    setLines(null);
  };

  const reading = useMemo(() => {
    if (!lines) {
      return { upperBits: '', lowerBits: '', movingCount: 0, text: '' };
    }

    const lowerBits = trigramBits(lines.slice(0, 3));
    const upperBits = trigramBits(lines.slice(3, 6));
    const movingCount = lines.filter(isMoving).length;

    return {
      upperBits,
      lowerBits,
      movingCount,
      text: buildReadingText(upperBits, lowerBits, movingCount),
    };
  }, [lines]);

  return (
    <AppShell
      activePath="/iching"
      currentPath="/iching"
      navigation={navigation}
      title={TITLE_ICHING}
      onTabReselect={reset}
    >
      <View style={styles.hero}>
        <Text style={styles.kicker}>{LABEL_HEADER}</Text>
        <Text style={styles.title}>{LABEL_TITLE}</Text>
        <Pressable style={({ pressed }) => [styles.ctaHero, pressed && styles.pressed]} onPress={pick}>
          <Image source={ICHING_CTA_HERO_DATA_URI_IMAGE} style={styles.ctaHeroImage} resizeMode="cover" />
          <View style={styles.ctaHeroShade} />
          <View style={styles.ctaHeroCopy}>
            <Text style={styles.ctaHeroTitle}>{LABEL_TITLE}</Text>
            <Text style={styles.ctaHeroBody}>{'\uC2DC\uAC04\uC758 \uD750\uB984\uC744 \uB530\uB77C \uC9C0\uAE08 \uC5F4\uB9B0 \uAD18\uB97C \uD655\uC778\uD574\uBCF4\uC138\uC694.'}</Text>
          </View>
          <View style={styles.clockChip}>
            <Text style={styles.clockText}>{nowTimeText(now)}</Text>
          </View>
        </Pressable>
      </View>

      {lines ? (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>{LABEL_RESULT}</Text>
          <Text style={styles.resultMeta}>
            {'\uC120\uD0DD \uC2DC\uAC01'}: {pickedAt ? pickedAt.toLocaleString() : '-'} {'\u00B7 \uBCC0\uD654'}{' '}
            {reading.movingCount}
            {'\uAC1C'}
          </Text>

          <View style={styles.lineStack}>
            {lines
              .slice()
              .reverse()
              .map((line, index) => {
                const moving = isMoving(line);
                const yang = isYang(line);

                return (
                  <View key={`${index}-${line}`} style={styles.lineRow}>
                    <View style={styles.lineBars}>
                      {yang ? (
                        <View style={[styles.lineBar, moving && styles.lineBarMoving]} />
                      ) : (
                        <>
                          <View style={[styles.lineBarHalf, moving && styles.lineBarMoving]} />
                          <View style={styles.lineGap} />
                          <View style={[styles.lineBarHalf, moving && styles.lineBarMoving]} />
                        </>
                      )}
                    </View>
                    <Text style={styles.lineLabelText}>{lineLabel(line)}</Text>
                  </View>
                );
              })}
          </View>

          <View style={styles.trigramRow}>
            <View style={styles.trigramCard}>
              <Text style={styles.trigramLabel}>{LABEL_UPPER}</Text>
              <Text style={styles.trigramValue}>
                {TRIGRAMS[reading.upperBits]?.symbol ?? '?'} {TRIGRAMS[reading.upperBits]?.ko ?? '\uBBF8\uC0C1'}
              </Text>
            </View>
            <View style={styles.trigramCard}>
              <Text style={styles.trigramLabel}>{LABEL_LOWER}</Text>
              <Text style={styles.trigramValue}>
                {TRIGRAMS[reading.lowerBits]?.symbol ?? '?'} {TRIGRAMS[reading.lowerBits]?.ko ?? '\uBBF8\uC0C1'}
              </Text>
            </View>
          </View>

          <Text style={styles.resultBody}>{reading.text}</Text>

          <Pressable style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]} onPress={pick}>
            <Text style={styles.retryButtonText}>{LABEL_RETRY}</Text>
          </Pressable>
        </View>
      ) : null}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 24,
    backgroundColor: APP_THEME.colors.panel,
    borderWidth: 1,
    borderColor: APP_THEME.colors.line,
    paddingHorizontal: 15,
    paddingVertical: 14,
    gap: 6,
  },
  kicker: {
    color: APP_THEME.colors.accent,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  title: {
    color: APP_THEME.colors.textOnDark,
    fontSize: 21,
    fontWeight: '900',
    lineHeight: 26,
  },
  ctaHero: {
    minHeight: 164,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: '#101520',
    justifyContent: 'space-between',
  },
  ctaHeroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  ctaHeroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 12, 22, 0.22)',
  },
  ctaHeroCopy: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 4,
    maxWidth: '74%',
  },
  ctaHeroTitle: {
    color: '#FBF8F2',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
  },
  ctaHeroBody: {
    color: 'rgba(251,248,242,0.82)',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
  },
  clockChip: {
    alignSelf: 'flex-start',
    marginLeft: 16,
    marginBottom: 16,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(8,13,28,0.74)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  clockText: {
    color: APP_THEME.colors.accent,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
  },
  resultCard: {
    borderRadius: 24,
    backgroundColor: APP_THEME.colors.card,
    borderWidth: 1,
    borderColor: '#E6DDCF',
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 10,
  },
  resultTitle: {
    color: APP_THEME.colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  resultMeta: {
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 18,
  },
  lineStack: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E6DDCF',
    backgroundColor: '#F7F4EE',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lineBars: {
    width: 108,
    minHeight: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineBar: {
    width: 90,
    height: 10,
    borderRadius: 999,
    backgroundColor: APP_THEME.colors.bg,
  },
  lineBarHalf: {
    width: 40,
    height: 10,
    borderRadius: 999,
    backgroundColor: APP_THEME.colors.bg,
  },
  lineGap: {
    width: 10,
  },
  lineBarMoving: {
    backgroundColor: APP_THEME.colors.accent,
  },
  lineLabelText: {
    flex: 1,
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '800',
  },
  trigramRow: {
    flexDirection: 'row',
    gap: 10,
  },
  trigramCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E6DDCF',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 6,
  },
  trigramLabel: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '900',
  },
  trigramValue: {
    color: APP_THEME.colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  resultBody: {
    color: APP_THEME.colors.text,
    fontSize: 14,
    lineHeight: 24,
  },
  retryButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: APP_THEME.colors.bg,
  },
  retryButtonText: {
    color: APP_THEME.colors.textOnDark,
    fontSize: 13,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
});
