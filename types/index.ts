// ─── User / Auth ──────────────────────────────────────────────────────────────

export interface Student {
  id: string;
  username: string;
  fullName: string;
  classId?: string;
  className?: string;
  avatarSeed: string;
  createdAt: string;
}

export type AuthUser = Student;

// ─── Module / Chapter ─────────────────────────────────────────────────────────

export interface Module {
  id: string;
  number: number;
  title: string;
  description: string;
  chapters: Chapter[];
}

export interface Chapter {
  id: string;
  moduleId: string;
  number: number;
  title: string;
  skillFocus: string;
  activityName: string;
  activityDescription: string;
}

// ─── Progress ─────────────────────────────────────────────────────────────────

export interface ChapterProgress {
  chapterId: string;
  attempts: number;
  bestScore: number | null;
  completed: boolean;
  completedAt: string | null;
}

export interface StudentProgress {
  totalPoints: number;
  streak: number;
  moduleProgress: ModuleProgress[];
}

export interface ModuleProgress {
  moduleId: string;
  moduleNumber: number;
  chaptersCompleted: number;
  totalChapters: number;
  averageScore: number;
  isComplete: boolean;
}

// ─── Badges ───────────────────────────────────────────────────────────────────

export type BadgeType =
  | 'first_word'
  | 'clear_voice'
  | 'perfect_lesson'
  | 'sentence_starter'
  | 'fluent_flow'
  | 'no_replays'
  | 'streak_7'
  | 'streak_30'
  | 'module_1_complete'
  | 'module_2_complete'
  | 'pronounceright_master';

export interface Badge {
  type: BadgeType;
  label: string;
  description: string;
  icon: string;
  earnedAt: string | null;
}

export const ALL_BADGES: Omit<Badge, 'earnedAt'>[] = [
  {
    type: 'first_word',
    label: 'First Word',
    description: 'Completed your very first pronunciation attempt.',
    icon: '🎤',
  },
  {
    type: 'clear_voice',
    label: 'Clear Voice',
    description: 'Scored 80% or above on a single word lesson.',
    icon: '🔊',
  },
  {
    type: 'perfect_lesson',
    label: 'Perfect Lesson',
    description: 'Completed a full chapter without any errors.',
    icon: '⭐',
  },
  {
    type: 'sentence_starter',
    label: 'Sentence Starter',
    description: 'Started your first sentence-level lesson.',
    icon: '📝',
  },
  {
    type: 'fluent_flow',
    label: 'Fluent Flow',
    description: 'Finished Module 2 with 75%+ average accuracy.',
    icon: '🌊',
  },
  {
    type: 'no_replays',
    label: 'No Replays Needed',
    description: 'Passed a full lesson on your first attempt.',
    icon: '🎯',
  },
  {
    type: 'streak_7',
    label: 'Streak: 7 Days',
    description: 'Practiced for 7 consecutive days.',
    icon: '🔥',
  },
  {
    type: 'streak_30',
    label: 'Streak: 30 Days',
    description: 'Practiced for 30 consecutive days.',
    icon: '💎',
  },
  {
    type: 'module_1_complete',
    label: 'Module 1 Complete',
    description: 'Finished all chapters in Word-Level Pronunciation.',
    icon: '🏅',
  },
  {
    type: 'module_2_complete',
    label: 'Module 2 Complete',
    description: 'Finished all chapters in Sentence-Level Pronunciation.',
    icon: '🥈',
  },
  {
    type: 'pronounceright_master',
    label: 'SpeakRight Master',
    description: 'Completed all modules with 85%+ average accuracy.',
    icon: '🏆',
  },
];

// ─── Static Content ──────────────────────────────────────────────────────────

export const MODULES_DATA: Omit<Module, 'id'>[] = [
  {
    number: 1,
    title: 'Word-Level Pronunciation',
    description: 'Master individual sounds, word stress, and common pronunciation challenges.',
    chapters: [
      {
        id: 'm1c1',
        moduleId: 'm1',
        number: 1,
        title: 'Phonemes and Basic Sounds',
        skillFocus: 'Vowels and Consonants',
        activityName: 'Minimal Pair Challenge',
        activityDescription:
          'Listen to similar-sounding word pairs (e.g., ship/sheep, bit/beat) and identify the differences. Then record yourself and compare with the model.',
      },
      {
        id: 'm1c2',
        moduleId: 'm1',
        number: 2,
        title: 'Word Stress and Syllable Emphasis',
        skillFocus: 'Minimal Pairs',
        activityName: 'Word Stress Analysis',
        activityDescription:
          'Identify the stressed syllable in multi-syllabic words. Record yourself and receive feedback on accuracy.',
      },
      {
        id: 'm1c3',
        moduleId: 'm1',
        number: 3,
        title: 'Common Pronunciation Challenges',
        skillFocus: 'Silent Letters, Blends, Endings',
        activityName: 'Error Correction Task',
        activityDescription:
          'Listen to incorrectly pronounced words and correct them. Practice words with silent letters and different endings.',
      },
    ],
  },
  {
    number: 2,
    title: 'Sentence-Level Pronunciation',
    description: 'Develop rhythm, intonation, and natural connected speech patterns.',
    chapters: [
      {
        id: 'm2c1',
        moduleId: 'm2',
        number: 1,
        title: 'Sentence Stress and Rhythm',
        skillFocus: 'Stress Patterns',
        activityName: 'Sentence Emphasis Practice',
        activityDescription:
          'Listen to sentences and identify which words are stressed. Record yourself reading with correct rhythm and emphasis using tongue twisters.',
      },
      {
        id: 'm2c2',
        moduleId: 'm2',
        number: 2,
        title: 'Intonation Patterns',
        skillFocus: 'Rising and Falling Tones',
        activityName: 'Meaning Through Intonation',
        activityDescription:
          'Practice how intonation changes meaning (statements vs. questions). Record and compare different versions of the same sentence.',
      },
      {
        id: 'm2c3',
        moduleId: 'm2',
        number: 3,
        title: 'Connected Speech',
        skillFocus: 'Linking, Contractions, Reductions',
        activityName: 'Natural Speech Practice',
        activityDescription:
          'Transform formal sentences into natural spoken forms (e.g., "going to" → "gonna") and practice delivering them smoothly in short dialogues.',
      },
    ],
  },
  {
    number: 3,
    title: 'Guided Speaking Practice',
    description: 'Build confidence through structured speaking tasks and real-life dialogues.',
    chapters: [
      {
        id: 'm3c1',
        moduleId: 'm3',
        number: 1,
        title: 'Controlled Speaking',
        skillFocus: 'Reading Aloud with Guidance',
        activityName: 'Guided Reading Recording',
        activityDescription:
          'Read short academic or conversational passages aloud and receive feedback on pronunciation, pacing, and clarity.',
      },
      {
        id: 'm3c2',
        moduleId: 'm3',
        number: 2,
        title: 'Guided Responses',
        skillFocus: 'Answering Structured Questions',
        activityName: 'Opinion Builder',
        activityDescription:
          'Respond to questions (e.g., "Do you agree or disagree?") using guide phrases. Focus is on clarity, pronunciation, and complete responses.',
      },
      {
        id: 'm3c3',
        moduleId: 'm3',
        number: 3,
        title: 'Semi-Guided Dialogues',
        skillFocus: 'Role-Play with Prompts',
        activityName: 'Situational Role-Play',
        activityDescription:
          'Participate in real-life scenarios (e.g., job interview, school presentation, asking for help) using prompts, then record your responses.',
      },
    ],
  },
];
