import { createRoute } from '@granite-js/react-native';

import TodayScreen from '../src/screens/TodayScreen';
import TabLayout from '../src/components/TabLayout';

function TodayPage(): React.JSX.Element {
  return (
    <TabLayout activeTab="today">
      <TodayScreen />
    </TabLayout>
  );
}

export const Route = createRoute('/today', {
  validateParams: (p: Readonly<object | undefined>) => p as Record<string, unknown>,
  component: TodayPage,
});
