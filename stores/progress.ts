import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChapterProgress, Badge, BadgeType, ALL_BADGES } from '@/types';

interface ProgressState {
  totalPoints: number;
  streak: number;
  chapterProgress: Record<string, ChapterProgress>;
  earnedBadges: Record<BadgeType, string>;  // BadgeType → earnedAt ISO string
  addPoints: (pts: number) => void;
  setStreak: (days: number) => void;
  updateChapterProgress: (p: ChapterProgress) => void;
  awardBadge: (type: BadgeType) => void;
  getBadges: () => Badge[];
  getModuleCompletion: (moduleId: string, chapterIds: string[]) => number;
  reset: () => void;
}

const DEFAULT_STATE = {
  totalPoints: 0,
  streak: 0,
  chapterProgress: {} as Record<string, ChapterProgress>,
  earnedBadges: {} as Record<BadgeType, string>,
};

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_STATE,

      addPoints: (pts) => set((s) => ({ totalPoints: s.totalPoints + pts })),

      setStreak: (days) => set({ streak: days }),

      updateChapterProgress: (p) =>
        set((s) => ({
          chapterProgress: { ...s.chapterProgress, [p.chapterId]: p },
        })),

      awardBadge: (type) => {
        const { earnedBadges } = get();
        if (earnedBadges[type]) return;
        set((s) => ({
          earnedBadges: { ...s.earnedBadges, [type]: new Date().toISOString() },
        }));
      },

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

      reset: () => set(DEFAULT_STATE),
    }),
    {
      name: 'pr_progress',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        totalPoints: s.totalPoints,
        streak: s.streak,
        chapterProgress: s.chapterProgress,
        earnedBadges: s.earnedBadges,
      }),
    },
  ),
);
