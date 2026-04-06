import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  Linking,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useVideoPlayer, VideoView } from 'expo-video';
import type { WhisperContext, WhisperVadContext } from 'whisper.rn';
import { WHISPER_RECORDING_OPTIONS } from '@/lib/recording-options';
import { keepRecording } from '@/lib/recordings-service';
import { saveActivityCompletion, getActivityCompletion } from '@/lib/db';
import VIDEO_REGISTRY from '@/assets/videos/m3c3/index';
import type { VideoRolePlayScenario, VideoRolePlayStep } from '@/types/content';

// ─── Types ─────────────────────────────────────────────────────────────────────

type Phase =
  | 'scenario_select'
  | 'video_loading'
  | 'video_playing'
  | 'recording'
  | 'branch_select'
  | 'scenario_done'
  | 'all_done';

interface Props {
  activityTitle: string;
  direction: string;
  scenarios: VideoRolePlayScenario[];
  passThreshold: number;
  accentColor?: string;
  studentId?: string;
  activityId?: string;
  whisperCtx?: WhisperContext;
  vadCtx?: WhisperVadContext | null;
  onComplete?: (score: number) => void;
  onAdvance?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function findStep(scenario: VideoRolePlayScenario, stepId: string): VideoRolePlayStep | undefined {
  return scenario.steps.find(s => s.id === stepId);
}

// ─── Activity Header ──────────────────────────────────────────────────────────

function ActivityHeader({ title, accentColor }: { title: string; accentColor: string }) {
  return (
    <View className="flex-row items-center gap-3 mb-4">
      <View
        className="w-9 h-9 rounded-xl items-center justify-center"
        style={{ backgroundColor: accentColor + '18' }}
      >
        <Ionicons name="videocam-outline" size={18} color={accentColor} />
      </View>
      <Text className="text-base font-bold text-text-primary flex-1">{title}</Text>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function VideoRolePlayActivity({
  activityTitle,
  direction,
  scenarios,
  accentColor = '#FF9800',
  studentId,
  activityId,
  onComplete,
  onAdvance,
}: Props) {
  // ── Top-level state ──────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>('scenario_select');
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [completedScenarios, setCompletedScenarios] = useState<number[]>([]);
  const [alreadyDone, setAlreadyDone] = useState(false);

  // ── Per-step state ───────────────────────────────────────────────────────────
  const [currentStepId, setCurrentStepId] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  // ── Refs ─────────────────────────────────────────────────────────────────────
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingIndexRef = useRef(0);

  // ── Animation ────────────────────────────────────────────────────────────────
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ── Setup ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    Audio.requestPermissionsAsync().then(({ granted }) => setPermissionGranted(granted));
    return () => {
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ── Restore saved completion ──────────────────────────────────────────────────
  useEffect(() => {
    if (!studentId || !activityId) return;
    getActivityCompletion(studentId, activityId).then((row) => {
      if (!row) return;
      setAlreadyDone(true);
      setPhase('all_done');
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
  const scenario = scenarios[scenarioIndex]!;
  const currentStep = currentStepId ? findStep(scenario, currentStepId) : undefined;

  // ── Start a scenario ──────────────────────────────────────────────────────────
  const startScenario = useCallback((index: number) => {
    const s = scenarios[index]!;
    setScenarioIndex(index);
    setCurrentStepId(s.entryStepId);
    recordingIndexRef.current = 0;
    setPhase('video_loading');
  }, [scenarios]);

  // ── Video finished playing ────────────────────────────────────────────────────
  const handleVideoFinished = useCallback(() => {
    if (!currentStep) return;
    if (currentStep.requiresResponse) {
      setPhase('recording');
    } else if (currentStep.nextStepId) {
      setCurrentStepId(currentStep.nextStepId);
      setPhase('video_loading');
    } else {
      // Terminal non-response step = scenario done
      handleScenarioDone();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  // ── Start recording ───────────────────────────────────────────────────────────
  const handleStartRecording = useCallback(async () => {
    try {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(WHISPER_RECORDING_OPTIONS);
      recordingRef.current = recording;
      setIsRecording(true);
    } catch {
      setIsRecording(true);
    }
  }, []);

  // ── Stop recording ────────────────────────────────────────────────────────────
  const handleStopRecording = useCallback(async () => {
    setIsRecording(false);

    let uri: string | null = null;
    try {
      await recordingRef.current?.stopAndUnloadAsync();
      uri = recordingRef.current?.getURI() ?? null;
      recordingRef.current = null;
    } catch { recordingRef.current = null; }

    if (uri && studentId && activityId) {
      const idx = recordingIndexRef.current++;
      try {
        await keepRecording(studentId, activityId, idx, uri);
      } catch { /* ignore */ }
    }

    if (!currentStep) return;

    if (currentStep.branches && currentStep.branches.length > 0) {
      setPhase('branch_select');
    } else if (currentStep.nextStepId) {
      setCurrentStepId(currentStep.nextStepId);
      setPhase('video_loading');
    } else {
      handleScenarioDone();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, studentId, activityId]);

  // ── Branch selection ──────────────────────────────────────────────────────────
  const handleBranchSelect = useCallback((nextStepId: string) => {
    setCurrentStepId(nextStepId);
    setPhase('video_loading');
  }, []);

  // ── Scenario done ─────────────────────────────────────────────────────────────
  const handleScenarioDone = useCallback(() => {
    setPhase('scenario_done');
  }, []);

  const handleNextScenario = useCallback(() => {
    const nextDone = [...completedScenarios, scenarioIndex];
    setCompletedScenarios(nextDone);

    if (nextDone.length >= scenarios.length) {
      // All scenarios completed
      if (studentId && activityId) {
        saveActivityCompletion({
          id: `${studentId}_${activityId}`,
          student_id: studentId,
          activity_id: activityId,
          score: 100,
          answers: JSON.stringify({ completedScenarios: nextDone }),
          created_at: new Date().toISOString(),
        }).catch(() => {});
      }
      onComplete?.(100);
      setPhase('all_done');
    } else {
      setPhase('scenario_select');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedScenarios, scenarioIndex, scenarios.length, studentId, activityId, onComplete]);

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

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

  // ── All done ──────────────────────────────────────────────────────────────────
  if (phase === 'all_done') {
    return (
      <View className="bg-white rounded-2xl border border-border p-5 mb-3">
        <ActivityHeader title={activityTitle} accentColor={accentColor} />
        <View className="items-center py-6 gap-3">
          <View
            className="w-16 h-16 rounded-full items-center justify-center"
            style={{ backgroundColor: '#10B98120' }}
          >
            <Ionicons name="checkmark-circle" size={40} color="#10B981" />
          </View>
          <Text className="text-xl font-bold text-text-primary">Role-Play Complete!</Text>
          <Text className="text-sm text-text-secondary text-center">
            Great work! You completed all {scenarios.length} scenarios.
          </Text>
        </View>
        {!alreadyDone && (
          <Pressable
            className="rounded-xl py-4 items-center active:opacity-80"
            style={{ backgroundColor: accentColor }}
            onPress={() => onAdvance?.()}
          >
            <Text className="text-white font-bold text-base">Continue →</Text>
          </Pressable>
        )}
      </View>
    );
  }

  // ── Scenario complete ─────────────────────────────────────────────────────────
  if (phase === 'scenario_done') {
    const remaining = scenarios.length - completedScenarios.length - 1;
    return (
      <View className="bg-white rounded-2xl border border-border p-5 mb-3">
        <ActivityHeader title={activityTitle} accentColor={accentColor} />
        <View className="items-center py-5 gap-3">
          <View
            className="w-14 h-14 rounded-full items-center justify-center"
            style={{ backgroundColor: accentColor + '20' }}
          >
            <Ionicons name="checkmark-circle" size={34} color={accentColor} />
          </View>
          <Text className="text-lg font-bold text-text-primary text-center">{scenario.title} Done!</Text>
          <Text className="text-sm text-text-secondary text-center">
            {remaining > 0
              ? `${remaining} scenario${remaining > 1 ? 's' : ''} remaining.`
              : 'You\'ve completed all scenarios!'}
          </Text>
        </View>
        <Pressable
          className="rounded-xl py-4 items-center active:opacity-80"
          style={{ backgroundColor: accentColor }}
          onPress={handleNextScenario}
        >
          <Text className="text-white font-bold text-base">
            {remaining > 0 ? 'Next Scenario →' : 'Finish Role-Play →'}
          </Text>
        </Pressable>
      </View>
    );
  }

  // ── Scenario selector ─────────────────────────────────────────────────────────
  if (phase === 'scenario_select') {
    return (
      <View className="bg-white rounded-2xl border border-border p-5 mb-3">
        <ActivityHeader title={activityTitle} accentColor={accentColor} />
        <Text className="text-sm text-text-secondary mb-4 leading-relaxed" style={{ textAlign: 'justify' }}>
          {direction}
        </Text>

        <Text className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">
          Choose a Scenario
        </Text>

        <View className="gap-2">
          {scenarios.map((s, i) => {
            const done = completedScenarios.includes(i);
            // A scenario is unlocked only if it's the very first uncompleted one
            const isNext = !done && completedScenarios.length === i;
            const locked = !done && !isNext;
            return (
              <Pressable
                key={s.id}
                onPress={() => isNext && startScenario(i)}
                disabled={done || locked}
                className="rounded-xl p-4 border flex-row items-center gap-3 active:opacity-80"
                style={{
                  borderColor: done ? '#10B98140' : isNext ? accentColor + '60' : '#E2E8F0',
                  backgroundColor: done ? '#10B98108' : isNext ? accentColor + '08' : '#F1F5F9',
                  opacity: locked ? 0.55 : done ? 0.85 : 1,
                }}
              >
                <View
                  className="w-8 h-8 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: done ? '#10B98120' : locked ? '#CBD5E1' : accentColor + '20',
                  }}
                >
                  {done ? (
                    <Ionicons name="checkmark" size={16} color="#10B981" />
                  ) : locked ? (
                    <Ionicons name="lock-closed" size={14} color="#64748B" />
                  ) : (
                    <Text className="text-sm font-bold" style={{ color: accentColor }}>{i + 1}</Text>
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-text-primary">{s.title}</Text>
                  <Text className="text-xs text-text-muted mt-0.5" numberOfLines={1}>{s.description}</Text>
                </View>
                {isNext && (
                  <Ionicons name="chevron-forward" size={16} color={accentColor} />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  // ── Active scenario phases ────────────────────────────────────────────────────
  return (
    <View className="bg-white rounded-2xl border border-border p-5 mb-3">
      <ActivityHeader title={activityTitle} accentColor={accentColor} />

      {/* Scenario header */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-xs font-bold" style={{ color: accentColor }}>
          {scenario.title}
        </Text>
        <View className="flex-row gap-1">
          {scenarios.map((_, i) => (
            <View
              key={i}
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: completedScenarios.includes(i)
                  ? '#10B981'
                  : i === scenarioIndex
                  ? accentColor
                  : '#E2E8F0',
              }}
            />
          ))}
        </View>
      </View>

      {/* ── VIDEO LOADING / PLAYING ──────────────────────────────────────────── */}
      {(phase === 'video_loading' || phase === 'video_playing') && currentStep && (
        <VideoStep
          step={currentStep}
          accentColor={accentColor}
          onPhaseChange={setPhase}
          onFinished={handleVideoFinished}
        />
      )}

      {/* ── RECORDING ────────────────────────────────────────────────────────── */}
      {phase === 'recording' && currentStep && (
        <RecordingPhase
          step={currentStep}
          accentColor={accentColor}
          isRecording={isRecording}
          elapsedSeconds={elapsedSeconds}
          pulseAnim={pulseAnim}
          onStart={handleStartRecording}
          onStop={handleStopRecording}
        />
      )}

      {/* ── BRANCH SELECT ────────────────────────────────────────────────────── */}
      {phase === 'branch_select' && currentStep?.branches && (
        <BranchSelect
          step={currentStep}
          accentColor={accentColor}
          onSelect={handleBranchSelect}
        />
      )}
    </View>
  );
}

// ─── VideoStep ────────────────────────────────────────────────────────────────

function VideoStep({
  step,
  accentColor,
  onPhaseChange,
  onFinished,
}: {
  step: VideoRolePlayStep;
  accentColor: string;
  onPhaseChange: (phase: Phase) => void;
  onFinished: () => void;
}) {
  const [hasEnded, setHasEnded] = useState(false);
  const source = VIDEO_REGISTRY[step.videoKey];

  const player = useVideoPlayer(source ?? null, (p) => {
    p.play();
  });

  useEffect(() => {
    if (!player) return;
    onPhaseChange('video_playing');

    const sub = player.addListener('playToEnd', () => {
      setHasEnded(true);
    });
    return () => sub.remove();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player]);

  const handleReplay = () => {
    try {
      player?.seekBy(-999999);
      player?.play();
      setHasEnded(false);
    } catch { /* ignore */ }
  };

  const handleContinue = () => {
    onFinished();
  };

  return (
    <View className="gap-3">
      <Text className="text-xs font-semibold text-text-muted uppercase tracking-wide">
        {step.label}
      </Text>

      {/* Video player */}
      <View className="rounded-xl overflow-hidden bg-black" style={{ aspectRatio: 16 / 9 }}>
        {source != null && player ? (
          <VideoView
            player={player}
            style={{ flex: 1 }}
            contentFit="contain"
            nativeControls={false}
          />
        ) : (
          <View className="flex-1 items-center justify-center gap-2">
            <Ionicons name="warning-outline" size={28} color="#90A4AE" />
            <Text className="text-xs text-text-muted">Video unavailable</Text>
          </View>
        )}
      </View>

      {/* Hint text */}
      {step.responseHint && (
        <View className="rounded-lg px-3 py-2" style={{ backgroundColor: accentColor + '10' }}>
          <Text className="text-xs text-text-muted mb-0.5">Caller says:</Text>
          <Text className="text-sm text-text-secondary italic">{step.responseHint}</Text>
        </View>
      )}

      {/* Controls */}
      {hasEnded ? (
        <View className="flex-row gap-2">
          <Pressable
            className="flex-1 flex-row items-center justify-center gap-2 rounded-xl py-3.5 active:opacity-80"
            style={{ backgroundColor: accentColor + '12', borderWidth: 1, borderColor: accentColor + '40' }}
            onPress={handleReplay}
          >
            <Ionicons name="refresh" size={16} color={accentColor} />
            <Text className="text-sm font-semibold" style={{ color: accentColor }}>Replay</Text>
          </Pressable>
          <Pressable
            className="flex-1 flex-row items-center justify-center gap-2 rounded-xl py-3.5 active:opacity-80"
            style={{ backgroundColor: accentColor }}
            onPress={handleContinue}
          >
            <Text className="text-white font-bold text-sm">
              {step.requiresResponse ? 'Record Response →' : 'Continue →'}
            </Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          className="flex-row items-center justify-center gap-2 rounded-xl py-3 active:opacity-80"
          style={{ backgroundColor: accentColor + '12', borderWidth: 1, borderColor: accentColor + '40' }}
          onPress={() => {
            player?.seekBy(999999);
            setHasEnded(true);
          }}
        >
          <Ionicons name="play-skip-forward-outline" size={16} color={accentColor} />
          <Text className="text-sm font-semibold" style={{ color: accentColor }}>Skip Video</Text>
        </Pressable>
      )}
    </View>
  );
}

// ─── RecordingPhase ───────────────────────────────────────────────────────────

function RecordingPhase({
  step,
  accentColor,
  isRecording,
  elapsedSeconds,
  pulseAnim,
  onStart,
  onStop,
}: {
  step: VideoRolePlayStep;
  accentColor: string;
  isRecording: boolean;
  elapsedSeconds: number;
  pulseAnim: Animated.Value;
  onStart: () => void;
  onStop: () => void;
}) {
  return (
    <View className="gap-4">
      {/* Instruction */}
      <View className="rounded-xl p-4" style={{ backgroundColor: accentColor + '10' }}>
        <Text className="text-xs font-semibold mb-1" style={{ color: accentColor }}>
          Your turn to respond:
        </Text>
        {step.responseHint ? (
          <Text className="text-sm text-text-secondary italic">{step.responseHint}</Text>
        ) : (
          <Text className="text-sm text-text-secondary">Speak in a complete sentence.</Text>
        )}
      </View>

      {isRecording ? (
        <View className="gap-4">
          {/* Pulsing mic */}
          <View className="items-center gap-3 py-3">
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

          <Pressable
            onPress={onStop}
            className="rounded-xl py-4 items-center flex-row justify-center gap-2 active:opacity-80"
            style={{ backgroundColor: '#EF444420', borderWidth: 1, borderColor: '#EF4444' }}
          >
            <Ionicons name="stop-circle" size={18} color="#EF4444" />
            <Text className="font-bold text-base" style={{ color: '#EF4444' }}>Stop Recording</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={onStart}
          className="rounded-xl py-4 items-center flex-row justify-center gap-2 active:opacity-80"
          style={{ backgroundColor: accentColor }}
        >
          <Ionicons name="mic-outline" size={18} color="#FFFFFF" />
          <Text className="text-white font-bold text-base">Record Response</Text>
        </Pressable>
      )}
    </View>
  );
}

// ─── BranchSelect ─────────────────────────────────────────────────────────────

function BranchSelect({
  step,
  accentColor,
  onSelect,
}: {
  step: VideoRolePlayStep;
  accentColor: string;
  onSelect: (nextStepId: string) => void;
}) {
  return (
    <View className="gap-3">
      <View className="rounded-xl p-3" style={{ backgroundColor: accentColor + '10' }}>
        <Text className="text-sm font-semibold text-text-primary text-center">
          Which best describes your response?
        </Text>
      </View>
      <View className="gap-2">
        {step.branches!.map((branch) => (
          <Pressable
            key={branch.nextStepId}
            onPress={() => onSelect(branch.nextStepId)}
            className="rounded-xl py-4 items-center active:opacity-80 border"
            style={{ borderColor: accentColor, backgroundColor: accentColor + '10' }}
          >
            <Text className="font-bold text-base" style={{ color: accentColor }}>
              {branch.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
