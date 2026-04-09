import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
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
import { loginStudent } from '@/lib/auth-service';
import AnimatedGradientBackground from '@/components/ui/auth/AnimatedGradientBackground';
import AnimatedHero from '@/components/ui/auth/AnimatedHero';
import AnimatedInput from '@/components/ui/auth/AnimatedInput';
import GradientButton from '@/components/ui/auth/GradientButton';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pinRef = useRef<TextInput>(null);
  const { setAuth, hasSeenOnboarding } = useAuthStore();

  // Staggered entrance animations
  const cardOpacity = useSharedValue(0);
  const cardY = useSharedValue(30);
  const welcomeOpacity = useSharedValue(0);
  const welcomeY = useSharedValue(15);
  const input1Opacity = useSharedValue(0);
  const input1Y = useSharedValue(15);
  const input2Opacity = useSharedValue(0);
  const input2Y = useSharedValue(15);
  const btn1Opacity = useSharedValue(0);
  const btn1Y = useSharedValue(15);
  const dividerOpacity = useSharedValue(0);
  const btn2Opacity = useSharedValue(0);
  const btn2Y = useSharedValue(15);
  const footerOpacity = useSharedValue(0);

  // Error shake
  const errorShakeX = useSharedValue(0);
  const errorOpacity = useSharedValue(0);

  useEffect(() => {
    const ease = Easing.out(Easing.cubic);
    const dur = 350;

    // Card entrance
    cardOpacity.value = withDelay(400, withTiming(1, { duration: 450, easing: ease }));
    cardY.value = withDelay(400, withTiming(0, { duration: 450, easing: ease }));

    // Card content stagger
    welcomeOpacity.value = withDelay(600, withTiming(1, { duration: dur, easing: ease }));
    welcomeY.value = withDelay(600, withTiming(0, { duration: dur, easing: ease }));

    input1Opacity.value = withDelay(680, withTiming(1, { duration: dur, easing: ease }));
    input1Y.value = withDelay(680, withTiming(0, { duration: dur, easing: ease }));

    input2Opacity.value = withDelay(760, withTiming(1, { duration: dur, easing: ease }));
    input2Y.value = withDelay(760, withTiming(0, { duration: dur, easing: ease }));

    btn1Opacity.value = withDelay(840, withTiming(1, { duration: dur, easing: ease }));
    btn1Y.value = withDelay(840, withTiming(0, { duration: dur, easing: ease }));

    dividerOpacity.value = withDelay(900, withTiming(1, { duration: dur, easing: ease }));

    btn2Opacity.value = withDelay(920, withTiming(1, { duration: dur, easing: ease }));
    btn2Y.value = withDelay(920, withTiming(0, { duration: dur, easing: ease }));

    footerOpacity.value = withDelay(1000, withTiming(1, { duration: dur, easing: ease }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Trigger error shake when error changes
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

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardY.value }],
  }));
  const welcomeStyle = useAnimatedStyle(() => ({
    opacity: welcomeOpacity.value,
    transform: [{ translateY: welcomeY.value }],
  }));
  const input1Style = useAnimatedStyle(() => ({
    opacity: input1Opacity.value,
    transform: [{ translateY: input1Y.value }],
  }));
  const input2Style = useAnimatedStyle(() => ({
    opacity: input2Opacity.value,
    transform: [{ translateY: input2Y.value }],
  }));
  const btn1Style = useAnimatedStyle(() => ({
    opacity: btn1Opacity.value,
    transform: [{ translateY: btn1Y.value }],
  }));
  const dividerStyle = useAnimatedStyle(() => ({
    opacity: dividerOpacity.value,
  }));
  const btn2Style = useAnimatedStyle(() => ({
    opacity: btn2Opacity.value,
    transform: [{ translateY: btn2Y.value }],
  }));
  const footerStyle = useAnimatedStyle(() => ({
    opacity: footerOpacity.value,
  }));
  const errorStyle = useAnimatedStyle(() => ({
    opacity: errorOpacity.value,
    transform: [{ translateX: errorShakeX.value }],
  }));

  async function handleLogin() {
    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      setError('Please enter your username.');
      return;
    }
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await loginStudent(trimmedUsername, pin);

      if ('error' in result) {
        setError('Incorrect username or PIN. Please try again.');
        setLoading(false);
        return;
      }

      await setAuth(result.user);
      setLoading(false);

      if (hasSeenOnboarding) {
        router.replace('/(student)/dashboard');
      } else {
        router.replace('/(auth)/onboarding');
      }
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
              <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 40, paddingBottom: 24 }}>

                {/* Animated Logo + Title */}
                <AnimatedHero />

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
                  {/* Welcome Text */}
                  <Animated.View style={welcomeStyle}>
                    <Text style={{ fontSize: 22, fontWeight: '700', color: '#1A237E', marginBottom: 4 }}>
                      Welcome back!
                    </Text>
                    <Text style={{ fontSize: 14, color: '#546E7A', marginBottom: 24 }}>
                      Log in with your username and PIN.
                    </Text>
                  </Animated.View>

                  {/* Username Input */}
                  <Animated.View style={input1Style}>
                    <AnimatedInput
                      label="Username"
                      icon="person-outline"
                      value={username}
                      onChangeText={setUsername}
                      placeholder="Enter your username"
                      autoCapitalize="none"
                      returnKeyType="next"
                      onSubmitEditing={() => pinRef.current?.focus()}
                    />
                  </Animated.View>

                  {/* PIN Input */}
                  <Animated.View style={input2Style}>
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
                      returnKeyType="done"
                      onSubmitEditing={handleLogin}
                      inputRef={pinRef}
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

                  {/* Login Button */}
                  <Animated.View style={btn1Style}>
                    <GradientButton
                      label="Log In"
                      onPress={handleLogin}
                      loading={loading}
                    />
                  </Animated.View>

                  {/* Divider */}
                  <Animated.View
                    style={[
                      { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
                      dividerStyle,
                    ]}
                  >
                    <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(187,222,251,0.5)' }} />
                    <Text style={{ marginHorizontal: 12, fontSize: 12, color: '#90A4AE' }}>or</Text>
                    <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(187,222,251,0.5)' }} />
                  </Animated.View>

                  {/* Create Account Button */}
                  <Animated.View style={btn2Style}>
                    <GradientButton
                      label="Create Account"
                      variant="secondary"
                      onPress={() => router.push('/(auth)/signup')}
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
