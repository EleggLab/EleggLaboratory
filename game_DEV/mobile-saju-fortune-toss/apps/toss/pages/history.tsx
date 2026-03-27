import { createRoute } from '@granite-js/react-native';

import { TossPageShell } from '../src/components/TossPageShell';
import HistoryScreen from '../src/legacy/app/history';
import { MiniRouteProvider } from '../src/platform/miniRouteContext';
import { useMiniRouteController } from '../src/platform/useMiniRouteController';

export const Route = createRoute('/history', {
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
  const controller = useMiniRouteController(navigation, '/history', params);

  return (
    <MiniRouteProvider value={controller}>
      <TossPageShell onBackPress={controller.back} title="최근 기록">
        <HistoryScreen />
      </TossPageShell>
    </MiniRouteProvider>
  );
}
