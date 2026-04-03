export const ASSESSMENT_CONFIG = {
  passThreshold: 90,

  scoreWeights: {
    accuracy:     0.80,   // dominates — accuracy IS the score
    fluency:      0.05,   // small bonus (fixed 90 → ~4.5 pts max)
    completeness: 0.15,   // did they say the word at all
    prosody:      0.00,   // Phase 2 — removed from formula to prevent floor inflation
  },

  scoreBands: [
    { min: 90, label: 'excellent',   color: '#10B981', message: 'Great pronunciation!' },
    { min: 61, label: 'approaching', color: '#84CC16', message: 'Approaching acceptable — minor adjustments needed' },
    { min: 31, label: 'mid',         color: '#F97316', message: 'Improvement present — more practice needed' },
    { min: 0,  label: 'low',         color: '#991B1B', message: 'Significant work needed on this pronunciation' },
  ],

  errorThresholds: {
    mispronunciationAccuracy: 75,   // phonemeAccuracyScore < this → pronunciation error
    minTokenConfidence:       0.4,  // token.p < this → treat fluency as low
    pausePenaltyPerPause:     20,   // Phase 2
    toneContourMax:           70,   // Phase 2
  },

  errorColors: {
    pronunciation:   '#F97316',
    omission:        '#EF4444',
    redundancy:      '#3B82F6',
    tone:            '#22C55E',
    unexpectedPause: '#A855F7',
    missingPause:    '#EC4899',
  },

  hallucination: {
    bothWordsThreshold: 20,  // if phonemeAccuracyScore < this for BOTH pair words → hallucination
    retryThreshold:     25,  // if score < this for target → retry once
    retryTemperature:   0.1, // slight randomness on retry to break hallucination loop
  },

  engineTuning: {
    dtwScaleFactor: 4,   // Phase 2 pitch DTW multiplier
  },
} as const;

export type ErrorCategory = keyof typeof ASSESSMENT_CONFIG.errorColors;
export type ScoreBand = typeof ASSESSMENT_CONFIG.scoreBands[number];

export function getBand(score: number): ScoreBand {
  return ASSESSMENT_CONFIG.scoreBands.find((b) => score >= b.min)!;
}
