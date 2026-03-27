import { createRoute } from '@granite-js/react-native';

import { TossPageShell } from '../../src/components/TossPageShell';
import TarotHome from '../../src/legacy/app/(tabs)/tarot/index';
import { MiniRouteProvider } from '../../src/platform/miniRouteContext';
import { useMiniRouteController } from '../../src/platform/useMiniRouteController';

export const Route = createRoute('/tarot', {
  screenOptions: { headerShown: false },
  validateParams: (params: Readonly<object | undefined>) => (params ?? {}) as Record<string, unknown>,
  component: Page,
});

function Page(): React.JSX.Element {
  const navigation = Route.useNavigation();
  const params = Route.useParams();
  const controller = useMiniRouteController(navigation, '/tarot', params);

  return (
    <MiniRouteProvider value={controller}>
      <TossPageShell activeTab="/tarot" onTabPress={controller.switchTab} title="타로">
        <TarotHome />
      </TossPageShell>
    </MiniRouteProvider>
  );
}
