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

export interface WordArrangementItem {
  id: string;
  words: string[];        // displayed in shuffled order
  correctSentence: string; // correct sentence text (for TTS + display)
  correctOrder: number[]; // indices into words[] for correct sentence
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
  expectedIntonations: ('rising' | 'falling')[];
}

export interface PickAndSpeakCueCard {
  question: string;
  keyPhrases: string[];    // shown during prep time only
  modelAnswer: string;     // example answer shown post-recording with speaker button
  topicKeywords: string[]; // for content relevance scoring
  backgroundImage?: number; // optional local image asset (require() result)
}

export interface PickAndSpeakActivity extends BaseActivity {
  type: 'pick_and_speak';
  cueCards: PickAndSpeakCueCard[];
  sentenceCount: { min: number; max: number };
}

export interface WordArrangementActivity extends BaseActivity {
  type: 'word_arrangement';
  items: WordArrangementItem[];
}

export interface OpinionBuilderPrompt {
  id: string;
  template: string;       // "I think school is ______ because ______."
  keywords: string[];     // keywords to check in transcription for completion
}

export interface OpinionBuilderActivity extends BaseActivity {
  type: 'opinion_builder';
  prompts: OpinionBuilderPrompt[];
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

export interface SentenceCompletionItem {
  id: string;
  template: string;       // "I ______ a sandwich for breakfast."
  choices: string[];      // ["eat", "eats", "eating"]
  correctIndex: number;   // 0
  fullSentence: string;   // "I eat a sandwich for breakfast."
  keywords: string[];     // keywords for transcription check
}

export interface SentenceCompletionActivity extends BaseActivity {
  type: 'sentence_completion';
  items: SentenceCompletionItem[];
}

export interface VideoRolePlayStep {
  id: string;
  /** Key into the video registry (maps to a static require() asset) */
  videoKey: string;
  /** Short label shown above the video, e.g. "Caller says:" */
  label: string;
  /** Whether the student records a spoken response after watching */
  requiresResponse: boolean;
  /** Hint shown during the recording phase */
  responseHint?: string;
  /** If set, auto-detect the branch from the student's transcript after recording */
  branches?: { label: string; nextStepId: string; keywords?: string[] }[];
  /** For linear flow: the next step's id (omitted on terminal steps) */
  nextStepId?: string;
}

export interface VideoRolePlayScenario {
  id: string;
  title: string;
  description: string;
  entryStepId: string;
  steps: VideoRolePlayStep[];
}

export interface VideoRolePlayActivity extends BaseActivity {
  type: 'video_role_play';
  scenarios: VideoRolePlayScenario[];
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
  | SentenceSequencingActivity
  | WordArrangementActivity
  | OpinionBuilderActivity
  | SentenceCompletionActivity
  | VideoRolePlayActivity;

// ─── Lesson Types ──────────────────────────────────────────────────────────────

export interface LessonExample {
  text: string;
  explanation: string;
  speakText?: string; // exact text for TTS; falls back to stripped text when absent
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
