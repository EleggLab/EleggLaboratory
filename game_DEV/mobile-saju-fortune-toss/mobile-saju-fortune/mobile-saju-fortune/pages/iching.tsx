import { createRoute } from '@granite-js/react-native';

import IChingScreen from '../src/screens/IChingScreen';
import TabLayout from '../src/components/TabLayout';

function IChingPage(): React.JSX.Element {
  return (
    <TabLayout activeTab="iching">
      <IChingScreen />
    </TabLayout>
  );
}

export const Route = createRoute('/iching', {
  validateParams: (p: Readonly<object | undefined>) => p as Record<string, unknown>,
  component: IChingPage,
});
