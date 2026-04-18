import { createRoute, useNavigation } from '@granite-js/react-native';

import type { TarotReadingType } from '../lib/features/tarot/deck';
import TarotReadingScreen from '../src/screens/TarotReadingScreen';

function TarotReadingPage(): React.JSX.Element {
  const navigation = useNavigation();
  const params = Route.useParams();
  const type = (params?.type ?? 'today') as TarotReadingType;

  const handleComplete = (readingType: TarotReadingType, cards: string): void => {
    navigation.navigate({ name: '/tarot-result', params: { type: readingType, cards } });
  };

  const handleBack = (): void => {
    navigation.navigate({ name: '/tarot', params: {} });
  };

  return (
    <TarotReadingScreen
      type={type}
      onComplete={handleComplete}
      onBack={handleBack}
    />
  );
}

export const Route = createRoute('/tarot-reading', {
  validateParams: (p: Readonly<object | undefined>) => p as { type?: string },
  component: TarotReadingPage,
});
