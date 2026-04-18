import { createContext, useContext } from 'react';

export type MiniRootTabPath = '/' | '/today' | '/tarot' | '/saju' | '/iching';
export type MiniAppPath = MiniRootTabPath | '/history' | '/tarot/reading' | '/tarot/result';
export type MiniRouteParams = Record<string, unknown>;
export const MINI_ROUTE_VISIT_PARAM = '__miniVisitId';
export const MINI_ROUTE_TAB_PRESS_PARAM = '__miniTabPressId';

export interface MiniRouteController {
  back: () => void;
  canGoBack: boolean;
  currentPath: MiniAppPath | string;
  navigate: (path: MiniAppPath | string, params?: MiniRouteParams) => void;
  params: MiniRouteParams;
  switchTab: (path: MiniRootTabPath) => void;
  tabPressToken: string | null;
  visitToken: string | null;
}

const MiniRouteContext = createContext<MiniRouteController | null>(null);

export function MiniRouteProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: MiniRouteController;
}): React.JSX.Element {
  return <MiniRouteContext.Provider value={value}>{children}</MiniRouteContext.Provider>;
}

export function useOptionalMiniNavigation(): MiniRouteController | null {
  return useContext(MiniRouteContext);
}

export function useMiniNavigation(): MiniRouteController {
  const value = useOptionalMiniNavigation();
  if (!value) {
    throw new Error('MiniRouteProvider is missing.');
  }
  return value;
}

export function useMiniParams<T extends MiniRouteParams = MiniRouteParams>(): T {
  return useMiniNavigation().params as T;
}

export function useMiniRouteSignals(): {
  tabPressToken: string | null;
  visitToken: string | null;
} {
  const { tabPressToken, visitToken } = useMiniNavigation();
  return { tabPressToken, visitToken };
}

export function useOptionalMiniRouteSignals(): {
  tabPressToken: string | null;
  visitToken: string | null;
} {
  const value = useOptionalMiniNavigation();
  return {
    tabPressToken: value?.tabPressToken ?? null,
    visitToken: value?.visitToken ?? null,
  };
}
