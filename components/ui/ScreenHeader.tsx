import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface ScreenHeaderProps {
  title: string;
  showBack?: boolean;
  showLogo?: boolean;
  rightElement?: React.ReactNode;
}

export default function ScreenHeader({
  title,
  showBack = false,
  showLogo = false,
  rightElement,
}: ScreenHeaderProps) {
  return (
    <View className="flex-row items-center bg-white px-4 py-3 border-b border-border">
      {showBack ? (
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full"
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color="#1565C0" />
        </Pressable>
      ) : showLogo ? (
        <Image
          source={require('@/assets/images/logo.png')}
          style={{ width: 32, height: 32 }}
          resizeMode="contain"
        />
      ) : (
        <View className="w-10" />
      )}

      <Text className="flex-1 text-center text-base font-bold text-text-primary">
        {title}
      </Text>

      <View className="w-10 items-end">
        {rightElement ?? null}
      </View>
    </View>
  );
}
