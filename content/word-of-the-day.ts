import type { WordOfTheDayEntry } from '@/types/word-of-the-day';

/**
 * 60 words (~2 months of daily content), organized by difficulty and
 * aligned with the module progression.
 *
 * Beginner  (1–20):  Vowels, consonants, basic pronunciation (Module 1)
 * Intermediate (21–40): Stress, intonation, multi-syllable words (Module 2)
 * Advanced  (41–60):  Academic & conversational vocabulary (Module 3)
 */
export const WORD_OF_THE_DAY_BANK: WordOfTheDayEntry[] = [
  // ─── Beginner: Vowels, Consonants, Basic Pronunciation ──────────────────────

  {
    id: 'apple',
    word: 'apple',
    ipa: '/ˈæpəl/',
    partOfSpeech: 'noun',
    definition: 'A round fruit with red, green, or yellow skin.',
    exampleSentence: 'She ate a fresh apple for her snack.',
    pronunciationTip:
      'The "a" in "apple" is /æ/ — open your mouth wider than the Filipino "a". It sounds like the "a" in "cat", not "ah".',
    difficulty: 'beginner',
  },
  {
    id: 'think',
    word: 'think',
    ipa: '/θɪŋk/',
    partOfSpeech: 'verb',
    definition: 'To use your mind to consider something.',
    exampleSentence: 'I think we should study together.',
    pronunciationTip:
      'Place your tongue between your teeth for the "th" /θ/ sound. Filipino speakers often say "tink" — avoid replacing "th" with "t".',
    difficulty: 'beginner',
  },
  {
    id: 'ship',
    word: 'ship',
    ipa: '/ʃɪp/',
    partOfSpeech: 'noun',
    definition: 'A large vessel that travels on water.',
    exampleSentence: 'The ship sailed across the ocean.',
    pronunciationTip:
      'Use a short /ɪ/ vowel — "ship" rhymes with "tip", not "sheep". Keep the vowel quick and relaxed.',
    difficulty: 'beginner',
  },
  {
    id: 'beach',
    word: 'beach',
    ipa: '/biːtʃ/',
    partOfSpeech: 'noun',
    definition: 'A sandy or pebbly shore beside a body of water.',
    exampleSentence: 'We spent the afternoon at the beach.',
    pronunciationTip:
      'Use a long /iː/ vowel — stretch the "ee" sound. Be careful not to confuse this with the short "i" in "b*tch".',
    difficulty: 'beginner',
  },
  {
    id: 'very',
    word: 'very',
    ipa: '/ˈvɛri/',
    partOfSpeech: 'adverb',
    definition: 'Used to emphasize that something is great in degree.',
    exampleSentence: 'She is very kind to everyone.',
    pronunciationTip:
      'Start with /v/ — bite your lower lip gently and let air vibrate. Filipino speakers often say "bery" — "v" is NOT "b".',
    difficulty: 'beginner',
  },
  {
    id: 'father',
    word: 'father',
    ipa: '/ˈfɑːðər/',
    partOfSpeech: 'noun',
    definition: 'A male parent.',
    exampleSentence: 'My father taught me how to ride a bicycle.',
    pronunciationTip:
      'Start with /f/ (teeth on lower lip), not "p". The "th" in the middle is voiced /ð/ — tongue between teeth with vibration.',
    difficulty: 'beginner',
  },
  {
    id: 'world',
    word: 'world',
    ipa: '/wɜːrld/',
    partOfSpeech: 'noun',
    definition: 'The earth and all its countries and people.',
    exampleSentence: 'English is spoken all around the world.',
    pronunciationTip:
      'The /ɜːr/ sound does not exist in Filipino — round your lips slightly and say "er" while keeping your tongue back. Don\'t drop the "l" before "d".',
    difficulty: 'beginner',
  },
  {
    id: 'three',
    word: 'three',
    ipa: '/θriː/',
    partOfSpeech: 'number',
    definition: 'The number equivalent to 2 + 1.',
    exampleSentence: 'There are three students in the group.',
    pronunciationTip:
      'Start with /θ/ (tongue between teeth), then blend into "ree". Don\'t say "tree" — the "th" and "tr" sounds are different.',
    difficulty: 'beginner',
  },
  {
    id: 'fun',
    word: 'fun',
    ipa: '/fʌn/',
    partOfSpeech: 'noun',
    definition: 'Enjoyment or amusement.',
    exampleSentence: 'We had so much fun at the party.',
    pronunciationTip:
      'The vowel /ʌ/ is like a short, relaxed "ah" in the middle of your mouth. Start with /f/ (teeth on lip), not "p".',
    difficulty: 'beginner',
  },
  {
    id: 'cat',
    word: 'cat',
    ipa: '/kæt/',
    partOfSpeech: 'noun',
    definition: 'A small furry animal often kept as a pet.',
    exampleSentence: 'The cat sat on the mat.',
    pronunciationTip:
      'The /æ/ sound needs a wider mouth opening than Filipino "a". Think of it as halfway between "ah" and "eh".',
    difficulty: 'beginner',
  },
  {
    id: 'food',
    word: 'food',
    ipa: '/fuːd/',
    partOfSpeech: 'noun',
    definition: 'Any substance consumed for nutrition.',
    exampleSentence: 'Filipino food is known for its bold flavors.',
    pronunciationTip:
      'Use the long /uː/ vowel — round your lips and hold the "oo" sound. Make sure to close with a clear /d/ at the end.',
    difficulty: 'beginner',
  },
  {
    id: 'job',
    word: 'job',
    ipa: '/dʒɑːb/',
    partOfSpeech: 'noun',
    definition: 'A paid position of regular employment.',
    exampleSentence: 'She found a good job after graduation.',
    pronunciationTip:
      'Start with /dʒ/ — like the "j" in "jump". The vowel is an open /ɑː/, not the Filipino "o". End with a clear /b/.',
    difficulty: 'beginner',
  },
  {
    id: 'right',
    word: 'right',
    ipa: '/raɪt/',
    partOfSpeech: 'adjective',
    definition: 'Morally correct or factually accurate.',
    exampleSentence: 'You gave the right answer.',
    pronunciationTip:
      'The "r" in English curls the tongue back, unlike the Filipino flapped "r". The "gh" is silent — don\'t pronounce it.',
    difficulty: 'beginner',
  },
  {
    id: 'love',
    word: 'love',
    ipa: '/lʌv/',
    partOfSpeech: 'noun',
    definition: 'A strong feeling of affection.',
    exampleSentence: 'She has a great love for reading.',
    pronunciationTip:
      'End with /v/ (teeth on lower lip with vibration), not "b". The vowel /ʌ/ is a short, relaxed "uh" sound.',
    difficulty: 'beginner',
  },
  {
    id: 'bath',
    word: 'bath',
    ipa: '/bæθ/',
    partOfSpeech: 'noun',
    definition: 'An act of washing one\'s body in water.',
    exampleSentence: 'He takes a warm bath every evening.',
    pronunciationTip:
      'End with /θ/ — tongue between teeth, blow air out gently. Don\'t say "bat" — the final "th" sound is important.',
    difficulty: 'beginner',
  },
  {
    id: 'help',
    word: 'help',
    ipa: '/hɛlp/',
    partOfSpeech: 'verb',
    definition: 'To make it easier for someone to do something.',
    exampleSentence: 'Can you help me with my homework?',
    pronunciationTip:
      'Pronounce all three final consonants: /l/ then /p/. Filipino speakers sometimes drop the "l" — say "hel-p" clearly.',
    difficulty: 'beginner',
  },
  {
    id: 'pull',
    word: 'pull',
    ipa: '/pʊl/',
    partOfSpeech: 'verb',
    definition: 'To exert force to move something toward oneself.',
    exampleSentence: 'Pull the door to open it.',
    pronunciationTip:
      'The vowel /ʊ/ is a short "oo" — your lips are slightly rounded but relaxed. Don\'t confuse it with the long "oo" in "pool".',
    difficulty: 'beginner',
  },
  {
    id: 'desk',
    word: 'desk',
    ipa: '/dɛsk/',
    partOfSpeech: 'noun',
    definition: 'A piece of furniture for reading and writing.',
    exampleSentence: 'Please sit at your desk.',
    pronunciationTip:
      'End with the consonant cluster /sk/ — say both sounds clearly. Don\'t add a vowel after it (not "des-ku").',
    difficulty: 'beginner',
  },
  {
    id: 'wish',
    word: 'wish',
    ipa: '/wɪʃ/',
    partOfSpeech: 'verb',
    definition: 'To want something that is not easily obtainable.',
    exampleSentence: 'I wish I could travel the world.',
    pronunciationTip:
      'Start with /w/ by rounding your lips. The "sh" /ʃ/ sound is made with your tongue pulled back — it is softer than "s".',
    difficulty: 'beginner',
  },
  {
    id: 'zero',
    word: 'zero',
    ipa: '/ˈzɪroʊ/',
    partOfSpeech: 'noun',
    definition: 'The number 0; nothing.',
    exampleSentence: 'The temperature dropped to zero.',
    pronunciationTip:
      'Start with /z/ — it is a buzzing "s" sound (vocal cords vibrate). Filipino speakers sometimes use "s" instead — make sure you buzz.',
    difficulty: 'beginner',
  },

  // ─── Intermediate: Stress, Intonation, Multi-Syllable Words ─────────────────

  {
    id: 'record',
    word: 'record',
    ipa: '/ˈrɛkərd/ or /rɪˈkɔːrd/',
    partOfSpeech: 'noun / verb',
    definition: 'A thing constituting evidence (noun); to set down in writing or audio (verb).',
    exampleSentence: 'She broke the school record. / Please record the meeting.',
    pronunciationTip:
      'Stress changes meaning: REcord (noun, stress on 1st syllable) vs. reCORD (verb, stress on 2nd). Filipino speakers often stress both the same way.',
    difficulty: 'intermediate',
  },
  {
    id: 'present',
    word: 'present',
    ipa: '/ˈprɛzənt/ or /prɪˈzɛnt/',
    partOfSpeech: 'noun / verb',
    definition: 'A gift (noun); to show or give formally (verb).',
    exampleSentence: 'I received a birthday present. / Please present your report.',
    pronunciationTip:
      'PREsent (noun) stresses the 1st syllable. preSENT (verb) stresses the 2nd. Listen for the stress shift — it signals meaning.',
    difficulty: 'intermediate',
  },
  {
    id: 'comfortable',
    word: 'comfortable',
    ipa: '/ˈkʌmftərbəl/',
    partOfSpeech: 'adjective',
    definition: 'Providing physical ease and relaxation.',
    exampleSentence: 'This chair is very comfortable.',
    pronunciationTip:
      'Say it as 3 syllables: "KUMF-ter-bul", not 4. Filipino speakers often say "com-FOR-ta-ble" — the "or" syllable gets swallowed.',
    difficulty: 'intermediate',
  },
  {
    id: 'vegetable',
    word: 'vegetable',
    ipa: '/ˈvɛdʒtəbəl/',
    partOfSpeech: 'noun',
    definition: 'A plant or part of a plant used as food.',
    exampleSentence: 'Eating vegetables every day keeps you healthy.',
    pronunciationTip:
      'Say it as 3 syllables: "VEJ-tuh-bul", not 4. Start with /v/ (not "b"). The stress is on the first syllable.',
    difficulty: 'intermediate',
  },
  {
    id: 'important',
    word: 'important',
    ipa: '/ɪmˈpɔːrtənt/',
    partOfSpeech: 'adjective',
    definition: 'Of great significance or value.',
    exampleSentence: 'Education is very important for your future.',
    pronunciationTip:
      'Stress the 2nd syllable: "im-POR-tunt". Don\'t stress all syllables equally — let "POR" stand out louder and longer.',
    difficulty: 'intermediate',
  },
  {
    id: 'develop',
    word: 'develop',
    ipa: '/dɪˈvɛləp/',
    partOfSpeech: 'verb',
    definition: 'To grow or cause to grow and become more advanced.',
    exampleSentence: 'We need to develop better study habits.',
    pronunciationTip:
      'Stress is on the 2nd syllable: "dih-VEL-up". Use /v/ (not "b") and keep the final /p/ crisp without adding a vowel after it.',
    difficulty: 'intermediate',
  },
  {
    id: 'library',
    word: 'library',
    ipa: '/ˈlaɪbrɛri/',
    partOfSpeech: 'noun',
    definition: 'A building or room containing a collection of books.',
    exampleSentence: 'I borrowed three books from the library.',
    pronunciationTip:
      'Say "LY-breh-ree" with 3 syllables. Don\'t drop the first "r" — avoid saying "lie-berry". Stress the first syllable.',
    difficulty: 'intermediate',
  },
  {
    id: 'temperature',
    word: 'temperature',
    ipa: '/ˈtɛmprətʃər/',
    partOfSpeech: 'noun',
    definition: 'The degree of heat or cold in a place or body.',
    exampleSentence: 'The temperature today is 32 degrees.',
    pronunciationTip:
      'Say "TEM-pruh-chur" (3 syllables, not 4). Filipino speakers often add an extra syllable: "tem-pe-ra-ture". Reduce it.',
    difficulty: 'intermediate',
  },
  {
    id: 'education',
    word: 'education',
    ipa: '/ˌɛdʒʊˈkeɪʃən/',
    partOfSpeech: 'noun',
    definition: 'The process of receiving or giving systematic instruction.',
    exampleSentence: 'Quality education changes lives.',
    pronunciationTip:
      'Stress falls on the 3rd syllable: "ed-yoo-KAY-shun". The "-tion" ending is /ʃən/ (like "shun"), not "tee-on".',
    difficulty: 'intermediate',
  },
  {
    id: 'photograph',
    word: 'photograph',
    ipa: '/ˈfoʊtəɡræf/',
    partOfSpeech: 'noun',
    definition: 'A picture made using a camera.',
    exampleSentence: 'She took a beautiful photograph of the sunset.',
    pronunciationTip:
      'Stress the 1st syllable: "FOH-tuh-graf". The "ph" makes an /f/ sound. Compare: phoTOGraphy (stress shifts to 2nd syllable).',
    difficulty: 'intermediate',
  },
  {
    id: 'determine',
    word: 'determine',
    ipa: '/dɪˈtɜːrmɪn/',
    partOfSpeech: 'verb',
    definition: 'To find out or decide something.',
    exampleSentence: 'We need to determine the best solution.',
    pronunciationTip:
      'Stress the 2nd syllable: "dih-TUR-min". The /ɜːr/ sound requires curling your tongue back — practice the "er" sound.',
    difficulty: 'intermediate',
  },
  {
    id: 'opportunity',
    word: 'opportunity',
    ipa: '/ˌɑːpərˈtuːnəti/',
    partOfSpeech: 'noun',
    definition: 'A favorable time or set of circumstances for doing something.',
    exampleSentence: 'This is a great opportunity to learn.',
    pronunciationTip:
      'Stress the 3rd syllable: "op-er-TOO-nuh-tee". It has 5 syllables — don\'t rush through them. The /tuː/ is a long "oo".',
    difficulty: 'intermediate',
  },
  {
    id: 'environment',
    word: 'environment',
    ipa: '/ɪnˈvaɪrənmənt/',
    partOfSpeech: 'noun',
    definition: 'The surroundings or conditions in which a person lives.',
    exampleSentence: 'We should protect our environment.',
    pronunciationTip:
      'Stress the 2nd syllable: "in-VY-run-munt". Use /v/ not "b". The "-ment" ending is reduced to /mənt/ — don\'t over-pronounce it.',
    difficulty: 'intermediate',
  },
  {
    id: 'necessary',
    word: 'necessary',
    ipa: '/ˈnɛsəsɛri/',
    partOfSpeech: 'adjective',
    definition: 'Required to be done; essential.',
    exampleSentence: 'It is necessary to study before the exam.',
    pronunciationTip:
      'Stress the 1st syllable: "NES-uh-ser-ee". Filipino speakers often stress the 2nd or 3rd syllable — keep "NES" the loudest.',
    difficulty: 'intermediate',
  },
  {
    id: 'particular',
    word: 'particular',
    ipa: '/pərˈt��kjʊlər/',
    partOfSpeech: 'adjective',
    definition: 'Used to single out an individual item or thing.',
    exampleSentence: 'Is there a particular topic you want to discuss?',
    pronunciationTip:
      'Stress the 2nd syllable: "per-TIK-yoo-ler". The /r/ at the end is soft in some accents. Keep the "TIK" syllable strong.',
    difficulty: 'intermediate',
  },
  {
    id: 'experience',
    word: 'experience',
    ipa: '/ɪkˈspɪriəns/',
    partOfSpeech: 'noun',
    definition: 'Practical contact with and observation of facts or events.',
    exampleSentence: 'Traveling is a wonderful experience.',
    pronunciationTip:
      'Stress the 2nd syllable: "ik-SPEER-ee-uns". The "x" sounds like /ks/. Don\'t say "ex-pe-ri-YENS" with stress at the end.',
    difficulty: 'intermediate',
  },
  {
    id: 'Wednesday',
    word: 'Wednesday',
    ipa: '/ˈwɛnzdeɪ/',
    partOfSpeech: 'noun',
    definition: 'The day of the week between Tuesday and Thursday.',
    exampleSentence: 'Our meeting is every Wednesday.',
    pronunciationTip:
      'The "d" is silent — say "WENZ-day", not "Wed-NES-day". This is one of the most commonly mispronounced English words.',
    difficulty: 'intermediate',
  },
  {
    id: 'February',
    word: 'February',
    ipa: '/ˈfɛbruˌɛri/',
    partOfSpeech: 'noun',
    definition: 'The second month of the year.',
    exampleSentence: 'Valentine\'s Day is in February.',
    pronunciationTip:
      'Keep the first "r": "FEB-roo-er-ee", not "Feb-yoo-ary". Start with /f/ (not "p"). Many speakers drop the first "r" — try to keep it.',
    difficulty: 'intermediate',
  },
  {
    id: 'clothes',
    word: 'clothes',
    ipa: '/kloʊðz/',
    partOfSpeech: 'noun',
    definition: 'Items worn to cover the body.',
    exampleSentence: 'She packed her clothes for the trip.',
    pronunciationTip:
      'Say it as one syllable: "klohz" (rhymes with "close"). Don\'t say "klo-thes" with two syllables. The "th" blends into a /ðz/ sound.',
    difficulty: 'intermediate',
  },
  {
    id: 'asked',
    word: 'asked',
    ipa: '/æskt/',
    partOfSpeech: 'verb',
    definition: 'Past tense of "ask"; to request information.',
    exampleSentence: 'She asked the teacher a question.',
    pronunciationTip:
      'End with the consonant cluster /skt/ — three consonants in a row. Say "askt", not "ask-ed". The "-ed" is just /t/ here.',
    difficulty: 'intermediate',
  },

  // ─── Advanced: Academic & Conversational Vocabulary ──────────────────────────

  {
    id: 'entrepreneur',
    word: 'entrepreneur',
    ipa: '/ˌɑːntrəprəˈnɜːr/',
    partOfSpeech: 'noun',
    definition: 'A person who sets up a business, taking on financial risk.',
    exampleSentence: 'She became a successful entrepreneur at age 25.',
    pronunciationTip:
      'Stress the last syllable: "on-truh-pruh-NUR". The "eur" ending is /ɜːr/ — like "er" with your tongue pulled back. Don\'t say "en-tre-pre-NYOR".',
    difficulty: 'advanced',
  },
  {
    id: 'specifically',
    word: 'specifically',
    ipa: '/spəˈsɪfɪkli/',
    partOfSpeech: 'adverb',
    definition: 'In a way that is exact and clearly defined.',
    exampleSentence: 'I specifically asked for no sugar in my coffee.',
    pronunciationTip:
      'Stress the 2nd syllable: "spuh-SIF-ik-lee". The word starts with the consonant cluster /sp/ — don\'t add "e" before it (not "es-pecifically").',
    difficulty: 'advanced',
  },
  {
    id: 'conscience',
    word: 'conscience',
    ipa: '/ˈkɑːnʃəns/',
    partOfSpeech: 'noun',
    definition: 'An inner feeling of right and wrong.',
    exampleSentence: 'His conscience told him to tell the truth.',
    pronunciationTip:
      'Only 2 syllables: "KON-shuns". The "sci" makes a /ʃ/ sound (like "sh"). Don\'t confuse with "conscious" (KON-shus) which is an adjective.',
    difficulty: 'advanced',
  },
  {
    id: 'pronunciation',
    word: 'pronunciation',
    ipa: '/prəˌnʌnsiˈeɪʃən/',
    partOfSpeech: 'noun',
    definition: 'The way in which a word is spoken.',
    exampleSentence: 'Good pronunciation helps people understand you better.',
    pronunciationTip:
      'Stress the 4th syllable: "pruh-nun-see-AY-shun". Common mistake: saying "pro-NOUNCE-ee-ay-shun" — there is no "ounce" in pronunciation!',
    difficulty: 'advanced',
  },
  {
    id: 'psychology',
    word: 'psychology',
    ipa: '/saɪˈkɑːlədʒi/',
    partOfSpeech: 'noun',
    definition: 'The scientific study of the mind and behavior.',
    exampleSentence: 'She wants to study psychology in college.',
    pronunciationTip:
      'The "p" is silent — say "sy-KOL-uh-jee". Stress the 2nd syllable. Don\'t say "psy-KOL-o-jee" with the "p" sound.',
    difficulty: 'advanced',
  },
  {
    id: 'receipt',
    word: 'receipt',
    ipa: '/rɪˈsiːt/',
    partOfSpeech: 'noun',
    definition: 'A written acknowledgment that payment has been received.',
    exampleSentence: 'Please keep the receipt for your records.',
    pronunciationTip:
      'The "p" is silent — say "rih-SEET". Don\'t pronounce it as "reh-SEPT". Stress is on the 2nd syllable.',
    difficulty: 'advanced',
  },
  {
    id: 'queue',
    word: 'queue',
    ipa: '/kjuː/',
    partOfSpeech: 'noun',
    definition: 'A line of people waiting for something.',
    exampleSentence: 'Please join the queue at the counter.',
    pronunciationTip:
      'Sounds exactly like the letter "Q" — just say "kyoo". The "ueue" is completely silent. One of English\'s most unusual spellings!',
    difficulty: 'advanced',
  },
  {
    id: 'chaos',
    word: 'chaos',
    ipa: '/ˈkeɪɑːs/',
    partOfSpeech: 'noun',
    definition: 'Complete disorder and confusion.',
    exampleSentence: 'The sudden storm caused chaos in the city.',
    pronunciationTip:
      'Say "KAY-oss", not "CHAH-os". The "ch" here makes a /k/ sound (Greek origin). Stress the first syllable.',
    difficulty: 'advanced',
  },
  {
    id: 'colonel',
    word: 'colonel',
    ipa: '/ˈkɜːrnəl/',
    partOfSpeech: 'noun',
    definition: 'A military rank above lieutenant colonel.',
    exampleSentence: 'The colonel led the regiment with authority.',
    pronunciationTip:
      'Pronounced "KUR-nul" — it sounds nothing like it looks! The spelling comes from Italian "colonello" but the pronunciation from French.',
    difficulty: 'advanced',
  },
  {
    id: 'subtle',
    word: 'subtle',
    ipa: '/ˈsʌtəl/',
    partOfSpeech: 'adjective',
    definition: 'So delicate or precise as to be difficult to notice.',
    exampleSentence: 'There was a subtle change in her tone.',
    pronunciationTip:
      'The "b" is silent — say "SUT-ul". Don\'t say "sub-tul". Stress the first syllable.',
    difficulty: 'advanced',
  },
  {
    id: 'island',
    word: 'island',
    ipa: '/ˈaɪlənd/',
    partOfSpeech: 'noun',
    definition: 'A piece of land surrounded by water.',
    exampleSentence: 'The Philippines has over 7,000 islands.',
    pronunciationTip:
      'The "s" is silent — say "EYE-lund". Don\'t pronounce the "s". The vowel starts with the diphthong /aɪ/ like "eye".',
    difficulty: 'advanced',
  },
  {
    id: 'vehicle',
    word: 'vehicle',
    ipa: '/ˈviːɪkəl/',
    partOfSpeech: 'noun',
    definition: 'A thing used for transporting people or goods.',
    exampleSentence: 'Every vehicle must have a license plate.',
    pronunciationTip:
      'The "h" is silent — say "VEE-ih-kul" (3 syllables). Start with /v/ (not "b"). Don\'t say "veh-HI-kul".',
    difficulty: 'advanced',
  },
  {
    id: 'muscle',
    word: 'muscle',
    ipa: '/ˈmʌsəl/',
    partOfSpeech: 'noun',
    definition: 'A band of tissue that contracts to produce movement.',
    exampleSentence: 'Exercise helps build strong muscles.',
    pronunciationTip:
      'The "c" is silent — say "MUS-ul". It sounds exactly like "mussel" (the shellfish). Don\'t say "mus-kul".',
    difficulty: 'advanced',
  },
  {
    id: 'communicate',
    word: 'communicate',
    ipa: '/kəˈmjuːnɪkeɪt/',
    partOfSpeech: 'verb',
    definition: 'To share or exchange information or ideas.',
    exampleSentence: 'It is important to communicate clearly.',
    pronunciationTip:
      'Stress the 2nd syllable: "kuh-MYOO-nih-kayt". The /juː/ sounds like "yoo". 4 syllables total — don\'t add extras.',
    difficulty: 'advanced',
  },
  {
    id: 'literature',
    word: 'literature',
    ipa: '/ˈlɪtərətʃər/',
    partOfSpeech: 'noun',
    definition: 'Written works, especially those considered to have artistic merit.',
    exampleSentence: 'Philippine literature is rich and diverse.',
    pronunciationTip:
      'Say "LIT-er-uh-chur" (4 syllables). Stress the 1st syllable. The "-ture" ending is /tʃər/ like "chur", not "tyoor".',
    difficulty: 'advanced',
  },
  {
    id: 'government',
    word: 'government',
    ipa: '/ˈɡʌvərnmənt/',
    partOfSpeech: 'noun',
    definition: 'The system by which a country or community is governed.',
    exampleSentence: 'The government announced new education reforms.',
    pronunciationTip:
      'Say "GUV-ern-munt" (3 syllables). Use /v/ not "b". The middle "n" is often dropped in casual speech but try to keep it clear.',
    difficulty: 'advanced',
  },
  {
    id: 'algorithm',
    word: 'algorithm',
    ipa: '/ˈælɡərɪðəm/',
    partOfSpeech: 'noun',
    definition: 'A step-by-step process for solving a problem or completing a task.',
    exampleSentence: 'The search algorithm finds the best results quickly.',
    pronunciationTip:
      'Stress the 1st syllable: "AL-guh-rith-um". The "th" is /ð/ (voiced, tongue between teeth). 4 syllables total.',
    difficulty: 'advanced',
  },
  {
    id: 'unfortunately',
    word: 'unfortunately',
    ipa: '/ʌnˈfɔːrtʃənətli/',
    partOfSpeech: 'adverb',
    definition: 'Used to express regret about something.',
    exampleSentence: 'Unfortunately, the event was cancelled.',
    pronunciationTip:
      'Stress the 2nd syllable: "un-FOR-chun-ut-lee". 5 syllables total. The "-nate-" reduces to /nət/. Start with a quick "un-".',
    difficulty: 'advanced',
  },
  {
    id: 'anonymous',
    word: 'anonymous',
    ipa: '/əˈnɑːnɪməs/',
    partOfSpeech: 'adjective',
    definition: 'Not identified by name; of unknown identity.',
    exampleSentence: 'The donation was made by an anonymous supporter.',
    pronunciationTip:
      'Stress the 2nd syllable: "uh-NON-ih-mus". 4 syllables. Don\'t stress the 1st syllable. The final "-mous" is just /məs/.',
    difficulty: 'advanced',
  },
  {
    id: 'courageous',
    word: 'courageous',
    ipa: '/kəˈreɪdʒəs/',
    partOfSpeech: 'adjective',
    definition: 'Not deterred by danger or pain; brave.',
    exampleSentence: 'The courageous firefighter saved three families.',
    pronunciationTip:
      'Stress the 2nd syllable: "kuh-RAY-jus". 3 syllables. The "-geous" ending sounds like "jus" /dʒəs/. Don\'t say "cour-AH-gee-ous".',
    difficulty: 'advanced',
  },
];
