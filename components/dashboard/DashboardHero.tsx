import React, { useEffect } from 'react';
import { View, Text, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import FloatingOrb from '@/components/ui/auth/FloatingOrb';

const { width: SCREEN_W } = Dimensions.get('window');

interface DashboardHeroProps {
  firstName: string;
  streak: number;
}

export default function DashboardHero({ firstName, streak }: DashboardHeroProps) {
  const streakScale = useSharedValue(0.8);
  const streakStyle = useAnimatedStyle(() => ({
    transform: [{ scale: streakScale.value }],
  }));

  useEffect(() => {
    streakScale.value = withSpring(1, { damping: 10, stiffness: 180 });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={{ overflow: 'hidden' }}>
      <LinearGradient
        colors={['#0D47A1', '#1565C0', '#2196F3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: 16, paddingBottom: 0, paddingHorizontal: 20, minHeight: 120 }}
      >
        {/* Floating orbs */}
        <FloatingOrb size={80} initialX={SCREEN_W * 0.6} initialY={-20} color="rgba(255,255,255,0.06)" duration={4200} />
        <FloatingOrb size={50} initialX={SCREEN_W * 0.1} initialY={10} color="rgba(255,255,255,0.08)" duration={3600} />
        <FloatingOrb size={100} initialX={SCREEN_W * 0.7} initialY={30} color="rgba(33,150,243,0.25)" duration={5000} />

        {/* Content row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20 }}>
          {/* Logo + app name */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Image
              source={require('@/assets/images/logo.png')}
              style={{ width: 36, height: 36 }}
              resizeMode="contain"
            />
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#fff' }}>SpeakRight</Text>
          </View>

          {/* Greeting + streak */}
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.9)' }}>
              Hi, {firstName}! 👋
            </Text>
            {streak > 0 && (
              <Animated.View
                style={[
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    backgroundColor: 'rgba(255,255,255,0.18)',
                    borderRadius: 20,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.25)',
                  },
                  streakStyle,
                ]}
              >
                <Text style={{ fontSize: 13 }}>🔥</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>
                  {streak} day streak
                </Text>
              </Animated.View>
            )}
          </View>
        </View>
      </LinearGradient>

      {/* SVG wave — transitions into dark zone #0D1B3E */}
      <Svg width={SCREEN_W} height={32} style={{ marginTop: -1 }}>
        <Rect width={SCREEN_W} height={32} fill="#2196F3" />
        <Path
          d={`M0,32 C${SCREEN_W * 0.3},0 ${SCREEN_W * 0.7},32 ${SCREEN_W},0 L${SCREEN_W},32 L0,32 Z`}
          fill="#0D1B3E"
        />
      </Svg>
    </View>
  );
}
