import { dictionary } from 'cmu-pronouncing-dictionary';
import type { ErrorCategory } from '@/lib/assessment-config';

// ── ARPAbet → human-friendly label ───────────────────────────────────────────

export const PHONEME_LABELS: Record<string, string> = {
  // Vowels
  IH:  'short i (as in "sit")',
  IY:  'long ee (as in "see")',
  EH:  'short e (as in "bed")',
  EY:  'long a (as in "say")',
  AE:  'short a (as in "cat")',
  AA:  'ah sound (as in "father")',
  AH:  'short u (as in "cup")',
  UH:  'oo sound (as in "book")',
  UW:  'long oo (as in "food")',
  AO:  'aw sound (as in "law")',
  OW:  'long o (as in "go")',
  AW:  'ow sound (as in "cow")',
  AY:  'long i (as in "my")',
  OY:  'oi sound (as in "boy")',
  ER:  'er sound (as in "bird")',
  // Consonants
  SH:  'sh sound (as in "ship")',
  ZH:  'zh sound (as in "measure")',
  TH:  'voiceless th (as in "think")',
  DH:  'voiced th (as in "the")',
  CH:  'ch sound (as in "church")',
  JH:  'j sound (as in "judge")',
  NG:  'ng sound (as in "sing")',
  V:   'v sound (as in "very")',
  F:   'f sound (as in "fish")',
  B:   'b sound (as in "bat")',
  P:   'p sound (as in "pat")',
  Z:   'z sound (as in "zoo")',
  S:   's sound (as in "sun")',
  R:   'r sound (as in "red")',
  L:   'l sound (as in "let")',
};

// Vowel phonemes (for detecting vowel vs consonant errors)
const VOWELS = new Set(['IH','IY','EH','EY','AE','AA','AH','UH','UW','AO','OW','AW','AY','OY','ER']);

// ── Articulatory tips ─────────────────────────────────────────────────────────

export const VOWEL_TIPS: Record<string, string> = {
  IH:  'Keep your mouth slightly open and your tongue in the middle of your mouth.',
  IY:  'Spread your lips slightly as if smiling and raise your tongue toward the roof of your mouth.',
  EH:  'Drop your jaw slightly and keep your tongue relaxed in the middle.',
  EY:  'Start with your mouth slightly open, then close it gently as the sound ends.',
  AE:  'Open your mouth wider and push your tongue forward and down.',
  AA:  'Open your mouth wide and relax your tongue flat at the bottom.',
  AH:  'Relax your jaw and tongue completely — this is a neutral, unstressed sound.',
  UH:  'Round your lips slightly and keep your tongue in the back of your mouth.',
  UW:  'Round your lips into a tight circle and push your tongue toward the back.',
  AO:  'Round your lips slightly and drop your jaw.',
  OW:  'Start with lips slightly open, then round them as the sound ends.',
  AW:  'Open your mouth wide, then round your lips at the end.',
  AY:  'Start with your mouth open, then move your tongue up toward the roof.',
};

export const CONSONANT_TIPS: Record<string, string> = {
  TH:  'Place the tip of your tongue lightly between your upper and lower teeth and blow air out gently.',
  DH:  'Place the tip of your tongue between your teeth and vibrate your vocal cords as you push air out.',
  V:   'Lightly bite your lower lip with your upper teeth and vibrate your vocal cords.',
  F:   'Lightly bite your lower lip with your upper teeth and blow air out without vibrating.',
  R:   'Curl the tip of your tongue slightly back without touching the roof of your mouth.',
  L:   'Press the tip of your tongue against the ridge behind your upper front teeth.',
  SH:  'Round your lips slightly and push air through a wide channel between your tongue and palate.',
  CH:  'Start with your tongue touching the roof of your mouth, then release with a burst of air.',
  JH:  'Start with your tongue touching the roof of your mouth, then release while vibrating your vocal cords.',
  NG:  'Press the back of your tongue against your soft palate and let air flow through your nose.',
  Z:   'Keep your tongue in the same position as S, but vibrate your vocal cords.',
  S:   'Place the tip of your tongue close to the ridge behind your upper teeth and push air through.',
  P:   'Press both lips together firmly, then release with a small burst of air.',
  B:   'Press both lips together firmly, vibrate your vocal cords, then release.',
};

