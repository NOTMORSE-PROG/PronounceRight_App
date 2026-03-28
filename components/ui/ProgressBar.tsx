import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface ProgressBarProps {
  progress: number;      // 0–100
  height?: number;
  showLabel?: boolean;
  color?: string;
  trackColor?: string;
}

export default function ProgressBar({
  progress,
  height = 8,
  showLabel = false,
  color = '#2196F3',
  trackColor = '#BBDEFB',
}: ProgressBarProps) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(Math.min(Math.max(progress, 0), 100), {
      duration: 600,
      easing: Easing.out(Easing.quad),
    });
  }, [progress, width]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <View>
      <View
        style={{ height, backgroundColor: trackColor, borderRadius: height / 2, overflow: 'hidden' }}
      >
        <Animated.View
          style={[
            { height, backgroundColor: color, borderRadius: height / 2 },
            animatedStyle,
          ]}
        />
      </View>
      {showLabel && (
        <Text className="text-xs text-text-muted mt-1 text-right">{Math.round(progress)}%</Text>
      )}
    </View>
  );
}
