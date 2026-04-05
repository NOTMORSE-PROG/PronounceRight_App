import type { ChapterContent } from '@/types/content';

// ─── m1c1: Importance of Speaking and Introduction to Pronunciation ───────────

const m1c1: ChapterContent = {
  chapterId: 'm1c1',
  sections: [
    {
      kind: 'lesson',
      data: {
        id: 'm1c1-l1',
        title: 'Lesson 1 — Speaking as a Fundamental Skill',
        paragraphs: [
          'Speaking is a fundamental skill that enables individuals to express ideas, share information, and interact with others effectively.',
        ],
        examples: [
          {
            text: '🏫 In the Classroom',
            explanation: 'Recitations, oral reports, and group activities — speaking clearly helps you participate and be understood.',
          },
          {
            text: '💼 In the Workplace',
            explanation: 'Meetings, presentations, and client calls — confident speech builds credibility and gets ideas across.',
          },
          {
            text: '🤝 In Everyday Life',
            explanation: 'Conversations, asking for help, meeting people — regular practice builds confidence over time.',
          },
        ],
      },
    },
    {
      kind: 'lesson',
      data: {
        id: 'm1c1-l2',
        title: 'Lesson 2 — What is Pronunciation?',
        paragraphs: [
          'Pronunciation refers to how a word is spoken — including its sounds, stress, tone, and rhythm.',
        ],
        examples: [
          {
            text: '🔊 Sounds — "ship" /ʃɪp/ vs "sheep" /ʃiːp/',
            explanation: 'One vowel sound changes the meaning entirely. Getting sounds right prevents misunderstanding.',
          },
          {
            text: '💬 Stress — "REcord" (noun) vs "reCORD" (verb)',
            explanation: 'Same word, different syllable stressed, different meaning.',
          },
          {
            text: '🎵 Tone & Rhythm',
            explanation: 'Shifting emphasis changes meaning: "I didn\'t say HE stole it" vs "I didn\'t say he STOLE it."',
          },
        ],
      },
    },
    {
      kind: 'activity',
      data: {
        id: 'm1c1-b',
        type: 'free_speech_recording',
        title: 'Activity B — Self-Introduction',
        direction:
          'Prepare and deliver a short self-introduction consisting of 3–5 sentences. Speak clearly and at a moderate pace, making sure to pronounce each word accurately.',
        passThreshold: 0,
        promptText:
          'Introduce yourself in 3–5 sentences. Include your name, where you are from, and something you enjoy.',
        sentenceCount: { min: 3, max: 5 },
      },
    },
  ],
};

// ─── m1c2: Pronunciation Development: Vowel and Consonant Sounds ──────────────

