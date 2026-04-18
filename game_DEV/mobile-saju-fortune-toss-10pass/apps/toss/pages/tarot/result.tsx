import { createRoute } from '@granite-js/react-native';

import { TossBannerAd } from '../../src/ads/TossBannerAd';
import { TossPageShell } from '../../src/components/TossPageShell';
import TarotResult from '../../src/legacy/app/(tabs)/tarot/result';
import { MiniRouteProvider } from '../../src/platform/miniRouteContext';
import { useMiniRouteController } from '../../src/platform/useMiniRouteController';

export const Route = createRoute('/tarot/result', {
  screenOptions: { headerShown: false },
  validateParams: (params: Readonly<object | undefined>) =>
    ({
      cached: (params as Record<string, unknown> | undefined)?.cached,
      cards: (params as Record<string, unknown> | undefined)?.cards,
      historyDateKey:
        typeof (params as Record<string, unknown> | undefined)?.historyDateKey === 'string'
          ? ((params as Record<string, unknown>).historyDateKey as string)
          : undefined,
      type:
        typeof (params as Record<string, unknown> | undefined)?.type === 'string'
          ? ((params as Record<string, unknown>).type as string)
          : undefined,
    }) as { cached?: unknown; cards?: unknown; type?: string },
  component: Page,
});

function Page(): React.JSX.Element {
  const navigation = Route.useNavigation();
  const params = Route.useParams();
  const controller = useMiniRouteController(navigation, '/tarot/result', params);

  return (
    <MiniRouteProvider value={controller}>
      <TossPageShell onBackPress={controller.back} title="타로 결과">
        <TarotResult afterCardsSlot={<TossBannerAd slot="tarot_result_banner_list" />} />
      </TossPageShell>
    </MiniRouteProvider>
  );
}
