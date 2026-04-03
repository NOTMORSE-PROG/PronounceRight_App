import { dictionary } from 'cmu-pronouncing-dictionary';

function getPhonemes(word: string): string[] | null {
  const entry = (dictionary as Record<string, string>)[word.toUpperCase()];
  if (!entry) return null;
  // Strip stress markers (0/1/2) for phoneme-only comparison
  return entry.split(' ').map((p: string) => p.replace(/[012]$/, ''));
}

function levenshtein(a: string[], b: string[]): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i]![j] = a[i - 1] === b[j - 1]
        ? dp[i - 1]![j - 1]!
        : 1 + Math.min(dp[i - 1]![j]!, dp[i]![j - 1]!, dp[i - 1]![j - 1]!);
    }
  }
  return dp[m]![n]!;
}

export function phonemeAccuracyScore(recognized: string, reference: string): number {
  const refPh = getPhonemes(reference);
  const recPh = getPhonemes(recognized);

  if (!refPh) {
    // Reference word not in CMUdict — fall back to exact string match
    return recognized.toLowerCase() === reference.toLowerCase() ? 100 : 0;
  }
  if (!recPh) {
    // Recognized word not in CMUdict — compute char-level similarity as fallback
    const r = recognized.toLowerCase();
    const ref = reference.toLowerCase();
    if (r === ref) return 100;
    // Simple longest-common-subsequence character ratio
    const maxLen = Math.max(r.length, ref.length);
    let matches = 0;
    const refChars = ref.split('');
    const rChars = r.split('');
    for (const ch of rChars) {
      const idx = refChars.indexOf(ch);
      if (idx !== -1) { matches++; refChars.splice(idx, 1); }
    }
    return Math.max(0, Math.round((matches / maxLen) * 100));
  }

  const dist = levenshtein(recPh, refPh);
  return Math.max(0, Math.round((1 - dist / refPh.length) * 100));
}
