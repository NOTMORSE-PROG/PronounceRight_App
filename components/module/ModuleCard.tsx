import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import CircularProgress from '@/components/ui/CircularProgress';
import ProgressBar from '@/components/ui/ProgressBar';
import { Module } from '@/types';

interface ModuleCardProps {
  module: Module & { id: string };
  progress: number;     // 0–100
  isLocked?: boolean;
  compact?: boolean;
  entranceDelay?: number;
}

const MODULE_COLORS = ['#2196F3', '#00BCD4', '#FF9800'];
const MODULE_EMOJIS = ['🗣️', '📢', '🎭'];
const MODULE_GRADIENTS: [string, string][] = [
  ['#2196F3', '#1565C0'],
  ['#26C6DA', '#0097A7'],
  ['#FFA726', '#E65100'],
];

export default function ModuleCard({
  module,
  progress,
  isLocked = false,
  compact = false,
  entranceDelay = 0,
}: ModuleCardProps) {
  const color = MODULE_COLORS[(module.number - 1) % MODULE_COLORS.length]!;
  const emoji = MODULE_EMOJIS[(module.number - 1) % MODULE_EMOJIS.length]!;
  const gradient = MODULE_GRADIENTS[(module.number - 1) % MODULE_GRADIENTS.length]!;
  const chaptersCompleted = Math.round((progress / 100) * module.chapters.length);

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    const ease = Easing.out(Easing.cubic);
    opacity.value = withDelay(entranceDelay, withTiming(1, { duration: 380, easing: ease }));
    translateY.value = withDelay(entranceDelay, withTiming(0, { duration: 380, easing: ease }));
  }, [entranceDelay]); // eslint-disable-line react-hooks/exhaustive-deps

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (compact) {
    return (
      <Animated.View style={entranceStyle}>
        <Pressable
          className={`bg-white rounded-2xl p-4 border border-border shadow-card w-44 mr-3 ${
            isLocked ? 'opacity-60' : ''
          }`}
          onPress={() =>
            !isLocked &&
            router.push({ pathname: '/(student)/module/[moduleId]', params: { moduleId: module.id } })
          }
        >
          {/* Gradient circle with number */}
          <View style={{ width: 40, height: 40, borderRadius: 20, overflow: 'hidden', marginBottom: 8 }}>
            <LinearGradient
              colors={gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16, textAlign: 'center', includeFontPadding: false, textAlignVertical: 'center' }}>
                {module.number}
              </Text>
            </LinearGradient>
          </View>
          <Text className="text-sm font-semibold text-text-primary mb-1" numberOfLines={2}>
            {module.title}
          </Text>
          <ProgressBar progress={progress} height={4} color={color} />
          <Text className="text-xs text-text-muted mt-1">
            {chaptersCompleted}/{module.chapters.length} chapters
          </Text>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[{ marginHorizontal: 16, marginBottom: 16 }, entranceStyle]}>
      <Pressable
        className={`bg-white rounded-2xl border border-border shadow-card overflow-hidden ${
          isLocked ? 'opacity-60' : ''
        }`}
        onPress={() =>
          !isLocked &&
          router.push({ pathname: '/(student)/module/[moduleId]', params: { moduleId: module.id } })
        }
      >
        {/* Gradient header strip */}
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 }}
        >
          <View className="flex-row items-center justify-between">
            <View style={{ flex: 1 }}>
              <Text className="text-white text-xs font-medium opacity-80 mb-1">
                Module {module.number}
              </Text>
              <Text className="text-white text-xl font-bold" numberOfLines={1}>
                {module.title}
              </Text>
            </View>
            <Text className="text-4xl ml-3">{emoji}</Text>
          </View>
        </LinearGradient>

        {/* Body */}
        <View className="p-5">
          <Text className="text-sm text-text-secondary mb-4 leading-relaxed" numberOfLines={2}>
            {module.description}
          </Text>

          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <View className="bg-primary-50 rounded-full px-3 py-1">
                <Text className="text-xs font-semibold text-primary-700">
                  {module.chapters.length} Chapters
                </Text>
              </View>
              {progress === 100 && (
                <View className="bg-success-light rounded-full px-3 py-1">
                  <Text className="text-xs font-semibold text-success-dark">✓ Complete</Text>
                </View>
              )}
            </View>
            <CircularProgress progress={progress} size={48} strokeWidth={5} color={color} />
          </View>

          <ProgressBar progress={progress} height={6} color={color} />

          <Text className="text-xs text-text-muted mt-2 mb-4">
            {chaptersCompleted} of {module.chapters.length} chapters completed
          </Text>

          {/* Gradient action button */}
          <View style={{ borderRadius: 12, overflow: 'hidden' }}>
            <LinearGradient
              colors={gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ paddingVertical: 12, alignItems: 'center' }}
            >
              <Text className="text-white font-semibold text-base">
                {isLocked ? '🔒 Locked' : progress === 0 ? 'Start Module' : 'Continue'}
              </Text>
            </LinearGradient>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}
