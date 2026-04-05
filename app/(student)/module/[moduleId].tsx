import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import ScreenHeader from '@/components/ui/ScreenHeader';
import ChapterRow from '@/components/module/ChapterRow';
import CircularProgress from '@/components/ui/CircularProgress';
import { useProgressStore } from '@/stores/progress';
import { MODULES_DATA } from '@/types';

const MODULES_WITH_IDS = MODULES_DATA.map((m, i) => ({ ...m, id: `m${i + 1}` }));
const MODULE_COLORS = ['#2196F3', '#00BCD4', '#FF9800'];

export default function ModuleDetailScreen() {
  const { moduleId } = useLocalSearchParams<{ moduleId: string }>();
  const { chapterProgress, getModuleCompletion, devUnlockAll } = useProgressStore();

  const module = MODULES_WITH_IDS.find((m) => m.id === moduleId) ?? MODULES_WITH_IDS[0]!;
  const moduleIndex = MODULES_WITH_IDS.findIndex((m) => m.id === moduleId);
  const color = MODULE_COLORS[moduleIndex % MODULE_COLORS.length]!;

  const progress = getModuleCompletion(
    module.id,
    module.chapters.map((c) => c.id),
  );

  // Find the first incomplete chapter (current)
  const currentChapterIndex = module.chapters.findIndex(
    (c) => !chapterProgress[c.id]?.completed,
  );

  return (
    <SafeAreaView className="flex-1 bg-surface-page" edges={['top']}>
      <ScreenHeader title={`Module ${module.number}`} showBack />

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Hero Header */}
        <View style={{ backgroundColor: color }} className="px-5 pt-5 pb-8">
          <Text className="text-white text-xs font-semibold opacity-70 uppercase tracking-wide mb-1">
            Module {module.number}
          </Text>
          <Text className="text-white text-2xl font-bold mb-2">{module.title}</Text>
          <Text className="text-white text-sm opacity-80 leading-relaxed" numberOfLines={3}>
            {module.description}
          </Text>
        </View>

        {/* Progress Card — overlapping hero */}
        <View className="mx-4 -mt-4 bg-white rounded-2xl border border-border p-4 mb-6 flex-row items-center justify-between shadow-card">
          <View className="flex-1">
            <Text className="text-xs text-text-muted font-medium mb-1">Overall Progress</Text>
            <Text className="text-2xl font-bold text-text-primary">{progress}%</Text>
            <Text className="text-xs text-text-secondary mt-0.5">
              {module.chapters.filter((c) => chapterProgress[c.id]?.completed).length} of{' '}
              {module.chapters.length} chapters done
            </Text>
          </View>
          <CircularProgress progress={progress} size={64} strokeWidth={7} color={color} />
        </View>

        {/* Chapters */}
        <View className="px-4 mb-4">
          <Text className="text-base font-bold text-text-primary mb-3">Chapters</Text>
          {module.chapters.map((chapter, index) => {
            const isCompleted = chapterProgress[chapter.id]?.completed ?? false;
            // Chapter unlocks if it's the first, or previous chapter is done
            const prevCompleted =
              index === 0 ||
              (chapterProgress[module.chapters[index - 1]!.id]?.completed ?? false);
            const isLocked = !devUnlockAll && !prevCompleted && !isCompleted;
            const isCurrent = index === currentChapterIndex;

            return (
              <ChapterRow
                key={chapter.id}
                chapter={chapter}
                progress={chapterProgress[chapter.id]}
                isLocked={isLocked}
                isCurrent={isCurrent}
                accentColor={color}
              />
            );
          })}
        </View>

        {/* Module Tip */}
        <View className="mx-4 mb-8 bg-primary-50 rounded-2xl p-4 border border-primary-100">
          <Text className="text-sm font-semibold text-primary-700 mb-1">💡 Tip</Text>
          <Text className="text-sm text-text-secondary leading-relaxed">
            Complete chapters in order to unlock the next one. Tap on any available chapter to
            start practicing.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
