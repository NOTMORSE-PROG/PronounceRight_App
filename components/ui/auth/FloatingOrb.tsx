import React from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';

interface FloatingOrbProps {
  size: number;
  initialX: number;
  initialY: number;
  color: string;
  duration: number;
}

export default function FloatingOrb({ size, initialX, initialY, color, duration }: FloatingOrbProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    const rangeX = 15 + Math.random() * 25;
    const rangeY = 15 + Math.random() * 25;

    translateX.value = withRepeat(
      withTiming(rangeX, { duration, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    translateY.value = withRepeat(
      withTiming(rangeY, { duration: duration * 1.3, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: initialX,
          top: initialY,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}
