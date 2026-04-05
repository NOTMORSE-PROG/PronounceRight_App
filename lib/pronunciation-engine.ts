import type { WhisperContext, WhisperVadContext } from 'whisper.rn';
import { transcribeAudio, transcribeForMinimalPair, detectMode, type AssessMode } from './engine/transcribe';
import type { TranscriptionSegment } from './engine/transcribe';
import { phonemeAccuracyScore } from './engine/phoneme-scorer';
import { alignWords } from './engine/word-aligner';
import type { WordAlignment } from './engine/word-aligner';
import { ASSESSMENT_CONFIG, getBand } from './assessment-config';
import type { ErrorCategory, ScoreBand } from './assessment-config';

export type { AssessMode };

export interface WordLevelResult {
  referenceWord: string | null;
  transcriptWord: string | null;
  score: number;
  status: WordAlignment['status'];
}

export interface AssessmentResult {
  mode: AssessMode;
  transcript: string;
  cleanedTranscript: string;
  phonicsScore: number;
  accuracyScore: number;
  fluencyScore: number;
  completenessScore: number;
  prosodyScore: number;
  errors: ErrorCategory[];
  band: ScoreBand;
  passed: boolean;
  /** True when the correct word was recognized by Whisper, regardless of pronunciation quality score. */
  recognitionPass: boolean;
  noSpeechDetected: boolean;
  hallucination: boolean;
  confusedWithPairWord: boolean;
  pairWord?: string;
  wordResults: WordLevelResult[];
}

// ─── Fluency calculation from Whisper segment timestamps ────────────────────

/**
 * Compute fluency score from Whisper segments.
 *
 * For word mode: returns 100 (fluency doesn't apply to single words).
 * For phrase/passage: analyzes speech rate and pause patterns:
 *   - speechRatio: % of time spent speaking vs total duration (penalizes long pauses)
 *   - rateScore: how close to natural ESL rate (~2 words/sec)
 */
function computeFluency(
  mode: AssessMode,
  segments: TranscriptionSegment[],
  wordCount: number,
): number {
  // Fluency is not meaningful for single words
  if (mode === 'word') return 100;
  // No segments — can't compute; default to moderate
  if (segments.length === 0 || wordCount === 0) return 70;

  // Total duration from first segment start to last segment end (in seconds)
  const firstStart = Math.min(...segments.map((s) => s.t0));
  const lastEnd = Math.max(...segments.map((s) => s.t1));
  const totalDurationSec = (lastEnd - firstStart) / 1000;

  if (totalDurationSec <= 0) return 70;

  // Speech duration = sum of all segment durations
  const speechDurationSec = segments.reduce((sum, s) => sum + (s.t1 - s.t0) / 1000, 0);

  // Speech ratio: penalizes excessive pausing (ideal ≥ 0.8)
  const speechRatio = Math.min(1, speechDurationSec / totalDurationSec);
  const speechRatioScore = Math.min(100, Math.round(speechRatio * 125)); // 0.8 ratio → 100

  // Rate: words per second (ideal ~2.0 for ESL learners, acceptable 1.0–3.5)
  const wordsPerSec = wordCount / totalDurationSec;
  let rateScore: number;
  if (wordsPerSec >= 1.5 && wordsPerSec <= 3.0) {
    rateScore = 100; // ideal range
  } else if (wordsPerSec < 1.5) {
    rateScore = Math.max(30, Math.round((wordsPerSec / 1.5) * 100)); // too slow
  } else {
    rateScore = Math.max(50, Math.round(100 - (wordsPerSec - 3.0) * 25)); // too fast
  }

  // Weighted combination
  const fluency = Math.round(speechRatioScore * 0.6 + rateScore * 0.4);
  return Math.min(100, Math.max(0, fluency));
}

// ─── Helper: map token probability to pronunciation accuracy ────────────────

/**
 * Convert Whisper's average token probability into an accuracy score.
 * Even when Whisper recognizes the correct word, low probability signals
 * unclear pronunciation. Higher probability = clearer speech = higher score.
 */
