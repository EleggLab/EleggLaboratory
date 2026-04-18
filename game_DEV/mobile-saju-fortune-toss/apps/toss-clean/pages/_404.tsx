import React from 'react';
import { Text, View } from 'react-native';

import { APP_THEME } from '../src/ui/theme';

export default function NotFoundPage() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: APP_THEME.colors.bg,
        paddingHorizontal: 24,
      }}
    >
      <Text style={{ color: APP_THEME.colors.textOnDark, fontSize: 28, fontWeight: '900', marginBottom: 12 }}>
        404
      </Text>
      <Text style={{ color: APP_THEME.colors.mutedOnDark, fontSize: 16, textAlign: 'center', lineHeight: 24 }}>
        요청한 페이지를 찾지 못했습니다.
      </Text>
    </View>
  );
}
