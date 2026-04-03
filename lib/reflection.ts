import { getAssessments } from './db';
import { getImprovementTip, getPhonemeDiff } from './engine/phoneme-tips';
import type { ErrorCategory } from './assessment-config';
import type { Activity } from '@/types/content';
import type { ChapterSection } from '@/types/content';

export interface WeakWord {
  activityId: string;
  activityTitle: string;
  word: string;
  score: number;
  transcript: string;
  tip: string;
}

export interface ActivitySummary {
  id: string;
  title: string;
  score: number;
}

export interface ReflectionData {
  avgScore: number;
  passed: boolean;
  strongActivities: ActivitySummary[];
  weakActivities: ActivitySummary[];
  weakWords: WeakWord[];
  commonErrors: ErrorCategory[];
}

/** Strip stress annotations like "reLAX" → "relax", "obJECT (verb)" → "object" */
function cleanWord(word: string): string {
  return word
    .replace(/\s*\(.*?\)\s*/g, '')
    .toLowerCase()
    .trim();
}

/** Get the word list for an activity by looking at its content structure. */
function getActivityWords(activity: Activity): string[] {
  switch (activity.type) {
    case 'identify_pronunciation':
    case 'consonant_drill':
      return activity.items.map((it) => it.word);
    case 'stress_drill':
      return activity.words;
    case 'intonation_drill':
      return activity.sentences;
    case 'minimal_pair_drill':
      // Minimal pairs use prompt_index: pairIndex*2 for wordA, pairIndex*2+1 for wordB
      return activity.items.flatMap((it) => [it.wordA, it.wordB]);
    default:
      return [];
  }
}

export async function buildReflectionData(
  studentId: string,
  sections: ChapterSection[],
  activityScores: Record<string, number>,
): Promise<ReflectionData> {
  const strongActivities: ActivitySummary[] = [];
  const weakActivities: ActivitySummary[] = [];
  const weakWords: WeakWord[] = [];
  const errorCounts: Record<string, number> = {};

  const activitySections = sections.filter(
    (s): s is { kind: 'activity'; data: Activity } => s.kind === 'activity',
  );

  for (const section of activitySections) {
    const activity = section.data;
    const score = activityScores[activity.id];
    if (score === undefined) continue;

    const summary: ActivitySummary = {
      id: activity.id,
      title: activity.title,
      score,
    };

    if (score >= 70) {
      strongActivities.push(summary);
    } else {
      weakActivities.push(summary);
    }

    // Fetch per-word assessment data from DB
    const words = getActivityWords(activity);
    if (words.length === 0) continue;

    try {
      const rows = await getAssessments(studentId, activity.id);
      for (const row of rows) {
        // Parse errors for frequency tracking
        try {
          const errors = JSON.parse(row.errors) as ErrorCategory[];
          for (const err of errors) {
            errorCounts[err] = (errorCounts[err] ?? 0) + 1;
          }
        } catch { /* ignore */ }

        // Identify weak words (below pass threshold)
        if (row.phonics_score < 90 && row.prompt_index < words.length) {
          const rawWord = words[row.prompt_index]!;
          const word = cleanWord(rawWord);
          const diff = getPhonemeDiff(row.transcript.toLowerCase().trim().split(/\s+/)[0] ?? '', word);
          let errors: ErrorCategory[] = [];
          try { errors = JSON.parse(row.errors); } catch { /* ignore */ }
          const tip = getImprovementTip(errors, diff, word);

          weakWords.push({
            activityId: activity.id,
            activityTitle: activity.title,
            word: rawWord,
            score: row.phonics_score,
            transcript: row.transcript,
            tip,
          });
        }
      }
    } catch { /* ignore DB errors */ }
  }

  // Sort weak words by score ascending (worst first)
  weakWords.sort((a, b) => a.score - b.score);

  // Get most common error types
  const commonErrors = Object.entries(errorCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([err]) => err as ErrorCategory);

  // Compute overall average
  const scores = Object.values(activityScores);
  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;

  return {
    avgScore,
    passed: avgScore >= 70,
    strongActivities,
    weakActivities,
    weakWords: weakWords.slice(0, 10), // Top 10 weakest words
    commonErrors,
  };
}
