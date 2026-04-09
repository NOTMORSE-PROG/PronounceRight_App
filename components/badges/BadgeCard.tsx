import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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
        earned ? 'bg-white border-primary-100' : 'bg-gray-50 border-gray-200 opacity-60'
      }`}
      style={
        earned
          ? {
              minHeight: 140,
              elevation: 4,
              shadowColor: '#6B21D4',
              shadowOpacity: 0.22,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
            }
          : { minHeight: 140 }
      }
    >
      {/* Icon circle */}
      <View style={{ position: 'relative', marginBottom: 12 }}>
        {earned ? (
          <View style={{ width: 56, height: 56, borderRadius: 28, overflow: 'hidden' }}>
            <LinearGradient
              colors={['#6B21D4', '#2D0A6B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontSize: 28, textAlign: 'center', includeFontPadding: false, textAlignVertical: 'center' }}>
                {badge.icon}
              </Text>
            </LinearGradient>
          </View>
        ) : (
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 28, textAlign: 'center', includeFontPadding: false, textAlignVertical: 'center' }}>
              {badge.icon}
            </Text>
          </View>
        )}

        {/* Lock overlay for locked badges */}
        {!earned && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: '#9E9E9E',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1.5,
              borderColor: '#fff',
            }}
          >
            <Ionicons name="lock-closed" size={10} color="#fff" />
          </View>
        )}
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
