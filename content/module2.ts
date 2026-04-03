import type { ChapterContent } from '@/types/content';

// ─── m2c1: Word Stress ────────────────────────────────────────────────────────

const m2c1: ChapterContent = {
  chapterId: 'm2c1',
  sections: [
    {
      kind: 'lesson',
      data: {
        id: 'm2c1-l1',
        title: 'Word Stress',
        paragraphs: [
          'Stress is an important part of speaking because it helps make speech clear and easy to understand. In English, some parts of words and sentences are spoken louder and stronger than others. This is called stress.',
          'Word stress means that one syllable in a word is pronounced louder, longer, and clearer than the others. Knowing the correct stress helps listeners understand the word easily.',
          'First syllable stress — the stress is on the first syllable: TAble (TA-ble), DOCtor (DOC-tor), TEAcher (TEA-cher).',
          'Second syllable stress — the stress is on the second syllable: beGIN (be-GIN), aBOUT (a-BOUT), reLAX (re-LAX).',
          'Third syllable stress — the stress is on the third syllable: un-der-STAND, in-ter-EST-ing, en-ter-TAIN.',
          'Variable stress — stress can change the meaning of the word. Tip: first syllable = noun, second syllable = verb. Examples: OBject (noun, a thing) vs. obJECT (verb, to disagree); PREsent (noun, a gift) vs. preSENT (verb, to give or show); CONduct (noun, behavior) vs. conDUCT (verb, to lead or organize).',
        ],
      },
    },
    {
      kind: 'activity',
      data: {
        id: 'm2c1-a',
        type: 'stress_mcq',
        title: 'Activity — Stress It Right (Part 1)',
        direction:
          'Listen to each word and select the syllable that carries the stress.',
        passThreshold: 0,
        items: [
          { kind: 'stress_choice', syllables: ['a', 'BOUT'],               correctIndex: 1 },
          { kind: 'stress_choice', syllables: ['DOC', 'tor'],              correctIndex: 0 },
          { kind: 'stress_choice', syllables: ['ob', 'JECT (verb)'],       correctIndex: 1 },
          { kind: 'stress_choice', syllables: ['TEA', 'cher'],             correctIndex: 0 },
          { kind: 'stress_choice', syllables: ['un', 'der', 'STAND'],      correctIndex: 2 },
          { kind: 'stress_choice', syllables: ['be', 'GIN'],               correctIndex: 1 },
          { kind: 'stress_choice', syllables: ['OB (noun)', 'ject'],       correctIndex: 0 },
          { kind: 'stress_choice', syllables: ['re', 'LAX'],               correctIndex: 1 },
          { kind: 'stress_choice', syllables: ['in', 'ter', 'EST', 'ing'], correctIndex: 2 },
          { kind: 'stress_choice', syllables: ['TA', 'ble'],               correctIndex: 0 },
        ],
      },
    },
    {
      kind: 'activity',
      data: {
        id: 'm2c1-b',
        type: 'stress_drill',
        title: 'Activity — Stress It Right (Part 2)',
        direction:
          'Record yourself pronouncing each word with the correct stress. You must reach 90% accuracy before moving to the next word.',
        passThreshold: 90,
        words: [
          'reLAX',
          'TAble',
          'interesting',
          'obJECT (verb)',
          'DOCtor',
          'underSTAND',
          'TEAcher',
          'aBOUT',
          'OBject (noun)',
          'beGIN',
        ],
      },
    },
  ],
};

// ─── m2c2: Sentence Intonation ────────────────────────────────────────────────

const m2c2: ChapterContent = {
  chapterId: 'm2c2',
  sections: [
    {
      kind: 'lesson',
      data: {
        id: 'm2c2-l1',
        title: 'Sentence Intonation',
        paragraphs: [
          'Intonation refers to the rise and falls of the voice when speaking. It helps express meaning, emotion, and intention. Using correct intonation makes speech clearer and more natural.',
          'Falling intonation (↘) — the voice goes down at the end of the sentence. It is used for statements, commands, and WH-questions. Examples: "I like English. ↘", "She is going to school. ↘", "Where are you going? ↘".',
          'Rising intonation (↗) — the voice goes up at the end of the sentence. It is used for yes/no questions. Examples: "Are you ready? ↗", "Do you like English? ↗", "Is she your friend? ↗".',
        ],
      },
    },
    {
      kind: 'activity',
      data: {
        id: 'm2c2-a',
        type: 'intonation_mcq',
        title: 'Activity — Say It with Intonation (Part 1)',
        direction:
          'Listen to each sentence and choose the correct intonation pattern.',
        passThreshold: 0,
        items: [
          { kind: 'intonation_choice', sentence: 'Do you like English?',     correctAnswer: 'rising'  },
          { kind: 'intonation_choice', sentence: 'I am studying English.',   correctAnswer: 'falling' },
          { kind: 'intonation_choice', sentence: 'Where are you going?',     correctAnswer: 'falling' },
          { kind: 'intonation_choice', sentence: 'Is she your friend?',      correctAnswer: 'rising'  },
          { kind: 'intonation_choice', sentence: 'We are learning today.',   correctAnswer: 'falling' },
          { kind: 'intonation_choice', sentence: 'Are you ready?',           correctAnswer: 'rising'  },
          { kind: 'intonation_choice', sentence: 'What is your name?',       correctAnswer: 'falling' },
          { kind: 'intonation_choice', sentence: 'I like watching movies.',  correctAnswer: 'falling' },
          { kind: 'intonation_choice', sentence: 'Do they play basketball?', correctAnswer: 'rising'  },
          { kind: 'intonation_choice', sentence: 'She is my best friend.',   correctAnswer: 'falling' },
        ],
      },
    },
    {
      kind: 'activity',
      data: {
        id: 'm2c2-b',
        type: 'intonation_drill',
        title: 'Activity — Say It with Intonation (Part 2)',
        direction:
          'Record yourself saying each sentence with the correct intonation. You must reach 90% accuracy.',
        passThreshold: 90,
        sentences: [
          'Are you ready?',
          'I am studying English.',
          'Where are you going?',
          'Do you like English?',
          'She is my best friend.',
        ],
      },
    },
  ],
};

