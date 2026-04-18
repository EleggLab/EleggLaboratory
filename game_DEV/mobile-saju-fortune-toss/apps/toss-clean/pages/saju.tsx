import { createRoute } from '@granite-js/react-native';
import { Storage } from '@apps-in-toss/framework';
import type { BirthInput, QnaDomain, SajuChartResult } from '@saju/core';
import {
  buildNarrative,
  buildQnaTemplateContext,
  computeSajuChart,
  formatQnaText,
} from '@saju/core';
import { qnaSnippets } from '@saju/data';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { registerAstraChecklistVisit } from '../src/features/astra/affection';
import { AppShell } from '../src/ui/AppShell';
import { APP_THEME } from '../src/ui/theme';
import { useTopLevelBackBehavior } from '../src/ui/useTopLevelBackBehavior';

export const Route = createRoute('/saju', {
  component: Page,
});

type CalendarType = 'solar' | 'lunar';

const SAJU_FORM_STORAGE_KEY = 'saju.v1.last-form';
const TITLE_SAJU = '\uC0AC\uC8FC';
const LABEL_SOLAR_RULE = '\uC591\uB825 \uAE30\uC900';
const LABEL_SOLAR = '\uC591\uB825';
const LABEL_LUNAR = '\uC74C\uB825';
const LABEL_BIRTH_DATE = '\uC0DD\uB144\uC6D4\uC77C';
const LABEL_BIRTH_TIME = '\uCD9C\uC0DD \uC2DC\uAC04';
const LABEL_UNKNOWN_TIME = '\uC2DC\uAC04 \uBAA8\uB984';
const LABEL_GENDER = '\uC131\uBCC4';
const LABEL_UNKNOWN = '\uBBF8\uC785\uB825';
const LABEL_MALE = '\uB0A8';
const LABEL_FEMALE = '\uC5EC';
const LABEL_COMPUTE = '\uC0AC\uC8FC \uD480\uC774 \uBCF4\uAE30';
const LABEL_SUMMARY = '\uC885\uD569';
const LABEL_QNA = '\uBD84\uC57C\uBCC4 Q&A';
const LABEL_RESET = '\uB2E4\uC2DC \uC785\uB825';
const LABEL_SUMMARY_TITLE = '\uC885\uD569 \uD574\uC11D';
const LABEL_TODAY_FLOW = '\uC624\uB298\uC758 \uD750\uB984';
const LABEL_QNA_TITLE = '\uBD84\uC57C\uBCC4 Q&A';
const ERROR_DATE = '\uC0DD\uB144\uC6D4\uC77C\uC744 \uB2E4\uC2DC \uD655\uC778\uD574 \uC8FC\uC138\uC694.';
const ERROR_TIME =
  '\uCD9C\uC0DD \uC2DC\uAC04\uC740 HH:mm \uD615\uC2DD\uC73C\uB85C \uB9DE\uCDB0 \uC8FC\uC138\uC694. \uBAA8\uB974\uBA74 \uBE44\uC6CC\uB450\uC154\uB3C4 \uB429\uB2C8\uB2E4.';
const ERROR_COMPUTE = '\uC0AC\uC8FC \uACC4\uC0B0 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.';
const LABEL_QNA_PLACEHOLDER = '\uC774 \uBD84\uC57C \uC124\uBA85\uC740 \uC544\uC9C1 \uC900\uBE44 \uC911\uC785\uB2C8\uB2E4.';

const DOMAINS: Array<{ key: QnaDomain; label: string }> = [
  { key: 'money', label: '\uAE08\uC804' },
  { key: 'love', label: '\uC5F0\uC560' },
  { key: 'job', label: '\uC9C1\uC7A5' },
  { key: 'business', label: '\uC0AC\uC5C5' },
  { key: 'health', label: '\uAC74\uAC15' },
];

function onlyDigits(value: string, maxLen: number): string {
  return value.replace(/\D/g, '').slice(0, maxLen);
}

function safeInt(value: string, min: number, max: number): number | null {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    return null;
  }
  return parsed;
}

