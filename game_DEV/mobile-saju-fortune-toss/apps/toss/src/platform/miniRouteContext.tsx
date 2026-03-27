import { createContext, useContext } from 'react';

export type MiniRootTabPath = '/' | '/today' | '/tarot' | '/saju' | '/iching';
export type MiniAppPath = MiniRootTabPath | '/tarot/reading' | '/tarot/result';
export type MiniRouteParams = Record<string, unknown>;

export interface MiniRouteController {
  back: () => void;
  canGoBack: boolean;
  currentPath: MiniAppPath | string;
  navigate: (path: MiniAppPath | string, params?: MiniRouteParams) => void;
  params: MiniRouteParams;
  switchTab: (path: MiniRootTabPath) => void;
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

export function useMiniNavigation(): MiniRouteController {
  const value = useContext(MiniRouteContext);
  if (!value) {
    throw new Error('MiniRouteProvider is missing.');
  }
  return value;
}

export function useMiniParams<T extends MiniRouteParams = MiniRouteParams>(): T {
  return useMiniNavigation().params as T;
}
