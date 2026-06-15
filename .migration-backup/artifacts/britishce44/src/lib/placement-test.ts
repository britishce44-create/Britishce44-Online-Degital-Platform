// Britishce44 — Comprehensive auto-scored placement test.
// One holistic test covering all measurable skills (Listening, Grammar, Vocabulary,
// Reading, Use of English), graduated A1 -> C2, scored automatically into a CEFR
// level + the school's program placement (Kids Basic 1-12 / Adult Speakout), with a
// per-skill breakdown, strengths/weaknesses and AI-style recommendations.

export type Cefr = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
export type Skill = 'Listening' | 'Grammar' | 'Vocabulary' | 'Reading' | 'Use of English'

export interface Question {
  id: string
  skill: Skill
  cefr: Cefr
  prompt: string
  options: string[]
  answer: number
  passageId?: string
  audioScript?: string
}

export interface Passage {
  id: string
  title: string
  text: string
}

export const SKILLS: Skill[] = ['Listening', 'Grammar', 'Vocabulary', 'Reading', 'Use of English']

export const SKILL_META: Record<Skill, { icon: string; color: string; tint: string }> = {
  Listening: { icon: '🎧', color: '#2620a8', tint: 'rgba(38,32,168,0.10)' },
  Grammar: { icon: '🧩', color: '#150d79', tint: 'rgba(21,13,121,0.10)' },
  Vocabulary: { icon: '📚', color: '#0a85c2', tint: 'rgba(10,133,194,0.12)' },
  Reading: { icon: '📖', color: '#00805a', tint: 'rgba(0,128,90,0.12)' },
  'Use of English': { icon: '✒️', color: '#b45309', tint: 'rgba(180,83,9,0.12)' },
}

export const PASSAGES: Passage[] = [
  {
    id: 'p1',
    title: 'Tom’s Village',
    text:
      'Tom lives in a small village near the mountains. Every morning he walks to school with his sister. ' +
      'After school, they help their parents on the farm. On weekends, Tom likes to read books about animals.',
  },
  {
    id: 'p2',
    title: 'Online Learning',
    text:
      'Online learning has become increasingly popular over the last decade. It allows students to study at ' +
      'their own pace and from any location. However, some learners find it difficult to stay motivated without ' +
      'a traditional classroom. Experts suggest setting a fixed schedule and taking regular breaks to stay focused.',
  },
  {
    id: 'p3',
    title: 'The Nature of Creativity',
    text:
      'While many assume that creativity is an innate gift, recent research suggests it is a skill that can be ' +
      'cultivated through deliberate practice. Individuals who expose themselves to diverse experiences and embrace ' +
      'failure as part of the process tend to generate more original ideas.',
  },
]

