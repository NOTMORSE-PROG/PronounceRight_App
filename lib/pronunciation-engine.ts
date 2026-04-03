import type { WhisperContext, WhisperVadContext } from 'whisper.rn';
import { transcribeAudio, transcribeForMinimalPair, detectMode, type AssessMode } from './engine/transcribe';
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
  noSpeechDetected: boolean;
  hallucination: boolean;
  confusedWithPairWord: boolean;
  pairWord?: string;
  wordResults: WordLevelResult[];
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
  extra?: { confusedWithPairWord?: boolean; pairWord?: string },
): AssessmentResult {
  const cfg = ASSESSMENT_CONFIG;
  const { accuracy: wa, fluency: wf, completeness: wc, prosody: wp } = cfg.scoreWeights;
  const fluencyScore = 90;
  const prosodyScore = 100;

  const raw = accuracyScore * wa + fluencyScore * wf + completenessScore * wc + prosodyScore * wp;
  const phonicsScore = Math.min(100, Math.max(0, Math.round(raw)));

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
    passed: phonicsScore >= cfg.passThreshold,
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

  const { transcript, cleanedTranscript, noSpeech } = await transcribeAudio(
    ctx, audioUri, referenceText, vadCtx,
  );

  if (noSpeech || cleanedTranscript.length === 0) {
    return emptyResult(mode, transcript, { noSpeech: true, hallucination: false });
  }

  const errors: ErrorCategory[] = [];
  let accuracyScore: number;
  let completenessScore: number;
  let wordResults: WordLevelResult[];

  if (mode === 'word') {
    accuracyScore = cleanedTranscript === referenceLower
      ? 100
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

  return buildWordResult(mode, transcript, cleanedTranscript, accuracyScore, completenessScore, errors, wordResults);
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

  const { transcript, cleanedTranscript, noSpeech, hallucination } =
    await transcribeForMinimalPair(ctx, audioUri, targetWord, pairWord, vadCtx);

  if (noSpeech || cleanedTranscript.length === 0) {
    return emptyResult('word', transcript, { noSpeech: true, hallucination: false, pairWord });
  }

  if (hallucination) {
    return emptyResult('word', transcript, { noSpeech: false, hallucination: true, pairWord });
  }

  // Score against target
  const accuracyScore = cleanedTranscript === targetLower
    ? 100
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

  return buildWordResult('word', transcript, cleanedTranscript, accuracyScore, 100, errors, wordResults, {
    confusedWithPairWord,
    pairWord,
  });
}
