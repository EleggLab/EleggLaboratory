import { useMemo } from 'react';
import {
  MINI_ROUTE_TAB_PRESS_PARAM,
  MINI_ROUTE_VISIT_PARAM,
  type MiniAppPath,
  type MiniRouteController,
  type MiniRouteParams,
  type MiniRootTabPath,
} from './miniRouteContext';

function createMiniRouteToken(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function readMiniRouteToken(params: MiniRouteParams, key: string): string | null {
  const value = params[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export function useMiniRouteController(
  navigation: any,
  currentPath: MiniAppPath,
  params: MiniRouteParams,
): MiniRouteController {
  return useMemo(
    () => {
      const visitToken = readMiniRouteToken(params, MINI_ROUTE_VISIT_PARAM);
      const tabPressToken = readMiniRouteToken(params, MINI_ROUTE_TAB_PRESS_PARAM);

      const navigateTo = (path: MiniAppPath | string, nextParams?: MiniRouteParams): void => {
        navigation.navigate({
          name: path,
          params: nextParams ?? {},
        });
      };

      return {
        back: () => {
          if (navigation.canGoBack?.()) {
            navigation.goBack();
            return;
          }
          navigateTo('/', {
            [MINI_ROUTE_VISIT_PARAM]: createMiniRouteToken(),
          });
        },
        canGoBack: Boolean(navigation.canGoBack?.()),
        currentPath,
        navigate: (path: MiniAppPath | string, nextParams?: MiniRouteParams) => {
          navigateTo(path, nextParams);
        },
        params,
        switchTab: (path: MiniRootTabPath) => {
          if (path === currentPath) {
            navigateTo(path, {
              [MINI_ROUTE_TAB_PRESS_PARAM]: createMiniRouteToken(),
            });
            return;
          }

          navigateTo(path, {
            [MINI_ROUTE_VISIT_PARAM]: createMiniRouteToken(),
          });
        },
        tabPressToken,
        visitToken,
      };
    },
    [currentPath, navigation, params],
  );
}
