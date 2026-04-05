import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, Linking, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import type { WhisperContext, WhisperVadContext } from 'whisper.rn';
import { WHISPER_RECORDING_OPTIONS } from '@/lib/recording-options';
import { assessText } from '@/lib/pronunciation-engine';
import type { AssessmentResult } from '@/lib/pronunciation-engine';
import { analyzeIntonation, type IntonationResult, type IntonationPattern } from '@/lib/engine/intonation-scorer';
import { keepRecording, retryRecording, loadRecordings } from '@/lib/recordings-service';
import { saveAssessment, getAssessments, deleteAssessment } from '@/lib/db';
import SpeakWordButton from '@/components/ui/SpeakWordButton';

// ─── Types ───────────────────────────────────────────────────────────────────

interface IntonationDrillActivityProps {
  activityTitle: string;
  direction: string;
  sentences: string[];
  expectedIntonations: ('rising' | 'falling')[];
  passThreshold: number;
  accentColor?: string;
  studentId?: string;
  activityId?: string;
  whisperCtx?: WhisperContext;
  vadCtx?: WhisperVadContext | null;
  onComplete?: (score: number) => void;
}

type Status = 'idle' | 'recording' | 'assessing' | 'review';

const INTONATION_LABELS = {
  rising:  { symbol: '↗', label: 'Rising',  guidance: 'Raise your pitch at the end — it should sound like a question.' },
  falling: { symbol: '↘', label: 'Falling', guidance: 'Lower your pitch at the end — it should sound like a statement or command.' },
  flat:    { symbol: '→', label: 'Flat',    guidance: '' },
} as const;

// ─── Component ───────────────────────────────────────────────────────────────

