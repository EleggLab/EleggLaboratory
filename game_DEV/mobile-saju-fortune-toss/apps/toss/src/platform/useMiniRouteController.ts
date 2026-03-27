import { useMemo } from 'react';
import type { MiniAppPath, MiniRouteController, MiniRouteParams, MiniRootTabPath } from './miniRouteContext';

export function useMiniRouteController(
  navigation: any,
  currentPath: MiniAppPath,
  params: MiniRouteParams,
): MiniRouteController {
  return useMemo(
    () => {
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
          navigateTo('/');
        },
        canGoBack: Boolean(navigation.canGoBack?.()),
        currentPath,
        navigate: (path: MiniAppPath | string, nextParams?: MiniRouteParams) => {
          navigateTo(path, nextParams);
        },
        params,
        switchTab: (path: MiniRootTabPath) => {
          navigateTo(path);
        },
      };
    },
    [currentPath, navigation, params],
  );
}
