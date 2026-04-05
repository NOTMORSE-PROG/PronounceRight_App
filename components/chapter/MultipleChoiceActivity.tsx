import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SpeakWordButton from '@/components/ui/SpeakWordButton';

export interface McqQuestion {
  prompt: string;
  speakWord?: string;
  options: { label: string; value: string }[];
  correctValue: string;
}

interface MultipleChoiceActivityProps {
  activityTitle: string;
  direction: string;
  questions: McqQuestion[];
  accentColor?: string;
  onComplete?: (score: number) => void;
}

export default function MultipleChoiceActivity({
  activityTitle,
  direction,
  questions,
  accentColor = '#2196F3',
  onComplete,
}: MultipleChoiceActivityProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = questions[currentIndex]!;

  function handleConfirm() {
    if (!selected) return;
    setConfirmed(true);
    if (selected === current.correctValue) {
      setCorrectCount((c) => c + 1);
    }
  }

  function handleNext() {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= questions.length) {
      const score = Math.round(
        ((correctCount + (selected === current.correctValue ? 1 : 0)) / questions.length) * 100
      );
      setFinished(true);
      onComplete?.(score);
    } else {
      setCurrentIndex(nextIndex);
      setSelected(null);
      setConfirmed(false);
    }
  }

  if (finished) {
    const score = Math.round((correctCount / questions.length) * 100);
    return (
      <View className="bg-white rounded-2xl border border-border p-5 mb-3">
        <ActivityHeader title={activityTitle} accentColor={accentColor} />
        <View className="items-center py-4">
          <View
            className="w-16 h-16 rounded-full items-center justify-center mb-3"
            style={{ backgroundColor: score >= 70 ? '#10B98120' : '#EF444420' }}
          >
            <Ionicons
              name={score >= 70 ? 'checkmark-circle' : 'close-circle'}
              size={36}
              color={score >= 70 ? '#10B981' : '#EF4444'}
            />
          </View>
          <Text className="text-xl font-bold text-text-primary mb-1">
            {score >= 70 ? 'Well done!' : 'Keep practicing!'}
          </Text>
          <Text className="text-sm text-text-muted mb-3">
            {correctCount} of {questions.length} correct
          </Text>
          <View
            className="rounded-full px-5 py-2"
            style={{ backgroundColor: score >= 70 ? '#10B98120' : '#EF444420' }}
          >
            <Text
              className="text-base font-bold"
              style={{ color: score >= 70 ? '#10B981' : '#EF4444' }}
            >
              Score: {score}%
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="bg-white rounded-2xl border border-border p-5 mb-3">
      <ActivityHeader title={activityTitle} accentColor={accentColor} />

      {/* Direction */}
      <Text className="text-sm text-text-secondary mb-4 leading-relaxed" style={{ textAlign: 'justify' }}>{direction}</Text>

      {/* Progress */}
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-xs text-text-muted">
          Question {currentIndex + 1} of {questions.length}
        </Text>
        <View className="flex-row gap-1">
          {questions.map((_, i) => (
            <View
              key={i}
              className="h-1.5 rounded-full"
              style={{
                width: 20,
                backgroundColor:
                  i < currentIndex
                    ? accentColor
                    : i === currentIndex
                    ? accentColor + '60'
                    : '#E2E8F0',
              }}
            />
          ))}
        </View>
      </View>

      {/* Prompt */}
      <View
        className="rounded-xl p-4 mb-4 flex-row items-center justify-center gap-3"
        style={{ backgroundColor: accentColor + '0D' }}
      >
        {current.speakWord && (
          <SpeakWordButton word={current.speakWord} accentColor={accentColor} />
        )}
        <Text className="text-base font-semibold text-text-primary text-center flex-shrink">
          {current.prompt}
        </Text>
      </View>

      {/* Options */}
      <View className="gap-2 mb-4">
        {current.options.map((opt) => {
          const isSelected = selected === opt.value;
          const isThisCorrect = opt.value === current.correctValue;

          let borderColor = '#BBDEFB';
          let bgColor = 'transparent';
          let textColor = '#1A237E';

          if (confirmed) {
            if (isThisCorrect) {
              borderColor = '#10B981';
              bgColor = '#10B98115';
              textColor = '#10B981';
            } else if (isSelected && !isThisCorrect) {
              borderColor = '#EF4444';
              bgColor = '#EF444415';
              textColor = '#EF4444';
            }
          } else if (isSelected) {
            borderColor = accentColor;
            bgColor = accentColor + '15';
            textColor = accentColor;
          }

          return (
            <Pressable
              key={opt.value}
              onPress={() => !confirmed && setSelected(opt.value)}
              disabled={confirmed}
              className="rounded-xl border p-4 flex-row items-center justify-between"
              style={{ borderColor, backgroundColor: bgColor }}
            >
              <Text className="text-sm font-medium flex-1" style={{ color: textColor }}>
                {opt.label}
              </Text>
              {confirmed && isThisCorrect && (
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              )}
              {confirmed && isSelected && !isThisCorrect && (
                <Ionicons name="close-circle" size={18} color="#EF4444" />
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Action buttons */}
      {!confirmed ? (
        <Pressable
          className="rounded-xl py-4 items-center"
          style={{
            backgroundColor: selected ? accentColor : '#E2E8F0',
            opacity: selected ? 1 : 0.6,
          }}
          onPress={handleConfirm}
          disabled={!selected}
        >
          <Text
            className="font-bold text-base"
            style={{ color: selected ? '#fff' : '#90A4AE' }}
          >
            Confirm
          </Text>
        </Pressable>
      ) : (
        <Pressable
          className="rounded-xl py-4 items-center active:opacity-80"
          style={{ backgroundColor: accentColor }}
          onPress={handleNext}
        >
          <Text className="text-white font-bold text-base">
            {currentIndex + 1 >= questions.length ? 'See Results' : 'Next →'}
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
        <Ionicons name="help-circle-outline" size={18} color={accentColor} />
      </View>
      <Text className="text-base font-bold text-text-primary flex-1">{title}</Text>
    </View>
  );
}
