import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, Pressable, Linking, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import type { WhisperContext, WhisperVadContext } from 'whisper.rn';
import { STRESS_RECORDING_OPTIONS } from '@/lib/stress-recording-options';
import { assessText } from '@/lib/pronunciation-engine';
import type { AssessmentResult } from '@/lib/pronunciation-engine';
import {
  getExpectedStress,
  detectStressFromSamples,
  scoreStress,
  parseStressDisplay,
  type StressInfo,
} from '@/lib/engine/stress-scorer';
import { keepRecording, retryRecording, loadRecordings } from '@/lib/recordings-service';
import { saveAssessment, getAssessments, deleteAssessment } from '@/lib/db';
import AssessmentResultCard from './AssessmentResultCard';
import SpeakWordButton from '@/components/ui/SpeakWordButton';

// ─── Types ───────────────────────────────────────────────────────────────────

interface StressDrillActivityProps {
  activityTitle: string;
  direction: string;
  words: string[];
  passThreshold: number;
  accentColor?: string;
  studentId?: string;
  activityId?: string;
  whisperCtx?: WhisperContext;
  vadCtx?: WhisperVadContext | null;
  onComplete?: (score: number) => void;
}

interface StressResult {
  detected: number;
  expected: number;
  score: number;
  stressInfo: StressInfo;
}

type Status = 'idle' | 'recording' | 'assessing' | 'review';