export default function IntonationDrillActivity({
  activityTitle,
  direction,
  sentences,
  expectedIntonations,
  passThreshold,
  accentColor = '#2196F3',
  studentId,
  activityId,
  whisperCtx,
  vadCtx,
  onComplete,
}: IntonationDrillActivityProps) {
  const isAssessed = passThreshold > 0 && !!whisperCtx;

  // ─── Per-sentence state ──────────────────────────────────────────────────
  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState<Status>('idle');
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null);
  const [intonationResult, setIntonationResult] = useState<IntonationResult | null>(null);
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
  const scoresRef = useRef<number[]>([]);
  const completedCountRef = useRef(0);

  // ─── Derived ─────────────────────────────────────────────────────────────
  const currentSentence = sentences[currentIndex]!;
  const expectedIntonation = expectedIntonations[currentIndex]!;
  const expectedInfo = INTONATION_LABELS[expectedIntonation];

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
      let firstIncomplete = 0;
      for (let i = 0; i < sentences.length; i++) {
        if (savedRecordings[i] !== undefined && assessmentRows.find((r) => r.prompt_index === i)) {
          firstIncomplete = i + 1;
          completedCountRef.current = i + 1;
          const row = assessmentRows.find((r) => r.prompt_index === i);
          if (row) scoresRef.current[i] = row.phonics_score;
        } else break;
      }
      if (firstIncomplete >= sentences.length) {
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
        const { recording } = await Audio.Recording.createAsync(WHISPER_RECORDING_OPTIONS);
        recordingRef.current = recording;
        setNoSpeech(false);
        setAssessment(null);
        setIntonationResult(null);
        setStatus('recording');
      // eslint-disable-next-line no-console
      } catch (err) { console.warn('[IntonationDrill] Recording start failed:', err); }
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

        if (isAssessed) {
          try {
            // Run phoneme assessment and intonation analysis in parallel
            const [phonemeResult, intonation] = await Promise.all([
              assessText(whisperCtx!, savedUri, currentSentence, vadCtx),
              analyzeIntonation(savedUri, expectedIntonation),
            ]);

            if (phonemeResult.noSpeechDetected) {
              if (studentId && activityId) await retryRecording(studentId, activityId, currentIndex).catch(() => {});
              setRecordingUri(null);
              setNoSpeech(true);
              setStatus('idle');
              return;
            }

            // Combined score: 30% pronunciation + 70% intonation (this is an intonation drill)
            const intScore = intonation?.score ?? null;
            const combo = intScore !== null
              ? Math.round(phonemeResult.phonicsScore * 0.30 + intScore * 0.70)
              : phonemeResult.phonicsScore;
            const didPass = combo >= passThreshold;

            // Save to DB
            if (studentId && activityId) {
              await saveAssessment({
                id: `${studentId}_${activityId}_${currentIndex}`,
                student_id: studentId,
                activity_id: activityId,
                prompt_index: currentIndex,
                phonics_score: combo,
                transcript: phonemeResult.transcript,
                errors: JSON.stringify(phonemeResult.errors),
                created_at: new Date().toISOString(),
              });
            }

            setAssessment(phonemeResult);
            setIntonationResult(intonation);
            setCombinedScore(combo);
            setPassed(didPass);
            setStatus('review');
          } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('[IntonationDrill] Assessment failed:', err);
            setStatus('review');
          }
        } else {
          setCombinedScore(100);
          setPassed(true);
          setStatus('review');
        }
      // eslint-disable-next-line no-console
      } catch (err) { console.warn('[IntonationDrill] Recording stop failed:', err); }
    }
  }

  // ─── Navigation ──────────────────────────────────────────────────────────

  function handleNext() {
    scoresRef.current[currentIndex] = combinedScore;
    completedCountRef.current = currentIndex + 1;
    const nextIdx = currentIndex + 1;
    if (nextIdx >= sentences.length) {
      setFinished(true);
      const scores = scoresRef.current.filter((s) => s !== undefined);
      const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 100;
      onComplete?.(avg);
    } else {
      setCurrentIndex(nextIdx);
      resetPerSentenceState();
    }
  }

  async function handleRetry() {
    if (playingBack) { await soundRef.current?.unloadAsync(); soundRef.current = null; setPlayingBack(false); }
    if (studentId && activityId) {
      await retryRecording(studentId, activityId, currentIndex).catch(() => {});
      await deleteAssessment(studentId, activityId, currentIndex).catch(() => {});
    }
    resetPerSentenceState();
  }

  function resetPerSentenceState() {
    setStatus('idle');
    setAssessment(null);
    setIntonationResult(null);
    setCombinedScore(0);
    setPassed(false);
    setNoSpeech(false);
    setRecordingUri(null);
    setPlayingBack(false);
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
            {passedCount} of {sentences.length} sentences passed
          </Text>
          <View
            className="rounded-full px-5 py-2"
            style={{ backgroundColor: avg >= 70 ? '#10B98120' : '#EF444420' }}
          >
            <Text className="text-base font-bold" style={{ color: avg >= 70 ? '#10B981' : '#EF4444' }}>
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

      <Text className="text-sm text-text-secondary mb-4 leading-relaxed" style={{ textAlign: 'justify' }}>{direction}</Text>

      {/* Progress */}
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-xs text-text-muted">
          Sentence {currentIndex + 1} of {sentences.length}
        </Text>
        <View className="flex-row gap-1">
          {sentences.map((_, i) => (
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

      {/* Sentence prompt */}
      <View className="rounded-xl p-5 mb-4 items-center" style={{ backgroundColor: accentColor + '0D' }}>
        <View className="flex-row items-center gap-3 mb-2">
          <SpeakWordButton word={currentSentence} accentColor={accentColor} />
          <Text className="text-lg font-semibold text-text-primary flex-shrink" style={{ textAlign: 'center' }}>
            "{currentSentence}"
          </Text>
        </View>
        <View className="flex-row items-center gap-1.5 mt-1">
          <Text className="text-lg" style={{ color: accentColor }}>{expectedInfo.symbol}</Text>
          <Text className="text-xs font-semibold" style={{ color: accentColor }}>
            Expected: {expectedInfo.label} Intonation
          </Text>
        </View>
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
          <Text className="text-sm text-text-muted">Analysing pronunciation and intonation…</Text>
        </View>
      )}

      {/* Review state */}
      {isReview && (
        <>
          {/* 1. Minimal transcript */}
          {assessment && (
            <View className="rounded-lg px-3 py-2 mb-2" style={{ backgroundColor: accentColor + '08' }}>
              <Text className="text-xs text-text-muted">
                You said: <Text className="font-semibold text-text-secondary">{assessment.transcript || '—'}</Text>
              </Text>
            </View>
          )}

          {/* 2. HERO — Enhanced Intonation Card */}
          <EnhancedIntonationCard
            intonationResult={intonationResult}
            expectedIntonation={expectedIntonation}
            sentence={currentSentence}
            accentColor={accentColor}
          />

          {/* 3. Small pronunciation note */}
          {assessment && (
            <View className="flex-row items-center justify-between px-3 py-2 mt-2 rounded-lg" style={{ backgroundColor: '#0000000A' }}>
              <Text className="text-xs text-text-muted">Pronunciation</Text>
              <Text className="text-xs font-semibold" style={{ color: assessment.band.color }}>
                {assessment.phonicsScore}% — {assessment.band.message}
              </Text>
            </View>
          )}

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
                  {currentIndex + 1 >= sentences.length ? 'See Results' : 'Next →'}
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

// ─── Intonation Guidance ──────────────────────────────────────────────────

function getLastWord(sentence: string): string {
  const words = sentence.replace(/[?.!]$/, '').trim().split(/\s+/);
  return words[words.length - 1] ?? '';
}

function getIntonationGuidance(
  sentence: string,
  expected: 'rising' | 'falling',
  detected: IntonationPattern,
  isCorrect: boolean,
): { context: string; tip: string } {
  const isQuestion = sentence.trim().endsWith('?');
  const isWhQuestion = isQuestion && /^(who|what|where|when|why|how)\b/i.test(sentence.trim());
  const isYesNoQuestion = isQuestion && !isWhQuestion;
  const lastWord = getLastWord(sentence);

  let context: string;
  if (isYesNoQuestion) {
    context = 'This is a yes/no question. In English, yes/no questions end with rising pitch to signal you expect an answer.';
  } else if (isWhQuestion) {
    context = 'This is a WH-question (who/what/where/when/why/how). WH-questions use falling intonation because the question word already signals it\'s a question.';
  } else {
    context = 'This is a statement. Statements use falling intonation to sound confident and complete.';
  }

  let tip: string;
  if (isCorrect) {
    tip = expected === 'rising'
      ? 'Great job lifting your voice at the end! Keep practicing this upward pitch on yes/no questions.'
      : 'Nice work letting your voice fall naturally. This makes your speech sound confident and clear.';
  } else if (detected === 'flat') {
    tip = expected === 'rising'
      ? `Try saying just "${lastWord}" by itself with a questioning tone. Then say the full sentence, keeping that upward lift at the end.`
      : `Let your voice drop on "${lastWord}". Imagine you're finishing a thought — your energy settles down at the end.`;
  } else {
    tip = expected === 'rising'
      ? `Your voice went down instead of up. Try imagining you're genuinely asking someone — raise your pitch on "${lastWord}" like you're curious.`
      : `Your voice went up instead of down. Try saying it like you're telling a fact — let your voice drop and settle on "${lastWord}".`;
  }

  return { context, tip };
}

// ─── Enhanced Intonation Card (Hero) ──────────────────────────────────────

function EnhancedIntonationCard({
  intonationResult,
  expectedIntonation,
  sentence,
  accentColor,
}: {
  intonationResult: IntonationResult | null;
  expectedIntonation: 'rising' | 'falling';
  sentence: string;
  accentColor: string;
}) {
  const expectedInfo = INTONATION_LABELS[expectedIntonation];

  if (!intonationResult) {
    return (
      <View className="rounded-xl border border-border p-4 mt-2" style={{ backgroundColor: '#F8FFFE' }}>
        <Text className="text-xs text-text-muted text-center">
          Intonation detection unavailable — scored on pronunciation only
        </Text>
      </View>
    );
  }

  const { detected, score } = intonationResult;
  const detectedInfo = INTONATION_LABELS[detected];
  const isCorrect = score === 100;
  const isPartial = score === 50;
  const borderColor = isCorrect ? '#10B981' : isPartial ? '#F97316' : '#EF4444';
  const guidance = getIntonationGuidance(sentence, expectedIntonation, detected, isCorrect);

  return (
    <View className="rounded-xl border p-4 mt-2" style={{ borderColor: borderColor + '40', backgroundColor: borderColor + '08' }}>
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-sm font-bold text-text-primary">Intonation</Text>
        <View className="flex-row items-center gap-1.5">
          <Text className="text-sm font-bold" style={{ color: borderColor }}>{score}%</Text>
          <Ionicons
            name={isCorrect ? 'checkmark-circle' : 'close-circle'}
            size={16}
            color={borderColor}
          />
        </View>
      </View>

      {/* Expected vs Detected — big arrows */}
      <View className="flex-row justify-center gap-8 mb-4">
        <View className="items-center">
          <Text className="text-3xl">{expectedInfo.symbol}</Text>
          <Text className="text-xs font-bold text-text-primary mt-1">Expected</Text>
          <Text className="text-xs text-text-muted">{expectedInfo.label}</Text>
        </View>
        <View className="items-center">
          <Text className="text-3xl">{detectedInfo.symbol}</Text>
          <Text className="text-xs font-bold text-text-primary mt-1">Detected</Text>
          <Text className="text-xs text-text-muted">{detectedInfo.label}</Text>
        </View>
      </View>

      {/* Intonation score bar */}
      <View className="mb-4">
        <View className="h-2 rounded-full bg-surface-page overflow-hidden">
          <View className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: borderColor }} />
        </View>
      </View>

      {/* Result feedback */}
      <Text className="text-xs font-semibold leading-relaxed text-center mb-4" style={{ color: isCorrect ? '#059669' : '#EA580C' }}>
        {isCorrect
          ? detected === 'rising'
            ? 'Correct! Your voice rose at the end — perfect for a question.'
            : 'Correct! Your voice fell at the end — just right for a statement.'
          : isPartial
            ? 'Your intonation was flat — try adding more pitch movement.'
            : 'Your intonation went the wrong way.'}
      </Text>

      {/* Why this pattern? */}
      <View className="rounded-lg p-3 mb-3" style={{ backgroundColor: accentColor + '10' }}>
        <View className="flex-row gap-2">
          <Ionicons name="bulb-outline" size={14} color={accentColor} style={{ marginTop: 1 }} />
          <View className="flex-1">
            <Text className="text-xs font-semibold mb-1" style={{ color: accentColor }}>Why {expectedInfo.label.toLowerCase()}?</Text>
            <Text className="text-xs text-text-secondary leading-relaxed">{guidance.context}</Text>
          </View>
        </View>
      </View>

      {/* Actionable tip */}
      <View className="rounded-lg p-3" style={{ backgroundColor: '#0000000A' }}>
        <View className="flex-row gap-2">
          <Ionicons name="chatbubble-ellipses-outline" size={14} color="#78909C" style={{ marginTop: 1 }} />
          <View className="flex-1">
            <Text className="text-xs font-semibold text-text-primary mb-1">Tip</Text>
            <Text className="text-xs text-text-secondary leading-relaxed">{guidance.tip}</Text>
          </View>
        </View>
      </View>
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
