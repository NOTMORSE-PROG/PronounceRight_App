import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import type { MinimalPairItem } from '@/types/content';
import { loadRecordings } from '@/lib/recordings-service';
import { getAssessments } from '@/lib/db';
import type { AssessmentRow } from '@/lib/db';
import { getBand } from '@/lib/assessment-config';
import SpeakWordButton from '@/components/ui/SpeakWordButton';
import MinimalPairContrastCard from './MinimalPairContrastCard';

interface MinimalPairReviewProps {
  activityTitle: string;
  items: MinimalPairItem[];
  accentColor?: string;
  studentId?: string;
  activityId?: string;
}

export default function MinimalPairReview({
  activityTitle,
  items,
  accentColor = '#2196F3',
  studentId,
  activityId,
}: MinimalPairReviewProps) {
  const [recordings, setRecordings] = useState<Record<number, string>>({});
  const [assessments, setAssessments] = useState<AssessmentRow[]>([]);
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    if (!studentId || !activityId) return;
    Promise.all([
      loadRecordings(studentId, activityId),
      getAssessments(studentId, activityId),
    ]).then(([recs, rows]) => {
      setRecordings(recs);
      setAssessments(rows);
    }).catch(() => {/* ignore */});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => { soundRef.current?.unloadAsync(); };
  }, []);

  function getAssessment(promptIndex: number): AssessmentRow | undefined {
    return assessments.find((r) => r.prompt_index === promptIndex);
  }

  async function handlePlayback(key: string, uri: string) {
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    if (playingKey === key) { setPlayingKey(null); return; }

    try {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync({ uri });
      soundRef.current = sound;
      setPlayingKey(key);
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((s) => {
        if (s.isLoaded && s.didJustFinish) setPlayingKey(null);
      });
    } catch { setPlayingKey(null); }
  }

  return (
    <View className="bg-white rounded-2xl border border-border p-5 mb-3">
      {/* Header */}
      <View className="flex-row items-center gap-3 mb-2">
        <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: accentColor + '18' }}>
          <Ionicons name="swap-horizontal-outline" size={18} color={accentColor} />
        </View>
        <Text className="text-base font-bold text-text-primary flex-1">{activityTitle}</Text>
      </View>

      {/* Review badge */}
      <View className="flex-row items-center gap-1.5 mb-4">
        <View className="rounded-full px-3 py-1" style={{ backgroundColor: '#10B98118' }}>
          <Text className="text-xs font-semibold" style={{ color: '#10B981' }}>
            <Ionicons name="checkmark-circle" size={11} color="#10B981" /> Review Mode
          </Text>
        </View>
        <Text className="text-xs text-text-muted">{items.length} pairs</Text>
      </View>

      {/* All pairs */}
      <View className="gap-4">
        {items.map((pair, i) => {
          const idxA = i * 2;
          const idxB = i * 2 + 1;
          const rowA = getAssessment(idxA);
          const rowB = getAssessment(idxB);
          const uriA = recordings[idxA];
          const uriB = recordings[idxB];

          return (
            <View key={i} className="rounded-xl border border-border p-3" style={{ backgroundColor: '#F8FFFE' }}>
              {/* Pair label */}
              <Text className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">
                Pair {i + 1} of {items.length}
              </Text>

              {/* Word cards side by side */}
              <View className="flex-row items-start gap-2 mb-3">
                <ReviewWordCard
                  word={pair.wordA}
                  ipa={pair.ipaA}
                  assessment={rowA}
                  recordingUri={uriA}
                  playingKey={playingKey}
                  playKey={`${i}-A`}
                  accentColor={accentColor}
                  onPlayback={handlePlayback}
                />

                <View className="items-center justify-center pt-8">
                  <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: accentColor + '18' }}>
                    <Text className="text-xs font-bold" style={{ color: accentColor }}>vs</Text>
                  </View>
                </View>

                <ReviewWordCard
                  word={pair.wordB}
                  ipa={pair.ipaB}
                  assessment={rowB}
                  recordingUri={uriB}
                  playingKey={playingKey}
                  playKey={`${i}-B`}
                  accentColor={accentColor}
                  onPlayback={handlePlayback}
                />
              </View>

              {/* Phoneme contrast */}
              <MinimalPairContrastCard
                wordA={pair.wordA}
                ipaA={pair.ipaA}
                wordB={pair.wordB}
                ipaB={pair.ipaB}
                accentColor={accentColor}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── Review Word Card ────────────────────────────────────────────────────────

function ReviewWordCard({
  word,
  ipa,
  assessment,
  recordingUri,
  playingKey,
  playKey,
  accentColor,
  onPlayback,
}: {
  word: string;
  ipa: string;
  assessment?: AssessmentRow;
  recordingUri?: string;
  playingKey: string | null;
  playKey: string;
  accentColor: string;
  onPlayback: (key: string, uri: string) => void;
}) {
  const score = assessment?.phonics_score;
  const band = score !== undefined ? getBand(score) : null;
  const isPlaying = playingKey === playKey;

  return (
    <View className="flex-1 rounded-xl border border-border p-3 items-center" style={{ backgroundColor: '#fff' }}>
      {/* Word + IPA */}
      <Text className="text-xl font-bold text-text-primary mb-0.5">{word}</Text>
      <Text
        className="text-xs text-text-muted mb-2"
        style={{ fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier' }}
      >
        {ipa}
      </Text>

      {/* TTS button */}
      <SpeakWordButton word={word} accentColor={accentColor} />

      {/* Score badge */}
      {band && score !== undefined && (
        <View className="rounded-full px-2.5 py-1 mt-2" style={{ backgroundColor: band.color + '18' }}>
          <Text className="text-xs font-bold" style={{ color: band.color }}>{score}%</Text>
        </View>
      )}

      {/* Transcript */}
      {assessment?.transcript && (
        <Text className="text-xs text-text-muted italic mt-1.5" numberOfLines={1}>
          You said: <Text className="font-semibold not-italic text-text-secondary">{assessment.transcript}</Text>
        </Text>
      )}

      {/* Play recording */}
      {recordingUri && (
        <Pressable
          onPress={() => onPlayback(playKey, recordingUri)}
          className="flex-row items-center gap-1 rounded-full px-3 py-1.5 mt-2"
          style={{ backgroundColor: isPlaying ? '#EF444418' : accentColor + '12' }}
        >
          <Ionicons
            name={isPlaying ? 'stop-circle' : 'play-circle'}
            size={14}
            color={isPlaying ? '#EF4444' : accentColor}
          />
          <Text className="text-xs font-semibold" style={{ color: isPlaying ? '#EF4444' : accentColor }}>
            {isPlaying ? 'Stop' : 'My Recording'}
          </Text>
        </Pressable>
      )}

      {/* No recording */}
      {!recordingUri && !assessment && (
        <Text className="text-xs text-text-muted mt-2 italic">No recording</Text>
      )}
    </View>
  );
}
