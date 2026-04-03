import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/auth';
import { registerStudent } from '@/lib/auth-service';

export default function SignUpScreen() {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const usernameRef = useRef<TextInput>(null);
  const pinRef = useRef<TextInput>(null);
  const confirmPinRef = useRef<TextInput>(null);

  const { setAuth } = useAuthStore();

  async function handleSignUp() {
    const trimmedFullName = fullName.trim();
    const trimmedUsername = username.trim();

    if (!trimmedFullName) {
      setError('Please enter your full name.');
      return;
    }
    if (!trimmedUsername) {
      setError('Please enter a username.');
      return;
    }
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits.');
      return;
    }
    if (pin !== confirmPin) {
      setError('PINs do not match.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await registerStudent(trimmedFullName, trimmedUsername, pin);

      if ('error' in result) {
        if (result.error === 'USERNAME_TAKEN') {
          setError('That username is already taken. Try another one.');
        } else if (result.error === 'INVALID_USERNAME') {
          setError('Username must be 3–20 characters: letters, numbers, and underscores only.');
        } else {
          setError('PIN must be at least 4 digits.');
        }
        setLoading(false);
        return;
      }

      await setAuth(result.user);
      setLoading(false);
      // Always show onboarding for new accounts
      router.replace('/(auth)/onboarding');
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
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

            {/* Header */}
            <View className="mb-8">
              <Pressable
                className="flex-row items-center mb-6 active:opacity-70"
                onPress={() => router.back()}
                hitSlop={8}
              >
                <Ionicons name="arrow-back" size={22} color="#2196F3" />
                <Text className="text-primary-500 font-medium text-sm ml-1">Back to Login</Text>
              </Pressable>

              <Text className="text-3xl font-bold text-primary-700 tracking-tight">
                Create Account
              </Text>
              <Text className="text-sm text-text-muted mt-1">
                Set up your student profile to get started.
              </Text>
            </View>

            {/* Sign-Up Card */}
            <View className="bg-white rounded-2xl border border-border px-6 py-7">

              {/* Full Name */}
              <View className="mb-4">
                <Text className="text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide">
                  Full Name
                </Text>
                <View className="flex-row items-center border border-border rounded-xl px-4 py-3 bg-surface-page">
                  <Ionicons name="person-outline" size={18} color="#90A4AE" />
                  <TextInput
                    className="flex-1 text-base text-text-primary ml-3"
                    placeholder="e.g. Juan dela Cruz"
                    placeholderTextColor="#90A4AE"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => usernameRef.current?.focus()}
                  />
                </View>
              </View>

              {/* Username */}
              <View className="mb-4">
                <Text className="text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide">
                  Username
                </Text>
                <View className="flex-row items-center border border-border rounded-xl px-4 py-3 bg-surface-page">
                  <Ionicons name="at-outline" size={18} color="#90A4AE" />
                  <TextInput
                    ref={usernameRef}
                    className="flex-1 text-base text-text-primary ml-3"
                    placeholder="e.g. juan_delacruz"
                    placeholderTextColor="#90A4AE"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => pinRef.current?.focus()}
                  />
                </View>
                <Text className="text-xs text-text-muted mt-1 ml-1">
                  Letters, numbers, and underscores only (3–20 characters)
                </Text>
              </View>

              {/* PIN */}
              <View className="mb-4">
                <Text className="text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide">
                  PIN
                </Text>
                <View className="flex-row items-center border border-border rounded-xl px-4 py-3 bg-surface-page">
                  <Ionicons name="lock-closed-outline" size={18} color="#90A4AE" />
                  <TextInput
                    ref={pinRef}
                    className="flex-1 text-base text-text-primary ml-3"
                    placeholder="4–6 digit PIN"
                    placeholderTextColor="#90A4AE"
                    value={pin}
                    onChangeText={setPin}
                    secureTextEntry={!showPin}
                    keyboardType="numeric"
                    maxLength={6}
                    returnKeyType="next"
                    onSubmitEditing={() => confirmPinRef.current?.focus()}
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

              {/* Confirm PIN */}
              <View className="mb-6">
                <Text className="text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide">
                  Confirm PIN
                </Text>
                <View className="flex-row items-center border border-border rounded-xl px-4 py-3 bg-surface-page">
                  <Ionicons name="lock-closed-outline" size={18} color="#90A4AE" />
                  <TextInput
                    ref={confirmPinRef}
                    className="flex-1 text-base text-text-primary ml-3"
                    placeholder="Re-enter your PIN"
                    placeholderTextColor="#90A4AE"
                    value={confirmPin}
                    onChangeText={setConfirmPin}
                    secureTextEntry={!showConfirmPin}
                    keyboardType="numeric"
                    maxLength={6}
                    returnKeyType="done"
                    onSubmitEditing={handleSignUp}
                  />
                  <Pressable onPress={() => setShowConfirmPin((v) => !v)} hitSlop={8}>
                    <Ionicons
                      name={showConfirmPin ? 'eye-off-outline' : 'eye-outline'}
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

              {/* Submit */}
              <Pressable
                className={`bg-primary-500 rounded-xl py-4 items-center ${
                  loading ? 'opacity-70' : 'active:bg-primary-600'
                }`}
                onPress={handleSignUp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-bold text-base">Create Account</Text>
                )}
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
