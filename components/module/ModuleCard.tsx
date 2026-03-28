import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import CircularProgress from '@/components/ui/CircularProgress';
import ProgressBar from '@/components/ui/ProgressBar';
import { Module } from '@/types';

interface ModuleCardProps {
  module: Module & { id: string };
  progress: number;     // 0–100
  isLocked?: boolean;
  compact?: boolean;
}

const MODULE_COLORS = ['#2196F3', '#00BCD4', '#FF9800'];
const MODULE_EMOJIS = ['🗣️', '📢', '🎭'];

export default function ModuleCard({
  module,
  progress,
  isLocked = false,
  compact = false,
}: ModuleCardProps) {
  const color = MODULE_COLORS[(module.number - 1) % MODULE_COLORS.length]!;
  const emoji = MODULE_EMOJIS[(module.number - 1) % MODULE_EMOJIS.length]!;
  const chaptersCompleted = Math.round((progress / 100) * module.chapters.length);

  if (compact) {
    return (
      <Pressable
        className={`bg-white rounded-2xl p-4 border border-border shadow-card w-44 mr-3 ${
          isLocked ? 'opacity-60' : ''
        }`}
        onPress={() =>
          !isLocked &&
          router.push({ pathname: '/(student)/module/[moduleId]', params: { moduleId: module.id } })
        }
      >
        <View
          className="w-10 h-10 rounded-full items-center justify-center mb-2"
          style={{ backgroundColor: color }}
        >
          <Text className="text-white font-bold text-base">{module.number}</Text>
        </View>
        <Text className="text-sm font-semibold text-text-primary mb-1" numberOfLines={2}>
          {module.title}
        </Text>
        <ProgressBar progress={progress} height={4} color={color} />
        <Text className="text-xs text-text-muted mt-1">
          {chaptersCompleted}/{module.chapters.length} chapters
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      className={`bg-white rounded-2xl mx-4 mb-4 border border-border shadow-card overflow-hidden ${
        isLocked ? 'opacity-60' : ''
      }`}
      onPress={() =>
        !isLocked &&
        router.push({ pathname: '/(student)/module/[moduleId]', params: { moduleId: module.id } })
      }
    >
      {/* Header strip */}
      <View style={{ backgroundColor: color }} className="px-5 pt-5 pb-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white text-xs font-medium opacity-80 mb-1">
              Module {module.number}
            </Text>
            <Text className="text-white text-xl font-bold" numberOfLines={1}>
              {module.title}
            </Text>
          </View>
          <Text className="text-4xl ml-3">{emoji}</Text>
        </View>
      </View>

      {/* Body */}
      <View className="p-5">
        <Text className="text-sm text-text-secondary mb-4 leading-relaxed" numberOfLines={2}>
          {module.description}
        </Text>

        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <View className="bg-primary-50 rounded-full px-3 py-1">
              <Text className="text-xs font-semibold text-primary-700">
                {module.chapters.length} Chapters
              </Text>
            </View>
            {progress === 100 && (
              <View className="bg-success-light rounded-full px-3 py-1">
                <Text className="text-xs font-semibold text-success-dark">✓ Complete</Text>
              </View>
            )}
          </View>
          <CircularProgress progress={progress} size={48} strokeWidth={5} color={color} />
        </View>

        <ProgressBar progress={progress} height={6} color={color} />

        <Text className="text-xs text-text-muted mt-2 mb-4">
          {chaptersCompleted} of {module.chapters.length} chapters completed
        </Text>

        <Pressable
          className="rounded-xl py-3 items-center active:opacity-80"
          style={{ backgroundColor: color }}
        >
          <Text className="text-white font-semibold text-base">
            {isLocked ? '🔒 Locked' : progress === 0 ? 'Start Module' : 'Continue'}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
}
