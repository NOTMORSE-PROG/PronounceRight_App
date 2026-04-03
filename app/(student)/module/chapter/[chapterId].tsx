import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '@/components/ui/ScreenHeader';
import Chip from '@/components/ui/Chip';
import LessonCard from '@/components/chapter/LessonCard';
import MultipleChoiceActivity, { McqQuestion } from '@/components/chapter/MultipleChoiceActivity';
import PronunciationDrillActivity from '@/components/chapter/PronunciationDrillActivity';
import MinimalPairActivity from '@/components/chapter/MinimalPairActivity';
import SpeechRecordingActivity, { SpeechPrompt } from '@/components/chapter/SpeechRecordingActivity';
import SequencingActivity from '@/components/chapter/SequencingActivity';
import ChapterReflectionCard from '@/components/chapter/ChapterReflectionCard';
import { MODULES_DATA } from '@/types';
import { getChapterContent } from '@/content';
import { useProgressStore } from '@/stores/progress';
import { useAuthStore } from '@/stores/auth';
import { useWhisperModel } from '@/lib/engine/use-whisper-model';
import { saveActivityCompletion, getActivityCompletion } from '@/lib/db';
import { buildReflectionData } from '@/lib/reflection';
import type { ReflectionData } from '@/lib/reflection';
import type {
  Activity,
  StressMcqActivity,
  IntonationMcqActivity,
  VowelSoundItem,
} from '@/types/content';

const MODULES_WITH_IDS = MODULES_DATA.map((m, i) => ({ ...m, id: `m${i + 1}` }));
const MODULE_COLORS = ['#2196F3', '#00BCD4', '#FF9800'];

// ─── Vowel Identification (inline, no separate file needed) ───────────────────

