import React from 'react';
import { Tabs } from 'expo-router';
import FloatingTabBar from '@/components/ui/FloatingTabBar';

export default function StudentLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Home' }} />
      <Tabs.Screen name="modules" options={{ title: 'Modules' }} />
      <Tabs.Screen name="badges" options={{ title: 'Badges' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      {/* Hide nested routes from tab bar */}
      <Tabs.Screen name="module" options={{ href: null }} />
      <Tabs.Screen name="about" options={{ href: null }} />
      <Tabs.Screen name="certificate" options={{ href: null }} />
    </Tabs>
  );
}
