import React, { useEffect } from 'react';
import { Pressable, Text, ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface GradientButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

const BUTTON_WIDTH = 300; // approximate, shimmer will overshoot harmlessly

export default function GradientButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
}: GradientButtonProps) {
  const scale = useSharedValue(1);
  const shimmerX = useSharedValue(-60);

  const isDisabled = disabled || loading;

  useEffect(() => {
    if (variant === 'primary' && !loading) {
      shimmerX.value = withRepeat(
        withDelay(
          3000,
          withSequence(
            withTiming(-60, { duration: 0 }),
            withTiming(BUTTON_WIDTH + 60, { duration: 800, easing: Easing.inOut(Easing.quad) }),
          ),
        ),
        -1,
        false,
      );
    }
  }, [loading, variant]); // eslint-disable-line react-hooks/exhaustive-deps

  const pressIn = () => {
    if (!isDisabled) {
      scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
    }
  };

  const pressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
  };

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }, { skewX: '-20deg' }],
  }));

  if (variant === 'secondary') {
    return (
      <Animated.View style={scaleStyle}>
        <Pressable
          onPress={onPress}
          onPressIn={pressIn}
          onPressOut={pressOut}
          disabled={isDisabled}
          style={{
            backgroundColor: '#fff',
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: 'center',
            opacity: isDisabled ? 0.5 : 1,
          }}
        >
          <Text style={{ color: '#1E88E5', fontWeight: '700', fontSize: 15 }}>
            {label}
          </Text>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={scaleStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={isDisabled}
        style={{ borderRadius: 14, overflow: 'hidden', opacity: isDisabled ? 0.7 : 1 }}
      >
        <LinearGradient
          colors={['#2196F3', '#1565C0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            paddingVertical: 16,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 14,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
              {label}
            </Text>
          )}

          {/* Shimmer overlay */}
          {!loading && (
            <Animated.View
              pointerEvents="none"
              style={[
                {
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  width: 40,
                  backgroundColor: 'rgba(255,255,255,0.18)',
                },
                shimmerStyle,
              ]}
            />
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}
