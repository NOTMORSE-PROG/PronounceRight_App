import { WORD_OF_THE_DAY_BANK } from '@/content/word-of-the-day';
import type { WordOfTheDayEntry } from '@/types/word-of-the-day';

/**
 * Epoch: June 2, 2025 — start of Philippine SY 2025-2026.
 * Any date before this returns word index 0.
 */
const EPOCH = new Date(2025, 5, 2); // months are 0-indexed

/** Calendar days between the epoch and the given date. */
function daysSinceEpoch(date: Date = new Date()): number {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const e = new Date(EPOCH.getFullYear(), EPOCH.getMonth(), EPOCH.getDate());
  const diffMs = d.getTime() - e.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

/** Return today's word, cycling through the 60-word bank. */
export function getTodaysWord(date?: Date): WordOfTheDayEntry {
  const index = daysSinceEpoch(date) % WORD_OF_THE_DAY_BANK.length;
  return WORD_OF_THE_DAY_BANK[index]!;
}

/** Return the 0-based word bank index for today. */
export function getTodaysWordIndex(date?: Date): number {
  return daysSinceEpoch(date) % WORD_OF_THE_DAY_BANK.length;
}

/** Today's date as YYYY-MM-DD (used as persistence key). */
export function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
