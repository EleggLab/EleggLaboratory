import { useNavigation } from '@granite-js/react-native';
import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import TabBar, { type TabKey } from './TabBar';

export default function TabLayout({
  activeTab,
  children,
}: PropsWithChildren<{ activeTab: TabKey }>): React.JSX.Element {
  const navigation = useNavigation();

  const handleTabPress = (tab: TabKey): void => {
    switch (tab) {
      case 'home':
        navigation.navigate({ name: '/', params: {} });
        break;
      case 'today':
        navigation.navigate({ name: '/today', params: {} });
        break;
      case 'tarot':
        navigation.navigate({ name: '/tarot', params: {} });
        break;
      case 'saju':
        navigation.navigate({ name: '/saju', params: {} });
        break;
      case 'iching':
        navigation.navigate({ name: '/iching', params: {} });
        break;
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.content}>{children}</View>
      <TabBar activeTab={activeTab} onTabPress={handleTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0b1020',
  },
  content: {
    flex: 1,
  },
});
