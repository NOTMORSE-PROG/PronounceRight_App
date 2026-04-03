export interface WordOfTheDayEntry {
  id: string;
  word: string;
  ipa: string;
  partOfSpeech: string;
  definition: string;
  exampleSentence: string;
  pronunciationTip: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}
