import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenHeader from '@/components/ui/ScreenHeader';
import ModuleCard from '@/components/module/ModuleCard';
import { useProgressStore } from '@/stores/progress';
import { MODULES_DATA } from '@/types';

const MODULES_WITH_IDS = MODULES_DATA.map((m, i) => ({
  ...m,
  id: `m${i + 1}`,
}));

export default function ModulesScreen() {
  const { getModuleCompletion } = useProgressStore();

  return (
    <SafeAreaView className="flex-1 bg-surface-page" edges={['top']}>
      <ScreenHeader title="My Modules" showLogo />

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="py-4">

          {/* Subheader */}
          <View className="px-4 mb-4">
            <Text className="text-sm text-text-secondary leading-relaxed">
              Work through each module to master English pronunciation — from individual sounds
              to confident, natural speech.
            </Text>
          </View>

          {/* Module Cards */}
          {MODULES_WITH_IDS.map((module, index) => (
            <ModuleCard
              key={module.id}
              module={module}
              progress={getModuleCompletion(
                module.id,
                module.chapters.map((c) => c.id),
              )}
              isLocked={index > 0}
            />
          ))}

          {/* Final Assessment Card */}
          <View className="mx-4 mb-6 rounded-2xl overflow-hidden">
            <LinearGradient
              colors={['#FF9800', '#FB8C00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 16, padding: 20 }}
            >
              <View className="flex-row items-center justify-between mb-3">
                <View>
                  <Text className="text-white text-xs font-semibold opacity-80 mb-1 uppercase tracking-wide">
                    Final Assessment
                  </Text>
                  <Text className="text-white text-xl font-bold">
                    Independent Speaking Task
                  </Text>
                </View>
                <Text className="text-4xl">🏆</Text>
              </View>
              <Text className="text-white text-sm opacity-90 mb-4 leading-relaxed">
                IELTS Speaking Part 2 format — 1 minute preparation, 1–2 minutes speaking
                on a given topic.
              </Text>
              <View className="bg-white/20 rounded-xl px-4 py-2 self-start mb-4">
                <Text className="text-white text-xs font-semibold">🔒 Complete all modules first</Text>
              </View>
              <Pressable
                className="bg-white rounded-xl py-3 items-center opacity-50"
                disabled
              >
                <Text className="text-accent-600 font-bold">Start Assessment</Text>
              </Pressable>
            </LinearGradient>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
