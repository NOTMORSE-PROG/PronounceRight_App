import React from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import FloatingOrb from './FloatingOrb';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const ORBS = [
  { size: 120, x: -30, y: 80, color: 'rgba(255,255,255,0.05)', duration: 7000 },
  { size: 90, x: SCREEN_W - 60, y: 200, color: 'rgba(0,188,212,0.07)', duration: 5500 },
  { size: 150, x: 40, y: SCREEN_H - 250, color: 'rgba(33,150,243,0.06)', duration: 6500 },
  { size: 70, x: SCREEN_W - 100, y: SCREEN_H - 180, color: 'rgba(255,152,0,0.05)', duration: 8000 },
  { size: 100, x: SCREEN_W / 2 - 50, y: -20, color: 'rgba(255,255,255,0.04)', duration: 6000 },
];

interface Props {
  children: React.ReactNode;
}

export default function AnimatedGradientBackground({ children }: Props) {
  const topOpacity = useSharedValue(0);

  useEffect(() => {
    topOpacity.value = withRepeat(
      withTiming(1, { duration: 6000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const topGradientStyle = useAnimatedStyle(() => ({
    opacity: topOpacity.value,
  }));

  return (
    <>
      {/* Base gradient layer */}
      <LinearGradient
        colors={['#0D47A1', '#1565C0', '#00BCD4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Crossfade gradient layer */}
      <Animated.View style={[StyleSheet.absoluteFillObject, topGradientStyle]}>
        <LinearGradient
          colors={['#1565C0', '#2196F3', '#0D47A1']}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {/* Floating orbs */}
      {ORBS.map((orb, i) => (
        <FloatingOrb
          key={i}
          size={orb.size}
          initialX={orb.x}
          initialY={orb.y}
          color={orb.color}
          duration={orb.duration}
        />
      ))}

      {/* Content */}
      {children}
    </>
  );
}
