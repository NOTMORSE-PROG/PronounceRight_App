import type { ChapterContent } from '@/types/content';

// ─── m3c1: Sentence Construction ─────────────────────────────────────────────

const m3c1: ChapterContent = {
  chapterId: 'm3c1',
  sections: [
    // ── Lesson: Sentence Construction ─────────────────────────────────────────
    {
      kind: 'lesson',
      data: {
        id: 'm3c1-l1',
        title: 'Sentence Construction',
        paragraphs: [
          'A sentence is a group of words that expresses a complete thought. In speaking, it is important to use correct sentence construction so that listeners can easily understand the message.',
          'The basic sentence structure in English follows: Subject + Verb + Object.',
        ],
        examples: [
          { text: 'I eat breakfast.',          explanation: 'Subject (I) + Verb (eat) + Object (breakfast)',          speakText: 'I eat breakfast.' },
          { text: 'She reads a book.',         explanation: 'Subject (She) + Verb (reads) + Object (a book)',         speakText: 'She reads a book.' },
          { text: 'They play basketball.',     explanation: 'Subject (They) + Verb (play) + Object (basketball)',     speakText: 'They play basketball.' },
        ],
      },
    },

    // ── Activity 1: Arrange the Words ─────────────────────────────────────────
    {
      kind: 'activity',
      data: {
        id: 'm3c1-a',
        type: 'word_arrangement' as const,
        title: 'Activity 1 — Arrange the Words',
        direction:
          'Arrange the jumbled words to form a correct sentence. Drag words into the correct order, then listen as the system reads it aloud.',
        passThreshold: 90,
        items: [
          {
            id: 'w1',
            words: ['playing', 'are', 'outside', 'children', 'The'],
            correctSentence: 'The children are playing outside.',
            correctOrder: [4, 3, 1, 0, 2],
          },
          {
            id: 'w2',
            words: ['homework', 'my', 'finished', 'I'],
            correctSentence: 'I finished my homework.',
            correctOrder: [3, 2, 1, 0],
          },
          {
            id: 'w3',
            words: ['teacher', 'The', 'lesson', 'explains', 'the'],
            correctSentence: 'The teacher explains the lesson.',
            correctOrder: [1, 0, 3, 4, 2],
          },
          {
            id: 'w4',
            words: ['running', 'is', 'dog', 'The', 'fast'],
            correctSentence: 'The dog is running fast.',
            correctOrder: [3, 2, 1, 0, 4],
          },
          {
            id: 'w5',
            words: ['breakfast', 'eats', 'He', 'every', 'morning'],
            correctSentence: 'He eats breakfast every morning.',
            correctOrder: [2, 1, 0, 3, 4],
          },
          {
            id: 'w6',
            words: ['reading', 'She', 'a', 'storybook', 'is', 'every', 'night'],
            correctSentence: 'She is reading a storybook every night.',
            correctOrder: [1, 4, 0, 2, 3, 5, 6],
          },
          {
            id: 'w7',
            words: ['soccer', 'every', 'weekend', 'They', 'play'],
            correctSentence: 'They play soccer every weekend.',
            correctOrder: [3, 4, 0, 1, 2],
          },
          {
            id: 'w8',
            words: ['go', 'to', 'school', 'by', 'bus', 'He'],
            correctSentence: 'He go to school by bus.',
            correctOrder: [5, 0, 1, 2, 3, 4],
          },
          {
            id: 'w9',
            words: ['homework', 'We', 'after', 'dinner', 'do', 'our'],
            correctSentence: 'We do our homework after dinner.',
            correctOrder: [1, 4, 5, 0, 2, 3],
          },
          {
            id: 'w10',
            words: ['garden', 'the', 'children', 'play', 'happily', 'The', 'in'],
            correctSentence: 'The children play happily in the garden.',
            correctOrder: [5, 2, 3, 4, 6, 1, 0],
          },
        ],
      },
    },

    // ── Activity 2: Opinion Builder ───────────────────────────────────────────
    {
      kind: 'activity',
      data: {
        id: 'm3c1-b',
        type: 'opinion_builder' as const,
        title: 'Activity 2 — Opinion Builder',
        direction:
          'Complete each sentence by filling in the blanks, then record yourself saying the full sentence aloud.',
        passThreshold: 90,
        prompts: [
          {
            id: 'ob1',
            template: 'I think school is ______ because ______.',
            keywords: ['think', 'school', 'because'],
          },
          {
            id: 'ob2',
            template: 'In my opinion, English is ______ because ______.',
            keywords: ['opinion', 'english', 'because'],
          },
          {
            id: 'ob3',
            template: 'I believe students should ______ because ______.',
            keywords: ['believe', 'students', 'because'],
          },
          {
            id: 'ob4',
            template: 'I like ______ because ______.',
            keywords: ['like', 'because'],
          },
          {
            id: 'ob5',
            template: "I don't like ______ because ______.",
            keywords: ["don't", 'like', 'because'],
          },
          {
            id: 'ob6',
            template: 'For me, learning is ______ because ______.',
            keywords: ['learning', 'because'],
          },
          {
            id: 'ob7',
            template: 'I think homework is ______ because ______.',
            keywords: ['think', 'homework', 'because'],
          },
          {
            id: 'ob8',
            template: 'In my opinion, group work is ______ because ______.',
            keywords: ['opinion', 'group', 'because'],
          },
          {
            id: 'ob9',
            template: 'I believe speaking English is ______ because ______.',
            keywords: ['believe', 'speaking', 'english', 'because'],
          },
          {
            id: 'ob10',
            template: 'I like my class because ______.',
            keywords: ['like', 'class', 'because'],
          },
        ],
      },
    },
  ],
};

