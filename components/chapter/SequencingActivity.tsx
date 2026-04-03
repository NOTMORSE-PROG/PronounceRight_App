import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import type { SentenceSequencingPassage } from '@/types/content';

interface SequencingActivityProps {
  activityTitle: string;
  direction: string;
  passages: SentenceSequencingPassage[];
  maxAudioPlays: number;
  accentColor?: string;
  onComplete?: (score: number) => void;
}

export default function SequencingActivity({
  activityTitle,
  direction,
  passages,
  maxAudioPlays,
  accentColor = '#2196F3',
  onComplete,
}: SequencingActivityProps) {
  const [passageIndex, setPassageIndex] = useState(0);
  const [audioPlaysLeft, setAudioPlaysLeft] = useState(maxAudioPlays);
  const [order, setOrder] = useState<number[]>(passages[0]!.sentences.map((_, i) => i));
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [passageScores, setPassageScores] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  useEffect(() => {
    Audio.requestPermissionsAsync().then(({ granted }) => setPermissionGranted(granted));
  }, []);

  const current = passages[passageIndex]!;

  function handleAudioPlay() {
    if (audioPlaysLeft <= 0) return;
    setAudioPlaysLeft((p) => p - 1);
    // TODO: play audio model when audio assets are available
  }

  function handleTapSentence(positionInOrder: number) {
    if (checked) return;
    if (selectedIndex === null) {
      setSelectedIndex(positionInOrder);
    } else if (selectedIndex === positionInOrder) {
      setSelectedIndex(null);
    } else {
      // Swap the two positions
      setOrder((prev) => {
        const next = [...prev];
        const a = next[selectedIndex]!;
        const b = next[positionInOrder]!;
        next[selectedIndex] = b;
        next[positionInOrder] = a;
        return next;
      });
      setSelectedIndex(null);
    }
  }

  function handleCheckOrder() {
    setChecked(true);
  }

  function getPassageScore(): number {
    let correct = 0;
    for (let i = 0; i < order.length; i++) {
      if (order[i] === current.correctOrder[i]) correct++;
    }
    return Math.round((correct / order.length) * 100);
  }

  async function handleRecord() {
    if (!isRecording) {
      try {
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        recordingRef.current = recording;
        setIsRecording(true);
      } catch {
        // ignore
      }
    } else {
      try {
        await recordingRef.current?.stopAndUnloadAsync();
        recordingRef.current = null;
        setIsRecording(false);
        // TODO: integrate real speech recognition when available
        setRecorded(true);
      } catch {
        // ignore
      }
    }
  }

  function handleNext() {
    const score = getPassageScore();
    const nextScores = [...passageScores, score];
    const nextIndex = passageIndex + 1;

    if (nextIndex >= passages.length) {
      const avg = Math.round(nextScores.reduce((s, v) => s + v, 0) / nextScores.length);
      setFinished(true);
      onComplete?.(avg);
    } else {
      setPassageScores(nextScores);
      setPassageIndex(nextIndex);
      setOrder(passages[nextIndex]!.sentences.map((_, i) => i));
      setSelectedIndex(null);
      setChecked(false);
      setRecorded(false);
      setAudioPlaysLeft(maxAudioPlays);
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

  if (finished) {
    const avg = Math.round(
      [...passageScores].reduce((s, v) => s + v, 0) / passageScores.length
    );
    return (
      <View className="bg-white rounded-2xl border border-border p-5 mb-3">
        <ActivityHeader title={activityTitle} accentColor={accentColor} />
        <View className="items-center py-4">
          <Ionicons name="checkmark-circle" size={48} color="#10B981" />
          <Text className="text-xl font-bold text-text-primary mt-3 mb-1">Activity Complete!</Text>
          <Text className="text-sm text-text-muted">Average score: {avg}%</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="bg-white rounded-2xl border border-border p-5 mb-3">
      <ActivityHeader title={activityTitle} accentColor={accentColor} />

      <Text className="text-sm text-text-secondary mb-4 leading-relaxed" style={{ textAlign: 'justify' }}>{direction}</Text>

      {/* Passage counter */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-xs font-semibold text-text-muted uppercase tracking-wide">
          Passage {passageIndex + 1} of {passages.length}
        </Text>

        {/* Listen button */}
        <Pressable
          onPress={handleAudioPlay}
          disabled={audioPlaysLeft <= 0}
          className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
          style={{
            backgroundColor: audioPlaysLeft > 0 ? accentColor + '18' : '#E2E8F0',
          }}
        >
          <Ionicons
            name="volume-medium-outline"
            size={14}
            color={audioPlaysLeft > 0 ? accentColor : '#90A4AE'}
          />
          <Text
            className="text-xs font-semibold"
            style={{ color: audioPlaysLeft > 0 ? accentColor : '#90A4AE' }}
          >
            {audioPlaysLeft > 0 ? `Listen (${audioPlaysLeft} left)` : 'Max plays reached'}
          </Text>
        </Pressable>
      </View>

      {/* Hint */}
      {!checked && (
        <View className="rounded-lg p-3 mb-3" style={{ backgroundColor: accentColor + '0D' }}>
          <Text className="text-xs text-text-muted">
            Tap a sentence to select it, then tap another to swap their positions.
          </Text>
        </View>
      )}

      {/* Sentences */}
      <View className="gap-2 mb-4">
        {order.map((sentenceIdx, position) => {
          const sentence = current.sentences[sentenceIdx]!;
          const isSelected = selectedIndex === position;
          const isCorrectPosition = checked && sentenceIdx === current.correctOrder[position];
          const isWrongPosition = checked && sentenceIdx !== current.correctOrder[position];

          return (
            <Pressable
              key={`${passageIndex}-${position}`}
              onPress={() => handleTapSentence(position)}
              disabled={checked}
              className="flex-row items-center gap-3 rounded-xl border p-3"
              style={{
                borderColor: isCorrectPosition
                  ? '#10B981'
                  : isWrongPosition
                  ? '#EF4444'
                  : isSelected
                  ? accentColor
                  : '#BBDEFB',
                backgroundColor: isCorrectPosition
                  ? '#10B98108'
                  : isWrongPosition
                  ? '#EF444408'
                  : isSelected
                  ? accentColor + '12'
                  : '#F8FFFE',
              }}
            >
              <View
                className="w-6 h-6 rounded-full items-center justify-center"
                style={{
                  backgroundColor: isCorrectPosition
                    ? '#10B981'
                    : isWrongPosition
                    ? '#EF4444'
                    : isSelected
                    ? accentColor
                    : '#BBDEFB',
                }}
              >
                <Text className="text-xs font-bold text-white">{position + 1}</Text>
              </View>
              <Text className="text-sm text-text-primary flex-1 leading-relaxed">{sentence}</Text>
              {checked && isCorrectPosition && (
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              )}
              {checked && isWrongPosition && (
                <Ionicons name="close-circle" size={16} color="#EF4444" />
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Check order button */}
      {!checked && (
        <Pressable
          className="rounded-xl py-4 items-center mb-3 active:opacity-80"
          style={{ backgroundColor: accentColor }}
          onPress={handleCheckOrder}
        >
          <Text className="text-white font-bold text-base">Check Order</Text>
        </Pressable>
      )}

      {/* Record button (after checking) */}
      {checked && !recorded && (
        <Pressable
          onPress={handleRecord}
          className="rounded-xl py-4 items-center mb-3 flex-row justify-center gap-2 active:opacity-80"
          style={{ backgroundColor: isRecording ? '#EF444420' : accentColor + '18', borderWidth: 1, borderColor: isRecording ? '#EF4444' : accentColor }}
        >
          <Ionicons
            name={isRecording ? 'stop-circle' : 'mic-outline'}
            size={18}
            color={isRecording ? '#EF4444' : accentColor}
          />
          <Text
            className="font-bold text-base"
            style={{ color: isRecording ? '#EF4444' : accentColor }}
          >
            {isRecording ? 'Stop Recording' : 'Record the Passage'}
          </Text>
        </Pressable>
      )}

      {/* Next passage / finish button */}
      {recorded && (
        <Pressable
          className="rounded-xl py-4 items-center active:opacity-80"
          style={{ backgroundColor: accentColor }}
          onPress={handleNext}
        >
          <Text className="text-white font-bold text-base">
            {passageIndex + 1 >= passages.length ? 'Finish' : 'Next Passage →'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

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
