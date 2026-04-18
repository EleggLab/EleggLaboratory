import { createRoute, useNavigation } from '@granite-js/react-native';

import type { TarotReadingType } from '../lib/features/tarot/deck';
import TarotHomeScreen from '../src/screens/TarotHomeScreen';
import TabLayout from '../src/components/TabLayout';

function TarotPage(): React.JSX.Element {
  const navigation = useNavigation();

  const handleNavigateReading = (type: TarotReadingType): void => {
    navigation.navigate({ name: '/tarot-reading', params: { type } });
  };

  const handleNavigateResult = (type: TarotReadingType): void => {
    navigation.navigate({ name: '/tarot-result', params: { type } });
  };

  return (
    <TabLayout activeTab="tarot">
      <TarotHomeScreen
        onNavigateReading={handleNavigateReading}
        onNavigateResult={handleNavigateResult}
      />
    </TabLayout>
  );
}

export const Route = createRoute('/tarot', {
  validateParams: (p: Readonly<object | undefined>) => p as Record<string, unknown>,
  component: TarotPage,
});