function confidenceToAccuracy(avgProb: number): number {
  const { confidenceCeiling, minQualityFloor } = ASSESSMENT_CONFIG.engineTuning;
  const ratio = Math.min(1.0, Math.max(minQualityFloor, avgProb / confidenceCeiling));
  return Math.round(ratio * 100);
}

// ─── Helper: build a no-speech/hallucination result ───────────────────────────

function emptyResult(
  mode: AssessMode,
  transcript: string,
  opts: { noSpeech: boolean; hallucination: boolean; pairWord?: string },
): AssessmentResult {
  return {
    mode,
    transcript: transcript || '',
    cleanedTranscript: '',
    phonicsScore: 0,
    accuracyScore: 0,
    fluencyScore: 0,
    completenessScore: 0,
    prosodyScore: 100,
    errors: ['omission'],
    band: getBand(0),
    passed: false,
    recognitionPass: false,
    noSpeechDetected: opts.noSpeech,
    hallucination: opts.hallucination,
    confusedWithPairWord: false,
    pairWord: opts.pairWord,
    wordResults: [],
  };
}

// ─── Helper: compute scores from accuracy + produce result ────────────────────

function buildWordResult(
  mode: AssessMode,
  transcript: string,
  cleanedTranscript: string,
  accuracyScore: number,
  completenessScore: number,
  errors: ErrorCategory[],
  wordResults: WordLevelResult[],
  segments: TranscriptionSegment[],
  extra?: { confusedWithPairWord?: boolean; pairWord?: string; exactMatch?: boolean },
): AssessmentResult {
  const cfg = ASSESSMENT_CONFIG;
  const { accuracy: wa, fluency: wf, completeness: wc, prosody: wp } = cfg.scoreWeights;

  const wordCount = cleanedTranscript.split(/\s+/).filter(Boolean).length;
  const fluencyScore = computeFluency(mode, segments, wordCount);
  const prosodyScore = 100; // Phase 2

  const raw = accuracyScore * wa + fluencyScore * wf + completenessScore * wc + prosodyScore * wp;
  const phonicsScore = Math.min(100, Math.max(0, Math.round(raw)));

  const recognitionPass = extra?.exactMatch ?? false;

  return {
    mode,
    transcript,
    cleanedTranscript,
    phonicsScore,
    accuracyScore,
    fluencyScore,
    completenessScore,
    prosodyScore,
    errors,
    band: getBand(phonicsScore),
    passed: recognitionPass || phonicsScore >= cfg.passThreshold,
    recognitionPass,
    noSpeechDetected: false,
    hallucination: false,
    confusedWithPairWord: extra?.confusedWithPairWord ?? false,
    pairWord: extra?.pairWord,
    wordResults,
  };
}

// ─── assessText: general-purpose (all modes) ──────────────────────────────────

