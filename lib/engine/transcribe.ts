import type { WhisperContext, WhisperVadContext } from 'whisper.rn';
import { phonemeAccuracyScore } from './phoneme-scorer';

export type AssessMode = 'word' | 'phrase' | 'passage';

export function detectMode(referenceText: string): AssessMode {
  const wordCount = referenceText.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount === 1) return 'word';
  if (wordCount <= 5) return 'phrase';
  return 'passage';
}

export interface TranscriptionSegment {
  text: string;
  t0: number;   // start time in centiseconds (whisper.cpp native unit)
  t1: number;   // end time in centiseconds
  avgProb: number; // average token probability (0-1, pronunciation confidence)
}

export interface TranscriptionResult {
  transcript: string;
  cleanedTranscript: string;
  noSpeech: boolean;
  hallucination: boolean;
  segments: TranscriptionSegment[];
  avgProb: number; // overall pronunciation confidence (mean of segment avgProbs)
}

/**
 * Known Whisper hallucination strings — only obvious non-speech labels
 * and multi-word filler that cannot be valid pronunciation targets.
 */
const HALLUCINATIONS = new Set([
  // Multi-word YouTube/podcast filler
  'thank you', 'thank you.', 'thanks for watching', 'thanks for watching.',
  'please subscribe', 'please subscribe.', 'like and subscribe',
  'see you next time', 'bye bye', 'the end', 'subtitle by', 'subtitles by',
  'translated by', 'thank you for watching',
  // Non-speech sound-event labels (not real English words)
  'gunshot', 'gunshots', 'silence', 'applause', 'music', 'laughter',
  'coughing', 'breathing', 'footsteps', 'clapping', 'whistling',
  'snoring', 'screaming',
  // Single-word filler commonly hallucinated by Whisper on short audio
  'please', 'okay', 'sorry', 'yes', 'no', 'hello', 'hi', 'oh', 'so',
  'you', 'the', 'a', 'i', 'we', 'it', 'is', 'are', 'was', 'do',
  'um', 'uh', 'hmm', 'huh', 'wow', 'hey', 'bye',
]);

/** Strip punctuation and lowercase. */
function cleanText(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z\s']/g, '')
    .trim();
}

const INFLECTION_SUFFIXES = ['ing', 'ed', 'er', 'es', 's'] as const;

/**
 * Strip common inflection suffixes only when the result exactly matches a candidate.
 * e.g. normalizeToCandidate('fools', ['full','fool']) → 'fool'
 *      normalizeToCandidate('running', ['run']) → 'run'
 */
function normalizeToCandidate(word: string, candidates: string[]): string {
  if (candidates.includes(word)) return word;
  for (const suf of INFLECTION_SUFFIXES) {
    if (word.length > suf.length + 1 && word.endsWith(suf)) {
      const base = word.slice(0, -suf.length);
      if (candidates.includes(base)) return base;
    }
  }
  return word;
}

/**
 * For word mode: scan all words in the transcript and return the one that
 * most closely matches the reference (or any candidate) phonemically.
 * Returns empty string if no word is phonemically relevant (likely hallucination).
 *
 * @param maxWords - if transcript has more words than this, only accept an exact candidate match
 */
function extractBestWord(cleaned: string, reference: string, candidates?: string[], maxWords = Infinity): string {
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';

  const allRefs = (candidates ?? [reference]).map((r) => r.toLowerCase());
  const MIN_RELEVANCE = 30; // phoneme score below this = likely hallucination

  // Too many words — only accept an exact candidate match (rejects multi-word hallucinations)
  if (words.length > maxWords) {
    for (const ref of allRefs) {
      const exact = words.find((w) => w === ref);
      if (exact) return exact;
    }
    return '';
  }

  if (words.length === 1) {
    const word = words[0]!;
    // Check exact match against any candidate
    if (allRefs.includes(word)) return word;
    // Validate phonemic relevance — reject if not close to any expected word
    const bestRefScore = Math.max(...allRefs.map((r) => phonemeAccuracyScore(word, r)));
    return bestRefScore >= MIN_RELEVANCE ? word : '';
  }

  // Multi-word: check for exact match first
  for (const ref of allRefs) {
    const exact = words.find((w) => w === ref);
    if (exact) return exact;
  }

  // Pick the word with highest phoneme score against any candidate
  let best = '';
  let bestScore = -1;
  for (const w of words) {
    for (const ref of allRefs) {
      const s = phonemeAccuracyScore(w, ref);
      if (s > bestScore) { best = w; bestScore = s; }
    }
  }
  return bestScore >= MIN_RELEVANCE ? best : '';
}

