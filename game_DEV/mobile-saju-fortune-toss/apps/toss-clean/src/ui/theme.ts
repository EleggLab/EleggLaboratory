export const APP_THEME = {
  colors: {
    bg: '#0E1420',
    panel: '#162033',
    panelSoft: '#1C2940',
    card: '#F7F4EE',
    cardSoft: '#FFF9EE',
    line: 'rgba(247, 201, 72, 0.22)',
    text: '#0F172A',
    textOnDark: '#F8FAFF',
    mutedOnDark: '#C7D1E3',
    accent: '#F7C948',
    accentSoft: 'rgba(247, 201, 72, 0.16)',
  },
  radius: {
    card: 24,
    chip: 999,
  },
} as const;

export type AppRootPath = '/' | '/today' | '/tarot' | '/saju' | '/iching';
