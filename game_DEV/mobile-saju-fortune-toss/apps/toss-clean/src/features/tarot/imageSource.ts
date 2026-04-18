import type { GraniteAssetSource } from '../assets/bundled';
import { tarotImageSourceFromId } from '../assets/registry';
import type { TarotCardDef } from './deck';

export const TAROT_IMAGE_CROP = {
  scale: 1.04,
  translateY: 0,
} as const;

export function tarotImageSource(card: Pick<TarotCardDef, 'id' | 'imageUrl'>): GraniteAssetSource {
  const remote = tarotImageSourceFromId(card.id);
  if (remote) {
    return remote;
  }

  return {
    uri: card.imageUrl,
    cache: 'immutable',
  };
}
