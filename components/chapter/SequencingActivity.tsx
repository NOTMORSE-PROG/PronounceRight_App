import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View, Text, Pressable, Linking, ActivityIndicator, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import type { WhisperContext, WhisperVadContext } from 'whisper.rn';
import { WHISPER_RECORDING_OPTIONS } from '@/lib/recording-options';
import { keepRecording } from '@/lib/recordings-service';
import { assessText } from '@/lib/pronunciation-engine';
import type { AssessmentResult } from '@/lib/pronunciation-engine';
import { saveAssessment, saveActivityCompletion, getActivityCompletion } from '@/lib/db';
import { ASSESSMENT_CONFIG, getBand } from '@/lib/assessment-config';
import AssessmentResultCard from '@/components/chapter/AssessmentResultCard';
import SpeakWordButton from '@/components/ui/SpeakWordButton';
import { Sortable, SortableItem } from 'react-native-reanimated-dnd';
import type { SortableRenderItemProps } from 'react-native-reanimated-dnd';
import type { SentenceSequencingPassage } from '@/types/content';

// ─── Sortable data type ───────────────────────────────────────────────────────
type CardData = { id: string; sentenceIdx: number };

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'arranging' | 'recording' | 'assessing' | 'result';

interface Props {
  activityTitle: string;
  direction: string;
  passages: SentenceSequencingPassage[];
  maxAudioPlays: number;
  accentColor?: string;
  studentId?: string;
  activityId?: string;
  whisperCtx?: WhisperContext;
  vadCtx?: WhisperVadContext | null;
  onComplete?: (score: number) => void;
  onAdvance?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SequencingActivity({
  activityTitle,
  direction,
  passages,
  maxAudioPlays,
  accentColor = '#2196F3',
  studentId,
  activityId,
  whisperCtx,
  vadCtx,
  onComplete,
  onAdvance,
}: Props) {
  // ── Permission ──────────────────────────────────────────────────────────────
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  // ── Passage navigation ──────────────────────────────────────────────────────
  const [passageIndex, setPassageIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [finalScores, setFinalScores] = useState<number[]>([]);
  const [finalAvg, setFinalAvg] = useState(0);

  // ── Per-passage phase ───────────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>('arranging');

  // ── Arrangement state ───────────────────────────────────────────────────────
  const [order, setOrder] = useState<number[]>(() => passages[0]!.sentences.map((_, i) => i));
  const [arrangementChecked, setArrangementChecked] = useState(false);
  const [arrangementCorrect, setArrangementCorrect] = useState(false);
  const [failedChecks, setFailedChecks] = useState(0);

  // ── TTS ─────────────────────────────────────────────────────────────────────
  const [audioPlaysLeft, setAudioPlaysLeft] = useState(maxAudioPlays);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // ── Recording ───────────────────────────────────────────────────────────────
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [noSpeechError, setNoSpeechError] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  const [playingBack, setPlayingBack] = useState(false);

  // ── Refs ─────────────────────────────────────────────────────────────────────
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const checkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Animations ───────────────────────────────────────────────────────────────
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scoreBarWidth = useRef(new Animated.Value(0)).current;
  // One shake value per sentence card position (all passages have same card count)
  const shakeAnims = useRef(passages[0]!.sentences.map(() => new Animated.Value(0))).current;

  // ── Setup ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    Audio.requestPermissionsAsync().then(({ granted }) => setPermissionGranted(granted));
    return () => {
      Speech.stop();
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
      soundRef.current?.unloadAsync().catch(() => {});
      if (timerRef.current) clearInterval(timerRef.current);
      if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
    };
  }, []);

