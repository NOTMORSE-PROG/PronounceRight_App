import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Pressable, Linking, ActivityIndicator, Animated, ImageBackground, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import type { WhisperContext, WhisperVadContext } from 'whisper.rn';
import { WHISPER_RECORDING_OPTIONS } from '@/lib/recording-options';
import { keepRecording } from '@/lib/recordings-service';
import { saveActivityCompletion, getActivityCompletion } from '@/lib/db';
import { transcribeFreeSpeech } from '@/lib/engine/transcribe';
import { scorePickAndSpeak } from '@/lib/engine/pick-and-speak-scorer';
import type { PickAndSpeakResult } from '@/lib/engine/pick-and-speak-scorer';
import type { PickAndSpeakActivity as PickAndSpeakActivityType, PickAndSpeakCueCard } from '@/types/content';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'selection' | 'prep' | 'recording' | 'assessing' | 'review';

interface Props {
  activity: PickAndSpeakActivityType;
  accentColor: string;
  studentId?: string;
  whisperCtx?: WhisperContext;
  vadCtx?: WhisperVadContext | null;
  onComplete: (score: number) => void;
  onAdvance?: () => void;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PickAndSpeakActivity({
  activity,
  accentColor,
  studentId,
  whisperCtx,
  vadCtx,
  onComplete,
  onAdvance,
}: Props) {
  const canAssess = !!whisperCtx;

  const [phase, setPhase] = useState<Phase>('selection');
  const [shuffledCards, setShuffledCards] = useState<PickAndSpeakCueCard[]>(() => shuffle(activity.cueCards));
  const [selectedCard, setSelectedCard] = useState<PickAndSpeakCueCard | null>(null);
  const [prepSeconds, setPrepSeconds] = useState(60);
  const [speakResult, setSpeakResult] = useState<PickAndSpeakResult | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [playingBack, setPlayingBack] = useState(false);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  const [restoredComplete, setRestoredComplete] = useState(false);

  // Permission check + cleanup
  useEffect(() => {
    Audio.requestPermissionsAsync().then(({ granted }) => setPermissionGranted(granted));
    return () => {
      recordingRef.current?.stopAndUnloadAsync();
      soundRef.current?.unloadAsync();
    };
  }, []);

  // Restore saved completion on mount
  useEffect(() => {
    if (!studentId) return;
    getActivityCompletion(studentId, activity.id).then((row) => {
      if (!row) return;
      setRestoredComplete(true);
      onComplete(row.score);
      onAdvance?.();
    }).catch(() => {/* ignore */});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Prep countdown
  useEffect(() => {
    if (phase !== 'prep') return;
    if (prepSeconds <= 0) {
      setPhase('recording');
      return;
    }
    const id = setInterval(() => setPrepSeconds(s => s - 1), 1000);
    return () => clearInterval(id);
  }, [phase, prepSeconds]);

  const handleCardTap = useCallback((card: PickAndSpeakCueCard) => {
    if (phase !== 'selection') return;
    setSelectedCard(card);
    setPrepSeconds(60);
    setPhase('prep');
  }, [phase]);

  const handleStartRecording = useCallback(async () => {
    if (!canAssess) {
      onComplete(100);
      return;
    }
    try {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(WHISPER_RECORDING_OPTIONS);
      recordingRef.current = recording;
      setPhase('recording');
    } catch {
      setPhase('recording');
    }
  }, [canAssess, onComplete]);

  const handleStopRecording = useCallback(async () => {
    if (!recordingRef.current || !selectedCard) return;
    setPhase('assessing');

    let uri: string | null = null;
    try {
      await recordingRef.current.stopAndUnloadAsync();
      uri = recordingRef.current.getURI();
      recordingRef.current = null;
    } catch {
      recordingRef.current = null;
    }

    if (!uri) {
      setSpeakResult({
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
      setPhase('review');
      return;
    }

    // Persist recording
    let savedUri = uri;
    if (studentId) {
      try {
        savedUri = await keepRecording(studentId, activity.id, 0, uri);
      } catch {
        savedUri = uri;
      }
    }
    setRecordingUri(savedUri);

    if (!whisperCtx) {
      onComplete(100);
      return;
    }

    const transcription = await transcribeFreeSpeech(whisperCtx, savedUri, vadCtx);
    const result = scorePickAndSpeak(transcription, activity.sentenceCount, activity.passThreshold);
    setSpeakResult(result);
    setPhase('review');
  }, [selectedCard, studentId, activity, whisperCtx, vadCtx, onComplete]);

  const handlePlayback = useCallback(async () => {
    if (!recordingUri) return;
    if (playingBack) {
      await soundRef.current?.stopAsync();
      setPlayingBack(false);
      return;
    }
    try {
      if (soundRef.current) { await soundRef.current.unloadAsync(); soundRef.current = null; }
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
    setSpeakResult(null);
    setSelectedCard(null);
    setShuffledCards(shuffle(activity.cueCards));
    setPrepSeconds(60);
    setPhase('selection');
  }, [activity.cueCards]);

  // ─── Already completed (restored from DB) ─────────────────────────────────

  if (restoredComplete) {
    return (
      <View className="bg-white rounded-2xl border border-border p-5 mb-3">
        <Text className="text-base font-bold text-text-primary mb-1">{activity.title}</Text>
        <View className="items-center py-4">
          <View className="w-16 h-16 rounded-full items-center justify-center mb-3" style={{ backgroundColor: '#10B98120' }}>
            <Ionicons name="checkmark-circle" size={36} color="#10B981" />
          </View>
          <Text className="text-xl font-bold text-text-primary mb-1">Completed!</Text>
          <Text className="text-sm text-text-muted">Your response has been saved.</Text>
        </View>
      </View>
    );
  }

  // ─── Permission denied ──────────────────────────────────────────────────────

  if (permissionGranted === false) {
    return (
      <View className="bg-white rounded-2xl border border-border p-5 mb-3">
        <View className="items-center py-4 gap-3">
          <Ionicons name="mic-off-outline" size={36} color="#90A4AE" />
          <Text className="text-sm text-text-secondary text-center">
            Microphone access is required for this activity.
          </Text>
          <Pressable
            className="rounded-xl px-6 py-3 active:opacity-70"
            style={{ backgroundColor: accentColor }}
            onPress={() => Linking.openSettings()}
          >
            <Text className="text-white font-semibold text-sm">Open Settings</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="bg-white rounded-2xl border border-border p-4 mb-3">
      {/* Header */}
      <Text className="text-base font-bold text-text-primary mb-1">{activity.title}</Text>
      <Text className="text-xs text-text-muted mb-4 leading-relaxed">{activity.direction}</Text>

      {phase === 'selection' && (
        <SelectionPhase
          cards={shuffledCards}
          accentColor={accentColor}
          onCardTap={handleCardTap}
        />
      )}

      {phase === 'prep' && selectedCard && (
        <PrepPhase
          card={selectedCard}
          prepSeconds={prepSeconds}
          accentColor={accentColor}
          onReady={handleStartRecording}
        />
      )}

      {phase === 'recording' && selectedCard && (
        <RecordingPhase
          card={selectedCard}
          accentColor={accentColor}
          onStop={handleStopRecording}
        />
      )}

      {phase === 'assessing' && (
        <View className="items-center py-8 gap-2">
          <ActivityIndicator size="large" color={accentColor} />
          <Text className="text-sm text-text-muted">Analysing your speech…</Text>
        </View>
      )}

      {phase === 'review' && speakResult && selectedCard && (
        <ReviewPhase
          result={speakResult}
          accentColor={accentColor}
          recordingUri={recordingUri}
          playingBack={playingBack}
          onPlayback={handlePlayback}
          onRetry={handleRetry}
          onComplete={() => {
            if (studentId) {
              saveActivityCompletion({
                id: `${studentId}_${activity.id}`,
                student_id: studentId,
                activity_id: activity.id,
                score: speakResult.totalScore,
                answers: JSON.stringify({ cardQuestion: selectedCard?.question, transcript: speakResult.transcript }),
                created_at: new Date().toISOString(),
              }).catch(() => {/* ignore */});
            }
            onComplete(speakResult.totalScore);
            onAdvance?.();
          }}
          passThreshold={activity.passThreshold}
        />
      )}
    </View>
  );
}

// ─── Selection phase ──────────────────────────────────────────────────────────

function SelectionPhase({
  cards,
  accentColor,
  onCardTap,
}: {
  cards: PickAndSpeakCueCard[];
  accentColor: string;
  onCardTap: (card: PickAndSpeakCueCard) => void;
}) {
  return (
    <View>
      <Text className="text-xs text-text-muted text-center mb-4">
        Tap a card to reveal your question
      </Text>
      <View className="flex-row gap-3 justify-center">
        {cards.map((card, i) => (
          <Pressable
            key={i}
            onPress={() => onCardTap(card)}
            className="flex-1 rounded-2xl overflow-hidden active:opacity-70"
            style={{ borderWidth: 2, borderColor: accentColor + '30' }}
          >
            {card.backgroundImage ? (
              <ImageBackground
                source={card.backgroundImage}
                className="flex-1 items-center justify-center py-8"
              >
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.35)' }]} />
                <Text style={{ fontSize: 32 }}>?</Text>
                <Text className="text-xs mt-1 font-medium text-white">Card {i + 1}</Text>
              </ImageBackground>
            ) : (
              <View
                className="flex-1 items-center justify-center py-8"
                style={{ backgroundColor: accentColor + '18' }}
              >
                <Text style={{ fontSize: 32 }}>?</Text>
                <Text className="text-xs mt-1 font-medium" style={{ color: accentColor }}>
                  Card {i + 1}
                </Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ─── Prep phase ───────────────────────────────────────────────────────────────

function PrepPhase({
  card,
  prepSeconds,
  accentColor,
  onReady,
}: {
  card: PickAndSpeakCueCard;
  prepSeconds: number;
  accentColor: string;
  onReady: () => void;
}) {
  const mm = String(Math.floor(prepSeconds / 60)).padStart(2, '0');
  const ss = String(prepSeconds % 60).padStart(2, '0');
  const progress = prepSeconds / 60;
  const isUrgent = prepSeconds <= 10;

  return (
    <View className="gap-4">
      {/* Question */}
      <View className="rounded-xl p-4" style={{ backgroundColor: accentColor + '10' }}>
        <Text className="text-sm font-semibold text-text-primary leading-relaxed">
          {card.question}
        </Text>
      </View>

      {/* Key phrases */}
      <View className="rounded-xl p-3 gap-1.5" style={{ backgroundColor: '#F8F9FA' }}>
        <View className="flex-row items-center gap-1.5 mb-0.5">
          <Ionicons name="bulb-outline" size={13} color="#F59E0B" />
          <Text className="text-xs font-semibold text-text-secondary">Helpful phrases:</Text>
        </View>
        {card.keyPhrases.map((phrase, i) => (
          <Text key={i} className="text-xs text-text-muted leading-relaxed">
            • {phrase}
          </Text>
        ))}
      </View>

      {/* Countdown */}
      <View className="items-center gap-2">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="timer-outline" size={16} color={isUrgent ? '#EF4444' : accentColor} />
          <Text
            className="text-xl font-bold"
            style={{ color: isUrgent ? '#EF4444' : accentColor, fontVariant: ['tabular-nums'] }}
          >
            {mm}:{ss}
          </Text>
        </View>
        <View className="w-full h-2 rounded-full bg-surface-page overflow-hidden">
          <View
            className="h-full rounded-full"
            style={{
              width: `${progress * 100}%`,
              backgroundColor: isUrgent ? '#EF4444' : accentColor,
            }}
          />
        </View>
        <Text className="text-xs text-text-muted">Prepare your answer</Text>
      </View>

      {/* Ready button */}
      <Pressable
        onPress={onReady}
        className="rounded-xl py-3 items-center active:opacity-70"
        style={{ backgroundColor: accentColor }}
      >
        <Text className="text-white font-semibold text-sm">I'm Ready →</Text>
      </Pressable>
    </View>
  );
}

// ─── Recording phase ──────────────────────────────────────────────────────────

function RecordingPhase({
  card,
  accentColor,
  onStop,
}: {
  card: PickAndSpeakCueCard;
  accentColor: string;
  onStop: () => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const id = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.25, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  return (
    <View className="gap-4">
      {/* Question reminder */}
      <View className="rounded-xl p-3" style={{ backgroundColor: accentColor + '10' }}>
        <Text className="text-sm text-text-secondary leading-relaxed">{card.question}</Text>
      </View>

      {/* Pulsing mic + elapsed timer */}
      <View className="items-center gap-3 py-4">
        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          <View
            className="w-20 h-20 rounded-full items-center justify-center"
            style={{ backgroundColor: '#EF444420' }}
          >
            <Ionicons name="mic" size={36} color="#EF4444" />
          </View>
        </Animated.View>
        <View className="flex-row items-center gap-1.5">
          <View className="w-2 h-2 rounded-full bg-red-500" />
          <Text className="text-sm font-semibold text-text-primary" style={{ fontVariant: ['tabular-nums'] }}>
            {mm}:{ss}
          </Text>
        </View>
        <Text className="text-xs text-text-muted">Speak clearly and confidently</Text>
      </View>

      {/* Stop button */}
      <Pressable
        onPress={onStop}
        className="rounded-xl py-3 items-center active:opacity-70"
        style={{ backgroundColor: '#EF4444' }}
      >
        <Text className="text-white font-semibold text-sm">Stop Recording</Text>
      </Pressable>
    </View>
  );
}

// ─── Review phase ─────────────────────────────────────────────────────────────

function ReviewPhase({
  result,
  accentColor,
  recordingUri,
  playingBack,
  onPlayback,
  onRetry,
  onComplete,
  passThreshold,
}: {
  result: PickAndSpeakResult;
  accentColor: string;
  recordingUri: string | null;
  playingBack: boolean;
  onPlayback: () => void;
  onRetry: () => void;
  onComplete: () => void;
  passThreshold: number;
}) {
  const scoreColor = result.totalScore >= passThreshold
    ? '#10B981'
    : result.totalScore >= 70
    ? '#F59E0B'
    : '#EF4444';

  return (
    <View className="gap-3">
      {/* Transcript */}
      {result.transcript.length > 0 && !result.noSpeech && (
        <ExpandableTranscript transcript={result.transcript} accentColor={accentColor} />
      )}

      {/* Playback button */}
      {recordingUri && !result.noSpeech && (
        <Pressable
          onPress={onPlayback}
          className="flex-row items-center gap-2 rounded-lg px-3 py-2.5 active:opacity-70"
          style={{ backgroundColor: accentColor + '12' }}
        >
          <Ionicons
            name={playingBack ? 'pause-circle' : 'play-circle'}
            size={20}
            color={accentColor}
          />
          <Text className="text-xs font-semibold" style={{ color: accentColor }}>
            {playingBack ? 'Pause Playback' : 'Play Back My Recording'}
          </Text>
        </Pressable>
      )}

      {/* No-speech message */}
      {result.noSpeech && (
        <View className="rounded-lg p-3 items-center gap-1" style={{ backgroundColor: '#EF444410' }}>
          <Ionicons name="mic-off-outline" size={20} color="#EF4444" />
          <Text className="text-sm text-center font-semibold" style={{ color: '#DC2626' }}>
            No speech detected
          </Text>
          <Text className="text-xs text-text-muted text-center">
            Please speak clearly and try again.
          </Text>
        </View>
      )}

      {/* Score bar + criteria */}
      {!result.noSpeech && (
        <View className="rounded-xl border p-3 gap-3" style={{ borderColor: scoreColor + '40', backgroundColor: scoreColor + '08' }}>
          <View>
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-sm font-bold" style={{ color: scoreColor }}>
                {result.totalScore}%
              </Text>
              <Text className="text-xs text-text-muted">
                {result.passed ? '✓ Passed!' : `Need ${passThreshold}% to pass`}
              </Text>
            </View>
            <View className="h-2.5 rounded-full bg-surface-page overflow-hidden">
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
                  ? 'none found'
                  : result.expressionsFound.length === 1
                  ? `"${result.expressionsFound[0]}"`
                  : result.expressionsFound.slice(0, 2).map(e => `"${e}"`).join(', ')
                    + (result.expressionsFound.length > 2 ? ` +${result.expressionsFound.length - 2} more` : '')
              }
            />
            <CriterionRow
              passed={result.sentenceScore >= 25}
              label="Sentences"
              value={result.sentenceCount >= 2
                ? `${result.sentenceCount} sentences`
                : result.sentenceCount === 1 ? '1 sentence — add more' : 'too short'}
            />
            <CriterionRow
              passed={result.fluencyScore >= 20}
              label="Fluency"
              value={
                result.wpm === 0 ? 'no speech detected'
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

      {/* Action buttons */}
      <View className="gap-2 mt-1">
        {result.passed ? (
          <Pressable
            onPress={onComplete}
            className="rounded-xl py-3 items-center active:opacity-70"
            style={{ backgroundColor: '#10B981' }}
          >
            <Text className="text-white font-semibold text-sm">Continue →</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={onRetry}
            className="rounded-xl py-3 items-center active:opacity-70"
            style={{ backgroundColor: accentColor }}
          >
            <Text className="text-white font-semibold text-sm">Try Again</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ─── Expandable transcript ────────────────────────────────────────────────────

function ExpandableTranscript({ transcript, accentColor }: { transcript: string; accentColor: string }) {
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);

  return (
    <View className="rounded-lg px-3 py-2" style={{ backgroundColor: accentColor + '08' }}>
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
        <Pressable onPress={() => setExpanded(v => !v)} className="mt-1">
          <Text className="text-xs font-semibold" style={{ color: accentColor }}>
            {expanded ? 'Show less' : 'Show more'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

// ─── Criterion row ────────────────────────────────────────────────────────────

function CriterionRow({
  passed,
  label,
  value,
}: {
  passed: boolean;
  label: string;
  value: string;
}) {
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
