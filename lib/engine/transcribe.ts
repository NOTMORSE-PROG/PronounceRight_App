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
 * Known Whisper hallucination strings — single-word sound-event labels and
 * multi-word filler strings that cannot be valid speech.
 */
const HALLUCINATIONS = new Set([
  // Multi-word filler
  'thank you', 'thank you.', 'thanks for watching', 'thanks for watching.',
  'please subscribe', 'please subscribe.', 'like and subscribe',
  'see you next time', 'bye bye', 'the end', 'subtitle by', 'subtitles by',
  'translated by', 'thank you for watching',
  // Single-word sound-event labels Whisper commonly hallucinates
  'gunshot', 'gunshots', 'silence', 'applause', 'music', 'laughter',
  'coughing', 'breathing', 'footsteps', 'clapping', 'boom', 'bang',
  'explosion', 'sigh', 'whistling', 'snoring', 'crying', 'screaming',
  'beep', 'ring', 'bell', 'knock', 'crash', 'you',
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

/**
 * Run Whisper with VAD as a soft signal (not a hard gate).
 * VAD result is returned alongside the transcript so callers can combine both signals.
 */
async function runWhisperWithSoftVad(
  ctx: WhisperContext,
  uri: string,
  vadCtx: WhisperVadContext | null | undefined,
  opts: Record<string, unknown>,
): Promise<{ rawText: string; vadSaidNoSpeech: boolean }> {
  let vadSaidNoSpeech = false;
  if (vadCtx) {
    vadSaidNoSpeech = !(await hasSpeech(vadCtx, uri));
  }
  // Always run Whisper — VAD is advisory, not a gate
  const rawText = await runWhisper(ctx, uri, opts);
  return { rawText, vadSaidNoSpeech };
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

  const opts: Record<string, unknown> = {
    maxLen: isWord ? 1 : 0,
    ...(isWord && { prompt: referenceText.trim() }),
  };

  // VAD is a soft signal — we always run Whisper
  const { rawText, vadSaidNoSpeech } = await runWhisperWithSoftVad(ctx, uri, vadCtx, opts);
  const cleaned = cleanText(rawText);

  // Both VAD and Whisper agree: no usable speech
  if (cleaned.length === 0 || HALLUCINATIONS.has(cleaned)) {
    return { transcript: rawText, cleanedTranscript: '', noSpeech: true, hallucination: false };
  }

  // If VAD said no speech but Whisper found text, trust Whisper and continue

  const cleanedTranscript = isWord
    ? extractBestWord(cleaned, referenceText.toLowerCase().trim())
    : cleaned;

  if (cleanedTranscript.length === 0) {
    return { transcript: rawText, cleanedTranscript: '', noSpeech: true, hallucination: false };
  }

  // Word-mode secondary hallucination check: if best word scores very low
  // against the reference, it's likely a hallucination (e.g. "gunshot" for "hello")
  if (isWord) {
    const refLower = referenceText.toLowerCase().trim();
    const score = phonemeAccuracyScore(cleanedTranscript, refLower);
    if (score < ASSESSMENT_CONFIG.hallucination.wordModeThreshold) {
      return {
        transcript: rawText,
        cleanedTranscript: '',
        noSpeech: vadSaidNoSpeech,
        hallucination: !vadSaidNoSpeech, // if VAD saw speech but score is junk → hallucination
      };
    }
  }

  return {
    transcript: rawText,
    cleanedTranscript,
    noSpeech: false,
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

  // Prompt with both words — gives Whisper awareness of the phoneme space
  const opts: Record<string, unknown> = {
    maxLen: 1,
    prompt: `${targetWord}, ${pairWord}`,
  };

  // VAD is a soft signal — always run Whisper
  const { rawText: initialRaw } = await runWhisperWithSoftVad(ctx, uri, vadCtx, opts);
  let rawText = initialRaw;
  let cleaned = cleanText(rawText);

  // Both VAD and Whisper agree: no usable speech
  if (cleaned.length === 0 || HALLUCINATIONS.has(cleaned)) {
    // Only return noSpeech if Whisper also found nothing useful
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
