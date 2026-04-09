import React, { useEffect } from 'react';
import { View, Text, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';

const { width: SCREEN_W } = Dimensions.get('window');

interface WelcomeBannerProps {
  name: string;
  streak: number;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function WelcomeBanner({ name, streak }: WelcomeBannerProps) {
  const firstName = name.split(' ')[0];
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const shimmerX = useSharedValue(-60);
  const streakScale = useSharedValue(0.7);

  useEffect(() => {
    // Streak bounce on mount
    streakScale.value = withDelay(300, withSpring(1, { damping: 10, stiffness: 200 }));

    // Shimmer sweep
    shimmerX.value = withRepeat(
      withDelay(
        4000,
        withSequence(
          withTiming(-60, { duration: 0 }),
          withTiming(SCREEN_W + 60, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        ),
      ),
      -1,
      false,
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }, { skewX: '-20deg' }],
  }));

  const streakStyle = useAnimatedStyle(() => ({
    transform: [{ scale: streakScale.value }],
  }));

  return (
    <View className="mx-4 mb-4 rounded-2xl overflow-hidden">
      <LinearGradient
        colors={['#1565C0', '#2196F3', '#00BCD4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 20, borderRadius: 16 }}
      >
        <View className="flex-row items-center justify-between">
          <View style={{ flex: 1 }}>
            <Text className="text-white text-sm opacity-90 mb-1">{getGreeting()},</Text>
            <Text className="text-white text-2xl font-bold mb-2">{firstName}!</Text>
            <Text className="text-white text-xs opacity-80">{today}</Text>
          </View>
          <Animated.View className="items-center ml-4" style={streakStyle}>
            <Text className="text-4xl">🔥</Text>
            <Text className="text-white font-bold text-lg">{streak}</Text>
            <Text className="text-white text-xs opacity-80">day streak</Text>
          </Animated.View>
        </View>

        {/* Shimmer */}
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: 50,
              backgroundColor: 'rgba(255,255,255,0.15)',
            },
            shimmerStyle,
          ]}
        />
      </LinearGradient>
    </View>
  );
}
