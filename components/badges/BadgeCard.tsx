import React from 'react';
import { View, Text } from 'react-native';
import { Badge } from '@/types';

interface BadgeCardProps {
  badge: Badge;
}

export default function BadgeCard({ badge }: BadgeCardProps) {
  const earned = badge.earnedAt !== null;
  const earnedDate = earned
    ? new Date(badge.earnedAt!).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <View
      className={`rounded-2xl p-4 border items-center ${
        earned
          ? 'bg-white border-primary-100 shadow-card'
          : 'bg-gray-50 border-gray-200 opacity-60'
      }`}
      style={{ minHeight: 140 }}
    >
      {/* Icon */}
      <View
        className={`w-14 h-14 rounded-full items-center justify-center mb-3 ${
          earned ? 'bg-primary-50' : 'bg-gray-100'
        }`}
      >
        <Text style={{ fontSize: 28, filter: earned ? undefined : 'grayscale(100%)' }}>
          {badge.icon}
        </Text>
      </View>

      {/* Label */}
      <Text
        className={`text-sm font-bold text-center mb-1 ${
          earned ? 'text-text-primary' : 'text-gray-400'
        }`}
        numberOfLines={2}
      >
        {badge.label}
      </Text>

      {/* Status */}
      {earned ? (
        <Text className="text-xs text-primary-500 font-medium">{earnedDate}</Text>
      ) : (
        <Text className="text-xs text-gray-400">Locked</Text>
      )}
    </View>
  );
}
