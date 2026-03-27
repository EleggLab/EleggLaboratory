import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Saju Lab',
    short_name: 'SajuLab',
    description: '재현 가능한 사주 계산과 근거 기반 해석',
    start_url: '/',
    display: 'standalone',
    background_color: '#f2efe9',
    theme_color: '#2c6e63',
    lang: 'ko',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