function VowelIdentificationInline({
  items,
  accentColor,
  direction,
  title,
  studentId,
  activityId,
  onComplete,
}: {
  items: VowelSoundItem[];
  accentColor: string;
  direction: string;
  title: string;
  studentId?: string;
  activityId?: string;
  onComplete?: (score: number) => void;
}) {
  const [answers, setAnswers] = useState<Record<number, 'short' | 'long' | null>>(
    Object.fromEntries(items.map((_, i) => [i, null]))
  );
  const [submitted, setSubmitted] = useState(false);

  // Restore saved answers on mount
  useEffect(() => {
    if (!studentId || !activityId) return;
    getActivityCompletion(studentId, activityId).then((row) => {
      if (!row) return;
      const saved = JSON.parse(row.answers) as Record<number, 'short' | 'long' | null>;
      setAnswers(saved);
      setSubmitted(true);
      onComplete?.(row.score);
    }).catch(() => {/* ignore */});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleAnswer(index: number, value: 'short' | 'long') {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [index]: value }));
  }

  async function handleSubmit() {
    const correct = items.filter((item, i) => answers[i] === item.vowelType).length;
    const sc = Math.round((correct / items.length) * 100);
    setSubmitted(true);
    onComplete?.(sc);
    if (studentId && activityId) {
      await saveActivityCompletion({
        id: `${studentId}_${activityId}`,
        student_id: studentId,
        activity_id: activityId,
        score: sc,
        answers: JSON.stringify(answers),
        created_at: new Date().toISOString(),
      }).catch(() => {/* ignore */});
    }
  }

  const allAnswered = Object.values(answers).every((v) => v !== null);
  const score = submitted
    ? Math.round(items.filter((item, i) => answers[i] === item.vowelType).length / items.length * 100)
    : 0;

  return (
    <View className="bg-white rounded-2xl border border-border p-5 mb-3">
      <View className="flex-row items-center gap-3 mb-4">
        <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: accentColor + '18' }}>
          <Ionicons name="text-outline" size={18} color={accentColor} />
        </View>
        <Text className="text-base font-bold text-text-primary flex-1">{title}</Text>
      </View>

      <Text className="text-sm text-text-secondary mb-4 leading-relaxed" style={{ textAlign: 'justify' }}>{direction}</Text>

      <View className="gap-2 mb-4">
        {items.map((item, index) => {
          const userAnswer = answers[index];
          const isCorrect = submitted && userAnswer === item.vowelType;
          const isWrong = submitted && userAnswer !== null && userAnswer !== item.vowelType;

          return (
            <View
              key={index}
              className="flex-row items-center justify-between rounded-xl border p-3"
              style={{
                borderColor: isCorrect ? '#10B981' : isWrong ? '#EF4444' : '#BBDEFB',
                backgroundColor: isCorrect ? '#10B98108' : isWrong ? '#EF444408' : '#F8FFFE',
              }}
            >
              <View className="flex-1 mr-3">
                <Text className="text-base font-semibold text-text-primary">{item.word}</Text>
                <Text
                  className="text-xs text-text-muted mt-0.5"
                  style={{ fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier' }}
                >
                  {item.ipa}
                </Text>
              </View>
              <View className="flex-row gap-2">
                {(['short', 'long'] as const).map((type) => {
                  const isSelected = userAnswer === type;
                  const isThisCorrect = submitted && item.vowelType === type;
                  return (
                    <Pressable
                      key={type}
                      onPress={() => handleAnswer(index, type)}
                      disabled={submitted}
                      className="rounded-full px-3 py-1.5"
                      style={{
                        backgroundColor: isThisCorrect
                          ? '#10B981'
                          : isSelected && !submitted
                          ? accentColor
                          : isSelected && submitted
                          ? '#EF4444'
                          : '#E2E8F0',
                      }}
                    >
                      <Text
                        className="text-xs font-semibold capitalize"
                        style={{ color: isSelected || isThisCorrect ? '#fff' : '#546E7A' }}
                      >
                        {type}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>

      {!submitted ? (
        <Pressable
          className="rounded-xl py-4 items-center"
          style={{ backgroundColor: allAnswered ? accentColor : '#E2E8F0', opacity: allAnswered ? 1 : 0.6 }}
          onPress={handleSubmit}
          disabled={!allAnswered}
        >
          <Text className="font-bold text-base" style={{ color: allAnswered ? '#fff' : '#90A4AE' }}>
            Submit Answers
          </Text>
        </Pressable>
      ) : (
        <View className="rounded-xl p-3 flex-row items-center gap-2" style={{ backgroundColor: '#10B98115' }}>
          <Ionicons name="checkmark-circle" size={18} color="#10B981" />
          <Text className="text-sm font-semibold text-green-700">Score: {score}%</Text>
        </View>
      )}
    </View>
  );
}

// ─── Activity Renderer ────────────────────────────────────────────────────────

function ActivityRenderer({
  activity,
  accentColor,
  studentId,
  whisperCtx,
  vadCtx,
  onComplete,
}: {
  activity: Activity;
  accentColor: string;
  studentId?: string;
  whisperCtx?: import('whisper.rn').WhisperContext;
  vadCtx?: import('whisper.rn').WhisperVadContext | null;
  onComplete: (id: string, score: number) => void;
}) {
  switch (activity.type) {
    case 'identify_pronunciation':
      return (
        <PronunciationDrillActivity
          activityTitle={activity.title}
          direction={activity.direction}
          words={activity.items.map((it) => ({ word: it.word }))}
          passThreshold={activity.passThreshold}
          accentColor={accentColor}
          studentId={studentId}
          activityId={activity.id}
          whisperCtx={whisperCtx}
          vadCtx={vadCtx}
          onComplete={(score) => onComplete(activity.id, score)}
        />
      );

    case 'free_speech_recording': {
      const prompt: SpeechPrompt = { id: activity.id, text: activity.promptText, hidden: false };
      return (
        <SpeechRecordingActivity
          activityTitle={activity.title}
          direction={activity.direction}
          prompts={[prompt]}
          sentenceCount={activity.sentenceCount}
          accentColor={accentColor}
          studentId={studentId}
          activityId={activity.id}
          onComplete={() => onComplete(activity.id, 100)}
        />
      );
    }

    case 'vowel_identification':
      return (
        <VowelIdentificationInline
          title={activity.title}
          direction={activity.direction}
          items={activity.items}
          accentColor={accentColor}
          studentId={studentId}
          activityId={activity.id}
          onComplete={(score) => onComplete(activity.id, score)}
        />
      );

    case 'consonant_drill':
      return (
        <PronunciationDrillActivity
          activityTitle={activity.title}
          direction={activity.direction}
          words={activity.items.map((it) => ({ word: it.word, ipa: it.ipa }))}
          passThreshold={activity.passThreshold}
          accentColor={accentColor}
          studentId={studentId}
          activityId={activity.id}
          whisperCtx={whisperCtx}
          vadCtx={vadCtx}
          onComplete={(score) => onComplete(activity.id, score)}
        />
      );

    case 'minimal_pair_drill':
      return (
        <MinimalPairActivity
          activityTitle={activity.title}
          direction={activity.direction}
          items={activity.items}
          passThreshold={activity.passThreshold}
          accentColor={accentColor}
          studentId={studentId}
          activityId={activity.id}
          whisperCtx={whisperCtx}
          vadCtx={vadCtx}
          onComplete={(score) => onComplete(activity.id, score)}
        />
      );

    case 'stress_mcq': {
      const questions: McqQuestion[] = (activity as StressMcqActivity).items.map((item) => ({
        prompt: item.syllables.join(' · '),
        options: item.syllables.map((s, i) => ({ label: s, value: String(i) })),
        correctValue: String(item.correctIndex),
      }));
      return (
        <MultipleChoiceActivity
          activityTitle={activity.title}
          direction={activity.direction}
          questions={questions}
          accentColor={accentColor}
          onComplete={(score) => onComplete(activity.id, score)}
        />
      );
    }

    case 'stress_drill':
      return (
        <PronunciationDrillActivity
          activityTitle={activity.title}
          direction={activity.direction}
          words={activity.words.map((w) => ({ word: w }))}
          passThreshold={activity.passThreshold}
          accentColor={accentColor}
          studentId={studentId}
          activityId={activity.id}
          whisperCtx={whisperCtx}
          vadCtx={vadCtx}
          onComplete={(score) => onComplete(activity.id, score)}
        />
      );

    case 'intonation_mcq': {
      const questions: McqQuestion[] = (activity as IntonationMcqActivity).items.map((item) => ({
        prompt: item.sentence,
        options: [
          { label: 'Rising ↗', value: 'rising' },
          { label: 'Falling ↘', value: 'falling' },
        ],
        correctValue: item.correctAnswer,
      }));
      return (
        <MultipleChoiceActivity
          activityTitle={activity.title}
          direction={activity.direction}
          questions={questions}
          accentColor={accentColor}
          onComplete={(score) => onComplete(activity.id, score)}
        />
      );
    }

    case 'intonation_drill':
      return (
        <PronunciationDrillActivity
          activityTitle={activity.title}
          direction={activity.direction}
          words={activity.sentences.map((s) => ({ word: s }))}
          passThreshold={activity.passThreshold}
          accentColor={accentColor}
          studentId={studentId}
          activityId={activity.id}
          whisperCtx={whisperCtx}
          vadCtx={vadCtx}
          onComplete={(score) => onComplete(activity.id, score)}
        />
      );

    case 'pick_and_speak':
      return (
        <SpeechRecordingActivity
          activityTitle={activity.title}
          direction={activity.direction}
          prompts={activity.cueCards.map((c, i) => ({ id: String(i), text: c, hidden: true }))}
          sentenceCount={activity.sentenceCount}
          accentColor={accentColor}
          studentId={studentId}
          activityId={activity.id}
          onComplete={() => onComplete(activity.id, 100)}
        />
      );

    case 'sentence_sequencing':
      return (
        <SequencingActivity
          activityTitle={activity.title}
          direction={activity.direction}
          passages={activity.passages}
          maxAudioPlays={activity.maxAudioPlays}
          accentColor={accentColor}
          onComplete={(score) => onComplete(activity.id, score)}
        />
      );

    default:
      return null;
  }
}

// ─── Chapter Screen ───────────────────────────────────────────────────────────

export default function ChapterScreen() {
  const { chapterId } = useLocalSearchParams<{ chapterId: string; moduleId: string }>();

  let foundChapter = null;
  let foundModule = null;
  let moduleIndex = 0;

  for (let i = 0; i < MODULES_WITH_IDS.length; i++) {
    const m = MODULES_WITH_IDS[i]!;
    const c = m.chapters.find((ch) => ch.id === chapterId);
    if (c) { foundChapter = c; foundModule = m; moduleIndex = i; break; }
  }

  const module = foundModule ?? MODULES_WITH_IDS[0]!;
  const chapter = foundChapter ?? module.chapters[0]!;
  const color = MODULE_COLORS[moduleIndex % MODULE_COLORS.length]!;

  const chapterIndex = module.chapters.findIndex((ch) => ch.id === chapterId);
  const nextChapter = module.chapters[chapterIndex + 1] ?? null;

  const content = getChapterContent(chapterId ?? '');
  const sections = content?.sections ?? [];
  const hasContent = sections.length > 0;

  const studentId = useAuthStore((s) => s.user?.id);
  const modelState = useWhisperModel();
  const whisperCtx = modelState.status === 'ready' ? modelState.ctx : undefined;
  const vadCtx = modelState.status === 'ready' ? modelState.vadCtx : undefined;

  // ─── Activity completion (feeds module % progress) ──────────────────────────
  const [activityScores, setActivityScores] = useState<Record<string, number>>({});
  const { updateChapterProgress, chapterProgress, updateLastStep, touchLastAccessed, recordPractice, checkAndAwardBadges } = useProgressStore();

  const scorableIds = sections
    .filter((s): s is { kind: 'activity'; data: Activity } =>
      s.kind === 'activity' && s.data.passThreshold > 0)
    .map((s) => s.data.id);

  const allActivityIds = sections
    .filter((s): s is { kind: 'activity'; data: Activity } => s.kind === 'activity')
    .map((s) => s.data.id);

  const allDone =
    hasContent &&
    allActivityIds.length > 0 &&
    allActivityIds.every((id) => activityScores[id] !== undefined);

  const avgScore =
    scorableIds.length > 0
      ? Math.round(scorableIds.reduce((sum, id) => sum + (activityScores[id] ?? 0), 0) / scorableIds.length)
      : 100;

  useEffect(() => {
    if (!allDone || !chapterId) return;
    const prev = chapterProgress[chapterId];
    updateChapterProgress({
      chapterId,
      attempts: (prev?.attempts ?? 0) + 1,
      bestScore: Math.max(avgScore, prev?.bestScore ?? 0),
      completed: avgScore >= 70,
      completedAt: avgScore >= 70 ? new Date().toISOString() : (prev?.completedAt ?? null),
      lastStep: prev?.lastStep ?? null,
      lastAccessedAt: prev?.lastAccessedAt ?? null,
    });
    recordPractice();
    checkAndAwardBadges();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone]);

  // ─── Reflection data (built when chapter is complete) ────────────────────────
  const [reflectionData, setReflectionData] = useState<ReflectionData | null>(null);

  useEffect(() => {
    if (!allDone || !studentId || scorableIds.length === 0) return;
    buildReflectionData(studentId, sections, activityScores).then(setReflectionData).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone]);

  function handleActivityComplete(id: string, score: number) {
    setActivityScores((prev) => ({ ...prev, [id]: score }));
  }

  // ─── Pagination state ────────────────────────────────────────────────────────

  // If chapter was previously completed, unlock all steps for free review
  const initialStepCompleted = useMemo(() => {
    const alreadyCompleted = chapterProgress[chapterId ?? '']?.completed ?? false;
    const map: Record<number, boolean> = {};
    if (alreadyCompleted) {
      sections.forEach((_, i) => { map[i] = true; });
    }
    return map;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections]);

  // Restore last step position (completed chapters start at 0 for review)
  const initialStep = useMemo(() => {
    const cp = chapterProgress[chapterId ?? ''];
    if (cp?.completed) return 0;
    const stored = cp?.lastStep ?? 0;
    return Math.min(Math.max(stored, 0), Math.max(sections.length - 1, 0));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections]);

  // Record last accessed timestamp on mount
  useEffect(() => {
    if (chapterId) touchLastAccessed(chapterId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId]);

  const [currentStep, setCurrentStep] = useState(initialStep);
  const [stepCompleted, setStepCompleted] = useState<Record<number, boolean>>(initialStepCompleted);

  // Lesson steps auto-complete as soon as they're viewed (no action required)
  const currentSection = sections[currentStep];
  useEffect(() => {
    if (currentSection?.kind === 'lesson' && !stepCompleted[currentStep]) {
      setStepCompleted((prev) => ({ ...prev, [currentStep]: true }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  // Persist current step so "Resume" returns here
  useEffect(() => {
    if (!chapterId) return;
    if (chapterProgress[chapterId]?.completed) return;
    updateLastStep(chapterId, currentStep);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, chapterId]);

  const isCurrentStepComplete = !!stepCompleted[currentStep];
  const isLastStep = currentStep === sections.length - 1;
  const isChapterDone = isLastStep && isCurrentStepComplete;

  function handleStepActivityComplete(id: string, score: number) {
    handleActivityComplete(id, score); // feeds allDone → updateChapterProgress → module %
    const stepIndex = sections.findIndex(
      (s) => s.kind === 'activity' && s.data.id === id
    );
    if (stepIndex === -1) return;
    const isLastActivity = stepIndex === sections.length - 1;
    // Last activity is gated — pronunciation drills gate themselves and only call
    // onComplete when all pairs pass. For non-pronunciation last activities, require ≥70.
    // All earlier activities complete freely.
    if (!isLastActivity || score >= 70) {
      setStepCompleted((prev) => ({ ...prev, [stepIndex]: true }));
    }
  }

  function handleNext() {
    if (currentStep < sections.length - 1) setCurrentStep((s) => s + 1);
  }

  function handleBack() {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-page" edges={['top']}>
      <ScreenHeader title={`Chapter ${chapter.number}`} showBack />

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="py-4 px-4">

          {/* Hero */}
          <View
            className="mb-4 rounded-2xl p-5 border border-border"
            style={{ backgroundColor: color + '15' }}
          >
            <View className="flex-row items-start justify-between mb-3">
              <View className="flex-1 mr-3">
                <Text className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">
                  Module {module.number} · Chapter {chapter.number}
                </Text>
                <Text className="text-xl font-bold text-text-primary">{chapter.title}</Text>
              </View>
              <View
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{ backgroundColor: color }}
              >
                <Text className="text-white font-bold text-lg">{chapter.number}</Text>
              </View>
            </View>
            <Chip label={chapter.skillFocus} variant="primary" />
          </View>

          {/* Assessment engine loading banner */}
          {modelState.status === 'loading' && (
            <View className="rounded-xl p-3 mb-3 flex-row items-center gap-2" style={{ backgroundColor: color + '15' }}>
              <ActivityIndicator size="small" color={color} />
              <Text className="text-sm flex-1" style={{ color }}>Preparing assessment engine…</Text>
            </View>
          )}
          {modelState.status === 'error' && (
            <View className="rounded-xl p-3 mb-3 flex-row items-center gap-2" style={{ backgroundColor: '#EF444415' }}>
              <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
              <Text className="text-sm text-red-600 flex-1">Assessment engine failed to load.</Text>
            </View>
          )}

          {/* Step indicator */}
          {hasContent && sections.length > 1 && (
            <>
              <Text className="text-xs font-semibold text-text-muted text-center mb-2">
                Step {currentStep + 1} of {sections.length}
              </Text>
              <View className="flex-row items-center justify-center gap-2 mb-4">
                {sections.map((_, i) => (
                  <View
                    key={i}
                    style={{
                      width: i === currentStep ? 20 : 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor:
                        i === currentStep ? color
                        : stepCompleted[i] ? '#10B981'
                        : '#E2E8F0',
                    }}
                  />
                ))}
              </View>
            </>
          )}

          {/* All sections rendered but only current is visible — keeps activity state alive across navigation */}
          {!hasContent ? (
            <ComingSoonCard color={color} />
          ) : (
            sections.map((section, i) => (
              <View key={i} style={{ display: i === currentStep ? 'flex' : 'none' }}>
                {section.kind === 'lesson' ? (
                  <LessonCard lesson={section.data} accentColor={color} />
                ) : (
                  <ActivityRenderer
                    activity={section.data}
                    accentColor={color}
                    studentId={studentId}
                    whisperCtx={whisperCtx}
                    vadCtx={vadCtx}
                    onComplete={handleStepActivityComplete}
                  />
                )}
              </View>
            ))
          )}

          {/* Navigation row / completion banner */}
          {hasContent && (
            isChapterDone ? (
              // ── Chapter complete: reflection card or simple banner ─────────
              reflectionData ? (
                <ChapterReflectionCard
                  reflection={reflectionData}
                  accentColor={color}
                  moduleNumber={module.number}
                  chapterNumber={chapter.number}
                  nextChapterId={nextChapter?.id ?? null}
                  onBackToModule={() =>
                    router.push({ pathname: '/(student)/module/[moduleId]', params: { moduleId: module.id } })
                  }
                  onNextChapter={() =>
                    nextChapter && router.replace({ pathname: '/(student)/module/chapter/[chapterId]', params: { chapterId: nextChapter.id } })
                  }
                />
              ) : (
                <View
                  className="rounded-2xl p-5 mt-2 mb-4 items-center"
                  style={{ backgroundColor: avgScore >= 70 ? '#10B98115' : '#EF444415' }}
                >
                  <Ionicons
                    name={avgScore >= 70 ? 'checkmark-circle' : 'close-circle'}
                    size={48}
                    color={avgScore >= 70 ? '#10B981' : '#EF4444'}
                  />
                  <Text className="text-xl font-bold text-text-primary mt-3 mb-1">
                    {avgScore >= 70 ? 'Chapter Complete!' : 'Keep Practicing!'}
                  </Text>
                  {scorableIds.length > 0 && (
                    <Text className="text-sm text-text-muted mb-3">Score: {avgScore}%</Text>
                  )}
                  <View
                    className="rounded-full px-4 py-1.5 mb-4"
                    style={{ backgroundColor: avgScore >= 70 ? '#10B981' : '#EF4444' }}
                  >
                    <Text className="text-white text-xs font-bold">
                      {avgScore >= 70 ? 'Well done!' : 'Score 70%+ to pass'}
                    </Text>
                  </View>
                  <View className="flex-row gap-3 flex-wrap justify-center">
                    <Pressable
                      className="border-2 rounded-xl py-3 px-5 items-center active:opacity-70"
                      style={{ borderColor: color }}
                      onPress={() =>
                        router.push({ pathname: '/(student)/module/[moduleId]', params: { moduleId: module.id } })
                      }
                    >
                      <Text className="font-semibold text-base" style={{ color }}>{'\u2190'} Back to Module</Text>
                    </Pressable>

                    {nextChapter && (
                      <Pressable
                        className="rounded-xl py-3 px-5 items-center active:opacity-80"
                        style={{ backgroundColor: color }}
                        onPress={() =>
                          router.replace({ pathname: '/(student)/module/chapter/[chapterId]', params: { chapterId: nextChapter.id } })
                        }
                      >
                        <Text className="font-semibold text-base text-white">Next Chapter {'\u2192'}</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              )
            ) : (
              // ── Back / Next nav row ───────────────────────────────────────
              <View className="flex-row items-center justify-between mt-4 mb-8 gap-3">

                {/* Back — hidden on first step */}
                {currentStep > 0 ? (
                  <Pressable
                    className="flex-row items-center gap-1 rounded-xl border-2 py-3 px-5 active:opacity-70"
                    style={{ borderColor: color }}
                    onPress={handleBack}
                  >
                    <Ionicons name="chevron-back" size={16} color={color} />
                    <Text className="font-semibold text-base" style={{ color }}>Back</Text>
                  </Pressable>
                ) : (
                  <View />
                )}

                {/* Next — hidden on last step, disabled until step complete */}
                {!isLastStep && (
                  <Pressable
                    className="flex-row items-center gap-1 rounded-xl py-3 px-5 active:opacity-80"
                    style={{
                      backgroundColor: isCurrentStepComplete ? color : '#E2E8F0',
                      opacity: isCurrentStepComplete ? 1 : 0.55,
                    }}
                    onPress={handleNext}
                    disabled={!isCurrentStepComplete}
                  >
                    <Text
                      className="font-semibold text-base"
                      style={{ color: isCurrentStepComplete ? '#fff' : '#90A4AE' }}
                    >
                      Next
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={isCurrentStepComplete ? '#fff' : '#90A4AE'}
                    />
                  </Pressable>
                )}

              </View>
            )
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ComingSoonCard({ color }: { color: string }) {
  return (
    <View className="bg-white rounded-2xl border border-border p-6 mb-4 items-center">
      <View
        className="w-16 h-16 rounded-full items-center justify-center mb-4"
        style={{ backgroundColor: color + '18' }}
      >
        <Text style={{ fontSize: 30 }}>🎤</Text>
      </View>
      <Text className="text-lg font-bold text-text-primary mb-2">Coming Soon</Text>
      <Text className="text-sm text-text-secondary text-center leading-relaxed mb-4">
        The interactive exercises for this chapter are being built. Stay tuned!
      </Text>
      {['🔊 Listen to the model', '🎤 Record yourself', '📊 See your feedback'].map((step) => (
        <View key={step} className="flex-row items-center gap-2 mb-1">
          <Text className="text-sm text-text-secondary">{step}</Text>
        </View>
      ))}
    </View>
  );
}
