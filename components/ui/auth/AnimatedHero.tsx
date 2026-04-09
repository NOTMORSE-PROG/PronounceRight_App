import React, { useEffect } from 'react';
import { View, Text, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
  withRepeat,
  Easing,
} from 'react-native-reanimated';

export default function AnimatedHero() {
  // Entrance values
  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const titleY = useSharedValue(20);
  const titleOpacity = useSharedValue(0);
  const subtitleY = useSharedValue(20);
  const subtitleOpacity = useSharedValue(0);

  // Breathing values
  const breatheScale = useSharedValue(1);
  const floatY = useSharedValue(0);

  useEffect(() => {
    // Entrance animations
    logoOpacity.value = withDelay(200, withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }));
    logoScale.value = withDelay(200, withSpring(1, { damping: 12, stiffness: 100 }));

    titleOpacity.value = withDelay(500, withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }));
    titleY.value = withDelay(500, withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }));

    subtitleOpacity.value = withDelay(700, withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }));
    subtitleY.value = withDelay(700, withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }));

    // Breathing animations (start after entrance completes)
    breatheScale.value = withDelay(
      1200,
      withRepeat(withTiming(1.03, { duration: 2000, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
    floatY.value = withDelay(
      1200,
      withRepeat(withTiming(-3, { duration: 2500, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [
      { scale: logoScale.value * breatheScale.value },
      { translateY: floatY.value },
    ],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleY.value }],
  }));

  return (
    <View style={{ alignItems: 'center', marginBottom: 28 }}>
      <Animated.View style={logoStyle}>
        <Image
          source={require('@/assets/images/logo.png')}
          style={{ width: 110, height: 110 }}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View style={[{ marginTop: 16 }, titleStyle]}>
        <Text style={{ fontSize: 30, fontWeight: '800', color: '#fff', letterSpacing: -0.5 }}>
          SpeakRight
        </Text>
      </Animated.View>

      <Animated.View style={[{ marginTop: 6 }, subtitleStyle]}>
        <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', fontWeight: '500' }}>
          Speak clearly. Learn confidently.
        </Text>
      </Animated.View>
    </View>
  );
}
