import type { ComponentType, PropsWithChildren } from 'react';

let RuntimeTdsProvider: ComponentType<PropsWithChildren> | null = null;

try {
  const runtimeTds = require('@toss/tds-react-native');
  RuntimeTdsProvider = runtimeTds.TDSProvider ?? null;
} catch {
  RuntimeTdsProvider = null;
}

export function TossRootProviders({ children }: PropsWithChildren): React.JSX.Element {
  if (!RuntimeTdsProvider) {
    return <>{children}</>;
  }

  return <RuntimeTdsProvider>{children}</RuntimeTdsProvider>;
}
