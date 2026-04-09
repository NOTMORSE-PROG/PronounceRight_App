import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useAuthStore } from '@/stores/auth';
import { registerStudent } from '@/lib/auth-service';
import AnimatedGradientBackground from '@/components/ui/auth/AnimatedGradientBackground';
import AnimatedInput from '@/components/ui/auth/AnimatedInput';
import GradientButton from '@/components/ui/auth/GradientButton';

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

  // Staggered entrance animations
  const backOpacity = useSharedValue(0);
  const backX = useSharedValue(-15);
  const headingOpacity = useSharedValue(0);
  const headingY = useSharedValue(15);
  const cardOpacity = useSharedValue(0);
  const cardY = useSharedValue(30);
  const input1Opacity = useSharedValue(0);
  const input1Y = useSharedValue(15);
  const input2Opacity = useSharedValue(0);
  const input2Y = useSharedValue(15);
  const input3Opacity = useSharedValue(0);
  const input3Y = useSharedValue(15);
  const input4Opacity = useSharedValue(0);
  const input4Y = useSharedValue(15);
  const btnOpacity = useSharedValue(0);
  const btnY = useSharedValue(15);
  const footerOpacity = useSharedValue(0);

  // Error shake
  const errorShakeX = useSharedValue(0);
  const errorOpacity = useSharedValue(0);

  useEffect(() => {
    const ease = Easing.out(Easing.cubic);
    const dur = 350;

    // Back button entrance (from left)
    backOpacity.value = withDelay(200, withTiming(1, { duration: 300, easing: ease }));
    backX.value = withDelay(200, withTiming(0, { duration: 300, easing: ease }));

    // Heading
    headingOpacity.value = withDelay(300, withTiming(1, { duration: dur, easing: ease }));
    headingY.value = withDelay(300, withTiming(0, { duration: dur, easing: ease }));

    // Card entrance
    cardOpacity.value = withDelay(450, withTiming(1, { duration: 450, easing: ease }));
    cardY.value = withDelay(450, withTiming(0, { duration: 450, easing: ease }));

    // Input stagger (tighter intervals for 4 fields)
    input1Opacity.value = withDelay(600, withTiming(1, { duration: dur, easing: ease }));
    input1Y.value = withDelay(600, withTiming(0, { duration: dur, easing: ease }));

    input2Opacity.value = withDelay(670, withTiming(1, { duration: dur, easing: ease }));
    input2Y.value = withDelay(670, withTiming(0, { duration: dur, easing: ease }));

    input3Opacity.value = withDelay(740, withTiming(1, { duration: dur, easing: ease }));
    input3Y.value = withDelay(740, withTiming(0, { duration: dur, easing: ease }));

    input4Opacity.value = withDelay(810, withTiming(1, { duration: dur, easing: ease }));
    input4Y.value = withDelay(810, withTiming(0, { duration: dur, easing: ease }));

    btnOpacity.value = withDelay(880, withTiming(1, { duration: dur, easing: ease }));
    btnY.value = withDelay(880, withTiming(0, { duration: dur, easing: ease }));

    footerOpacity.value = withDelay(950, withTiming(1, { duration: dur, easing: ease }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Trigger error shake
  useEffect(() => {
    if (error) {
      errorOpacity.value = withTiming(1, { duration: 200 });
      errorShakeX.value = withSequence(
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(-6, { duration: 50 }),
        withTiming(6, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
    } else {
      errorOpacity.value = withTiming(0, { duration: 150 });
    }
  }, [error]); // eslint-disable-line react-hooks/exhaustive-deps

  const backStyle = useAnimatedStyle(() => ({
    opacity: backOpacity.value,
    transform: [{ translateX: backX.value }],
  }));
  const headingStyle = useAnimatedStyle(() => ({
    opacity: headingOpacity.value,
    transform: [{ translateY: headingY.value }],
  }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardY.value }],
  }));
  const input1Style = useAnimatedStyle(() => ({
    opacity: input1Opacity.value,
    transform: [{ translateY: input1Y.value }],
  }));
  const input2Style = useAnimatedStyle(() => ({
    opacity: input2Opacity.value,
    transform: [{ translateY: input2Y.value }],
  }));
  const input3Style = useAnimatedStyle(() => ({
    opacity: input3Opacity.value,
    transform: [{ translateY: input3Y.value }],
  }));
  const input4Style = useAnimatedStyle(() => ({
    opacity: input4Opacity.value,
    transform: [{ translateY: input4Y.value }],
  }));
  const btnStyle = useAnimatedStyle(() => ({
    opacity: btnOpacity.value,
    transform: [{ translateY: btnY.value }],
  }));
  const footerStyle = useAnimatedStyle(() => ({
    opacity: footerOpacity.value,
  }));
  const errorStyle = useAnimatedStyle(() => ({
    opacity: errorOpacity.value,
    transform: [{ translateX: errorShakeX.value }],
  }));

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
          setError('Username must be 3-20 characters: letters, numbers, and underscores only.');
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
    <View style={{ flex: 1 }}>
      <AnimatedGradientBackground>
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 }}>

                {/* Back Button */}
                <Animated.View style={backStyle}>
                  <Pressable
                    style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingVertical: 4 }}
                    onPress={() => router.back()}
                    hitSlop={8}
                  >
                    <Ionicons name="arrow-back" size={22} color="rgba(255,255,255,0.9)" />
                    <Text style={{ color: 'rgba(255,255,255,0.9)', fontWeight: '500', fontSize: 14, marginLeft: 6 }}>
                      Back to Login
                    </Text>
                  </Pressable>
                </Animated.View>

                {/* Heading */}
                <Animated.View style={[{ marginBottom: 24 }, headingStyle]}>
                  <Text style={{ fontSize: 30, fontWeight: '800', color: '#fff', letterSpacing: -0.5 }}>
                    Create Account
                  </Text>
                  <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 6, fontWeight: '500' }}>
                    Set up your student profile to get started.
                  </Text>
                </Animated.View>

                {/* Glass Card */}
                <Animated.View
                  style={[
                    {
                      backgroundColor: 'rgba(255,255,255,0.88)',
                      borderRadius: 24,
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.3)',
                      paddingHorizontal: 24,
                      paddingVertical: 28,
                      shadowColor: '#0D47A1',
                      shadowOpacity: 0.15,
                      shadowRadius: 24,
                      shadowOffset: { width: 0, height: 8 },
                      elevation: 8,
                    },
                    cardStyle,
                  ]}
                >
                  {/* Full Name Input */}
                  <Animated.View style={input1Style}>
                    <AnimatedInput
                      label="Full Name"
                      icon="person-outline"
                      value={fullName}
                      onChangeText={setFullName}
                      placeholder="e.g. Juan dela Cruz"
                      autoCapitalize="words"
                      returnKeyType="next"
                      onSubmitEditing={() => usernameRef.current?.focus()}
                    />
                  </Animated.View>

                  {/* Username Input */}
                  <Animated.View style={input2Style}>
                    <AnimatedInput
                      label="Username"
                      icon="at-outline"
                      value={username}
                      onChangeText={setUsername}
                      placeholder="e.g. juan_delacruz"
                      autoCapitalize="none"
                      returnKeyType="next"
                      onSubmitEditing={() => pinRef.current?.focus()}
                      inputRef={usernameRef}
                      hint="Letters, numbers, and underscores only (3-20 characters)"
                    />
                  </Animated.View>

                  {/* PIN Input */}
                  <Animated.View style={input3Style}>
                    <AnimatedInput
                      label="PIN"
                      icon="lock-closed-outline"
                      value={pin}
                      onChangeText={setPin}
                      placeholder="4-6 digit PIN"
                      secureTextEntry={!showPin}
                      onToggleSecure={() => setShowPin((v) => !v)}
                      showSecure={showPin}
                      keyboardType="numeric"
                      maxLength={6}
                      returnKeyType="next"
                      onSubmitEditing={() => confirmPinRef.current?.focus()}
                      inputRef={pinRef}
                    />
                  </Animated.View>

                  {/* Confirm PIN Input */}
                  <Animated.View style={input4Style}>
                    <AnimatedInput
                      label="Confirm PIN"
                      icon="lock-closed-outline"
                      value={confirmPin}
                      onChangeText={setConfirmPin}
                      placeholder="Re-enter your PIN"
                      secureTextEntry={!showConfirmPin}
                      onToggleSecure={() => setShowConfirmPin((v) => !v)}
                      showSecure={showConfirmPin}
                      keyboardType="numeric"
                      maxLength={6}
                      returnKeyType="done"
                      onSubmitEditing={handleSignUp}
                      inputRef={confirmPinRef}
                    />
                  </Animated.View>

                  {/* Error Banner */}
                  {error ? (
                    <Animated.View
                      style={[
                        {
                          backgroundColor: '#FEE2E2',
                          borderRadius: 12,
                          padding: 12,
                          marginBottom: 16,
                          flexDirection: 'row',
                          alignItems: 'center',
                        },
                        errorStyle,
                      ]}
                    >
                      <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
                      <Text style={{ fontSize: 13, color: '#EF4444', marginLeft: 8, flex: 1 }}>
                        {error}
                      </Text>
                    </Animated.View>
                  ) : null}

                  {/* Submit Button */}
                  <Animated.View style={btnStyle}>
                    <GradientButton
                      label="Create Account"
                      onPress={handleSignUp}
                      loading={loading}
                    />
                  </Animated.View>
                </Animated.View>

                {/* Footer */}
                <Animated.View style={[{ marginTop: 24 }, footerStyle]}>
                  <Text style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                    SpeakRight · Grade 10 Pronunciation App
                  </Text>
                </Animated.View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </AnimatedGradientBackground>
    </View>
  );
}