// ~40 graduated items. Answer = index of the correct option.
export const QUESTIONS: Question[] = [
  // ---------- LISTENING (read aloud via speech synthesis) ----------
  {
    id: 'l1', skill: 'Listening', cefr: 'A1',
    audioScript: 'Hello! My name is Sara. I am ten years old and I live in Taiz.',
    prompt: 'How old is Sara?',
    options: ['Nine', 'Ten', 'Eleven', 'Twelve'], answer: 1,
  },
  {
    id: 'l2', skill: 'Listening', cefr: 'A2',
    audioScript: 'The library opens at nine o’clock in the morning and closes at five in the afternoon. It is closed on Fridays.',
    prompt: 'When is the library closed?',
    options: ['In the morning', 'At nine o’clock', 'On Fridays', 'At five o’clock'], answer: 2,
  },
  {
    id: 'l3', skill: 'Listening', cefr: 'B1',
    audioScript: 'I was going to take the bus to work, but it started raining heavily, so I decided to call a taxi instead.',
    prompt: 'How did the speaker finally go to work?',
    options: ['By bus', 'On foot', 'By taxi', 'By train'], answer: 2,
  },
  {
    id: 'l4', skill: 'Listening', cefr: 'B1',
    audioScript: 'Could you tell Mr. Adams that the meeting has been moved from Tuesday to Thursday at the same time?',
    prompt: 'What is the new day of the meeting?',
    options: ['Tuesday', 'Wednesday', 'Thursday', 'Friday'], answer: 2,
  },
  {
    id: 'l5', skill: 'Listening', cefr: 'B2',
    audioScript: 'Although the company reported record profits this year, the manager warned that next year could be far more challenging due to rising costs.',
    prompt: 'What does the manager think about next year?',
    options: ['It will be easier', 'It will be more difficult', 'Profits will rise', 'Costs will fall'], answer: 1,
  },
  {
    id: 'l6', skill: 'Listening', cefr: 'C1',
    audioScript: 'Had I known the presentation would be cancelled, I wouldn’t have spent the whole weekend preparing my slides.',
    prompt: 'What is true about the speaker?',
    options: ['The presentation took place', 'The speaker knew it was cancelled', 'The speaker prepared for nothing', 'The speaker did not prepare'], answer: 2,
  },

  // ---------- GRAMMAR ----------
  { id: 'g1', skill: 'Grammar', cefr: 'A1', prompt: 'She ___ a teacher.', options: ['am', 'is', 'are', 'be'], answer: 1 },
  { id: 'g2', skill: 'Grammar', cefr: 'A1', prompt: 'There ___ two books on the table.', options: ['is', 'are', 'am', 'be'], answer: 1 },
  { id: 'g3', skill: 'Grammar', cefr: 'A2', prompt: 'I ___ to the cinema last night.', options: ['go', 'went', 'gone', 'going'], answer: 1 },
  { id: 'g4', skill: 'Grammar', cefr: 'A2', prompt: 'He is ___ than his brother.', options: ['tall', 'taller', 'tallest', 'more tall'], answer: 1 },
  { id: 'g5', skill: 'Grammar', cefr: 'A2', prompt: 'If it rains, we ___ at home.', options: ['stay', 'stayed', 'will stay', 'would stay'], answer: 2 },
  { id: 'g6', skill: 'Grammar', cefr: 'B1', prompt: 'I have lived here ___ 2015.', options: ['since', 'for', 'from', 'at'], answer: 0 },
  { id: 'g7', skill: 'Grammar', cefr: 'B1', prompt: 'The car ___ by a famous designer.', options: ['designs', 'designed', 'was designed', 'is designing'], answer: 2 },
  { id: 'g8', skill: 'Grammar', cefr: 'B1', prompt: 'She asked me where I ___.', options: ['live', 'lived', 'have lived', 'living'], answer: 1 },
  { id: 'g9', skill: 'Grammar', cefr: 'B2', prompt: 'By the time we arrived, the film ___.', options: ['started', 'has started', 'had started', 'was starting'], answer: 2 },
  { id: 'g10', skill: 'Grammar', cefr: 'B2', prompt: 'I wish I ___ more time to finish the project.', options: ['have', 'had', 'will have', 'having'], answer: 1 },
  { id: 'g11', skill: 'Grammar', cefr: 'C1', prompt: '___ harder, she would have passed the exam.', options: ['If she studied', 'Had she studied', 'Has she studied', 'If she had study'], answer: 1 },
  { id: 'g12', skill: 'Grammar', cefr: 'C2', prompt: 'Not only ___ late, but he also forgot the documents.', options: ['he was', 'was he', 'he is', 'is he'], answer: 1 },

  // ---------- VOCABULARY ----------
  { id: 'v1', skill: 'Vocabulary', cefr: 'A1', prompt: 'The opposite of “hot” is ___.', options: ['cold', 'warm', 'big', 'fast'], answer: 0 },
  { id: 'v2', skill: 'Vocabulary', cefr: 'A1', prompt: 'A place where you borrow books is a ___.', options: ['kitchen', 'library', 'garden', 'station'], answer: 1 },
  { id: 'v3', skill: 'Vocabulary', cefr: 'A2', prompt: 'Choose the synonym of “happy”.', options: ['sad', 'angry', 'glad', 'tired'], answer: 2 },
  { id: 'v4', skill: 'Vocabulary', cefr: 'A2', prompt: 'She is very ___; she always helps others.', options: ['selfish', 'kind', 'lazy', 'rude'], answer: 1 },
  { id: 'v5', skill: 'Vocabulary', cefr: 'B1', prompt: 'We need to ___ a decision soon.', options: ['make', 'do', 'take', 'get'], answer: 0 },
  { id: 'v6', skill: 'Vocabulary', cefr: 'B1', prompt: 'The synonym of “difficult” is ___.', options: ['easy', 'simple', 'hard', 'light'], answer: 2 },
  { id: 'v7', skill: 'Vocabulary', cefr: 'B2', prompt: 'The teacher asked us to ___ attention.', options: ['pay', 'give', 'make', 'do'], answer: 0 },
  { id: 'v8', skill: 'Vocabulary', cefr: 'B2', prompt: 'A person who cannot stop doing something is ___ to it.', options: ['addicted', 'attracted', 'attached', 'adapted'], answer: 0 },
  { id: 'v9', skill: 'Vocabulary', cefr: 'C1', prompt: 'The report was ___; it left out several key facts.', options: ['comprehensive', 'misleading', 'transparent', 'thorough'], answer: 1 },

  // ---------- READING ----------
  { id: 'r1', skill: 'Reading', cefr: 'A2', passageId: 'p1', prompt: 'How does Tom go to school?', options: ['By bus', 'By car', 'On foot', 'By bike'], answer: 2 },
  { id: 'r2', skill: 'Reading', cefr: 'A2', passageId: 'p1', prompt: 'What does Tom like to read about?', options: ['Mountains', 'Animals', 'Farms', 'Villages'], answer: 1 },
  { id: 'r3', skill: 'Reading', cefr: 'B1', passageId: 'p2', prompt: 'One advantage of online learning is that students can ___.', options: ['study only at night', 'study at their own pace', 'avoid all exams', 'never use computers'], answer: 1 },
  { id: 'r4', skill: 'Reading', cefr: 'B1', passageId: 'p2', prompt: 'What problem does the text mention?', options: ['It is too expensive', 'Staying motivated', 'Poor internet', 'Too many teachers'], answer: 1 },
  { id: 'r5', skill: 'Reading', cefr: 'B2', passageId: 'p2', prompt: 'What do experts recommend?', options: ['Studying without breaks', 'Setting a fixed schedule', 'Avoiding any schedule', 'Studying in groups only'], answer: 1 },
  { id: 'r6', skill: 'Reading', cefr: 'C1', passageId: 'p3', prompt: 'What is the main idea of the passage?', options: ['Creativity cannot be learned', 'Creativity can be developed', 'Only gifted people are creative', 'Failure prevents creativity'], answer: 1 },
  { id: 'r7', skill: 'Reading', cefr: 'C1', passageId: 'p3', prompt: 'According to the text, embracing failure ___.', options: ['reduces creativity', 'is unrelated to creativity', 'helps generate original ideas', 'should be avoided'], answer: 2 },

  // ---------- USE OF ENGLISH ----------
  { id: 'u1', skill: 'Use of English', cefr: 'A2', prompt: 'Choose the correct question word: “___ do you live?”', options: ['What', 'Where', 'When', 'Who'], answer: 1 },
  { id: 'u2', skill: 'Use of English', cefr: 'B1', prompt: 'Complete: “She’s good ___ mathematics.”', options: ['in', 'at', 'on', 'for'], answer: 1 },
  {
    id: 'u3', skill: 'Use of English', cefr: 'B1', prompt: 'Choose the correctly written sentence.',
    options: [
      'Its raining, so take you’re umbrella.',
      'It’s raining, so take your umbrella.',
      'Its raining, so take your umbrella.',
      'It’s raining, so take you’re umbrella.',
    ], answer: 1,
  },
  { id: 'u4', skill: 'Use of English', cefr: 'B2', prompt: 'Complete: “Despite ___ hard, he failed the exam.”', options: ['study', 'studies', 'studying', 'studied'], answer: 2 },
  { id: 'u5', skill: 'Use of English', cefr: 'C1', prompt: 'Choose the most formal alternative to “find out”.', options: ['check out', 'look into', 'ascertain', 'dig up'], answer: 2 },
]

