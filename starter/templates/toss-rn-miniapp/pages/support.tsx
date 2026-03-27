import { createRoute } from '@granite-js/react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { TossBannerAd } from '../src/ads/TossBannerAd';
import { Analytics } from '../src/analytics';
import { FeatureCard } from '../src/components/FeatureCard';
import { SupportActions } from '../src/components/SupportActions';
import { TossPageShell } from '../src/components/TossPageShell';
import { TOSS_RUNTIME_ENV } from '../src/config/runtimeEnv';
import { getCustomerServiceActions } from '../src/platform/customerService';
import type { TossRouteMeta } from '../src/types/runtime';

export const Route = createRoute('/support', {
  validateParams: (params) => params as Record<string, unknown>,
  component: Page,
});

const ROUTE_META: TossRouteMeta = {
  screen: 'support',
  title: 'Support and operations',
  subtitle: 'Customer-service env, settlement ownership, and release readiness live here.',
};

function Page(): React.JSX.Element {
  const navigation = Route.useNavigation();
  const actions = getCustomerServiceActions();

  return (
    <TossPageShell
      footerSlot={<TossBannerAd slot="support_banner_list" />}
      onBackPress={() => navigation.navigate('/')}
      subtitle={ROUTE_META.subtitle}
      title={ROUTE_META.title}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <FeatureCard
          body="The customer-service env keys map directly to Toss console support fields. Release validation fails until email, phone, and chat URL are all ready."
          eyebrow="Support"
          title="Customer-service channels"
        />

        <Analytics.Impression
          params={{
            block: 'support_actions',
            screen: 'support',
          }}
        >
          <SupportActions actions={actions} />
        </Analytics.Impression>

        <View style={styles.supportSummary}>
          <Text style={styles.summaryTitle}>Current support snapshot</Text>
          <Text style={styles.summaryItem}>Email: {TOSS_RUNTIME_ENV.customerService.email || 'not configured'}</Text>
          <Text style={styles.summaryItem}>Phone: {TOSS_RUNTIME_ENV.customerService.phone || 'not configured'}</Text>
          <Text style={styles.summaryItem}>Chat: {TOSS_RUNTIME_ENV.customerService.chatUrl || 'not configured'}</Text>
        </View>

        <FeatureCard
          body="Assign settlement ownership early. Ad revenue payouts depend on approved settlement info, matching account details, and reverse-invoice approval timing."
          eyebrow="Settlement"
          title="Operational readiness"
        />
      </ScrollView>
    </TossPageShell>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 16,
  },
  supportSummary: {
    borderRadius: 22,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dbe7f2',
    padding: 18,
    gap: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  summaryItem: {
    fontSize: 13,
    lineHeight: 20,
    color: '#475569',
  },
});
