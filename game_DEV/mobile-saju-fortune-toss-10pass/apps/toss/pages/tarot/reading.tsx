import { createRoute } from '@granite-js/react-native';

import TarotReadingScreen from '../../src/legacy/app/(tabs)/tarot/reading';
import { TossPageShell } from '../../src/components/TossPageShell';
import { MiniRouteProvider } from '../../src/platform/miniRouteContext';
import { useMiniRouteController } from '../../src/platform/useMiniRouteController';

export const Route = createRoute('/tarot/reading', {
  screenOptions: { headerShown: false },
  validateParams: (params: Readonly<object | undefined>) =>
    ({
      type:
        typeof (params as Record<string, unknown> | undefined)?.type === 'string'
          ? ((params as Record<string, unknown>).type as string)
          : undefined,
    }) as { type?: string },
  component: Page,
});

function Page(): React.JSX.Element {
  const navigation = Route.useNavigation();
  const params = Route.useParams();
  const controller = useMiniRouteController(navigation, '/tarot/reading', params);

  return (
    <MiniRouteProvider value={controller}>
      <TossPageShell onBackPress={controller.back} title="카드 선택">
        <TarotReadingScreen />
      </TossPageShell>
    </MiniRouteProvider>
  );
}
