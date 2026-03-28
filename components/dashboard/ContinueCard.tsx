import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import ProgressBar from '@/components/ui/ProgressBar';

interface ContinueCardProps {
  moduleTitle: string;
  chapterTitle: string;
  moduleId: string;
  chapterId: string;
  progress: number;
}

export default function ContinueCard({
  moduleTitle,
  chapterTitle,
  moduleId,
  chapterId,
  progress,
}: ContinueCardProps) {
  return (
    <View className="bg-white rounded-2xl p-4 mx-4 border border-border shadow-card">
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1 mr-3">
          <Text className="text-xs text-text-muted font-medium mb-0.5 uppercase tracking-wide">
            Continue Learning
          </Text>
          <Text className="text-base font-bold text-text-primary" numberOfLines={1}>
            {chapterTitle}
          </Text>
          <Text className="text-sm text-text-secondary mt-0.5" numberOfLines={1}>
            {moduleTitle}
          </Text>
        </View>
        <View className="bg-primary-50 rounded-xl px-3 py-1.5">
          <Text className="text-xs font-semibold text-primary-700">{Math.round(progress)}%</Text>
        </View>
      </View>

      <ProgressBar progress={progress} height={6} />

      <Pressable
        className="bg-primary-500 rounded-xl py-3 items-center mt-4 active:bg-primary-600"
        onPress={() =>
          router.push({
            pathname: '/(student)/module/chapter/[chapterId]',
            params: { chapterId, moduleId },
          })
        }
      >
        <Text className="text-white font-semibold text-base">Resume →</Text>
      </Pressable>
    </View>
  );
}
