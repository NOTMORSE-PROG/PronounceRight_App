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
import { useAuthStore } from '@/stores/auth';
import { useProgressStore } from '@/stores/progress';
import WelcomeBanner from '@/components/dashboard/WelcomeBanner';
import QuickStats from '@/components/dashboard/QuickStats';
import ContinueCard from '@/components/dashboard/ContinueCard';
import ModuleCard from '@/components/module/ModuleCard';
import BadgeCard from '@/components/badges/BadgeCard';
import { MODULES_DATA } from '@/types';

const MODULES_WITH_IDS = MODULES_DATA.map((m, i) => ({
  ...m,
  id: `m${i + 1}`,
  chapters: m.chapters,
}));

export default function DashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const { totalPoints, streak, getBadges, getModuleCompletion } = useProgressStore();

  const fullName = user?.fullName ?? 'Student';
  const badges = getBadges();
  const earnedBadges = badges.filter((b) => b.earnedAt !== null).slice(0, 5);

  // Find the first incomplete chapter across modules
  const continueModule = MODULES_WITH_IDS[0]!;
  const continueChapter = continueModule.chapters[0]!;
  const continueProgress = getModuleCompletion(
    continueModule.id,
    continueModule.chapters.map((c) => c.id),
  );

  // Avg accuracy placeholder
  const avgAccuracy = 0;

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

          {/* Quick Stats */}
          <QuickStats
            totalPoints={totalPoints}
            streak={streak}
            avgAccuracy={avgAccuracy}
          />

          {/* Continue Learning */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between px-4 mb-3">
              <Text className="text-lg font-bold text-text-primary">Continue Learning</Text>
              <Pressable>
                <Text className="text-sm text-primary-500 font-medium">See all →</Text>
              </Pressable>
            </View>
            <ContinueCard
              moduleTitle={continueModule.title}
              chapterTitle={continueChapter.title}
              moduleId={continueModule.id}
              chapterId={continueChapter.id}
              progress={continueProgress}
            />
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
                  isLocked={index > 0}
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
                <Pressable>
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
