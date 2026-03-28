import React from 'react';
import { View } from 'react-native';
import StatCard from '@/components/ui/StatCard';

interface QuickStatsProps {
  totalPoints: number;
  streak: number;
  avgAccuracy: number;
}

export default function QuickStats({ totalPoints, streak, avgAccuracy }: QuickStatsProps) {
  return (
    <View className="flex-row mx-4 mb-6 gap-3">
      <StatCard icon="🏆" value={totalPoints} label="Points" accentColor="#1565C0" />
      <StatCard icon="🔥" value={streak} label="Day Streak" accentColor="#FF9800" />
      <StatCard
        icon="📊"
        value={`${avgAccuracy}%`}
        label="Accuracy"
        accentColor="#10B981"
      />
    </View>
  );
}
