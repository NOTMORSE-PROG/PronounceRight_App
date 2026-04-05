import { dictionary } from 'cmu-pronouncing-dictionary';

// ARPAbet vowel bases (stress markers 0/1/2 attach to these)
const VOWELS = new Set([
  'AA', 'AE', 'AH', 'AO', 'AW', 'AY',
  'EH', 'ER', 'EY',
  'IH', 'IY',
  'OW', 'OY',
  'UH', 'UW',
]);

export interface StressInfo {
  syllableCount: number;
  stressedSyllableIndex: number; // 0-based
}

/**
 * Look up the primary-stressed syllable index for a word using CMU dict.
 * Returns null if the word is not in the dictionary or has only one syllable.
 */
export function getExpectedStress(word: string): StressInfo | null {
  const clean = word
    .replace(/\s*\(.*?\)\s*/g, '')
    .toLowerCase()
    .trim();

  const entry = (dictionary as Record<string, string>)[clean];
  if (!entry) return null;

  const phonemes = entry.split(' ');
  let syllableCount = 0;
  let stressedSyllableIndex = 0;
  let foundPrimary = false;

  for (const phoneme of phonemes) {
    const marker = phoneme.slice(-1);
    const base = marker === '0' || marker === '1' || marker === '2'
      ? phoneme.slice(0, -1)
      : phoneme;

    if (VOWELS.has(base)) {
      if (marker === '1') {
        stressedSyllableIndex = syllableCount;
        foundPrimary = true;
      }
      syllableCount++;
    }
  }

  if (syllableCount < 2) return null; // monosyllabic — no stress distinction
  if (!foundPrimary) return null;     // no primary stress marker found

  return { syllableCount, stressedSyllableIndex };
}

/**
 * Given an array of dBFS metering samples collected during a recording,
 * detect which syllable window had the highest average energy.
 *
 * @param dbSamples  Array of dBFS values (−160 to 0), sampled at ~50ms intervals
 * @param syllableCount  Number of syllables in the target word (≥ 2)
 * @returns  Detected stressed syllable index (0-based)
 */
export function detectStressFromSamples(
  dbSamples: number[],
  syllableCount: number
): number {
  if (dbSamples.length === 0 || syllableCount < 2) return 0;

  // Convert dBFS to linear energy (must convert BEFORE averaging — dBFS is logarithmic)
  const linear = dbSamples.map((dB) => Math.pow(10, dB / 20));

  // Hysteresis-based silence trim to prevent flutter:
  // Onset threshold:  −35 dBFS (linear ~0.018) — "definitely speech"
  // Offset threshold: −40 dBFS (linear ~0.010) — "might still be speech"
  const ONSET  = Math.pow(10, -35 / 20);
  const OFFSET = Math.pow(10, -40 / 20);
  let start = 0;
  let end = linear.length - 1;
  while (start < linear.length && linear[start]! < ONSET) start++;
  while (end > start && linear[end]! < OFFSET) end--;

  const speech = linear.slice(start, end + 1);
  if (speech.length < syllableCount) return 0;

  // Split into N equal windows and find the one with highest average energy
  const windowSize = speech.length / syllableCount;
  let maxEnergy = -Infinity;
  let peakIndex = 0;

  for (let i = 0; i < syllableCount; i++) {
    const wStart = Math.floor(i * windowSize);
    const wEnd   = Math.min(Math.floor((i + 1) * windowSize), speech.length);
    const window = speech.slice(wStart, wEnd);
    const avg = window.reduce((sum, v) => sum + v, 0) / window.length;
    if (avg > maxEnergy) {
      maxEnergy = avg;
      peakIndex = i;
    }
  }

  return peakIndex;
}

/** Returns 100 if the detected syllable matches expected, 0 otherwise. */
export function scoreStress(detected: number, expected: number): number {
  return detected === expected ? 100 : 0;
}

/**
 * Parse the visual stress display parts from a caps-annotated word string.
 * e.g. 'reLAX' → { before: 're', stressed: 'lax', after: '' }
 *      'TAble' → { before: '', stressed: 'ta', after: 'ble' }
 *      'underSTAND' → { before: 'under', stressed: 'stand', after: '' }
 */
export function parseStressDisplay(word: string): {
  before: string;
  stressed: string;
  after: string;
} {
  const clean = word.replace(/\s*\(.*?\)\s*/g, '').trim();
  const match = clean.match(/^([a-z]*)([A-Z]+)([a-zA-Z]*)$/);
  if (!match) {
    return { before: '', stressed: clean.toLowerCase(), after: '' };
  }
  return {
    before:   match[1]!.toLowerCase(),
    stressed: match[2]!.toLowerCase(),
    after:    match[3]!.toLowerCase(),
  };
}