/** Strip stress annotations like "reLAX" → "relax", "obJECT (verb)" → "object" */
function cleanWord(word: string): string {
  return word.replace(/\s*\(.*?\)\s*/g, '').toLowerCase().trim();
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function StressDrillActivity({
  activityTitle,
  direction,
  words,
  passThreshold,
  accentColor = '#2196F3',
  studentId,
  activityId,
  whisperCtx,
  vadCtx,
  onComplete,
}: StressDrillActivityProps) {
  const isAssessed = passThreshold > 0 && !!whisperCtx;

  // ─── Per-word state ──────────────────────────────────────────────────────
  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState<Status>('idle');
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null);
  const [stressResult, setStressResult] = useState<StressResult | null>(null);
  const [combinedScore, setCombinedScore] = useState(0);
  const [passed, setPassed] = useState(false);
  const [noSpeech, setNoSpeech] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [playingBack, setPlayingBack] = useState(false);

  // ─── Global state ────────────────────────────────────────────────────────
  const [finished, setFinished] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  // ─── Refs ────────────────────────────────────────────────────────────────
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const dbSamplesRef = useRef<number[]>([]);
  const scoresRef = useRef<number[]>([]);
  const completedCountRef = useRef(0);

  // ─── Derived ─────────────────────────────────────────────────────────────
  const currentWord = words[currentIndex]!;
  const clean = useMemo(() => cleanWord(currentWord), [currentWord]);
  const stressDisplay = useMemo(() => parseStressDisplay(currentWord), [currentWord]);
  const stressInfo = useMemo(() => getExpectedStress(clean), [clean]);

  // Get syllable labels for the bubbles display
  const syllableLabels = useMemo(() => {
    if (!stressInfo) return [];
    const { before, stressed, after } = stressDisplay;
    // Approximate syllable breakdown from display parts
    // For 2-syllable words this is exact; for 3+ we split before/after evenly
    const labels: string[] = [];
    if (before) labels.push(before);
    if (stressed) labels.push(stressed);
    if (after) labels.push(after);
    // If labels don't match syllableCount, pad or collapse
    while (labels.length < stressInfo.syllableCount) labels.push('·');
    return labels.slice(0, stressInfo.syllableCount);
  }, [stressInfo, stressDisplay]);

  // ─── Init ────────────────────────────────────────────────────────────────

  useEffect(() => {
    Audio.requestPermissionsAsync().then(({ granted }) => setPermissionGranted(granted));
    return () => {
      soundRef.current?.unloadAsync();
      recordingRef.current?.stopAndUnloadAsync();
    };
  }, []);

  // Restore saved progress on mount
  useEffect(() => {
    if (!studentId || !activityId) return;
    Promise.all([
      loadRecordings(studentId, activityId),
      isAssessed ? getAssessments(studentId, activityId) : Promise.resolve([]),
    ]).then(([savedRecordings, assessmentRows]) => {
      // Find how many words are already completed
      let firstIncomplete = 0;
      for (let i = 0; i < words.length; i++) {
        if (savedRecordings[i] !== undefined && assessmentRows.find((r) => r.prompt_index === i)) {
          firstIncomplete = i + 1;
          completedCountRef.current = i + 1;
          const row = assessmentRows.find((r) => r.prompt_index === i);
          if (row) scoresRef.current[i] = row.phonics_score;
        } else break;
      }
      if (firstIncomplete >= words.length) {
        setFinished(true);
        const scores = scoresRef.current.filter((s) => s !== undefined);
        if (scores.length > 0) onComplete?.(Math.round(scores.reduce((a, b) => a + b, 0) / scores.length));
      } else if (firstIncomplete > 0) {
        setCurrentIndex(firstIncomplete);
      }
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Recording ───────────────────────────────────────────────────────────

  async function handleRecord() {
    if (status === 'idle') {
      try {
        if (soundRef.current) { await soundRef.current.unloadAsync(); soundRef.current = null; setPlayingBack(false); }
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

        const recording = new Audio.Recording();
        dbSamplesRef.current = [];

        // Set up metering callback BEFORE prepare (per expo-av docs)
        recording.setOnRecordingStatusUpdate((s) => {
          if (s.isRecording && typeof s.metering === 'number') {
            dbSamplesRef.current.push(s.metering);
          }
        });

        await recording.prepareToRecordAsync(STRESS_RECORDING_OPTIONS);
        recording.setProgressUpdateInterval(50); // 50ms → ~20 samples/sec

        await recording.startAsync();
        recordingRef.current = recording;
        setNoSpeech(false);
        setAssessment(null);
        setStressResult(null);
        setStatus('recording');
      } catch { /* ignore */ }
    } else if (status === 'recording') {
      try {
        const uri = recordingRef.current?.getURI() ?? null;
        try { await recordingRef.current?.stopAndUnloadAsync(); } finally { recordingRef.current = null; }

        if (!uri) { setStatus('idle'); return; }

        let savedUri = uri;
        if (studentId && activityId) {
          try {
            savedUri = await keepRecording(studentId, activityId, currentIndex, uri);
          } catch {
            setStatus('idle');
            return;
          }
        }

        setRecordingUri(savedUri);
        setStatus('assessing');

        // ─── Assessment ──────────────────────────────────────────────
        if (isAssessed) {
          try {
            const result = await assessText(whisperCtx!, savedUri, clean, vadCtx);

            if (result.noSpeechDetected) {
              if (studentId && activityId) await retryRecording(studentId, activityId, currentIndex).catch(() => {});
              setRecordingUri(null);
              setNoSpeech(true);
              setStatus('idle');
              return;
            }

            // Stress analysis
            let stScore: number | null = null;
            let stResult: StressResult | null = null;

            if (stressInfo && dbSamplesRef.current.length >= 4) {
              const detectedIdx = detectStressFromSamples(dbSamplesRef.current, stressInfo.syllableCount);
              stScore = scoreStress(detectedIdx, stressInfo.stressedSyllableIndex);
              stResult = {
                detected: detectedIdx,
                expected: stressInfo.stressedSyllableIndex,
                score: stScore,
                stressInfo,
              };
            }

            // Combined score
            const combo = stScore !== null
              ? Math.round(result.phonicsScore * 0.65 + stScore * 0.35)
              : result.phonicsScore;
            const didPass = combo >= passThreshold;

            // Save to DB
            if (studentId && activityId) {
              await saveAssessment({
                id: `${studentId}_${activityId}_${currentIndex}`,
                student_id: studentId,
                activity_id: activityId,
                prompt_index: currentIndex,
                phonics_score: combo,
                transcript: result.transcript,
                errors: JSON.stringify(result.errors),
                created_at: new Date().toISOString(),
              });
            }

            setAssessment(result);
            setStressResult(stResult);
            setCombinedScore(combo);
            setPassed(didPass);
            setStatus('review');
          } catch {
            setStatus('review');
          }
        } else {
          setCombinedScore(100);
          setPassed(true);
          setStatus('review');
        }
      } catch { /* ignore */ }
    }
  }

  // ─── Navigation ──────────────────────────────────────────────────────────

  function handleNext() {
    scoresRef.current[currentIndex] = combinedScore;
    completedCountRef.current = currentIndex + 1;
    const nextIdx = currentIndex + 1;
    if (nextIdx >= words.length) {
      setFinished(true);
      const scores = scoresRef.current.filter((s) => s !== undefined);
      const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 100;
      onComplete?.(avg);
    } else {
      setCurrentIndex(nextIdx);
      resetPerWordState();
    }
  }

  async function handleRetry() {
    if (playingBack) { await soundRef.current?.unloadAsync(); soundRef.current = null; setPlayingBack(false); }
    if (studentId && activityId) {
      await retryRecording(studentId, activityId, currentIndex).catch(() => {});
      await deleteAssessment(studentId, activityId, currentIndex).catch(() => {});
    }
    resetPerWordState();
  }

  function resetPerWordState() {
    setStatus('idle');
    setAssessment(null);
    setStressResult(null);
    setCombinedScore(0);
    setPassed(false);
    setNoSpeech(false);
    setRecordingUri(null);
    setPlayingBack(false);
    dbSamplesRef.current = [];
  }

  // ─── Playback ────────────────────────────────────────────────────────────

  async function handlePlayback() {
    if (!recordingUri) return;
    if (soundRef.current) { await soundRef.current.unloadAsync(); soundRef.current = null; }
    if (playingBack) { setPlayingBack(false); return; }
    try {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync({ uri: recordingUri });
      soundRef.current = sound;
      setPlayingBack(true);
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((s) => {
        if (s.isLoaded && s.didJustFinish) setPlayingBack(false);
      });
    } catch { setPlayingBack(false); }
  }

  // ─── Permission denied ──────────────────────────────────────────────────

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

  // ─── Finished state ─────────────────────────────────────────────────────

  if (finished) {
    const scores = scoresRef.current.filter((s) => s !== undefined);
    const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 100;
    const passedCount = scores.filter((s) => s >= passThreshold).length;
    return (
      <View className="bg-white rounded-2xl border border-border p-5 mb-3">
        <ActivityHeader title={activityTitle} accentColor={accentColor} />
        <View className="items-center py-4">
          <View
            className="w-16 h-16 rounded-full items-center justify-center mb-3"
            style={{ backgroundColor: avg >= 70 ? '#10B98120' : '#EF444420' }}
          >
            <Ionicons
              name={avg >= 70 ? 'checkmark-circle' : 'close-circle'}
              size={36}
              color={avg >= 70 ? '#10B981' : '#EF4444'}
            />
          </View>
          <Text className="text-xl font-bold text-text-primary mb-1">
            {avg >= 70 ? 'Well done!' : 'Keep practicing!'}
          </Text>
          <Text className="text-sm text-text-muted mb-3">
            {passedCount} of {words.length} words passed
          </Text>
          <View
            className="rounded-full px-5 py-2"
            style={{ backgroundColor: avg >= 70 ? '#10B98120' : '#EF444420' }}
          >
            <Text
              className="text-base font-bold"
              style={{ color: avg >= 70 ? '#10B981' : '#EF4444' }}
            >
              Score: {avg}%
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // ─── Main render ────────────────────────────────────────────────────────

  const isRecording = status === 'recording';
  const isAssessing = status === 'assessing';
  const isReview = status === 'review';
  const comboColor = combinedScore >= 90 ? '#10B981' : combinedScore >= 61 ? '#84CC16' : combinedScore >= 31 ? '#F97316' : '#991B1B';

  return (
    <View className="bg-white rounded-2xl border border-border p-5 mb-3">
      <ActivityHeader title={activityTitle} accentColor={accentColor} />

      {/* Direction */}
      <Text className="text-sm text-text-secondary mb-4 leading-relaxed" style={{ textAlign: 'justify' }}>{direction}</Text>

      {/* Progress */}
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-xs text-text-muted">
          Word {currentIndex + 1} of {words.length}
        </Text>
        <View className="flex-row gap-1">
          {words.map((_, i) => (
            <View
              key={i}
              className="h-1.5 rounded-full"
              style={{
                width: i === currentIndex ? 20 : 8,
                backgroundColor:
                  i < currentIndex ? accentColor
                    : i === currentIndex ? accentColor + '60'
                    : '#E2E8F0',
              }}
            />
          ))}
        </View>
      </View>

      {/* Word prompt box */}
      <View
        className="rounded-xl p-5 mb-4 items-center"
        style={{ backgroundColor: accentColor + '0D' }}
      >
        <View className="flex-row items-center gap-3 mb-2">
          <SpeakWordButton word={clean} accentColor={accentColor} />
          <Text className="text-xl">
            {stressDisplay.before ? (
              <Text className="text-text-muted">{stressDisplay.before}</Text>
            ) : null}
            <Text style={{ fontWeight: 'bold', color: accentColor, textDecorationLine: 'underline' }}>
              {stressDisplay.stressed}
            </Text>
            {stressDisplay.after ? (
              <Text className="text-text-muted">{stressDisplay.after}</Text>
            ) : null}
          </Text>
        </View>
        <Text className="text-xs text-text-muted">Tap speaker to hear, then record</Text>
      </View>

      {/* No speech banner */}
      {noSpeech && status === 'idle' && (
        <View className="rounded-lg px-2 py-1.5 mb-3" style={{ backgroundColor: '#F9731618' }}>
          <Text className="text-xs text-center font-semibold" style={{ color: '#EA580C' }}>
            No speech detected — try again
          </Text>
        </View>
      )}

      {/* Record / Stop button */}
      {(status === 'idle' || isRecording) && (
        <Pressable
          className="rounded-xl py-4 items-center flex-row justify-center gap-2 mb-3"
          style={{ backgroundColor: isRecording ? '#EF444420' : accentColor }}
          onPress={handleRecord}
        >
          <Ionicons
            name={isRecording ? 'stop-circle' : 'mic-outline'}
            size={20}
            color={isRecording ? '#EF4444' : '#fff'}
          />
          <Text className="font-bold text-base" style={{ color: isRecording ? '#EF4444' : '#fff' }}>
            {isRecording ? 'Stop Recording' : 'Record'}
          </Text>
        </Pressable>
      )}

      {/* Assessing spinner */}
      {isAssessing && (
        <View className="items-center py-6 gap-2">
          <ActivityIndicator size="large" color={accentColor} />
          <Text className="text-sm text-text-muted">Analysing pronunciation and stress…</Text>
        </View>
      )}

      {/* Review state */}
      {isReview && (
        <>
          {/* Phoneme assessment card (same as Chapter 1) */}
          {assessment && (
            <AssessmentResultCard
              result={assessment}
              referenceText={clean}
              accentColor={accentColor}
            />
          )}

          {/* Stress Placement card */}
          <StressPlacementCard
            stressResult={stressResult}
            stressInfo={stressInfo}
            syllableLabels={syllableLabels}
            accentColor={accentColor}
          />

          {/* Combined score bar */}
          <View className="rounded-xl border p-3 mt-2" style={{ borderColor: comboColor + '40', backgroundColor: comboColor + '08' }}>
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-sm font-bold" style={{ color: comboColor }}>
                Overall: {combinedScore}%
              </Text>
              <Text className="text-xs text-text-muted">
                {passed ? 'Passed!' : `Need ≥${passThreshold}%`}
              </Text>
            </View>
            <View className="h-2 rounded-full bg-surface-page overflow-hidden">
              <View className="h-full rounded-full" style={{ width: `${combinedScore}%`, backgroundColor: comboColor }} />
            </View>
          </View>

          {/* Action buttons */}
          <View className="flex-row flex-wrap gap-2 mt-3">
            {recordingUri && (
              <Pressable
                onPress={handlePlayback}
                className="flex-row items-center gap-1.5 rounded-full px-4 py-2"
                style={{ backgroundColor: playingBack ? '#EF444420' : accentColor + '18' }}
              >
                <Ionicons name={playingBack ? 'stop-circle' : 'play-circle'} size={16} color={playingBack ? '#EF4444' : accentColor} />
                <Text className="text-xs font-semibold" style={{ color: playingBack ? '#EF4444' : accentColor }}>
                  {playingBack ? 'Stop' : 'Play Back'}
                </Text>
              </Pressable>
            )}
            {passed ? (
              <Pressable
                className="flex-1 rounded-xl py-3 items-center active:opacity-80"
                style={{ backgroundColor: accentColor }}
                onPress={handleNext}
              >
                <Text className="text-white font-bold text-base">
                  {currentIndex + 1 >= words.length ? 'See Results' : 'Next →'}
                </Text>
              </Pressable>
            ) : (
              <Pressable
                className="flex-1 rounded-xl py-3 items-center active:opacity-70 border-2"
                style={{ borderColor: accentColor }}
                onPress={handleRetry}
              >
                <Text className="font-bold text-base" style={{ color: accentColor }}>Try Again</Text>
              </Pressable>
            )}
          </View>
        </>
      )}
    </View>
  );
}

// ─── Stress Placement Card ─────────────────────────────────────────────────

function StressPlacementCard({
  stressResult,
  stressInfo,
  syllableLabels,
  accentColor,
}: {
  stressResult: StressResult | null;
  stressInfo: StressInfo | null;
  syllableLabels: string[];
  accentColor: string;
}) {
  if (!stressInfo) {
    return (
      <View className="rounded-xl border border-border p-3 mt-2" style={{ backgroundColor: '#F8FFFE' }}>
        <Text className="text-xs text-text-muted text-center">
          Stress detection not available for this word — scored on pronunciation only
        </Text>
      </View>
    );
  }

  const isCorrect = stressResult ? stressResult.score === 100 : false;
  const stressScore = stressResult?.score ?? 0;
  const borderColor = isCorrect ? '#10B981' : '#F97316';

  return (
    <View className="rounded-xl border p-3 mt-2" style={{ borderColor: borderColor + '40', backgroundColor: borderColor + '08' }}>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-xs font-bold text-text-primary">Stress Placement</Text>
        <View className="flex-row items-center gap-1">
          <Text className="text-xs font-bold" style={{ color: borderColor }}>{stressScore}%</Text>
          <Ionicons
            name={isCorrect ? 'checkmark-circle' : 'close-circle'}
            size={14}
            color={borderColor}
          />
        </View>
      </View>

      {/* Syllable bubbles */}
      <View className="flex-row justify-center gap-2 mb-3">
        {syllableLabels.map((label, i) => {
          const isExpected = i === stressInfo.stressedSyllableIndex;
          const isDetected = stressResult ? i === stressResult.detected : false;
          const isWrongDetected = isDetected && !isExpected;

          let bgColor = '#E2E8F010';
          let borderCol = '#E2E8F0';
          let textColor = '#90A4AE';

          if (isExpected && isCorrect) {
            bgColor = '#10B98120';
            borderCol = '#10B981';
            textColor = '#059669';
          } else if (isExpected) {
            bgColor = '#10B98115';
            borderCol = '#10B981';
            textColor = '#059669';
          }
          if (isWrongDetected) {
            bgColor = '#F9731620';
            borderCol = '#F97316';
            textColor = '#EA580C';
          }

          return (
            <View
              key={i}
              className="rounded-xl px-4 py-2 border-2 items-center"
              style={{ backgroundColor: bgColor, borderColor: borderCol }}
            >
              <Text className="text-sm font-bold" style={{ color: textColor }}>
                {label}
              </Text>
              {isExpected && (
                <Text style={{ fontSize: 8, color: '#10B981', marginTop: 2 }}>expected</Text>
              )}
              {isWrongDetected && (
                <Text style={{ fontSize: 8, color: '#F97316', marginTop: 2 }}>you said</Text>
              )}
            </View>
          );
        })}
      </View>

      {/* Feedback text */}
      {stressResult && (
        <Text className="text-xs leading-relaxed text-center" style={{ color: isCorrect ? '#059669' : '#EA580C' }}>
          {isCorrect
            ? 'You stressed the right syllable!'
            : `You stressed "${syllableLabels[stressResult.detected] ?? '?'}" — aim for "${syllableLabels[stressResult.expected] ?? '?'}" (say it louder and longer).`}
        </Text>
      )}
    </View>
  );
}

// ─── Activity Header ───────────────────────────────────────────────────────

function ActivityHeader({ title, accentColor }: { title: string; accentColor: string }) {
  return (
    <View className="flex-row items-center gap-3 mb-4">
      <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: accentColor + '18' }}>
        <Ionicons name="mic-outline" size={18} color={accentColor} />
      </View>
      <Text className="text-base font-bold text-text-primary flex-1">{title}</Text>
    </View>
  );
}
