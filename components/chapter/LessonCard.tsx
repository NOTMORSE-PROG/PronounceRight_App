import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Lesson } from '@/types/content';

interface LessonCardProps {
  lesson: Lesson;
  accentColor?: string;
}

export default function LessonCard({ lesson, accentColor = '#2196F3' }: LessonCardProps) {
  return (
    <View className="bg-white rounded-2xl border border-border p-5 mb-3">
      {/* Header */}
      <View className="flex-row items-center gap-3 mb-4">
        <View
          className="w-9 h-9 rounded-xl items-center justify-center"
          style={{ backgroundColor: accentColor + '18' }}
        >
          <Ionicons name="book-outline" size={18} color={accentColor} />
        </View>
        <Text className="text-base font-bold text-text-primary flex-1">{lesson.title}</Text>
      </View>

      {/* Paragraphs */}
      {lesson.paragraphs.map((para, i) => (
        <Text key={i} className="text-base leading-relaxed mb-3" style={{ textAlign: 'justify', color: '#111111' }}>
          {para}
        </Text>
      ))}

      {/* Examples */}
      {lesson.examples && lesson.examples.length > 0 && (
        <View className="mt-1">
          <Text className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
            Examples
          </Text>
          {lesson.examples.map((ex, i) => (
            <View
              key={i}
              className="rounded-xl p-3 mb-2"
              style={{ backgroundColor: accentColor + '0D' }}
            >
              <Text
                className="text-sm font-semibold text-text-primary mb-0.5"
                style={{ color: accentColor }}
              >
                {ex.text}
              </Text>
              <Text className="text-sm italic" style={{ color: '#111111' }}>{ex.explanation}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
