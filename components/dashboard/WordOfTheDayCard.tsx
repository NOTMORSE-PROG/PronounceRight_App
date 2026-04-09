import React, { useState, useRef, useCallback } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { WHISPER_RECORDING_OPTIONS } from '@/lib/recording-options';
import * as Speech from 'expo-speech';
import type { WordOfTheDayEntry } from '@/types/word-of-the-day';
import { useWhisperModel } from '@/lib/engine/use-whisper-model';
import { assessText } from '@/lib/pronunciation-engine';
import type { AssessmentResult } from '@/lib/pronunciation-engine';
import AssessmentResultCard from '@/components/chapter/AssessmentResultCard';
import Card from '@/components/ui/Card';

// ─── Props ───────────────────────────────────────────────────────────────────

interface WordOfTheDayCardProps {
  word: WordOfTheDayEntry;
  wordIndex: number;        // 1-based display index
  totalWords: number;
  practicedToday: boolean;
  bestScoreToday: number | null;
  onPracticeComplete: (score: number) => void;
}

// ─── Accent color for the WOTD card ──────────────────────────────────────────

const ACCENT = '#FF9800';

// ─── Sub-component: Speak button (TTS) ──────────────────────────────────────

function SpeakButton({ word }: { word: string }) {
  const [speaking, setSpeaking] = useState(false);

  const handleSpeak = useCallback(() => {
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    Speech.speak(word, {
      language: 'en-US',
      rate: 0.85,
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }, [word, speaking]);

  return (
    <Pressable
      onPress={handleSpeak}
      className="w-8 h-8 rounded-full items-center justify-center"
      style={{ backgroundColor: ACCENT + '18' }}
    >
      <Ionicons
        name={speaking ? 'volume-high' : 'volume-medium'}
        size={18}
        color={ACCENT}
      />
    </Pressable>
  );
}

// ─── Sub-component: Recorder (lazy-loads Whisper only when mounted) ──────────

interface WordRecorderProps {
  word: string;
  onResult: (result: AssessmentResult) => void;
}

function WordRecorder({ word, onResult }: WordRecorderProps) {
  const model = useWhisperModel();
  const [state, setState] = useState<'idle' | 'recording' | 'assessing'>('idle');
  const [noSpeechMsg, setNoSpeechMsg] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);

  if (model.status === 'loading' || model.status === 'idle') {
    return (
      <View className="items-center py-4 gap-2">
        <ActivityIndicator size="small" color={ACCENT} />
        <Text className="text-xs text-text-muted">Loading speech engine...</Text>
      </View>
    );
  }

  if (model.status === 'error') {
    return (
      <View className="items-center py-3">
        <Text className="text-xs text-red-500">{model.message}</Text>
      </View>
    );
  }

  const { ctx, vadCtx } = model;

  async function handleMicPress() {
    if (state === 'idle') {
      try {
        setNoSpeechMsg(false);
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const { recording } = await Audio.Recording.createAsync(
          WHISPER_RECORDING_OPTIONS,
        );
        recordingRef.current = recording;
        setState('recording');
      } catch {
        /* permission denied or device error — ignore */
      }
    } else if (state === 'recording') {
      try {
        const uri = recordingRef.current?.getURI() ?? null;
        await recordingRef.current?.stopAndUnloadAsync();
        recordingRef.current = null;
        setState('assessing');

        if (!uri) {
          setState('idle');
          return;
        }

        const result = await assessText(ctx, uri, word, vadCtx);

        if (result.noSpeechDetected || result.hallucination) {
          setNoSpeechMsg(true);
          setState('idle');
          return;
        }

        onResult(result);
      } catch {
        setState('idle');
      }
    }
  }

  return (
    <View className="items-center py-2 gap-2">
      {noSpeechMsg && (
        <Text className="text-xs text-amber-600 mb-1">No speech detected — try again.</Text>
      )}

      <Pressable
        onPress={handleMicPress}
        className="w-14 h-14 rounded-full items-center justify-center"
        style={{ backgroundColor: state === 'recording' ? '#EF4444' : ACCENT }}
      >
        {state === 'assessing' ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Ionicons
            name={state === 'recording' ? 'stop' : 'mic'}
            size={26}
            color="#fff"
          />
        )}
      </Pressable>

      <Text className="text-xs text-text-muted">
        {state === 'recording'
          ? 'Tap to stop'
          : state === 'assessing'
            ? 'Assessing...'
            : 'Tap to record'}
      </Text>
    </View>
  );
}

