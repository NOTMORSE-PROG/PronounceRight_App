import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/auth';

export default function IndexScreen() {
  const { isInitialized, user } = useAuthStore();

  useEffect(() => {
    if (!isInitialized) return;
    if (user) {
      router.replace('/(student)/dashboard');
    } else {
      router.replace('/(auth)/login');
    }
  }, [isInitialized, user]);

  return (
    <View className="flex-1 bg-surface-page items-center justify-center">
      <ActivityIndicator size="large" color="#2196F3" />
    </View>
  );
}
