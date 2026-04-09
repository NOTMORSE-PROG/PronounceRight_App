import React, { useEffect } from 'react';
import { View, Text, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

const { width: SCREEN_W } = Dimensions.get('window');

// Static constellation dots
const DOTS = [
  { x: 30, y: 20 }, { x: 80, y: 55 }, { x: 140, y: 15 }, { x: 200, y: 45 },
  { x: 260, y: 12 }, { x: 310, y: 50 }, { x: SCREEN_W - 40, y: 25 },
  { x: SCREEN_W - 80, y: 60 }, { x: SCREEN_W - 130, y: 18 }, { x: 60, y: 80 },
  { x: 170, y: 70 }, { x: 240, y: 85 }, { x: SCREEN_W - 60, y: 75 },
];

interface BadgesHeroProps {
  earnedCount: number;
  totalCount: number;
}

export default function BadgesHero({ earnedCount, totalCount }: BadgesHeroProps) {
  const trophyScale = useSharedValue(0.8);
  const trophyStyle = useAnimatedStyle(() => ({
    transform: [{ scale: trophyScale.value }],
  }));

  useEffect(() => {
    trophyScale.value = withSpring(1, { damping: 10, stiffness: 180 });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={{ overflow: 'hidden' }}>
      <LinearGradient
        colors={['#2D0A6B', '#6B21D4', '#FF6B35']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: 24, paddingBottom: 0, paddingHorizontal: 20, minHeight: 160 }}
      >
        {/* Constellation dots */}
        <Svg
          width={SCREEN_W}
          height={100}
          style={{ position: 'absolute', top: 0, left: 0 }}
          pointerEvents="none"
        >
          {DOTS.map((d, i) => (
            <Circle key={i} cx={d.x} cy={d.y} r={2} fill="rgba(255,255,255,0.35)" />
          ))}
        </Svg>

        {/* Center content */}
        <View style={{ alignItems: 'center', paddingBottom: 24 }}>
          {/* Glowing trophy circle */}
          <Animated.View
            style={[
              {
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: 'rgba(255,255,255,0.15)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.3)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              },
              trophyStyle,
            ]}
          >
            <Text style={{ fontSize: 34 }}>🏆</Text>
          </Animated.View>

          {/* Earned count */}
          <Text style={{ fontSize: 36, fontWeight: '900', color: '#fff', lineHeight: 40 }}>
            {earnedCount}
          </Text>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 2, fontWeight: '600' }}>
            badges earned
          </Text>

          {/* Chip pill */}
          <View
            style={{
              marginTop: 10,
              backgroundColor: 'rgba(255,255,255,0.18)',
              borderRadius: 20,
              paddingHorizontal: 14,
              paddingVertical: 5,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.25)',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>
              {earnedCount} / {totalCount} collected
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* SVG wave — transitions into dark grid zone #1A1040 */}
      <Svg width={SCREEN_W} height={36} style={{ marginTop: -1 }}>
        <Rect width={SCREEN_W} height={36} fill="#FF6B35" />
        <Path
          d={`M0,36 C${SCREEN_W * 0.3},0 ${SCREEN_W * 0.7},36 ${SCREEN_W},0 L${SCREEN_W},36 L0,36 Z`}
          fill="#1A1040"
        />
      </Svg>
    </View>
  );
}
