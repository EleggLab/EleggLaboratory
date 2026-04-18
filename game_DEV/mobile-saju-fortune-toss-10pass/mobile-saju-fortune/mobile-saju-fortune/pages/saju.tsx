import { createRoute } from '@granite-js/react-native';

import SajuScreen from '../src/screens/SajuScreen';
import TabLayout from '../src/components/TabLayout';

function SajuPage(): React.JSX.Element {
  return (
    <TabLayout activeTab="saju">
      <SajuScreen />
    </TabLayout>
  );
}

export const Route = createRoute('/saju', {
  validateParams: (p: Readonly<object | undefined>) => p as Record<string, unknown>,
  component: SajuPage,
});
