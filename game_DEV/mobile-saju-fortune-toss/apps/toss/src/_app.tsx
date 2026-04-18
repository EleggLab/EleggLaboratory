import { AppsInToss } from '@apps-in-toss/framework';
import type { InitialProps } from '@granite-js/react-native';
import type { PropsWithChildren } from 'react';
import { useEffect } from 'react';
import { context } from '../require.context';
import { TossRootProviders } from './components/TossRootProviders';

function AppContainer({ children }: PropsWithChildren<InitialProps>): React.JSX.Element {
  useEffect(() => {
    console.log('[astra:toss] AppContainer mounted');

    const maybeErrorUtils = (
      globalThis as {
        ErrorUtils?: {
          getGlobalHandler?: () => ((error: unknown, isFatal?: boolean) => void) | undefined;
          setGlobalHandler?: (handler: (error: unknown, isFatal?: boolean) => void) => void;
        };
      }
    ).ErrorUtils;
    const originalHandler = maybeErrorUtils?.getGlobalHandler?.();

    maybeErrorUtils?.setGlobalHandler?.((error: unknown, isFatal?: boolean) => {
      const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
      console.error(`[astra:toss] global-error fatal=${String(Boolean(isFatal))} message=${message}`);

      if (error instanceof Error && error.stack) {
        console.error(`[astra:toss] global-error-stack ${error.stack}`);
      }

      originalHandler?.(error, isFatal);
    });

    const rejectionHandler = (reason: unknown) => {
      const message = reason instanceof Error ? `${reason.name}: ${reason.message}` : String(reason);
      console.error(`[astra:toss] unhandled-rejection ${message}`);

      if (reason instanceof Error && reason.stack) {
        console.error(`[astra:toss] unhandled-rejection-stack ${reason.stack}`);
      }
    };

    const promiseHost = globalThis as {
      addEventListener?: (type: string, handler: (event: unknown) => void) => void;
      removeEventListener?: (type: string, handler: (event: unknown) => void) => void;
      onunhandledrejection?: ((event: { reason?: unknown }) => void) | null;
    };

    const listener = (event: unknown) => {
      const maybeEvent = event as { reason?: unknown } | undefined;
      rejectionHandler(maybeEvent?.reason);
    };

    promiseHost.addEventListener?.('unhandledrejection', listener);

    if (!promiseHost.addEventListener && promiseHost.onunhandledrejection == null) {
      promiseHost.onunhandledrejection = listener;
    }

    return () => {
      promiseHost.removeEventListener?.('unhandledrejection', listener);

      if (promiseHost.onunhandledrejection === listener) {
        promiseHost.onunhandledrejection = null;
      }
    };
  }, []);

  return <TossRootProviders>{children}</TossRootProviders>;
}

export default AppsInToss.registerApp(AppContainer, { context });
