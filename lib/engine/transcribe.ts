import type { WhisperContext, WhisperVadContext } from 'whisper.rn';
import { phonemeAccuracyScore } from './phoneme-scorer';
import { ASSESSMENT_CONFIG } from '@/lib/assessment-config';

export type AssessMode = 'word' | 'phrase' | 'passage';

export function detectMode(referenceText: string): AssessMode {
  const wordCount = referenceText.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount === 1) return 'word';
  if (wordCount <= 5) return 'phrase';
  return 'passage';
}

export interface TranscriptionResult {
  transcript: string;
  cleanedTranscript: string;
  noSpeech: boolean;
  hallucination: boolean;
}

/**
 * Known Whisper hallucination PHRASES — only multi-word filler strings
 * that cannot be valid single-word speech.
 */
const HALLUCINATIONS = new Set([
  'thank you', 'thank you.', 'thanks for watching', 'please subscribe',
  'like and subscribe', 'see you next time', 'bye bye',
]);

/** Strip punctuation and lowercase. */
function cleanText(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z\s']/g, '')
    .trim();
}

/**
 * For word mode: scan all words in the transcript and return the one that
 * most closely matches the reference phonemically.
 */
function extractBestWord(cleaned: string, reference: string): string {
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  if (words.length === 1) return words[0]!;
  const exact = words.find(w => w === reference.toLowerCase());
  if (exact) return exact;
  let best = words[0]!;
  let bestScore = phonemeAccuracyScore(best, reference);
  for (const w of words.slice(1)) {
    const s = phonemeAccuracyScore(w, reference);
    if (s > bestScore) { best = w; bestScore = s; }
  }
  return best;
}

/** Check if audio contains speech using Silero VAD. Returns false if no speech. */
async function hasSpeech(vadCtx: WhisperVadContext, uri: string): Promise<boolean> {
  try {
    const segments = await vadCtx.detectSpeech(uri);
    return segments.length > 0;
  } catch {
    return true; // if VAD fails, assume speech present and let Whisper decide
  }
}

/** Core whisper transcription with given options. */
async function runWhisper(
  ctx: WhisperContext,
  uri: string,
  extraOpts: Record<string, unknown> = {},
): Promise<string> {
  const { promise } = ctx.transcribe(uri, {
    language: 'en',
    maxLen: 1,
    tdrzEnable: false,
    temperature: 0,
    beamSize: 3,
    ...extraOpts,
  });
  const result = await promise;
  return (result.result ?? '').trim();
}

// ─── General transcription (used by assessText for all modes) ─────────────────

export async function transcribeAudio(
  ctx: WhisperContext,
  audioUri: string,
  referenceText: string,
  vadCtx?: WhisperVadContext | null,
): Promise<TranscriptionResult> {
  const mode = detectMode(referenceText);
  const isWord = mode === 'word';
  const uri = audioUri.startsWith('file://') ? audioUri : `file://${audioUri}`;

  // VAD pre-filter: skip Whisper entirely if no speech detected
  if (vadCtx && !(await hasSpeech(vadCtx, uri))) {
    return { transcript: '', cleanedTranscript: '', noSpeech: true, hallucination: false };
  }

  const opts: Record<string, unknown> = {
    maxLen: isWord ? 1 : 0,
    ...(isWord && { prompt: referenceText.trim() }),
  };

  const rawText = await runWhisper(ctx, uri, opts);
  const cleaned = cleanText(rawText);

  if (cleaned.length === 0 || HALLUCINATIONS.has(cleaned)) {
    return { transcript: rawText, cleanedTranscript: '', noSpeech: true, hallucination: false };
  }

  const cleanedTranscript = isWord
    ? extractBestWord(cleaned, referenceText.toLowerCase().trim())
    : cleaned;

  return {
    transcript: rawText,
    cleanedTranscript,
    noSpeech: cleanedTranscript.length === 0,
    hallucination: false,
  };
}

// ─── Minimal pair transcription (pair-aware, with hallucination detection + retry) ──

export async function transcribeForMinimalPair(
  ctx: WhisperContext,
  audioUri: string,
  targetWord: string,
  pairWord: string,
  vadCtx?: WhisperVadContext | null,
): Promise<TranscriptionResult> {
  const uri = audioUri.startsWith('file://') ? audioUri : `file://${audioUri}`;
  const cfg = ASSESSMENT_CONFIG.hallucination;

  // VAD pre-filter
  if (vadCtx && !(await hasSpeech(vadCtx, uri))) {
    return { transcript: '', cleanedTranscript: '', noSpeech: true, hallucination: false };
  }

  // Prompt with both words — gives Whisper awareness of the phoneme space
  const opts: Record<string, unknown> = {
    maxLen: 1,
    prompt: `${targetWord}, ${pairWord}`,
  };

  let rawText = await runWhisper(ctx, uri, opts);
  let cleaned = cleanText(rawText);

  if (cleaned.length === 0 || HALLUCINATIONS.has(cleaned)) {
    return { transcript: rawText, cleanedTranscript: '', noSpeech: true, hallucination: false };
  }

  let bestWord = extractBestWord(cleaned, targetWord.toLowerCase().trim());

  // Post-hoc hallucination check: does the best word match either pair word?
  const scoreVsTarget = phonemeAccuracyScore(bestWord, targetWord);
  const scoreVsPair = phonemeAccuracyScore(bestWord, pairWord);

  // If both scores are very low → suspected hallucination, retry once
  if (scoreVsTarget < cfg.retryThreshold && scoreVsPair < cfg.retryThreshold) {
    const retryRaw = await runWhisper(ctx, uri, {
      ...opts,
      temperature: cfg.retryTemperature,
    });
    const retryCleaned = cleanText(retryRaw);
    if (retryCleaned.length > 0 && !HALLUCINATIONS.has(retryCleaned)) {
      const retryBest = extractBestWord(retryCleaned, targetWord.toLowerCase().trim());
      const retryScore = phonemeAccuracyScore(retryBest, targetWord);
      // Use retry result if it's better
      if (retryScore > scoreVsTarget) {
        rawText = retryRaw;
        cleaned = retryCleaned;
        bestWord = retryBest;
      }
    }
  }

  // Final hallucination check after possible retry
  const finalVsTarget = phonemeAccuracyScore(bestWord, targetWord);
  const finalVsPair = phonemeAccuracyScore(bestWord, pairWord);

  if (finalVsTarget < cfg.bothWordsThreshold && finalVsPair < cfg.bothWordsThreshold) {
    return {
      transcript: rawText,
      cleanedTranscript: bestWord,
      noSpeech: false,
      hallucination: true,
    };
  }

  return {
    transcript: rawText,
    cleanedTranscript: bestWord,
    noSpeech: false,
    hallucination: false,
  };
}
