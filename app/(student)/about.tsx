import React from 'react';
import { View, Text, ScrollView, Image, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '@/components/ui/ScreenHeader';

const APP_VERSION = '1.0.0';

export default function AboutScreen() {
  return (
    <SafeAreaView className="flex-1 bg-surface-page" edges={['top']}>
      <ScreenHeader title="About" showBack />

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="py-6">
          {/* Logo + Name */}
          <View className="items-center px-4 mb-6">
            <View className="w-24 h-24 rounded-3xl bg-white items-center justify-center border border-border mb-3">
              <Image
                source={require('@/assets/images/logo.png')}
                style={{ width: 72, height: 72 }}
                resizeMode="contain"
              />
            </View>
            <Text className="text-2xl font-bold text-primary-700">SpeakRight</Text>
            <Text className="text-sm text-text-muted mt-1">Version {APP_VERSION}</Text>
          </View>

          {/* About */}
          <View className="mx-4 mb-5 bg-white rounded-2xl border border-border p-4">
            <Text className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
              About the App
            </Text>
            <Text className="text-sm text-text-secondary leading-5">
              SpeakRight is a guided English pronunciation and speaking practice app designed for
              students. Build core skills through interactive lessons, recording activities, and
              real-life video role-plays — and earn badges and a certificate as you progress.
            </Text>
          </View>

          {/* Features */}
          <View className="mx-4 mb-5 bg-white rounded-2xl border border-border p-4">
            <Text className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">
              What's Inside
            </Text>
            {[
              { icon: 'mic-outline' as const, label: 'Pronunciation drills with instant feedback' },
              { icon: 'musical-notes-outline' as const, label: 'Stress and intonation practice' },
              { icon: 'videocam-outline' as const, label: 'Video role-play scenarios' },
              { icon: 'trophy-outline' as const, label: 'Badges and completion certificate' },
            ].map((f) => (
              <View key={f.label} className="flex-row items-center py-2">
                <View className="w-8 h-8 bg-primary-50 rounded-lg items-center justify-center mr-3">
                  <Ionicons name={f.icon} size={16} color="#2196F3" />
                </View>
                <Text className="flex-1 text-sm text-text-primary">{f.label}</Text>
              </View>
            ))}
          </View>

          {/* Credits */}
          <View className="mx-4 mb-5 bg-white rounded-2xl border border-border p-4">
            <Text className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
              Credits
            </Text>
            <Text className="text-sm text-text-secondary leading-5">
              Built with React Native and Expo. Speech recognition powered by Whisper.
              Sound effects courtesy of Mixkit.
            </Text>
          </View>

          {/* Contact */}
          <View className="mx-4 mb-8 bg-white rounded-2xl border border-border overflow-hidden">
            <Pressable
              className="flex-row items-center px-4 py-3.5 active:bg-primary-50"
              onPress={() => Linking.openURL('mailto:support@speakright.app')}
            >
              <View className="w-8 h-8 bg-primary-50 rounded-lg items-center justify-center mr-3">
                <Ionicons name="mail-outline" size={18} color="#2196F3" />
              </View>
              <Text className="flex-1 text-sm font-medium text-text-primary">Contact Support</Text>
              <Ionicons name="chevron-forward" size={16} color="#90A4AE" />
            </Pressable>
          </View>

          <Text className="text-xs text-text-muted text-center">
            © {new Date().getFullYear()} SpeakRight. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
