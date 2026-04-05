import type { TranscriptionResult, TranscriptionSegment } from './transcribe';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PickAndSpeakResult {
  transcript: string;
  noSpeech: boolean;
  expressionsFound: string[];
  sentenceCount: number;
  wordCount: number;
  wpm: number;
  pronunciationConfidence: number;
  expressionScore: number;   // 0-30
  sentenceScore: number;     // 0-25
  fluencyScore: number;      // 0-20
  detailScore: number;       // 0-15
  pronunciationScore: number;// 0-10
  totalScore: number;        // 0-100
  passed: boolean;
  feedback: string[];
}

// ─── Opinion expressions ─────────────────────────────────────────────────────

const OPINION_TRIGGERS = [
  'i think', 'i believe', 'i feel', 'in my opinion', 'in my view',
  'from my point of view', 'personally', 'to me,', 'for me,',
  'i suppose', 'i guess', "i'd say", "i'd think", 'it seems to me',
  'as i see it', 'as far as i', 'i prefer', "i'd rather", 'to be honest',
] as const;

// ─── Sub-scorers (pure functions) ────────────────────────────────────────────

function scoreExpressions(rawTranscript: string): { found: string[]; score: number } {
  const lower = rawTranscript.toLowerCase();
  const found = OPINION_TRIGGERS.filter(expr => lower.includes(expr));
  // 2+ expressions = full credit (30), 1 = partial (22), 0 = none
  const score = found.length >= 2 ? 30 : found.length === 1 ? 22 : 0;
  return { found, score };
}

function countSentences(rawTranscript: string): number {
  const byPunctuation = rawTranscript
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.split(/\s+/).filter(Boolean).length >= 3);

  if (byPunctuation.length === 0) {
    const wordCount = rawTranscript.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(wordCount / 9));
  }
  return byPunctuation.length;
}

function scoreSentences(
  sentenceCount: number,
  wordCount: number,
  target: { min: number; max: number },
): number {
  if (wordCount < 10) return 0;
  if (sentenceCount >= target.min && sentenceCount <= target.max) return 25;
  if (sentenceCount === 1) return 12;
  if (sentenceCount > target.max) return 20;
  return 0;
}

function calcWpm(wordCount: number, segments: TranscriptionSegment[]): number {
  if (segments.length === 0 || wordCount === 0) return 0;
  const first = segments[0];
  const last = segments[segments.length - 1];
  if (!first || !last) return 0;
  // t0/t1 are in centiseconds (whisper.cpp native unit) — divide by 100 for seconds
  const durationSec = (last.t1 - first.t0) / 100;
  if (durationSec < 0.5) return 0;
  return (wordCount / durationSec) * 60;
}

function scoreFluency(wpm: number, wordCount: number): number {
  if (wordCount < 10 || wpm === 0) return 0;
  if (wpm >= 70 && wpm <= 180) return 20;
  if ((wpm >= 50 && wpm < 70) || (wpm > 180 && wpm <= 220)) return 12;
  if (wpm < 50) return 5;
  return 8; // > 220 WPM — very fast
}

function scoreDetail(wordCount: number): number {
  if (wordCount >= 25) return 15;
  if (wordCount >= 15) return 8;
  return 0;
}

function scorePronunciation(avgProb: number): number {
  if (avgProb >= 0.60) return 10;
  if (avgProb >= 0.40) return 6;
  return 0;
}

function buildFeedback(
  expressionScore: number,
  sentenceScore: number,
  fluencyScore: number,
  detailScore: number,
  pronunciationScore: number,
  sentenceCount: { min: number; max: number },
  wpm: number,
): string[] {
  const tips: string[] = [];
  if (expressionScore === 0) {
    tips.push("Start with 'I think...' or 'In my opinion...' to share your viewpoint.");
  }
  if (sentenceScore < 25) {
    tips.push(`Try to speak ${sentenceCount.min}–${sentenceCount.max} complete sentences — add a reason or example.`);
  }
  if (fluencyScore < 20) {
    if (wpm > 0 && wpm < 70) {
      tips.push('Try speaking a little faster and more naturally, like in a real conversation.');
    } else if (wpm > 180) {
      tips.push('Try slowing down slightly — speak at a relaxed, conversational pace.');
    }
  }
  if (detailScore < 15) {
    tips.push('Give more detail — explain why or add an example to your answer.');
  }
  if (pronunciationScore === 0) {
    tips.push('Speak clearly and close to the microphone.');
  }
  return tips;
}

// ─── Main scorer ─────────────────────────────────────────────────────────────

export function scorePickAndSpeak(
  result: TranscriptionResult,
  sentenceCount: { min: number; max: number },
  passThreshold: number,
): PickAndSpeakResult {
  if (result.noSpeech) {
    return {
      transcript: result.transcript,
      noSpeech: true,
      expressionsFound: [],
      sentenceCount: 0,
      wordCount: 0,
      wpm: 0,
      pronunciationConfidence: 0,
      expressionScore: 0,
      sentenceScore: 0,
      fluencyScore: 0,
      detailScore: 0,
      pronunciationScore: 0,
      totalScore: 0,
      passed: false,
      feedback: ['No speech detected — please try again.'],
    };
  }

  const rawTranscript = result.transcript;
  const wordCount = rawTranscript.trim().split(/\s+/).filter(Boolean).length;
  const sentences = countSentences(rawTranscript);
  const wpm = calcWpm(wordCount, result.segments);

  const { found: expressionsFound, score: expressionScore } = scoreExpressions(rawTranscript);
  const sentenceScoreVal = scoreSentences(sentences, wordCount, sentenceCount);
  const fluencyScoreVal = scoreFluency(wpm, wordCount);
  const detailScoreVal = scoreDetail(wordCount);
  const pronunciationScoreVal = scorePronunciation(result.avgProb);

  const totalScore = expressionScore + sentenceScoreVal + fluencyScoreVal + detailScoreVal + pronunciationScoreVal;
  const passed = totalScore >= passThreshold;

  const feedback = passed
    ? []
    : buildFeedback(expressionScore, sentenceScoreVal, fluencyScoreVal, detailScoreVal, pronunciationScoreVal, sentenceCount, Math.round(wpm));

  return {
    transcript: rawTranscript,
    noSpeech: false,
    expressionsFound,
    sentenceCount: sentences,
    wordCount,
    wpm: Math.round(wpm),
    pronunciationConfidence: result.avgProb,
    expressionScore,
    sentenceScore: sentenceScoreVal,
    fluencyScore: fluencyScoreVal,
    detailScore: detailScoreVal,
    pronunciationScore: pronunciationScoreVal,
    totalScore,
    passed,
    feedback,
  };
}
