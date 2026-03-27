import { createRoute } from '@granite-js/react-native';
import { TossPageShell } from '../src/components/TossPageShell';
import IChingScreen from '../src/legacy/app/(tabs)/iching';
import { MiniRouteProvider } from '../src/platform/miniRouteContext';
import { useMiniRouteController } from '../src/platform/useMiniRouteController';

export const Route = createRoute('/iching', {
  validateParams: (params) => params as Record<string, unknown>,
  component: Page,
});

function Page(): React.JSX.Element {
  const navigation = Route.useNavigation();
  const params = Route.useParams();
  const controller = useMiniRouteController(navigation, '/iching', params);

  return (
    <MiniRouteProvider value={controller}>
      <TossPageShell activeTab="/iching" onTabPress={controller.switchTab} title="주역">
        <IChingScreen />
      </TossPageShell>
    </MiniRouteProvider>
  );
}
