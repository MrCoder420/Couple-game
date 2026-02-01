import { Stack } from 'expo-router';

export default function GameLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="card/[id]" options={{ presentation: 'modal' }} />
      <Stack.Screen name="history" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
