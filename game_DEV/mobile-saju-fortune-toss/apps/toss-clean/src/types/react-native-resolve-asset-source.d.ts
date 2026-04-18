declare module 'react-native/Libraries/Image/resolveAssetSource' {
  import type { ImageSourcePropType } from 'react-native';

  type ResolvedAssetSource = {
    __packager_asset?: boolean;
    width?: number | null;
    height?: number | null;
    uri?: string;
    scale?: number;
  };

  export default function resolveAssetSource(source: ImageSourcePropType): ResolvedAssetSource | undefined;
}
