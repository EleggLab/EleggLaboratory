import { AppsInToss } from '@apps-in-toss/framework';
import type { InitialProps } from '@granite-js/react-native';
import type { PropsWithChildren } from 'react';
import { context } from '../require.context';
import { TossRootProviders } from '../src/components/TossRootProviders';

function AppContainer({ children }: PropsWithChildren<InitialProps>): React.JSX.Element {
  return <TossRootProviders>{children}</TossRootProviders>;
}

export default AppsInToss.registerApp(AppContainer, { context });
