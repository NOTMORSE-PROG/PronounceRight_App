import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Animated,
  Linking,
  ImageBackground,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { useWhisperModel } from '@/lib/engine/use-whisper-model';
import { transcribeFreeSpeech } from '@/lib/engine/transcribe';
import { scorePickAndSpeak } from '@/lib/engine/pick-and-speak-scorer';
import type { PickAndSpeakResult } from '@/lib/engine/pick-and-speak-scorer';
import { keepRecording } from '@/lib/recordings-service';
import { WHISPER_RECORDING_OPTIONS } from '@/lib/recording-options';
import { useProgressStore } from '@/stores/progress';
import { useAuthStore } from '@/stores/auth';

// ─── Config ───────────────────────────────────────────────────────────────────

const ACCENT_COLOR = '#FF9800';
const SENTENCE_TARGET = { min: 5, max: 12 };
const PASS_THRESHOLD = 60;

// ─── Cue cards ────────────────────────────────────────────────────────────────

interface CueCard {
  id: string;
  topic: string;
  question: string;
  bullets: string[];
  backgroundImage?: number; // result of require() for a local asset
}

const CUE_CARDS: CueCard[] = [
  {
    id: 'card_a',
    topic: 'A person who influenced you',
    question: 'Describe a person who has had a great influence on your life.',
    bullets: [
      'Who this person is',
      'How you know them',
      'What they have done for you',
      'Why they have been so influential',
    ],
    backgroundImage: require('../../../assets/images/final-assessment/card-1.png'),
  },
  {
    id: 'card_b',
    topic: 'An interesting place',
    question: 'Describe an interesting place you have visited.',
    bullets: [
      'Where this place is',
      'When you visited it',
      'What you did there',
      'Why you found it interesting',
    ],
    backgroundImage: require('../../../assets/images/final-assessment/card-2.png'),
  },
  {
    id: 'card_c',
    topic: 'A hobby or activity',
    question: 'Describe something you enjoy doing in your free time.',
    bullets: [
      'What the activity is',
      'When and how often you do it',
      'Who you do it with',
      'Why you enjoy it',
    ],
    backgroundImage: require('../../../assets/images/final-assessment/card-3.png'),
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'intro' | 'prep' | 'recording' | 'assessing' | 'results';

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function FinalAssessmentScreen() {
  const modelState = useWhisperModel();
  const { saveFinalAssessmentResult } = useProgressStore();
  const student = useAuthStore((s) => s.user);

  const [phase, setPhase] = useState<Phase>('intro');
  const [selectedCard, setSelectedCard] = useState<CueCard | null>(null);
  const [prepSeconds, setPrepSeconds] = useState(60);
  const [result, setResult] = useState<PickAndSpeakResult | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [playingBack, setPlayingBack] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Permission + cleanup
  useEffect(() => {
    Audio.requestPermissionsAsync().then(({ granted }) => setPermissionGranted(granted));
    return () => {
      recordingRef.current?.stopAndUnloadAsync();
      soundRef.current?.unloadAsync();
    };
  }, []);

  // Prep countdown
  useEffect(() => {
    if (phase !== 'prep') return;
    if (prepSeconds <= 0) {
      handleStartRecording();
      return;
    }
    const id = setInterval(() => setPrepSeconds((s) => s - 1), 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, prepSeconds]);

  const handleCardSelect = useCallback((card: CueCard) => {
    setSelectedCard(card);
    setPrepSeconds(60);
    setPhase('prep');
  }, []);

  const handleStartRecording = useCallback(async () => {
    const ctx = modelState.status === 'ready' ? modelState.ctx : null;
    if (!ctx) {
      // No model — skip to results with a default pass
      setResult(null);
      setPhase('results');
      return;
    }
    try {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(WHISPER_RECORDING_OPTIONS);
      recordingRef.current = recording;
    } catch {
      // Recording setup failed — proceed anyway, will handle on stop
    }
    setPhase('recording');
  }, [modelState]);

  const handleStopRecording = useCallback(async () => {
    setPhase('assessing');

    let uri: string | null = null;
    try {
      await recordingRef.current?.stopAndUnloadAsync();
      uri = recordingRef.current?.getURI() ?? null;
      recordingRef.current = null;
    } catch {
      recordingRef.current = null;
    }

    const ctx = modelState.status === 'ready' ? modelState.ctx : null;
    const vadCtx = modelState.status === 'ready' ? modelState.vadCtx : null;

    if (!uri || !ctx) {
      setResult({
        transcript: '',
        noSpeech: true,
        expressionsFound: [],
        sentenceCount: 0,
        wordCount: 0,
        wpm: 0,
        pronunciationConfidence: 0,
        expressionScore: 0,
        sentenceScore: 0,
        fluencyScore: 0,
        detailScore: 0,
        pronunciationScore: 0,
        totalScore: 0,
        passed: false,
        feedback: ['No speech detected — please try again.'],
      });
      setPhase('results');
      return;
    }

    // Persist recording
    let savedUri = uri;
    if (student?.id) {
      try {
        savedUri = await keepRecording(student.id, 'final-assessment', 0, uri);
      } catch {
        savedUri = uri;
      }
    }
    setRecordingUri(savedUri);

    const transcription = await transcribeFreeSpeech(ctx, savedUri, vadCtx);
    const scored = scorePickAndSpeak(transcription, SENTENCE_TARGET, PASS_THRESHOLD);
    setResult(scored);
    setPhase('results');
  }, [modelState, student]);

  const handlePlayback = useCallback(async () => {
    if (!recordingUri) return;
    if (playingBack) {
      await soundRef.current?.stopAsync();
      setPlayingBack(false);
      return;
    }
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync({ uri: recordingUri });
      soundRef.current = sound;
      setPlayingBack(true);
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((s) => {
        if (s.isLoaded && s.didJustFinish) setPlayingBack(false);
      });
    } catch {
      setPlayingBack(false);
    }
  }, [recordingUri, playingBack]);

  const handleRetry = useCallback(() => {
    soundRef.current?.unloadAsync().then(() => { soundRef.current = null; });
    setPlayingBack(false);
    setRecordingUri(null);
    setResult(null);
    setSelectedCard(null);
    setPrepSeconds(60);
    setPhase('intro');
  }, []);

  const handleFinish = useCallback(() => {
    const score = result?.totalScore ?? 0;
    const passed = result?.passed ?? false;
    saveFinalAssessmentResult(score, passed);
    router.replace('/(student)/modules');
  }, [result, saveFinalAssessmentResult]);

  // ─── Permission denied ─────────────────────────────────────────────────────

  if (permissionGranted === false) {
    return (
      <SafeAreaView className="flex-1 bg-surface-page" edges={['top']}>
        <ScreenHeader title="Final Assessment" showBack />
        <View className="flex-1 items-center justify-center px-6 gap-4">
          <Ionicons name="mic-off-outline" size={48} color="#90A4AE" />
          <Text className="text-base font-semibold text-text-primary text-center">
            Microphone access required
          </Text>
          <Text className="text-sm text-text-secondary text-center">
            Please allow microphone access to complete the final assessment.
          </Text>
          <Pressable
            className="rounded-xl px-6 py-3 active:opacity-70"
            style={{ backgroundColor: ACCENT_COLOR }}
            onPress={() => Linking.openSettings()}
          >
            <Text className="text-white font-semibold">Open Settings</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-page" edges={['top']}>
      <ScreenHeader title="Final Assessment" showBack />

      {/* Model loading banner */}
      {modelState.status === 'loading' && (
        <View className="mx-4 mt-2 flex-row items-center gap-2 rounded-lg px-3 py-2.5"
          style={{ backgroundColor: ACCENT_COLOR + '18' }}>
          <ActivityIndicator size="small" color={ACCENT_COLOR} />
          <Text className="text-xs font-semibold" style={{ color: ACCENT_COLOR }}>
            Loading assessment engine…
          </Text>
        </View>
      )}

      {modelState.status === 'error' && (
        <View className="mx-4 mt-2 rounded-lg px-3 py-2.5" style={{ backgroundColor: '#EF444418' }}>
          <Text className="text-xs font-semibold text-red-600">
            Assessment engine failed to load. Recording will proceed without scoring.
          </Text>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        {phase === 'intro' && (
          <IntroPhase onCardSelect={handleCardSelect} />
        )}

        {phase === 'prep' && selectedCard && (
          <PrepPhase
            card={selectedCard}
            prepSeconds={prepSeconds}
            onReady={handleStartRecording}
          />
        )}

        {phase === 'recording' && selectedCard && (
          <RecordingPhase card={selectedCard} onStop={handleStopRecording} />
        )}

        {phase === 'assessing' && (
          <View className="items-center py-16 gap-3">
            <ActivityIndicator size="large" color={ACCENT_COLOR} />
            <Text className="text-sm text-text-muted">Analysing your speech…</Text>
          </View>
        )}

        {phase === 'results' && (
          <ResultsPhase
            result={result}
            recordingUri={recordingUri}
            playingBack={playingBack}
            onPlayback={handlePlayback}
            onRetry={handleRetry}
            onFinish={handleFinish}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Intro phase ──────────────────────────────────────────────────────────────

function IntroPhase({ onCardSelect }: { onCardSelect: (card: CueCard) => void }) {
  const [revealed, setRevealed] = useState<string | null>(null);

  return (
    <View className="gap-5">
      {/* Header */}
      <View className="rounded-2xl p-5" style={{ backgroundColor: ACCENT_COLOR + '12' }}>
        <Text className="text-lg font-bold text-text-primary mb-1">IELTS Speaking Part 2</Text>
        <Text className="text-sm text-text-secondary leading-relaxed">
          Choose one topic card. You will have{' '}
          <Text className="font-semibold text-text-primary">1 minute</Text> to prepare, then
          speak for{' '}
          <Text className="font-semibold text-text-primary">1–2 minutes</Text> on the topic.
        </Text>
      </View>

      {/* Tips */}
      <View className="rounded-xl p-4 gap-2" style={{ backgroundColor: '#F8F9FA' }}>
        <View className="flex-row items-center gap-1.5 mb-0.5">
          <Ionicons name="bulb-outline" size={14} color="#F59E0B" />
          <Text className="text-xs font-semibold text-text-secondary">Tips for success</Text>
        </View>
        {[
          "Use 'I think…' or 'In my opinion…' to share your view",
          'Cover all bullet points in your answer',
          'Aim for natural, conversational pace',
          'Speak clearly and close to the microphone',
        ].map((tip, i) => (
          <Text key={i} className="text-xs text-text-muted leading-relaxed">• {tip}</Text>
        ))}
      </View>

      {/* Card selection */}
      <Text className="text-sm font-semibold text-text-primary text-center">
        {revealed ? 'Your topic card' : 'Tap a card to reveal your topic'}
      </Text>

      <View className="gap-3">
        {CUE_CARDS.filter((card) => !revealed || revealed === card.id).map((card, i) => (
          <CardTile
            key={card.id}
            card={card}
            index={CUE_CARDS.indexOf(card)}
            isRevealed={revealed === card.id}
            onReveal={() => setRevealed(card.id)}
            onSelect={onCardSelect}
          />
        ))}
      </View>
    </View>
  );
}

function CardTile({
  card,
  index,
  isRevealed,
  onReveal,
  onSelect,
}: {
  card: CueCard;
  index: number;
  isRevealed: boolean;
  onReveal: () => void;
  onSelect: (card: CueCard) => void;
}) {
  if (!isRevealed) {
    return (
      <Pressable
        onPress={onReveal}
        className="rounded-2xl overflow-hidden active:opacity-70"
        style={{ borderWidth: 2, borderColor: ACCENT_COLOR + '30' }}
      >
        {card.backgroundImage ? (
          <ImageBackground
            source={card.backgroundImage}
            className="items-center justify-center py-8"
          >
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.35)' }]} />
            <Text style={{ fontSize: 32 }}>?</Text>
            <Text className="text-xs mt-1 font-medium text-white">Card {index + 1}</Text>
          </ImageBackground>
        ) : (
          <View
            className="items-center justify-center py-8"
            style={{ backgroundColor: ACCENT_COLOR + '18' }}
          >
            <Text style={{ fontSize: 32 }}>?</Text>
            <Text className="text-xs mt-1 font-medium" style={{ color: ACCENT_COLOR }}>
              Card {index + 1}
            </Text>
          </View>
        )}
      </Pressable>
    );
  }

  return (
    <View
      className="rounded-2xl p-4 gap-3"
      style={{ backgroundColor: ACCENT_COLOR + '10', borderWidth: 2, borderColor: ACCENT_COLOR + '40' }}
    >
      <View className="flex-row items-start justify-between gap-2">
        <Text className="text-sm font-bold text-text-primary flex-1 leading-snug">
          {card.question}
        </Text>
        <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: ACCENT_COLOR }}>
          <Text className="text-white text-xs font-bold">Card {index + 1}</Text>
        </View>
      </View>
      <Text className="text-xs text-text-muted font-semibold">You should say:</Text>
      <View className="gap-1">
        {card.bullets.map((b, i) => (
          <Text key={i} className="text-xs text-text-secondary leading-relaxed">• {b}</Text>
        ))}
      </View>
      <Pressable
        onPress={() => onSelect(card)}
        className="rounded-xl py-3 items-center active:opacity-70 mt-1"
        style={{ backgroundColor: ACCENT_COLOR }}
      >
        <Text className="text-white font-bold text-sm">Choose This Card →</Text>
      </Pressable>
    </View>
  );
}

// ─── Prep phase ───────────────────────────────────────────────────────────────

function PrepPhase({
  card,
  prepSeconds,
  onReady,
}: {
  card: CueCard;
  prepSeconds: number;
  onReady: () => void;
}) {
  const mm = String(Math.floor(prepSeconds / 60)).padStart(2, '0');
  const ss = String(prepSeconds % 60).padStart(2, '0');
  const progress = prepSeconds / 60;
  const isUrgent = prepSeconds <= 10;

  return (
    <View className="gap-4">
      <Text className="text-base font-bold text-text-primary text-center">Preparation Time</Text>

      {/* Question */}
      <View className="rounded-xl p-4" style={{ backgroundColor: ACCENT_COLOR + '10' }}>
        <Text className="text-sm font-semibold text-text-primary leading-relaxed mb-3">
          {card.question}
        </Text>
        <Text className="text-xs text-text-muted font-semibold mb-1.5">You should say:</Text>
        {card.bullets.map((b, i) => (
          <Text key={i} className="text-xs text-text-secondary leading-relaxed">• {b}</Text>
        ))}
      </View>

      {/* Countdown */}
      <View className="items-center gap-2">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="timer-outline" size={16} color={isUrgent ? '#EF4444' : ACCENT_COLOR} />
          <Text
            className="text-2xl font-bold"
            style={{ color: isUrgent ? '#EF4444' : ACCENT_COLOR, fontVariant: ['tabular-nums'] }}
          >
            {mm}:{ss}
          </Text>
        </View>
        <View className="w-full h-2 rounded-full bg-surface-page overflow-hidden">
          <View
            className="h-full rounded-full"
            style={{
              width: `${progress * 100}%`,
              backgroundColor: isUrgent ? '#EF4444' : ACCENT_COLOR,
            }}
          />
        </View>
        <Text className="text-xs text-text-muted">Use this time to organise your ideas</Text>
      </View>

      {/* Ready button */}
      <Pressable
        onPress={onReady}
        className="rounded-xl py-3.5 items-center active:opacity-70"
        style={{ backgroundColor: ACCENT_COLOR }}
      >
        <Text className="text-white font-bold text-sm">I'm Ready — Start Speaking →</Text>
      </Pressable>
    </View>
  );
}

// ─── Recording phase ──────────────────────────────────────────────────────────

function RecordingPhase({ card, onStop }: { card: CueCard; onStop: () => void }) {
  const [elapsed, setElapsed] = useState(0);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.25, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  return (
    <View className="gap-4">
      {/* Topic reminder */}
      <View className="rounded-xl p-3" style={{ backgroundColor: ACCENT_COLOR + '10' }}>
        <Text className="text-xs text-text-muted mb-1 font-semibold">Your topic:</Text>
        <Text className="text-sm text-text-secondary leading-relaxed">{card.question}</Text>
      </View>

      {/* Pulsing mic */}
      <View className="items-center gap-3 py-6">
        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          <View
            className="w-24 h-24 rounded-full items-center justify-center"
            style={{ backgroundColor: '#EF444420' }}
          >
            <Ionicons name="mic" size={44} color="#EF4444" />
          </View>
        </Animated.View>
        <View className="flex-row items-center gap-1.5">
          <View className="w-2 h-2 rounded-full bg-red-500" />
          <Text
            className="text-sm font-semibold text-text-primary"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {mm}:{ss}
          </Text>
        </View>
        <Text className="text-xs text-text-muted">Speak clearly and confidently</Text>
        <Text className="text-xs text-text-muted opacity-70">Aim for at least 1 minute</Text>
      </View>

      <Pressable
        onPress={onStop}
        className="rounded-xl py-3.5 items-center active:opacity-70"
        style={{ backgroundColor: '#EF4444' }}
      >
        <Text className="text-white font-bold text-sm">Stop Recording</Text>
      </Pressable>
    </View>
  );
}

// ─── Results phase ────────────────────────────────────────────────────────────

function ResultsPhase({
  result,
  recordingUri,
  playingBack,
  onPlayback,
  onRetry,
  onFinish,
}: {
  result: PickAndSpeakResult | null;
  recordingUri: string | null;
  playingBack: boolean;
  onPlayback: () => void;
  onRetry: () => void;
  onFinish: () => void;
}) {
  if (!result) {
    // Model unavailable — show a completion without scoring
    return (
      <View className="gap-4">
        <View className="rounded-2xl p-5 items-center gap-3" style={{ backgroundColor: ACCENT_COLOR + '12' }}>
          <Text className="text-4xl">🏆</Text>
          <Text className="text-lg font-bold text-text-primary text-center">Assessment Complete!</Text>
          <Text className="text-sm text-text-secondary text-center leading-relaxed">
            Your response has been recorded. The AI scoring engine was unavailable, but your
            effort counts.
          </Text>
        </View>
        <Pressable
          onPress={onFinish}
          className="rounded-xl py-3.5 items-center active:opacity-70"
          style={{ backgroundColor: ACCENT_COLOR }}
        >
          <Text className="text-white font-bold text-sm">Finish →</Text>
        </Pressable>
        <Pressable onPress={onRetry} className="rounded-xl py-3 items-center active:opacity-70">
          <Text className="text-sm text-text-muted">Try Again</Text>
        </Pressable>
      </View>
    );
  }

  const scoreColor =
    result.totalScore >= PASS_THRESHOLD
      ? '#10B981'
      : result.totalScore >= 40
      ? '#F59E0B'
      : '#EF4444';

  return (
    <View className="gap-4">
      {/* Header */}
      <View className="rounded-2xl p-5 items-center gap-2" style={{ backgroundColor: ACCENT_COLOR + '12' }}>
        <Text className="text-4xl">{result.passed ? '🏆' : '💪'}</Text>
        <Text className="text-lg font-bold text-text-primary">
          {result.passed ? 'Well done!' : 'Keep practising!'}
        </Text>
        <Text className="text-sm text-text-secondary text-center leading-relaxed">
          {result.passed
            ? 'You passed the final assessment. Excellent speaking!'
            : `Score ${PASS_THRESHOLD}% or above to pass. You can retake it as many times as you like.`}
        </Text>
      </View>

      {/* No-speech warning */}
      {result.noSpeech && (
        <View className="rounded-lg p-3 items-center gap-1" style={{ backgroundColor: '#EF444410' }}>
          <Ionicons name="mic-off-outline" size={20} color="#EF4444" />
          <Text className="text-sm font-semibold text-center" style={{ color: '#DC2626' }}>
            No speech detected
          </Text>
          <Text className="text-xs text-text-muted text-center">
            Please speak clearly and try again.
          </Text>
        </View>
      )}

      {/* Transcript */}
      {result.transcript.length > 0 && !result.noSpeech && (
        <ExpandableTranscript transcript={result.transcript} />
      )}

      {/* Playback */}
      {recordingUri && !result.noSpeech && (
        <Pressable
          onPress={onPlayback}
          className="flex-row items-center gap-2 rounded-lg px-3 py-2.5 active:opacity-70"
          style={{ backgroundColor: ACCENT_COLOR + '12' }}
        >
          <Ionicons
            name={playingBack ? 'pause-circle' : 'play-circle'}
            size={20}
            color={ACCENT_COLOR}
          />
          <Text className="text-xs font-semibold" style={{ color: ACCENT_COLOR }}>
            {playingBack ? 'Pause Playback' : 'Play Back My Recording'}
          </Text>
        </Pressable>
      )}

      {/* Score + criteria */}
      {!result.noSpeech && (
        <View
          className="rounded-xl border p-4 gap-3"
          style={{ borderColor: scoreColor + '40', backgroundColor: scoreColor + '08' }}
        >
          <View>
            <View className="flex-row items-center justify-between mb-1.5">
              <Text className="text-2xl font-bold" style={{ color: scoreColor }}>
                {result.totalScore}%
              </Text>
              <Text className="text-xs text-text-muted">
                {result.passed ? `✓ Passed (${PASS_THRESHOLD}%+)` : `Need ${PASS_THRESHOLD}% to pass`}
              </Text>
            </View>
            <View className="h-3 rounded-full bg-surface-page overflow-hidden">
              <View
                className="h-full rounded-full"
                style={{ width: `${result.totalScore}%`, backgroundColor: scoreColor }}
              />
            </View>
          </View>

          <View className="gap-2">
            <CriterionRow
              passed={result.expressionScore > 0}
              label="Expression"
              value={
                result.expressionsFound.length === 0
                  ? 'no opinion starters found'
                  : result.expressionsFound.length === 1
                  ? `"${result.expressionsFound[0]}"`
                  : result.expressionsFound.slice(0, 2).map((e) => `"${e}"`).join(', ')
                    + (result.expressionsFound.length > 2
                      ? ` +${result.expressionsFound.length - 2} more`
                      : '')
              }
            />
            <CriterionRow
              passed={result.sentenceScore >= 25}
              label="Sentences"
              value={
                result.sentenceCount >= SENTENCE_TARGET.min
                  ? `${result.sentenceCount} sentences`
                  : result.sentenceCount === 1
                  ? '1 sentence — add more'
                  : 'too short'
              }
            />
            <CriterionRow
              passed={result.fluencyScore >= 20}
              label="Fluency"
              value={
                result.wpm === 0
                  ? 'no speech detected'
                  : result.wpm >= 70 && result.wpm <= 180
                  ? `good pace (${result.wpm} wpm)`
                  : result.wpm < 70
                  ? `too slow (${result.wpm} wpm)`
                  : `too fast (${result.wpm} wpm)`
              }
            />
            <CriterionRow
              passed={result.detailScore >= 15}
              label="Detail"
              value={
                result.wordCount >= 25
                  ? `good detail (${result.wordCount} words)`
                  : result.wordCount >= 15
                  ? `${result.wordCount} words — add more`
                  : 'answer too short'
              }
            />
            <CriterionRow
              passed={result.pronunciationScore >= 10}
              label="Clarity"
              value={result.pronunciationConfidence >= 0.6 ? 'clear speech' : 'speak more clearly'}
            />
          </View>
        </View>
      )}

      {/* Feedback tips */}
      {result.feedback.length > 0 && (
        <View className="rounded-lg p-3 gap-1.5" style={{ backgroundColor: '#F59E0B10' }}>
          {result.feedback.map((tip, i) => (
            <View key={i} className="flex-row gap-2">
              <Ionicons name="bulb-outline" size={13} color="#F59E0B" style={{ marginTop: 1 }} />
              <Text className="text-xs text-text-secondary leading-relaxed flex-1">{tip}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Actions */}
      <View className="gap-2 mt-1">
        <Pressable
          onPress={onFinish}
          className="rounded-xl py-3.5 items-center active:opacity-70"
          style={{ backgroundColor: result.passed ? '#10B981' : ACCENT_COLOR }}
        >
          <Text className="text-white font-bold text-sm">
            {result.passed ? 'Finish & Save Result' : 'Save & Exit'}
          </Text>
        </Pressable>
        {!result.passed && (
          <Pressable
            onPress={onRetry}
            className="rounded-xl py-3 items-center active:opacity-70 border"
            style={{ borderColor: ACCENT_COLOR + '40' }}
          >
            <Text className="text-sm font-semibold" style={{ color: ACCENT_COLOR }}>
              Try Again
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ─── Expandable transcript ─────────────────────────────────────────────────────

function ExpandableTranscript({ transcript }: { transcript: string }) {
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);

  return (
    <View className="rounded-lg px-3 py-2.5" style={{ backgroundColor: ACCENT_COLOR + '08' }}>
      <Text className="text-xs text-text-muted mb-0.5">You said:</Text>
      <Text
        className="text-xs text-text-secondary leading-relaxed"
        numberOfLines={expanded ? undefined : 4}
        onTextLayout={(e) => {
          if (!expanded) setIsClamped(e.nativeEvent.lines.length >= 4);
        }}
      >
        {transcript}
      </Text>
      {(isClamped || expanded) && (
        <Pressable onPress={() => setExpanded((v) => !v)} className="mt-1">
          <Text className="text-xs font-semibold" style={{ color: ACCENT_COLOR }}>
            {expanded ? 'Show less' : 'Show more'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

// ─── Criterion row ─────────────────────────────────────────────────────────────

function CriterionRow({ passed, label, value }: { passed: boolean; label: string; value: string }) {
  return (
    <View className="flex-row items-center gap-2">
      <Ionicons
        name={passed ? 'checkmark-circle' : 'close-circle'}
        size={16}
        color={passed ? '#10B981' : '#EF4444'}
      />
      <Text className="text-xs font-semibold text-text-primary w-20">{label}</Text>
      <Text className="text-xs text-text-muted flex-1">{value}</Text>
    </View>
  );
}
