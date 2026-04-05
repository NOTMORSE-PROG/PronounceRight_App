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

/** Shorten an articulatory tip to ~first sentence for inline use. */
function shortTip(tip: string | null): string {
  if (!tip) return '';
  const dot = tip.indexOf('.');
  return dot > 0 ? tip.slice(0, dot + 1) : tip;
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
  const primary = contrasts[0];

  const targetLabel = primary ? (PHONEME_LABELS[primary.phonemeA] ?? primary.phonemeA) : '';
  const pairLabel = primary ? (PHONEME_LABELS[primary.phonemeB] ?? primary.phonemeB) : '';
  const tipA = primary ? getArticulatoryTip(primary.phonemeA) : null;
  const tipB = primary ? getArticulatoryTip(primary.phonemeB) : null;

  // ── Score explanation — references the actual phoneme difference ───────────

  let scoreExplanation: string;
  if (hallucination) {
    scoreExplanation = 'What you said didn\'t match either word clearly. Make sure to speak directly into the microphone.';
  } else if (passed) {
    scoreExplanation = primary
      ? `You scored ${score}% — your "${targetWord}" clearly used the correct ${targetLabel}.`
      : `You scored ${score}% — your pronunciation of "${targetWord}" was clear and accurate.`;
  } else if (confusedWithPairWord) {
    scoreExplanation = primary
      ? `Your score was ${score}% — you produced the ${pairLabel} instead of the ${targetLabel}. "${targetWord}" needs the ${targetLabel}.`
      : `Your score was ${score}% — it sounded like "${pairWord}" instead of "${targetWord}".`;
  } else {
    scoreExplanation = primary
      ? `Your score was ${score}% — the ${targetLabel} in "${targetWord}" wasn't quite right.`
      : `Your score was ${score}% — try saying "${targetWord}" more slowly and clearly.`;
  }

  // ── Contrast explanation — describes mouth movement differences ────────────

  let contrastExplanation: string;
  if (primary && tipA && tipB) {
    // Compose both articulatory tips inline for a rich explanation
    contrastExplanation = `"${targetWord}" uses the ${targetLabel}: ${shortTip(tipA)} "${pairWord}" uses the ${pairLabel}: ${shortTip(tipB)}`;
  } else if (primary) {
    contrastExplanation = `"${targetWord}" uses the ${targetLabel} while "${pairWord}" uses the ${pairLabel}. This sound difference is key — feel how your mouth position changes between them.`;
  } else {
    contrastExplanation = `"${targetWord}" and "${pairWord}" have a subtle sound difference. Say each word slowly and feel how your mouth position changes.`;
  }

  // ── Articulatory tip — concrete mouth/tongue/lip instruction ──────────────

  let articulatoryTip: string;
  if (primary && tipA) {
    articulatoryTip = `To say "${targetWord}" correctly: ${tipA}`;
  } else if (primary) {
    articulatoryTip = primary.isVowel
      ? `The vowel in "${targetWord}" is the ${targetLabel}. Open your mouth to the right position and hold the sound steady.`
      : `The ${targetLabel} in "${targetWord}" is a consonant. Focus on where your tongue and lips touch as you say it.`;
  } else {
    articulatoryTip = `Say "${targetWord}" slowly — exaggerate each sound and focus on your tongue and lip position.`;
  }

  // ── Encouragement — score-banded with phoneme context ─────────────────────

  let encouragement: string;
  if (passed) {
    encouragement = primary
      ? `Great job! You clearly produced "${targetWord}" with the correct ${targetLabel}.`
      : `Great job! You clearly distinguished "${targetWord}" from "${pairWord}".`;
  } else if (score === 0) {
    encouragement = `That recording didn't match "${targetWord}". Speak clearly and close to the microphone, then try again.`;
  } else if (confusedWithPairWord && score < 30) {
    encouragement = primary && tipA
      ? `It sounds like you said "${pairWord}" instead. To switch to "${targetWord}", change your ${targetLabel}: ${shortTip(tipA)}`
      : `It sounds like you said "${pairWord}" instead. Try to say "${targetWord}" more carefully, focusing on the first different sound.`;
  } else if (score < 30) {
    encouragement = primary && tipA
      ? `This is a tricky sound. Try saying "${targetWord}" very slowly: ${shortTip(tipA)}`
      : `Don't worry — try saying "${targetWord}" slowly and clearly, one sound at a time.`;
  } else if (score < 60) {
    encouragement = primary
      ? `You're getting closer! Focus on the ${targetLabel} — ${shortTip(tipA) || 'say it slowly and feel the difference'}.`
      : `You're getting closer! Try saying "${targetWord}" more slowly, focusing on each sound.`;
  } else {
    encouragement = primary
      ? `Almost there! Just a small adjustment to the ${targetLabel} and you'll pass.`
      : `Almost there! A small adjustment to your pronunciation will get you to 90%.`;
  }

  return { scoreExplanation, contrastExplanation, articulatoryTip, encouragement };
}
