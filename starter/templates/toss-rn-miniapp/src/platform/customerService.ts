import { TOSS_RUNTIME_ENV } from '../config/runtimeEnv';
import { openExternalUrl } from './external';

export type CustomerServiceAction = {
  kind: 'chat' | 'email' | 'phone';
  label: string;
  value: string;
};

export function getCustomerServiceActions(): CustomerServiceAction[] {
  const actions: CustomerServiceAction[] = [];

  if (TOSS_RUNTIME_ENV.customerService.chatUrl) {
    actions.push({
      kind: 'chat',
      label: 'Open support chat',
      value: TOSS_RUNTIME_ENV.customerService.chatUrl,
    });
  }

  if (TOSS_RUNTIME_ENV.customerService.email) {
    actions.push({
      kind: 'email',
      label: 'Send support email',
      value: TOSS_RUNTIME_ENV.customerService.email,
    });
  }

  if (TOSS_RUNTIME_ENV.customerService.phone) {
    actions.push({
      kind: 'phone',
      label: 'Call support',
      value: TOSS_RUNTIME_ENV.customerService.phone,
    });
  }

  return actions;
}

export async function openCustomerServiceAction(action: CustomerServiceAction): Promise<void> {
  switch (action.kind) {
    case 'chat':
      await openExternalUrl(action.value);
      return;
    case 'email':
      await openExternalUrl(`mailto:${action.value}`);
      return;
    case 'phone':
      await openExternalUrl(`tel:${action.value}`);
      return;
  }
}