interface SpeechBounds {
  hasSpeech: boolean;
  offsetMs: number;
  durationMs: number;
}

/** Detect speech boundaries using Silero VAD. Returns offset/duration for Whisper. */
async function getSpeechBounds(vadCtx: WhisperVadContext, uri: string): Promise<SpeechBounds> {
  try {
    const segments = await vadCtx.detectSpeech(uri);
    if (segments.length === 0) return { hasSpeech: false, offsetMs: 0, durationMs: 0 };
    const startMs = Math.max(0, segments[0]!.t0 - 200); // 200ms padding before speech
    const endMs = segments[segments.length - 1]!.t1 + 200; // 200ms padding after speech
    return { hasSpeech: true, offsetMs: startMs, durationMs: endMs - startMs };
  } catch {
    return { hasSpeech: true, offsetMs: 0, durationMs: 0 }; // assume speech on error
  }
}

interface WhisperOutput {
  text: string;
  segments: TranscriptionSegment[];
  avgProb: number;
}

/** Core whisper transcription with given options. */
async function runWhisper(
  ctx: WhisperContext,
  uri: string,
  extraOpts: Record<string, unknown> = {},
): Promise<WhisperOutput> {
  // eslint-disable-next-line no-console
  console.log('[Whisper] transcribe start', uri);
  try {
    const { promise } = ctx.transcribe(uri, {
      language: 'en',
      maxLen: 1,
      tdrzEnable: false,
      temperature: 0,
      temperatureInc: 0,
      beamSize: 5,
      // Anti-hallucination: tighter thresholds for short single-word audio
      noSpeechThold: 0.4,
      logprobThold: -0.7,
      suppressNonSpeechTokens: true,
      ...extraOpts,
    });
    const result = await promise;
    const text = (result.result ?? '').trim();
    const segments: TranscriptionSegment[] = (result.segments ?? []).map((s) => ({
      text: s.text,
      t0: s.t0,
      t1: s.t1,
      avgProb: s.avgProb ?? 0,
    }));
    const avgProb = segments.length > 0
      ? segments.reduce((sum, s) => sum + s.avgProb, 0) / segments.length
      : 0;
    // eslint-disable-next-line no-console
    console.log('[Whisper] transcribe result:', JSON.stringify(text), `(${segments.length} segments, avgProb=${avgProb.toFixed(3)})`);
    return { text, segments, avgProb };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Whisper] transcribe error:', error);
    return { text: '', segments: [], avgProb: 0 };
  }
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
): Promise<{ rawText: string; segments: TranscriptionSegment[]; avgProb: number; vadSaidNoSpeech: boolean }> {
  let vadSaidNoSpeech = false;
  if (vadCtx) {
    const bounds = await getSpeechBounds(vadCtx, uri);
    vadSaidNoSpeech = !bounds.hasSpeech;
    // eslint-disable-next-line no-console
    console.log('[Whisper] VAD says:', vadSaidNoSpeech ? 'no speech' : `speech ${bounds.offsetMs}-${bounds.offsetMs + bounds.durationMs}ms`);
    // Only trim leading silence — do NOT pass duration; VAD underestimates
    // speech end on longer utterances, causing Whisper to cut off final sentences.
    if (bounds.hasSpeech && bounds.offsetMs > 0) {
      opts = { ...opts, offset: bounds.offsetMs };
    }
  }
  // Always run Whisper — VAD is advisory, not a gate
  const { text: rawText, segments, avgProb } = await runWhisper(ctx, uri, opts);
  return { rawText, segments, avgProb, vadSaidNoSpeech };
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
  const { rawText, segments, avgProb } = await runWhisperWithSoftVad(ctx, uri, vadCtx, opts);

  // Detect Whisper special tokens: [BLANK_AUDIO], [MUSIC], [inaudible], etc.
  if (/^\[[\w\s]+\]$/.test(rawText.trim())) {
    return { transcript: rawText, cleanedTranscript: '', noSpeech: true, hallucination: false, segments: [], avgProb: 0 };
  }

  const cleaned = cleanText(rawText);

  // No usable output from Whisper
  if (cleaned.length === 0 || HALLUCINATIONS.has(cleaned)) {
    return { transcript: rawText, cleanedTranscript: '', noSpeech: true, hallucination: false, segments: [], avgProb: 0 };
  }

  const referenceLower = referenceText.toLowerCase().trim();
  let cleanedTranscript: string;
  if (isWord) {
    const rawBest = extractBestWord(cleaned, referenceLower, undefined, 1);
    cleanedTranscript = rawBest ? normalizeToCandidate(rawBest, [referenceLower]) : '';
  } else {
    cleanedTranscript = cleaned;
  }

  if (cleanedTranscript.length === 0) {
    return { transcript: rawText, cleanedTranscript: '', noSpeech: true, hallucination: false, segments: [], avgProb: 0 };
  }

  return {
    transcript: rawText,
    cleanedTranscript,
    noSpeech: false,
    hallucination: false,
    segments,
    avgProb,
  };
}

