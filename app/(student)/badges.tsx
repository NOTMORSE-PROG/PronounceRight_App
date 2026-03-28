import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '@/components/ui/ScreenHeader';
import BadgeGrid from '@/components/badges/BadgeGrid';
import { useProgressStore } from '@/stores/progress';

export default function BadgesScreen() {
  const getBadges = useProgressStore((s) => s.getBadges);
  const badges = getBadges();
  const earnedCount = badges.filter((b) => b.earnedAt !== null).length;

  return (
    <SafeAreaView className="flex-1 bg-surface-page" edges={['top']}>
      <ScreenHeader
        title="Achievements"
        showLogo
        rightElement={
          <View className="bg-primary-50 rounded-full px-3 py-1">
            <Text className="text-xs font-bold text-primary-700">
              {earnedCount} / {badges.length}
            </Text>
          </View>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="py-4">

          {/* Progress summary */}
          <View className="mx-4 mb-5 bg-white rounded-2xl border border-border p-4 flex-row items-center">
            <Text className="text-4xl mr-4">🏅</Text>
            <View className="flex-1">
              <Text className="text-base font-bold text-text-primary mb-0.5">
                {earnedCount === 0
                  ? 'Start earning badges!'
                  : earnedCount === badges.length
                  ? 'All badges earned! Amazing! 🎉'
                  : `${badges.length - earnedCount} more to go`}
              </Text>
              <Text className="text-sm text-text-muted">
                Complete lessons to unlock achievements
              </Text>
            </View>
          </View>

          {/* Badge Grid */}
          <BadgeGrid badges={badges} />

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
