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
  lastStep: number | null;
  lastAccessedAt: string | null;
}

export interface StudentProgress {
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
  | 'speakright_master';

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
    description: 'Finished all chapters in Foundations of Speaking.',
    icon: '🏅',
  },
  {
    type: 'module_2_complete',
    label: 'Module 2 Complete',
    description: 'Finished all chapters in Stress and Intonation.',
    icon: '🥈',
  },
  {
    type: 'speakright_master',
    label: 'PronounceRight Master',
    description: 'Completed all modules with 85%+ average accuracy.',
    icon: '🏆',
  },
];

// ─── Static Content ───────────────────────────────────────────────────────────

export const MODULES_DATA: Omit<Module, 'id'>[] = [
  {
    number: 1,
    title: 'Foundations of Speaking and Pronunciation',
    description: 'Build core skills in speaking, vowel and consonant sounds, and pronunciation through listening and recording activities.',
    chapters: [
      {
        id: 'm1c1',
        moduleId: 'm1',
        number: 1,
        title: 'Importance of Speaking and Introduction to Pronunciation',
        skillFocus: 'Speaking Fundamentals & Pronunciation',
        activityName: 'Correct It / Self-Introduction',
        activityDescription:
          'Identify correct and incorrect pronunciations of key vocabulary, then record a short self-introduction.',
      },
      {
        id: 'm1c2',
        moduleId: 'm1',
        number: 2,
        title: 'Pronunciation Development: Vowel and Consonant Sounds',
        skillFocus: 'Vowels, Consonants & Minimal Pairs',
        activityName: 'Say It Right / Minimal Pair Drills',
        activityDescription:
          'Classify words by vowel type, practice consonant sounds aloud, then complete minimal pair drills with 90% accuracy.',
      },
    ],
  },
  {
    number: 2,
    title: 'Stress, Intonation, and Vocabulary in Speaking',
    description: 'Develop word stress, sentence intonation, and vocabulary through targeted drills and expressive speaking tasks.',
    chapters: [
      {
        id: 'm2c1',
        moduleId: 'm2',
        number: 1,
        title: 'Word Stress',
        skillFocus: 'Syllable Stress Patterns',
        activityName: 'Stress It Right',
        activityDescription:
          'Identify the stressed syllable in words via multiple choice, then record yourself pronouncing each word with correct stress.',
      },
      {
        id: 'm2c2',
        moduleId: 'm2',
        number: 2,
        title: 'Sentence Intonation',
        skillFocus: 'Rising and Falling Intonation',
        activityName: 'Say It with Intonation',
        activityDescription:
          'Identify rising or falling intonation for each sentence, then record yourself using correct intonation patterns.',
      },
      {
        id: 'm2c3',
        moduleId: 'm2',
        number: 3,
        title: 'Vocabulary Development for Speaking',
        skillFocus: 'Common Expressions & Sentence Starters',
        activityName: 'Pick and Speak / Organize Your Ideas',
        activityDescription:
          'Use common expressions to answer cue card questions, then arrange and record sentences in the correct sequence.',
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

// ─── Content type re-exports ──────────────────────────────────────────────────

export type {
  ChapterContent,
  ChapterSection,
  Lesson,
  LessonExample,
  Activity,
  ActivityItem,
} from './content';

export type { WordOfTheDayEntry } from './word-of-the-day';
