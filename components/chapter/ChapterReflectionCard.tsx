import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ASSESSMENT_CONFIG } from '@/lib/assessment-config';
import type { ReflectionData } from '@/lib/reflection';

interface ChapterReflectionCardProps {
  reflection: ReflectionData;
  accentColor: string;
  moduleNumber: number;
  chapterNumber: number;
  nextChapterId: string | null;
  onBackToModule: () => void;
  onNextChapter: () => void;
}

const ERROR_LABELS: Record<string, string> = {
  pronunciation: 'Pronunciation',
  omission: 'Omission',
  redundancy: 'Extra Words',
  tone: 'Tone',
  unexpectedPause: 'Unexpected Pause',
  missingPause: 'Missing Pause',
};

export default function ChapterReflectionCard({
  reflection,
  accentColor,
  moduleNumber,
  chapterNumber,
  nextChapterId,
  onBackToModule,
  onNextChapter,
}: ChapterReflectionCardProps) {
  const { avgScore, passed, strongActivities, weakActivities, weakWords, commonErrors } = reflection;

  return (
    <View className="rounded-2xl border border-border p-5 mt-2 mb-4" style={{ backgroundColor: passed ? '#10B98108' : '#FEF2F208' }}>

      {/* Score summary */}
      <View className="items-center mb-5">
        <Ionicons
          name={passed ? 'checkmark-circle' : 'close-circle'}
          size={48}
          color={passed ? '#10B981' : '#EF4444'}
        />
        <Text className="text-xl font-bold text-text-primary mt-3 mb-1">
          {passed ? 'Chapter Complete!' : 'Keep Practicing!'}
        </Text>
        <Text className="text-sm text-text-muted mb-3">Score: {avgScore}%</Text>
        <View
          className="rounded-full px-4 py-1.5"
          style={{ backgroundColor: passed ? '#10B981' : '#EF4444' }}
        >
          <Text className="text-white text-xs font-bold">
            {passed ? '+50 XP Earned' : 'Score 90%+ to earn XP'}
          </Text>
        </View>
      </View>

      {/* Common error patterns */}
      {commonErrors.length > 0 && (
        <View className="mb-4">
          <SectionHeader icon="alert-circle-outline" title="Common Errors" color="#F97316" />
          <View className="flex-row flex-wrap gap-1.5 mt-2">
            {commonErrors.map((err) => (
              <View
                key={err}
                className="rounded-full px-3 py-1.5"
                style={{ backgroundColor: (ASSESSMENT_CONFIG.errorColors[err] ?? '#999') + '20' }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{ color: ASSESSMENT_CONFIG.errorColors[err] ?? '#999' }}
                >
                  {ERROR_LABELS[err] ?? err}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Areas to improve */}
      {weakActivities.length > 0 && (
        <View className="mb-4">
          <SectionHeader icon="trending-up-outline" title="Areas to Improve" color="#F97316" />
          <View className="gap-2 mt-2">
            {weakActivities.map((act) => (
              <View key={act.id} className="rounded-xl border border-border p-3 flex-row items-center justify-between bg-white">
                <Text className="text-sm text-text-primary flex-1 mr-2" numberOfLines={1}>{act.title}</Text>
                <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: '#EF444418' }}>
                  <Text className="text-xs font-bold" style={{ color: '#EF4444' }}>{act.score}%</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Word-level breakdown */}
      {weakWords.length > 0 && (
        <View className="mb-4">
          <SectionHeader icon="text-outline" title="Words to Practice" color={accentColor} />
          <View className="gap-2 mt-2">
            {weakWords.map((w, i) => (
              <View key={`${w.activityId}-${i}`} className="rounded-xl border border-border p-3 bg-white">
                <View className="flex-row items-center justify-between mb-1.5">
                  <Text className="text-base font-semibold text-text-primary">{w.word}</Text>
                  <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: getScoreColor(w.score) + '18' }}>
                    <Text className="text-xs font-bold" style={{ color: getScoreColor(w.score) }}>{w.score}%</Text>
                  </View>
                </View>
                {w.transcript ? (
                  <Text className="text-xs text-text-muted italic mb-1">
                    You said: <Text className="font-semibold not-italic text-text-secondary">{w.transcript}</Text>
                  </Text>
                ) : null}
                {w.tip ? (
                  <View className="rounded-lg px-2.5 py-2 mt-1" style={{ backgroundColor: accentColor + '10' }}>
                    <View className="flex-row gap-1.5">
                      <Ionicons name="bulb-outline" size={13} color={accentColor} style={{ marginTop: 1 }} />
                      <Text className="text-xs text-text-secondary leading-relaxed flex-1">{w.tip}</Text>
                    </View>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Strengths */}
      {strongActivities.length > 0 && (
        <View className="mb-4">
          <SectionHeader icon="star-outline" title="Your Strengths" color="#10B981" />
          <View className="gap-2 mt-2">
            {strongActivities.map((act) => (
              <View key={act.id} className="rounded-xl border border-border p-3 flex-row items-center justify-between bg-white">
                <Text className="text-sm text-text-primary flex-1 mr-2" numberOfLines={1}>{act.title}</Text>
                <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: '#10B98118' }}>
                  <Text className="text-xs font-bold" style={{ color: '#10B981' }}>{act.score}%</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Navigation buttons */}
      <View className="flex-row gap-3 flex-wrap justify-center mt-2">
        <Pressable
          className="border-2 rounded-xl py-3 px-5 items-center active:opacity-70"
          style={{ borderColor: accentColor }}
          onPress={onBackToModule}
        >
          <Text className="font-semibold text-base" style={{ color: accentColor }}>
            {'\u2190'} Back to Module
          </Text>
        </Pressable>

        {nextChapterId && passed && (
          <Pressable
            className="rounded-xl py-3 px-5 items-center active:opacity-80"
            style={{ backgroundColor: accentColor }}
            onPress={onNextChapter}
          >
            <Text className="font-semibold text-base text-white">
              Next Chapter {'\u2192'}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionHeader({ icon, title, color }: { icon: string; title: string; color: string }) {
  return (
    <View className="flex-row items-center gap-2">
      <Ionicons name={icon as any} size={16} color={color} />
      <Text className="text-sm font-bold text-text-primary">{title}</Text>
    </View>
  );
}

function getScoreColor(score: number): string {
  if (score >= 90) return '#10B981';
  if (score >= 61) return '#84CC16';
  if (score >= 31) return '#F97316';
  return '#991B1B';
}
