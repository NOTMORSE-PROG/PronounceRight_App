import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Pressable, Linking, ActivityIndicator, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import type { WhisperContext, WhisperVadContext } from 'whisper.rn';
import { WHISPER_RECORDING_OPTIONS } from '@/lib/recording-options';
import { keepRecording } from '@/lib/recordings-service';
import { saveActivityCompletion, getActivityCompletion } from '@/lib/db';
import { transcribeFreeSpeech } from '@/lib/engine/transcribe';
import { getBand } from '@/lib/assessment-config';
import type { OpinionBuilderPrompt } from '@/types/content';

// ─── Sentence completion checker ────────────────────────────────────────────

function checkSentenceCompletion(
  transcript: string,
  keywords: string[],
): { passed: boolean; found: string[]; missing: string[] } {
  const lower = transcript.toLowerCase();
  const found = keywords.filter(kw => lower.includes(kw.toLowerCase()));
  const missing = keywords.filter(kw => !lower.includes(kw.toLowerCase()));
  // Pass if at least 60% of keywords found (allows for Whisper transcription variance)
  const passed = found.length >= Math.ceil(keywords.length * 0.6);
  return { passed, found, missing };
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'prompt' | 'recording' | 'assessing' | 'review';

interface Props {
  activityTitle: string;
  direction: string;
  prompts: OpinionBuilderPrompt[];
  passThreshold: number;
  accentColor?: string;
  studentId?: string;
  activityId?: string;
  whisperCtx?: WhisperContext;
  vadCtx?: WhisperVadContext | null;
  onComplete?: (score: number) => void;
  onAdvance?: () => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OpinionBuilderActivity({
  activityTitle,
  direction,
  prompts,
  passThreshold,
  accentColor = '#FF9800',
  studentId,
  activityId,
  whisperCtx,
  vadCtx,
  onComplete,
  onAdvance,
}: Props) {
  // ── Navigation ──────────────────────────────────────────────────────────────
  const [promptIndex, setPromptIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [promptScores, setPromptScores] = useState<boolean[]>([]);
  const [finalAvg, setFinalAvg] = useState(0);

  // ── Per-prompt state ────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>('prompt');
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [noSpeechError, setNoSpeechError] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [playingBack, setPlayingBack] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [completionResult, setCompletionResult] = useState<{
    passed: boolean;
    found: string[];
    missing: string[];
  } | null>(null);

  // ── Refs ─────────────────────────────────────────────────────────────────────
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Animations ───────────────────────────────────────────────────────────────
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ── Setup & cleanup ─────────────────────────────────────────────────────────
  useEffect(() => {
    Audio.requestPermissionsAsync().then(({ granted }) => setPermissionGranted(granted));
    return () => {
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
      soundRef.current?.unloadAsync().catch(() => {});
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ── Restore saved completion on mount ─────────────────────────────────────────
  useEffect(() => {
    if (!studentId || !activityId) return;
    getActivityCompletion(studentId, activityId).then((row) => {
      if (!row) return;
      const saved = JSON.parse(row.answers) as { promptScores?: boolean[] };
      const scores = saved.promptScores ?? [];
      setPromptScores(scores);
      setFinalAvg(row.score);
      setFinished(true);
      onComplete?.(row.score);
    }).catch(() => {/* ignore */});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Pulsing mic animation ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isRecording) { pulseAnim.stopAnimation(); pulseAnim.setValue(1); return; }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.25, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 700, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording]);

  // ── Elapsed timer ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isRecording) {
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRecording]);

  // ── Derived ───────────────────────────────────────────────────────────────────
  const current = prompts[promptIndex]!;

  // ── Start recording ───────────────────────────────────────────────────────────
  const handleStartRecording = useCallback(async () => {
    setNoSpeechError(false);
    try {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(WHISPER_RECORDING_OPTIONS);
      recordingRef.current = recording;
      setIsRecording(true);
      setPhase('recording');
    } catch {
      setIsRecording(true);
      setPhase('recording');
    }
  }, []);

  // ── Stop recording + assess ───────────────────────────────────────────────────
  const handleStopRecording = useCallback(async () => {
    setIsRecording(false);
    setPhase('assessing');

    let uri: string | null = null;
    try {
      await recordingRef.current?.stopAndUnloadAsync();
      uri = recordingRef.current?.getURI() ?? null;
      recordingRef.current = null;
    } catch { recordingRef.current = null; }

    if (!uri) {
      setTranscript('');
      setCompletionResult(null);
      setNoSpeechError(true);
      setPhase('prompt');
      return;
    }

    // Persist recording
    let savedUri = uri;
    if (studentId && activityId) {
      try {
        savedUri = await keepRecording(studentId, activityId, promptIndex, uri);
      } catch { savedUri = uri; }
    }
    setRecordingUri(savedUri);

    if (!whisperCtx) {
      // No engine — treat as passed
      setTranscript('(Assessment engine unavailable)');
      setCompletionResult({ passed: true, found: current.keywords, missing: [] });
      setPhase('review');
      return;
    }

    const transcription = await transcribeFreeSpeech(whisperCtx, savedUri, vadCtx);

    if (transcription.noSpeech) {
      setNoSpeechError(true);
      setPhase('prompt');
      return;
    }

    setTranscript(transcription.transcript);
    const result = checkSentenceCompletion(transcription.transcript, current.keywords);
    setCompletionResult(result);
    setPhase('review');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, activityId, promptIndex, whisperCtx, vadCtx, current]);

  // ── Playback ─────────────────────────────────────────────────────────────────
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
      sound.setOnPlaybackStatusUpdate(s => {
        if (s.isLoaded && s.didJustFinish) setPlayingBack(false);
      });
    } catch { setPlayingBack(false); }
  }, [recordingUri, playingBack]);

  // ── Retry current prompt ──────────────────────────────────────────────────────
  const handleRetry = useCallback(() => {
    soundRef.current?.unloadAsync().then(() => { soundRef.current = null; });
    setPlayingBack(false);
    setRecordingUri(null);
    setTranscript('');
    setCompletionResult(null);
    setNoSpeechError(false);
    setPhase('prompt');
  }, []);

  // ── Advance to next prompt / finish ───────────────────────────────────────────
  const handleNext = useCallback((passed: boolean) => {
    soundRef.current?.unloadAsync().then(() => { soundRef.current = null; });
    const nextScores = [...promptScores.slice(0, promptIndex), passed];
    const nextIndex = promptIndex + 1;

    if (nextIndex >= prompts.length) {
      const correctCount = nextScores.filter(Boolean).length;
      const avg = Math.round((correctCount / prompts.length) * 100);
      setPromptScores(nextScores);
      setFinalAvg(avg);
      setFinished(true);
    } else {
      setPromptScores(nextScores);
      setPromptIndex(nextIndex);
      setPhase('prompt');
      setPlayingBack(false);
      setRecordingUri(null);
      setTranscript('');
      setCompletionResult(null);
      setNoSpeechError(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promptScores, promptIndex, prompts]);

  // ── Continue (from summary) ───────────────────────────────────────────────────
  const handleContinue = useCallback((avg: number) => {
    if (studentId && activityId) {
      saveActivityCompletion({
        id: `${studentId}_${activityId}`,
        student_id: studentId,
        activity_id: activityId,
        score: avg,
        answers: JSON.stringify({ promptScores }),
        created_at: new Date().toISOString(),
      }).catch(() => {});
    }
    onComplete?.(avg);
    onAdvance?.();
  }, [studentId, activityId, promptScores, onComplete, onAdvance]);

  // ── Retry all prompts ─────────────────────────────────────────────────────────
  const handleRetryAll = useCallback(() => {
    soundRef.current?.unloadAsync().then(() => { soundRef.current = null; });
    setPromptIndex(0);
    setFinished(false);
    setPromptScores([]);
    setFinalAvg(0);
    setPhase('prompt');
    setPlayingBack(false);
    setRecordingUri(null);
    setTranscript('');
    setCompletionResult(null);
    setNoSpeechError(false);
  }, []);

  // ═════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════════════

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // ── Permission denied ─────────────────────────────────────────────────────────
  if (permissionGranted === false) {
    return (
      <View className="bg-white rounded-2xl border border-border p-5 mb-3">
        <ActivityHeader title={activityTitle} accentColor={accentColor} />
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

  // ── Activity summary ──────────────────────────────────────────────────────────
  if (finished) {
    const passed = finalAvg >= passThreshold;
    const band = getBand(finalAvg);
    const correctCount = promptScores.filter(Boolean).length;
    return (
      <View className="bg-white rounded-2xl border border-border p-5 mb-3">
        <ActivityHeader title={activityTitle} accentColor={accentColor} />

        <View className="items-center py-3 mb-4">
          <View
            className="w-16 h-16 rounded-full items-center justify-center mb-3"
            style={{ backgroundColor: band.color + '20' }}
          >
            <Ionicons
              name={passed ? 'checkmark-circle' : 'reload-circle'}
              size={40}
              color={band.color}
            />
          </View>
          <Text className="text-xl font-bold text-text-primary">
            {passed ? 'Activity Complete!' : 'Keep Practising'}
          </Text>
          <Text className="text-sm mt-1" style={{ color: band.color }}>
            {correctCount} / {prompts.length} correct — {finalAvg}%
          </Text>

          <View className="w-full h-2.5 rounded-full bg-surface-page overflow-hidden mt-3">
            <View
              className="h-full rounded-full"
              style={{ width: `${finalAvg}%`, backgroundColor: band.color }}
            />
          </View>
        </View>

        {/* Per-prompt rows */}
        <View className="gap-2 mb-5">
          {promptScores.map((scored, i) => (
            <View key={i} className="flex-row items-center justify-between rounded-xl px-4 py-3 border border-border">
              <Text className="text-sm text-text-primary flex-1" numberOfLines={1}>
                {prompts[i]!.template}
              </Text>
              <Ionicons
                name={scored ? 'checkmark-circle' : 'close-circle'}
                size={18}
                color={scored ? '#10B981' : '#EF4444'}
              />
            </View>
          ))}
        </View>

        {/* Action buttons */}
        {passed ? (
          <Pressable
            className="rounded-xl py-4 items-center active:opacity-80"
            style={{ backgroundColor: accentColor }}
            onPress={() => handleContinue(finalAvg)}
          >
            <Text className="text-white font-bold text-base">Continue →</Text>
          </Pressable>
        ) : (
          <View className="gap-2">
            <Pressable
              className="rounded-xl py-4 items-center active:opacity-80"
              style={{ backgroundColor: accentColor }}
              onPress={handleRetryAll}
            >
              <Text className="text-white font-bold text-base">Try Again</Text>
            </Pressable>
            <Pressable
              className="rounded-xl py-3 items-center active:opacity-80 border"
              style={{ borderColor: accentColor }}
              onPress={() => handleContinue(finalAvg)}
            >
              <Text className="font-bold text-sm" style={{ color: accentColor }}>Continue Anyway →</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  }

  // ── Main activity ─────────────────────────────────────────────────────────────
  return (
    <View className="bg-white rounded-2xl border border-border p-5 mb-3">
      <ActivityHeader title={activityTitle} accentColor={accentColor} />

      <Text className="text-sm text-text-secondary mb-4 leading-relaxed" style={{ textAlign: 'justify' }}>
        {direction}
      </Text>

      {/* Prompt counter + progress dots */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-xs font-semibold text-text-muted uppercase tracking-wide">
          Prompt {promptIndex + 1} of {prompts.length}
        </Text>
        <View className="flex-row gap-1">
          {prompts.map((_, i) => (
            <View
              key={i}
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor:
                  i < promptIndex
                    ? promptScores[i] ? '#10B981' : '#EF4444'
                    : i === promptIndex
                    ? accentColor
                    : '#E2E8F0',
              }}
            />
          ))}
        </View>
      </View>

      {/* Template card */}
      <View className="rounded-xl p-4 mb-4" style={{ backgroundColor: accentColor + '10' }}>
        <Text className="text-xs font-semibold mb-2" style={{ color: accentColor }}>
          Complete and say this sentence:
        </Text>
        <Text className="text-base font-semibold text-text-primary leading-relaxed">
          {current.template}
        </Text>
      </View>

      {/* ── PROMPT PHASE ─────────────────────────────────────────────────────── */}
      {phase === 'prompt' && (
        <>
          {/* No-speech error */}
          {noSpeechError && (
            <View className="rounded-lg p-3 mb-3 flex-row items-center gap-2" style={{ backgroundColor: '#EF444414' }}>
              <Ionicons name="warning-outline" size={14} color="#EF4444" />
              <Text className="text-xs font-semibold" style={{ color: '#DC2626' }}>
                No speech detected — please try again.
              </Text>
            </View>
          )}

          {/* Record button */}
          <Pressable
            onPress={handleStartRecording}
            className="rounded-xl py-4 items-center flex-row justify-center gap-2 active:opacity-80"
            style={{ backgroundColor: accentColor }}
          >
            <Ionicons name="mic-outline" size={18} color="#FFFFFF" />
            <Text className="text-white font-bold text-base">Record Answer</Text>
          </Pressable>
        </>
      )}

      {/* ── RECORDING PHASE ──────────────────────────────────────────────────── */}
      {phase === 'recording' && (
        <View className="gap-4">
          {/* Pulsing mic + elapsed timer */}
          <View className="items-center gap-3 py-4">
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <View
                className="w-16 h-16 rounded-full items-center justify-center"
                style={{ backgroundColor: '#EF444420', borderWidth: 2, borderColor: '#EF4444' }}
              >
                <Ionicons name="mic" size={28} color="#EF4444" />
              </View>
            </Animated.View>
            <View className="flex-row items-center gap-1.5">
              <View className="w-2 h-2 rounded-full bg-red-500" />
              <Text className="text-sm font-semibold text-text-primary" style={{ fontVariant: ['tabular-nums'] }}>
                {formatTime(elapsedSeconds)}
              </Text>
            </View>
            <Text className="text-xs text-text-muted">Speak clearly and confidently</Text>
          </View>

          {/* Stop button */}
          <Pressable
            onPress={handleStopRecording}
            className="rounded-xl py-4 items-center flex-row justify-center gap-2 active:opacity-80"
            style={{ backgroundColor: '#EF444420', borderWidth: 1, borderColor: '#EF4444' }}
          >
            <Ionicons name="stop-circle" size={18} color="#EF4444" />
            <Text className="font-bold text-base" style={{ color: '#EF4444' }}>Stop Recording</Text>
          </Pressable>
        </View>
      )}

      {/* ── ASSESSING PHASE ──────────────────────────────────────────────────── */}
      {phase === 'assessing' && (
        <View className="items-center py-8 gap-2">
          <ActivityIndicator size="large" color={accentColor} />
          <Text className="text-sm text-text-muted">Checking your sentence…</Text>
        </View>
      )}

      {/* ── REVIEW PHASE ─────────────────────────────────────────────────────── */}
      {phase === 'review' && completionResult && (
        <View className="gap-3">
          {/* Transcript */}
          {transcript.length > 0 && (
            <View className="rounded-lg px-3 py-2" style={{ backgroundColor: accentColor + '08' }}>
              <Text className="text-xs text-text-muted mb-0.5">You said:</Text>
              <Text className="text-sm text-text-secondary leading-relaxed">{transcript}</Text>
            </View>
          )}

          {/* Playback button */}
          {recordingUri && (
            <Pressable
              onPress={handlePlayback}
              className="flex-row items-center justify-center gap-2 rounded-xl py-3 active:opacity-80"
              style={{ backgroundColor: accentColor + '12', borderWidth: 1, borderColor: accentColor + '40' }}
            >
              <Ionicons
                name={playingBack ? 'stop-circle-outline' : 'play-circle-outline'}
                size={18}
                color={accentColor}
              />
              <Text className="text-sm font-semibold" style={{ color: accentColor }}>
                {playingBack ? 'Stop Playback' : 'Play Back My Recording'}
              </Text>
            </Pressable>
          )}

          {/* Completion result */}
          <View
            className="rounded-xl border p-3 gap-2"
            style={{
              borderColor: completionResult.passed ? '#10B98140' : '#EF444440',
              backgroundColor: completionResult.passed ? '#10B98108' : '#EF444408',
            }}
          >
            <View className="flex-row items-center gap-2">
              <Ionicons
                name={completionResult.passed ? 'checkmark-circle' : 'close-circle'}
                size={20}
                color={completionResult.passed ? '#10B981' : '#EF4444'}
              />
              <Text
                className="text-sm font-bold"
                style={{ color: completionResult.passed ? '#059669' : '#DC2626' }}
              >
                {completionResult.passed ? 'Sentence complete!' : 'Sentence incomplete'}
              </Text>
            </View>

            {completionResult.found.length > 0 && (
              <View className="flex-row flex-wrap gap-1.5">
                {completionResult.found.map((kw, i) => (
                  <View key={i} className="rounded-full px-2.5 py-0.5" style={{ backgroundColor: '#10B98118' }}>
                    <Text className="text-xs font-semibold" style={{ color: '#059669' }}>{kw}</Text>
                  </View>
                ))}
              </View>
            )}

            {!completionResult.passed && completionResult.missing.length > 0 && (
              <View>
                <Text className="text-xs text-text-muted mb-1">Try to include:</Text>
                <View className="flex-row flex-wrap gap-1.5">
                  {completionResult.missing.map((kw, i) => (
                    <View key={i} className="rounded-full px-2.5 py-0.5" style={{ backgroundColor: '#EF444418' }}>
                      <Text className="text-xs font-semibold" style={{ color: '#DC2626' }}>{kw}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Action buttons */}
          <View className="flex-row gap-2 mt-1">
            <Pressable
              className="flex-1 rounded-xl py-3.5 items-center active:opacity-80"
              style={{ backgroundColor: '#F97316' + '18', borderWidth: 1, borderColor: '#F97316' }}
              onPress={handleRetry}
            >
              <Text className="font-semibold text-sm" style={{ color: '#F97316' }}>Try Again</Text>
            </Pressable>
            <Pressable
              className="flex-1 rounded-xl py-3.5 items-center active:opacity-80"
              style={{ backgroundColor: accentColor }}
              onPress={() => handleNext(completionResult.passed)}
            >
              <Text className="text-white font-bold text-sm">
                {promptIndex + 1 >= prompts.length ? 'Finish' : 'Next →'}
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Activity Header ──────────────────────────────────────────────────────────

function ActivityHeader({ title, accentColor }: { title: string; accentColor: string }) {
  return (
    <View className="flex-row items-center gap-3 mb-4">
      <View
        className="w-9 h-9 rounded-xl items-center justify-center"
        style={{ backgroundColor: accentColor + '18' }}
      >
        <Ionicons name="chatbubble-ellipses-outline" size={18} color={accentColor} />
      </View>
      <Text className="text-base font-bold text-text-primary flex-1">{title}</Text>
    </View>
  );
}
