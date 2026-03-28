import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface WelcomeBannerProps {
  name: string;
  streak: number;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function WelcomeBanner({ name, streak }: WelcomeBannerProps) {
  const firstName = name.split(' ')[0];
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View className="mx-4 mb-4 rounded-2xl overflow-hidden">
      <LinearGradient
        colors={['#2196F3', '#00BCD4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ padding: 20, borderRadius: 16 }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-white text-sm opacity-90 mb-1">{getGreeting()},</Text>
            <Text className="text-white text-2xl font-bold mb-2">{firstName}!</Text>
            <Text className="text-white text-xs opacity-80">{today}</Text>
          </View>
          <View className="items-center ml-4">
            <Text className="text-4xl">🔥</Text>
            <Text className="text-white font-bold text-lg">{streak}</Text>
            <Text className="text-white text-xs opacity-80">day streak</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
