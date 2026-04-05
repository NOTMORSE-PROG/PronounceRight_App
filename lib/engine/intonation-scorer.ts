import { decodeAudioData } from 'react-native-audio-api';
import { YIN } from 'pitchfinder';

// ─── Types ───────────────────────────────────────────────────────────────────

export type IntonationPattern = 'rising' | 'falling' | 'flat';

export interface PitchPoint {
  timeMs: number;
  hz: number;
}

export interface IntonationResult {
  detected: IntonationPattern;
  expected: 'rising' | 'falling';
  score: number;
  pitchContour: PitchPoint[];
}

// ─── Step 1: Decode m4a to Float32Array ──────────────────────────────────────

/**
 * Decode a local m4a file to raw PCM samples.
 * react-native-audio-api's decodeAudioData accepts a file path string directly.
 */
export async function decodeM4AToFloat32(
  filePath: string,
  targetSampleRate = 16000
): Promise<{ samples: Float32Array; sampleRate: number }> {
  const audioBuffer = await decodeAudioData(filePath, targetSampleRate);
  return {
    samples: audioBuffer.getChannelData(0),
    sampleRate: audioBuffer.sampleRate,
  };
}

// ─── Step 2: Extract F0 pitch contour ────────────────────────────────────────

/**
 * Run YIN pitch detection on audio samples, returning pitch in Hz per chunk.
 * Relaxed thresholds for denser contour — more points = better terminal analysis.
 * Filters to human voice range (60–500 Hz).
 */
export function extractPitchContour(
  samples: Float32Array,
  sampleRate: number
): PitchPoint[] {
  const detectPitch = YIN({ sampleRate, threshold: 0.20, probabilityThreshold: 0.5 });
  const chunkSize = 1024;
  const pitches: PitchPoint[] = [];

  for (let i = 0; i <= samples.length - chunkSize; i += chunkSize) {
    const chunk = samples.slice(i, i + chunkSize);
    const pitch = detectPitch(chunk);
    if (pitch !== null && pitch >= 60 && pitch <= 500) {
      pitches.push({ timeMs: (i / sampleRate) * 1000, hz: pitch });
    }
  }

  return pitches;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

function linearSlope(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i]!;
    sumXY += i * values[i]!;
    sumXX += i * i;
  }
  const denom = n * sumXX - sumX * sumX;
  return denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
}

// ─── Step 3: Classify rising vs falling (terminal pitch analysis) ────────────

/**
 * Detect intonation by comparing the terminal pitch to a reference segment.
 *
 * Rising intonation in natural speech concentrates in the very last 10-15%
 * of the utterance. A coarse split (e.g. 70/30) averages the rise with
 * preceding steady/declining pitch, masking the pattern.
 *
 * Algorithm:
 * - Reference: median Hz of the middle 50% (skip first 20% onset artifacts)
 * - Terminal:  median Hz of the last 15% (min 3 points)
 * - Primary:   5% median shift → rising/falling
 * - Secondary: linear slope of last 25% + 2% median shift → catches subtle trends
 */
export function classifyIntonation(pitches: PitchPoint[]): IntonationPattern {
  if (pitches.length < 6) return 'flat';

  // Reference: middle portion (skip onset artifacts, avoid terminal)
  const refStart = Math.floor(pitches.length * 0.2);
  const refEnd = Math.floor(pitches.length * 0.7);
  const refPitches = pitches.slice(refStart, refEnd);
  const refMed = median(refPitches.map(p => p.hz));

  if (refMed === 0) return 'flat';

  // Terminal: last 15% (minimum 3 points) — where rising intonation lives
  const termCount = Math.max(3, Math.floor(pitches.length * 0.15));
  const termPitches = pitches.slice(-termCount);
  const termMed = median(termPitches.map(p => p.hz));

  // Secondary: slope of last 25% for trend detection
  const slopeCount = Math.max(4, Math.floor(pitches.length * 0.25));
  const slopePitches = pitches.slice(-slopeCount);
  const slope = linearSlope(slopePitches.map(p => p.hz));

  const ratio = termMed / refMed;

  // Primary: median comparison (5% threshold)
  if (ratio > 1.05) return 'rising';
  if (ratio < 0.95) return 'falling';

  // Secondary: slope + mild median shift
  if (slope > 0 && ratio > 1.02) return 'rising';
  if (slope < 0 && ratio < 0.98) return 'falling';

  return 'flat';
}

// ─── Step 4: Score ───────────────────────────────────────────────────────────

/**
 * Score intonation accuracy.
 * - 100: detected matches expected
 * - 50:  detected is flat (partial credit — no actively wrong pattern)
 * - 0:   detected is the opposite of expected
 */
export function scoreIntonation(
  detected: IntonationPattern,
  expected: 'rising' | 'falling'
): number {
  if (detected === expected) return 100;
  if (detected === 'flat') return 50;
  return 0;
}

// ─── Convenience: full pipeline ──────────────────────────────────────────────

/**
 * Run the full intonation detection pipeline on a recorded m4a file.
 * Returns null if decoding or pitch extraction fails.
 */
export async function analyzeIntonation(
  filePath: string,
  expected: 'rising' | 'falling'
): Promise<IntonationResult | null> {
  try {
    const { samples, sampleRate } = await decodeM4AToFloat32(filePath);
    const pitchContour = extractPitchContour(samples, sampleRate);
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log(`[IntonationScorer] ${pitchContour.length} pitch points, expected: ${expected}`);
    }
    const detected = classifyIntonation(pitchContour);
    const score = scoreIntonation(detected, expected);
    return { detected, expected, score, pitchContour };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[IntonationScorer] analyzeIntonation failed:', err);
    return null;
  }
}