// ─── m2c3: Vocabulary Development for Speaking ────────────────────────────────

const m2c3: ChapterContent = {
  chapterId: 'm2c3',
  sections: [
    {
      kind: 'lesson',
      data: {
        id: 'm2c3-l1',
        title: 'Lesson 1 — Common Expressions',
        paragraphs: [
          'Common expressions are words or phrases that people often use in everyday conversation. These expressions help speakers communicate their ideas clearly and naturally.',
          'Using common expressions makes speaking easier because you do not need to think too much about how to start your sentences. Instead, you can focus on what you want to say.',
        ],
        examples: [
          { text: '"I think English is important."',                                    explanation: 'Expresses a personal opinion' },
          { text: '"In my opinion, students should practice speaking every day."',     explanation: 'Shows personal point of view' },
          { text: '"I believe learning English can help in the future."',              explanation: 'Shows strong belief' },
          { text: '"For me, speaking is fun."',                                        explanation: 'Shows personal feeling' },
          { text: '"I feel that practice improves skills."',                           explanation: 'Expresses thoughts or feelings' },
        ],
      },
    },
    {
      kind: 'activity',
      data: {
        id: 'm2c3-a',
        type: 'pick_and_speak',
        title: 'Activity — Pick and Speak',
        direction:
          'Tap a card to reveal the question. Prepare your answer for 30–60 seconds, then speak using at least one common expression (e.g., "I think…", "In my opinion…", "I believe…"). Respond in 2–3 complete sentences.',
        passThreshold: 90,
        cueCards: [
          'What is your favorite hobby and why do you enjoy it?',
          'What do you usually do in your free time?',
          'What is something you really like (e.g., music, games, food), and why do you like it?',
        ],
        sentenceCount: { min: 2, max: 3 },
      },
    },
    {
      kind: 'lesson',
      data: {
        id: 'm2c3-l2',
        title: 'Lesson 2 — Sentence Starters',
        paragraphs: [
          'Sentence starters are words or phrases used to begin and organize sentences. They help speakers connect their ideas and make speaking clearer and more organized.',
          'Using sentence starters helps you speak more smoothly because you can easily continue your ideas.',
        ],
        examples: [
          { text: '"First, I study my lessons."',                              explanation: 'Shows the beginning' },
          { text: '"Next, I do my homework."',                                 explanation: 'Shows sequence' },
          { text: '"Also, I practice speaking English."',                     explanation: 'Adds another idea' },
          { text: '"Because it is important, I study English."',              explanation: 'Gives a reason' },
          { text: '"In conclusion, English helps us communicate."',           explanation: 'Ends or summarizes' },
        ],
      },
    },
    {
      kind: 'activity',
      data: {
        id: 'm2c3-b',
        type: 'sentence_sequencing',
        title: 'Activity — Organize Your Ideas',
        direction:
          'Listen to the audio model (up to 2 times), then arrange the shuffled sentences into the correct order and record yourself saying the complete passage.',
        passThreshold: 90,
        maxAudioPlays: 2,
        passages: [
          {
            id: 'p1',
            // Shuffled display order:
            sentences: [
              'Also, I review my lessons at night.',        // index 0
              'First, I listen carefully to my teacher.',   // index 1
              'Because I want to improve, I practice every day.', // index 2
              'Next, I take notes in my notebook.',         // index 3
            ],
            // Correct order: First(1) → Next(3) → Also(0) → Because(2)
            correctOrder: [1, 3, 0, 2],
          },
          {
            id: 'p2',
            // Shuffled display order:
            sentences: [
              'Also, I sometimes play online games with my friends to relax.',           // index 0
              'First, I make sure to finish all my schoolwork before doing anything else.', // index 1
              'Next, I watch videos or listen to music on my phone.',                    // index 2
              'Because these activities make me happy, I enjoy spending my free time doing them.', // index 3
            ],
            // Correct order: First(1) → Next(2) → Also(0) → Because(3)
            correctOrder: [1, 2, 0, 3],
          },
        ],
      },
    },
  ],
};

// ─── Export ───────────────────────────────────────────────────────────────────

export const module2Content: ChapterContent[] = [m2c1, m2c2, m2c3];
