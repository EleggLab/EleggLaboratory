import { createRoute } from '@granite-js/react-native';

import HomeScreen from '../src/screens/HomeScreen';
import TabLayout from '../src/components/TabLayout';

function HomePage(): React.JSX.Element {
  return (
    <TabLayout activeTab="home">
      <HomeScreen />
    </TabLayout>
  );
}

export const Route = createRoute('/', {
  validateParams: (p: Readonly<object | undefined>) => p as Record<string, unknown>,
  component: HomePage,
});