export const TOTAL_QUESTIONS = QUESTIONS.length

export interface LevelBand {
  min: number
  max: number
  cefr: Cefr
  title: string
  kids: string
  adult: string
  book: string
  blurb: string
  color: string
  gradient: string
}

// Overall-% bands -> CEFR + the school's program placement.
export const LEVEL_BANDS: LevelBand[] = [
  {
    min: 0, max: 24, cefr: 'A1', title: 'A1 · Beginner',
    kids: 'Kids: Basic 1–2', adult: 'Adult: Speakout Starter',
    book: 'Gogo Loves English 1 / Speakout Starter',
    blurb: 'You are starting your English journey. We will build strong foundations in everyday words and simple sentences.',
    color: '#00ae74', gradient: 'linear-gradient(135deg,#00805a,#00ae74)',
  },
  {
    min: 25, max: 41, cefr: 'A2', title: 'A2 · Elementary',
    kids: 'Kids: Basic 3–5', adult: 'Adult: Speakout Elementary',
    book: 'Fly High 2–3 / Speakout Elementary',
    blurb: 'You can handle basic everyday English. Next we strengthen past tenses, common vocabulary and short conversations.',
    color: '#0a85c2', gradient: 'linear-gradient(135deg,#0a85c2,#3FBAEB)',
  },
  {
    min: 42, max: 58, cefr: 'B1', title: 'B1 · Pre-Intermediate',
    kids: 'Kids: Basic 6–8', adult: 'Adult: Speakout Pre-Intermediate',
    book: 'Fly High 4 / Speakout Pre-Intermediate',
    blurb: 'You communicate on familiar topics with growing confidence. We now focus on tenses, connectors and longer texts.',
    color: '#3FBAEB', gradient: 'linear-gradient(135deg,#2620a8,#3FBAEB)',
  },
  {
    min: 59, max: 74, cefr: 'B2', title: 'B2 · Upper-Intermediate',
    kids: 'Kids: Basic 9–10', adult: 'Adult: Speakout Intermediate',
    book: 'Speakout Intermediate / Upper-Intermediate',
    blurb: 'You express ideas clearly on many topics. Next we refine complex grammar, nuance and academic reading.',
    color: '#2620a8', gradient: 'linear-gradient(135deg,#150d79,#2620a8)',
  },
  {
    min: 75, max: 88, cefr: 'C1', title: 'C1 · Advanced',
    kids: 'Kids: Basic 11–12', adult: 'Adult: Speakout Upper-Intermediate / Advanced',
    book: 'Speakout Advanced',
    blurb: 'You use English flexibly and accurately. We will polish advanced structures, register and fluency.',
    color: '#150d79', gradient: 'linear-gradient(135deg,#150d79,#2620a8)',
  },
  {
    min: 89, max: 100, cefr: 'C2', title: 'C2 · Proficiency',
    kids: 'Kids: Mastery track', adult: 'Adult: Speakout Advanced Plus / IELTS · TOEFL prep',
    book: 'Speakout Advanced Plus / Exam Mastery',
    blurb: 'You handle English at near-native level. We recommend exam mastery (IELTS / TOEFL) and advanced communication.',
    color: '#7c3aed', gradient: 'linear-gradient(135deg,#5b21b6,#7c3aed)',
  },
]

