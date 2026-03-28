import React from 'react';
import { Stack } from 'expo-router';
// Stack screens are auto-discovered via Expo Router file-based routing

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" options={{ animation: 'fade' }} />
      <Stack.Screen name="onboarding" options={{ animation: 'slide_from_right', gestureEnabled: false }} />
    </Stack>
  );
}
