import type { Pillar, SajuChartResult } from '@saju/core';
import { getTenGod } from '@saju/core';
import { StyleSheet, Text, View } from 'react-native';

function pillarLabel(pillar?: Pillar): string {
  if (!pillar) return '-';
  return `${pillar.stem}${pillar.branch}`;
}

function tenGodLabel(chart: SajuChartResult, pillar?: Pillar): string {
  if (!pillar) return '-';
  return getTenGod(chart.fourPillars.day.stem, pillar.stem);
}

function hiddenStemsLabel(pillar?: Pillar): string {
  if (!pillar?.hiddenStems?.length) return '-';
  return pillar.hiddenStems
    .map((hs) => {
      const tg = hs.tenGodToDayMaster ? `(${hs.tenGodToDayMaster})` : '';
      return `${hs.stem}${tg}`;
    })
    .join(' ');
}

export default function PillarsMatrixNative({ chart }: { chart: SajuChartResult }): React.JSX.Element {
  const pillars: Array<{ key: string; title: string; pillar: Pillar | undefined }> = [
    { key: 'year', title: '년', pillar: chart.fourPillars.year },
    { key: 'month', title: '월', pillar: chart.fourPillars.month },
    { key: 'day', title: '일', pillar: chart.fourPillars.day },
    { key: 'hour', title: '시', pillar: chart.fourPillars.hour },
  ];

  return (
    <View style={styles.table}>
      <View style={[styles.row, styles.headerRow]}>
        <View style={[styles.cell, styles.side]}>
          <Text style={styles.sideText}>구분</Text>
        </View>
        {pillars.map((col) => (
          <View
            key={col.key}
            style={[styles.cell, styles.headerCell, col.key === 'day' && styles.dayCol]}
          >
            <Text style={styles.headerText}>{col.title}</Text>
          </View>
        ))}
      </View>

      <View style={styles.row}>
        <View style={[styles.cell, styles.side]}>
          <Text style={styles.sideText}>간지</Text>
        </View>
        {pillars.map((col) => (
          <View key={col.key} style={[styles.cell, col.key === 'day' && styles.dayCol]}>
            <Text style={styles.valueStrong}>{pillarLabel(col.pillar)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.row}>
        <View style={[styles.cell, styles.side]}>
          <Text style={styles.sideText}>천간</Text>
        </View>
        {pillars.map((col) => (
          <View key={col.key} style={[styles.cell, col.key === 'day' && styles.dayCol]}>
            <Text style={styles.value}>{col.pillar?.stem ?? '-'}</Text>
          </View>
        ))}
      </View>

      <View style={styles.row}>
        <View style={[styles.cell, styles.side]}>
          <Text style={styles.sideText}>십성</Text>
        </View>
        {pillars.map((col) => (
          <View key={col.key} style={[styles.cell, col.key === 'day' && styles.dayCol]}>
            <Text style={styles.value}>{tenGodLabel(chart, col.pillar)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.row}>
        <View style={[styles.cell, styles.side]}>
          <Text style={styles.sideText}>지지</Text>
        </View>
        {pillars.map((col) => (
          <View key={col.key} style={[styles.cell, col.key === 'day' && styles.dayCol]}>
            <Text style={styles.value}>{col.pillar?.branch ?? '-'}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.row, styles.lastRow]}>
        <View style={[styles.cell, styles.side]}>
          <Text style={styles.sideText}>지장간</Text>
        </View>
        {pillars.map((col) => (
          <View key={col.key} style={[styles.cell, col.key === 'day' && styles.dayCol]}>
            <Text style={styles.valueSmall}>{hiddenStemsLabel(col.pillar)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e0d8',
  },
  row: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
  },
  headerRow: {
    backgroundColor: '#0b1020',
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  cell: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: '#efe9df',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 42,
  },
  side: {
    flex: 0.85,
    backgroundColor: '#faf7f2',
  },
  headerCell: {
    backgroundColor: 'transparent',
    borderRightColor: 'rgba(255,255,255,0.10)',
  },
  dayCol: {
    backgroundColor: '#fff6d6',
  },
  headerText: {
    color: '#f2f1ef',
    fontWeight: '900',
    fontSize: 13,
  },
  sideText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '800',
  },
  valueStrong: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111827',
  },
  value: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
  },
  valueSmall: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
    lineHeight: 16,
  },
});
