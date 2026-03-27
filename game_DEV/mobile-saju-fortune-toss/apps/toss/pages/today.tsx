import { createRoute } from '@granite-js/react-native';

import { TossBannerAd } from '../src/ads/TossBannerAd';
import { TossPageShell } from '../src/components/TossPageShell';
import TodayFortuneScreen from '../src/legacy/app/(tabs)/today';
import { MiniRouteProvider } from '../src/platform/miniRouteContext';
import { useMiniRouteController } from '../src/platform/useMiniRouteController';

export const Route = createRoute('/today', {
  screenOptions: { headerShown: false },
  validateParams: (params: Readonly<object | undefined>) =>
    ({
      historyChineseYear:
        typeof (params as Record<string, unknown> | undefined)?.historyChineseYear === 'string'
          ? ((params as Record<string, unknown>).historyChineseYear as string)
          : undefined,
      historyDateKey:
        typeof (params as Record<string, unknown> | undefined)?.historyDateKey === 'string'
          ? ((params as Record<string, unknown>).historyDateKey as string)
          : undefined,
      historyKey:
        typeof (params as Record<string, unknown> | undefined)?.historyKey === 'string'
          ? ((params as Record<string, unknown>).historyKey as string)
          : undefined,
      historyKind:
        typeof (params as Record<string, unknown> | undefined)?.historyKind === 'string'
          ? ((params as Record<string, unknown>).historyKind as string)
          : undefined,
    }) as Record<string, unknown>,
  component: Page,
});

function Page(): React.JSX.Element {
  const navigation = Route.useNavigation();
  const params = Route.useParams();
  const controller = useMiniRouteController(navigation, '/today', params);

  return (
    <MiniRouteProvider value={controller}>
      <TossPageShell activeTab="/today" onTabPress={controller.switchTab} title="오늘 운세">
        <TodayFortuneScreen detailBanner={<TossBannerAd slot="today_banner_inline" />} />
      </TossPageShell>
    </MiniRouteProvider>
  );
}
