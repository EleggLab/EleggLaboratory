import { createRoute } from '@granite-js/react-native';

import { TossBannerAd } from '../src/ads/TossBannerAd';
import { TossPageShell } from '../src/components/TossPageShell';
import HomeScreen from '../src/legacy/app/(tabs)/home';
import { MiniRouteProvider } from '../src/platform/miniRouteContext';
import { useMiniRouteController } from '../src/platform/useMiniRouteController';

export const Route = createRoute('/', {
  screenOptions: { headerShown: false },
  validateParams: (params: Readonly<object | undefined>) => (params ?? {}) as Record<string, unknown>,
  component: Page,
});

function Page(): React.JSX.Element {
  const navigation = Route.useNavigation();
  const params = Route.useParams();
  const controller = useMiniRouteController(navigation, '/', params);

  return (
    <MiniRouteProvider value={controller}>
      <TossPageShell
        activeTab="/"
        footerSlot={<TossBannerAd slot="home_banner_list" />}
        onTabPress={controller.switchTab}
        title="종합 운세"
      >
        <HomeScreen />
      </TossPageShell>
    </MiniRouteProvider>
  );
}
