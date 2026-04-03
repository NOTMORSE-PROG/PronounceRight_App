// ─── Activity Item Types ───────────────────────────────────────────────────────

export interface IdentifyPronunciationItem {
  kind: 'identify_pronunciation';
  word: string;
}

export interface VowelSoundItem {
  kind: 'vowel_sound';
  word: string;
  ipa: string;
  vowelType: 'short' | 'long';
}

export interface ConsonantDrillItem {
  kind: 'consonant_drill';
  word: string;
  ipa: string;
}

export interface MinimalPairItem {
  kind: 'minimal_pair';
  wordA: string;
  ipaA: string;
  wordB: string;
  ipaB: string;
}

export interface StressChoiceItem {
  kind: 'stress_choice';
  syllables: string[];
  correctIndex: number;
}

export interface IntonationChoiceItem {
  kind: 'intonation_choice';
  sentence: string;
  correctAnswer: 'rising' | 'falling';
}

export type ActivityItem =
  | IdentifyPronunciationItem
  | VowelSoundItem
  | ConsonantDrillItem
  | MinimalPairItem
  | StressChoiceItem
  | IntonationChoiceItem;

// ─── Activity Types ────────────────────────────────────────────────────────────

export interface BaseActivity {
  id: string;
  title: string;
  direction: string;
  passThreshold: number; // 90 for graded, 0 for ungraded/awareness
}

export interface IdentifyPronunciationActivity extends BaseActivity {
  type: 'identify_pronunciation';
  items: IdentifyPronunciationItem[];
}

export interface FreeSpeechRecordingActivity extends BaseActivity {
  type: 'free_speech_recording';
  promptText: string;
  sentenceCount: { min: number; max: number };
}

export interface VowelIdentificationActivity extends BaseActivity {
  type: 'vowel_identification';
  items: VowelSoundItem[];
}

export interface ConsonantDrillActivity extends BaseActivity {
  type: 'consonant_drill';
  items: ConsonantDrillItem[];
}

export interface MinimalPairDrillActivity extends BaseActivity {
  type: 'minimal_pair_drill';
  items: MinimalPairItem[];
}

export interface StressMcqActivity extends BaseActivity {
  type: 'stress_mcq';
  items: StressChoiceItem[];
}

export interface StressDrillActivity extends BaseActivity {
  type: 'stress_drill';
  words: string[];
}

export interface IntonationMcqActivity extends BaseActivity {
  type: 'intonation_mcq';
  items: IntonationChoiceItem[];
}

export interface IntonationDrillActivity extends BaseActivity {
  type: 'intonation_drill';
  sentences: string[];
}

export interface PickAndSpeakActivity extends BaseActivity {
  type: 'pick_and_speak';
  cueCards: string[];
  sentenceCount: { min: number; max: number };
}

export interface SentenceSequencingPassage {
  id: string;
  sentences: string[];    // displayed in this order (pre-shuffled)
  correctOrder: number[]; // indices into sentences[] for correct sequence
}

export interface SentenceSequencingActivity extends BaseActivity {
  type: 'sentence_sequencing';
  passages: SentenceSequencingPassage[];
  maxAudioPlays: number;
}

export type Activity =
  | IdentifyPronunciationActivity
  | FreeSpeechRecordingActivity
  | VowelIdentificationActivity
  | ConsonantDrillActivity
  | MinimalPairDrillActivity
  | StressMcqActivity
  | StressDrillActivity
  | IntonationMcqActivity
  | IntonationDrillActivity
  | PickAndSpeakActivity
  | SentenceSequencingActivity;

// ─── Lesson Types ──────────────────────────────────────────────────────────────

export interface LessonExample {
  text: string;
  explanation: string;
}

export interface Lesson {
  id: string;
  title: string;
  paragraphs: string[];
  examples?: LessonExample[];
}

// ─── Chapter Content ───────────────────────────────────────────────────────────

export type ChapterSection =
  | { kind: 'lesson'; data: Lesson }
  | { kind: 'activity'; data: Activity };

export interface ChapterContent {
  chapterId: string;
  sections: ChapterSection[];
}
