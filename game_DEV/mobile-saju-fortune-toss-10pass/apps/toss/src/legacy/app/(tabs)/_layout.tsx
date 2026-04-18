import { Tabs } from 'expo-router';
import GameTabBar from './_components/GameTabBar';

export default function TabsLayout(): React.JSX.Element {
  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        popToTopOnBlur: true,
      }}
      tabBar={(props) => <GameTabBar {...props} />}
    >
      <Tabs.Screen name="today" options={{ title: '데일리' }} />
      <Tabs.Screen name="tarot" options={{ title: '타로' }} />
      <Tabs.Screen name="home" options={{ title: '홈' }} />
      <Tabs.Screen name="saju" options={{ title: '사주' }} />
      <Tabs.Screen name="iching" options={{ title: '주역' }} />
    </Tabs>
  );
}
