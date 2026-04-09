import React from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BadgesHero from '@/components/badges/BadgesHero';
import BadgeGrid from '@/components/badges/BadgeGrid';
import { useProgressStore } from '@/stores/progress';
import { ALL_BADGES, Badge } from '@/types';

export default function BadgesScreen() {
  const earnedBadges = useProgressStore((s) => s.earnedBadges);
  const badges: Badge[] = ALL_BADGES.map((b) => ({
    ...b,
    earnedAt: earnedBadges[b.type] ?? null,
  }));
  const earnedCount = badges.filter((b) => b.earnedAt !== null).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#2D0A6B' }} edges={['top']}>
      {/* Hero — outside scroll */}
      <BadgesHero earnedCount={earnedCount} totalCount={badges.length} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, backgroundColor: '#1A1040' }}
        contentContainerStyle={{ paddingBottom: 88 }}
      >
        {/* Dark badge grid zone */}
        <View
          style={{
            backgroundColor: '#1A1040',
            borderRadius: 20,
            margin: 12,
            padding: 4,
          }}
        >
          <BadgeGrid badges={badges} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
