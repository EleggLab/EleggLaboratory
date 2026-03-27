import { Button } from '@toss/tds-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { Analytics, TOSS_ANALYTICS_EVENT_TAXONOMY } from '../analytics';
import type { CustomerServiceAction } from '../platform/customerService';
import { openCustomerServiceAction } from '../platform/customerService';

export function SupportActions({
  actions,
}: {
  actions: CustomerServiceAction[];
}): React.JSX.Element {
  if (actions.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Customer service details are still placeholders.</Text>
        <Text style={styles.emptyBody}>
          Fill the customer-service env values before running release validation.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.stack}>
      {actions.map((action) => (
        <Analytics.Press
          key={action.kind}
          params={{
            ...TOSS_ANALYTICS_EVENT_TAXONOMY.supportActions,
            action_kind: action.kind,
          }}
        >
          <Button
            display="full"
            onPress={() => {
              void openCustomerServiceAction(action);
            }}
            size="medium"
            style={action.kind === 'chat' ? 'fill' : 'weak'}
            type={action.kind === 'chat' ? 'primary' : 'dark'}
          >
            {action.label}
          </Button>
        </Analytics.Press>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 10,
  },
  emptyState: {
    borderRadius: 20,
    backgroundColor: '#0f172a',
    padding: 18,
    gap: 6,
  },
  emptyTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyBody: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 19,
  },
});
