import React, { useEffect, useRef } from 'react';
import { View, Text, Modal, Pressable, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

interface Props {
  moduleNumber: number;
  moduleTitle: string;
  chaptersCompleted: number;
  totalChapters: number;
  badgesEarnedInModule?: number;
  onClose: () => void;
}

const MODULE_COLORS = ['#2196F3', '#00BCD4', '#FF9800'];
const MODULE_GRADIENTS: Record<number, [string, string]> = {
  1: ['#42A5F5', '#1565C0'],
  2: ['#26C6DA', '#00838F'],
  3: ['#FFB74D', '#E65100'],
};
const MODULE_NOTES: Record<number, string> = {
  1: "You've mastered the basics!",
  2: "Halfway through your journey!",
  3: "You did it — the full course is yours!",
};

const { width: SCREEN_W } = Dimensions.get('window');
const CONFETTI_COUNT = 22;
const CONFETTI_COLORS = ['#FFC107', '#42A5F5', '#26C6DA', '#FFB74D', '#FFFFFF', '#A5D6A7'];

function ConfettiPiece({ delay }: { delay: number }) {
  const fall = useRef(new Animated.Value(0)).current;
  const drift = useRef(Math.random() * SCREEN_W).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]!;
  const size = 6 + Math.random() * 7;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.timing(fall, {
          toValue: 1,
          duration: 3000 + Math.random() * 1400,
          delay,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 1,
          duration: 1600 + Math.random() * 1100,
          delay,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [delay, fall, rotate]);

  const translateY = fall.interpolate({ inputRange: [0, 1], outputRange: [-40, 800] });
  const rotateZ = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: drift,
        top: 0,
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: 1,
        transform: [{ translateY }, { rotate: rotateZ }],
      }}
    />
  );
}

export default function ModuleCompleteCelebration({
  moduleNumber,
  moduleTitle,
  chaptersCompleted,
  totalChapters,
  badgesEarnedInModule = 0,
  onClose,
}: Props) {
  const trophyScale = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(40)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const soundRef = useRef<Audio.Sound | null>(null);

  const accent = MODULE_COLORS[(moduleNumber - 1) % MODULE_COLORS.length]!;
  const gradient = MODULE_GRADIENTS[moduleNumber] ?? MODULE_GRADIENTS[1]!;
  const note = MODULE_NOTES[moduleNumber] ?? 'Keep up the great work!';

  useEffect(() => {
    Animated.sequence([
      Animated.spring(trophyScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
      Animated.spring(checkScale, { toValue: 1, friction: 4, tension: 100, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(cardSlide, { toValue: 0, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]),
    ]).start();

    let cancelled = false;
    (async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('@/assets/sounds/module-complete.mp3'),
          { shouldPlay: true, volume: 1.0 },
        );
        if (cancelled) {
          await sound.unloadAsync();
          return;
        }
        soundRef.current = sound;
      } catch { /* ignore */ }
    })();

    return () => {
      cancelled = true;
      const s = soundRef.current;
      soundRef.current = null;
      if (s) s.unloadAsync().catch(() => {});
    };
  }, [trophyScale, checkScale, cardSlide, cardOpacity]);

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.88)' }}>
        {Array.from({ length: CONFETTI_COUNT }).map((_, i) => (
          <ConfettiPiece key={i} delay={i * 70} />
        ))}

        <View className="flex-1 items-center justify-center px-5">
          {/* Trophy */}
          <Animated.View
            style={{
              transform: [{ scale: trophyScale }],
              shadowColor: accent,
              shadowOpacity: 0.6,
              shadowRadius: 24,
              shadowOffset: { width: 0, height: 0 },
              elevation: 14,
            }}
          >
            <LinearGradient
              colors={gradient}
              style={{
                width: 130,
                height: 130,
                borderRadius: 65,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 4,
                borderColor: '#FFFFFF',
              }}
            >
              <Text style={{ fontSize: 64 }}>🏆</Text>
            </LinearGradient>
          </Animated.View>

          {/* Animated checkmark */}
          <Animated.View
            style={{
              marginTop: -18,
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: '#10B981',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 3,
              borderColor: '#FFFFFF',
              transform: [{ scale: checkScale }],
            }}
          >
            <Ionicons name="checkmark" size={26} color="#FFFFFF" />
          </Animated.View>

          {/* Card */}
          <Animated.View
            style={{
              opacity: cardOpacity,
              transform: [{ translateY: cardSlide }],
              marginTop: 18,
              width: '100%',
              maxWidth: 380,
            }}
          >
            <LinearGradient
              colors={gradient}
              style={{
                borderRadius: 22,
                padding: 22,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.25)',
              }}
            >
              <Text className="text-xs font-bold tracking-widest text-white/90">
                MODULE {moduleNumber} COMPLETE
              </Text>
              <Text className="text-xl font-bold text-white text-center mt-2" numberOfLines={2}>
                {moduleTitle}
              </Text>

              <View className="flex-row gap-3 mt-4">
                <View className="bg-white/15 rounded-xl px-4 py-2 items-center">
                  <Text className="text-white text-base font-bold">{chaptersCompleted}/{totalChapters}</Text>
                  <Text className="text-white/80 text-[10px] uppercase tracking-wide mt-0.5">Chapters</Text>
                </View>
                {badgesEarnedInModule > 0 && (
                  <View className="bg-white/15 rounded-xl px-4 py-2 items-center">
                    <Text className="text-white text-base font-bold">{badgesEarnedInModule}</Text>
                    <Text className="text-white/80 text-[10px] uppercase tracking-wide mt-0.5">Badges</Text>
                  </View>
                )}
              </View>

              <Text className="text-white/90 text-sm text-center mt-4 italic">{note}</Text>
            </LinearGradient>
          </Animated.View>

          <Pressable
            className="mt-6 px-12 py-3.5 rounded-full active:opacity-80"
            style={{ backgroundColor: '#FFFFFF' }}
            onPress={onClose}
          >
            <Text className="text-base font-bold" style={{ color: accent }}>Continue</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
