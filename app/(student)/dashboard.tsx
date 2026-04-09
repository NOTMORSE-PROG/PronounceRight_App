import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, {
  FadeInDown,
} from 'react-native-reanimated';
import { useAuthStore } from '@/stores/auth';
import { useProgressStore } from '@/stores/progress';
import DashboardHero from '@/components/dashboard/DashboardHero';
import WelcomeBanner from '@/components/dashboard/WelcomeBanner';
import QuickStats from '@/components/dashboard/QuickStats';
import ContinueCard from '@/components/dashboard/ContinueCard';
import OverallProgressCard from '@/components/dashboard/OverallProgressCard';
import SectionDivider from '@/components/ui/SectionDivider';
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
  const { getCurrentStreak, getBadges, getModuleCompletion, chapterProgress, recordWotdPractice, getWotdScore, devUnlockAll } = useProgressStore();

  const streak = getCurrentStreak();

  // Word of the Day
  const todaysWord = getTodaysWord();
  const wordIndex = getTodaysWordIndex() + 1;
  const today = todayKey();
  const wotdBestScore = getWotdScore(today);
  const wotdPracticedToday = wotdBestScore !== null;

  function handleWotdComplete(score: number) {
    recordWotdPractice(today, score);
  }

  const fullName = user?.fullName ?? 'Student';
  const firstName = fullName.split(' ')[0] ?? 'Student';
  const badges = getBadges();
  const badgeCount = badges.filter((b) => b.earnedAt !== null).length;
  const earnedBadges = badges.filter((b) => b.earnedAt !== null).slice(0, 5);

  // Module progress values for OverallProgressCard
  const moduleProgresses = MODULES_WITH_IDS.map((m) =>
    getModuleCompletion(m.id, m.chapters.map((c) => c.id))
  );

  // Find the first incomplete chapter across all modules
  let continueModule: (typeof MODULES_WITH_IDS)[number] | null = null;
  let continueChapter: (typeof MODULES_WITH_IDS)[number]['chapters'][number] | null = null;

  for (let i = 0; i < MODULES_WITH_IDS.length; i++) {
    const mod = MODULES_WITH_IDS[i]!;
    if (i > 0 && !devUnlockAll) {
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0D47A1' }} edges={['top']}>
      {/* Full-width hero — outside scroll */}
      <DashboardHero firstName={firstName} streak={streak} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, backgroundColor: '#0D1B3E' }}
        contentContainerStyle={{ paddingBottom: 88 }}
      >
        {/* Dark zone: WelcomeBanner + WotD + OverallProgress */}
        <View style={{ backgroundColor: '#0D1B3E', paddingTop: 12 }}>

          {/* Welcome Banner */}
          <Animated.View entering={FadeInDown.delay(100).duration(400).springify()}>
            <WelcomeBanner name={fullName} streak={streak} />
          </Animated.View>

          {/* Word of the Day */}
          <Animated.View entering={FadeInDown.delay(180).duration(400).springify()}>
            <WordOfTheDayCard
              word={todaysWord}
              wordIndex={wordIndex}
              totalWords={WORD_OF_THE_DAY_BANK.length}
              practicedToday={wotdPracticedToday}
              bestScoreToday={wotdBestScore}
              onPracticeComplete={handleWotdComplete}
            />
          </Animated.View>

          {/* Overall Progress (3 module rings) */}
          <Animated.View entering={FadeInDown.delay(260).duration(400).springify()}>
            <OverallProgressCard progresses={moduleProgresses} />
          </Animated.View>

          <View style={{ height: 8 }} />
        </View>

        {/* Wave divider: dark → light */}
        <SectionDivider fromColor="#0D1B3E" toColor="#F0F7FF" height={40} />

        {/* Light zone */}
        <View style={{ backgroundColor: '#F0F7FF' }}>

          {/* Quick Stats */}
          <Animated.View entering={FadeInDown.delay(320).duration(400).springify()}>
            <QuickStats badgeCount={badgeCount} streak={streak} />
          </Animated.View>

          {/* Continue Learning */}
          <Animated.View entering={FadeInDown.delay(380).duration(400).springify()}>
            <View className="mb-6">
              <View className="flex-row items-center justify-between px-4 mb-3">
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 3, height: 18, borderRadius: 2, backgroundColor: '#2196F3' }} />
                  <Text className="text-lg font-bold text-text-primary">Continue Learning</Text>
                </View>
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
          </Animated.View>

          {/* My Modules — horizontal scroll */}
          <Animated.View entering={FadeInDown.delay(440).duration(400).springify()}>
            <View className="mb-6">
              <View className="flex-row items-center justify-between px-4 mb-3">
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 3, height: 18, borderRadius: 2, backgroundColor: '#2196F3' }} />
                  <Text className="text-lg font-bold text-text-primary">My Modules</Text>
                </View>
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
                    entranceDelay={index * 80}
                  />
                )}
              />
            </View>
          </Animated.View>

          {/* Recent Badges */}
          {earnedBadges.length > 0 && (
            <Animated.View entering={FadeInDown.delay(500).duration(400).springify()}>
              <View className="mb-6">
                <View className="flex-row items-center justify-between px-4 mb-3">
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 3, height: 18, borderRadius: 2, backgroundColor: '#FF9800' }} />
                    <Text className="text-lg font-bold text-text-primary">Recent Badges</Text>
                  </View>
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
            </Animated.View>
          )}

          {/* Empty badges state */}
          {earnedBadges.length === 0 && (
            <Animated.View entering={FadeInDown.delay(500).duration(400).springify()}>
              <View className="mx-4 mb-6 bg-white rounded-2xl border border-border p-6 items-center">
                <Text className="text-3xl mb-2">🎯</Text>
                <Text className="text-base font-semibold text-text-primary mb-1">
                  No badges yet
                </Text>
                <Text className="text-sm text-text-muted text-center">
                  Complete your first lesson to earn your first badge!
                </Text>
              </View>
            </Animated.View>
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