const m1c2: ChapterContent = {
  chapterId: 'm1c2',
  sections: [
    {
      kind: 'lesson',
      data: {
        id: 'm1c2-l1',
        title: 'What is a Phoneme?',
        paragraphs: [
          'A phoneme is the smallest unit of sound. English has 44 sounds but only 26 letters, so pronunciation must be learned by ear — not just read.',
        ],
        examples: [
          {
            text: '🔤 cat — /kæt/',
            explanation: 'Three phonemes: /k/, /æ/, /t/. Change any one and you get a different word — "bat," "cut," "cap."',
            speakText: 'cat',
          },
          {
            text: '📝 fish, phone, rough',
            explanation: 'All three have the /f/ sound but different spellings. This is why spelling alone cannot teach pronunciation.',
            speakText: 'fish, phone, rough',
          },
          {
            text: '🔢 44 sounds, 26 letters',
            explanation: 'English has almost twice as many sounds as letters — that is why some sounds share letters or use letter combinations.',
          },
        ],
      },
    },
    {
      kind: 'lesson',
      data: {
        id: 'm1c2-l2',
        title: 'Vowel Sounds',
        paragraphs: [
          'Vowels (A, E, I, O, U) flow freely — airflow is never blocked. Each vowel has a short sound (quick, clipped) and a long sound (held longer, "says its name").',
        ],
        examples: [
          {
            text: '🅰️ Basic vowels — at, ed, it, ox, up',
            explanation: 'These are the pure vowel sounds. Notice how your mouth stays open and relaxed for each one.',
            speakText: 'at, ed, it, ox, up',
          },
          {
            text: '🔵 Short vowels — cat, led, big, hop, rug',
            explanation: 'Quick, clipped sounds. The vowel is short and sharp — say "cat," feel how brief the /æ/ is.',
            speakText: 'cat, led, big, hop, rug',
          },
          {
            text: '🔴 Long vowels — paper, be, item, cold, unit',
            explanation: 'Held, stretched sounds that "say the letter\'s name." Say "paper" — the A says /eɪ/. Say "cold" — the O says /oʊ/.',
            speakText: 'paper, be, item, cold, unit',
          },
          {
            text: '⚠️ ship vs. sheep',
            explanation: 'One vowel length difference, two different words. "Ship" has a short /ɪ/, "sheep" holds the /iː/. Getting this wrong changes what you mean.',
            speakText: 'ship, sheep',
          },
        ],
      },
    },
    {
      kind: 'activity',
      data: {
        id: 'm1c2-a',
        type: 'vowel_identification',
        title: 'Activity — Say It Right',
        direction:
          'Identify whether each word contains a short or long vowel sound. Then practice saying each word clearly, focusing on correct pronunciation.',
        passThreshold: 0,
        items: [
          { kind: 'vowel_sound', word: 'Cat',   ipa: '/kæt/',   vowelType: 'short' },
          { kind: 'vowel_sound', word: 'Bed',   ipa: '/bɛd/',   vowelType: 'short' },
          { kind: 'vowel_sound', word: 'Sit',   ipa: '/sɪt/',   vowelType: 'short' },
          { kind: 'vowel_sound', word: 'Dog',   ipa: '/dɒg/',   vowelType: 'short' },
          { kind: 'vowel_sound', word: 'Sun',   ipa: '/sʌn/',   vowelType: 'short' },
          { kind: 'vowel_sound', word: 'Sheep', ipa: '/ʃiːp/',  vowelType: 'long'  },
          { kind: 'vowel_sound', word: 'Tree',  ipa: '/triː/',  vowelType: 'long'  },
          { kind: 'vowel_sound', word: 'Boat',  ipa: '/boʊt/',  vowelType: 'long'  },
          { kind: 'vowel_sound', word: 'Food',  ipa: '/fuːd/',  vowelType: 'long'  },
          { kind: 'vowel_sound', word: 'Name',  ipa: '/neɪm/',  vowelType: 'long'  },
        ],
      },
    },
    {
      kind: 'lesson',
      data: {
        id: 'm1c2-l3',
        title: 'Consonant Sounds',
        paragraphs: [
          'Consonants are produced when airflow is blocked or restricted by your tongue, teeth, or lips. Stop sounds burst air (/p/, /b/, /t/, /d/, /k/, /g/); fricatives squeeze air through a gap (/f/, /v/, /s/, /z/, /sh/).',
        ],
        examples: [
          {
            text: '💥 Stop sounds — pen, bat, top, dog, cat',
            explanation: 'Feel how your lips or tongue briefly blocks the air then releases it — the sound "pops" out.',
            speakText: 'pen, bat, top, dog, cat',
          },
          {
            text: '🌬️ Fricative sounds — fan, vine, ship, zebra',
            explanation: 'Air flows continuously through a narrow gap — your mouth never fully closes. Notice the hissing or buzzing quality.',
            speakText: 'fan, vine, ship, zebra',
          },
          {
            text: '🎯 Tip: fact vs. fat',
            explanation: 'Filipino speakers sometimes drop the final /k/ in clusters like "ct," making "fact" sound like "fat." Hold the /k/ briefly before releasing the /t/.',
            speakText: 'fact, fat',
          },
          {
            text: '🎯 Tip: five vs. pibe',
            explanation: '/f/ and /v/ are often replaced with /p/ and /b/ in Filipino English. To produce /f/, gently bite your lower lip and blow — don\'t press your lips fully together.',
            speakText: 'five, vine',
          },
        ],
      },
    },
    {
      kind: 'activity',
      data: {
        id: 'm1c2-b',
        type: 'consonant_drill',
        title: 'Activity Part 1 — Consonant Pronunciation',
        direction:
          'Say each word aloud, focusing on the correct pronunciation of the consonant sounds.',
        passThreshold: 0,
        items: [
          { kind: 'consonant_drill', word: 'road',  ipa: '/roʊd/'    },
          { kind: 'consonant_drill', word: 'book',  ipa: '/bʊk/'     },
          { kind: 'consonant_drill', word: 'tree',  ipa: '/triː/'    },
          { kind: 'consonant_drill', word: 'glass', ipa: '/ɡlæs/'    },
          { kind: 'consonant_drill', word: 'phone', ipa: '/foʊn/'    },
          { kind: 'consonant_drill', word: 'zebra', ipa: '/ˈziːbrə/' },
          { kind: 'consonant_drill', word: 'think', ipa: '/θɪŋk/'    },
          { kind: 'consonant_drill', word: 'these', ipa: '/ðiːz/'    },
          { kind: 'consonant_drill', word: 'chair', ipa: '/tʃer/'    },
          { kind: 'consonant_drill', word: 'knife', ipa: '/naɪf/'    },
        ],
      },
    },
    {
      kind: 'activity',
      data: {
        id: 'm1c2-c',
        type: 'minimal_pair_drill',
        title: 'Activity Part 2 — Minimal Pair Drills',
        direction:
          'Pronounce each word pair carefully. Focus on the difference in sound between the two words. You must reach 90% accuracy before moving to the next pair.',
        passThreshold: 90,
        items: [
          { kind: 'minimal_pair', wordA: 'ship',  ipaA: '/ʃɪp/',  wordB: 'sheep', ipaB: '/ʃiːp/' },
          { kind: 'minimal_pair', wordA: 'live',  ipaA: '/lɪv/',  wordB: 'leave', ipaB: '/liːv/' },
          { kind: 'minimal_pair', wordA: 'bit',   ipaA: '/bɪt/',  wordB: 'beat',  ipaB: '/biːt/' },
          { kind: 'minimal_pair', wordA: 'sit',   ipaA: '/sɪt/',  wordB: 'seat',  ipaB: '/siːt/' },
          { kind: 'minimal_pair', wordA: 'full',  ipaA: '/fʊl/',  wordB: 'fool',  ipaB: '/fuːl/' },
          { kind: 'minimal_pair', wordA: 'cap',   ipaA: '/kæp/',  wordB: 'cup',   ipaB: '/kʌp/'  },
          { kind: 'minimal_pair', wordA: 'bat',   ipaA: '/bæt/',  wordB: 'bet',   ipaB: '/bet/'  },
          { kind: 'minimal_pair', wordA: 'fan',   ipaA: '/fæn/',  wordB: 'van',   ipaB: '/væn/'  },
          { kind: 'minimal_pair', wordA: 'think', ipaA: '/θɪŋk/', wordB: 'sink',  ipaB: '/sɪŋk/' },
          { kind: 'minimal_pair', wordA: 'thin',  ipaA: '/θɪn/',  wordB: 'tin',   ipaB: '/tɪn/'  },
          { kind: 'minimal_pair', wordA: 'right', ipaA: '/raɪt/', wordB: 'light', ipaB: '/laɪt/' },
          { kind: 'minimal_pair', wordA: 'pat',   ipaA: '/pæt/',  wordB: 'bat',   ipaB: '/bæt/'  },
          { kind: 'minimal_pair', wordA: 'coat',  ipaA: '/koʊt/', wordB: 'cot',   ipaB: '/kɑt/'  },
          { kind: 'minimal_pair', wordA: 'sheep', ipaA: '/ʃiːp/', wordB: 'ship',  ipaB: '/ʃɪp/'  },
          { kind: 'minimal_pair', wordA: 'pen',   ipaA: '/pen/',  wordB: 'pan',   ipaB: '/pæn/'  },
        ],
      },
    },
  ],
};

// ─── Export ───────────────────────────────────────────────────────────────────

export const module1Content: ChapterContent[] = [m1c1, m1c2];