// ── Phoneme helpers ──────────────────────────────────────────────────────────

export function getPhonemes(word: string): string[] | null {
  const entry = (dictionary as Record<string, string>)[word.toLowerCase()];
  if (!entry) return null;
  return entry.split(' ').map((p: string) => p.replace(/[012]$/, ''));
}

/** Get articulatory tip for a specific phoneme. Checks vowels first, then consonants. */
export function getArticulatoryTip(phoneme: string): string | null {
  return VOWEL_TIPS[phoneme] ?? CONSONANT_TIPS[phoneme] ?? null;
}

// ── Phoneme diff (transcript vs reference) ───────────────────────────────────

export interface PhonemeDiff {
  refPhonemes: string[];
  recPhonemes: string[];
  firstDiffIndex: number;
  refLabel: string;
  recLabel: string;
  isVowelError: boolean;
}

export function getPhonemeDiff(
  transcriptWord: string,
  referenceWord: string,
): PhonemeDiff | null {
  const refPh = getPhonemes(referenceWord);
  const recPh = getPhonemes(transcriptWord);
  if (!refPh || !recPh) return null;

  const len = Math.min(refPh.length, recPh.length);
  let firstDiff = -1;
  for (let i = 0; i < len; i++) {
    if (refPh[i] !== recPh[i]) { firstDiff = i; break; }
  }
  if (firstDiff === -1 && refPh.length !== recPh.length) firstDiff = len;
  if (firstDiff === -1) return null;

  const refP = refPh[firstDiff] ?? '';
  const recP = recPh[firstDiff] ?? '';

  return {
    refPhonemes: refPh,
    recPhonemes: recPh,
    firstDiffIndex: firstDiff,
    refLabel: PHONEME_LABELS[refP] ?? refP,
    recLabel: PHONEME_LABELS[recP] ?? recP,
    isVowelError: VOWELS.has(refP) || VOWELS.has(recP),
  };
}

// ── Minimal pair contrast (word A vs word B — both references) ───────────────

export interface PhonemeContrast {
  index: number;
  phonemeA: string;
  phonemeB: string;
  labelA: string;
  labelB: string;
  isVowel: boolean;
}

/** Get ALL differing phoneme positions between two reference words. */
export function getMinimalPairContrast(wordA: string, wordB: string): PhonemeContrast[] {
  const phA = getPhonemes(wordA);
  const phB = getPhonemes(wordB);
  if (!phA || !phB) return [];

  const contrasts: PhonemeContrast[] = [];
  const len = Math.max(phA.length, phB.length);
  for (let i = 0; i < len; i++) {
    const a = phA[i] ?? '';
    const b = phB[i] ?? '';
    if (a !== b) {
      contrasts.push({
        index: i,
        phonemeA: a,
        phonemeB: b,
        labelA: PHONEME_LABELS[a] ?? a,
        labelB: PHONEME_LABELS[b] ?? b,
        isVowel: VOWELS.has(a) || VOWELS.has(b),
      });
    }
  }
  return contrasts;
}

// ── Legacy improvement tip (used when no MinimalPairFeedback available) ───────

export function getImprovementTip(
  errors: ErrorCategory[],
  diff: PhonemeDiff | null,
  referenceWord: string,
): string {
  if (errors.length === 0) return '';

  if (errors.includes('omission')) {
    return `Say the complete word "${referenceWord}" — pronounce every sound from start to finish.`;
  }
  if (errors.includes('redundancy')) {
    return `Say only "${referenceWord}" — one clear word, nothing before or after.`;
  }
  if (errors.includes('pronunciation') && diff) {
    const phoneme = diff.refPhonemes[diff.firstDiffIndex] ?? '';
    const tip = getArticulatoryTip(phoneme);
    if (diff.isVowelError && tip) {
      return `The vowel in "${referenceWord}" is the ${diff.refLabel}. ${tip}`;
    }
    if (tip) {
      return `The ${diff.refLabel} in "${referenceWord}": ${tip}`;
    }
    return `Focus on the ${diff.refLabel} in "${referenceWord}" — say it slowly and feel your mouth position for that sound.`;
  }
  if (errors.includes('pronunciation')) {
    return `Say "${referenceWord}" slowly, one sound at a time. Focus on making each sound clear and distinct.`;
  }
  return '';
}
