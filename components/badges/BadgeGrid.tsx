import React from 'react';
import { FlatList } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import BadgeCard from './BadgeCard';
import { Badge } from '@/types';

interface BadgeGridProps {
  badges: Badge[];
}

export default function BadgeGrid({ badges }: BadgeGridProps) {
  return (
    <FlatList
      data={badges}
      keyExtractor={(item) => item.type}
      numColumns={2}
      columnWrapperStyle={{ gap: 12 }}
      contentContainerStyle={{ gap: 12, paddingHorizontal: 16, paddingBottom: 32 }}
      renderItem={({ item, index }) => (
        <Animated.View
          className="flex-1"
          entering={ZoomIn.delay(index * 60).springify().damping(14)}
        >
          <BadgeCard badge={item} />
        </Animated.View>
      )}
      scrollEnabled={false}
    />
  );
}
