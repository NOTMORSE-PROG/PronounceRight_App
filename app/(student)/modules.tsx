import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ModuleCard from '@/components/module/ModuleCard';
import { useProgressStore } from '@/stores/progress';
import { MODULES_DATA } from '@/types';
import { IS_ADMIN_BUILD } from '@/lib/buildVariant';

const MODULES_WITH_IDS = MODULES_DATA.map((m, i) => ({
  ...m,
  id: `m${i + 1}`,
}));

export default function ModulesScreen() {
  const { getModuleCompletion, devUnlockAll, toggleDevUnlock, finalAssessmentResult } = useProgressStore();

  const allModulesComplete = devUnlockAll || MODULES_WITH_IDS.every(
    (m) => getModuleCompletion(m.id, m.chapters.map((c) => c.id)) === 100,
  );

  return (
    <SafeAreaView className="flex-1 bg-surface-page" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 88 }}
      >
        <View className="py-4">

          {/* Gradient hero card */}
          <LinearGradient
            colors={['#0D47A1', '#1565C0', '#42A5F5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ marginHorizontal: 16, borderRadius: 20, padding: 20, marginBottom: 16 }}
          >
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 }}>
              Your Learning Path
            </Text>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>My Modules</Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 6, lineHeight: 18 }}>
              Master English pronunciation — from individual sounds to confident, natural speech.
            </Text>
          </LinearGradient>

          {/* Unlock all chapters toggle */}
          {IS_ADMIN_BUILD ? (
            <View className="mx-4 mb-3 px-3 py-2 rounded-lg self-start" style={{ backgroundColor: '#4CAF50' }}>
              <Text className="text-white text-xs font-bold">Admin Demo Mode</Text>
            </View>
          ) : (
            <Pressable
              onPress={toggleDevUnlock}
              className="mx-4 mb-3 px-3 py-2 rounded-lg self-start"
              style={{ backgroundColor: devUnlockAll ? '#4CAF50' : '#9E9E9E' }}
            >
              <Text className="text-white text-xs font-bold">
                {devUnlockAll ? 'All Chapters Unlocked' : 'Unlock All Chapters'}
              </Text>
            </Pressable>
          )}

          {/* Module Cards with staggered entrance */}
          {MODULES_WITH_IDS.map((module, index) => (
            <ModuleCard
              key={module.id}
              module={module}
              progress={getModuleCompletion(
                module.id,
                module.chapters.map((c) => c.id),
              )}
              isLocked={
                !devUnlockAll &&
                index > 0 &&
                getModuleCompletion(
                  MODULES_WITH_IDS[index - 1]!.id,
                  MODULES_WITH_IDS[index - 1]!.chapters.map((c) => c.id),
                ) < 100
              }
              entranceDelay={index * 120}
            />
          ))}

          {/* Final Assessment Card */}
          <View
            className="mx-4 mb-6 rounded-2xl overflow-hidden"
            style={{
              elevation: 12,
              shadowColor: '#FF9800',
              shadowOpacity: 0.35,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 4 },
            }}
          >
            <LinearGradient
              colors={['#FFB300', '#FF9800', '#E65100']}
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

              {/* Status chips */}
              <View className="flex-row gap-2 mb-4 flex-wrap">
                {!allModulesComplete ? (
                  <View className="bg-white/20 rounded-xl px-4 py-2 self-start">
                    <Text className="text-white text-xs font-semibold">🔒 Complete all modules first</Text>
                  </View>
                ) : (
                  <View className="bg-white/20 rounded-xl px-4 py-2 self-start flex-row items-center gap-1.5">
                    <Ionicons name="checkmark-circle" size={14} color="white" />
                    <Text className="text-white text-xs font-semibold">All modules complete</Text>
                  </View>
                )}
                {finalAssessmentResult && (
                  <View className="bg-white/20 rounded-xl px-4 py-2 self-start">
                    <Text className="text-white text-xs font-semibold">
                      Best: {finalAssessmentResult.bestScore}%
                      {finalAssessmentResult.passed ? ' ✓' : ''}
                    </Text>
                  </View>
                )}
              </View>

              <Pressable
                className="bg-white rounded-xl py-3 items-center"
                style={{ opacity: allModulesComplete ? 1 : 0.5 }}
                disabled={!allModulesComplete}
                onPress={() => router.push('/(student)/module/final-assessment')}
              >
                <Text className="text-accent-600 font-bold">
                  {finalAssessmentResult ? 'Retake Assessment' : 'Start Assessment'}
                </Text>
              </Pressable>
            </LinearGradient>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
