// jsDelivr serves the same public GitHub assets with a CDN endpoint that has
// been more reliable in Toss-hosted Chromium than raw.githubusercontent.com.
export const REMOTE_ASSET_BASE_URL =
  'https://cdn.jsdelivr.net/gh/suiren22/game-homework-checker@master/astra-cdn/mobile-saju-fortune-toss/assets';

export function assetUri(path: string): string {
  const normalized = path.replace(/\\/g, '/').replace(/^\/+/, '');
  return `${REMOTE_ASSET_BASE_URL}/${normalized}`;
}

export function assetSource(path: string) {
  return {
    uri: assetUri(path),
    cache: 'immutable' as const,
  };
}

export function astraStillSource(slug: string) {
  return assetSource(`astra/${slug}/still.png`);
}

// Animated GIF decoding is unreliable in the Toss-hosted runtime and can
// render as a corrupted still frame. Release builds should stay on the still.
export function astraLoopSource(slug: string) {
  void slug;
  return undefined;
}
