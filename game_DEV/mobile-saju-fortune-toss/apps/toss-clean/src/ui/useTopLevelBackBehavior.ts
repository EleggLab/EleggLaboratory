import { closeView, useBackEvent } from '@granite-js/react-native';
import { Alert, type AlertButton } from 'react-native';
import { useEffect, useRef } from 'react';

import type { AppRootPath } from './theme';

type RootNavigation = {
  navigate: (options: { name: string; params?: Record<string, unknown> }) => void;
};

const EXIT_DIALOG_TITLE = '앱 종료';
const EXIT_DIALOG_BODY = '앱을 종료할까요?';
const EXIT_DIALOG_CANCEL = '취소';
const EXIT_DIALOG_CONFIRM = '종료';

export function useTopLevelBackBehavior({
  activePath,
  navigation,
}: {
  activePath: AppRootPath;
  navigation: RootNavigation;
}): void {
  const backEvent = useBackEvent();
  const exitDialogOpenRef = useRef(false);

  useEffect(() => {
    const handler = () => {
      if (activePath === '/') {
        if (exitDialogOpenRef.current) {
          return;
        }

        exitDialogOpenRef.current = true;

        const buttons: AlertButton[] = [
          {
            text: EXIT_DIALOG_CANCEL,
            style: 'cancel',
            onPress: () => {
              exitDialogOpenRef.current = false;
            },
          },
          {
            text: EXIT_DIALOG_CONFIRM,
            style: 'destructive',
            onPress: () => {
              exitDialogOpenRef.current = false;
              void closeView();
            },
          },
        ];

        Alert.alert(EXIT_DIALOG_TITLE, EXIT_DIALOG_BODY, buttons, {
          cancelable: false,
        });
        return;
      }

      navigation.navigate({
        name: '/',
        params: {
          reset: String(Date.now()),
          source: activePath,
        },
      });
    };

    backEvent.addEventListener(handler);

    return () => {
      backEvent.removeEventListener(handler);
    };
  }, [activePath, backEvent, navigation]);
}
