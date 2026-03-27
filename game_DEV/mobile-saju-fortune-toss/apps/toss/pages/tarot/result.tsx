import { createRoute } from '@granite-js/react-native';
import { TossBannerAd } from '../../src/ads/TossBannerAd';
import { TossPageShell } from '../../src/components/TossPageShell';
import TarotResult from '../../src/legacy/app/(tabs)/tarot/result';
import { MiniRouteProvider } from '../../src/platform/miniRouteContext';
import { useMiniRouteController } from '../../src/platform/useMiniRouteController';

export const Route = createRoute('/tarot/result', {
  validateParams: (params) =>
    ({
      cached: params.cached,
      cards: params.cards,
      type: typeof params.type === 'string' ? params.type : undefined,
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
