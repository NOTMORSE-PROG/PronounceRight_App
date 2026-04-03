import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { keepRecording, loadRecordings, retryRecording } from '@/lib/recordings-service';

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
  onComplete?: (score: number) => void;
}

type WordStatus = 'idle' | 'recording' | 'review' | 'kept';

export default function PronunciationDrillActivity({
  activityTitle,
  direction,
  words,
  passThreshold,
  accentColor = '#2196F3',
  studentId,
  activityId,
  onComplete,
}: PronunciationDrillActivityProps) {
  const [statuses, setStatuses] = useState<WordStatus[]>(words.map(() => 'idle'));
  const [recordingUris, setRecordingUris] = useState<Record<number, string>>({});
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [completed, setCompleted] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loadingRecordings, setLoadingRecordings] = useState(true);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    Audio.requestPermissionsAsync().then(({ granted }) => setPermissionGranted(granted));
    return () => { soundRef.current?.unloadAsync(); };
  }, []);

  useEffect(() => {
    if (!studentId || !activityId) { setLoadingRecordings(false); return; }
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

  // Complete when all words are kept
  useEffect(() => {
    if (loadingRecordings) return;
    const allKept = statuses.every((s) => s === 'kept');
    if (allKept && !completed) {
      setCompleted(true);
      onComplete?.(100); // all words recorded = activity complete
    } else if (!allKept && completed) {
      setCompleted(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statuses, loadingRecordings]);

  async function handleRecord(index: number) {
    const status = statuses[index];

    if (status === 'idle') {
      try {
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        recordingRef.current = recording;
        setStatuses((prev) => prev.map((s, i) => (i === index ? 'recording' : s)));
      } catch { /* ignore */ }
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
              console.error('[DrillActivity] keepRecording failed:', e);
              setSaveError('Could not save recording. Please try again.');
              setStatuses((prev) => prev.map((s, i) => (i === index ? 'idle' : s)));
              return;
            }
          } else {
            setRecordingUris((prev) => ({ ...prev, [index]: uri }));
          }
        }

        setStatuses((prev) => prev.map((s, i) => (i === index ? 'review' : s)));
      } catch { /* ignore */ }
    }
  }

  function handleKeep(index: number) {
    setStatuses((prev) => prev.map((s, i) => (i === index ? 'kept' : s)));
  }

  async function handleRetry(index: number) {
    if (playingIndex === index) {
      await soundRef.current?.unloadAsync();
      soundRef.current = null;
      setPlayingIndex(null);
    }
    if (statuses[index] === 'kept' && studentId && activityId) {
      try { await retryRecording(studentId, activityId, index); } catch { /* ignore */ }
    }
    setRecordingUris((prev) => { const next = { ...prev }; delete next[index]; return next; });
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
          const isReview = status === 'review';
          const isKept = status === 'kept';
          const uri = recordingUris[index];
          const isPlaying = playingIndex === index;

          return (
            <View
              key={index}
              className="rounded-xl border px-4 py-3"
              style={{
                borderColor: isKept ? '#10B981' : isReview ? accentColor + '60' : isRecording ? '#EF4444' : '#BBDEFB',
                backgroundColor: isKept ? '#10B98108' : isReview ? accentColor + '08' : isRecording ? '#EF444408' : '#F8FFFE',
              }}
            >
              {/* Word + IPA row */}
              <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-3">
                  <Text className="text-base font-semibold text-text-primary">{item.word}</Text>
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

                {/* Kept state */}
                {isKept && (
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                    <Text className="text-xs font-semibold text-green-600">Saved</Text>
                  </View>
                )}
              </View>

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
                  <Pressable
                    onPress={() => handleKeep(index)}
                    className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
                    style={{ backgroundColor: '#10B98118' }}
                  >
                    <Ionicons name="checkmark-circle-outline" size={15} color="#10B981" />
                    <Text className="text-xs font-semibold" style={{ color: '#10B981' }}>Keep</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleRetry(index)}
                    className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5 border border-border bg-surface-page"
                  >
                    <Ionicons name="refresh-outline" size={15} color="#546E7A" />
                    <Text className="text-xs font-semibold text-text-secondary">Try Again</Text>
                  </Pressable>
                </View>
              )}

              {/* Kept state: playback + redo */}
              {isKept && uri && (
                <View className="flex-row gap-2 mt-2">
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
          <Text className="text-sm font-semibold text-green-700">All words recorded and saved!</Text>
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
