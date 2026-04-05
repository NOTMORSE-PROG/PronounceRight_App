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
    { min: 61, label: 'approaching', color: '#84CC16', message: 'Almost there — small adjustments needed' },
    { min: 31, label: 'mid',         color: '#F97316', message: 'Getting better — keep practicing the sounds' },
    { min: 0,  label: 'low',         color: '#991B1B', message: 'Try again — say it slowly, one sound at a time' },
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
    bothWordsThreshold: 20,  // reserved for future use
    retryThreshold:     25,  // reserved for future use
    retryTemperature:   0.1, // reserved for future use
  },

  engineTuning: {
    dtwScaleFactor: 4,      // Phase 2 pitch DTW multiplier
    confidenceCeiling: 0.7, // avgProb >= this maps to 100% accuracy
    minQualityFloor: 0.5,   // correct word never scores below 50% accuracy
  },

  subScoreDescriptions: {
    accuracy:     'How closely your sounds match the correct pronunciation',
    fluency:      'How smooth and natural your speech flow is',
    completeness: 'How much of the intended text you pronounced',
  },

  errorDescriptions: {
    pronunciation:   'The word was spoken but the sounds did not match the reference closely enough',
    omission:        'A word in the reference text was skipped or not detected in your recording',
    redundancy:      'Extra sounds or words were added that are not in the reference text',
    tone:            'The word was spoken with an incorrect pitch pattern',
    unexpectedPause: 'You paused in a spot where no pause was expected',
    missingPause:    'A natural pause or punctuation break was missed',
  },
} as const;

export type ErrorCategory = keyof typeof ASSESSMENT_CONFIG.errorColors;
export type ScoreBand = typeof ASSESSMENT_CONFIG.scoreBands[number];

export function getBand(score: number): ScoreBand {
  return ASSESSMENT_CONFIG.scoreBands.find((b) => score >= b.min)!;
}
