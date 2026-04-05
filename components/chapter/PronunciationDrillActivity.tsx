import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, Platform, Linking, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import type { WhisperContext, WhisperVadContext } from 'whisper.rn';
import { WHISPER_RECORDING_OPTIONS } from '@/lib/recording-options';
import { assessText } from '@/lib/pronunciation-engine';
import type { AssessmentResult } from '@/lib/pronunciation-engine';
import { keepRecording, loadRecordings, retryRecording } from '@/lib/recordings-service';
import { saveAssessment, getAssessments, deleteAssessment } from '@/lib/db';
import AssessmentResultCard from './AssessmentResultCard';
import SpeakWordButton from '@/components/ui/SpeakWordButton';

export interface DrillWord {
  word: string;
  ipa?: string;
}

interface PronunciationDrillActivityProps {
  activityTitle: string;
  direction: string;
  words: DrillWord[];
  passThreshold: number;
  accentColor?: string;
  studentId?: string;
  activityId?: string;
  whisperCtx?: WhisperContext;
  vadCtx?: WhisperVadContext | null;
  onComplete?: (score: number) => void;
}

type WordStatus = 'idle' | 'recording' | 'assessing' | 'review' | 'kept';

/** Strip stress annotations like "reLAX" → "relax", "obJECT (verb)" → "object" */
function cleanReferenceWord(word: string): string {
  return word
    .replace(/\s*\(.*?\)\s*/g, '')  // strip parenthetical like "(verb)"
    .toLowerCase()
    .trim();
}

