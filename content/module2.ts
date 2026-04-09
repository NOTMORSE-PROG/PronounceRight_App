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
          'In English, one syllable in a word is spoken louder and longer than the others — this is called word stress. Correct stress makes you easier to understand.',
        ],
        examples: [
          { text: '1st syllable — TAble, DOCtor, TEAcher',       explanation: 'Stress falls on the first syllable',  speakText: 'table, doctor, teacher' },
          { text: '2nd syllable — beGIN, aBOUT, reLAX',          explanation: 'Stress falls on the second syllable', speakText: 'begin, about, relax' },
          { text: '3rd syllable — underSTAND, interESTing, enterTAIN', explanation: 'Stress falls on the third syllable', speakText: 'understand, interesting, entertain' },
          { text: 'OBject (noun)  vs.  obJECT (verb)',           explanation: 'Variable stress changes the word\'s meaning — 1st syllable = noun, 2nd = verb', speakText: 'object. object.' },
          { text: 'PREsent (noun)  vs.  preSENT (verb)',         explanation: 'Variable stress changes the word\'s meaning', speakText: 'present. present.' },
          { text: 'CONduct (noun)  vs.  conDUCT (verb)',         explanation: 'Variable stress changes the word\'s meaning', speakText: 'conduct. conduct.' },
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
          'Intonation is how your voice rises and falls when speaking. It tells listeners what kind of sentence you are saying.',
        ],
        examples: [
          { text: 'Falling ↘ — "I like English." / "Where are you going?"', explanation: 'Used for statements, commands, and WH-questions', speakText: 'I like English. Where are you going?' },
          { text: 'Rising ↗ — "Are you ready?" / "Do you like English?"',    explanation: 'Used for yes/no questions',                       speakText: 'Are you ready? Do you like English?' },
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
        expectedIntonations: ['rising', 'falling', 'falling', 'rising', 'falling'],
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
          'Common expressions are phrases people use to share opinions and ideas naturally. Using them lets you focus on what you want to say instead of how to start.',
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
          {
            question: 'What is your favorite hobby and why do you enjoy it?',
            keyPhrases: [
              'I think my favorite hobby is ___',
              'I enjoy it because ___',
              'For me, ___ is relaxing / fun',
            ],
            modelAnswer:
              'I think my favorite hobby is reading books. I enjoy it because I can learn new things and imagine different places. For me, reading is both relaxing and fun.',
            topicKeywords: ['hobby', 'enjoy', 'like', 'play', 'sport', 'activity', 'fun', 'weekend', 'free time', 'favorite'],
            backgroundImage: require('../assets/images/m2c3/card-1.png'),
          },
          {
            question: 'What do you usually do in your free time?',
            keyPhrases: [
              'I usually ___ in my free time',
              'I enjoy doing this because ___',
              'I believe this is a good way to ___',
            ],
            modelAnswer:
              'I usually watch videos and listen to music in my free time. I enjoy doing these things because they help me relax after school. I think free time is very important for everyone.',
            topicKeywords: ['free time', 'usually', 'relax', 'watch', 'read', 'play', 'listen', 'spend', 'time', 'home'],
            backgroundImage: require('../assets/images/m2c3/card-2.png'),
          },
          {
            question: 'What is something you really like, and why do you like it?',
            keyPhrases: [
              'Something I really like is ___',
              'I think ___ makes me feel ___',
              'I believe ___ is important because ___',
            ],
            modelAnswer:
              'I really like listening to music. I think music makes me feel happy and calm, especially after a hard day. For me, music is one of the best things in life.',
            topicKeywords: ['like', 'love', 'enjoy', 'music', 'games', 'food', 'movie', 'book', 'sport', 'favorite', 'really'],
            backgroundImage: require('../assets/images/m2c3/card-3.png'),
          },
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
          'Sentence starters are words that begin and connect your ideas, helping you speak in a clear and organized way.',
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
