import { Image, type ResizeMode } from '@granite-js/react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import type { GraniteAssetSource } from '../features/assets/bundled';
import { APP_THEME } from './theme';

export function SmartImage({
  source,
  fallbackSource,
  style,
  resizeMode = 'cover',
  label,
  placeholderStyle,
  labelStyle,
}: {
  source?: GraniteAssetSource;
  fallbackSource?: GraniteAssetSource;
  style: StyleProp<ViewStyle>;
  resizeMode?: ResizeMode;
  label?: string;
  placeholderStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
}): React.JSX.Element {
  const [useFallback, setUseFallback] = useState(false);
  const [failedCompletely, setFailedCompletely] = useState(false);

  useEffect(() => {
    setUseFallback(false);
    setFailedCompletely(false);
  }, [fallbackSource?.uri, source?.uri]);

  const activeSource = useMemo(() => {
    if (useFallback) {
      return fallbackSource;
    }
    return source;
  }, [fallbackSource, source, useFallback]);

  if (!activeSource || failedCompletely) {
    return (
      <View style={[styles.placeholder, style, placeholderStyle]}>
        {label ? <Text style={[styles.placeholderLabel, labelStyle]}>{label}</Text> : null}
      </View>
    );
  }

  return (
    <Image
      source={activeSource}
      style={style}
      resizeMode={resizeMode}
      onError={() => {
        if (!useFallback && fallbackSource && fallbackSource.uri !== source?.uri) {
          setUseFallback(true);
          return;
        }
        setFailedCompletely(true);
      }}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: APP_THEME.colors.panelSoft,
  },
  placeholderLabel: {
    color: APP_THEME.colors.textOnDark,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    opacity: 0.7,
  },
});
