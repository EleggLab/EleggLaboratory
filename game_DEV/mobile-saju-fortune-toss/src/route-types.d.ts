import '@granite-js/react-native';

declare module '@granite-js/react-native' {
  interface RegisterScreenInput {
    '/': Record<string, unknown>;
    '/today': Record<string, unknown>;
    '/tarot': Record<string, unknown>;
    '/tarot-reading': { type?: string };
    '/tarot-result': { type?: string; cards?: string };
    '/saju': Record<string, unknown>;
    '/iching': Record<string, unknown>;
  }
  interface RegisterScreen {
    '/': Record<string, unknown>;
    '/today': Record<string, unknown>;
    '/tarot': Record<string, unknown>;
    '/tarot-reading': { type?: string };
    '/tarot-result': { type?: string; cards?: string };
    '/saju': Record<string, unknown>;
    '/iching': Record<string, unknown>;
  }
}
