import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenHeader from '@/components/ui/ScreenHeader';
import Chip from '@/components/ui/Chip';
import { MODULES_DATA } from '@/types';

const MODULES_WITH_IDS = MODULES_DATA.map((m, i) => ({ ...m, id: `m${i + 1}` }));
const MODULE_COLORS = ['#2196F3', '#00BCD4', '#FF9800'];

export default function ChapterScreen() {
  const { chapterId } = useLocalSearchParams<{
    chapterId: string;
    moduleId: string;
  }>();

  // Find the chapter from static data
  let foundChapter = null;
  let foundModule = null;
  let moduleIndex = 0;

  for (let i = 0; i < MODULES_WITH_IDS.length; i++) {
    const m = MODULES_WITH_IDS[i]!;
    const c = m.chapters.find((ch) => ch.id === chapterId);
    if (c) {
      foundChapter = c;
      foundModule = m;
      moduleIndex = i;
      break;
    }
  }

  const module = foundModule ?? MODULES_WITH_IDS[0]!;
  const chapter = foundChapter ?? module.chapters[0]!;
  const color = MODULE_COLORS[moduleIndex % MODULE_COLORS.length]!;

  return (
    <SafeAreaView className="flex-1 bg-surface-page" edges={['top']}>
      <ScreenHeader title={`Chapter ${chapter.number}`} showBack />

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="py-4">

          {/* Hero */}
          <View style={{ backgroundColor: color + '15' }} className="mx-4 mb-4 rounded-2xl p-5 border border-border">
            <View className="flex-row items-start justify-between mb-3">
              <View className="flex-1 mr-3">
                <Text className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">
                  Module {module.number} · Chapter {chapter.number}
                </Text>
                <Text className="text-xl font-bold text-text-primary">{chapter.title}</Text>
              </View>
              <View
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{ backgroundColor: color }}
              >
                <Text className="text-white font-bold text-lg">{chapter.number}</Text>
              </View>
            </View>
            <Chip label={chapter.skillFocus} variant="primary" />
          </View>

          {/* Activity Card */}
          <View className="mx-4 mb-4 bg-white rounded-2xl border border-border p-5 shadow-card">
            <View className="flex-row items-center gap-2 mb-3">
              <View
                className="w-8 h-8 rounded-lg items-center justify-center"
                style={{ backgroundColor: color + '20' }}
              >
                <Ionicons name="mic-outline" size={18} color={color} />
              </View>
              <Text className="text-sm font-bold text-text-primary">Activity</Text>
            </View>
            <Text
              className="text-lg font-bold mb-2"
              style={{ color }}
            >
              {chapter.activityName}
            </Text>
            <Text className="text-sm text-text-secondary leading-relaxed">
              {chapter.activityDescription}
            </Text>
          </View>

          {/* Coming Soon Placeholder */}
          <View className="mx-4 mb-4 rounded-2xl overflow-hidden">
            <LinearGradient
              colors={[color + 'CC', color]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 16, padding: 24, alignItems: 'center' }}
            >
              <Text className="text-5xl mb-4">🎤</Text>
              <Text className="text-white text-xl font-bold mb-2">Coming Soon</Text>
              <Text className="text-white text-sm opacity-80 text-center leading-relaxed mb-6">
                The interactive pronunciation exercises for this chapter are currently being
                built. Stay tuned!
              </Text>

              {/* Step preview */}
              <View className="bg-white/20 rounded-2xl p-4 w-full">
                <Text className="text-white text-xs font-semibold mb-3 opacity-80">
                  What you'll do:
                </Text>
                {['🔊 Listen to the model', '🎤 Record yourself', '📊 See your feedback'].map(
                  (step) => (
                    <View key={step} className="flex-row items-center gap-2 mb-2">
                      <Text className="text-white text-sm">{step}</Text>
                    </View>
                  ),
                )}
              </View>
            </LinearGradient>
          </View>

          {/* Back to module */}
          <View className="mx-4 mb-8">
            <Pressable
              className="border-2 border-primary-500 rounded-xl py-3.5 items-center active:bg-primary-50"
              onPress={() =>
                router.push({
                  pathname: '/(student)/module/[moduleId]',
                  params: { moduleId: module.id },
                })
              }
            >
              <Text className="text-primary-500 font-semibold text-base">
                ← Back to {module.title}
              </Text>
            </Pressable>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
