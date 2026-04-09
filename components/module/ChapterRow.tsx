import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Chapter, ChapterProgress } from '@/types';

interface ChapterRowProps {
  chapter: Chapter;
  progress?: ChapterProgress;
  isLocked: boolean;
  isCurrent: boolean;
  accentColor?: string;
}

export default function ChapterRow({
  chapter,
  progress,
  isLocked,
  isCurrent,
  accentColor = '#2196F3',
}: ChapterRowProps) {
  const isCompleted = progress?.completed ?? false;

  return (
    <Pressable
      className={`flex-row items-center bg-white rounded-xl p-4 mb-3 border ${
        isCurrent ? 'border-primary-400' : 'border-border'
      } ${isLocked ? 'opacity-50' : ''}`}
      style={isCurrent ? { borderLeftWidth: 4, borderLeftColor: accentColor } : {}}
      onPress={() =>
        !isLocked &&
        router.push({
          pathname: '/(student)/module/chapter/[chapterId]',
          params: { chapterId: chapter.id, moduleId: chapter.moduleId },
        })
      }
      disabled={isLocked}
    >
      {/* Chapter number bubble */}
      <View
        className="w-10 h-10 rounded-full items-center justify-center mr-4 flex-shrink-0"
        style={{
          backgroundColor: isCompleted ? '#D1FAE5' : isLocked ? '#F5F5F5' : accentColor + '20',
        }}
      >
        {isCompleted ? (
          <Ionicons name="checkmark" size={20} color="#10B981" />
        ) : isLocked ? (
          <Ionicons name="lock-closed" size={16} color="#9E9E9E" />
        ) : (
          <Text style={{ color: accentColor, fontWeight: '700' }}>{chapter.number}</Text>
        )}
      </View>

      {/* Content */}
      <View className="flex-1">
        <Text
          className="text-sm font-semibold text-text-primary mb-0.5"
          numberOfLines={1}
        >
          {chapter.title}
        </Text>
        <Text className="text-xs text-text-muted" numberOfLines={1}>
          {chapter.activityName}
        </Text>
        {isCurrent && (
          <View className="mt-1.5 self-start bg-primary-50 rounded-full px-2 py-0.5">
            <Text className="text-xs font-semibold text-primary-600">Current</Text>
          </View>
        )}
      </View>

      {/* Score + right indicator */}
      {!isLocked && (
        <View className="flex-row items-center gap-2">
          {isCompleted && progress != null && progress.bestScore !== null && (
            <Text style={{ color: '#10B981', fontWeight: '600', fontSize: 12 }}>
              {progress.bestScore}%
            </Text>
          )}
          <Ionicons
            name={isCompleted ? 'checkmark-circle' : 'chevron-forward'}
            size={20}
            color={isCompleted ? '#10B981' : '#90A4AE'}
          />
        </View>
      )}
    </Pressable>
  );
}
