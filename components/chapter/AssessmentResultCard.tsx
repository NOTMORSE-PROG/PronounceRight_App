import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { AssessmentResult, WordLevelResult } from '@/lib/pronunciation-engine';
import { ASSESSMENT_CONFIG } from '@/lib/assessment-config';
import { getPhonemeDiff, getImprovementTip } from '@/lib/engine/phoneme-tips';
import type { MinimalPairFeedback } from '@/lib/engine/minimal-pair-feedback';

interface AssessmentResultCardProps {
  result: AssessmentResult;
  referenceText: string;
  accentColor: string;
  feedback?: MinimalPairFeedback;
}

export default function AssessmentResultCard({
  result,
  referenceText,
  accentColor,
  feedback,
}: AssessmentResultCardProps) {
  const { band, phonicsScore, accuracyScore, fluencyScore, completenessScore, errors, mode } = result;

  // Legacy phoneme diff (used only when no feedback provided)
  const diff = !feedback && mode === 'word' && result.cleanedTranscript
    ? getPhonemeDiff(result.cleanedTranscript, referenceText)
    : null;
  const legacyTip = !feedback ? getImprovementTip(errors, diff, referenceText) : '';

  return (
    <View className="rounded-xl border p-3 mt-2" style={{ borderColor: band.color + '40', backgroundColor: band.color + '08' }}>

      {/* What Whisper heard */}
      <Text className="text-xs text-text-muted mb-2 italic">
        You said: <Text className="font-semibold not-italic text-text-secondary">{result.transcript || '—'}</Text>
      </Text>

      {/* Score explanation (when feedback available) */}
      {feedback && (
        <View className="rounded-lg px-3 py-2 mb-2" style={{ backgroundColor: band.color + '10' }}>
          <Text className="text-xs text-text-secondary leading-relaxed">
            {feedback.scoreExplanation}
          </Text>
        </View>
      )}

      {/* Word-level coloring for phrase/passage mode */}
      {mode !== 'word' && result.wordResults.length > 0 && (
        <View className="flex-row flex-wrap gap-1 mb-3">
          {result.wordResults.map((w, i) => (
            <WordChip key={i} item={w} />
          ))}
        </View>
      )}

      {/* Error chips */}
      {errors.length > 0 && (
        <View className="flex-row flex-wrap gap-1.5 mb-3">
          {errors.map((err) => (
            <View
              key={err}
              className="rounded-full px-2.5 py-1"
              style={{ backgroundColor: ASSESSMENT_CONFIG.errorColors[err] + '20' }}
            >
              <Text
                className="text-xs font-semibold capitalize"
                style={{ color: ASSESSMENT_CONFIG.errorColors[err] }}
              >
                {formatErrorLabel(err)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Score bar */}
      <View className="mb-2">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-xs font-bold" style={{ color: band.color }}>
            {phonicsScore}%
          </Text>
          <Text className="text-xs text-text-muted">{band.message}</Text>
        </View>
        <View className="h-2 rounded-full bg-surface-page overflow-hidden">
          <View
            className="h-full rounded-full"
            style={{ width: `${phonicsScore}%`, backgroundColor: band.color }}
          />
        </View>
      </View>

      {/* Sub-scores */}
      <View className="flex-row justify-between mt-2 mb-3">
        <SubScore label="Accuracy" value={accuracyScore} />
        <SubScore label="Fluency" value={fluencyScore} />
        <SubScore label="Complete" value={completenessScore} />
      </View>

      {/* Feedback: structured multi-part tips (when available) */}
      {feedback && !result.passed && (
        <View className="rounded-lg p-3 gap-2.5" style={{ backgroundColor: '#F9731610' }}>
          {/* Contrast explanation */}
          <View className="flex-row gap-2">
            <Ionicons name="ear-outline" size={14} color="#EA580C" style={{ marginTop: 1 }} />
            <Text className="text-xs text-text-secondary leading-relaxed flex-1">
              {feedback.contrastExplanation}
            </Text>
          </View>
          {/* Articulatory tip */}
          <View className="flex-row gap-2">
            <Ionicons name="body-outline" size={14} color="#EA580C" style={{ marginTop: 1 }} />
            <Text className="text-xs text-text-secondary leading-relaxed flex-1">
              {feedback.articulatoryTip}
            </Text>
          </View>
          {/* Encouragement */}
          <View className="flex-row gap-2">
            <Ionicons name="sparkles-outline" size={14} color="#10B981" style={{ marginTop: 1 }} />
            <Text className="text-xs font-semibold leading-relaxed flex-1" style={{ color: '#059669' }}>
              {feedback.encouragement}
            </Text>
          </View>
        </View>
      )}

      {/* Feedback: passed encouragement */}
      {feedback && result.passed && (
        <View className="rounded-lg px-3 py-2" style={{ backgroundColor: '#10B98112' }}>
          <Text className="text-xs font-semibold" style={{ color: '#059669' }}>
            {feedback.encouragement}
          </Text>
        </View>
      )}

      {/* Legacy tip (no feedback context) */}
      {!feedback && legacyTip.length > 0 && (
        <View className="rounded-lg px-3 py-2.5" style={{ backgroundColor: '#F97316' + '12' }}>
          <Text className="text-xs text-text-secondary leading-relaxed">
            <Text className="font-semibold" style={{ color: '#EA580C' }}>Tip: </Text>
            {legacyTip}
          </Text>
        </View>
      )}

    </View>
  );
}

// ─── Sub-score ────────────────────────────────────────────────────────────────

function SubScore({ label, value }: { label: string; value: number }) {
  return (
    <View className="items-center">
      <Text className="text-xs font-bold text-text-primary">{value}%</Text>
      <Text className="text-xs text-text-muted">{label}</Text>
    </View>
  );
}

// ─── Word chip (phrase/passage mode) ─────────────────────────────────────────

function WordChip({ item }: { item: WordLevelResult }) {
  const statusColors: Record<string, { bg: string; text: string }> = {
    correct:       { bg: '#10B98120', text: '#059669' },
    mispronounced: { bg: '#F9731620', text: '#EA580C' },
    omitted:       { bg: '#EF444420', text: '#DC2626' },
    extra:         { bg: '#3B82F620', text: '#2563EB' },
  };
  const colors = statusColors[item.status] ?? statusColors.correct!;
  const label = item.referenceWord ?? item.transcriptWord ?? '';

  return (
    <View
      className="rounded-full px-2.5 py-1"
      style={{ backgroundColor: colors.bg }}
    >
      <Text
        className="text-xs font-semibold"
        style={{
          color: colors.text,
          textDecorationLine: item.status === 'omitted' ? 'line-through' : 'none',
        }}
      >
        {label}
        {item.status === 'mispronounced' && item.transcriptWord
          ? ` (${item.transcriptWord})`
          : ''}
      </Text>
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatErrorLabel(err: string): string {
  const labels: Record<string, string> = {
    pronunciation:   'Pronunciation Error',
    omission:        'Word Omitted',
    redundancy:      'Extra Word',
    tone:            'Tone Error',
    unexpectedPause: 'Unexpected Pause',
    missingPause:    'Missing Pause',
  };
  return labels[err] ?? err;
}
