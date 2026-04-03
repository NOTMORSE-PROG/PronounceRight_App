import { phonemeAccuracyScore } from './phoneme-scorer';

export type WordAlignmentStatus = 'correct' | 'mispronounced' | 'omitted' | 'extra';

export interface WordAlignment {
  referenceWord: string | null;   // null = extra word (insertion)
  transcriptWord: string | null;  // null = omitted word (deletion)
  score: number;                  // 0–100 phoneme accuracy for this position
  status: WordAlignmentStatus;
}

/**
 * Global Needleman-Wunsch alignment of transcript words to reference words,
 * using phonemeAccuracyScore as the similarity function.
 *
 * Gap penalty = 0 — omissions/insertions are flagged by error category, not penalised here.
 */
export function alignWords(
  transcriptWords: string[],
  referenceWords: string[],
  mispronunciationThreshold: number,
): WordAlignment[] {
  const m = referenceWords.length;
  const n = transcriptWords.length;

  // Score matrix: NW fills dp[i][j] = best alignment score up to ref[i-1] / trans[j-1]
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  // Traceback matrix: 'match' | 'insert' | 'delete'
  const trace: string[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(''));

  for (let i = 0; i <= m; i++) { dp[i]![0] = 0; trace[i]![0] = 'delete'; }
  for (let j = 0; j <= n; j++) { dp[0]![j] = 0; trace[0]![j] = 'insert'; }
  trace[0]![0] = 'start';

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const sim = phonemeAccuracyScore(transcriptWords[j - 1]!, referenceWords[i - 1]!);
      const match  = dp[i - 1]![j - 1]! + sim;
      const del    = dp[i - 1]![j]!;       // ref word omitted
      const ins    = dp[i]![j - 1]!;       // extra transcript word

      if (match >= del && match >= ins) {
        dp[i]![j] = match;
        trace[i]![j] = 'match';
      } else if (del >= ins) {
        dp[i]![j] = del;
        trace[i]![j] = 'delete';
      } else {
        dp[i]![j] = ins;
        trace[i]![j] = 'insert';
      }
    }
  }

  // Traceback
  const alignments: WordAlignment[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    const t = trace[i]![j]!;

    if (t === 'match') {
      const refWord   = referenceWords[i - 1]!;
      const transWord = transcriptWords[j - 1]!;
      const score     = phonemeAccuracyScore(transWord, refWord);
      alignments.unshift({
        referenceWord: refWord,
        transcriptWord: transWord,
        score,
        status: score >= mispronunciationThreshold ? 'correct' : 'mispronounced',
      });
      i--; j--;
    } else if (t === 'delete') {
      // Reference word was omitted
      alignments.unshift({
        referenceWord: referenceWords[i - 1]!,
        transcriptWord: null,
        score: 0,
        status: 'omitted',
      });
      i--;
    } else {
      // Extra transcript word
      alignments.unshift({
        referenceWord: null,
        transcriptWord: transcriptWords[j - 1]!,
        score: 0,
        status: 'extra',
      });
      j--;
    }
  }

  return alignments;
}
