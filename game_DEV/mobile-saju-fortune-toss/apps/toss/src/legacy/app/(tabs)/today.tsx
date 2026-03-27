import { useCallback, useMemo, useState } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { BACKGROUNDS } from '../../lib/assets/backgrounds';
import { commonStyles } from '../../lib/ui/commonStyles';
import { ScreenScroll } from '../../lib/ui/ScreenScroll';
import { UI } from '../../lib/ui/tokens';
import SectionCard from './_components/SectionCard';
import { hashSeed, makeRng } from '../../lib/features/tarot/random';

type DailyKind = 'western' | 'chinese';
type DailySelection = { kind: DailyKind; key: string } | null;

type WesternZodiacKey =
  | 'aries'
  | 'taurus'
  | 'gemini'
  | 'cancer'
  | 'leo'
  | 'virgo'
  | 'libra'
  | 'scorpio'
  | 'sagittarius'
  | 'capricorn'
  | 'aquarius'
  | 'pisces';

function kstDateKey(now = new Date()): string {
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const d = String(kst.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function chunkIntoRows<T>(items: readonly T[], columns: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += columns) {
    rows.push(items.slice(i, i + columns));
  }
  return rows;
}

const WESTERN_ZODIAC_ICON_IMAGES: Record<WesternZodiacKey, ImageSourcePropType> = {
  aries: require('../../assets/icons/zodiac/western/aries.png'),
  taurus: require('../../assets/icons/zodiac/western/taurus.png'),
  gemini: require('../../assets/icons/zodiac/western/gemini.png'),
  cancer: require('../../assets/icons/zodiac/western/cancer.png'),
  leo: require('../../assets/icons/zodiac/western/leo.png'),
  virgo: require('../../assets/icons/zodiac/western/virgo.png'),
  libra: require('../../assets/icons/zodiac/western/libra.png'),
  scorpio: require('../../assets/icons/zodiac/western/scorpio.png'),
  sagittarius: require('../../assets/icons/zodiac/western/sagittarius.png'),
  capricorn: require('../../assets/icons/zodiac/western/capricorn.png'),
  aquarius: require('../../assets/icons/zodiac/western/aquarius.png'),
  pisces: require('../../assets/icons/zodiac/western/pisces.png'),
};

const WESTERN_ZODIAC_DETAIL_IMAGES: Record<WesternZodiacKey, ImageSourcePropType> = {
  aries: require('../../assets/zodiac/western/aries.png'),
  taurus: require('../../assets/zodiac/western/taurus.png'),
  gemini: require('../../assets/zodiac/western/gemini.png'),
  cancer: require('../../assets/zodiac/western/cancer.png'),
  leo: require('../../assets/zodiac/western/leo.png'),
  virgo: require('../../assets/zodiac/western/virgo.png'),
  libra: require('../../assets/zodiac/western/libra.png'),
  scorpio: require('../../assets/zodiac/western/scorpio.png'),
  sagittarius: require('../../assets/zodiac/western/sagittarius.png'),
  capricorn: require('../../assets/zodiac/western/capricorn.png'),
  aquarius: require('../../assets/zodiac/western/aquarius.png'),
  pisces: require('../../assets/zodiac/western/pisces.png'),
};

const WESTERN_ZODIAC: Array<{
  key: WesternZodiacKey;
  name: string;
  iconImage: ImageSourcePropType;
  detailImage: ImageSourcePropType;
}> = [
  { key: 'aries', name: '양자리', iconImage: WESTERN_ZODIAC_ICON_IMAGES.aries, detailImage: WESTERN_ZODIAC_DETAIL_IMAGES.aries },
  { key: 'taurus', name: '황소자리', iconImage: WESTERN_ZODIAC_ICON_IMAGES.taurus, detailImage: WESTERN_ZODIAC_DETAIL_IMAGES.taurus },
  { key: 'gemini', name: '쌍둥이자리', iconImage: WESTERN_ZODIAC_ICON_IMAGES.gemini, detailImage: WESTERN_ZODIAC_DETAIL_IMAGES.gemini },
  { key: 'cancer', name: '게자리', iconImage: WESTERN_ZODIAC_ICON_IMAGES.cancer, detailImage: WESTERN_ZODIAC_DETAIL_IMAGES.cancer },
  { key: 'leo', name: '사자자리', iconImage: WESTERN_ZODIAC_ICON_IMAGES.leo, detailImage: WESTERN_ZODIAC_DETAIL_IMAGES.leo },
  { key: 'virgo', name: '처녀자리', iconImage: WESTERN_ZODIAC_ICON_IMAGES.virgo, detailImage: WESTERN_ZODIAC_DETAIL_IMAGES.virgo },
  { key: 'libra', name: '천칭자리', iconImage: WESTERN_ZODIAC_ICON_IMAGES.libra, detailImage: WESTERN_ZODIAC_DETAIL_IMAGES.libra },
  { key: 'scorpio', name: '전갈자리', iconImage: WESTERN_ZODIAC_ICON_IMAGES.scorpio, detailImage: WESTERN_ZODIAC_DETAIL_IMAGES.scorpio },
  { key: 'sagittarius', name: '사수자리', iconImage: WESTERN_ZODIAC_ICON_IMAGES.sagittarius, detailImage: WESTERN_ZODIAC_DETAIL_IMAGES.sagittarius },
  { key: 'capricorn', name: '염소자리', iconImage: WESTERN_ZODIAC_ICON_IMAGES.capricorn, detailImage: WESTERN_ZODIAC_DETAIL_IMAGES.capricorn },
  { key: 'aquarius', name: '물병자리', iconImage: WESTERN_ZODIAC_ICON_IMAGES.aquarius, detailImage: WESTERN_ZODIAC_DETAIL_IMAGES.aquarius },
  { key: 'pisces', name: '물고기자리', iconImage: WESTERN_ZODIAC_ICON_IMAGES.pisces, detailImage: WESTERN_ZODIAC_DETAIL_IMAGES.pisces },
];

const CHINESE_ZODIAC_ORDER = [
  'rat',
  'ox',
  'tiger',
  'rabbit',
  'dragon',
  'snake',
  'horse',
  'goat',
  'monkey',
  'rooster',
  'dog',
  'pig',
] as const;

const CHINESE_ZODIAC_ICON_IMAGES: Record<(typeof CHINESE_ZODIAC_ORDER)[number], ImageSourcePropType> = {
  rat: require('../../assets/icons/zodiac/chinese/rat.png'),
  ox: require('../../assets/icons/zodiac/chinese/ox.png'),
  tiger: require('../../assets/dos_simple_square_app_icon_twelve_zodiac_animals_2D_clean_linea_d9aab4c4-a48b-4afb-bae0-fd3320a6b2c3.png'),
  rabbit: require('../../assets/icons/zodiac/chinese/rabbit.png'),
  dragon: require('../../assets/icons/zodiac/chinese/dragon.png'),
  snake: require('../../assets/icons/zodiac/chinese/snake.png'),
  horse: require('../../assets/icons/zodiac/chinese/horse.png'),
  goat: require('../../assets/icons/zodiac/chinese/goat.png'),
  monkey: require('../../assets/icons/zodiac/chinese/monkey.png'),
  rooster: require('../../assets/icons/zodiac/chinese/rooster.png'),
  dog: require('../../assets/icons/zodiac/chinese/dog.png'),
  pig: require('../../assets/icons/zodiac/chinese/pig.png'),
};

const CHINESE_ZODIAC_DETAIL_IMAGES: Record<(typeof CHINESE_ZODIAC_ORDER)[number], ImageSourcePropType> = {
  rat: require('../../assets/zodiac/chinese/rat.png'),
  ox: require('../../assets/zodiac/chinese/ox.png'),
  tiger: require('../../assets/zodiac/chinese/tiger.png'),
  rabbit: require('../../assets/zodiac/chinese/rabbit.png'),
  dragon: require('../../assets/zodiac/chinese/dragon.png'),
  snake: require('../../assets/zodiac/chinese/snake.png'),
  horse: require('../../assets/zodiac/chinese/horse.png'),
  goat: require('../../assets/zodiac/chinese/goat.png'),
  monkey: require('../../assets/zodiac/chinese/monkey.png'),
  rooster: require('../../assets/zodiac/chinese/rooster.png'),
  dog: require('../../assets/zodiac/chinese/dog.png'),
  pig: require('../../assets/zodiac/chinese/pig.png'),
};

const CHINESE_ZODIAC: Array<{
  key: (typeof CHINESE_ZODIAC_ORDER)[number];
  name: string;
  iconImage: ImageSourcePropType;
  detailImage: ImageSourcePropType;
}> = [
  { key: 'rat', name: '쥐띠', iconImage: CHINESE_ZODIAC_ICON_IMAGES.rat, detailImage: CHINESE_ZODIAC_DETAIL_IMAGES.rat },
  { key: 'ox', name: '소띠', iconImage: CHINESE_ZODIAC_ICON_IMAGES.ox, detailImage: CHINESE_ZODIAC_DETAIL_IMAGES.ox },
  { key: 'tiger', name: '호랑이띠', iconImage: CHINESE_ZODIAC_ICON_IMAGES.tiger, detailImage: CHINESE_ZODIAC_DETAIL_IMAGES.tiger },
  { key: 'rabbit', name: '토끼띠', iconImage: CHINESE_ZODIAC_ICON_IMAGES.rabbit, detailImage: CHINESE_ZODIAC_DETAIL_IMAGES.rabbit },
  { key: 'dragon', name: '용띠', iconImage: CHINESE_ZODIAC_ICON_IMAGES.dragon, detailImage: CHINESE_ZODIAC_DETAIL_IMAGES.dragon },
  { key: 'snake', name: '뱀띠', iconImage: CHINESE_ZODIAC_ICON_IMAGES.snake, detailImage: CHINESE_ZODIAC_DETAIL_IMAGES.snake },
  { key: 'horse', name: '말띠', iconImage: CHINESE_ZODIAC_ICON_IMAGES.horse, detailImage: CHINESE_ZODIAC_DETAIL_IMAGES.horse },
  { key: 'goat', name: '양띠', iconImage: CHINESE_ZODIAC_ICON_IMAGES.goat, detailImage: CHINESE_ZODIAC_DETAIL_IMAGES.goat },
  { key: 'monkey', name: '원숭이띠', iconImage: CHINESE_ZODIAC_ICON_IMAGES.monkey, detailImage: CHINESE_ZODIAC_DETAIL_IMAGES.monkey },
  { key: 'rooster', name: '닭띠', iconImage: CHINESE_ZODIAC_ICON_IMAGES.rooster, detailImage: CHINESE_ZODIAC_DETAIL_IMAGES.rooster },
  { key: 'dog', name: '개띠', iconImage: CHINESE_ZODIAC_ICON_IMAGES.dog, detailImage: CHINESE_ZODIAC_DETAIL_IMAGES.dog },
  { key: 'pig', name: '돼지띠', iconImage: CHINESE_ZODIAC_ICON_IMAGES.pig, detailImage: CHINESE_ZODIAC_DETAIL_IMAGES.pig },
];

function yearsForChineseZodiac(key: (typeof CHINESE_ZODIAC_ORDER)[number]): number[] {
  const idx = CHINESE_ZODIAC_ORDER.indexOf(key);
  const base = 1972 + Math.max(0, idx);
  return [base, base + 12, base + 24, base + 36];
}

const OVERALL = [
  '오늘은 해야 할 일을 작게 쪼개서 순서대로 진행하면 흐름이 빠르게 붙습니다.',
  '결정을 급하게 내리기보다 확인 가능한 기준을 먼저 세우면 실수가 크게 줄어듭니다.',
  '한 번에 많이 바꾸기보다 반복 가능한 루틴 1개를 고정하면 체감 성과가 좋습니다.',
  '관계와 일정이 동시에 움직이기 쉬운 날이라, 우선순위를 분명히 하면 마음이 편해집니다.',
  '지금은 확장보다 정리의 효율이 높은 날입니다. 작은 완료를 빠르게 쌓아보세요.',
] as const;

const MONEY = [
  '지출은 즉흥 구매보다 고정비 점검이 더 큰 효과를 냅니다. 자동결제 항목부터 확인하세요.',
  '큰 수익보다 작은 누수를 막는 흐름입니다. 결제 전 10초 체크가 유효합니다.',
  '오늘은 숫자를 적어보는 것만으로도 재정 스트레스가 줄어드는 날입니다.',
  '정산·환불·미청구 항목을 확인하면 생각보다 빠른 개선 포인트가 보입니다.',
] as const;

const LOVE = [
  '관계운은 감정보다 표현 방식이 핵심입니다. 짧고 구체적으로 말할수록 오해가 줄어듭니다.',
  '상대를 설득하기보다 먼저 이해하려는 태도가 유리한 흐름입니다.',
  '답을 빨리 내기보다 대화를 한 번 더 거치면 만족도가 높아질 수 있습니다.',
  '오늘은 작은 약속을 지키는 행동이 신뢰를 크게 올려주는 날입니다.',
] as const;

const WORK = [
  '업무운은 멀티태스킹보다 단일 집중이 유리합니다. 핵심 과제 1개를 먼저 끝내세요.',
  '메모·기록·정리 같은 기본 동작이 성과를 안정적으로 만들어줍니다.',
  '보고서나 전달문은 길이보다 명확성이 중요합니다. 한 문장 요약부터 잡아보세요.',
  '오늘은 결과물을 빠르게 공유하고 피드백 받는 방식이 잘 맞습니다.',
] as const;

const ACTIONS = [
  '30분 안에 끝낼 수 있는 작업 1개를 지금 바로 시작해보세요.',
  '오늘 미룰 일 1개와 반드시 끝낼 일 1개를 분리해서 정리하세요.',
  '결정이 필요한 일은 24시간 보류 규칙을 적용해 충동을 줄이세요.',
  '지출·시간·에너지 중 하나만 기준을 정하고 끝까지 유지해보세요.',
] as const;

function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)] as T;
}

