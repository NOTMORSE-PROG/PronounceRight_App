import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Modal, Pressable, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import type { Badge } from '@/types';

interface Props {
  badges: Badge[];
  onClose: () => void;
}

const { width: SCREEN_W } = Dimensions.get('window');
const CONFETTI_COUNT = 18;
const CONFETTI_COLORS = ['#FFC107', '#FF9800', '#F59E0B', '#FBBF24', '#FDE047', '#FFFFFF'];

function ConfettiPiece({ delay }: { delay: number }) {
  const fall = useRef(new Animated.Value(0)).current;
  const drift = useRef(Math.random() * SCREEN_W).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]!;
  const size = 6 + Math.random() * 6;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.timing(fall, {
          toValue: 1,
          duration: 2800 + Math.random() * 1200,
          delay,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 1,
          duration: 1500 + Math.random() * 1000,
          delay,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [delay, fall, rotate]);

  const translateY = fall.interpolate({ inputRange: [0, 1], outputRange: [-40, 700] });
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

function BadgeCard({ badge, onDismiss }: { badge: Badge; onDismiss: () => void }) {
  const scale = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const rayRotate = useRef(new Animated.Value(0)).current;
  const slideX = useRef(new Animated.Value(60)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
      Animated.timing(rotate, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slideX, { toValue: 0, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(fadeIn, { toValue: 1, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
    Animated.loop(
      Animated.timing(rayRotate, { toValue: 1, duration: 9000, easing: Easing.linear, useNativeDriver: true }),
    ).start();
  }, [scale, rotate, rayRotate, slideX, fadeIn]);

  const rotateZ = rotate.interpolate({ inputRange: [0, 1], outputRange: ['-25deg', '0deg'] });
  const rayZ = rayRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View className="items-center w-full" style={{ opacity: fadeIn, transform: [{ translateX: slideX }] }}>
      {/* Rotating rays behind badge */}
      <View style={{ position: 'absolute', top: 0, alignItems: 'center', justifyContent: 'center', width: 220, height: 220 }}>
        <Animated.View
          style={{
            width: 220,
            height: 220,
            borderRadius: 110,
            transform: [{ rotate: rayZ }],
          }}
        >
          <LinearGradient
            colors={['rgba(253, 224, 71, 0.55)', 'rgba(253, 224, 71, 0)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{ flex: 1, borderRadius: 110 }}
          />
        </Animated.View>
      </View>

      {/* Badge icon */}
      <Animated.View
        style={{
          width: 140,
          height: 140,
          borderRadius: 70,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 40,
          transform: [{ scale }, { rotate: rotateZ }],
          shadowColor: '#F59E0B',
          shadowOpacity: 0.6,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 0 },
          elevation: 12,
        }}
      >
        <LinearGradient
          colors={['#FCD34D', '#F59E0B', '#D97706']}
          style={{ width: 140, height: 140, borderRadius: 70, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#FFFFFF' }}
        >
          <Text style={{ fontSize: 70 }}>{badge.icon}</Text>
        </LinearGradient>
      </Animated.View>

      <Text className="text-xs font-bold tracking-widest mt-5" style={{ color: '#FBBF24' }}>
        BADGE UNLOCKED
      </Text>
      <Text className="text-2xl font-bold text-white mt-1 text-center px-4">{badge.label}</Text>
      <Text className="text-sm text-white/80 text-center mt-2 px-6 leading-5">{badge.description}</Text>
      <Text className="text-xs text-white/60 text-center mt-3 italic">You're on fire — keep it up!</Text>

      <Pressable
        className="mt-6 px-10 py-3.5 rounded-full active:opacity-80"
        style={{ backgroundColor: '#FFFFFF' }}
        onPress={onDismiss}
      >
        <Text className="text-base font-bold" style={{ color: '#D97706' }}>Awesome!</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function BadgeUnlockCelebration({ badges, onClose }: Props) {
  const [index, setIndex] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('@/assets/sounds/badge-unlock.mp3'),
          { shouldPlay: true, volume: 0.9 },
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
  }, [index]);

  function handleNext() {
    if (index < badges.length - 1) {
      setIndex((i) => i + 1);
    } else {
      onClose();
    }
  }

  if (badges.length === 0) return null;
  const current = badges[index]!;

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.85)' }}>
        {/* Confetti layer */}
        {Array.from({ length: CONFETTI_COUNT }).map((_, i) => (
          <ConfettiPiece key={i} delay={i * 80} />
        ))}

        <View className="flex-1 items-center justify-center px-6">
          <BadgeCard key={current.type} badge={current} onDismiss={handleNext} />
          {badges.length > 1 && (
            <Text className="text-xs text-white/60 mt-4">{index + 1} of {badges.length}</Text>
          )}
        </View>
      </View>
    </Modal>
  );
}
