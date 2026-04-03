import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/auth';
import { useProgressStore } from '@/stores/progress';
import WelcomeBanner from '@/components/dashboard/WelcomeBanner';
import QuickStats from '@/components/dashboard/QuickStats';
import ContinueCard from '@/components/dashboard/ContinueCard';
import ModuleCard from '@/components/module/ModuleCard';
import BadgeCard from '@/components/badges/BadgeCard';
import WordOfTheDayCard from '@/components/dashboard/WordOfTheDayCard';
import { MODULES_DATA } from '@/types';
import { WORD_OF_THE_DAY_BANK } from '@/content';
import { getTodaysWord, getTodaysWordIndex, todayKey } from '@/lib/word-of-the-day';

const MODULES_WITH_IDS = MODULES_DATA.map((m, i) => ({
  ...m,
  id: `m${i + 1}`,
  chapters: m.chapters,
}));

export default function DashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const { getCurrentStreak, getBadges, getModuleCompletion, chapterProgress, recordWotdPractice, getWotdScore } = useProgressStore();

  const streak = getCurrentStreak();

  // Word of the Day
  const todaysWord = getTodaysWord();
  const wordIndex = getTodaysWordIndex() + 1; // 1-based
  const today = todayKey();
  const wotdBestScore = getWotdScore(today);
  const wotdPracticedToday = wotdBestScore !== null;

  function handleWotdComplete(score: number) {
    recordWotdPractice(today, score);
  }

  const fullName = user?.fullName ?? 'Student';
  const badges = getBadges();
  const badgeCount = badges.filter((b) => b.earnedAt !== null).length;
  const earnedBadges = badges.filter((b) => b.earnedAt !== null).slice(0, 5);

  // Find the first incomplete chapter across all modules (sequential unlock)
  let continueModule: (typeof MODULES_WITH_IDS)[number] | null = null;
  let continueChapter: (typeof MODULES_WITH_IDS)[number]['chapters'][number] | null = null;

  for (let i = 0; i < MODULES_WITH_IDS.length; i++) {
    const mod = MODULES_WITH_IDS[i]!;
    // Module is locked if previous module is not 100% complete
    if (i > 0) {
      const prev = MODULES_WITH_IDS[i - 1]!;
      if (getModuleCompletion(prev.id, prev.chapters.map((c) => c.id)) < 100) break;
    }
    const chapter = mod.chapters.find((c) => !chapterProgress[c.id]?.completed);
    if (chapter) {
      continueModule = mod;
      continueChapter = chapter;
      break;
    }
  }

  const continueProgress = continueModule
    ? getModuleCompletion(continueModule.id, continueModule.chapters.map((c) => c.id))
    : 100;

  const completedEntries = Object.values(chapterProgress).filter(
    (p) => p.completed && p.bestScore !== null,
  );
  const avgAccuracy = completedEntries.length > 0
    ? Math.round(completedEntries.reduce((sum, p) => sum + (p.bestScore ?? 0), 0) / completedEntries.length)
    : 0;

  return (
    <SafeAreaView className="flex-1 bg-surface-page" edges={['top']}>
      {/* Top Header */}
      <View className="flex-row items-center justify-between bg-white px-4 py-3 border-b border-border">
        <View className="flex-row items-center gap-2">
          <Image
            source={require('@/assets/images/logo.png')}
            style={{ width: 32, height: 32 }}
            resizeMode="contain"
          />
          <Text className="text-base font-bold text-primary-700">SpeakRight</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Text className="text-base font-medium text-text-primary">
            Hi, {fullName.split(' ')[0]}!
          </Text>
          <Text className="text-base">👋</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="py-4">

          {/* Welcome Banner */}
          <WelcomeBanner name={fullName} streak={streak} />

          {/* Word of the Day */}
          <WordOfTheDayCard
            word={todaysWord}
            wordIndex={wordIndex}
            totalWords={WORD_OF_THE_DAY_BANK.length}
            practicedToday={wotdPracticedToday}
            bestScoreToday={wotdBestScore}
            onPracticeComplete={handleWotdComplete}
          />

          {/* Quick Stats */}
          <QuickStats
            badgeCount={badgeCount}
            streak={streak}
            avgAccuracy={avgAccuracy}
          />

          {/* Continue Learning */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between px-4 mb-3">
              <Text className="text-lg font-bold text-text-primary">Continue Learning</Text>
              <Pressable onPress={() => router.push('/(student)/modules')}>
                <Text className="text-sm text-primary-500 font-medium">See all →</Text>
              </Pressable>
            </View>
            {continueModule && continueChapter ? (
              <ContinueCard
                moduleTitle={continueModule.title}
                chapterTitle={continueChapter.title}
                moduleId={continueModule.id}
                chapterId={continueChapter.id}
                progress={continueProgress}
                lastAccessedAt={chapterProgress[continueChapter.id]?.lastAccessedAt ?? null}
              />
            ) : (
              <View className="mx-4 bg-white rounded-2xl border border-border p-6 items-center">
                <Text className="text-3xl mb-2">🎉</Text>
                <Text className="text-base font-semibold text-text-primary mb-1">
                  All modules completed!
                </Text>
                <Text className="text-sm text-text-muted text-center">
                  You've finished all available chapters. Great work!
                </Text>
              </View>
            )}
          </View>

          {/* My Modules — horizontal scroll */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between px-4 mb-3">
              <Text className="text-lg font-bold text-text-primary">My Modules</Text>
            </View>
            <FlatList
              data={MODULES_WITH_IDS}
              keyExtractor={(m) => m.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
              renderItem={({ item, index }) => (
                <ModuleCard
                  module={item}
                  progress={getModuleCompletion(item.id, item.chapters.map((c) => c.id))}
                  isLocked={
                    index > 0 &&
                    getModuleCompletion(
                      MODULES_WITH_IDS[index - 1]!.id,
                      MODULES_WITH_IDS[index - 1]!.chapters.map((c) => c.id),
                    ) < 100
                  }
                  compact
                />
              )}
            />
          </View>

          {/* Recent Badges */}
          {earnedBadges.length > 0 && (
            <View className="mb-6">
              <View className="flex-row items-center justify-between px-4 mb-3">
                <Text className="text-lg font-bold text-text-primary">Recent Badges</Text>
                <Pressable onPress={() => router.push('/(student)/badges')}>
                  <Text className="text-sm text-primary-500 font-medium">See all →</Text>
                </Pressable>
              </View>
              <FlatList
                data={earnedBadges}
                keyExtractor={(b) => b.type}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
                renderItem={({ item }) => (
                  <View style={{ width: 130 }}>
                    <BadgeCard badge={item} />
                  </View>
                )}
              />
            </View>
          )}

          {/* Empty badges state */}
          {earnedBadges.length === 0 && (
            <View className="mx-4 mb-6 bg-white rounded-2xl border border-border p-6 items-center">
              <Text className="text-3xl mb-2">🎯</Text>
              <Text className="text-base font-semibold text-text-primary mb-1">
                No badges yet
              </Text>
              <Text className="text-sm text-text-muted text-center">
                Complete your first lesson to earn your first badge!
              </Text>
            </View>
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