// ─── m3c2: Basic Grammar Rules ───────────────────────────────────────────────

const m3c2: ChapterContent = {
  chapterId: 'm3c2',
  sections: [
    // ── Lesson: Basic Grammar Rules ───────────────────────────────────────────
    {
      kind: 'lesson',
      data: {
        id: 'm3c2-l1',
        title: 'Basic Grammar Rules',
        paragraphs: [
          'Subject-verb agreement is a grammar rule that ensures the subject and verb in a sentence match in number. A singular subject takes a singular verb, and a plural subject takes a plural verb. Correct agreement makes sentences grammatically correct and easy to understand.',
          'Applying subject-verb agreement when speaking helps your listeners follow your message clearly and accurately. There are five important rules to remember.',
        ],
        examples: [
          { text: 'She walks to school.',                          explanation: 'Rule 1: Singular subject (She) → singular verb (walks)',                                    speakText: 'She walks to school.' },
          { text: 'They walk to school.',                          explanation: 'Rule 2: Plural subject (They) → plural verb (walk)',                                        speakText: 'They walk to school.' },
          { text: 'I eat breakfast every morning.',                explanation: 'Rule 3: "I" and "You" are exceptions — use the base verb, not "eats"',                     speakText: 'I eat breakfast every morning.' },
          { text: 'My brother and sister play basketball.',        explanation: 'Rule 4: Two subjects joined by "and" → plural verb (play)',                                speakText: 'My brother and sister play basketball.' },
          { text: 'Either the teacher or the student is correct.', explanation: 'Rule 5: Two singular subjects joined by "or" or "nor" → singular verb (is)',              speakText: 'Either the teacher or the student is correct.' },
        ],
      },
    },

    // ── Activity 1: Sentence Completion ───────────────────────────────────────
    {
      kind: 'activity',
      data: {
        id: 'm3c2-a',
        type: 'sentence_completion' as const,
        title: 'Activity 1 — Sentence Completion',
        direction:
          'Choose the correct word to complete each sentence. Then record yourself saying the full sentence aloud.',
        passThreshold: 90,
        items: [
          {
            id: 'sc1',
            template: 'I ______ a sandwich for breakfast.',
            choices: ['eat', 'eats', 'eating'],
            correctIndex: 0,
            fullSentence: 'I eat a sandwich for breakfast.',
            keywords: ['eat', 'sandwich'],
          },
          {
            id: 'sc2',
            template: 'She ______ a storybook every night.',
            choices: ['reads', 'read', 'reading'],
            correctIndex: 0,
            fullSentence: 'She reads a storybook every night.',
            keywords: ['reads', 'storybook'],
          },
          {
            id: 'sc3',
            template: 'They ______ soccer every weekend.',
            choices: ['play', 'plays', 'playing'],
            correctIndex: 0,
            fullSentence: 'They play soccer every weekend.',
            keywords: ['play', 'soccer'],
          },
          {
            id: 'sc4',
            template: 'He ______ to school by bus.',
            choices: ['go', 'goes', 'going'],
            correctIndex: 1,
            fullSentence: 'He goes to school by bus.',
            keywords: ['goes', 'school'],
          },
          {
            id: 'sc5',
            template: 'We ______ our homework after dinner.',
            choices: ['do', 'does', 'doing'],
            correctIndex: 0,
            fullSentence: 'We do our homework after dinner.',
            keywords: ['do', 'homework'],
          },
          {
            id: 'sc6',
            template: 'My mother ______ delicious food.',
            choices: ['cook', 'cooks', 'cooking'],
            correctIndex: 1,
            fullSentence: 'My mother cooks delicious food.',
            keywords: ['cooks', 'food'],
          },
          {
            id: 'sc7',
            template: 'The cat ______ on the sofa.',
            choices: ['sleep', 'sleeps', 'sleeping'],
            correctIndex: 1,
            fullSentence: 'The cat sleeps on the sofa.',
            keywords: ['sleeps', 'sofa'],
          },
          {
            id: 'sc8',
            template: 'I ______ my friends at the park.',
            choices: ['meet', 'meets', 'meeting'],
            correctIndex: 0,
            fullSentence: 'I meet my friends at the park.',
            keywords: ['meet', 'friends'],
          },
          {
            id: 'sc9',
            template: 'She ______ her teeth every morning.',
            choices: ['brush', 'brushes', 'brushing'],
            correctIndex: 1,
            fullSentence: 'She brushes her teeth every morning.',
            keywords: ['brushes', 'teeth'],
          },
          {
            id: 'sc10',
            template: 'The children ______ happily in the garden.',
            choices: ['play', 'plays', 'playing'],
            correctIndex: 0,
            fullSentence: 'The children play happily in the garden.',
            keywords: ['play', 'garden'],
          },
        ],
      },
    },
  ],
};

