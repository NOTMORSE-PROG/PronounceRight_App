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
        paragraphs: [],
        examples: [
          {
            text: '🔤 Phonemes are the smallest units of sound',
            explanation: '"cat" /kæt/ has 3 phonemes — /k/, /æ/, /t/ — even though it has 3 letters.',
          },
          {
            text: '📝 One sound, many spellings',
            explanation: 'The /f/ sound appears in "fish", "phone", and "rough" — different letters, same phoneme.',
          },
          {
            text: '🔢 44 phonemes, 26 letters',
            explanation: "English has 44 distinct sounds but only 26 letters — that's why pronunciation must be learned, not just read.",
          },
        ],
      },
    },
    {
      kind: 'lesson',
      data: {
        id: 'm1c2-l2',
        title: 'Vowel Sounds',
        paragraphs: [],
        examples: [
          {
            text: '🔵 Short Vowels — quick, crisp sounds',
            explanation: 'cat /æ/, bed /ɛ/, sit /ɪ/, dog /ɒ/, sun /ʌ/ — each vowel is short and clipped.',
          },
          {
            text: '🔴 Long Vowels — held sounds',
            explanation: 'sheep /iː/, name /eɪ/, boat /oʊ/, food /uː/ — the vowel sound is stretched and often spelled with two letters.',
          },
          {
            text: '⚠️ Why It Matters',
            explanation: 'Confusing "ship" /ɪ/ and "sheep" /iː/ changes the word entirely — vowel length is meaningful in English.',
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
        paragraphs: [],
        examples: [
          {
            text: '💥 Stop Sounds — air bursts',
            explanation: 'p, b, t, d, k, g — air is briefly blocked then released. Try: "pen", "bat", "dog".',
          },
          {
            text: '🌬️ Fricative Sounds — air flows',
            explanation: 'f, v, s, z, sh — air squeezes through a narrow gap. Try: "fan", "vine", "ship".',
          },
          {
            text: '🎯 Filipino English Tip',
            explanation: 'Final consonants like "ct" in "fact" are often dropped — making "fat" and "fact" sound the same. Pronounce every consonant.',
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

// ─── m1c3: Common Pronunciation Challenges ───────────────────────────────────

const m1c3: ChapterContent = {
  chapterId: 'm1c3',
  sections: [
    {
      kind: 'lesson',
      data: {
        id: 'm1c3-l1',
        title: 'Lesson 1 — Silent Letters',
        paragraphs: [
          'In English, some letters are written in a word but not pronounced when the word is spoken. These are called silent letters. Knowing which letters are silent helps you pronounce words correctly and avoid common errors.',
          'Silent K — When a word begins with "kn," the K is silent: knife /naɪf/, knock /nɒk/, know /noʊ/, knee /niː/, kneel /niːl/.',
          'Silent W — When a word begins with "wr," the W is silent: write /raɪt/, wrap /ræp/, wrist /rɪst/, wrong /rɒŋ/, wreck /rɛk/.',
          'Silent B — The B is often silent after M or before T at the end of a word: climb /klaɪm/, thumb /θʌm/, comb /koʊm/, lamb /læm/, debt /dɛt/.',
          'Silent GH — In many words, "gh" is completely silent: night /naɪt/, light /laɪt/, right /raɪt/, high /haɪ/, daughter /ˈdɔːtər/.',
        ],
        examples: [
          { text: 'knife → /naɪf/ (the K is silent)', explanation: 'Do not pronounce the K. Say "nyfe."' },
          { text: 'climb → /klaɪm/ (the B is silent)', explanation: 'Do not pronounce the B at the end. Say "clime."' },
          { text: 'night → /naɪt/ (gh is silent)', explanation: 'The "ght" combination — only the T is sounded. Say "nite."' },
        ],
      },
    },
    {
      kind: 'lesson',
      data: {
        id: 'm1c3-l2',
        title: 'Lesson 2 — Consonant Blends',
        paragraphs: [
          'A consonant blend occurs when two or more consonants appear together in a word and each consonant keeps its own sound. Unlike digraphs (where two letters make one new sound), every letter in a blend can be heard.',
          'Initial blends — These appear at the beginning of a word. Common two-letter blends include: bl (blend, black), cl (class, clock), fl (flag, fly), pl (play, plan), sl (sleep, slow), br (bring, brown), cr (cry, cross), dr (dream, drive), fr (friend, free), gr (green, grow), pr (price, print), tr (tree, trust), st (stop, star), sp (speak, spell), sn (snow, snap), sw (swim, sweet).',
          'Three-letter blends — Some words begin with three consonants. Common examples: str (street, strong, stretch), spr (spring, spray, spread), spl (split, splash), scr (screen, scratch), thr (three, throw, through).',
          'Blends also appear at the end of words: -nd (hand, sand), -nt (want, print), -st (fast, most), -lk (walk, talk), -mp (jump, camp).',
        ],
        examples: [
          { text: 'street → /striːt/', explanation: 'Three-letter blend "str" — say S, T, and R clearly before the vowel.' },
          { text: 'spring → /sprɪŋ/', explanation: 'Three-letter blend "spr" — each consonant is heard: S-P-R.' },
          { text: 'blend → /blɛnd/', explanation: 'Initial blend "bl" and final blend "nd" — all four consonants are sounded.' },
        ],
      },
    },
    {
      kind: 'lesson',
      data: {
        id: 'm1c3-l3',
        title: 'Lesson 3 — Word Endings',
        paragraphs: [
          'The way a word ending is pronounced often depends on the sound that comes before it. Three of the most important endings in English are -ed, -s/-es, and -tion.',
          'The -ed ending (past tense) has three pronunciations: /t/ after voiceless consonants — walked /wɔːkt/, stopped /stɒpt/, watched /wɒtʃt/; /d/ after voiced consonants and vowels — jogged /dʒɒgd/, loved /lʌvd/, played /pleɪd/; /ɪd/ after the sounds /t/ or /d/ — wanted /ˈwɒntɪd/, needed /ˈniːdɪd/, started /ˈstɑːtɪd/.',
          'The -s/-es ending (plurals and third-person verbs) has three pronunciations: /s/ after voiceless consonants — cats /kæts/, books /bʊks/, stops /stɒps/; /z/ after voiced consonants and vowels — dogs /dɒgz/, chairs /tʃɛrz/, plays /pleɪz/; /ɪz/ after sibilant sounds (s, z, sh, ch, j) — dishes /ˈdɪʃɪz/, churches /ˈtʃɜːtʃɪz/, buzzes /ˈbʌzɪz/.',
          'The -tion ending is always pronounced /ʃən/: nation /ˈneɪʃən/, station /ˈsteɪʃən/, education /ˌɛdjʊˈkeɪʃən/, pronunciation /prəˌnʌnsɪˈeɪʃən/, communication /kəˌmjuːnɪˈkeɪʃən/.',
        ],
        examples: [
          { text: 'walked → /wɔːkt/ (-ed = /t/)', explanation: '"Walk" ends in a voiceless /k/, so -ed is pronounced /t/.' },
          { text: 'jogged → /dʒɒgd/ (-ed = /d/)', explanation: '"Jog" ends in a voiced /g/, so -ed is pronounced /d/.' },
          { text: 'nation → /ˈneɪʃən/ (-tion = /ʃən/)', explanation: 'The -tion suffix always sounds like "shun."' },
        ],
      },
    },
    {
      kind: 'activity',
      data: {
        id: 'm1c3-a',
        type: 'consonant_drill',
        title: 'Activity A — Silent Letter Drill',
        direction:
          'Say each word aloud. Pay close attention to the silent letters — do not pronounce them. Focus on the correct IPA pronunciation shown.',
        passThreshold: 0,
        items: [
          { kind: 'consonant_drill', word: 'knife',  ipa: '/naɪf/'    },
          { kind: 'consonant_drill', word: 'knock',  ipa: '/nɒk/'     },
          { kind: 'consonant_drill', word: 'write',  ipa: '/raɪt/'    },
          { kind: 'consonant_drill', word: 'wrap',   ipa: '/ræp/'     },
          { kind: 'consonant_drill', word: 'climb',  ipa: '/klaɪm/'   },
          { kind: 'consonant_drill', word: 'thumb',  ipa: '/θʌm/'     },
          { kind: 'consonant_drill', word: 'night',  ipa: '/naɪt/'    },
          { kind: 'consonant_drill', word: 'high',   ipa: '/haɪ/'     },
          { kind: 'consonant_drill', word: 'comb',   ipa: '/koʊm/'    },
          { kind: 'consonant_drill', word: 'wrong',  ipa: '/rɒŋ/'     },
        ],
      },
    },
    {
      kind: 'activity',
      data: {
        id: 'm1c3-b',
        type: 'identify_pronunciation',
        title: 'Activity B — Error Correction Task',
        direction:
          'Listen carefully as each word is pronounced. Decide whether the pronunciation is correct or incorrect. Say the word aloud using the correct pronunciation. Pay special attention to silent letters, consonant blends, and word endings.',
        passThreshold: 0,
        items: [
          { kind: 'identify_pronunciation', word: 'knight'    },
          { kind: 'identify_pronunciation', word: 'wrist'     },
          { kind: 'identify_pronunciation', word: 'lamb'      },
          { kind: 'identify_pronunciation', word: 'light'     },
          { kind: 'identify_pronunciation', word: 'blend'     },
          { kind: 'identify_pronunciation', word: 'street'    },
          { kind: 'identify_pronunciation', word: 'walked'    },
          { kind: 'identify_pronunciation', word: 'jogged'    },
          { kind: 'identify_pronunciation', word: 'nation'    },
          { kind: 'identify_pronunciation', word: 'dishes'    },
        ],
      },
    },
  ],
};

// ─── Export ───────────────────────────────────────────────────────────────────

export const module1Content: ChapterContent[] = [m1c1, m1c2, m1c3];
