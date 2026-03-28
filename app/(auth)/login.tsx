import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/auth';
import type { AuthUser } from '@/types';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pinRef = useRef<TextInput>(null);
  const { setAuth, setBypass } = useAuthStore();

  function navigateAfterAuth() {
    router.replace('/(student)/dashboard');
  }

  async function handleLogin() {
    const trimmedUsername = username.trim();
    const trimmedPin = pin.trim();

    if (!trimmedUsername) {
      setError('Please enter your username.');
      return;
    }
    if (trimmedPin.length < 4) {
      setError('PIN must be at least 4 digits.');
      return;
    }

    setError('');
    setLoading(true);

    // Mock local auth — accepts any valid username + PIN
    await new Promise((r) => setTimeout(r, 600));

    const mockUser: AuthUser = {
      id: `local-${trimmedUsername}`,
      username: trimmedUsername.toLowerCase().replace(/\s+/g, '_'),
      fullName: trimmedUsername
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' '),
      classId: undefined,
      className: 'Grade 10',
      avatarSeed: trimmedUsername.charAt(0).toUpperCase(),
      createdAt: new Date().toISOString(),
    };

    await setAuth('mock-token', mockUser);
    setLoading(false);
    navigateAfterAuth();
  }

  function handleBypass() {
    setBypass();
    router.replace('/(student)/dashboard');
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-page" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-4 pt-10 pb-8">

            {/* Logo + App Name */}
            <View className="items-center mb-8">
              <Image
                source={require('@/assets/images/logo.png')}
                style={{ width: 110, height: 110 }}
                resizeMode="contain"
              />
              <Text className="text-3xl font-bold text-primary-700 mt-4 tracking-tight">
                SpeakRight
              </Text>
              <Text className="text-sm text-text-muted mt-1">
                Speak clearly. Learn confidently.
              </Text>
            </View>

            {/* Login Card */}
            <View className="bg-white rounded-2xl border border-border px-6 py-7">
              <Text className="text-xl font-bold text-text-primary mb-1">Welcome back!</Text>
              <Text className="text-sm text-text-muted mb-6">
                Log in with your student username and PIN.
              </Text>

              {/* Username Field */}
              <View className="mb-4">
                <Text className="text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide">
                  Username
                </Text>
                <View className="flex-row items-center border border-border rounded-xl px-4 py-3 bg-surface-page">
                  <Ionicons name="person-outline" size={18} color="#90A4AE" />
                  <TextInput
                    className="flex-1 text-base text-text-primary ml-3"
                    placeholder="Enter your username"
                    placeholderTextColor="#90A4AE"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => pinRef.current?.focus()}
                  />
                </View>
              </View>

              {/* PIN Field */}
              <View className="mb-6">
                <Text className="text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide">
                  PIN
                </Text>
                <View className="flex-row items-center border border-border rounded-xl px-4 py-3 bg-surface-page">
                  <Ionicons name="lock-closed-outline" size={18} color="#90A4AE" />
                  <TextInput
                    ref={pinRef}
                    className="flex-1 text-base text-text-primary ml-3"
                    placeholder="4-digit PIN"
                    placeholderTextColor="#90A4AE"
                    value={pin}
                    onChangeText={setPin}
                    secureTextEntry={!showPin}
                    keyboardType="numeric"
                    maxLength={6}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                  />
                  <Pressable onPress={() => setShowPin((v) => !v)} hitSlop={8}>
                    <Ionicons
                      name={showPin ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color="#90A4AE"
                    />
                  </Pressable>
                </View>
              </View>

              {/* Error */}
              {error ? (
                <View className="bg-error-light rounded-xl p-3 mb-4 flex-row items-center">
                  <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
                  <Text className="text-sm text-error ml-2 flex-1">{error}</Text>
                </View>
              ) : null}

              {/* Login Button */}
              <Pressable
                className={`bg-primary-500 rounded-xl py-4 items-center ${
                  loading ? 'opacity-70' : 'active:bg-primary-600'
                }`}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-bold text-base">Log In</Text>
                )}
              </Pressable>

              {/* Divider */}
              <View className="flex-row items-center my-5">
                <View className="flex-1 h-px bg-border" />
                <Text className="mx-3 text-xs text-text-muted">or</Text>
                <View className="flex-1 h-px bg-border" />
              </View>

              {/* Dev Bypass */}
              <Pressable
                className="py-3 items-center active:opacity-70"
                onPress={handleBypass}
              >
                <Text className="text-primary-500 font-medium text-sm">
                  Continue as Guest (Dev Bypass) →
                </Text>
              </Pressable>
            </View>

            <Text className="text-center text-xs text-text-muted mt-6">
              SpeakRight · Grade 10 Pronunciation App
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