// ─── m3c3: Fluency and Guided Speaking ───────────────────────────────────────

const m3c3: ChapterContent = {
  chapterId: 'm3c3',
  sections: [
    // ── Lesson 1: Speaking Without Hesitation ─────────────────────────────────
    {
      kind: 'lesson',
      data: {
        id: 'm3c3-l1',
        title: 'Speaking Without Hesitation',
        paragraphs: [
          'Fluent speakers express their ideas clearly and confidently. To speak fluently, you need to think before you speak, use simple sentences, speak slowly and clearly, and avoid long pauses and repeated words.',
          'Tips to Reduce Hesitation: Practice common expressions and sentence starters. Prepare your ideas before speaking. Record and listen to your own voice to improve.',
        ],
        examples: [
          { text: 'My favorite hobby is drawing.',        explanation: 'Beginning — introduce the topic',        speakText: 'My favorite hobby is drawing.' },
          { text: 'I like it because it is relaxing.',    explanation: 'Middle — give details or reasons',       speakText: 'I like it because it is relaxing.' },
          { text: 'I usually draw on weekends.',          explanation: 'End — conclude with a final thought',    speakText: 'I usually draw on weekends.' },
        ],
      },
    },

    // ── Activity 1: 1-Minute Speaking Task ────────────────────────────────────
    {
      kind: 'activity',
      data: {
        id: 'm3c3-a',
        type: 'pick_and_speak' as const,
        title: 'Activity 1 — 1-Minute Speaking Task',
        direction:
          'Pick a topic card and speak for about 1 minute. Use the beginning–middle–end guide to organize your ideas before you start recording.',
        passThreshold: 90,
        sentenceCount: { min: 3, max: 6 },
        cueCards: [
          {
            question: 'What is your favorite hobby?',
            keyPhrases: ['Beginning: My favorite hobby is ______.',
                         'Middle: I like it because ______.',
                         'End: I usually do this ______.'],
            modelAnswer: 'My favorite hobby is drawing. I like it because it is relaxing and creative. I usually draw during weekends with my friends.',
            topicKeywords: ['hobby', 'favorite', 'like', 'because', 'usually'],
          },
          {
            question: 'What is your favorite food?',
            keyPhrases: ['Beginning: My favorite food is ______.',
                         'Middle: I like it because ______.',
                         'End: I usually eat it ______.'],
            modelAnswer: 'My favorite food is adobo. I like it because it is delicious and my mother cooks it very well. I usually eat it during family gatherings.',
            topicKeywords: ['food', 'favorite', 'like', 'because', 'eat'],
          },
          {
            question: 'What is your favorite place?',
            keyPhrases: ['Beginning: My favorite place is ______.',
                         'Middle: I like this place because ______.',
                         'End: I usually go there with ______.'],
            modelAnswer: 'My favorite place is the park near our house. I like it because it is peaceful and I can relax there. I usually go there with my family on weekends.',
            topicKeywords: ['place', 'favorite', 'like', 'because', 'usually', 'go'],
          },
        ],
      },
    },

    // ── Lesson 2: Idea Organization ───────────────────────────────────────────
    {
      kind: 'lesson',
      data: {
        id: 'm3c3-l2',
        title: 'Idea Organization',
        paragraphs: [
          'Organizing your ideas helps the listener understand you better. Use a simple guide: Beginning → Middle → End.',
          'Beginning: Introduce your topic. Middle: Give details or reasons. End: Conclude with a final thought.',
        ],
        examples: [
          { text: 'My best friend is Ana.',                                          explanation: 'Beginning — introduce the topic',        speakText: 'My best friend is Ana.' },
          { text: 'We like to play basketball and study together.',                  explanation: 'Middle — give details or reasons',       speakText: 'We like to play basketball and study together.' },
          { text: 'I am grateful to have her as my friend.',                         explanation: 'End — conclude with a final thought',    speakText: 'I am grateful to have her as my friend.' },
        ],
      },
    },

    // ── Activity 2a: Guided Speaking — Prompt 1 ───────────────────────────────
    {
      kind: 'activity',
      data: {
        id: 'm3c3-b',
        type: 'opinion_builder' as const,
        title: 'Activity 2 — Guided Speaking (Prompt 1)',
        direction:
          'Complete each sentence by filling in the blanks, then record yourself saying the full sentence aloud. Use these three sentences to talk about your favorite place.',
        passThreshold: 90,
        prompts: [
          {
            id: 'gp1-1',
            template: 'My favorite place is ______.',
            keywords: ['favorite', 'place'],
          },
          {
            id: 'gp1-2',
            template: 'I like this place because ______.',
            keywords: ['like', 'place', 'because'],
          },
          {
            id: 'gp1-3',
            template: 'I usually go there with ______.',
            keywords: ['usually', 'go'],
          },
        ],
      },
    },

    // ── Activity 2b: Guided Speaking — Prompt 2 ───────────────────────────────
    {
      kind: 'activity',
      data: {
        id: 'm3c3-c',
        type: 'opinion_builder' as const,
        title: 'Activity 2 — Guided Speaking (Prompt 2)',
        direction:
          'Complete each sentence by filling in the blanks, then record yourself saying the full sentence aloud. Use these three sentences to talk about your best friend.',
        passThreshold: 90,
        prompts: [
          {
            id: 'gp2-1',
            template: 'My best friend is ______.',
            keywords: ['best', 'friend'],
          },
          {
            id: 'gp2-2',
            template: 'We like to ______.',
            keywords: ['we', 'like'],
          },
          {
            id: 'gp2-3',
            template: 'My friend is ______.',
            keywords: ['friend'],
          },
        ],
      },
    },

    // ── Activity 3: Mini Role-Play (Video Call Simulation) ────────────────────
    {
      kind: 'activity',
      data: {
        id: 'm3c3-d',
        type: 'video_role_play' as const,
        title: 'Activity 3 — Mini Role-Play',
        direction:
          'Watch the video caller carefully and respond by speaking in a complete sentence. Do not answer with "Yes" or "No" only. Listen to any follow-up question and respond again using a complete sentence.',
        passThreshold: 0,
        scenarios: [
          // ── Scenario 1: Joining a Group ──────────────────────────────────────
          {
            id: 's1',
            title: 'Scenario 1: Joining a Group',
            description: 'Your classmate invites you to join their group project. Respond clearly and politely.',
            entryStepId: 's1-open',
            steps: [
              {
                id: 's1-open',
                videoKey: 's1-opening',
                label: 'Caller says:',
                requiresResponse: true,
                responseHint: '"Hello! We are working on a group project. Do you want to join our group?"',
                branches: [
                  { label: 'I said YES', nextStepId: 's1-fy', keywords: ['yes', 'sure', 'would', 'love', 'want', 'can', 'okay', 'of course', 'join', 'like', "i'll", 'id love', 'id like', 'definitely', 'happy', 'glad'] },
                  { label: 'I said NO',  nextStepId: 's1-fn', keywords: ['no', "don't", 'prefer', 'already', "can't", 'not', 'rather', 'sorry', 'decline', 'unable'] },
                ],
              },
              {
                id: 's1-fy',
                videoKey: 's1-followup-yes',
                label: 'Follow-up:',
                requiresResponse: true,
                responseHint: '"Great! What part of the project would you like to help with?"',
                nextStepId: 's1-final-yes',
              },
              {
                id: 's1-fn',
                videoKey: 's1-followup-no',
                label: 'Follow-up:',
                requiresResponse: true,
                responseHint: '"That\'s okay. Do you already have a group?"',
                nextStepId: 's1-final-no',
              },
              {
                id: 's1-final-yes',
                videoKey: 's1-final-yes',
                label: 'Caller responds:',
                requiresResponse: false,
              },
              {
                id: 's1-final-no',
                videoKey: 's1-final-no',
                label: 'Caller responds:',
                requiresResponse: false,
              },
            ],
          },

          // ── Scenario 2: Daily Routine ─────────────────────────────────────────
          {
            id: 's2',
            title: 'Scenario 2: Daily Routine',
            description: 'A classmate asks about what you do after school. Share your routine clearly.',
            entryStepId: 's2-open',
            steps: [
              {
                id: 's2-open',
                videoKey: 's2-opening',
                label: 'Caller says:',
                requiresResponse: true,
                responseHint: '"What do you do after school?"',
                nextStepId: 's2-f1',
              },
              {
                id: 's2-f1',
                videoKey: 's2-followup-1',
                label: 'Follow-up:',
                requiresResponse: true,
                responseHint: '"That sounds good! Can you tell me more about that?"',
                nextStepId: 's2-f2',
              },
              {
                id: 's2-f2',
                videoKey: 's2-followup-2',
                label: 'Follow-up:',
                requiresResponse: true,
                nextStepId: 's2-final',
              },
              {
                id: 's2-final',
                videoKey: 's2-final',
                label: 'Caller responds:',
                requiresResponse: false,
              },
            ],
          },

          // ── Scenario 3: Giving an Opinion ─────────────────────────────────────
          {
            id: 's3',
            title: 'Scenario 3: Giving an Opinion',
            description: 'Your classmate asks what you think about group work. Share your honest opinion.',
            entryStepId: 's3-open',
            steps: [
              {
                id: 's3-open',
                videoKey: 's3-opening',
                label: 'Caller says:',
                requiresResponse: true,
                responseHint: '"What do you think about group work?"',
                branches: [
                  { label: 'Positive opinion', nextStepId: 's3-fp', keywords: ['good', 'helpful', 'useful', 'like', 'help', 'share', 'enjoy', 'great', 'love', 'fun', 'together', 'agree', 'learn', 'think it', 'positive', 'benefit', 'improve', 'teamwork'] },
                  { label: 'Negative opinion', nextStepId: 's3-fn', keywords: ["don't", "doesn't", 'prefer', 'alone', 'challenging', 'hard', 'difficult', 'stressful', 'bad', 'dislike', 'not', 'problem', 'tricky', 'disagree', 'hate', 'boring'] },
                ],
              },
              {
                id: 's3-fp',
                videoKey: 's3-followup-positive',
                label: 'Follow-up:',
                requiresResponse: true,
                responseHint: '"Why do you think it\'s helpful?"',
                nextStepId: 's3-final-positive',
              },
              {
                id: 's3-fn',
                videoKey: 's3-followup-negative',
                label: 'Follow-up:',
                requiresResponse: true,
                responseHint: '"What do you find challenging about group work?"',
                nextStepId: 's3-final-negative',
              },
              {
                id: 's3-final-positive',
                videoKey: 's3-final-positive',
                label: 'Caller responds:',
                requiresResponse: false,
              },
              {
                id: 's3-final-negative',
                videoKey: 's3-final-negative',
                label: 'Caller responds:',
                requiresResponse: false,
              },
            ],
          },

          // ── Scenario 4: Talking About School ──────────────────────────────────
          {
            id: 's4',
            title: 'Scenario 4: Talking About School',
            description: 'Your classmate asks if you like your school. Give a complete answer with a reason.',
            entryStepId: 's4-open',
            steps: [
              {
                id: 's4-open',
                videoKey: 's4-opening',
                label: 'Caller says:',
                requiresResponse: true,
                responseHint: '"Do you like your school? Why?"',
                branches: [
                  { label: 'I said YES', nextStepId: 's4-fy', keywords: ['yes', 'sure', 'would', 'love', 'want', 'can', 'okay', 'of course', 'like', "i'll", 'id love', 'id like', 'definitely', 'happy', 'enjoy', 'great'] },
                  { label: 'I said NO',  nextStepId: 's4-fn', keywords: ['no', "don't", 'prefer', 'already', "can't", 'not', 'rather', 'sorry', 'decline', 'unable', 'dislike', 'hate'] },
                ],
              },
              {
                id: 's4-fy',
                videoKey: 's4-followup-yes',
                label: 'Follow-up:',
                requiresResponse: true,
                responseHint: '"What do you like the most about your school?"',
                nextStepId: 's4-final-yes',
              },
              {
                id: 's4-fn',
                videoKey: 's4-followup-no',
                label: 'Follow-up:',
                requiresResponse: true,
                responseHint: '"What don\'t you like about your school?"',
                nextStepId: 's4-final-no',
              },
              {
                id: 's4-final-yes',
                videoKey: 's4-final-yes',
                label: 'Caller responds:',
                requiresResponse: false,
              },
              {
                id: 's4-final-no',
                videoKey: 's4-final-no',
                label: 'Caller responds:',
                requiresResponse: false,
              },
            ],
          },

          // ── Scenario 5: Encouragement ─────────────────────────────────────────
          {
            id: 's5',
            title: 'Scenario 5: Encouragement',
            description: 'Your caller gives you encouragement after a great performance. Share how you feel.',
            entryStepId: 's5-open',
            steps: [
              {
                id: 's5-open',
                videoKey: 's5-opening',
                label: 'Caller says:',
                requiresResponse: true,
                responseHint: '"You did a great job today! How do you feel?"',
                nextStepId: 's5-followup',
              },
              {
                id: 's5-followup',
                videoKey: 's5-followup',
                label: 'Follow-up:',
                requiresResponse: true,
                responseHint: '"What part of the activity made you feel that way?"',
                nextStepId: 's5-general',
              },
              {
                id: 's5-general',
                videoKey: 's5-general',
                label: 'Caller responds:',
                requiresResponse: false,
              },
            ],
          },
        ],
      },
    },
  ],
};

export const module3Content: ChapterContent[] = [m3c1, m3c2, m3c3];
