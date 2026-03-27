import { createRoute } from '@granite-js/react-native';
import { TossPageShell } from '../../src/components/TossPageShell';
import TarotReading from '../../src/legacy/app/(tabs)/tarot/reading';
import { MiniRouteProvider } from '../../src/platform/miniRouteContext';
import { useMiniRouteController } from '../../src/platform/useMiniRouteController';

export const Route = createRoute('/tarot/reading', {
  validateParams: (params) =>
    ({
      type: typeof params.type === 'string' ? params.type : undefined,
    }) as { type?: string },
  component: Page,
});

function Page(): React.JSX.Element {
  const navigation = Route.useNavigation();
  const params = Route.useParams();
  const controller = useMiniRouteController(navigation, '/tarot/reading', params);

  return (
    <MiniRouteProvider value={controller}>
      <TossPageShell
        onBackPress={controller.back}
        subtitle="카드를 고른 뒤 결과 페이지에서 배너가 노출됩니다."
        title="타로 카드 선택"
      >
        <TarotReading />
      </TossPageShell>
    </MiniRouteProvider>
  );
}
