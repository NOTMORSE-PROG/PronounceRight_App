import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, Platform, Linking, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import type { WhisperContext, WhisperVadContext } from 'whisper.rn';
import type { MinimalPairItem } from '@/types/content';
import { assessMinimalPair } from '@/lib/pronunciation-engine';
import type { AssessmentResult } from '@/lib/pronunciation-engine';
import { keepRecording, loadRecordings, retryRecording } from '@/lib/recordings-service';
import { saveAssessment, getAssessments, deleteAssessment } from '@/lib/db';
import { generateMinimalPairFeedback } from '@/lib/engine/minimal-pair-feedback';
import type { MinimalPairFeedback } from '@/lib/engine/minimal-pair-feedback';
import AssessmentResultCard from './AssessmentResultCard';
import MinimalPairContrastCard from './MinimalPairContrastCard';

interface MinimalPairActivityProps {
  activityTitle: string;
  direction: string;
  items: MinimalPairItem[];
  passThreshold: number;
  accentColor?: string;
  studentId?: string;
  activityId?: string;
  whisperCtx?: WhisperContext;
  vadCtx?: WhisperVadContext | null;
  onComplete?: (score: number) => void;
}

type SideStatus = 'idle' | 'recording' | 'assessing' | 'review' | 'kept';

interface SideState {
  status: SideStatus;
  recordingUri: string | null;
  assessment: AssessmentResult | null;
  feedback: MinimalPairFeedback | null;
  noSpeechMsg: boolean;
}

const INITIAL_SIDE: SideState = { status: 'idle', recordingUri: null, assessment: null, feedback: null, noSpeechMsg: false };

