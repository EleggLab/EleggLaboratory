import { createRoute, useNavigation } from '@granite-js/react-native';

import type { TarotReadingType } from '../lib/features/tarot/deck';
import TarotResultScreen from '../src/screens/TarotResultScreen';

function TarotResultPage(): React.JSX.Element {
  const navigation = useNavigation();
  const params = Route.useParams();
  const type = (params?.type ?? 'today') as TarotReadingType;
  const cards = params?.cards;

  const handleGoHome = (): void => {
    navigation.navigate({ name: '/tarot', params: {} });
  };

  const handleReread = (readingType: TarotReadingType): void => {
    navigation.navigate({ name: '/tarot-reading', params: { type: readingType } });
  };

  return (
    <TarotResultScreen
      type={type}
      {...(cards !== undefined ? { cardsParam: cards } : {})}
      onGoHome={handleGoHome}
      onReread={handleReread}
    />
  );
}

export const Route = createRoute('/tarot-result', {
  validateParams: (p: Readonly<object | undefined>) => p as { type?: string; cards?: string },
  component: TarotResultPage,
});
