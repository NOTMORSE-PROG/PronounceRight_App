import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const MODULE_COLORS = ['#2196F3', '#26C6DA', '#FFA726'];
const MODULE_LABELS = ['Module 1', 'Module 2', 'Module 3'];

const RING_SIZE = 72;
const STROKE_WIDTH = 6;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface RingProps {
  progress: number;
  color: string;
  label: string;
  index: number;
}

function ProgressRing({ progress, color, label, index }: RingProps) {
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(progress / 100, {
      duration: 900 + index * 200,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]); // eslint-disable-line react-hooks/exhaustive-deps

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - animatedProgress.value),
  }));

  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      {/* Fixed-size container for ring + centered % overlay */}
      <View style={{ width: RING_SIZE, height: RING_SIZE }}>
        <Svg width={RING_SIZE} height={RING_SIZE} style={{ transform: [{ rotate: '-90deg' }] }}>
          {/* Background track */}
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          {/* Progress arc */}
          <AnimatedCircle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            stroke={color}
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            animatedProps={animatedProps}
            strokeLinecap="round"
          />
        </Svg>
        {/* Percentage label — overlaid only over the ring */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff' }}>{progress}%</Text>
        </View>
      </View>
      <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 6, textAlign: 'center' }}>
        {label}
      </Text>
    </View>
  );
}

function getContextualMessage(progresses: number[]): string {
  const avg = progresses.reduce((a, b) => a + b, 0) / progresses.length;
  if (avg === 0) return 'Start your first module to begin!';
  if (avg < 30) return 'Great start — keep going!';
  if (avg < 70) return 'You\'re making solid progress!';
  if (avg < 100) return 'Almost there — finish strong!';
  return 'All modules complete! 🎉';
}

interface OverallProgressCardProps {
  progresses: number[];
}

export default function OverallProgressCard({ progresses }: OverallProgressCardProps) {
  const message = getContextualMessage(progresses);

  return (
    <LinearGradient
      colors={['#0D1B3E', '#1A2B6B']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ borderRadius: 20, marginHorizontal: 16, marginBottom: 4, padding: 20 }}
    >
      <Text
        style={{
          fontSize: 10,
          fontWeight: '700',
          color: 'rgba(255,255,255,0.55)',
          textTransform: 'uppercase',
          letterSpacing: 1.5,
          marginBottom: 16,
        }}
      >
        Your Journey
      </Text>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {progresses.map((p, i) => (
          <ProgressRing
            key={i}
            progress={p}
            color={MODULE_COLORS[i] ?? '#2196F3'}
            label={MODULE_LABELS[i] ?? `Module ${i + 1}`}
            index={i}
          />
        ))}
      </View>

      <View
        style={{
          marginTop: 16,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.1)',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', flex: 1 }}>{message}</Text>
      </View>
    </LinearGradient>
  );
}
