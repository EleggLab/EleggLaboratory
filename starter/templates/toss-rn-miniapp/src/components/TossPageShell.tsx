import { Navbar } from '@toss/tds-react-native';
import type { PropsWithChildren, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TOSS_RUNTIME_ENV } from '../config/runtimeEnv';

export function TossPageShell({
  children,
  footerSlot,
  onBackPress,
  subtitle,
  title,
}: PropsWithChildren<{
  footerSlot?: ReactNode;
  onBackPress?: () => void;
  subtitle?: string;
  title: string;
}>): React.JSX.Element {
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Navbar
          left={onBackPress ? <Navbar.BackButton onPress={onBackPress} /> : <View style={styles.navSpacer} />}
          title={title}
        />
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>{TOSS_RUNTIME_ENV.brandDisplayName}</Text>
          <Text style={styles.headline}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          <View style={styles.metaRow}>
            <View style={[styles.pill, { backgroundColor: TOSS_RUNTIME_ENV.brandPrimaryColor }]}>
              <Text style={styles.pillText}>{TOSS_RUNTIME_ENV.appName}</Text>
            </View>
            <View style={styles.secondaryPill}>
              <Text style={styles.secondaryPillText}>{TOSS_RUNTIME_ENV.operationalEnvironment}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.content}>{children}</View>

      {footerSlot ? <View style={styles.footerSlot}>{footerSlot}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f4f8fc',
  },
  header: {
    backgroundColor: '#f4f8fc',
    paddingBottom: 10,
  },
  navSpacer: {
    width: 24,
  },
  heroCard: {
    marginHorizontal: 16,
    marginTop: 4,
    borderRadius: 28,
    padding: 20,
    backgroundColor: '#0f172a',
    gap: 10,
  },
  eyebrow: {
    color: '#93c5fd',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headline: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  pillText: {
    color: '#08111f',
    fontSize: 12,
    fontWeight: '800',
  },
  secondaryPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  secondaryPillText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  content: {
    flex: 1,
  },
  footerSlot: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#f4f8fc',
  },
});
