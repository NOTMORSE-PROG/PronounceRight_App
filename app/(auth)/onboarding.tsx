import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  Dimensions,
  ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/stores/auth';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Slide {
  id: string;
  icon: string;
  heading: string;
  body: string;
  visual: React.ReactNode;
  gradientColors: [string, string];
}

function ModuleChips() {
  const chips = [
    { label: 'Word-Level', color: '#2196F3' },
    { label: 'Sentence-Level', color: '#00BCD4' },
    { label: 'Guided Speaking', color: '#FF9800' },
  ];
  return (
    <View className="flex-row flex-wrap gap-2 justify-center mt-4">
      {chips.map((c) => (
        <View key={c.label} className="rounded-full px-4 py-2" style={{ backgroundColor: c.color + '20' }}>
          <Text className="text-sm font-semibold" style={{ color: c.color }}>
            {c.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

function FeedbackPreview() {
  const words = [
    { text: 'Hello', color: '#10B981' },
    { text: 'world,', color: '#10B981' },
    { text: 'this', color: '#FF9800' },
    { text: 'is', color: '#10B981' },
    { text: 'a', color: '#EF4444' },
    { text: 'test.', color: '#10B981' },
  ];
  return (
    <View className="bg-white rounded-xl p-4 mt-4 border border-border">
      <Text className="text-xs text-text-muted mb-2 font-medium">Sample feedback:</Text>
      <View className="flex-row flex-wrap gap-1.5">
        {words.map((w, i) => (
          <View key={i} className="rounded-md px-2 py-1" style={{ backgroundColor: w.color + '20' }}>
            <Text className="text-sm font-semibold" style={{ color: w.color }}>
              {w.text}
            </Text>
          </View>
        ))}
      </View>
      <View className="flex-row gap-3 mt-3">
        {[
          { color: '#10B981', label: 'Correct' },
          { color: '#FF9800', label: 'Tone' },
          { color: '#EF4444', label: 'Missed' },
        ].map((l) => (
          <View key={l.label} className="flex-row items-center gap-1">
            <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />
            <Text className="text-xs text-text-muted">{l.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function BadgePreview() {
  const badges = ['🎤', '⭐', '🔥', '🏆', '💎'];
  return (
    <View className="flex-row justify-center gap-3 mt-4">
      {badges.map((icon, i) => (
        <View
          key={i}
          className="w-14 h-14 bg-primary-50 rounded-full items-center justify-center border border-primary-100"
        >
          <Text style={{ fontSize: 26 }}>{icon}</Text>
        </View>
      ))}
    </View>
  );
}

const SLIDES: Slide[] = [
  {
    id: 'welcome',
    icon: '👋',
    heading: 'Welcome to SpeakRight!',
    body: 'Your personal pronunciation coach — available anytime, anywhere, even offline.',
    visual: (
      <View className="items-center mt-4">
        <Image
          source={require('@/assets/images/logo.png')}
          style={{ width: 100, height: 100 }}
          resizeMode="contain"
        />
      </View>
    ),
    gradientColors: ['#E3F2FD', '#F0F7FF'],
  },
  {
    id: 'modules',
    icon: '📚',
    heading: '3 Modules. 9 Chapters.',
    body: 'Progress from individual sounds all the way to confident, natural spoken English.',
    visual: <ModuleChips />,
    gradientColors: ['#E3F2FD', '#F0F7FF'],
  },
  {
    id: 'record',
    icon: '🎤',
    heading: 'Speak. Listen. Improve.',
    body: 'Record your voice, get instant color-coded feedback on every word, and watch your accuracy climb.',
    visual: <FeedbackPreview />,
    gradientColors: ['#E3F2FD', '#F0F7FF'],
  },
  {
    id: 'rewards',
    icon: '🏆',
    heading: 'Badges, Streaks & More',
    body: 'Keep daily streaks alive and unlock 11 achievement badges as you improve your pronunciation.',
    visual: <BadgePreview />,
    gradientColors: ['#E3F2FD', '#F0F7FF'],
  },
];

export default function OnboardingScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const setOnboardingComplete = useAuthStore((s) => s.setOnboardingComplete);

  function goToSlide(index: number) {
    flatListRef.current?.scrollToIndex({ index, animated: true });
    setActiveIndex(index);
  }

  async function handleFinish() {
    await setOnboardingComplete();
    router.replace('/(student)/dashboard');
  }

  function handleSkip() {
    handleFinish();
  }

  async function handleNext() {
    if (activeIndex < SLIDES.length - 1) {
      goToSlide(activeIndex + 1);
    } else {
      await handleFinish();
    }
  }

  const isLast = activeIndex === SLIDES.length - 1;

  const renderSlide = ({ item }: ListRenderItemInfo<Slide>) => (
    <View style={{ width: SCREEN_WIDTH }} className="px-6 pt-4 pb-2">
      <LinearGradient
        colors={item.gradientColors}
        style={{ borderRadius: 24, padding: 28, flex: 0 }}
      >
        {/* Icon */}
        <View className="items-center mb-3">
          <Text style={{ fontSize: 52 }}>{item.icon}</Text>
        </View>

        {/* Heading */}
        <Text className="text-2xl font-bold text-text-primary text-center mb-3">
          {item.heading}
        </Text>

        {/* Body */}
        <Text className="text-base text-text-secondary text-center leading-relaxed">
          {item.body}
        </Text>

        {/* Visual */}
        {item.visual}
      </LinearGradient>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-surface-page" edges={['top', 'bottom']}>

      {/* Skip button */}
      <View className="flex-row justify-end px-5 pt-2 pb-1">
        <Pressable onPress={handleSkip} hitSlop={8} className="py-2 px-3">
          <Text className="text-sm text-text-muted font-medium">Skip</Text>
        </Pressable>
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(s) => s.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={true}
        renderItem={renderSlide}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setActiveIndex(index);
        }}
        style={{ flexGrow: 0 }}
      />

      {/* Bottom area */}
      <View className="flex-1 px-6 pt-6 pb-2 justify-between">

        {/* Dot indicators */}
        <View className="flex-row justify-center gap-2 mb-6">
          {SLIDES.map((_, i) => (
            <Pressable key={i} onPress={() => goToSlide(i)} hitSlop={6}>
              <View
                className={`rounded-full transition-all ${
                  i === activeIndex ? 'w-6 h-2.5 bg-primary-500' : 'w-2.5 h-2.5 bg-primary-200'
                }`}
              />
            </Pressable>
          ))}
        </View>

        {/* CTA button */}
        <Pressable
          className="bg-primary-500 rounded-2xl py-4 items-center active:bg-primary-600 mb-2"
          onPress={handleNext}
        >
          <Text className="text-white font-bold text-base">
            {isLast ? 'Get Started 🚀' : 'Next →'}
          </Text>
        </Pressable>

        {/* Step count */}
        <Text className="text-center text-xs text-text-muted mt-1">
          {activeIndex + 1} of {SLIDES.length}
        </Text>
      </View>

    </SafeAreaView>
  );
}
