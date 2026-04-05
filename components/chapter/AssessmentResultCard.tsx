import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { AssessmentResult, WordLevelResult } from '@/lib/pronunciation-engine';
import { ASSESSMENT_CONFIG } from '@/lib/assessment-config';
import { getPhonemeDiff, getImprovementTip, getPhonemes, PHONEME_LABELS } from '@/lib/engine/phoneme-tips';
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

  // Phoneme diff for word mode — used for visual comparison and legacy tips
  const diff = mode === 'word' && result.cleanedTranscript
    ? getPhonemeDiff(result.cleanedTranscript, referenceText)
    : null;
  const legacyTip = !feedback ? getImprovementTip(errors, diff, referenceText) : '';

  // Phoneme sequences for visual diff display (word mode, mispronounced)
  const showPhonemeDiff = mode === 'word' && !result.passed && result.cleanedTranscript && diff;
  const refPhonemes = showPhonemeDiff ? getPhonemes(referenceText) : null;
  const recPhonemes = showPhonemeDiff ? getPhonemes(result.cleanedTranscript) : null;

  const descriptions = ASSESSMENT_CONFIG.subScoreDescriptions;

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

      {/* Error chips with descriptions */}
      {errors.length > 0 && (
        <View className="gap-1.5 mb-3">
          {errors.map((err) => (
            <View key={err} className="flex-row items-start gap-2">
              <View
                className="rounded-full px-2.5 py-1 mt-0.5"
                style={{ backgroundColor: ASSESSMENT_CONFIG.errorColors[err] + '20' }}
              >
                <Text
                  className="text-xs font-semibold capitalize"
                  style={{ color: ASSESSMENT_CONFIG.errorColors[err] }}
                >
                  {formatErrorLabel(err)}
                </Text>
              </View>
              <Text className="text-xs text-text-muted flex-1 leading-relaxed" style={{ marginTop: 2 }}>
                {ASSESSMENT_CONFIG.errorDescriptions[err]}
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
          <Text className="text-xs text-text-muted">
            {result.recognitionPass && phonicsScore < 90
              ? 'Word recognized — work on pronunciation clarity'
              : band.message}
          </Text>
        </View>
        <View className="h-2 rounded-full bg-surface-page overflow-hidden">
          <View
            className="h-full rounded-full"
            style={{ width: `${phonicsScore}%`, backgroundColor: band.color }}
          />
        </View>
      </View>

      {/* Sub-scores with descriptions */}
      <View className="gap-2 mt-2 mb-3">
        <SubScore label="Accuracy" value={accuracyScore} description={descriptions.accuracy} />
        {mode !== 'word' && (
          <SubScore label="Fluency" value={fluencyScore} description={descriptions.fluency} />
        )}
        {mode !== 'word' && (
          <SubScore label="Completeness" value={completenessScore} description={descriptions.completeness} />
        )}
      </View>

      {/* Feedback: structured multi-part tips (when available) */}
      {feedback && !result.passed && (
        <View className="rounded-lg p-3 gap-2.5" style={{ backgroundColor: accentColor + '10' }}>
          {/* Contrast explanation */}
          <View className="flex-row gap-2">
            <Ionicons name="ear-outline" size={14} color={accentColor} style={{ marginTop: 1 }} />
            <Text className="text-xs text-text-secondary leading-relaxed flex-1">
              {feedback.contrastExplanation}
            </Text>
          </View>
          {/* Articulatory tip */}
          <View className="flex-row gap-2">
            <Ionicons name="body-outline" size={14} color={accentColor} style={{ marginTop: 1 }} />
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

      {/* Visual phoneme diff (word mode, mispronounced) */}
      {showPhonemeDiff && refPhonemes && recPhonemes && (
        <View className="rounded-lg p-3 mb-2" style={{ backgroundColor: '#0000000A' }}>
          <Text className="text-xs font-semibold text-text-secondary mb-2">Sound Comparison</Text>
          <View className="gap-2">
            <View className="flex-row items-center gap-2">
              <Text className="text-[10px] text-text-muted min-w-[52px]">Expected:</Text>
              <View className="flex-row flex-wrap gap-1">
                {refPhonemes.map((p, i) => {
                  const isDiff = diff && i === diff.firstDiffIndex;
                  return (
                    <View key={i} className="items-center">
                      <View className="rounded px-1.5 py-0.5" style={{ backgroundColor: isDiff ? '#10B98125' : '#0000000A', borderWidth: isDiff ? 1 : 0, borderColor: '#10B981' }}>
                        <Text className="text-xs font-semibold" style={{ color: isDiff ? '#10B981' : '#78909C', fontFamily: 'monospace' }}>{p}</Text>
                      </View>
                      {isDiff && PHONEME_LABELS[p] && (
                        <Text className="text-center mt-0.5" style={{ fontSize: 7, color: '#10B981', lineHeight: 9, maxWidth: 64 }}>{PHONEME_LABELS[p]}</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
            <View className="flex-row items-center gap-2">
              <Text className="text-[10px] text-text-muted min-w-[52px]">You said:</Text>
              <View className="flex-row flex-wrap gap-1">
                {recPhonemes.map((p, i) => {
                  const isDiff = diff && i === diff.firstDiffIndex;
                  return (
                    <View key={i} className="items-center">
                      <View className="rounded px-1.5 py-0.5" style={{ backgroundColor: isDiff ? '#F9731625' : '#0000000A', borderWidth: isDiff ? 1 : 0, borderColor: '#F97316' }}>
                        <Text className="text-xs font-semibold" style={{ color: isDiff ? '#F97316' : '#78909C', fontFamily: 'monospace' }}>{p}</Text>
                      </View>
                      {isDiff && PHONEME_LABELS[p] && (
                        <Text className="text-center mt-0.5" style={{ fontSize: 7, color: '#F97316', lineHeight: 9, maxWidth: 64 }}>{PHONEME_LABELS[p]}</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Legacy tip (no feedback context) */}
      {!feedback && legacyTip.length > 0 && (
        <View className="rounded-lg px-3 py-2.5" style={{ backgroundColor: accentColor + '12' }}>
          <Text className="text-xs text-text-secondary leading-relaxed">
            <Text className="font-semibold" style={{ color: accentColor }}>Tip: </Text>
            {legacyTip}
          </Text>
        </View>
      )}

    </View>
  );
}

// ─── Sub-score with description ──────────────────────────────────────────────

function SubScore({ label, value, description }: { label: string; value: number; description: string }) {
  const color = value >= 90 ? '#10B981' : value >= 61 ? '#84CC16' : value >= 31 ? '#F97316' : '#991B1B';
  return (
    <View className="gap-1">
      <View className="flex-row items-center gap-2">
        <Text className="text-sm font-bold" style={{ color }}>{value}%</Text>
        <Text className="text-xs font-semibold text-text-primary">{label}</Text>
        <View className="h-1.5 rounded-full bg-surface-page overflow-hidden flex-1">
          <View className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
        </View>
      </View>
      <Text className="text-xs text-text-muted leading-relaxed ml-1">
        {description}
      </Text>
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
