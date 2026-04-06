import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, Pressable, Animated, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { Sortable, SortableItem } from 'react-native-reanimated-dnd';
import type { SortableRenderItemProps } from 'react-native-reanimated-dnd';
import { saveActivityCompletion, getActivityCompletion } from '@/lib/db';
import { getBand } from '@/lib/assessment-config';
import type { WordArrangementItem } from '@/types/content';

// ─── Sortable data type ───────────────────────────────────────────────────────
type CardData = { id: string; wordIdx: number };

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  activityTitle: string;
  direction: string;
  items: WordArrangementItem[];
  passThreshold: number;
  accentColor?: string;
  studentId?: string;
  activityId?: string;
  onComplete?: (score: number) => void;
  onAdvance?: () => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function WordArrangementActivity({
  activityTitle,
  direction,
  items,
  passThreshold,
  accentColor = '#FF9800',
  studentId,
  activityId,
  onComplete,
  onAdvance,
}: Props) {
  // ── Item navigation ─────────────────────────────────────────────────────────
  const [itemIndex, setItemIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [itemScores, setItemScores] = useState<boolean[]>([]);
  const [finalAvg, setFinalAvg] = useState(0);

  // ── Per-item arrangement state ──────────────────────────────────────────────
  const [order, setOrder] = useState<number[]>(() => items[0]!.words.map((_, i) => i));
  const [arrangementChecked, setArrangementChecked] = useState(false);
  const [arrangementCorrect, setArrangementCorrect] = useState(false);
  const [failedChecks, setFailedChecks] = useState(0);

  // ── TTS ─────────────────────────────────────────────────────────────────────
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioPlaysLeft, setAudioPlaysLeft] = useState(3);

  // ── Refs ─────────────────────────────────────────────────────────────────────
  const checkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Animations ───────────────────────────────────────────────────────────────
  const shakeAnims = useRef(items[0]!.words.map(() => new Animated.Value(0))).current;

  // ── Cleanup ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      Speech.stop();
      if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
    };
  }, []);

  // ── Restore saved completion on mount ─────────────────────────────────────────
  useEffect(() => {
    if (!studentId || !activityId) return;
    getActivityCompletion(studentId, activityId).then((row) => {
      if (!row) return;
      const saved = JSON.parse(row.answers) as { itemScores?: boolean[] };
      const scores = saved.itemScores ?? [];
      setItemScores(scores);
      setFinalAvg(row.score);
      setFinished(true);
      onComplete?.(row.score);
    }).catch(() => {/* ignore */});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derived values ────────────────────────────────────────────────────────────
  const current = items[itemIndex]!;

  const positionCorrect = useMemo(
    () => order.map((wordIdx, pos) => wordIdx === current.correctOrder[pos]),
    [order, current],
  );

  const allCorrect = positionCorrect.every(Boolean);

  const sortableData = useMemo<CardData[]>(
    () => order.map(wordIdx => ({ id: `${itemIndex}-${wordIdx}`, wordIdx })),
    [order, itemIndex],
  );

  // ── TTS: Listen to correct sentence ────────────────────────────────────────────
  const handleListen = useCallback(() => {
    if (audioPlaysLeft <= 0 || isSpeaking) return;
    Speech.stop();
    setIsSpeaking(true);
    setAudioPlaysLeft(p => p - 1);
    Speech.speak(current.correctSentence, {
      language: 'en-US',
      rate: 0.85,
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  }, [audioPlaysLeft, isSpeaking, current.correctSentence]);

  // ── Drag drop: update order on card release ───────────────────────────────────
  const handleDrop = useCallback((_id: string, _pos: number, allPositions?: { [id: string]: number }) => {
    if (!allPositions) return;
    const newOrder = new Array<number>(Object.keys(allPositions).length);
    Object.entries(allPositions).forEach(([id, pos]) => {
      const wordIdx = parseInt(id.split('-')[1]!, 10);
      newOrder[pos] = wordIdx;
    });
    setOrder(newOrder);
  }, []);

  // ── Check arrangement ─────────────────────────────────────────────────────────
  const handleCheckOrder = useCallback(() => {
    if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
    setArrangementChecked(true);

    if (allCorrect) {
      setArrangementCorrect(true);
      // TTS reads the correct sentence
      setIsSpeaking(true);
      Speech.speak(current.correctSentence, {
        language: 'en-US',
        rate: 0.85,
        onDone: () => {
          setIsSpeaking(false);
          advanceToNext(true);
        },
        onError: () => {
          setIsSpeaking(false);
          advanceToNext(true);
        },
      });
    } else {
      setArrangementCorrect(false);
      setFailedChecks(c => c + 1);
      // Shake wrong-positioned cards
      order.forEach((wordIdx, pos) => {
        if (wordIdx !== current.correctOrder[pos]) {
          Animated.sequence([
            Animated.timing(shakeAnims[pos]!, { toValue: 8, duration: 80, useNativeDriver: true }),
            Animated.timing(shakeAnims[pos]!, { toValue: -8, duration: 80, useNativeDriver: true }),
            Animated.timing(shakeAnims[pos]!, { toValue: 6, duration: 80, useNativeDriver: true }),
            Animated.timing(shakeAnims[pos]!, { toValue: 0, duration: 80, useNativeDriver: true }),
          ]).start();
        }
      });
      checkTimeoutRef.current = setTimeout(() => setArrangementChecked(false), 1500);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCorrect, order, current, shakeAnims]);

  // ── Reveal correct order ──────────────────────────────────────────────────────
  const handleRevealAnswer = useCallback(() => {
    if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
    setOrder([...current.correctOrder]);
    setArrangementChecked(true);
    setArrangementCorrect(true);
    // TTS reads the correct sentence
    setIsSpeaking(true);
    Speech.speak(current.correctSentence, {
      language: 'en-US',
      rate: 0.85,
      onDone: () => {
        setIsSpeaking(false);
        advanceToNext(false);
      },
      onError: () => {
        setIsSpeaking(false);
        advanceToNext(false);
      },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  // ── Advance to next item / finish ─────────────────────────────────────────────
  const advanceToNext = useCallback((scored: boolean) => {
    const nextScores = [...itemScores.slice(0, itemIndex), scored];
    const nextIndex = itemIndex + 1;

    if (nextIndex >= items.length) {
      const correctCount = nextScores.filter(Boolean).length;
      const avg = Math.round((correctCount / items.length) * 100);
      setItemScores(nextScores);
      setFinalAvg(avg);
      setFinished(true);
    } else {
      setItemScores(nextScores);
      // Small delay before advancing to let user see the success state
      checkTimeoutRef.current = setTimeout(() => {
        setItemIndex(nextIndex);
        setOrder(items[nextIndex]!.words.map((_, i) => i));
        setArrangementChecked(false);
        setArrangementCorrect(false);
        setFailedChecks(0);
        setAudioPlaysLeft(3);
        shakeAnims.forEach(a => a.setValue(0));
      }, 800);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemScores, itemIndex, items]);

  // ── Continue (from summary) ───────────────────────────────────────────────────
  const handleContinue = useCallback((avg: number) => {
    if (studentId && activityId) {
      saveActivityCompletion({
        id: `${studentId}_${activityId}`,
        student_id: studentId,
        activity_id: activityId,
        score: avg,
        answers: JSON.stringify({ itemScores }),
        created_at: new Date().toISOString(),
      }).catch(() => {});
    }
    onComplete?.(avg);
    onAdvance?.();
  }, [studentId, activityId, itemScores, onComplete, onAdvance]);

  // ── Retry all items ───────────────────────────────────────────────────────────
  const handleRetryAll = useCallback(() => {
    if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
    Speech.stop();
    setItemIndex(0);
    setFinished(false);
    setItemScores([]);
    setFinalAvg(0);
    setOrder(items[0]!.words.map((_, i) => i));
    setArrangementChecked(false);
    setArrangementCorrect(false);
    setFailedChecks(0);
    setAudioPlaysLeft(3);
    shakeAnims.forEach(a => a.setValue(0));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  // ═════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════════════

  // ── Activity summary (after all items) ────────────────────────────────────────
  if (finished) {
    const passed = finalAvg >= passThreshold;
    const band = getBand(finalAvg);
    const correctCount = itemScores.filter(Boolean).length;
    return (
      <View className="bg-white rounded-2xl border border-border p-5 mb-3">
        <ActivityHeader title={activityTitle} accentColor={accentColor} />

        {/* Overall result */}
        <View className="items-center py-3 mb-4">
          <View
            className="w-16 h-16 rounded-full items-center justify-center mb-3"
            style={{ backgroundColor: band.color + '20' }}
          >
            <Ionicons
              name={passed ? 'checkmark-circle' : 'reload-circle'}
              size={40}
              color={band.color}
            />
          </View>
          <Text className="text-xl font-bold text-text-primary">
            {passed ? 'Activity Complete!' : 'Keep Practising'}
          </Text>
          <Text className="text-sm mt-1" style={{ color: band.color }}>
            {correctCount} / {items.length} correct — {finalAvg}%
          </Text>

          {/* Score bar */}
          <View className="w-full h-2.5 rounded-full bg-surface-page overflow-hidden mt-3">
            <View
              className="h-full rounded-full"
              style={{ width: `${finalAvg}%`, backgroundColor: band.color }}
            />
          </View>
        </View>

        {/* Per-item rows */}
        <View className="gap-2 mb-5">
          {itemScores.map((scored, i) => (
            <View key={i} className="flex-row items-center justify-between rounded-xl px-4 py-3 border border-border">
              <Text className="text-sm font-semibold text-text-primary flex-1" numberOfLines={1}>
                {items[i]!.correctSentence}
              </Text>
              <Ionicons
                name={scored ? 'checkmark-circle' : 'close-circle'}
                size={18}
                color={scored ? '#10B981' : '#EF4444'}
              />
            </View>
          ))}
        </View>

        {/* Action buttons */}
        {passed ? (
          <Pressable
            className="rounded-xl py-4 items-center active:opacity-80"
            style={{ backgroundColor: accentColor }}
            onPress={() => handleContinue(finalAvg)}
          >
            <Text className="text-white font-bold text-base">Continue →</Text>
          </Pressable>
        ) : (
          <View className="gap-2">
            <Pressable
              className="rounded-xl py-4 items-center active:opacity-80"
              style={{ backgroundColor: accentColor }}
              onPress={handleRetryAll}
            >
              <Text className="text-white font-bold text-base">Try Again</Text>
            </Pressable>
            <Pressable
              className="rounded-xl py-3 items-center active:opacity-80 border"
              style={{ borderColor: accentColor }}
              onPress={() => handleContinue(finalAvg)}
            >
              <Text className="font-bold text-sm" style={{ color: accentColor }}>Continue Anyway →</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  }

  // ── Main activity ─────────────────────────────────────────────────────────────
  return (
    <View className="bg-white rounded-2xl border border-border p-5 mb-3">
      <ActivityHeader title={activityTitle} accentColor={accentColor} />

      <Text className="text-sm text-text-secondary mb-4 leading-relaxed" style={{ textAlign: 'justify' }}>
        {direction}
      </Text>

      {/* Item counter + Listen button */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-xs font-semibold text-text-muted uppercase tracking-wide">
          Item {itemIndex + 1} of {items.length}
        </Text>

        <Pressable
          onPress={handleListen}
          disabled={audioPlaysLeft <= 0}
          className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
          style={{ backgroundColor: audioPlaysLeft > 0 ? accentColor + '18' : '#E2E8F0' }}
        >
          {isSpeaking ? (
            <ActivityIndicator size={12} color={accentColor} />
          ) : (
            <Ionicons
              name="volume-medium-outline"
              size={14}
              color={audioPlaysLeft > 0 ? accentColor : '#90A4AE'}
            />
          )}
          <Text
            className="text-xs font-semibold"
            style={{ color: audioPlaysLeft > 0 ? accentColor : '#90A4AE' }}
          >
            {isSpeaking
              ? 'Playing…'
              : audioPlaysLeft > 0
                ? `Listen (${audioPlaysLeft} left)`
                : 'Max plays reached'}
          </Text>
        </Pressable>
      </View>

      {/* Progress dots */}
      <View className="flex-row gap-1 justify-center mb-3">
          {items.map((_, i) => (
            <View
              key={i}
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor:
                  i < itemIndex
                    ? itemScores[i] ? '#10B981' : '#EF4444'
                    : i === itemIndex
                    ? accentColor
                    : '#E2E8F0',
              }}
            />
          ))}
      </View>

      {/* Correct feedback banner */}
      {arrangementChecked && arrangementCorrect && (
        <View className="rounded-lg p-3 mb-3 flex-row items-center gap-2" style={{ backgroundColor: '#10B98114' }}>
          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
          <Text className="text-xs font-semibold flex-1" style={{ color: '#059669' }}>
            {isSpeaking ? 'Correct! Listening…' : 'Correct!'}
          </Text>
          {isSpeaking && (
            <Ionicons name="volume-medium-outline" size={16} color="#059669" />
          )}
        </View>
      )}

      {/* Draggable word cards */}
      {!arrangementChecked && (
        <>
          <View className="rounded-lg p-3 mb-3 flex-row items-center gap-2" style={{ backgroundColor: accentColor + '0D' }}>
            <Ionicons name="swap-vertical-outline" size={14} color={accentColor} />
            <Text className="text-xs text-text-muted flex-1">
              Hold the <Ionicons name="menu-outline" size={12} color="#90A4AE" /> handle and drag to reorder.
            </Text>
          </View>
          <Sortable
            data={sortableData}
            enableDynamicHeights
            estimatedItemHeight={44}
            useFlatList={false}
            style={{ marginBottom: 16 }}
            renderItem={({ item, index, ...sortableProps }: SortableRenderItemProps<CardData>) => (
              <SortableItem
                key={item.id}
                {...sortableProps}
                data={item}
                onDrop={handleDrop}
                style={{ marginBottom: 8 }}
              >
                <View
                  className="flex-row items-center gap-3 rounded-xl border p-3"
                  style={{ borderColor: '#E2E8F0', backgroundColor: '#FAFAFA' }}
                >
                  {/* Position badge */}
                  <View
                    className="w-6 h-6 rounded-full items-center justify-center shrink-0"
                    style={{ backgroundColor: accentColor }}
                  >
                    <Text className="text-xs font-bold text-white">{index + 1}</Text>
                  </View>
                  {/* Word text */}
                  <Text className="text-sm font-semibold text-text-primary flex-1">
                    {current.words[item.wordIdx]!}
                  </Text>
                  {/* Drag handle */}
                  <SortableItem.Handle>
                    <View className="pl-1 py-1">
                      <Ionicons name="menu-outline" size={18} color="#90A4AE" />
                    </View>
                  </SortableItem.Handle>
                </View>
              </SortableItem>
            )}
          />
        </>
      )}

      {/* Static cards when checked (showing correct/wrong colors + shake) */}
      {arrangementChecked && (
        <View className="gap-2 mb-4">
          {order.map((wordIdx, position) => {
            const isCorrect = positionCorrect[position]!;
            return (
              <Animated.View
                key={`checked-${itemIndex}-${position}`}
                style={{ transform: [{ translateX: shakeAnims[position]! }] }}
              >
                <View
                  className="flex-row items-center gap-3 rounded-xl border p-3"
                  style={{
                    borderColor: isCorrect ? '#10B981' : '#EF4444',
                    backgroundColor: isCorrect ? '#10B98108' : '#EF444408',
                  }}
                >
                  <View
                    className="w-6 h-6 rounded-full items-center justify-center shrink-0"
                    style={{ backgroundColor: isCorrect ? '#10B981' : '#EF4444' }}
                  >
                    <Text className="text-xs font-bold text-white">{position + 1}</Text>
                  </View>
                  <Text className="text-sm font-semibold text-text-primary flex-1">
                    {current.words[wordIdx]!}
                  </Text>
                  {isCorrect
                    ? <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    : <Ionicons name="close-circle" size={16} color="#EF4444" />
                  }
                </View>
              </Animated.View>
            );
          })}
        </View>
      )}

      {/* Check Order button */}
      {!arrangementChecked && (
        <Pressable
          className="rounded-xl py-4 items-center mb-2 active:opacity-80"
          style={{ backgroundColor: accentColor }}
          onPress={handleCheckOrder}
        >
          <Text className="text-white font-bold text-base">Check Order</Text>
        </Pressable>
      )}

      {/* Reveal after 3 failed checks */}
      {failedChecks >= 3 && !arrangementChecked && (
        <Pressable
          className="rounded-xl py-3 items-center flex-row justify-center gap-2 active:opacity-80"
          style={{ backgroundColor: '#F97316' + '18', borderWidth: 1, borderColor: '#F97316' }}
          onPress={handleRevealAnswer}
        >
          <Ionicons name="eye-outline" size={16} color="#F97316" />
          <Text className="font-semibold text-sm" style={{ color: '#F97316' }}>Show Correct Order</Text>
        </Pressable>
      )}
    </View>
  );
}

// ─── Activity Header ──────────────────────────────────────────────────────────

function ActivityHeader({ title, accentColor }: { title: string; accentColor: string }) {
  return (
    <View className="flex-row items-center gap-3 mb-4">
      <View
        className="w-9 h-9 rounded-xl items-center justify-center"
        style={{ backgroundColor: accentColor + '18' }}
      >
        <Ionicons name="shuffle-outline" size={18} color={accentColor} />
      </View>
      <Text className="text-base font-bold text-text-primary flex-1">{title}</Text>
    </View>
  );
}