// ─── Free speech transcription (Pick and Speak, open-ended) ──────────────────

/**
 * Transcribe open-ended free speech with no reference prompt.
 * Used by PickAndSpeakActivity — do NOT filter short words via HALLUCINATIONS
 * (student may say "I like..." which starts with filtered tokens).
 * Only rejects Whisper special-token output like [BLANK_AUDIO].
 *
 * VAD is used ONLY for: (1) detecting silence, (2) trimming leading silence
 * via offset. We intentionally do NOT pass duration — VAD underestimates
 * speech end on longer utterances, causing Whisper to cut off final sentences.
 */
export async function transcribeFreeSpeech(
  ctx: WhisperContext,
  audioUri: string,
  vadCtx?: WhisperVadContext | null,
): Promise<TranscriptionResult> {
  const uri = audioUri.startsWith('file://') ? audioUri : `file://${audioUri}`;
  const opts: Record<string, unknown> = {
    maxLen: 0,
    noSpeechThold: 0.6,
    suppressNonSpeechTokens: false,
    temperature: 0,
    temperatureInc: 0.2,
    beamSize: 5,
  };

  if (vadCtx) {
    try {
      const vadSegments = await vadCtx.detectSpeech(uri);
      if (vadSegments.length === 0) {
        return { transcript: '', cleanedTranscript: '', noSpeech: true, hallucination: false, segments: [], avgProb: 0 };
      }
      // Only offset — skip leading silence, do not cap duration
      const startMs = Math.max(0, vadSegments[0]!.t0 - 200);
      if (startMs > 0) opts.offset = startMs;
    } catch {
      // VAD failed — proceed without offset
    }
  }

  const { text: rawText, segments, avgProb } = await runWhisper(ctx, uri, opts);
  if (/^\[[\w\s]+\]$/.test(rawText.trim())) {
    return { transcript: rawText, cleanedTranscript: '', noSpeech: true, hallucination: false, segments: [], avgProb: 0 };
  }
  const cleaned = cleanText(rawText);
  if (cleaned.length === 0) {
    return { transcript: rawText, cleanedTranscript: '', noSpeech: true, hallucination: false, segments: [], avgProb: 0 };
  }
  return { transcript: rawText, cleanedTranscript: cleaned, noSpeech: false, hallucination: false, segments, avgProb };
}

// ─── Minimal pair transcription (pair-aware prompting) ──────────────────────

export async function transcribeForMinimalPair(
  ctx: WhisperContext,
  audioUri: string,
  targetWord: string,
  pairWord: string,
  vadCtx?: WhisperVadContext | null,
): Promise<TranscriptionResult> {
  const uri = audioUri.startsWith('file://') ? audioUri : `file://${audioUri}`;

  // No prompt — let Whisper do pure acoustic decoding for minimal pairs.
  // Prompting with both words causes decoder bias that swaps similar-sounding words.
  const opts: Record<string, unknown> = {
    maxLen: 1,
    beamSize: 5,
  };

  // VAD is a soft signal — always run Whisper
  const { rawText: initialRaw, segments, avgProb } = await runWhisperWithSoftVad(ctx, uri, vadCtx, opts);

  // Detect Whisper special tokens: [BLANK_AUDIO], [MUSIC], [inaudible], etc.
  if (/^\[[\w\s]+\]$/.test(initialRaw.trim())) {
    return { transcript: initialRaw, cleanedTranscript: '', noSpeech: true, hallucination: false, segments: [], avgProb: 0 };
  }

  const cleaned = cleanText(initialRaw);

  // No usable output
  if (cleaned.length === 0 || HALLUCINATIONS.has(cleaned)) {
    return { transcript: initialRaw, cleanedTranscript: '', noSpeech: true, hallucination: false, segments: [], avgProb: 0 };
  }

  // Compare against both target and pair word — pick best phonemic match
  const targetLower = targetWord.toLowerCase().trim();
  const pairLower = pairWord.toLowerCase().trim();
  const rawBest = extractBestWord(cleaned, targetLower, [targetLower, pairLower], 1);
  const bestWord = rawBest ? normalizeToCandidate(rawBest, [targetLower, pairLower]) : '';

  return {
    transcript: initialRaw,
    cleanedTranscript: bestWord,
    noSpeech: false,
    hallucination: false,
    segments,
    avgProb,
  };
}
