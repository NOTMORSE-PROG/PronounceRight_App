import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '@/components/ui/ScreenHeader';
import Avatar from '@/components/ui/Avatar';
import ProgressBar from '@/components/ui/ProgressBar';
import ProfileIconPicker from '@/components/ui/ProfileIconPicker';
import { useAuthStore } from '@/stores/auth';
import { useProgressStore } from '@/stores/progress';
import { MODULES_DATA } from '@/types';

const MODULES_WITH_IDS = MODULES_DATA.map((m, i) => ({ ...m, id: `m${i + 1}` }));
const MODULE_COLORS = ['#2196F3', '#00BCD4', '#FF9800'];

const APP_VERSION = '1.0.0';

const ABOUT_FEATURES = [
  { icon: 'mic-outline' as const, label: 'Pronunciation drills with instant feedback' },
  { icon: 'musical-notes-outline' as const, label: 'Stress and intonation practice' },
  { icon: 'videocam-outline' as const, label: 'Video role-play scenarios' },
  { icon: 'trophy-outline' as const, label: 'Badges and completion certificate' },
];

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { getBadges, getModuleCompletion } = useProgressStore();

  const certificateEarned = useProgressStore((s) => s.certificateEarned);
  const fullName = user?.fullName ?? 'Student';
  const className = user?.className ?? 'No Class';
  const badges = getBadges();
  const earnedBadgesCount = badges.filter((b) => b.earnedAt !== null).length;
  const chapterProgress = useProgressStore((s) => s.chapterProgress);
  const lessonsCompleted = Object.values(chapterProgress).filter((p) => p.completed).length;

  const [showAbout, setShowAbout] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const updateUser = useAuthStore((s) => s.updateUser);

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
            <Pressable
              onPress={() => setShowIconPicker(true)}
              className="active:opacity-80"
            >
              <Avatar name={fullName} size={88} iconId={user?.profileIconId} />
              <View
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: '#2196F3',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: '#fff',
                }}
              >
                <Ionicons name="pencil" size={13} color="#fff" />
              </View>
            </Pressable>
            <Text className="text-xl font-bold text-text-primary mt-3">{fullName}</Text>
            <View className="flex-row items-center mt-1 gap-1">
              <Ionicons name="school-outline" size={14} color="#546E7A" />
              <Text className="text-sm text-text-secondary">{className}</Text>
            </View>
          </View>

          <ProfileIconPicker
            visible={showIconPicker}
            selectedId={user?.profileIconId}
            onSelect={(id) => {
              updateUser({ profileIconId: id === 0 ? undefined : id });
              setShowIconPicker(false);
            }}
            onClose={() => setShowIconPicker(false)}
          />

          {/* Stats Grid */}
          <View className="mx-4 mb-5 bg-primary-50 rounded-2xl p-4">
            <Text className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">
              My Stats
            </Text>
            <View className="flex-row gap-3">
              {[
                { icon: '📚', value: lessonsCompleted, label: 'Lessons Done' },
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

          {/* Certificate — separate section, only shown when earned */}
          {certificateEarned && (
            <View className="mx-4 mb-5 bg-white rounded-2xl border border-border overflow-hidden">
              <Text className="text-xs font-semibold text-text-muted uppercase tracking-wide px-4 pt-4 pb-2">
                My Certificate
              </Text>
              <Pressable
                className="flex-row items-center px-4 py-3.5 active:bg-primary-50 border-t border-border"
                onPress={() => router.push('/(student)/certificate?from=profile' as any)}
              >
                <View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: '#FFF8E1' }}>
                  <Ionicons name="ribbon" size={22} color="#F59E0B" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-text-primary">Completion Certificate</Text>
                  <Text className="text-xs text-text-muted mt-0.5">Tap to view, download, or share</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#90A4AE" />
              </Pressable>
            </View>
          )}

          {/* Settings */}
          <View className="mx-4 mb-5 bg-white rounded-2xl border border-border overflow-hidden">
            <Text className="text-xs font-semibold text-text-muted uppercase tracking-wide px-4 pt-4 pb-2">
              Settings
            </Text>

            {/* About SpeakRight — expandable inline */}
            <Pressable
              className="flex-row items-center px-4 py-3.5 active:bg-primary-50 border-t border-border"
              onPress={() => setShowAbout((v) => !v)}
            >
              <View className="w-8 h-8 bg-primary-50 rounded-lg items-center justify-center mr-3">
                <Ionicons name="information-circle-outline" size={18} color="#2196F3" />
              </View>
              <Text className="flex-1 text-sm font-medium text-text-primary">About SpeakRight</Text>
              <Text className="text-sm text-text-muted mr-2">v{APP_VERSION}</Text>
              <Ionicons name={showAbout ? 'chevron-up' : 'chevron-down'} size={16} color="#90A4AE" />
            </Pressable>

            {showAbout && (
              <View className="px-4 pb-4 border-t border-border">
                <Text className="text-sm text-text-secondary leading-5 mt-3 mb-3">
                  SpeakRight is a guided English pronunciation and speaking practice app designed for
                  students. Build core skills through interactive lessons, recording activities, and
                  real-life video role-plays — and earn badges and a certificate as you progress.
                </Text>
                {ABOUT_FEATURES.map((f) => (
                  <View key={f.label} className="flex-row items-center py-1.5">
                    <View className="w-7 h-7 bg-primary-50 rounded-lg items-center justify-center mr-3">
                      <Ionicons name={f.icon} size={14} color="#2196F3" />
                    </View>
                    <Text className="flex-1 text-xs text-text-primary">{f.label}</Text>
                  </View>
                ))}
                <Text className="text-xs text-text-muted leading-4 mt-3 mb-1">
                  Built with React Native and Expo. Speech recognition powered by Whisper.
                  Sound effects courtesy of Mixkit.
                </Text>
                <Pressable
                  className="flex-row items-center mt-3 active:opacity-70"
                  onPress={() => Linking.openURL('mailto:support@speakright.app')}
                >
                  <Ionicons name="mail-outline" size={14} color="#2196F3" />
                  <Text className="text-xs font-medium text-primary-700 ml-1.5">Contact Support</Text>
                </Pressable>
              </View>
            )}
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