function buildDetailText(dateKey: string, seedKey: string): string {
  const rng = makeRng(hashSeed(`${dateKey}:${seedKey}`));
  return [
    '[오늘의 흐름]',
    pick(rng, OVERALL),
    '',
    '[금전]',
    pick(rng, MONEY),
    '',
    '[관계]',
    pick(rng, LOVE),
    '',
    '[일/학업]',
    pick(rng, WORK),
    '',
    '[실행 2가지]',
    `- ${pick(rng, ACTIONS)}`,
    `- ${pick(rng, ACTIONS)}`,
  ].join('\n');
}

function IconTile({
  image,
  title,
  onPress,
}: {
  image: ImageSourcePropType;
  title: string;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.tile, pressed && commonStyles.pressed]}>
      <View style={styles.tileIconImgWrap}>
        <Image source={image} style={styles.tileIconImg} resizeMode="cover" />
      </View>
      <Text style={styles.tileTitle}>{title}</Text>
    </Pressable>
  );
}

export default function TodayFortuneScreen({
  detailBanner,
}: {
  detailBanner?: any;
}): React.JSX.Element {
  const dateKey = useMemo(() => kstDateKey(), []);
  const [selection, setSelection] = useState<DailySelection>(null);
  const [chineseYear, setChineseYear] = useState<number | null>(null);

  const selectedMeta = useMemo(() => {
    if (!selection) return null;
    if (selection.kind === 'western') {
      return WESTERN_ZODIAC.find((z) => z.key === selection.key) ?? null;
    }
    return CHINESE_ZODIAC.find((z) => z.key === selection.key) ?? null;
  }, [selection]);

  const chineseYears = useMemo(() => {
    if (!selection || selection.kind !== 'chinese') return null;
    const key = selection.key as (typeof CHINESE_ZODIAC_ORDER)[number];
    return yearsForChineseZodiac(key);
  }, [selection]);

  const detailText = useMemo(() => {
    if (!selection) return null;
    if (selection.kind === 'western') {
      return buildDetailText(dateKey, `w:${selection.key}`);
    }
    const year = chineseYear ?? chineseYears?.[2] ?? chineseYears?.[0] ?? 1996;
    return buildDetailText(dateKey, `c:${selection.key}:${year}`);
  }, [chineseYear, chineseYears, dateKey, selection]);

  return (
    <ScreenScroll
      background={BACKGROUNDS.daily}
      contentContainerStyle={[commonStyles.screen, styles.container]}
      scrollToTopKey={selection ? `${selection.kind}:${selection.key}` : 'list'}
      resetScrollOnFocus
    >
      <View style={[commonStyles.hero, styles.header]}>
        <Text style={styles.heroLine}>자기에게 맞는 항목을 눌러 오늘 운세를 확인하세요.</Text>
      </View>

      {!selection ? (
        <>
          <SectionCard title="별자리 12">
            <View style={styles.grid}>
              {chunkIntoRows(WESTERN_ZODIAC, 3).map((row, rowIdx) => (
                <View key={`w:${rowIdx}`} style={styles.gridRow}>
                  {row.map((z) => (
                    <View key={z.key} style={styles.gridCell}>
                      <IconTile image={z.iconImage} title={z.name} onPress={() => setSelection({ kind: 'western', key: z.key })} />
                    </View>
                  ))}
                  {row.length < 3
                    ? Array.from({ length: 3 - row.length }).map((_, i) => (
                        <View key={`w:${rowIdx}:empty:${i}`} style={styles.gridCell} />
                      ))
                    : null}
                </View>
              ))}
            </View>
          </SectionCard>

          <View style={styles.sectionSpacer}>
            <SectionCard title="12지신">
              <View style={styles.grid}>
                {chunkIntoRows(CHINESE_ZODIAC, 3).map((row, rowIdx) => (
                  <View key={`c:${rowIdx}`} style={styles.gridRow}>
                    {row.map((z) => (
                      <View key={z.key} style={styles.gridCell}>
                        <IconTile
                          image={z.iconImage}
                          title={z.name}
                          onPress={() => {
                            setSelection({ kind: 'chinese', key: z.key });
                            const years = yearsForChineseZodiac(z.key);
                            setChineseYear(years[2] ?? years[0] ?? null);
                          }}
                        />
                      </View>
                    ))}
                    {row.length < 3
                      ? Array.from({ length: 3 - row.length }).map((_, i) => (
                          <View key={`c:${rowIdx}:empty:${i}`} style={styles.gridCell} />
                        ))
                      : null}
                  </View>
                ))}
              </View>
            </SectionCard>
          </View>
        </>
      ) : (
        <>
          <View style={styles.topRow}>
            <Pressable
              onPress={() => {
                setSelection(null);
                setChineseYear(null);
              }}
              style={({ pressed }) => [styles.backBtn, pressed && commonStyles.pressed]}
            >
              <Text style={styles.backBtnText}>목록으로</Text>
            </Pressable>
            <View style={{ flex: 1 }} />
            <Text style={styles.topMeta}>KST {dateKey}</Text>
          </View>

          <SectionCard title="선택 항목">
            <View style={styles.selectedPanel}>
              {selectedMeta?.detailImage ? (
                <View style={styles.fortuneCardWrap}>
                  <View style={styles.fortuneCardFrameInner}>
                    <Image source={selectedMeta.detailImage} style={styles.fortuneCardImage} resizeMode="cover" />
                  </View>
                </View>
              ) : null}
              <Text style={styles.selectedTitle}>{selectedMeta?.name ?? ''}</Text>
            </View>

            {selection.kind === 'chinese' && chineseYears ? (
              <>
                <Text style={styles.pickerLabel}>태어난 해를 선택하세요</Text>
                <View style={styles.yearRow}>
                  {chineseYears.map((y) => (
                    <Pressable
                      key={y}
                      onPress={() => setChineseYear(y)}
                      style={({ pressed }) => [
                        styles.yearChip,
                        (chineseYear ?? chineseYears[2]) === y && styles.yearChipActive,
                        pressed && commonStyles.pressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.yearChipText,
                          (chineseYear ?? chineseYears[2]) === y && styles.yearChipTextActive,
                        ]}
                      >
                        {String(y).slice(2)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}
          </SectionCard>

          {detailBanner ? <View style={styles.detailBannerWrap}>{detailBanner}</View> : null}

          <SectionCard title="오늘 운세">
            <Text style={styles.pre}>{detailText ?? ''}</Text>
          </SectionCard>
        </>
      )}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  header: {},
  heroLine: {
    color: '#f2f1ef',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  grid: {
    gap: 10,
  },
  sectionSpacer: {
    marginTop: 8,
  },
  detailBannerWrap: {
    marginTop: -4,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  gridCell: {
    flex: 1,
  },
  tile: {
    borderRadius: UI.radius.lg,
    borderWidth: 1,
    borderColor: UI.colors.line,
    backgroundColor: UI.colors.card,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 8,
  },
  tileIconImgWrap: {
    width: 88,
    height: 88,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: UI.colors.paper,
    borderWidth: 1,
    borderColor: UI.colors.line,
  },
  tileIconImg: {
    width: '100%',
    height: '100%',
    transform: [{ scale: 1.12 }],
  },
  tileTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: UI.colors.text,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  topMeta: {
    fontSize: 12,
    color: UI.colors.muted,
    fontWeight: '800',
  },
  backBtn: {
    borderRadius: UI.radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: UI.colors.line,
    backgroundColor: UI.colors.card,
  },
  backBtnText: {
    fontWeight: '900',
    color: UI.colors.text,
  },
  selectedPanel: {
    alignItems: 'center',
    gap: 10,
  },
  fortuneCardWrap: {
    width: '74%',
    maxWidth: 260,
    minWidth: 200,
    aspectRatio: 2 / 3,
    borderRadius: 14,
    padding: 5,
    borderWidth: 1,
    borderColor: '#cec6bb',
    backgroundColor: '#f4f1eb',
  },
  fortuneCardFrameInner: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#d7d0c6',
    backgroundColor: '#faf7f2',
  },
  fortuneCardImage: {
    width: '100%',
    height: '100%',
  },
  selectedTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: UI.colors.text,
  },
  pickerLabel: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '900',
    color: UI.colors.text,
  },
  yearRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  yearChip: {
    borderRadius: UI.radius.pill,
    borderWidth: 1,
    borderColor: UI.colors.line,
    backgroundColor: UI.colors.paperSoft,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  yearChipActive: {
    borderColor: UI.colors.gold,
    backgroundColor: '#fff6d6',
  },
  yearChipText: {
    fontSize: 12,
    fontWeight: '900',
    color: UI.colors.text,
    letterSpacing: 0.6,
  },
  yearChipTextActive: {
    color: UI.colors.text,
  },
  pre: {
    ...UI.type.body,
  },
});