export function bandFor(pct: number): LevelBand {
  return LEVEL_BANDS.find((b) => pct >= b.min && pct <= b.max) ?? LEVEL_BANDS[0]
}

export interface SkillScore {
  skill: Skill
  correct: number
  total: number
  pct: number
}

export interface PlacementResult {
  correct: number
  total: number
  overallPct: number
  band: LevelBand
  cefrCeiling: Cefr
  skills: SkillScore[]
  strengths: Skill[]
  weaknesses: Skill[]
  recommendations: string[]
}

const SKILL_ADVICE: Record<Skill, string> = {
  Listening:
    'Strengthen listening: join the daily Listening Club, replay each dialogue twice, and practise “listen-and-choose” and gap-fill tasks.',
  Grammar:
    'Focus on grammar: review tenses, modals, prepositions and conditionals in the Grammar Lab and complete Grammar Practice sets 1–3.',
  Vocabulary:
    'Grow your vocabulary: learn 10 new words a day with the flashcard deck and practise synonyms, antonyms and collocations.',
  Reading:
    'Improve reading: read one short article a day and practise skimming for the main idea and scanning for details.',
  'Use of English':
    'Sharpen use of English: drill word formation, prepositions and punctuation with the targeted use-of-English quizzes.',
}

const CEFR_ORDER: Cefr[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

export function scoreTest(answers: Record<string, number>): PlacementResult {
  const total = QUESTIONS.length
  let correct = 0

  const perSkill: Record<Skill, { correct: number; total: number }> = {
    Listening: { correct: 0, total: 0 },
    Grammar: { correct: 0, total: 0 },
    Vocabulary: { correct: 0, total: 0 },
    Reading: { correct: 0, total: 0 },
    'Use of English': { correct: 0, total: 0 },
  }
  const perCefr: Record<Cefr, { correct: number; total: number }> = {
    A1: { correct: 0, total: 0 }, A2: { correct: 0, total: 0 }, B1: { correct: 0, total: 0 },
    B2: { correct: 0, total: 0 }, C1: { correct: 0, total: 0 }, C2: { correct: 0, total: 0 },
  }

  for (const q of QUESTIONS) {
    const picked = answers[q.id]
    const right = picked === q.answer
    perSkill[q.skill].total += 1
    perCefr[q.cefr].total += 1
    if (right) {
      correct += 1
      perSkill[q.skill].correct += 1
      perCefr[q.cefr].correct += 1
    }
  }

  const overallPct = Math.round((correct / total) * 100)
  const band = bandFor(overallPct)

  const skills: SkillScore[] = SKILLS.map((s) => ({
    skill: s,
    correct: perSkill[s].correct,
    total: perSkill[s].total,
    pct: perSkill[s].total ? Math.round((perSkill[s].correct / perSkill[s].total) * 100) : 0,
  }))

  // Highest CEFR level where the learner answered the majority correctly.
  let cefrCeiling: Cefr = 'A1'
  for (const lvl of CEFR_ORDER) {
    const c = perCefr[lvl]
    if (c.total > 0 && c.correct / c.total >= 0.6) cefrCeiling = lvl
  }

  const sorted = [...skills].sort((a, b) => b.pct - a.pct)
  const strengths = sorted.filter((s) => s.pct >= 70).slice(0, 2).map((s) => s.skill)
  const weaknesses = [...skills].sort((a, b) => a.pct - b.pct).filter((s) => s.pct < 60).slice(0, 2).map((s) => s.skill)

  const recommendations: string[] = []
  recommendations.push(
    `Recommended placement: ${band.adult} (or ${band.kids} for young learners). Begin with ${band.book}.`,
  )
  for (const w of weaknesses) recommendations.push(SKILL_ADVICE[w])
  if (strengths.length) {
    recommendations.push(
      `Keep building on your strongest area${strengths.length > 1 ? 's' : ''} — ${strengths.join(' and ')} — with extension tasks so you keep progressing.`,
    )
  }
  if (weaknesses.length === 0) {
    recommendations.push('Excellent balance across all skills. Aim for the next level up and consider an exam-prep track (IELTS / TOEFL).')
  }

  return { correct, total, overallPct, band, cefrCeiling, skills, strengths, weaknesses, recommendations }
}