export async function assessText(
  ctx: WhisperContext,
  audioUri: string,
  referenceText: string,
  vadCtx?: WhisperVadContext | null,
): Promise<AssessmentResult> {
  const cfg = ASSESSMENT_CONFIG;
  const mode = detectMode(referenceText);
  const referenceLower = referenceText.toLowerCase().trim();

  const { transcript, cleanedTranscript, noSpeech, segments, avgProb } = await transcribeAudio(
    ctx, audioUri, referenceText, vadCtx,
  );

  if (noSpeech || cleanedTranscript.length === 0) {
    return emptyResult(mode, transcript, { noSpeech: true, hallucination: false });
  }

  const errors: ErrorCategory[] = [];
  let accuracyScore: number;
  let completenessScore: number;
  let wordResults: WordLevelResult[];

  const exactMatch = mode === 'word' && cleanedTranscript === referenceLower;

  if (mode === 'word') {
    accuracyScore = exactMatch
      ? confidenceToAccuracy(avgProb)
      : phonemeAccuracyScore(cleanedTranscript, referenceLower);

    completenessScore = 100;

    wordResults = [{
      referenceWord: referenceLower,
      transcriptWord: cleanedTranscript,
      score: accuracyScore,
      status: accuracyScore >= cfg.errorThresholds.mispronunciationAccuracy ? 'correct' : 'mispronounced',
    }];

    if (accuracyScore < cfg.errorThresholds.mispronunciationAccuracy && cleanedTranscript !== referenceLower) {
      errors.push('pronunciation');
    }
    const rawWordCount = transcript.toLowerCase().trim().split(/\s+/).filter(Boolean).length;
    if (rawWordCount > 1) errors.push('redundancy');

  } else {
    const refWords = referenceLower.split(/\s+/).filter(Boolean);
    const transWords = cleanedTranscript.split(/\s+/).filter(Boolean);
    const alignment = alignWords(transWords, refWords, cfg.errorThresholds.mispronunciationAccuracy);

    wordResults = alignment.map((a) => ({
      referenceWord: a.referenceWord,
      transcriptWord: a.transcriptWord,
      score: a.score,
      status: a.status,
    }));

    const alignedPairs = alignment.filter((a) => a.referenceWord && a.transcriptWord);
    accuracyScore = alignedPairs.length > 0
      ? Math.round(alignedPairs.reduce((s, a) => s + a.score, 0) / alignedPairs.length)
      : 0;

    const omitted = alignment.filter((a) => a.status === 'omitted').length;
    completenessScore = Math.round(((refWords.length - omitted) / refWords.length) * 100);

    if (alignment.some((a) => a.status === 'mispronounced')) errors.push('pronunciation');
    if (alignment.some((a) => a.status === 'omitted')) errors.push('omission');
    if (alignment.some((a) => a.status === 'extra')) errors.push('redundancy');
  }

  return buildWordResult(mode, transcript, cleanedTranscript, accuracyScore, completenessScore, errors, wordResults, segments, { exactMatch });
}

// ─── assessMinimalPair: pair-aware with hallucination detection ───────────────

export async function assessMinimalPair(
  ctx: WhisperContext,
  audioUri: string,
  targetWord: string,
  pairWord: string,
  vadCtx?: WhisperVadContext | null,
): Promise<AssessmentResult> {
  const cfg = ASSESSMENT_CONFIG;
  const targetLower = targetWord.toLowerCase().trim();
  const pairLower = pairWord.toLowerCase().trim();

  const { transcript, cleanedTranscript, noSpeech, hallucination, segments, avgProb } =
    await transcribeForMinimalPair(ctx, audioUri, targetWord, pairWord, vadCtx);

  if (noSpeech || cleanedTranscript.length === 0) {
    return emptyResult('word', transcript, { noSpeech: true, hallucination: false, pairWord });
  }

  if (hallucination) {
    return emptyResult('word', transcript, { noSpeech: false, hallucination: true, pairWord });
  }

  // Score against target — use token probability as quality signal when word matches
  const exactMatch = cleanedTranscript === targetLower;
  const accuracyScore = exactMatch
    ? confidenceToAccuracy(avgProb)
    : phonemeAccuracyScore(cleanedTranscript, targetLower);

  // Check if student said the pair word instead
  const pairScore = phonemeAccuracyScore(cleanedTranscript, pairLower);
  const confusedWithPairWord = pairScore > accuracyScore && accuracyScore < cfg.errorThresholds.mispronunciationAccuracy;

  const errors: ErrorCategory[] = [];
  if (accuracyScore < cfg.errorThresholds.mispronunciationAccuracy && cleanedTranscript !== targetLower) {
    errors.push('pronunciation');
  }
  const rawWordCount = transcript.toLowerCase().trim().split(/\s+/).filter(Boolean).length;
  if (rawWordCount > 1) errors.push('redundancy');

  const wordResults: WordLevelResult[] = [{
    referenceWord: targetLower,
    transcriptWord: cleanedTranscript,
    score: accuracyScore,
    status: accuracyScore >= cfg.errorThresholds.mispronunciationAccuracy ? 'correct' : 'mispronounced',
  }];

  return buildWordResult('word', transcript, cleanedTranscript, accuracyScore, 100, errors, wordResults, segments, {
    confusedWithPairWord,
    pairWord,
    exactMatch,
  });
}