// ─── Main Card ───────────────────────────────────────────────────────────────

export default function WordOfTheDayCard({
  word,
  wordIndex,
  totalWords,
  practicedToday,
  bestScoreToday,
  onPracticeComplete,
}: WordOfTheDayCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);

  function handleResult(r: AssessmentResult) {
    setResult(r);
    onPracticeComplete(r.phonicsScore);
  }

  function handleRetry() {
    setResult(null);
  }

  return (
    <View className="px-4 mb-4">
      <Card elevation="sm" noPadding>
        {/* Header row */}
        <Pressable
          onPress={() => setExpanded((e) => !e)}
          className="flex-row items-center justify-between px-4 pt-3 pb-2"
        >
          <View className="flex-row items-center gap-2">
            <Text className="text-base">📖</Text>
            <Text className="text-sm font-bold" style={{ color: ACCENT }}>
              Word of the Day
            </Text>
          </View>
        </Pressable>

        {/* Collapsed: word + IPA + practice button */}
        <View className="px-4 pb-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 mr-3">
              <View className="flex-row items-center gap-2">
                <Text className="text-xl font-bold text-text-primary">{word.word}</Text>
                <SpeakButton word={word.word} />
              </View>
              <Text className="text-sm text-text-muted" style={{ fontFamily: 'monospace' }}>
                {word.ipa}
              </Text>
              <Text className="text-xs text-text-secondary italic mt-0.5">
                {word.partOfSpeech}
              </Text>
            </View>

            {practicedToday && bestScoreToday !== null && !expanded ? (
              <View className="items-center bg-green-50 rounded-xl px-3 py-2">
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text className="text-xs font-bold" style={{ color: '#10B981' }}>
                  {bestScoreToday}%
                </Text>
              </View>
            ) : !expanded ? (
              <Pressable
                onPress={() => setExpanded(true)}
                className="rounded-xl px-4 py-2.5"
                style={{ backgroundColor: ACCENT }}
              >
                <Text className="text-sm font-semibold text-white">Practice</Text>
              </Pressable>
            ) : null}
          </View>

          {/* Definition (always visible) */}
          <Text className="text-sm text-text-secondary mt-2">{word.definition}</Text>
        </View>

        {/* Expanded section */}
        {expanded && (
          <View className="px-4 pb-4 border-t border-border pt-3">
            {/* Example sentence */}
            <View className="mb-3">
              <Text className="text-xs font-semibold text-text-muted mb-1">Example</Text>
              <Text className="text-sm text-text-secondary italic">
                "{word.exampleSentence}"
              </Text>
            </View>

            {/* Pronunciation tip */}
            <View className="rounded-lg px-3 py-2.5 mb-3" style={{ backgroundColor: ACCENT + '12' }}>
              <View className="flex-row gap-2">
                <Ionicons name="bulb-outline" size={14} color={ACCENT} style={{ marginTop: 1 }} />
                <Text className="text-xs text-text-secondary leading-relaxed flex-1">
                  {word.pronunciationTip}
                </Text>
              </View>
            </View>

            {/* Recording / Result */}
            {result ? (
              <View>
                <AssessmentResultCard
                  result={result}
                  referenceText={word.word}
                  accentColor={ACCENT}
                />
                <Pressable
                  onPress={handleRetry}
                  className="mt-3 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl border"
                  style={{ borderColor: ACCENT + '60' }}
                >
                  <Ionicons name="refresh" size={16} color={ACCENT} />
                  <Text className="text-sm font-semibold" style={{ color: ACCENT }}>
                    Try Again
                  </Text>
                </Pressable>
              </View>
            ) : (
              <WordRecorder word={word.word} onResult={handleResult} />
            )}

            {/* Collapse button */}
            <Pressable
              onPress={() => setExpanded(false)}
              className="mt-2 items-center"
            >
              <Ionicons name="chevron-up" size={18} color="#9CA3AF" />
            </Pressable>
          </View>
        )}
      </Card>
    </View>
  );
}
