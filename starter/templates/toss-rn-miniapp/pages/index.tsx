import { Button } from '@toss/tds-react-native';
import { createRoute } from '@granite-js/react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { TossBannerAd } from '../src/ads/TossBannerAd';
import { Analytics, TOSS_ANALYTICS_EVENT_TAXONOMY } from '../src/analytics';
import { FeatureCard } from '../src/components/FeatureCard';
import { TossPageShell } from '../src/components/TossPageShell';
import { TOSS_RUNTIME_ENV } from '../src/config/runtimeEnv';
import type { TossRouteMeta } from '../src/types/runtime';

export const Route = createRoute('/', {
  validateParams: (params) => params as Record<string, unknown>,
  component: Page,
});

const ROUTE_META: TossRouteMeta = {
  screen: 'home',
  title: 'Toss miniapp starter',
  subtitle: 'RN foundation with banner ads, validation, docs, and QA rails.',
};

function Page(): React.JSX.Element {
  const navigation = Route.useNavigation();

  return (
    <TossPageShell
      footerSlot={<TossBannerAd slot="home_banner_list" />}
      subtitle={ROUTE_META.subtitle}
      title={ROUTE_META.title}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle}>{TOSS_RUNTIME_ENV.brandDisplayName}</Text>
          <Text style={styles.heroBody}>
            Start from a release-aware Toss miniapp shell instead of rebuilding console, ads, QA, and
            settlement prep every time.
          </Text>
        </View>

        <Analytics.Impression params={TOSS_ANALYTICS_EVENT_TAXONOMY.hero}>
          <FeatureCard
            body="The starter locks the official RN 2.x baseline, keeps fullscreen monetization disabled by default, and wires strict release validation before `ait build`."
            eyebrow="Foundation"
            title="Launch the same way every time"
          />
        </Analytics.Impression>

        <Analytics.Impression params={TOSS_ANALYTICS_EVENT_TAXONOMY.homeFeedBanner}>
          <View style={styles.feedBannerWrap}>
            <TossBannerAd slot="home_feed_native" />
          </View>
        </Analytics.Impression>

        <FeatureCard
          body="Use the bundled sheets to keep console values, ad slots, release gates, and settlement ownership aligned with the codebase."
          eyebrow="Operations"
          title="Docs live with the template"
        />

        <View style={styles.buttonStack}>
          <Analytics.Press
            params={{
              ...TOSS_ANALYTICS_EVENT_TAXONOMY.hero,
              action: 'open_support_page',
            }}
          >
            <Button
              display="full"
              onPress={() => navigation.navigate('/support')}
              size="medium"
              style="fill"
              type="primary"
            >
              Open support page
            </Button>
          </Analytics.Press>

          <Analytics.Press
            params={{
              ...TOSS_ANALYTICS_EVENT_TAXONOMY.hero,
              action: 'review_release_docs',
            }}
          >
            <Button
              display="full"
              onPress={() => navigation.navigate('/support')}
              size="medium"
              style="weak"
              type="dark"
            >
              Review QA and settlement setup
            </Button>
          </Analytics.Press>
        </View>
      </ScrollView>
    </TossPageShell>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 16,
  },
  heroCopy: {
    borderRadius: 28,
    padding: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dbe7f2',
    gap: 8,
  },
  heroTitle: {
    color: '#0f172a',
    fontSize: 22,
    fontWeight: '800',
  },
  heroBody: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 21,
  },
  feedBannerWrap: {
    minHeight: 120,
    justifyContent: 'center',
  },
  buttonStack: {
    gap: 10,
    paddingBottom: 6,
  },
});
