import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChapterProgress, Badge, BadgeType, ALL_BADGES } from '@/types';
import { getNewBadges } from '@/lib/badge-checker';

interface FinalAssessmentResult {
  bestScore: number;
  attempts: number;
  completedAt: string;
  passed: boolean;
}

interface ProgressState {
  streak: number;
  lastPracticeDate: string | null;
  chapterProgress: Record<string, ChapterProgress>;
  earnedBadges: Record<BadgeType, string>;  // BadgeType → earnedAt ISO string
  wotdHistory: Record<string, number>;      // "YYYY-MM-DD" → best phonics score
  finalAssessmentResult: FinalAssessmentResult | null;
  certificateEarned: boolean;
  certificateEarnedAt: string | null;
  moduleCelebrated: Record<string, string>; // moduleId → celebratedAt ISO
  recordPractice: () => void;
  getCurrentStreak: () => number;
  updateChapterProgress: (p: ChapterProgress) => void;
  updateLastStep: (chapterId: string, step: number) => void;
  touchLastAccessed: (chapterId: string) => void;
  awardBadge: (type: BadgeType) => void;
  checkAndAwardBadges: () => BadgeType[];
  markCertificateEarned: () => void;
  markModuleCelebrated: (moduleId: string) => void;
  getBadges: () => Badge[];
  getModuleCompletion: (moduleId: string, chapterIds: string[]) => number;
  recordWotdPractice: (dateKey: string, score: number) => void;
  getWotdScore: (dateKey: string) => number | null;
  saveFinalAssessmentResult: (score: number, passed: boolean) => void;
  devUnlockAll: boolean;
  toggleDevUnlock: () => void;
  reset: () => void;
}

const DEFAULT_STATE = {
  streak: 0,
  lastPracticeDate: null as string | null,
  chapterProgress: {} as Record<string, ChapterProgress>,
  earnedBadges: {} as Record<BadgeType, string>,
  wotdHistory: {} as Record<string, number>,
  finalAssessmentResult: null as FinalAssessmentResult | null,
  certificateEarned: false,
  certificateEarnedAt: null as string | null,
  moduleCelebrated: {} as Record<string, string>,
};

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_STATE,
      devUnlockAll: false,

      toggleDevUnlock: () => set((s) => ({ devUnlockAll: !s.devUnlockAll })),

      recordPractice: () => {
        const today = new Date().toISOString().slice(0, 10);
        const { lastPracticeDate, streak } = get();
        if (lastPracticeDate === today) return;
        const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
        const newStreak = lastPracticeDate === yesterday ? streak + 1 : 1;
        set({ streak: newStreak, lastPracticeDate: today });
      },

      getCurrentStreak: () => {
        const { streak, lastPracticeDate } = get();
        if (!lastPracticeDate) return 0;
        const today = new Date().toISOString().slice(0, 10);
        const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
        if (lastPracticeDate === today || lastPracticeDate === yesterday) return streak;
        return 0;
      },

      updateChapterProgress: (p) =>
        set((s) => ({
          chapterProgress: {
            ...s.chapterProgress,
            [p.chapterId]: { ...s.chapterProgress[p.chapterId], ...p },
          },
        })),

      updateLastStep: (chapterId, step) =>
        set((s) => ({
          chapterProgress: {
            ...s.chapterProgress,
            [chapterId]: {
              ...s.chapterProgress[chapterId],
              chapterId,
              attempts: s.chapterProgress[chapterId]?.attempts ?? 0,
              bestScore: s.chapterProgress[chapterId]?.bestScore ?? null,
              completed: s.chapterProgress[chapterId]?.completed ?? false,
              completedAt: s.chapterProgress[chapterId]?.completedAt ?? null,
              lastStep: step,
              lastAccessedAt: s.chapterProgress[chapterId]?.lastAccessedAt ?? null,
            },
          },
        })),

      touchLastAccessed: (chapterId) =>
        set((s) => ({
          chapterProgress: {
            ...s.chapterProgress,
            [chapterId]: {
              ...s.chapterProgress[chapterId],
              chapterId,
              attempts: s.chapterProgress[chapterId]?.attempts ?? 0,
              bestScore: s.chapterProgress[chapterId]?.bestScore ?? null,
              completed: s.chapterProgress[chapterId]?.completed ?? false,
              completedAt: s.chapterProgress[chapterId]?.completedAt ?? null,
              lastStep: s.chapterProgress[chapterId]?.lastStep ?? null,
              lastAccessedAt: new Date().toISOString(),
            },
          },
        })),

      awardBadge: (type) => {
        const { earnedBadges } = get();
        if (earnedBadges[type]) return;
        set((s) => ({
          earnedBadges: { ...s.earnedBadges, [type]: new Date().toISOString() },
        }));
      },

      checkAndAwardBadges: () => {
        const state = get();
        const newBadges = getNewBadges({
          chapterProgress: state.chapterProgress,
          earnedBadges: state.earnedBadges,
          streak: state.streak,
        });
        for (const badge of newBadges) {
          state.awardBadge(badge);
        }
        return newBadges;
      },

      markCertificateEarned: () => {
        if (get().certificateEarned) return;
        set({ certificateEarned: true, certificateEarnedAt: new Date().toISOString() });
      },

      markModuleCelebrated: (moduleId) =>
        set((s) => ({
          moduleCelebrated: { ...s.moduleCelebrated, [moduleId]: new Date().toISOString() },
        })),

      getBadges: () => {
        const { earnedBadges } = get();
        return ALL_BADGES.map((b) => ({
          ...b,
          earnedAt: earnedBadges[b.type] ?? null,
        }));
      },

      getModuleCompletion: (moduleId, chapterIds) => {
        const { chapterProgress } = get();
        if (!chapterIds.length) return 0;
        const done = chapterIds.filter(
          (id) => chapterProgress[id]?.completed,
        ).length;
        return Math.round((done / chapterIds.length) * 100);
      },

      recordWotdPractice: (dateKey, score) =>
        set((s) => ({
          wotdHistory: {
            ...s.wotdHistory,
            [dateKey]: Math.max(score, s.wotdHistory[dateKey] ?? 0),
          },
        })),

      getWotdScore: (dateKey) => {
        const { wotdHistory } = get();
        return wotdHistory[dateKey] ?? null;
      },

      saveFinalAssessmentResult: (score, passed) => {
        const prev = get().finalAssessmentResult;
        set({
          finalAssessmentResult: {
            bestScore: Math.max(score, prev?.bestScore ?? 0),
            attempts: (prev?.attempts ?? 0) + 1,
            completedAt: new Date().toISOString(),
            passed: passed || (prev?.passed ?? false),
          },
        });
        if (passed) get().awardBadge('speakright_master');
      },

      reset: () => set(DEFAULT_STATE),
    }),
    {
      name: 'pr_progress',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        streak: s.streak,
        lastPracticeDate: s.lastPracticeDate,
        chapterProgress: s.chapterProgress,
        earnedBadges: s.earnedBadges,
        wotdHistory: s.wotdHistory,
        finalAssessmentResult: s.finalAssessmentResult,
        certificateEarned: s.certificateEarned,
        certificateEarnedAt: s.certificateEarnedAt,
        moduleCelebrated: s.moduleCelebrated,
      }),
    },
  ),
);
