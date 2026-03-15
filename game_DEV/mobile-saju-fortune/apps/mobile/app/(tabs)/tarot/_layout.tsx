import { Stack } from 'expo-router';

export default function TarotLayout(): React.JSX.Element {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
