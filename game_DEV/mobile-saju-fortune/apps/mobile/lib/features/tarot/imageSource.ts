import type { ImageSourcePropType } from 'react-native';
import type { TarotCardDef } from './deck';

// Optional local overrides for tarot images.
// - Keep this mapping empty by default so the app still works without local assets.
// - When you add images under `apps/mobile/assets/tarot/...`, map card ids to `require(...)` here.
//
// Example:
// export const TAROT_LOCAL_IMAGES: Partial<Record<TarotCardDef['id'], ImageSourcePropType>> = {
//   'rws-00-fool': require('../../../assets/tarot/major/rws-00-fool.jpg'),
// };
export const TAROT_LOCAL_IMAGES: Partial<Record<TarotCardDef['id'], ImageSourcePropType>> = {
  'rws-00-fool': require('../../../assets/tarot/major/rws-00-fool.png'),
  'rws-01-magician': require('../../../assets/tarot/major/rws-01-magician.png'),
  'rws-02-high-priestess': require('../../../assets/tarot/major/rws-02-high-priestess.png'),
  'rws-03-empress': require('../../../assets/tarot/major/rws-03-empress.png'),
  'rws-04-emperor': require('../../../assets/tarot/major/rws-04-emperor.png'),
  'rws-05-hierophant': require('../../../assets/tarot/major/rws-05-hierophant.png'),
  'rws-06-lovers': require('../../../assets/tarot/major/rws-06-lovers.png'),
  'rws-07-chariot': require('../../../assets/tarot/major/rws-07-chariot.png'),
  'rws-08-strength': require('../../../assets/tarot/major/rws-08-strength.png'),
  'rws-09-hermit': require('../../../assets/tarot/major/rws-09-hermit.png'),
  'rws-10-wheel': require('../../../assets/tarot/major/rws-10-wheel-of-fortune.png'),
  'rws-11-justice': require('../../../assets/tarot/major/rws-11-justice.png'),
  'rws-12-hanged-man': require('../../../assets/tarot/major/rws-12-hanged-man.png'),
  'rws-13-death': require('../../../assets/tarot/major/rws-13-death.png'),
  'rws-14-temperance': require('../../../assets/tarot/major/rws-14-temperance.png'),
  'rws-15-devil': require('../../../assets/tarot/major/rws-15-devil.png'),
  'rws-16-tower': require('../../../assets/tarot/major/rws-16-tower.png'),
  'rws-17-star': require('../../../assets/tarot/major/rws-17-star.png'),
  'rws-18-moon': require('../../../assets/tarot/major/rws-18-moon.png'),
  'rws-19-sun': require('../../../assets/tarot/major/rws-19-sun.png'),
  'rws-20-judgement': require('../../../assets/tarot/major/rws-20-judgement.png'),
  'rws-21-world': require('../../../assets/tarot/major/rws-21-world.png'),
};

// Our custom tarot images have large clean margins (top/bottom title bands).
// Crop a bit so the illustration is more legible in small tiles.
export const TAROT_IMAGE_CROP = {
  scale: 1.04,
  translateY: 0,
} as const;

export function tarotImageSource(card: Pick<TarotCardDef, 'id' | 'imageUrl'>): ImageSourcePropType {
  return TAROT_LOCAL_IMAGES[card.id] ?? { uri: card.imageUrl };
}
