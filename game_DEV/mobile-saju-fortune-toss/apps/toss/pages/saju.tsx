import { createRoute } from '@granite-js/react-native';
import { TossPageShell } from '../src/components/TossPageShell';
import SajuScreen from '../src/legacy/app/(tabs)/saju/index';
import { MiniRouteProvider } from '../src/platform/miniRouteContext';
import { useMiniRouteController } from '../src/platform/useMiniRouteController';

export const Route = createRoute('/saju', {
  validateParams: (params) => params as Record<string, unknown>,
  component: Page,
});

function Page(): React.JSX.Element {
  const navigation = Route.useNavigation();
  const params = Route.useParams();
  const controller = useMiniRouteController(navigation, '/saju', params);

  return (
    <MiniRouteProvider value={controller}>
      <TossPageShell activeTab="/saju" onTabPress={controller.switchTab} title="사주 풀이">
        <SajuScreen />
      </TossPageShell>
    </MiniRouteProvider>
  );
}