  // ── Restore saved completion on mount ─────────────────────────────────────────
  useEffect(() => {
    if (!studentId || !activityId) return;
    getActivityCompletion(studentId, activityId).then((row) => {
      if (!row) return;
      const saved = JSON.parse(row.answers) as { passageScores?: number[] };
      const scores = saved.passageScores ?? [];
      setFinalScores(scores);
      setFinalAvg(row.score);
      setFinished(true);
      onComplete?.(row.score);
    }).catch(() => {/* ignore */});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Pulsing mic ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isRecording) { pulseAnim.stopAnimation(); pulseAnim.setValue(1); return; }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.25, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 700, useNativeDriver: true }),
      ])
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

  // ── Derived values ────────────────────────────────────────────────────────────
  const current = passages[passageIndex]!;

  const correctPassageText = useMemo(
    () => current.correctOrder.map(idx => current.sentences[idx]!).join(' '),
    [current]
  );

  const positionCorrect = useMemo(
    () => order.map((sentIdx, pos) => sentIdx === current.correctOrder[pos]),
    [order, current]
  );

  const allCorrect = positionCorrect.every(Boolean);

  // Stable data array for Sortable — id encodes passageIndex + sentenceIdx
  const sortableData = useMemo<CardData[]>(
    () => order.map(sentIdx => ({ id: `${passageIndex}-${sentIdx}`, sentenceIdx: sentIdx })),
    [order, passageIndex]
  );

  // ── TTS: Listen to model ──────────────────────────────────────────────────────
  const handleListenModel = useCallback(() => {
    if (audioPlaysLeft <= 0 || isSpeaking) return;
    Speech.stop();
    setIsSpeaking(true);
    setAudioPlaysLeft(p => p - 1);
    Speech.speak(correctPassageText, {
      language: 'en-US',
      rate: 0.80,
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  }, [audioPlaysLeft, isSpeaking, correctPassageText]);

  // ── Drag drop: update order on card release ───────────────────────────────────
  const handleDrop = useCallback((_id: string, _pos: number, allPositions?: { [id: string]: number }) => {
    if (!allPositions) return;
    const newOrder = new Array<number>(Object.keys(allPositions).length);
    Object.entries(allPositions).forEach(([id, pos]) => {
      // id format: `${passageIndex}-${sentIdx}`
      const sentIdx = parseInt(id.split('-')[1]!, 10);
      newOrder[pos] = sentIdx;
    });
    setOrder(newOrder);
  }, []);

  // ── Check arrangement ─────────────────────────────────────────────────────────
  const handleCheckOrder = useCallback(() => {
    if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
    setArrangementChecked(true);

    if (allCorrect) {
      setArrangementCorrect(true);
      checkTimeoutRef.current = setTimeout(() => {
        setPhase('recording');
        setArrangementChecked(false);
      }, 800);
    } else {
      setArrangementCorrect(false);
      setFailedChecks(c => c + 1);
      // Shake wrong-positioned cards
      order.forEach((sentIdx, pos) => {
        if (sentIdx !== current.correctOrder[pos]) {
          Animated.sequence([
            Animated.timing(shakeAnims[pos]!, { toValue: 8, duration: 80, useNativeDriver: true }),
            Animated.timing(shakeAnims[pos]!, { toValue: -8, duration: 80, useNativeDriver: true }),
            Animated.timing(shakeAnims[pos]!, { toValue: 6, duration: 80, useNativeDriver: true }),
            Animated.timing(shakeAnims[pos]!, { toValue: 0, duration: 80, useNativeDriver: true }),
          ]).start();
        }
      });
      // Unlock for rearranging after 1.5s
      checkTimeoutRef.current = setTimeout(() => setArrangementChecked(false), 1500);
    }
  }, [allCorrect, order, current, shakeAnims]);

  // ── Reveal correct order ──────────────────────────────────────────────────────
  const handleRevealAnswer = useCallback(() => {
    if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
    setOrder([...current.correctOrder]);
    setArrangementChecked(false);
    setArrangementCorrect(true);
    checkTimeoutRef.current = setTimeout(() => setPhase('recording'), 600);
  }, [current.correctOrder]);

  // ── Start recording ───────────────────────────────────────────────────────────
  const handleStartRecording = useCallback(async () => {
    setNoSpeechError(false);
    try {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(WHISPER_RECORDING_OPTIONS);
      recordingRef.current = recording;
      setIsRecording(true);
    } catch {
      setIsRecording(true); // UI shows recording state; will fail gracefully on stop
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
      setAssessmentResult(null);
      setPhase('result');
      return;
    }

    // Persist recording
    let savedUri = uri;
    if (studentId && activityId) {
      try {
        savedUri = await keepRecording(studentId, activityId, passageIndex, uri);
      } catch { savedUri = uri; }
    }
    setRecordingUri(savedUri);

    if (!whisperCtx) {
      // No assessment engine — show unavailable message, allow passage advance
      setAssessmentResult(null);
      setPhase('result');
      return;
    }

    // Assess against correctly ordered passage
    const result = await assessText(whisperCtx, savedUri, correctPassageText, vadCtx);

    if (result.noSpeechDetected) {
      setPhase('recording');
      setNoSpeechError(true);
      return;
    }

    // Persist to DB
    if (studentId && activityId) {
      saveAssessment({
        id: `${studentId}_${activityId}_${passageIndex}`,
        student_id: studentId,
        activity_id: activityId,
        prompt_index: passageIndex,
        phonics_score: result.phonicsScore,
        transcript: result.transcript,
        errors: JSON.stringify(result.errors),
        created_at: new Date().toISOString(),
      }).catch(() => {});
    }

    setAssessmentResult(result);
    scoreBarWidth.setValue(0);
    Animated.timing(scoreBarWidth, {
      toValue: result.phonicsScore,
      duration: 800,
      useNativeDriver: false,
    }).start();
    setPhase('result');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, activityId, passageIndex, whisperCtx, vadCtx, correctPassageText]);

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

  // ── Retry current passage ─────────────────────────────────────────────────────
  const handleRetryPassage = useCallback(() => {
    if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
    soundRef.current?.unloadAsync().then(() => { soundRef.current = null; });
    Speech.stop();
    setPhase('arranging');
    setOrder(current.sentences.map((_, i) => i));
    setArrangementChecked(false);
    setArrangementCorrect(false);
    setFailedChecks(0);
    setIsRecording(false);
    setNoSpeechError(false);
    setRecordingUri(null);
    setAssessmentResult(null);
    setPlayingBack(false);
    setAudioPlaysLeft(maxAudioPlays);
    scoreBarWidth.setValue(0);
    shakeAnims.forEach(a => a.setValue(0));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, maxAudioPlays]);

  // ── Advance to next passage / finish ─────────────────────────────────────────
  const handleNextPassage = useCallback(() => {
    soundRef.current?.unloadAsync().then(() => { soundRef.current = null; });
    const score = assessmentResult?.phonicsScore ?? 100;
    const nextScores = [...finalScores.slice(0, passageIndex), score];
    const nextIndex = passageIndex + 1;

    if (nextIndex >= passages.length) {
      const allScores = nextScores;
      const avg = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);
      setFinalScores(allScores);
      setFinalAvg(avg);
      setFinished(true);
    } else {
      setFinalScores(nextScores);
      setPassageIndex(nextIndex);
      setPhase('arranging');
      setOrder(passages[nextIndex]!.sentences.map((_, i) => i));
      setArrangementChecked(false);
      setArrangementCorrect(false);
      setFailedChecks(0);
      setIsRecording(false);
      setNoSpeechError(false);
      setRecordingUri(null);
      setAssessmentResult(null);
      setPlayingBack(false);
      setAudioPlaysLeft(maxAudioPlays);
      scoreBarWidth.setValue(0);
      shakeAnims.forEach(a => a.setValue(0));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessmentResult, finalScores, passageIndex, passages, maxAudioPlays]);

  // ── Continue (from summary) ───────────────────────────────────────────────────
  const handleContinue = useCallback((avg: number) => {
    if (studentId && activityId) {
      saveActivityCompletion({
        id: `${studentId}_${activityId}`,
        student_id: studentId,
        activity_id: activityId,
        score: avg,
        answers: JSON.stringify({ passageScores: finalScores }),
        created_at: new Date().toISOString(),
      }).catch(() => {});
    }
    onComplete?.(avg);
    onAdvance?.();
  }, [studentId, activityId, finalScores, onComplete, onAdvance]);

  // ── Retry all passages ────────────────────────────────────────────────────────
  const handleRetryAll = useCallback(() => {
    if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
    soundRef.current?.unloadAsync().then(() => { soundRef.current = null; });
    Speech.stop();
    setPassageIndex(0);
    setFinished(false);
    setFinalScores([]);
    setFinalAvg(0);
    setPhase('arranging');
    setOrder(passages[0]!.sentences.map((_, i) => i));
    setArrangementChecked(false);
    setArrangementCorrect(false);
    setFailedChecks(0);
    setIsRecording(false);
    setNoSpeechError(false);
    setRecordingUri(null);
    setAssessmentResult(null);
    setPlayingBack(false);
    setAudioPlaysLeft(maxAudioPlays);
    scoreBarWidth.setValue(0);
    shakeAnims.forEach(a => a.setValue(0));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passages, maxAudioPlays]);

  // ═════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════════════

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

  // ── Activity summary (after all passages) ─────────────────────────────────────
  if (finished) {
    const passed = finalAvg >= ASSESSMENT_CONFIG.passThreshold;
    const band = getBand(finalAvg);
    return (
      <View className="bg-white rounded-2xl border border-border p-5 mb-3">
        <ActivityHeader title={activityTitle} accentColor={accentColor} />

        {/* Overall result */}
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
            Overall Score: {finalAvg}% — {band.label}
          </Text>

          {/* Animated score bar */}
          <View className="w-full h-2.5 rounded-full bg-surface-page overflow-hidden mt-3">
            <View
              className="h-full rounded-full"
              style={{ width: `${finalAvg}%`, backgroundColor: band.color }}
            />
          </View>
        </View>

        {/* Per-passage rows */}
        <View className="gap-2 mb-5">
          {finalScores.map((score, i) => {
            const pBand = getBand(score);
            return (
              <View key={i} className="flex-row items-center justify-between rounded-xl px-4 py-3 border border-border">
                <Text className="text-sm font-semibold text-text-primary">Passage {i + 1}</Text>
                <View className="flex-row items-center gap-2">
                  <View className="h-1.5 w-20 rounded-full bg-surface-page overflow-hidden">
                    <View className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: pBand.color }} />
                  </View>
                  <Text className="text-sm font-bold w-10 text-right" style={{ color: pBand.color }}>
                    {score}%
                  </Text>
                  <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: pBand.color + '20' }}>
                    <Text className="text-[10px] font-semibold" style={{ color: pBand.color }}>
                      {pBand.label}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
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
          <Pressable
            className="rounded-xl py-4 items-center active:opacity-80"
            style={{ backgroundColor: accentColor }}
            onPress={handleRetryAll}
          >
            <Text className="text-white font-bold text-base">Try Again</Text>
          </Pressable>
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

      {/* Passage counter + Listen button (shown during arranging) */}
      {phase === 'arranging' && (
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-xs font-semibold text-text-muted uppercase tracking-wide">
            Passage {passageIndex + 1} of {passages.length}
          </Text>

          <Pressable
            onPress={handleListenModel}
            disabled={audioPlaysLeft <= 0}
            className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
            style={{ backgroundColor: audioPlaysLeft > 0 ? accentColor + '18' : '#E2E8F0' }}
          >
            {isSpeaking ? (
              <ActivityIndicator size={12} color={accentColor} />
            ) : (
              <Ionicons
                name="volume-medium-outline"
                size={14}
                color={audioPlaysLeft > 0 ? accentColor : '#90A4AE'}
              />
            )}
            <Text
              className="text-xs font-semibold"
              style={{ color: audioPlaysLeft > 0 ? accentColor : '#90A4AE' }}
            >
              {isSpeaking
                ? 'Playing…'
                : audioPlaysLeft > 0
                  ? `Listen (${audioPlaysLeft} left)`
                  : 'Max plays reached'}
            </Text>
          </Pressable>
        </View>
      )}

      {/* ── ARRANGING PHASE ─────────────────────────────────────────────────── */}
      {phase === 'arranging' && (
        <>
          {/* Correct feedback banner */}
          {arrangementChecked && arrangementCorrect && (
            <View className="rounded-lg p-3 mb-3 flex-row items-center gap-2" style={{ backgroundColor: '#10B98114' }}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text className="text-xs font-semibold" style={{ color: '#059669' }}>
                Perfect order! Get ready to record…
              </Text>
            </View>
          )}

          {/* Draggable sentence cards */}
          {!arrangementChecked && (
            <>
              <View className="rounded-lg p-3 mb-3 flex-row items-center gap-2" style={{ backgroundColor: accentColor + '0D' }}>
                <Ionicons name="swap-vertical-outline" size={14} color={accentColor} />
                <Text className="text-xs text-text-muted flex-1">
                  Hold the <Ionicons name="menu-outline" size={12} color="#90A4AE" /> handle and drag to reorder.
                </Text>
              </View>
              <Sortable
                data={sortableData}
                enableDynamicHeights
                estimatedItemHeight={64}
                useFlatList={false}
                style={{ marginBottom: 16 }}
                renderItem={({ item, index, ...sortableProps }: SortableRenderItemProps<CardData>) => (
                  <SortableItem
                    key={item.id}
                    {...sortableProps}
                    data={item}
                    onDrop={handleDrop}
                    style={{ marginBottom: 8 }}
                  >
                    <View
                      className="flex-row items-center gap-3 rounded-xl border p-3"
                      style={{ borderColor: '#E2E8F0', backgroundColor: '#FAFAFA' }}
                    >
                      {/* Position badge */}
                      <View
                        className="w-6 h-6 rounded-full items-center justify-center shrink-0"
                        style={{ backgroundColor: accentColor }}
                      >
                        <Text className="text-xs font-bold text-white">{index + 1}</Text>
                      </View>
                      {/* Sentence text */}
                      <Text className="text-sm text-text-primary flex-1 leading-relaxed">
                        {current.sentences[item.sentenceIdx]!}
                      </Text>
                      {/* Per-sentence TTS */}
                      <SpeakWordButton
                        word={current.sentences[item.sentenceIdx]!}
                        accentColor={accentColor}
                      />
                      {/* Drag handle */}
                      <SortableItem.Handle>
                        <View className="pl-1 py-1">
                          <Ionicons name="menu-outline" size={18} color="#90A4AE" />
                        </View>
                      </SortableItem.Handle>
                    </View>
                  </SortableItem>
                )}
              />
            </>
          )}

          {/* Static cards when checked (showing correct/wrong colors + shake) */}
          {arrangementChecked && (
            <View className="gap-2 mb-4">
              {order.map((sentIdx, position) => {
                const isCorrect = positionCorrect[position]!;
                return (
                  <Animated.View
                    key={`checked-${passageIndex}-${position}`}
                    style={{ transform: [{ translateX: shakeAnims[position]! }] }}
                  >
                    <View
                      className="flex-row items-center gap-3 rounded-xl border p-3"
                      style={{
                        borderColor: isCorrect ? '#10B981' : '#EF4444',
                        backgroundColor: isCorrect ? '#10B98108' : '#EF444408',
                      }}
                    >
                      <View
                        className="w-6 h-6 rounded-full items-center justify-center shrink-0"
                        style={{ backgroundColor: isCorrect ? '#10B981' : '#EF4444' }}
                      >
                        <Text className="text-xs font-bold text-white">{position + 1}</Text>
                      </View>
                      <Text className="text-sm text-text-primary flex-1 leading-relaxed">
                        {current.sentences[sentIdx]!}
                      </Text>
                      {isCorrect
                        ? <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                        : <Ionicons name="close-circle" size={16} color="#EF4444" />
                      }
                    </View>
                  </Animated.View>
                );
              })}
            </View>
          )}

          {/* Check Order button */}
          {!arrangementChecked && (
            <Pressable
              className="rounded-xl py-4 items-center mb-2 active:opacity-80"
              style={{ backgroundColor: accentColor }}
              onPress={handleCheckOrder}
            >
              <Text className="text-white font-bold text-base">Check Order</Text>
            </Pressable>
          )}

          {/* Reveal after 3 failed checks */}
          {failedChecks >= 3 && !arrangementChecked && (
            <Pressable
              className="rounded-xl py-3 items-center flex-row justify-center gap-2 active:opacity-80"
              style={{ backgroundColor: '#F97316' + '18', borderWidth: 1, borderColor: '#F97316' }}
              onPress={handleRevealAnswer}
            >
              <Ionicons name="eye-outline" size={16} color="#F97316" />
              <Text className="font-semibold text-sm" style={{ color: '#F97316' }}>Show Correct Order</Text>
            </Pressable>
          )}
        </>
      )}

      {/* ── RECORDING PHASE ─────────────────────────────────────────────────── */}
      {phase === 'recording' && (
        <>
          {/* Passage counter */}
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-xs font-semibold text-text-muted uppercase tracking-wide">
              Passage {passageIndex + 1} of {passages.length}
            </Text>
          </View>

          {/* Correct order reference */}
          <View className="rounded-xl p-4 mb-4" style={{ backgroundColor: accentColor + '0D' }}>
            <Text className="text-xs font-semibold mb-3" style={{ color: accentColor }}>
              Read this passage aloud:
            </Text>
            {current.correctOrder.map((sentIdx, i) => (
              <View key={i} className="flex-row items-start gap-3 mb-2">
                <View
                  className="w-5 h-5 rounded-full items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: accentColor }}
                >
                  <Text className="text-[10px] font-bold text-white">{i + 1}</Text>
                </View>
                <Text className="text-sm text-text-primary flex-1 leading-relaxed">
                  {current.sentences[sentIdx]!}
                </Text>
              </View>
            ))}
          </View>

          {/* No-speech error */}
          {noSpeechError && (
            <View className="rounded-lg p-3 mb-3 flex-row items-center gap-2" style={{ backgroundColor: '#EF444414' }}>
              <Ionicons name="warning-outline" size={14} color="#EF4444" />
              <Text className="text-xs font-semibold" style={{ color: '#DC2626' }}>
                No speech detected — please try again.
              </Text>
            </View>
          )}

          {/* Pulsing mic (while recording) */}
          {isRecording && (
            <View className="items-center mb-4">
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <View
                  className="w-16 h-16 rounded-full items-center justify-center"
                  style={{ backgroundColor: '#EF444420', borderWidth: 2, borderColor: '#EF4444' }}
                >
                  <Ionicons name="mic" size={28} color="#EF4444" />
                </View>
              </Animated.View>
              <Text className="text-sm text-text-muted mt-2 font-mono">
                {formatTime(elapsedSeconds)}
              </Text>
            </View>
          )}

          {/* Start / Stop recording button */}
          <Pressable
            onPress={isRecording ? handleStopRecording : handleStartRecording}
            className="rounded-xl py-4 items-center flex-row justify-center gap-2 mb-2 active:opacity-80"
            style={{
              backgroundColor: isRecording ? '#EF444420' : accentColor,
              borderWidth: isRecording ? 1 : 0,
              borderColor: isRecording ? '#EF4444' : 'transparent',
            }}
          >
            <Ionicons
              name={isRecording ? 'stop-circle' : 'mic-outline'}
              size={18}
              color={isRecording ? '#EF4444' : '#FFFFFF'}
            />
            <Text
              className="font-bold text-base"
              style={{ color: isRecording ? '#EF4444' : '#FFFFFF' }}
            >
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </Text>
          </Pressable>
        </>
      )}

      {/* ── ASSESSING PHASE ─────────────────────────────────────────────────── */}
      {phase === 'assessing' && (
        <View className="items-center py-10 gap-3">
          <ActivityIndicator size="large" color={accentColor} />
          <Text className="text-sm text-text-muted">Analysing your speech…</Text>
        </View>
      )}

      {/* ── RESULT PHASE ────────────────────────────────────────────────────── */}
      {phase === 'result' && (
        <>
          {/* Passage counter */}
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-xs font-semibold text-text-muted uppercase tracking-wide">
              Passage {passageIndex + 1} of {passages.length}
            </Text>
          </View>

          {/* Assessment result card or unavailable message */}
          {assessmentResult ? (
            <AssessmentResultCard
              result={assessmentResult}
              referenceText={correctPassageText}
              accentColor={accentColor}
            />
          ) : (
            <View
              className="rounded-xl border p-4 items-center gap-2 mb-2"
              style={{ borderColor: '#E2E8F0' }}
            >
              <Ionicons name="cloud-offline-outline" size={24} color="#90A4AE" />
              <Text className="text-sm text-text-muted text-center">
                Assessment engine unavailable — model is still loading.
              </Text>
            </View>
          )}

          {/* Playback button */}
          {recordingUri && (
            <Pressable
              onPress={handlePlayback}
              className="flex-row items-center justify-center gap-2 rounded-xl py-3 mt-3 active:opacity-80"
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

          {/* Action buttons */}
          <View className="flex-row gap-2 mt-3">
            <Pressable
              className="flex-1 rounded-xl py-3.5 items-center active:opacity-80"
              style={{ backgroundColor: '#F97316' + '18', borderWidth: 1, borderColor: '#F97316' }}
              onPress={handleRetryPassage}
            >
              <Text className="font-semibold text-sm" style={{ color: '#F97316' }}>Try Again</Text>
            </Pressable>
            <Pressable
              className="flex-1 rounded-xl py-3.5 items-center active:opacity-80"
              style={{ backgroundColor: accentColor }}
              onPress={handleNextPassage}
            >
              <Text className="text-white font-bold text-sm">
                {passageIndex + 1 >= passages.length ? 'Finish' : 'Next Passage →'}
              </Text>
            </Pressable>
          </View>
        </>
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
        <Ionicons name="list-outline" size={18} color={accentColor} />
      </View>
      <Text className="text-base font-bold text-text-primary flex-1">{title}</Text>
    </View>
  );
}
