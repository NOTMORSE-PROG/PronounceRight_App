import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Audio } from 'expo-av';
import { keepRecording, loadRecordings, retryRecording } from '@/lib/recordings-service';

export interface SpeechPrompt {
  id: string;
  text: string;
  hidden: boolean; // true = cue card (tap to reveal)
}

interface SpeechRecordingActivityProps {
  activityTitle: string;
  direction: string;
  prompts: SpeechPrompt[];
  sentenceCount: { min: number; max: number };
  accentColor?: string;
  studentId?: string;
  activityId?: string;
  onComplete?: () => void;
}

// hidden   → tap to reveal cue card
// revealed → ready to record
// recording → mic active
// review   → just finished recording; can keep or try again
// kept     → user chose to keep this recording
type PromptStatus = 'hidden' | 'revealed' | 'recording' | 'review' | 'kept';

export default function SpeechRecordingActivity({
  activityTitle,
  direction,
  prompts,
  sentenceCount,
  accentColor = '#2196F3',
  studentId,
  activityId,
  onComplete,
}: SpeechRecordingActivityProps) {
  const [statuses, setStatuses] = useState<PromptStatus[]>(
    prompts.map((p) => (p.hidden ? 'hidden' : 'revealed'))
  );
  const [recordingUris, setRecordingUris] = useState<Record<number, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [completed, setCompleted] = useState(false);
  const [loadingRecordings, setLoadingRecordings] = useState(true);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Load mic permission + any saved recordings on mount
  useEffect(() => {
    Audio.requestPermissionsAsync().then(({ granted }) => setPermissionGranted(granted));
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  useEffect(() => {
    if (!studentId || !activityId) {
      setLoadingRecordings(false);
      return;
    }
    loadRecordings(studentId, activityId).then((saved) => {
      if (Object.keys(saved).length > 0) {
        setRecordingUris(saved);
        setStatuses((prev) =>
          prev.map((s, i) => (saved[i] !== undefined ? 'kept' : s))
        );
      }
      setLoadingRecordings(false);
    }).catch(() => setLoadingRecordings(false));
  }, [studentId, activityId]);

  // Complete only when every prompt is 'kept'
  useEffect(() => {
    if (loadingRecordings) return;
    const allKept = statuses.every((s) => s === 'kept');
    if (allKept && !completed) {
      setCompleted(true);
      onComplete?.();
    } else if (!allKept && completed) {
      setCompleted(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statuses, loadingRecordings]);

  function handleReveal(index: number) {
    setStatuses((prev) => prev.map((s, i) => (i === index && s === 'hidden' ? 'revealed' : s)));
  }

  async function handleRecord(index: number) {
    const status = statuses[index];

    if (status === 'revealed') {
      try {
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        recordingRef.current = recording;
        setStatuses((prev) => prev.map((s, i) => (i === index ? 'recording' : s)));
      } catch {
        // ignore
      }
    } else if (status === 'recording') {
      try {
        const uri = recordingRef.current?.getURI() ?? null;
        await recordingRef.current?.stopAndUnloadAsync();
        recordingRef.current = null;

        if (uri) {
          if (studentId && activityId) {
            try {
              setSaveError(null);
              const finalUri = await keepRecording(studentId, activityId, index, uri);
              setRecordingUris((prev) => ({ ...prev, [index]: finalUri }));
            } catch (e) {
              // eslint-disable-next-line no-console
              console.error('[SpeechRecording] keepRecording failed:', e);
              setSaveError('Could not save recording. Please try again.');
              setStatuses((prev) => prev.map((s, i) => (i === index ? 'revealed' : s)));
              return;
            }
          } else {
            setRecordingUris((prev) => ({ ...prev, [index]: uri }));
          }
        }

        setStatuses((prev) => prev.map((s, i) => (i === index ? 'review' : s)));
      } catch {
        // ignore
      }
    }
  }

  function handleKeep(index: number) {
    // File is already persisted in handleRecord — just update the UI status
    setStatuses((prev) => prev.map((s, i) => (i === index ? 'kept' : s)));
  }

  async function handleRetry(index: number) {
    const currentStatus = statuses[index];

    // Stop playback if this prompt is playing
    if (playingIndex === index) {
      await soundRef.current?.unloadAsync();
      soundRef.current = null;
      setPlayingIndex(null);
    }

    // If already kept, delete the persisted file + DB row
    if (currentStatus === 'kept' && studentId && activityId) {
      try {
        await retryRecording(studentId, activityId, index);
      } catch {
        // ignore
      }
    }

    setRecordingUris((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
    setStatuses((prev) => prev.map((s, i) => (i === index ? 'revealed' : s)));
  }

  async function handlePlayback(index: number) {
    const uri = recordingUris[index];
    if (!uri) return;

    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }

    if (playingIndex === index) {
      setPlayingIndex(null);
      return;
    }

    try {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync({ uri });
      soundRef.current = sound;
      setPlayingIndex(index);
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingIndex(null);
        }
      });
    } catch {
      setPlayingIndex(null);
    }
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
            className="rounded-xl px-6 py-3"
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

      <Text className="text-sm text-text-secondary mb-2 leading-relaxed" style={{ textAlign: 'justify' }}>{direction}</Text>
      <Text className="text-xs text-text-muted mb-4">
        Respond in {sentenceCount.min}–{sentenceCount.max} complete sentences.
      </Text>

      {/* Prompt cards */}
      <View className="gap-3 mb-4">
        {prompts.map((prompt, index) => (
          <PromptCard
            key={prompt.id}
            prompt={prompt}
            status={statuses[index]!}
            accentColor={accentColor}
            uri={recordingUris[index]}
            isPlaying={playingIndex === index}
            onReveal={() => handleReveal(index)}
            onRecord={() => handleRecord(index)}
            onPlayback={() => handlePlayback(index)}
            onKeep={() => handleKeep(index)}
            onRetry={() => handleRetry(index)}
          />
        ))}
      </View>

      {/* Save error banner */}
      {saveError && (
        <View className="rounded-xl p-3 flex-row items-center gap-2 mb-3" style={{ backgroundColor: '#EF444415' }}>
          <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
          <Text className="text-sm text-red-600 flex-1">{saveError}</Text>
        </View>
      )}

      {/* Completion banner */}
      {completed && (
        <View className="rounded-xl p-3 flex-row items-center gap-2" style={{ backgroundColor: '#10B98115' }}>
          <Ionicons name="checkmark-circle" size={18} color="#10B981" />
          <Text className="text-sm font-semibold text-green-700">
            All responses recorded!
          </Text>
        </View>
      )}
    </View>
  );
}

function PromptCard({
  prompt,
  status,
  accentColor,
  uri,
  isPlaying,
  onReveal,
  onRecord,
  onPlayback,
  onKeep,
  onRetry,
}: {
  prompt: SpeechPrompt;
  status: PromptStatus;
  accentColor: string;
  uri?: string;
  isPlaying?: boolean;
  onReveal: () => void;
  onRecord: () => void;
  onPlayback: () => void;
  onKeep: () => void;
  onRetry: () => void;
}) {
  const opacity = useSharedValue(status === 'hidden' ? 0 : 1);
  const scale = useSharedValue(status === 'hidden' ? 0.95 : 1);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  function reveal() {
    opacity.value = withTiming(1, { duration: 250 });
    scale.value = withTiming(1, { duration: 250 });
    onReveal();
  }

  const isHidden = status === 'hidden';
  const isRecording = status === 'recording';
  const isReview = status === 'review';
  const isKept = status === 'kept';

  if (isHidden) {
    return (
      <Pressable
        onPress={reveal}
        className="rounded-xl border-2 border-dashed p-5 items-center gap-2"
        style={{ borderColor: accentColor + '60', backgroundColor: accentColor + '08' }}
      >
        <Ionicons name="eye-outline" size={22} color={accentColor} />
        <Text className="text-sm font-semibold" style={{ color: accentColor }}>
          Tap to reveal question
        </Text>
      </Pressable>
    );
  }

  const borderColor = isKept
    ? '#10B981'
    : isReview
    ? accentColor + '60'
    : isRecording
    ? '#EF4444'
    : accentColor + '40';

  const bgColor = isKept
    ? '#10B98108'
    : isReview
    ? accentColor + '08'
    : isRecording
    ? '#EF444408'
    : accentColor + '0A';

  return (
    <Animated.View style={animStyle} className="rounded-xl border p-4">
      <View className="rounded-xl border p-4" style={{ borderColor, backgroundColor: bgColor }}>
        <Text className="text-sm font-semibold text-text-primary mb-3 leading-relaxed">
          {prompt.text}
        </Text>

        {/* Record / Stop button */}
        {(status === 'revealed' || isRecording) && (
          <Pressable
            onPress={onRecord}
            className="flex-row items-center gap-2 rounded-full px-4 py-2 self-start"
            style={{ backgroundColor: isRecording ? '#EF444420' : accentColor + '18' }}
          >
            <Ionicons
              name={isRecording ? 'stop-circle' : 'mic-outline'}
              size={16}
              color={isRecording ? '#EF4444' : accentColor}
            />
            <Text
              className="text-xs font-semibold"
              style={{ color: isRecording ? '#EF4444' : accentColor }}
            >
              {isRecording ? 'Stop Recording' : 'Record Answer'}
            </Text>
          </Pressable>
        )}

        {/* Review state: play + keep + try again */}
        {isReview && uri && (
          <View className="gap-2">
            <Text className="text-xs text-text-muted mb-1">Listen back, then decide:</Text>
            <View className="flex-row flex-wrap gap-2">
              <Pressable
                onPress={onPlayback}
                className="flex-row items-center gap-2 rounded-full px-4 py-2"
                style={{ backgroundColor: isPlaying ? '#EF444420' : accentColor + '18' }}
              >
                <Ionicons
                  name={isPlaying ? 'stop-circle' : 'play-circle'}
                  size={16}
                  color={isPlaying ? '#EF4444' : accentColor}
                />
                <Text className="text-xs font-semibold" style={{ color: isPlaying ? '#EF4444' : accentColor }}>
                  {isPlaying ? 'Stop' : 'Play Back'}
                </Text>
              </Pressable>

              <Pressable
                onPress={onKeep}
                className="flex-row items-center gap-2 rounded-full px-4 py-2"
                style={{ backgroundColor: '#10B98118' }}
              >
                <Ionicons name="checkmark-circle-outline" size={16} color="#10B981" />
                <Text className="text-xs font-semibold" style={{ color: '#10B981' }}>Keep</Text>
              </Pressable>

              <Pressable
                onPress={onRetry}
                className="flex-row items-center gap-2 rounded-full px-4 py-2 bg-surface-page border border-border"
              >
                <Ionicons name="refresh-outline" size={16} color="#546E7A" />
                <Text className="text-xs font-semibold text-text-secondary">Try Again</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Kept state: saved + play only */}
        {isKept && (
          <View className="gap-2">
            <View className="flex-row items-center gap-2 mb-1">
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              <Text className="text-xs font-semibold text-green-700">Saved</Text>
            </View>
            {uri && (
              <Pressable
                onPress={onPlayback}
                className="flex-row items-center gap-2 rounded-full px-4 py-2 self-start"
                style={{ backgroundColor: isPlaying ? '#EF444420' : accentColor + '18' }}
              >
                <Ionicons
                  name={isPlaying ? 'stop-circle' : 'play-circle'}
                  size={16}
                  color={isPlaying ? '#EF4444' : accentColor}
                />
                <Text className="text-xs font-semibold" style={{ color: isPlaying ? '#EF4444' : accentColor }}>
                  {isPlaying ? 'Stop' : 'Play Back'}
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </Animated.View>
  );
}

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
