import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import ScreenHeader from '@/components/ui/ScreenHeader';
import Avatar from '@/components/ui/Avatar';
import ProgressBar from '@/components/ui/ProgressBar';
import ProfileIconPicker from '@/components/ui/ProfileIconPicker';
import FloatingOrb from '@/components/ui/auth/FloatingOrb';
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

  // Logout button spring
  const logoutScale = useSharedValue(1);
  const logoutStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoutScale.value }],
  }));

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

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 88 }}
      >

        {/* Gradient Hero Section */}
        <LinearGradient
          colors={['#1565C0', '#2196F3', '#E3F2FD']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1.2 }}
          style={{ paddingTop: 28, paddingBottom: 32, alignItems: 'center', overflow: 'hidden' }}
        >
          {/* Floating orbs behind content */}
          <FloatingOrb size={90} initialX={-20} initialY={10} color="rgba(255,255,255,0.08)" duration={4500} />
          <FloatingOrb size={60} initialX={260} initialY={20} color="rgba(255,255,255,0.10)" duration={3800} />
          <FloatingOrb size={110} initialX={180} initialY={-30} color="rgba(33,150,243,0.20)" duration={5200} />
          <Pressable
            onPress={() => setShowIconPicker(true)}
            style={{ position: 'relative' }}
          >
            {/* Glassy avatar ring */}
            <View
              style={{
                padding: 3,
                borderRadius: 50,
                backgroundColor: 'rgba(255,255,255,0.25)',
              }}
            >
              <Avatar name={fullName} size={88} iconId={user?.profileIconId} />
            </View>
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: '#2196F3',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: 'rgba(255,255,255,0.85)',
              }}
            >
              <Ionicons name="pencil" size={13} color="#fff" />
            </View>
          </Pressable>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#fff', marginTop: 12 }}>
            {fullName}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 }}>
            <Ionicons name="school-outline" size={14} color="rgba(255,255,255,0.75)" />
            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>{className}</Text>
          </View>
        </LinearGradient>

        <ProfileIconPicker
          visible={showIconPicker}
          selectedId={user?.profileIconId}
          onSelect={(id) => {
            updateUser({ profileIconId: id === 0 ? undefined : id });
            setShowIconPicker(false);
          }}
          onClose={() => setShowIconPicker(false)}
        />

        <View style={{ paddingTop: 16 }}>

          {/* Stats Grid */}
          <LinearGradient
            colors={['#0D1B3E', '#1A2B6B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ marginHorizontal: 16, marginBottom: 20, borderRadius: 16, padding: 16 }}
          >
            <Text style={{ fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>
              My Stats
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {[
                { icon: '📚', value: lessonsCompleted, label: 'Lessons Done', color: '#42A5F5' },
                { icon: '🥇', value: earnedBadgesCount, label: 'Badges', color: '#FFB300' },
              ].map((stat) => (
                <View
                  key={stat.label}
                  style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}
                >
                  <Text style={{ fontSize: 24, marginBottom: 4 }}>{stat.icon}</Text>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: stat.color }}>{stat.value}</Text>
                  <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', textAlign: 'center', marginTop: 2 }}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>

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
                    <View className="flex-row items-center gap-2">
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
                      <Text className="text-xs font-medium text-text-secondary" numberOfLines={1}>
                        Module {module.number}
                      </Text>
                    </View>
                    <Text className="text-xs font-bold" style={{ color }}>
                      {progress}%
                    </Text>
                  </View>
                  <ProgressBar progress={progress} height={8} color={color} />
                </View>
              );
            })}
          </View>

          {/* Certificate — only shown when earned */}
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
                <View style={{ flex: 1 }}>
                  <Text className="text-sm font-bold text-text-primary">Completion Certificate</Text>
                  <Text className="text-xs text-text-muted mt-0.5">Tap to view, download, or share</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#90A4AE" />
              </Pressable>
            </View>
          )}

          {/* App Features Card */}
          <LinearGradient
            colors={['#0D1B3E', '#1A2B6B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ marginHorizontal: 16, marginBottom: 20, borderRadius: 16, padding: 16 }}
          >
            <Text style={{ fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>
              App Features
            </Text>
            {ABOUT_FEATURES.map((f, i) => (
              <View key={f.label} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 7, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: 'rgba(255,255,255,0.07)' }}>
                <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(33,150,243,0.25)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Ionicons name={f.icon} size={16} color="#64B5F6" />
                </View>
                <Text style={{ flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '500' }}>{f.label}</Text>
              </View>
            ))}
          </LinearGradient>

          {/* Settings */}
          <View className="mx-4 mb-5 bg-white rounded-2xl border border-border overflow-hidden">
            <Text className="text-xs font-semibold text-text-muted uppercase tracking-wide px-4 pt-4 pb-2">
              Settings
            </Text>

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
            <Animated.View style={logoutStyle}>
              <Pressable
                onPress={handleLogout}
                onPressIn={() => { logoutScale.value = withSpring(0.97, { damping: 15, stiffness: 300 }); }}
                onPressOut={() => { logoutScale.value = withSpring(1, { damping: 12, stiffness: 200 }); }}
                style={{ borderRadius: 12, overflow: 'hidden' }}
              >
                <LinearGradient
                  colors={['#FFEBEE', '#FFCDD2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingVertical: 14,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: '#FFCDD2',
                    borderRadius: 12,
                    borderLeftWidth: 3,
                    borderLeftColor: '#EF4444',
                  }}
                >
                  <Text style={{ color: '#EF4444', fontWeight: '600', fontSize: 15 }}>Log Out</Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
