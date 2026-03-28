import React from 'react';
import { View, FlatList } from 'react-native';
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
      renderItem={({ item }) => (
        <View className="flex-1">
          <BadgeCard badge={item} />
        </View>
      )}
      scrollEnabled={false}
    />
  );
}
