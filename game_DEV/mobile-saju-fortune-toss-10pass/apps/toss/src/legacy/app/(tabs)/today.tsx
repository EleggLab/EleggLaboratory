import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { BACKGROUNDS } from '../../lib/assets/backgrounds';
import { saveHistoryEntry } from '../../lib/features/history/storage';
import {
  CHINESE_ZODIAC_ORDER,
  buildTodayFortuneDetail,
  kstDateKey,
  type ChineseZodiacKey,
  type DailySelection,
  type WesternZodiacKey,
  yearsForChineseZodiac,
} from '../../lib/features/today/fortune';
import { commonStyles } from '../../lib/ui/commonStyles';
import { HistoryLinkChip } from '../../lib/ui/HistoryLinkChip';
import { ScreenScroll } from '../../lib/ui/ScreenScroll';
import { UI } from '../../lib/ui/tokens';
import { useMiniNavigation, useMiniParams, useMiniRouteSignals } from '../../support/miniRouteContext';
import SectionCard from './_components/SectionCard';

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

const CHINESE_ZODIAC_ICON_IMAGES: Record<ChineseZodiacKey, ImageSourcePropType> = {
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

const CHINESE_ZODIAC_DETAIL_IMAGES: Record<ChineseZodiacKey, ImageSourcePropType> = {
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
  key: ChineseZodiacKey;
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
  detailBanner?: ReactNode;
}): React.JSX.Element {
  const miniNavigation = useMiniNavigation();
  const params = useMiniParams<{
    historyChineseYear?: string;
    historyDateKey?: string;
    historyKey?: string;
    historyKind?: string;
  }>();
  const { tabPressToken, visitToken } = useMiniRouteSignals();

  const [activeDateKey, setActiveDateKey] = useState(() => kstDateKey());
  const [selection, setSelection] = useState<DailySelection>(null);
  const [chineseYear, setChineseYear] = useState<number | null>(null);
  const skipNextHistorySave = useRef(false);

  useEffect(() => {
    if (!visitToken && !tabPressToken) return;
    setActiveDateKey(kstDateKey());
    setSelection(null);
    setChineseYear(null);
  }, [tabPressToken, visitToken]);

  useEffect(() => {
    if (params.historyKind !== 'western' && params.historyKind !== 'chinese') return;
    if (typeof params.historyKey !== 'string' || params.historyKey.length === 0) return;

    skipNextHistorySave.current = true;
    setActiveDateKey(
      typeof params.historyDateKey === 'string' && params.historyDateKey.length > 0
        ? params.historyDateKey
        : kstDateKey(),
    );
    setSelection({ kind: params.historyKind, key: params.historyKey });

    if (params.historyKind === 'chinese') {
      const years = yearsForChineseZodiac(params.historyKey as ChineseZodiacKey);
      const parsedYear =
        typeof params.historyChineseYear === 'string' && params.historyChineseYear.length > 0
          ? Number(params.historyChineseYear)
          : NaN;
      setChineseYear(Number.isInteger(parsedYear) ? parsedYear : (years[2] ?? years[0] ?? null));
      return;
    }

    setChineseYear(null);
  }, [params.historyChineseYear, params.historyDateKey, params.historyKey, params.historyKind]);

  const selectedMeta = useMemo(() => {
    if (!selection) return null;
    if (selection.kind === 'western') {
      return WESTERN_ZODIAC.find((z) => z.key === selection.key) ?? null;
    }
    return CHINESE_ZODIAC.find((z) => z.key === selection.key) ?? null;
  }, [selection]);

  const chineseYears = useMemo(() => {
    if (!selection || selection.kind !== 'chinese') return null;
    return yearsForChineseZodiac(selection.key as ChineseZodiacKey);
  }, [selection]);

  const detailText = useMemo(() => {
    if (!selection) return null;
    if (selection.kind === 'western') {
      return buildTodayFortuneDetail(activeDateKey, selection);
    }
    const year = chineseYear ?? chineseYears?.[2] ?? chineseYears?.[0] ?? 1996;
    return buildTodayFortuneDetail(activeDateKey, selection, year);
  }, [activeDateKey, chineseYear, chineseYears, selection]);

  useEffect(() => {
    if (!selection) return;
    if (selection.kind === 'chinese' && !chineseYear) return;

    if (skipNextHistorySave.current) {
      skipNextHistorySave.current = false;
      return;
    }

    const createdAtISO = new Date().toISOString();

    void saveHistoryEntry({
      id: `today-${selection.kind}-${selection.key}-${activeDateKey}-${chineseYear ?? 'none'}`,
      kind: 'today',
      createdAtISO,
      payload: {
        createdAtISO,
        dateKey: activeDateKey,
        key: selection.key,
        kind: selection.kind,
        ...(selection.kind === 'chinese' && chineseYear ? { chineseYear } : {}),
      },
    });
  }, [activeDateKey, chineseYear, selection]);

  return (
    <ScreenScroll
      background={BACKGROUNDS.daily}
      contentContainerStyle={[commonStyles.screen, styles.container]}
      scrollToTopKey={selection ? `${selection.kind}:${selection.key}` : 'list'}
      resetScrollOnFocus
    >
      <View style={[commonStyles.hero, styles.header]}>
        <Text style={styles.heroLine}>자기에게 맞는 항목을 눌러 오늘 운세를 확인하세요.</Text>
        <HistoryLinkChip label="최근 기록" onPress={() => miniNavigation.navigate('/history', { type: 'today' })} />
      </View>

      {!selection ? (
        <>
          <SectionCard title="별자리 12">
            <View style={styles.grid}>
              {chunkIntoRows(WESTERN_ZODIAC, 3).map((row, rowIdx) => (
                <View key={`w:${rowIdx}`} style={styles.gridRow}>
                  {row.map((z) => (
                    <View key={z.key} style={styles.gridCell}>
                      <IconTile
                        image={z.iconImage}
                        title={z.name}
                        onPress={() => {
                          setActiveDateKey(kstDateKey());
                          setSelection({ kind: 'western', key: z.key });
                          setChineseYear(null);
                        }}
                      />
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
                            const years = yearsForChineseZodiac(z.key);
                            setActiveDateKey(kstDateKey());
                            setSelection({ kind: 'chinese', key: z.key });
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
                setActiveDateKey(kstDateKey());
                setSelection(null);
                setChineseYear(null);
              }}
              style={({ pressed }) => [styles.backBtn, pressed && commonStyles.pressed]}
            >
              <Text style={styles.backBtnText}>목록으로</Text>
            </Pressable>
            <View style={{ flex: 1 }} />
            <Text style={styles.topMeta}>KST {activeDateKey}</Text>
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
  header: {
    gap: 10,
  },
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
    color: UI.colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  pickerLabel: {
    color: UI.colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  yearRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  yearChip: {
    minWidth: 48,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: UI.colors.line,
    backgroundColor: UI.colors.card,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  yearChipActive: {
    borderColor: '#d4b45d',
    backgroundColor: '#fbf3d6',
  },
  yearChipText: {
    color: UI.colors.text,
    fontSize: 12,
    fontWeight: '900',
  },
  yearChipTextActive: {
    color: '#7c5800',
  },
  pre: {
    color: UI.colors.text,
    fontSize: 13,
    lineHeight: 20,
  },
});