export default function PronunciationDrillActivity({
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
}: PronunciationDrillActivityProps) {
  const isAssessed = passThreshold > 0 && !!whisperCtx;

  const [statuses, setStatuses] = useState<WordStatus[]>(words.map(() => 'idle'));
  const [recordingUris, setRecordingUris] = useState<Record<number, string>>({});
  const [assessments, setAssessments] = useState<Record<number, AssessmentResult>>({});
  const [noSpeechMsgs, setNoSpeechMsgs] = useState<Record<number, boolean>>({});
  const [hallucinationMsgs, setHallucinationMsgs] = useState<Record<number, boolean>>({});
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [completed, setCompleted] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loadingRecordings, setLoadingRecordings] = useState(true);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const keptScoresRef = useRef<Record<number, number>>({});
  const justRestoredRef = useRef(true);

  useEffect(() => {
    Audio.requestPermissionsAsync().then(({ granted }) => setPermissionGranted(granted));
    return () => {
      soundRef.current?.unloadAsync();
      recordingRef.current?.stopAndUnloadAsync();
    };
  }, []);

  // Restore saved recordings + assessments on mount
  useEffect(() => {
    if (!studentId || !activityId) { setLoadingRecordings(false); return; }
    Promise.all([
      loadRecordings(studentId, activityId),
      isAssessed ? getAssessments(studentId, activityId) : Promise.resolve([]),
    ]).then(([saved, assessmentRows]) => {
      if (Object.keys(saved).length > 0) {
        setRecordingUris(saved);
        setStatuses((prev) =>
          prev.map((s, i) => (saved[i] !== undefined ? 'kept' : s))
        );
      }
      // Restore assessment results
      if (assessmentRows.length > 0) {
        const restored: Record<number, AssessmentResult> = {};
        for (const row of assessmentRows) {
          restored[row.prompt_index] = parseAssessmentRow(row);
          keptScoresRef.current[row.prompt_index] = row.phonics_score;
        }
        setAssessments(restored);
      }
      setLoadingRecordings(false);
      // Allow completion detection on the next tick (after React processes restored state)
      setTimeout(() => { justRestoredRef.current = false; }, 0);
    }).catch(() => { setLoadingRecordings(false); justRestoredRef.current = false; });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Complete when all words are kept (skip during initial restoration)
  useEffect(() => {
    if (loadingRecordings || justRestoredRef.current) return;
    const allKept = statuses.every((s) => s === 'kept');
    if (allKept && !completed) {
      setCompleted(true);
      if (isAssessed) {
        const scores = Object.values(keptScoresRef.current);
        const avg = scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 100;
        onComplete?.(avg);
      } else {
        onComplete?.(100);
      }
    } else if (!allKept && completed) {
      setCompleted(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statuses, loadingRecordings]);

  async function handleRecord(index: number) {
    const status = statuses[index];

    if (status === 'idle') {
      try {
        // Stop any playing audio
        if (soundRef.current) { await soundRef.current.unloadAsync(); soundRef.current = null; setPlayingIndex(null); }
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const { recording } = await Audio.Recording.createAsync(
          WHISPER_RECORDING_OPTIONS
        );
        recordingRef.current = recording;
        setNoSpeechMsgs((prev) => ({ ...prev, [index]: false }));
        setHallucinationMsgs((prev) => ({ ...prev, [index]: false }));
        setStatuses((prev) => prev.map((s, i) => (i === index ? 'recording' : s)));
      } catch { /* ignore */ }
    } else if (status === 'recording') {
      try {
        const uri = recordingRef.current?.getURI() ?? null;
        try { await recordingRef.current?.stopAndUnloadAsync(); } finally { recordingRef.current = null; }

        if (!uri) { setStatuses((prev) => prev.map((s, i) => (i === index ? 'idle' : s))); return; }

        // Save recording file
        let savedUri = uri;
        if (studentId && activityId) {
          try {
            setSaveError(null);
            savedUri = await keepRecording(studentId, activityId, index, uri);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error('[DrillActivity] keepRecording failed:', e);
            setSaveError('Could not save recording. Please try again.');
            setStatuses((prev) => prev.map((s, i) => (i === index ? 'idle' : s)));
            return;
          }
        }

        // Run assessment if available and graded
        if (isAssessed) {
          setStatuses((prev) => prev.map((s, i) => (i === index ? 'assessing' : s)));
          setRecordingUris((prev) => ({ ...prev, [index]: savedUri }));

          try {
            const refWord = cleanReferenceWord(words[index]!.word);
            const result = await assessText(whisperCtx!, savedUri, refWord, vadCtx);

            if (result.noSpeechDetected) {
              // Truly no speech — clean up recording and reset
              if (studentId && activityId) {
                await retryRecording(studentId, activityId, index).catch(() => {});
              }
              setRecordingUris((prev) => { const next = { ...prev }; delete next[index]; return next; });
              setNoSpeechMsgs((prev) => ({ ...prev, [index]: true }));
              setStatuses((prev) => prev.map((s, i) => (i === index ? 'idle' : s)));
              return;
            }

            // Save assessment to DB (even low scores — user can see what was heard)
            if (studentId && activityId) {
              await saveAssessment({
                id: `${studentId}_${activityId}_${index}`,
                student_id: studentId,
                activity_id: activityId,
                prompt_index: index,
                phonics_score: result.phonicsScore,
                transcript: result.transcript,
                errors: JSON.stringify(result.errors),
                created_at: new Date().toISOString(),
              });
            }

            setAssessments((prev) => ({ ...prev, [index]: result }));
            setStatuses((prev) => prev.map((s, i) => (i === index ? 'review' : s)));
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error('[DrillActivity] assessment error:', e);
            // Fall back to review without assessment
            setStatuses((prev) => prev.map((s, i) => (i === index ? 'review' : s)));
          }
        } else {
          // No assessment — go straight to review
          setRecordingUris((prev) => ({ ...prev, [index]: savedUri }));
          setStatuses((prev) => prev.map((s, i) => (i === index ? 'review' : s)));
        }
      } catch { /* ignore */ }
    }
  }

  function handleKeep(index: number) {
    const assessment = assessments[index];
    if (assessment) {
      keptScoresRef.current[index] = assessment.phonicsScore;
    }
    setStatuses((prev) => prev.map((s, i) => (i === index ? 'kept' : s)));
  }

  async function handleRetry(index: number) {
    if (playingIndex === index) {
      await soundRef.current?.unloadAsync();
      soundRef.current = null;
      setPlayingIndex(null);
    }
    if (studentId && activityId) {
      await retryRecording(studentId, activityId, index).catch(() => {});
      await deleteAssessment(studentId, activityId, index).catch(() => {});
    }
    delete keptScoresRef.current[index];
    setRecordingUris((prev) => { const next = { ...prev }; delete next[index]; return next; });
    setAssessments((prev) => { const next = { ...prev }; delete next[index]; return next; });
    setNoSpeechMsgs((prev) => ({ ...prev, [index]: false }));
    setHallucinationMsgs((prev) => ({ ...prev, [index]: false }));
    setStatuses((prev) => prev.map((s, i) => (i === index ? 'idle' : s)));
  }

  async function handlePlayback(index: number) {
    const uri = recordingUris[index];
    if (!uri) return;
    if (soundRef.current) { await soundRef.current.unloadAsync(); soundRef.current = null; }
    if (playingIndex === index) { setPlayingIndex(null); return; }
    try {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync({ uri });
      soundRef.current = sound;
      setPlayingIndex(index);
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((s) => {
        if (s.isLoaded && s.didJustFinish) setPlayingIndex(null);
      });
    } catch { setPlayingIndex(null); }
  }

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

  return (
    <View className="bg-white rounded-2xl border border-border p-5 mb-3">
      <ActivityHeader title={activityTitle} accentColor={accentColor} />

      <Text className="text-sm text-text-secondary mb-4 leading-relaxed" style={{ textAlign: 'justify' }}>{direction}</Text>

      <View className="gap-2">
        {words.map((item, index) => {
          const status = statuses[index]!;
          const isRecording = status === 'recording';
          const isAssessing = status === 'assessing';
          const isReview = status === 'review';
          const isKept = status === 'kept';
          const uri = recordingUris[index];
          const isPlaying = playingIndex === index;
          const assessment = assessments[index];
          const noSpeech = noSpeechMsgs[index];
          const hallucination = hallucinationMsgs[index];
          const canKeep = !isAssessed || !assessment || assessment.passed;

          return (
            <View
              key={index}
              className="rounded-xl border px-4 py-3"
              style={{
                borderColor: isKept ? '#10B981' : isReview ? accentColor + '60' : isRecording ? '#EF4444' : isAssessing ? accentColor + '40' : '#BBDEFB',
                backgroundColor: isKept ? '#10B98108' : isReview ? accentColor + '08' : isRecording ? '#EF444408' : '#F8FFFE',
              }}
            >
              {/* Word + IPA row */}
              <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-3">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-base font-semibold text-text-primary">{item.word}</Text>
                    <SpeakWordButton word={cleanReferenceWord(item.word)} accentColor={accentColor} />
                  </View>
                  {item.ipa ? (
                    <Text
                      className="text-xs text-text-muted mt-0.5"
                      style={{ fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier' }}
                    >
                      {item.ipa}
                    </Text>
                  ) : null}
                </View>

                {/* Record / Stop button */}
                {(status === 'idle' || isRecording) && (
                  <Pressable
                    onPress={() => handleRecord(index)}
                    className="flex-row items-center gap-1.5 rounded-full px-3 py-2"
                    style={{ backgroundColor: isRecording ? '#EF444420' : accentColor + '18' }}
                  >
                    <Ionicons
                      name={isRecording ? 'stop-circle' : 'mic-outline'}
                      size={16}
                      color={isRecording ? '#EF4444' : accentColor}
                    />
                    <Text className="text-xs font-semibold" style={{ color: isRecording ? '#EF4444' : accentColor }}>
                      {isRecording ? 'Stop' : 'Record'}
                    </Text>
                  </Pressable>
                )}

                {/* Assessing spinner */}
                {isAssessing && (
                  <View className="flex-row items-center gap-1.5">
                    <ActivityIndicator size="small" color={accentColor} />
                    <Text className="text-xs text-text-muted">Analysing...</Text>
                  </View>
                )}

                {/* Kept state */}
                {isKept && (
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                    <Text className="text-xs font-semibold text-green-600">Saved</Text>
                  </View>
                )}
              </View>

              {/* No-speech / hallucination message */}
              {(noSpeech || hallucination) && status === 'idle' && (
                <View className="rounded-lg px-2 py-1.5 mt-2" style={{ backgroundColor: '#F9731618' }}>
                  <Text className="text-xs text-center font-semibold" style={{ color: '#EA580C' }}>
                    {hallucination
                      ? 'Could not understand — speak louder and closer'
                      : 'No speech detected — try again'}
                  </Text>
                </View>
              )}

              {/* Assessment result card (review state) */}
              {isReview && assessment && (
                <AssessmentResultCard
                  result={assessment}
                  referenceText={cleanReferenceWord(item.word)}
                  accentColor={accentColor}
                />
              )}

              {/* Review state: play + keep + retry */}
              {isReview && uri && (
                <View className="flex-row flex-wrap gap-2 mt-2">
                  <Text className="text-xs text-text-muted w-full">Listen back, then decide:</Text>
                  <Pressable
                    onPress={() => handlePlayback(index)}
                    className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
                    style={{ backgroundColor: isPlaying ? '#EF444420' : accentColor + '18' }}
                  >
                    <Ionicons name={isPlaying ? 'stop-circle' : 'play-circle'} size={15} color={isPlaying ? '#EF4444' : accentColor} />
                    <Text className="text-xs font-semibold" style={{ color: isPlaying ? '#EF4444' : accentColor }}>
                      {isPlaying ? 'Stop' : 'Play Back'}
                    </Text>
                  </Pressable>
                  {canKeep && (
                    <Pressable
                      onPress={() => handleKeep(index)}
                      className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
                      style={{ backgroundColor: '#10B98118' }}
                    >
                      <Ionicons name="checkmark-circle-outline" size={15} color="#10B981" />
                      <Text className="text-xs font-semibold" style={{ color: '#10B981' }}>Keep</Text>
                    </Pressable>
                  )}
                  <Pressable
                    onPress={() => handleRetry(index)}
                    className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5 border border-border bg-surface-page"
                  >
                    <Ionicons name="refresh-outline" size={15} color="#546E7A" />
                    <Text className="text-xs font-semibold text-text-secondary">Try Again</Text>
                  </Pressable>
                  {/* Gating message when assessment didn't pass */}
                  {isAssessed && assessment && !assessment.passed && (
                    <View className="w-full rounded-lg px-2 py-1.5 mt-1" style={{ backgroundColor: '#F9731615' }}>
                      <Text className="text-xs text-center font-semibold" style={{ color: '#EA580C' }}>
                        Re-record to pass (need {'\u2265'}{passThreshold}%)
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Kept state: playback + redo */}
              {isKept && uri && (
                <View className="mt-2">
                  {/* Show assessment score summary when kept */}
                  {assessment && (
                    <View className="flex-row items-center gap-1.5 mb-2">
                      <Text className="text-xs font-semibold" style={{ color: assessment.band.color }}>
                        Score: {assessment.phonicsScore}%
                      </Text>
                      <Text className="text-xs text-text-muted">— {assessment.band.message}</Text>
                    </View>
                  )}
                  <View className="flex-row gap-2">
                    <Pressable
                      onPress={() => handlePlayback(index)}
                      className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
                      style={{ backgroundColor: isPlaying ? '#EF444420' : accentColor + '18' }}
                    >
                      <Ionicons name={isPlaying ? 'stop-circle' : 'play-circle'} size={15} color={isPlaying ? '#EF4444' : accentColor} />
                      <Text className="text-xs font-semibold" style={{ color: isPlaying ? '#EF4444' : accentColor }}>
                        {isPlaying ? 'Stop' : 'Play Back'}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleRetry(index)}
                      className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5 border border-border bg-surface-page"
                    >
                      <Ionicons name="refresh-outline" size={15} color="#546E7A" />
                      <Text className="text-xs font-semibold text-text-secondary">Redo</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Save error */}
      {saveError && (
        <View className="mt-3 rounded-xl p-3 flex-row items-center gap-2" style={{ backgroundColor: '#EF444415' }}>
          <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
          <Text className="text-sm text-red-600 flex-1">{saveError}</Text>
        </View>
      )}

      {/* Completion banner */}
      {completed && (
        <View className="mt-4 rounded-xl p-3 flex-row items-center gap-2" style={{ backgroundColor: '#10B98118' }}>
          <Ionicons name="checkmark-circle" size={18} color="#10B981" />
          <Text className="text-sm font-semibold text-green-700">
            {isAssessed
              ? `All words completed! Average: ${Object.keys(keptScoresRef.current).length > 0
                  ? Math.round(Object.values(keptScoresRef.current).reduce((a, b) => a + b, 0) / Object.keys(keptScoresRef.current).length)
                  : 100}%`
              : 'All words recorded and saved!'}
          </Text>
        </View>
      )}
    </View>
  );
}

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseAssessmentRow(row: import('@/lib/db').AssessmentRow): AssessmentResult {
  const errors = JSON.parse(row.errors) as AssessmentResult['errors'];
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getBand, ASSESSMENT_CONFIG } = require('@/lib/assessment-config') as typeof import('@/lib/assessment-config');
  const { accuracy: wa, fluency: wf, completeness: wc } = ASSESSMENT_CONFIG.scoreWeights;
  // Back-calculate accuracy: phonics = acc*wa + 100*wf + 100*wc (word mode: fluency=100, completeness=100)
  const fixedContribution = 100 * wf + 100 * wc;
  const accuracyScore = Math.min(100, Math.max(0, Math.round((row.phonics_score - fixedContribution) / wa)));
  return {
    mode: 'word',
    transcript: row.transcript,
    cleanedTranscript: '',
    phonicsScore: row.phonics_score,
    accuracyScore,
    fluencyScore: 100,
    completenessScore: 100,
    prosodyScore: 100,
    errors,
    band: getBand(row.phonics_score),
    passed: row.phonics_score >= ASSESSMENT_CONFIG.passThreshold,
    recognitionPass: false,
    noSpeechDetected: false,
    hallucination: false,
    confusedWithPairWord: false,
    wordResults: [],
  };
}
