import React from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import ProgressBar from '@/components/ui/ProgressBar';
import GradientButton from '@/components/ui/auth/GradientButton';

function formatRelativeTime(isoString: string | null | undefined): string | null {
  if (!isoString) return null;
  const then = new Date(isoString).getTime();
  if (isNaN(then)) return null;
  const diffMs = Date.now() - then;
  if (diffMs < 0) return null;

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;

  return new Date(isoString).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

interface ContinueCardProps {
  moduleTitle: string;
  chapterTitle: string;
  moduleId: string;
  chapterId: string;
  progress: number;
  lastAccessedAt?: string | null;
}

export default function ContinueCard({
  moduleTitle,
  chapterTitle,
  moduleId,
  chapterId,
  progress,
  lastAccessedAt,
}: ContinueCardProps) {
  const relativeTime = formatRelativeTime(lastAccessedAt);

  return (
    <View
      className="bg-white rounded-2xl mx-4 border border-border shadow-card overflow-hidden"
      style={{ paddingLeft: 4 }}
    >
      {/* Left accent bar */}
      <LinearGradient
        colors={['#2196F3', '#00BCD4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
        }}
      />

      <View style={{ padding: 16 }}>
        <View className="flex-row items-start justify-between mb-3">
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text className="text-xs text-text-muted font-medium mb-0.5 uppercase tracking-wide">
              Continue Learning
            </Text>
            <Text className="text-base font-bold text-text-primary" numberOfLines={1}>
              {chapterTitle}
            </Text>
            <Text className="text-sm text-text-secondary mt-0.5" numberOfLines={1}>
              {moduleTitle}
            </Text>
            {relativeTime && (
              <Text className="text-xs text-text-muted mt-1">
                Last studied {relativeTime}
              </Text>
            )}
          </View>
          <View className="bg-primary-50 rounded-xl px-3 py-1.5">
            <Text className="text-xs font-semibold text-primary-700">{Math.round(progress)}%</Text>
          </View>
        </View>

        <ProgressBar progress={progress} height={6} />

        <View style={{ marginTop: 16 }}>
          <GradientButton
            label="Resume →"
            onPress={() =>
              router.push({
                pathname: '/(student)/module/chapter/[chapterId]',
                params: { chapterId, moduleId },
              })
            }
          />
        </View>
      </View>
    </View>
  );
}
