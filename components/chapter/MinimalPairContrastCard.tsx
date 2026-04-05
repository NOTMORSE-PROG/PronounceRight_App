import React from 'react';
import { View, Text, Platform } from 'react-native';
import { getMinimalPairContrast, getPhonemes, PHONEME_LABELS } from '@/lib/engine/phoneme-tips';

interface MinimalPairContrastCardProps {
  wordA: string;
  ipaA: string;
  wordB: string;
  ipaB: string;
  accentColor: string;
}

export default function MinimalPairContrastCard({
  wordA,
  ipaA,
  wordB,
  ipaB,
  accentColor,
}: MinimalPairContrastCardProps) {
  const contrasts = getMinimalPairContrast(wordA, wordB);
  const phonemesA = getPhonemes(wordA);
  const phonemesB = getPhonemes(wordB);
  const primary = contrasts[0];

  if (!phonemesA || !phonemesB || !primary) return null;

  const diffIndices = new Set(contrasts.map((c) => c.index));

  return (
    <View className="rounded-xl border border-border p-3 mb-4" style={{ backgroundColor: accentColor + '06' }}>
      {/* Side-by-side words */}
      <View className="flex-row items-start mb-3">
        {/* Word A column */}
        <View className="flex-1 items-center">
          <Text className="text-lg font-bold text-text-primary">{wordA}</Text>
          <Text
            className="text-xs text-text-muted mt-0.5"
            style={{ fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier' }}
          >
            {ipaA}
          </Text>
        </View>

        <View className="items-center justify-center pt-2">
          <Text className="text-xs font-bold text-text-muted">vs</Text>
        </View>

        {/* Word B column */}
        <View className="flex-1 items-center">
          <Text className="text-lg font-bold text-text-primary">{wordB}</Text>
          <Text
            className="text-xs text-text-muted mt-0.5"
            style={{ fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier' }}
          >
            {ipaB}
          </Text>
        </View>
      </View>

      {/* Phoneme chips side by side */}
      <View className="flex-row items-start mb-3">
        <View className="flex-1 items-center">
          <PhonemeChips phonemes={phonemesA} diffIndices={diffIndices} color="#10B981" />
        </View>
        <View className="w-8" />
        <View className="flex-1 items-center">
          <PhonemeChips phonemes={phonemesB} diffIndices={diffIndices} color="#F97316" />
        </View>
      </View>

      {/* Key difference callout */}
      <View className="rounded-lg px-3 py-2" style={{ backgroundColor: accentColor + '12' }}>
        <Text className="text-xs text-text-secondary leading-relaxed text-center">
          <Text className="font-semibold">Key difference: </Text>
          "{wordA}" has the{' '}
          <Text className="font-semibold" style={{ color: '#10B981' }}>{primary.labelA}</Text>
          {' '}while "{wordB}" has the{' '}
          <Text className="font-semibold" style={{ color: '#F97316' }}>{primary.labelB}</Text>
        </Text>
      </View>
    </View>
  );
}

function PhonemeChips({
  phonemes,
  diffIndices,
  color,
}: {
  phonemes: string[];
  diffIndices: Set<number>;
  color: string;
}) {
  return (
    <View className="flex-row flex-wrap gap-1 justify-center">
      {phonemes.map((p, i) => {
        const isDiff = diffIndices.has(i);
        const label = isDiff ? PHONEME_LABELS[p] : undefined;
        return (
          <View key={i} className="items-center" style={{ maxWidth: 72 }}>
            <View
              className="rounded px-1.5 py-0.5"
              style={{
                backgroundColor: isDiff ? color + '20' : '#0000000A',
                borderWidth: isDiff ? 1 : 0,
                borderColor: isDiff ? color : 'transparent',
              }}
            >
              <Text
                className="text-xs font-semibold"
                style={{
                  color: isDiff ? color : '#78909C',
                  fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier',
                }}
              >
                {p}
              </Text>
            </View>
            {label && (
              <Text className="text-center mt-0.5" style={{ fontSize: 8, color, lineHeight: 10 }}>
                {label}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}
