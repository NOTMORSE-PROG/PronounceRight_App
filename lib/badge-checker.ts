import { BadgeType, MODULES_DATA } from '@/types';
import type { ChapterProgress } from '@/types';

/** Chapter IDs that contain sentence-level activities */
const SENTENCE_CHAPTERS = new Set(['m1c1', 'm2c2', 'm2c3']);

const MOD1_CHAPTERS = ['m1c1', 'm1c2', 'm1c3'];
const MOD2_CHAPTERS = ['m2c1', 'm2c2', 'm2c3'];
const ALL_CHAPTER_IDS = MODULES_DATA.flatMap((m) =>
  m.chapters.map((c) => c.id),
);

interface BadgeCheckContext {
  chapterProgress: Record<string, ChapterProgress>;
  earnedBadges: Record<string, string>;
  streak: number;
}

/**
 * Returns the list of badge types that should be newly awarded
 * based on the current progress state. Already-earned badges are skipped.
 */
export function getNewBadges(ctx: BadgeCheckContext): BadgeType[] {
  const earned: BadgeType[] = [];
  const { chapterProgress, earnedBadges, streak } = ctx;
  const chapters = Object.values(chapterProgress);

  const should = (type: BadgeType) => !earnedBadges[type];

  // first_word — any chapter attempted
  if (should('first_word') && chapters.some((p) => p.attempts > 0)) {
    earned.push('first_word');
  }

  // clear_voice — scored 80%+ on any chapter
  if (should('clear_voice') && chapters.some((p) => p.bestScore !== null && p.bestScore >= 80)) {
    earned.push('clear_voice');
  }

  // perfect_lesson — completed a chapter with 100% score
  if (should('perfect_lesson') && chapters.some((p) => p.completed && p.bestScore === 100)) {
    earned.push('perfect_lesson');
  }

  // sentence_starter — attempted any chapter with sentence-level activities
  if (should('sentence_starter')) {
    const started = [...SENTENCE_CHAPTERS].some((id) => chapterProgress[id]?.attempts > 0);
    if (started) earned.push('sentence_starter');
  }

  // fluent_flow — Module 2 complete with 75%+ average
  if (should('fluent_flow')) {
    const allComplete = MOD2_CHAPTERS.every((id) => chapterProgress[id]?.completed);
    if (allComplete) {
      const avg =
        MOD2_CHAPTERS.reduce((sum, id) => sum + (chapterProgress[id]!.bestScore ?? 0), 0) /
        MOD2_CHAPTERS.length;
      if (avg >= 75) earned.push('fluent_flow');
    }
  }

  // no_replays — passed a chapter on the first attempt
  if (should('no_replays') && chapters.some((p) => p.completed && p.attempts === 1)) {
    earned.push('no_replays');
  }

  // streak_7
  if (should('streak_7') && streak >= 7) {
    earned.push('streak_7');
  }

  // streak_30
  if (should('streak_30') && streak >= 30) {
    earned.push('streak_30');
  }

  // module_1_complete — all Module 1 chapters completed
  if (should('module_1_complete') && MOD1_CHAPTERS.every((id) => chapterProgress[id]?.completed)) {
    earned.push('module_1_complete');
  }

  // module_2_complete — all Module 2 chapters completed
  if (should('module_2_complete') && MOD2_CHAPTERS.every((id) => chapterProgress[id]?.completed)) {
    earned.push('module_2_complete');
  }

  // speakright_master — all chapters completed with 85%+ average
  if (should('speakright_master')) {
    const allComplete = ALL_CHAPTER_IDS.every((id) => chapterProgress[id]?.completed);
    if (allComplete) {
      const avg =
        ALL_CHAPTER_IDS.reduce((sum, id) => sum + (chapterProgress[id]!.bestScore ?? 0), 0) /
        ALL_CHAPTER_IDS.length;
      if (avg >= 85) earned.push('speakright_master');
    }
  }

  return earned;
}