function buildBirthDate(yearText: string, monthText: string, dayText: string): string | null {
  const year = safeInt(yearText.trim(), 1800, 2100);
  const month = safeInt(monthText.trim(), 1, 12);
  const day = safeInt(dayText.trim(), 1, 31);
  if (!year || !month || !day) {
    return null;
  }
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function buildBirthTime(hourText: string, minuteText: string): string | undefined | null {
  const hhRaw = hourText.trim();
  const mmRaw = minuteText.trim();
  if (!hhRaw && !mmRaw) {
    return undefined;
  }
  if (!hhRaw || !mmRaw) {
    return null;
  }
  const hour = safeInt(hhRaw, 0, 23);
  const minute = safeInt(mmRaw, 0, 59);
  if (hour === null || minute === null) {
    return null;
  }
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function sanitizeCalendar(value: unknown): CalendarType {
  return value === 'lunar' ? 'lunar' : 'solar';
}

function sanitizeGender(value: unknown): BirthInput['gender'] {
  return value === 'male' || value === 'female' ? value : 'unknown';
}

function Page(): React.JSX.Element {
  const navigation = Route.useNavigation();
  useTopLevelBackBehavior({ activePath: '/saju', navigation });
  const [isHydrated, setIsHydrated] = useState(false);
  const [calendar, setCalendar] = useState<CalendarType>('solar');
  const [birthYear, setBirthYear] = useState('1992');
  const [birthMonth, setBirthMonth] = useState('10');
  const [birthDay, setBirthDay] = useState('24');
  const [birthHour, setBirthHour] = useState('05');
  const [birthMinute, setBirthMinute] = useState('30');
  const [gender, setGender] = useState<BirthInput['gender']>('unknown');
  const [chart, setChart] = useState<SajuChartResult | null>(null);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'report' | 'qna'>('report');
  const [domain, setDomain] = useState<QnaDomain>('money');

  const narrative = useMemo(() => (chart ? buildNarrative(chart) : null), [chart]);

  const qnaSnippet = useMemo(
    () => qnaSnippets.find((snippet) => snippet.tags?.includes(domain)) ?? null,
    [domain],
  );

  const qnaText = useMemo(() => {
    if (!chart || !qnaSnippet) {
      return null;
    }
    const context = buildQnaTemplateContext(chart);
    const template = qnaSnippet.content.long ?? qnaSnippet.content.short;
    return formatQnaText(template, context);
  }, [chart, qnaSnippet]);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      try {
        const raw = await Storage.getItem(SAJU_FORM_STORAGE_KEY);
        if (!raw || cancelled) {
          return;
        }

        const saved = JSON.parse(raw) as Partial<{
          calendar: CalendarType;
          birthYear: string;
          birthMonth: string;
          birthDay: string;
          birthHour: string;
          birthMinute: string;
          gender: BirthInput['gender'];
          domain: QnaDomain;
        }>;

        setCalendar(sanitizeCalendar(saved.calendar));
        setBirthYear(onlyDigits(saved.birthYear ?? '1992', 4) || '1992');
        setBirthMonth(onlyDigits(saved.birthMonth ?? '10', 2) || '10');
        setBirthDay(onlyDigits(saved.birthDay ?? '24', 2) || '24');
        setBirthHour(onlyDigits(saved.birthHour ?? '', 2));
        setBirthMinute(onlyDigits(saved.birthMinute ?? '', 2));
        setGender(sanitizeGender(saved.gender));
        if (saved.domain && DOMAINS.some((item) => item.key === saved.domain)) {
          setDomain(saved.domain);
        }
      } catch {
        // Ignore malformed input and keep defaults.
      } finally {
        if (!cancelled) {
          setIsHydrated(true);
        }
      }
    };

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void registerAstraChecklistVisit('saju', 'root');
  }, []);

  useEffect(() => {
    if (!chart) {
      return;
    }
    void registerAstraChecklistVisit('saju', 'detail');
  }, [chart]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const snapshot = {
      calendar,
      birthYear,
      birthMonth,
      birthDay,
      birthHour,
      birthMinute,
      gender,
      domain,
    };

    void Storage.setItem(SAJU_FORM_STORAGE_KEY, JSON.stringify(snapshot)).catch(() => {
      // Ignore storage issues in test hosts.
    });
  }, [birthDay, birthHour, birthMinute, birthMonth, birthYear, calendar, domain, gender, isHydrated]);

  const resetSaju = () => {
    setChart(null);
    setError('');
    setViewMode('report');
  };

  const compute = () => {
    setError('');
    const date = buildBirthDate(birthYear, birthMonth, birthDay);
    const time = buildBirthTime(birthHour, birthMinute);

    if (!date) {
      setChart(null);
      setError(ERROR_DATE);
      return;
    }

    if (time === null) {
      setChart(null);
      setError(ERROR_TIME);
      return;
    }

    const input: BirthInput = {
      calendar,
      date,
      timezone: 'Asia/Seoul',
      gender,
      ...(time ? { time } : {}),
      options: {
        yearPillarRule: 'ipchun',
        monthPillarRule: 'solarTerms',
        jaSiBoundaryRule: '23-01_nextDay',
        includeHiddenStems: true,
        hiddenStemWeights: 'all_weighted',
        elementDistributionModel: 'stems_branches_hidden',
      },
    };

    try {
      const result = computeSajuChart(input);
      setChart(result);
      setViewMode('report');
    } catch (caught) {
      setChart(null);
      setError(caught instanceof Error ? caught.message : ERROR_COMPUTE);
    }
  };

  return (
    <AppShell
      activePath="/saju"
      currentPath="/saju"
      navigation={navigation}
      title={TITLE_SAJU}
      scrollEnabled={!!chart}
      contentStyle={!chart ? styles.fillContent : undefined}
      onTabReselect={resetSaju}
    >
      {!chart ? (
        <View style={styles.formCard}>
          <View style={styles.formStack}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{LABEL_SOLAR_RULE}</Text>
              <View style={styles.toggleRow}>
                <Pressable
                  style={[styles.toggleBtn, calendar === 'solar' && styles.toggleBtnActive]}
                  onPress={() => setCalendar('solar')}
                >
                  <Text style={styles.toggleText}>{LABEL_SOLAR}</Text>
                </Pressable>
                <Pressable
                  style={[styles.toggleBtn, calendar === 'lunar' && styles.toggleBtnActive]}
                  onPress={() => setCalendar('lunar')}
                >
                  <Text style={styles.toggleText}>{LABEL_LUNAR}</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{LABEL_BIRTH_DATE}</Text>
              <View style={styles.inputRow}>
                <TextInput
                  value={birthYear}
                  onChangeText={(text) => setBirthYear(onlyDigits(text, 4))}
                  placeholder="YYYY"
                  keyboardType="number-pad"
                  maxLength={4}
                  style={[styles.input, styles.inputYear]}
                />
                <TextInput
                  value={birthMonth}
                  onChangeText={(text) => setBirthMonth(onlyDigits(text, 2))}
                  placeholder="MM"
                  keyboardType="number-pad"
                  maxLength={2}
                  style={[styles.input, styles.inputShort]}
                />
                <TextInput
                  value={birthDay}
                  onChangeText={(text) => setBirthDay(onlyDigits(text, 2))}
                  placeholder="DD"
                  keyboardType="number-pad"
                  maxLength={2}
                  style={[styles.input, styles.inputShort]}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{LABEL_BIRTH_TIME}</Text>
              <View style={styles.inputRow}>
                <TextInput
                  value={birthHour}
                  onChangeText={(text) => setBirthHour(onlyDigits(text, 2))}
                  placeholder="HH"
                  keyboardType="number-pad"
                  maxLength={2}
                  style={[styles.input, styles.inputShort]}
                />
                <TextInput
                  value={birthMinute}
                  onChangeText={(text) => setBirthMinute(onlyDigits(text, 2))}
                  placeholder="mm"
                  keyboardType="number-pad"
                  maxLength={2}
                  style={[styles.input, styles.inputShort]}
                />
                <Pressable
                  style={styles.clearChip}
                  onPress={() => {
                    setBirthHour('');
                    setBirthMinute('');
                  }}
                >
                  <Text style={styles.clearChipText}>{LABEL_UNKNOWN_TIME}</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{LABEL_GENDER}</Text>
              <View style={styles.toggleRow}>
                {([
                  ['unknown', LABEL_UNKNOWN],
                  ['male', LABEL_MALE],
                  ['female', LABEL_FEMALE],
                ] as const).map(([key, label]) => (
                  <Pressable
                    key={key}
                    style={[styles.toggleBtn, gender === key && styles.toggleBtnActive]}
                    onPress={() => setGender(key)}
                  >
                    <Text style={styles.toggleText}>{label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <Pressable style={styles.primaryButton} onPress={compute}>
            <Text style={styles.primaryButtonText}>{LABEL_COMPUTE}</Text>
          </Pressable>

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      ) : (
        <>
          <View style={styles.viewModeRow}>
            <Pressable
              style={[styles.viewModeChip, viewMode === 'report' && styles.viewModeChipActive]}
              onPress={() => setViewMode('report')}
            >
              <Text style={[styles.viewModeChipText, viewMode === 'report' && styles.viewModeChipTextActive]}>
                {LABEL_SUMMARY}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.viewModeChip, viewMode === 'qna' && styles.viewModeChipActive]}
              onPress={() => setViewMode('qna')}
            >
              <Text style={[styles.viewModeChipText, viewMode === 'qna' && styles.viewModeChipTextActive]}>
                {LABEL_QNA}
              </Text>
            </Pressable>
            <Pressable style={[styles.viewModeChip, styles.resetChip]} onPress={resetSaju}>
              <Text style={styles.viewModeChipText}>{LABEL_RESET}</Text>
            </Pressable>
          </View>

          {viewMode === 'report' ? (
            <>
              <View style={styles.resultCard}>
                <Text style={styles.resultTitle}>{LABEL_SUMMARY_TITLE}</Text>
                <Text style={styles.resultBody}>{narrative?.profile ?? '-'}</Text>
              </View>
              <View style={styles.resultCard}>
                <Text style={styles.resultTitle}>{LABEL_TODAY_FLOW}</Text>
                <Text style={styles.resultBody}>{narrative?.overallLuck ?? '-'}</Text>
              </View>
            </>
          ) : (
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>{LABEL_QNA_TITLE}</Text>
              <View style={styles.domainRow}>
                {DOMAINS.map((item) => (
                  <Pressable
                    key={item.key}
                    style={[styles.domainChip, domain === item.key && styles.domainChipActive]}
                    onPress={() => setDomain(item.key)}
                  >
                    <Text style={[styles.domainChipText, domain === item.key && styles.domainChipTextActive]}>
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.resultBody}>{qnaText ?? LABEL_QNA_PLACEHOLDER}</Text>
            </View>
          )}
        </>
      )}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  fillContent: {
    flexGrow: 1,
  },
  formCard: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: APP_THEME.colors.card,
    borderWidth: 1,
    borderColor: '#E6DDCF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  formStack: {
    gap: 6,
  },
  fieldGroup: {
    gap: 4,
  },
  fieldLabel: {
    color: '#5B6576',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  inputRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D6D3CE',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 14,
    color: APP_THEME.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  inputYear: {
    flex: 1.5,
    minWidth: 120,
  },
  inputShort: {
    flex: 1,
    minWidth: 88,
  },
  clearChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D6D3CE',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  clearChipText: {
    color: APP_THEME.colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleBtn: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D6D3CE',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: APP_THEME.colors.cardSoft,
    borderColor: '#E8C86A',
  },
  toggleText: {
    color: APP_THEME.colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  primaryButton: {
    marginTop: 'auto',
    borderRadius: 16,
    paddingVertical: 11,
    alignItems: 'center',
    backgroundColor: APP_THEME.colors.bg,
  },
  primaryButtonText: {
    color: APP_THEME.colors.textOnDark,
    fontSize: 16,
    fontWeight: '900',
  },
  error: {
    color: '#B91C1C',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  viewModeRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  viewModeChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  viewModeChipActive: {
    backgroundColor: APP_THEME.colors.accent,
    borderColor: APP_THEME.colors.accent,
  },
  resetChip: {
    marginLeft: 'auto',
  },
  viewModeChipText: {
    color: APP_THEME.colors.textOnDark,
    fontSize: 13,
    fontWeight: '900',
  },
  viewModeChipTextActive: {
    color: APP_THEME.colors.bg,
  },
  resultCard: {
    borderRadius: 22,
    backgroundColor: APP_THEME.colors.card,
    borderWidth: 1,
    borderColor: '#E6DDCF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 9,
  },
  resultTitle: {
    color: APP_THEME.colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  resultBody: {
    color: APP_THEME.colors.text,
    fontSize: 14,
    lineHeight: 23,
  },
  domainRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  domainChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D6D3CE',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  domainChipActive: {
    backgroundColor: APP_THEME.colors.bg,
    borderColor: APP_THEME.colors.bg,
  },
  domainChipText: {
    color: APP_THEME.colors.text,
    fontSize: 12,
    fontWeight: '900',
  },
  domainChipTextActive: {
    color: APP_THEME.colors.textOnDark,
  },
});
