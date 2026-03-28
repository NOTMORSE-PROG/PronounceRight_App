import React from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '@/components/ui/ScreenHeader';
import Avatar from '@/components/ui/Avatar';
import ProgressBar from '@/components/ui/ProgressBar';
import { useAuthStore } from '@/stores/auth';
import { useProgressStore } from '@/stores/progress';
import { MODULES_DATA } from '@/types';

const MODULES_WITH_IDS = MODULES_DATA.map((m, i) => ({ ...m, id: `m${i + 1}` }));
const MODULE_COLORS = ['#2196F3', '#00BCD4', '#FF9800'];

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { totalPoints, getBadges, getModuleCompletion } = useProgressStore();

  const fullName = user?.fullName ?? 'Student';
  const className = user?.className ?? 'No Class';
  const badges = getBadges();
  const earnedBadgesCount = badges.filter((b) => b.earnedAt !== null).length;
  const lessonsCompleted = Object.values(useProgressStore.getState().chapterProgress).filter(
    (p) => p.completed,
  ).length;

  async function handleLogout() {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-page" edges={['top']}>
      <ScreenHeader title="Profile" showLogo />

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="py-4">

          {/* Avatar Section */}
          <View className="items-center px-4 mb-6">
            <Avatar name={fullName} size={88} />
            <Text className="text-xl font-bold text-text-primary mt-3">{fullName}</Text>
            <View className="flex-row items-center mt-1 gap-1">
              <Ionicons name="school-outline" size={14} color="#546E7A" />
              <Text className="text-sm text-text-secondary">{className}</Text>
            </View>
          </View>

          {/* Stats Grid */}
          <View className="mx-4 mb-5 bg-primary-50 rounded-2xl p-4">
            <Text className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">
              My Stats
            </Text>
            <View className="flex-row gap-3">
              {[
                { icon: '📚', value: lessonsCompleted, label: 'Lessons Done' },
                { icon: '🏆', value: totalPoints, label: 'Total Points' },
                { icon: '🥇', value: earnedBadgesCount, label: 'Badges' },
              ].map((stat) => (
                <View
                  key={stat.label}
                  className="flex-1 bg-white rounded-xl p-3 items-center border border-border"
                >
                  <Text className="text-2xl mb-1">{stat.icon}</Text>
                  <Text className="text-lg font-bold text-primary-700">{stat.value}</Text>
                  <Text className="text-xs text-text-muted text-center">{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Module Progress */}
          <View className="mx-4 mb-5 bg-white rounded-2xl border border-border p-4">
            <Text className="text-sm font-semibold text-text-primary mb-4">
              Module Progress
            </Text>
            {MODULES_WITH_IDS.map((module, index) => {
              const progress = getModuleCompletion(
                module.id,
                module.chapters.map((c) => c.id),
              );
              const color = MODULE_COLORS[index % MODULE_COLORS.length]!;
              return (
                <View key={module.id} className="mb-4 last:mb-0">
                  <View className="flex-row items-center justify-between mb-1.5">
                    <Text className="text-xs font-medium text-text-secondary" numberOfLines={1}>
                      Module {module.number}
                    </Text>
                    <Text className="text-xs font-bold" style={{ color }}>
                      {progress}%
                    </Text>
                  </View>
                  <ProgressBar progress={progress} height={6} color={color} />
                </View>
              );
            })}
          </View>

          {/* Settings */}
          <View className="mx-4 mb-5 bg-white rounded-2xl border border-border overflow-hidden">
            <Text className="text-xs font-semibold text-text-muted uppercase tracking-wide px-4 pt-4 pb-2">
              Settings
            </Text>

            {[
              { icon: 'text-outline' as const, label: 'Text Size', hint: 'Normal' },
              { icon: 'volume-medium-outline' as const, label: 'Audio Volume', hint: '100%' },
              { icon: 'information-circle-outline' as const, label: 'About SpeakRight', hint: 'v1.0.0' },
            ].map((item, i) => (
              <Pressable
                key={item.label}
                className={`flex-row items-center px-4 py-3.5 active:bg-primary-50 ${
                  i > 0 ? 'border-t border-border' : ''
                }`}
              >
                <View className="w-8 h-8 bg-primary-50 rounded-lg items-center justify-center mr-3">
                  <Ionicons name={item.icon} size={18} color="#2196F3" />
                </View>
                <Text className="flex-1 text-sm font-medium text-text-primary">{item.label}</Text>
                <Text className="text-sm text-text-muted mr-2">{item.hint}</Text>
                <Ionicons name="chevron-forward" size={16} color="#90A4AE" />
              </Pressable>
            ))}
          </View>

          {/* Logout */}
          <View className="mx-4 mb-8">
            <Pressable
              className="bg-error-light rounded-xl py-3.5 items-center border border-red-200 active:opacity-70"
              onPress={handleLogout}
            >
              <Text className="text-error font-semibold text-base">Log Out</Text>
            </Pressable>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
