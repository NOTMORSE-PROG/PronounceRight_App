import React from 'react';
import { View, Text } from 'react-native';

interface StatCardProps {
  icon: string;
  value: string | number;
  label: string;
  accentColor?: string;
}

export default function StatCard({ icon, value, label, accentColor = '#2196F3' }: StatCardProps) {
  return (
    <View className="bg-white rounded-xl p-3 border border-border flex-1 items-center justify-center">
      <Text className="text-2xl mb-1">{icon}</Text>
      <Text style={{ color: accentColor }} className="text-xl font-bold">
        {value}
      </Text>
      <Text className="text-xs text-text-muted text-center mt-0.5" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}
