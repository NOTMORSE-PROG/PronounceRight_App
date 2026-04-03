import {
  getMinimalPairContrast,
  getArticulatoryTip,
  PHONEME_LABELS,
} from './phoneme-tips';

export interface MinimalPairFeedback {
  scoreExplanation: string;
  contrastExplanation: string;
  articulatoryTip: string;
  encouragement: string;
}

export function generateMinimalPairFeedback(
  targetWord: string,
  pairWord: string,
  score: number,
  transcript: string,
  confusedWithPairWord: boolean,
  hallucination: boolean,
  passed: boolean,
): MinimalPairFeedback {
  // Find the key phoneme contrast between the two words
  const contrasts = getMinimalPairContrast(targetWord, pairWord);
  const primary = contrasts[0]; // the first (usually main) phoneme difference

  const targetLabel = primary ? (PHONEME_LABELS[primary.phonemeA] ?? primary.phonemeA) : '';
  const pairLabel = primary ? (PHONEME_LABELS[primary.phonemeB] ?? primary.phonemeB) : '';

  // ── Score explanation ─────────────────────────────────────────────────────

  let scoreExplanation: string;
  if (hallucination) {
    scoreExplanation = 'What you said didn\'t match either word clearly. Make sure to speak directly into the microphone.';
  } else if (passed) {
    scoreExplanation = `You scored ${score}% — your pronunciation of "${targetWord}" was clear and accurate.`;
  } else if (confusedWithPairWord) {
    scoreExplanation = primary
      ? `Your score was ${score}% because it sounded like "${pairWord}" instead of "${targetWord}". The key difference is the ${targetLabel}.`
      : `Your score was ${score}% because it sounded like "${pairWord}" instead of "${targetWord}".`;
  } else {
    scoreExplanation = primary
      ? `Your score was ${score}%. The ${targetLabel} in "${targetWord}" needs adjustment.`
      : `Your score was ${score}%. The pronunciation of "${targetWord}" needs more practice.`;
  }

  // ── Contrast explanation ──────────────────────────────────────────────────

  let contrastExplanation: string;
  if (primary) {
    contrastExplanation = `"${targetWord}" uses the ${targetLabel} while "${pairWord}" uses the ${pairLabel}. This sound is the key difference between the two words.`;
  } else {
    contrastExplanation = `"${targetWord}" and "${pairWord}" differ in a subtle way. Listen carefully to both.`;
  }

  // ── Articulatory tip ──────────────────────────────────────────────────────

  let articulatoryTip: string;
  if (primary) {
    const tip = getArticulatoryTip(primary.phonemeA);
    articulatoryTip = tip
      ? `For the ${targetLabel}: ${tip}`
      : `Focus on producing the ${targetLabel} distinctly.`;
  } else {
    articulatoryTip = 'Listen carefully to the target word and try to match each sound exactly.';
  }

  // ── Encouragement (score-banded) ──────────────────────────────────────────

  let encouragement: string;
  if (passed) {
    encouragement = `Great job! You clearly distinguished "${targetWord}" from "${pairWord}".`;
  } else if (score < 30) {
    encouragement = primary
      ? `Don't worry — this is a tricky contrast. Try saying "${targetWord}" slowly, focusing on the ${targetLabel}.`
      : `Don't worry — try saying "${targetWord}" slowly and clearly.`;
  } else if (score < 60) {
    encouragement = primary
      ? `You're getting closer! Focus on making the ${targetLabel} distinct from the ${pairLabel}.`
      : `You're getting closer! Listen to "${targetWord}" again and try to match the sounds.`;
  } else {
    encouragement = primary
      ? `Almost there! Just a small adjustment to the ${targetLabel} will get you to 90%.`
      : `Almost there! A small adjustment to your pronunciation will get you to 90%.`;
  }

  return { scoreExplanation, contrastExplanation, articulatoryTip, encouragement };
}