export default function MinimalPairActivity({
  activityTitle,
  direction,
  items,
  passThreshold,
  accentColor = '#2196F3',
  studentId,
  activityId,
  whisperCtx,
  vadCtx,
  onComplete,
}: MinimalPairActivityProps) {
  const [pairIndex, setPairIndex] = useState(0);
  const [sideA, setSideA] = useState<SideState>(INITIAL_SIDE);
  const [sideB, setSideB] = useState<SideState>(INITIAL_SIDE);
  const [pairSubmitted, setPairSubmitted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [playingSide, setPlayingSide] = useState<'A' | 'B' | null>(null);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  // Accumulate phonics scores of every kept recording, averaged at finish
  const keptScoresRef = useRef<number[]>([]);

  useEffect(() => {
    Audio.requestPermissionsAsync().then(({ granted }) => setPermissionGranted(granted));
    return () => { soundRef.current?.unloadAsync(); };
  }, []);

  // Restore saved state on mount
  useEffect(() => {
    if (!studentId || !activityId) return;
    Promise.all([
      loadRecordings(studentId, activityId),
      getAssessments(studentId, activityId),
    ]).then(([recordings, assessmentRows]) => {
      let resumeIdx = 0;
      for (let i = 0; i < items.length; i++) {
        if (recordings[i * 2] !== undefined && recordings[i * 2 + 1] !== undefined) {
          resumeIdx = i + 1;
        } else {
          break;
        }
      }
      resumeIdx = Math.min(resumeIdx, items.length - 1);
      setPairIndex(resumeIdx);

      const uriA = recordings[resumeIdx * 2];
      const uriB = recordings[resumeIdx * 2 + 1];
      const rowA = assessmentRows.find((r) => r.prompt_index === resumeIdx * 2);
      const rowB = assessmentRows.find((r) => r.prompt_index === resumeIdx * 2 + 1);

      if (uriA) setSideA({ status: 'kept', recordingUri: uriA, assessment: rowA ? parseAssessmentRow(rowA) : null, feedback: null, noSpeechMsg: false });
      if (uriB) setSideB({ status: 'kept', recordingUri: uriB, assessment: rowB ? parseAssessmentRow(rowB) : null, feedback: null, noSpeechMsg: false });
    }).catch(() => {/* ignore */});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = items[pairIndex]!;
  const bothKept    = sideA.status === 'kept' && sideB.status === 'kept';
  const sideAPassed = sideA.assessment?.passed ?? false;
  const sideBPassed = sideB.assessment?.passed ?? false;
  const bothPassed  = sideAPassed && sideBPassed;
  // Disable the Speak button on the idle side while the other side is busy
  const isABusy = sideA.status === 'recording' || sideA.status === 'assessing';
  const isBBusy = sideB.status === 'recording' || sideB.status === 'assessing';

  // ── Recording ────────────────────────────────────────────────────────────────

  async function handleRecord(side: 'A' | 'B') {
    const sideState = side === 'A' ? sideA : sideB;
    const setSide   = side === 'A' ? setSideA : setSideB;
    const refWord   = side === 'A' ? current.wordA : current.wordB;
    const otherWord = side === 'A' ? current.wordB : current.wordA;
    const promptIdx = pairIndex * 2 + (side === 'A' ? 0 : 1);

    if (sideState.status === 'idle') {
      try {
        // Stop any playing audio first
        if (soundRef.current) { await soundRef.current.unloadAsync(); soundRef.current = null; setPlayingSide(null); }
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        recordingRef.current = recording;
        setSide((s) => ({ ...s, status: 'recording', noSpeechMsg: false }));
      } catch { /* ignore */ }

    } else if (sideState.status === 'recording') {
      try {
        const uri = recordingRef.current?.getURI() ?? null;
        await recordingRef.current?.stopAndUnloadAsync();
        recordingRef.current = null;
        if (!uri) { setSide((s) => ({ ...s, status: 'idle' })); return; }

        setSide((s) => ({ ...s, status: 'assessing', recordingUri: uri }));

        let savedUri = uri;
        if (studentId && activityId) {
          savedUri = await keepRecording(studentId, activityId, promptIdx, uri);
        }

        if (whisperCtx) {
          const result = await assessMinimalPair(whisperCtx, savedUri, refWord, otherWord, vadCtx);

          if (result.noSpeechDetected || result.hallucination) {
            if (studentId && activityId) {
              await retryRecording(studentId, activityId, promptIdx).catch(() => {/* ignore */});
            }
            setSide({ status: 'idle', recordingUri: null, assessment: null, feedback: null, noSpeechMsg: true });
            return;
          }

          if (studentId && activityId) {
            await saveAssessment({
              id: `${studentId}_${activityId}_${promptIdx}`,
              student_id: studentId,
              activity_id: activityId,
              prompt_index: promptIdx,
              phonics_score: result.phonicsScore,
              transcript: result.transcript,
              errors: JSON.stringify(result.errors),
              created_at: new Date().toISOString(),
            });
          }

          // Generate dynamic feedback
          const fb = generateMinimalPairFeedback(
            refWord, otherWord, result.phonicsScore, result.transcript,
            result.confusedWithPairWord, result.hallucination, result.passed,
          );

          // Track score for final average
          keptScoresRef.current.push(result.phonicsScore);

          setSide({ status: 'review', recordingUri: savedUri, assessment: result, feedback: fb, noSpeechMsg: false });
        } else {
          setSide({ status: 'review', recordingUri: savedUri, assessment: null, feedback: null, noSpeechMsg: false });
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('[MinimalPair] recording/assessment error:', e);
        setSide((s) => ({ ...s, status: 'idle' }));
      }
    }
  }

  // ── Playback ─────────────────────────────────────────────────────────────────

  async function handlePlayback(side: 'A' | 'B') {
    const uri = side === 'A' ? sideA.recordingUri : sideB.recordingUri;
    if (!uri) return;

    if (soundRef.current) { await soundRef.current.unloadAsync(); soundRef.current = null; }
    if (playingSide === side) { setPlayingSide(null); return; }

    try {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync({ uri });
      soundRef.current = sound;
      setPlayingSide(side);
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((s) => {
        if (s.isLoaded && s.didJustFinish) setPlayingSide(null);
      });
    } catch { setPlayingSide(null); }
  }

  // ── Keep / Retry / Submit / Next ──────────────────────────────────────────────

  function handleKeep(side: 'A' | 'B') {
    const setSide = side === 'A' ? setSideA : setSideB;
    setSide((s) => ({ ...s, status: 'kept' }));
  }

  async function handleRetry(side: 'A' | 'B') {
    const promptIdx = pairIndex * 2 + (side === 'A' ? 0 : 1);
    if (playingSide === side) {
      await soundRef.current?.unloadAsync();
      soundRef.current = null;
      setPlayingSide(null);
    }
    if (studentId && activityId) {
      await retryRecording(studentId, activityId, promptIdx).catch(() => {/* ignore */});
      await deleteAssessment(studentId, activityId, promptIdx).catch(() => {/* ignore */});
    }
    const setSide = side === 'A' ? setSideA : setSideB;
    setSide({ status: 'idle', recordingUri: null, assessment: null, feedback: null, noSpeechMsg: false });
    if (pairSubmitted) setPairSubmitted(false);
  }

  function handleSubmitPair() {
    setPairSubmitted(true);
  }

  function handleNextPair() {
    const nextIdx = pairIndex + 1;
    if (nextIdx >= items.length) {
      setFinished(true);
      // Average of all kept phonics scores across the whole activity
      const scores = keptScoresRef.current;
      const avg = scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;
      onComplete?.(avg);
    } else {
      setPairIndex(nextIdx);
      setSideA(INITIAL_SIDE);
      setSideB(INITIAL_SIDE);
      setPairSubmitted(false);
    }
  }

  // ── Guards ───────────────────────────────────────────────────────────────────

  if (permissionGranted === false) {
    return (
      <View className="bg-white rounded-2xl border border-border p-5 mb-3">
        <ActivityHeader title={activityTitle} accentColor={accentColor} />
        <View className="items-center py-4 gap-3">
          <Ionicons name="mic-off-outline" size={36} color="#90A4AE" />
          <Text className="text-sm text-text-secondary text-center">
            Microphone access is required for this activity.
          </Text>
          <Pressable className="rounded-xl px-6 py-3" style={{ backgroundColor: accentColor }} onPress={() => Linking.openSettings()}>
            <Text className="text-white font-semibold text-sm">Open Settings</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (finished) {
    return (
      <View className="bg-white rounded-2xl border border-border p-5 mb-3">
        <ActivityHeader title={activityTitle} accentColor={accentColor} />
        <View className="items-center py-4">
          <Ionicons name="checkmark-circle" size={48} color="#10B981" />
          <Text className="text-xl font-bold text-text-primary mt-3 mb-1">All Pairs Done!</Text>
          <Text className="text-sm text-text-muted">{items.length} of {items.length} pairs completed</Text>
        </View>
      </View>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <View className="bg-white rounded-2xl border border-border p-5 mb-3">
      <ActivityHeader title={activityTitle} accentColor={accentColor} />

      <Text className="text-sm text-text-secondary mb-4 leading-relaxed" style={{ textAlign: 'justify' }}>
        {direction}
      </Text>

      {/* Progress bar */}
      <View className="mb-4">
        <View className="flex-row items-center justify-between mb-1.5">
          <Text className="text-xs font-semibold text-text-muted uppercase tracking-wide">
            Pair {pairIndex + 1} of {items.length}
          </Text>
          <Text className="text-xs font-semibold" style={{ color: accentColor }}>
            {Math.round((pairIndex / items.length) * 100)}%
          </Text>
        </View>
        <View className="h-1.5 rounded-full bg-surface-page overflow-hidden">
          <View className="h-full rounded-full" style={{ width: `${(pairIndex / items.length) * 100}%`, backgroundColor: accentColor }} />
        </View>
      </View>

      {/* Word cards */}
      <View className="flex-row items-start gap-3 mb-3">
        <WordCard
          word={current.wordA}
          ipa={current.ipaA}
          side="A"
          sideState={sideA}
          accentColor={accentColor}
          isPlaying={playingSide === 'A'}
          disabled={isBBusy}
          onRecord={() => handleRecord('A')}
          onPlayback={() => handlePlayback('A')}
          onKeep={() => handleKeep('A')}
          onRetry={() => handleRetry('A')}
        />

        <View className="items-center justify-center pt-10">
          <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: accentColor + '18' }}>
            <Text className="text-xs font-bold" style={{ color: accentColor }}>vs</Text>
          </View>
        </View>

        <WordCard
          word={current.wordB}
          ipa={current.ipaB}
          side="B"
          sideState={sideB}
          accentColor={accentColor}
          isPlaying={playingSide === 'B'}
          disabled={isABusy}
          onRecord={() => handleRecord('B')}
          onPlayback={() => handlePlayback('B')}
          onKeep={() => handleKeep('B')}
          onRetry={() => handleRetry('B')}
        />
      </View>

      {/* Submit — only when both kept and not yet submitted */}
      {bothKept && !pairSubmitted && (
        <Pressable
          className="rounded-xl py-4 items-center active:opacity-80"
          style={{ backgroundColor: accentColor }}
          onPress={handleSubmitPair}
        >
          <Text className="text-white font-bold text-base">Submit Pair</Text>
        </Pressable>
      )}

      {/* Analysis section — shown after Submit */}
      {pairSubmitted && (
        <View className="rounded-2xl border border-border p-4 mt-1" style={{ backgroundColor: '#F8FFFE' }}>

          {/* Header */}
          <View className="flex-row items-center gap-2 mb-4">
            <View className="w-8 h-8 rounded-xl items-center justify-center" style={{ backgroundColor: accentColor + '18' }}>
              <Ionicons name="analytics-outline" size={16} color={accentColor} />
            </View>
            <Text className="text-sm font-bold text-text-primary">Pair Analysis</Text>
          </View>

          {/* Minimal pair contrast card */}
          <MinimalPairContrastCard
            wordA={current.wordA}
            ipaA={current.ipaA}
            wordB={current.wordB}
            ipaB={current.ipaB}
            accentColor={accentColor}
          />

          {/* Word A result */}
          <View className="mb-4">
            <Text className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
              {current.wordA}
            </Text>
            {sideA.assessment ? (
              <AssessmentResultCard result={sideA.assessment} referenceText={current.wordA} accentColor={accentColor} feedback={sideA.feedback ?? undefined} />
            ) : (
              <Text className="text-xs text-text-muted italic">No assessment available</Text>
            )}
          </View>

          {/* Divider */}
          <View className="h-px bg-border mb-4" />

          {/* Word B result */}
          <View className="mb-4">
            <Text className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
              {current.wordB}
            </Text>
            {sideB.assessment ? (
              <AssessmentResultCard result={sideB.assessment} referenceText={current.wordB} accentColor={accentColor} feedback={sideB.feedback ?? undefined} />
            ) : (
              <Text className="text-xs text-text-muted italic">No assessment available</Text>
            )}
          </View>

          {/* Next Pair — only when both sides passed */}
          {bothPassed ? (
            <Pressable
              className="rounded-xl py-4 items-center active:opacity-80"
              style={{ backgroundColor: accentColor }}
              onPress={handleNextPair}
            >
              <Text className="text-white font-bold text-base">
                {pairIndex + 1 >= items.length ? 'Finish' : 'Next Pair →'}
              </Text>
            </Pressable>
          ) : (
            <View className="gap-2">
              <View className="rounded-lg px-3 py-2.5" style={{ backgroundColor: '#F9731615' }}>
                <Text className="text-xs text-center font-semibold" style={{ color: '#EA580C' }}>
                  {/* Use feedback encouragement if available, otherwise generic message */}
                  {(!sideAPassed && sideA.feedback?.encouragement) || (!sideBPassed && sideB.feedback?.encouragement) || 'Re-record to pass before continuing (need ≥90%)'}
                </Text>
              </View>
              <View className="flex-row gap-2">
                {!sideAPassed && (
                  <Pressable
                    className="flex-1 rounded-xl py-3 items-center flex-row justify-center gap-1.5 border border-border"
                    style={{ backgroundColor: '#EF444410' }}
                    onPress={() => handleRetry('A')}
                  >
                    <Ionicons name="refresh-outline" size={13} color="#EF4444" />
                    <Text className="text-xs font-semibold" style={{ color: '#EF4444' }}>
                      Re-record "{current.wordA}"
                    </Text>
                  </Pressable>
                )}
                {!sideBPassed && (
                  <Pressable
                    className="flex-1 rounded-xl py-3 items-center flex-row justify-center gap-1.5 border border-border"
                    style={{ backgroundColor: '#EF444410' }}
                    onPress={() => handleRetry('B')}
                  >
                    <Ionicons name="refresh-outline" size={13} color="#EF4444" />
                    <Text className="text-xs font-semibold" style={{ color: '#EF4444' }}>
                      Re-record "{current.wordB}"
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ─── WordCard ─────────────────────────────────────────────────────────────────

function WordCard({
  word,
  ipa,
  sideState,
  accentColor,
  isPlaying,
  disabled,
  onRecord,
  onPlayback,
  onKeep,
  onRetry,
}: {
  word: string;
  ipa: string;
  side: 'A' | 'B';
  sideState: SideState;
  accentColor: string;
  isPlaying: boolean;
  disabled: boolean;
  onRecord: () => void;
  onPlayback: () => void;
  onKeep: () => void;
  onRetry: () => void;
}) {
  const { status, noSpeechMsg } = sideState;
  const isIdle      = status === 'idle';
  const isRecording = status === 'recording';
  const isAssessing = status === 'assessing';
  const isReview    = status === 'review';
  const isKept      = status === 'kept';

  const borderColor =
    isKept      ? '#10B981'
    : isReview  ? accentColor + '80'
    : isRecording ? '#EF4444'
    : '#BBDEFB';

  const bgColor =
    isKept      ? '#10B98108'
    : isReview  ? accentColor + '08'
    : isRecording ? '#EF444408'
    : '#F8FFFE';

  return (
    <View className="flex-1 rounded-2xl border p-4 items-center" style={{ borderColor, backgroundColor: bgColor }}>
      {/* Word + IPA */}
      <Text className="text-2xl font-bold text-text-primary mb-1">{word}</Text>
      <Text
        className="text-xs text-text-muted mb-3"
        style={{ fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier' }}
      >
        {ipa}
      </Text>

      {/* No-speech message */}
      {noSpeechMsg && (
        <View className="rounded-lg px-2 py-1.5 mb-2 w-full" style={{ backgroundColor: '#F9731618' }}>
          <Text className="text-xs text-center font-semibold" style={{ color: '#EA580C' }}>
            No speech — try again
          </Text>
        </View>
      )}

      {/* Idle / Recording */}
      {(isIdle || isRecording) && (
        <Pressable
          onPress={onRecord}
          disabled={isIdle && disabled}
          className="rounded-full px-4 py-2 flex-row items-center gap-1.5"
          style={{
            backgroundColor: isRecording ? '#EF444420' : (isIdle && disabled) ? '#0000000A' : accentColor + '18',
            opacity: (isIdle && disabled) ? 0.4 : 1,
          }}
        >
          <Ionicons
            name={isRecording ? 'stop-circle' : 'mic-outline'}
            size={15}
            color={isRecording ? '#EF4444' : (isIdle && disabled) ? '#90A4AE' : accentColor}
          />
          <Text
            className="text-xs font-semibold"
            style={{ color: isRecording ? '#EF4444' : (isIdle && disabled) ? '#90A4AE' : accentColor }}
          >
            {isRecording ? 'Stop' : 'Speak'}
          </Text>
        </Pressable>
      )}

      {/* Assessing */}
      {isAssessing && (
        <View className="items-center gap-1.5">
          <ActivityIndicator size="small" color={accentColor} />
          <Text className="text-xs text-text-muted">Analysing…</Text>
        </View>
      )}

      {/* Review: play back → keep or retry */}
      {isReview && (
        <View className="w-full gap-2">
          <Text className="text-xs text-text-muted text-center mb-1">Listen back, then decide:</Text>

          {/* Play Back */}
          <Pressable
            onPress={onPlayback}
            className="flex-row items-center justify-center gap-1.5 rounded-full py-2"
            style={{ backgroundColor: isPlaying ? '#EF444420' : accentColor + '18' }}
          >
            <Ionicons name={isPlaying ? 'stop-circle' : 'play-circle'} size={15} color={isPlaying ? '#EF4444' : accentColor} />
            <Text className="text-xs font-semibold" style={{ color: isPlaying ? '#EF4444' : accentColor }}>
              {isPlaying ? 'Stop' : 'Play Back'}
            </Text>
          </Pressable>

          <View className="flex-row gap-2">
            <Pressable
              onPress={onKeep}
              className="flex-1 flex-row items-center justify-center gap-1 rounded-full py-2"
              style={{ backgroundColor: '#10B98118' }}
            >
              <Ionicons name="checkmark-circle-outline" size={13} color="#10B981" />
              <Text className="text-xs font-semibold" style={{ color: '#10B981' }}>Keep</Text>
            </Pressable>
            <Pressable
              onPress={onRetry}
              className="flex-1 flex-row items-center justify-center gap-1 rounded-full py-2 border border-border bg-surface-page"
            >
              <Ionicons name="refresh-outline" size={13} color="#546E7A" />
              <Text className="text-xs font-semibold text-text-secondary">Retry</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Kept */}
      {isKept && (
        <View className="items-center gap-1">
          <Ionicons name="checkmark-circle" size={22} color="#10B981" />
          <Text className="text-xs font-semibold text-green-600">Saved</Text>
          <Pressable
            onPress={onRetry}
            className="mt-1 flex-row items-center gap-1 rounded-full px-3 py-1 border border-border bg-surface-page"
          >
            <Ionicons name="refresh-outline" size={12} color="#546E7A" />
            <Text className="text-xs text-text-secondary">Redo</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

function ActivityHeader({ title, accentColor }: { title: string; accentColor: string }) {
  return (
    <View className="flex-row items-center gap-3 mb-4">
      <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: accentColor + '18' }}>
        <Ionicons name="swap-horizontal-outline" size={18} color={accentColor} />
      </View>
      <Text className="text-base font-bold text-text-primary flex-1">{title}</Text>
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseAssessmentRow(row: import('@/lib/db').AssessmentRow): AssessmentResult {
  const errors = JSON.parse(row.errors) as AssessmentResult['errors'];
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getBand, ASSESSMENT_CONFIG } = require('@/lib/assessment-config') as typeof import('@/lib/assessment-config');
  return {
    mode: 'word',
    transcript: row.transcript,
    cleanedTranscript: '',
    phonicsScore: row.phonics_score,
    accuracyScore: row.phonics_score,
    fluencyScore: 90,
    completenessScore: 100,
    prosodyScore: 100,
    errors,
    band: getBand(row.phonics_score),
    passed: row.phonics_score >= ASSESSMENT_CONFIG.passThreshold,
    noSpeechDetected: false,
    hallucination: false,
    confusedWithPairWord: false,
    wordResults: [],
  };
}
