import type { ImageSourcePropType } from 'react-native';

export const BACKGROUNDS = {
  home: require('../../assets/backgrounds/bg-home-4.gif') as ImageSourcePropType,
  daily: require('../../assets/backgrounds/bg-daily.png') as ImageSourcePropType,
  tarot: require('../../assets/backgrounds/bg-tarot.gif') as ImageSourcePropType,
  saju: require('../../assets/backgrounds/bg-saju.png') as ImageSourcePropType,
  iching: require('../../assets/backgrounds/bg-iching.png') as ImageSourcePropType,
} as const;
