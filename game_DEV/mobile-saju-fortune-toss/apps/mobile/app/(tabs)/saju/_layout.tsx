import { Stack } from 'expo-router';

export default function SajuLayout(): React.JSX.Element {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}

