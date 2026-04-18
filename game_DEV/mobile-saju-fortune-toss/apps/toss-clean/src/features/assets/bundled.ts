import resolveAssetSource from 'react-native/Libraries/Image/resolveAssetSource';
import type { ImageSourcePropType } from 'react-native';

export type GraniteAssetSource = {
  uri: string;
  cache: 'immutable';
};

export function bundledAssetSource(source: ImageSourcePropType | null | undefined): GraniteAssetSource | undefined {
  if (!source) {
    return undefined;
  }

  if (typeof source === 'object' && 'uri' in source && typeof source.uri === 'string') {
    return {
      uri: source.uri,
      cache: 'immutable',
    };
  }

  const resolved = resolveAssetSource(source);
  if (!resolved?.uri) {
    return undefined;
  }

  return {
    uri: resolved.uri,
    cache: 'immutable',
  };
}
