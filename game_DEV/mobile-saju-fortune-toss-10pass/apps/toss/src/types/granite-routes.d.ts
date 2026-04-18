import '@granite-js/react-native';

type HiddenRouteParams = {
  __miniTabPressId?: string;
  __miniVisitId?: string;
};

type HistoryRouteParams = HiddenRouteParams & {
  type?: string;
};

type IChingRouteParams = HiddenRouteParams & {
  pickedAtISO?: string;
};

type SajuRouteParams = HiddenRouteParams & {
  historyPayload?: string;
};

type TarotReadingRouteParams = HiddenRouteParams & {
  type?: string;
};

type TarotResultRouteParams = HiddenRouteParams & {
  cached?: unknown;
  cards?: string;
  historyDateKey?: string;
  type?: string;
};

type TodayRouteParams = HiddenRouteParams & {
  historyChineseYear?: string;
  historyDateKey?: string;
  historyKey?: string;
  historyKind?: string;
};

declare module '@granite-js/react-native' {
  interface RegisterScreenInput {
    '/': HiddenRouteParams;
    '/history': HistoryRouteParams;
    '/iching': IChingRouteParams;
    '/saju': SajuRouteParams;
    '/tarot': HiddenRouteParams;
    '/tarot/reading': TarotReadingRouteParams;
    '/tarot/result': TarotResultRouteParams;
    '/today': TodayRouteParams;
  }

  interface RegisterScreen {
    '/': HiddenRouteParams;
    '/history': HistoryRouteParams;
    '/iching': IChingRouteParams;
    '/saju': SajuRouteParams;
    '/tarot': HiddenRouteParams;
    '/tarot/reading': TarotReadingRouteParams;
    '/tarot/result': TarotResultRouteParams;
    '/today': TodayRouteParams;
  }
}
