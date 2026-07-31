// Self-check quiz questions, keyed by page path the same way
// lib/pathway-content.ts is keyed.
//
// Only Glycolysis ships with questions, as the worked example. Every other
// page starts empty and is filled in from the page itself by the
// administrator — see components/pathway-quiz.tsx. An empty entry here is not
// a gap to fill in code: it is the normal state until someone writes the
// questions in the browser, and what they write is stored in site_content, not
// in this file.

/**
 * 'choice' is an ordinary multiple-choice question, whose options the editor
 * writes and the player shuffles. 'ox' is true/false: its two options are fixed
 * and never shuffled, since a reordered O/X only reads as a typo.
 */
export type QuizKind = 'choice' | 'ox'

export type QuizQuestion = {
  /** Stable across a shuffle, so a retry can pick the missed ones back out. */
  id: string
  kind: QuizKind
  prompt: string
  choices: string[]
  /** Index into `choices` as written below — remapped when they are shuffled. */
  answer: number
  /** Shown once the answer is revealed, right or wrong. This is the teaching. */
  explanation: string
}

// Keyed by `${categorySlug}/${pathwaySlug}`, or `${…}/${childSlug}` for a
// depth-3 sub-topic.
export const pathwayQuiz: Record<string, QuizQuestion[]> = {
  // Five questions, one per thing worth remembering: where it happens, what it
  // yields, what governs its speed, that it needs no oxygen, and what keeps it
  // running when there is none. Detail beyond that belongs in the article.
  'carbohydrate-metabolism/glycolysis': [
    {
      id: 'location',
      kind: 'choice',
      prompt: '해당과정(glycolysis)이 일어나는 세포 내 장소는?',
      choices: ['세포질(cytosol)', '미토콘드리아 기질', '미토콘드리아 내막', '소포체'],
      answer: 0,
      explanation:
        '해당과정의 10단계는 모두 세포질에서 일어난다. 산물인 피루브산이 미토콘드리아로 들어가 아세틸-CoA로 바뀌는 것은 그다음 과정이다.',
    },
    {
      id: 'net-atp',
      kind: 'choice',
      prompt: '포도당 1분자가 해당과정을 거칠 때 생성되는 순(net) ATP는?',
      choices: ['2 ATP', '4 ATP', '32 ATP', '0 ATP'],
      answer: 0,
      explanation:
        '투자기에서 2 ATP를 쓰고 회수기에서 4 ATP를 만들므로 순 생성량은 2 ATP다. 함께 2 NADH와 2 피루브산이 나온다.',
    },
    {
      id: 'rate-limiting',
      kind: 'choice',
      prompt: '해당과정 전체의 속도를 결정하는 가장 중요한 조절 효소는?',
      choices: [
        'PFK-1 (phosphofructokinase-1)',
        'Hexokinase',
        'Pyruvate kinase',
        'Aldolase',
      ],
      answer: 0,
      explanation:
        'PFK-1이 속도조절 단계다. ATP와 시트르산에 의해 억제되고, AMP와 프럭토스 2,6-이인산(F-2,6-BP)에 의해 활성화된다.',
    },
    {
      id: 'oxygen',
      kind: 'ox',
      prompt: 'O/X — 해당과정은 산소가 있어야만 진행될 수 있다.',
      choices: ['O', 'X'],
      answer: 1,
      explanation:
        'X. 해당과정 자체는 산소를 쓰지 않는다. 다만 NAD+가 계속 공급되어야 하므로, 무산소 조건에서는 젖산 발효로 NAD+를 재생해 경로를 이어간다.',
    },
    {
      id: 'lactate',
      kind: 'choice',
      prompt: '무산소 조건에서 피루브산이 젖산으로 환원되는 가장 큰 이유는?',
      choices: [
        '해당과정에 필요한 NAD+를 재생하기 위해',
        '젖산에서 직접 ATP를 얻기 위해',
        '피루브산의 독성을 없애기 위해',
        '산소를 저장해 두기 위해',
      ],
      answer: 0,
      explanation:
        '젖산 탈수소효소 반응은 ATP를 만들지 않는다. NADH를 NAD+로 되돌려 GAPDH 단계가 계속 돌아가게 하는 것이 목적이며, 그래야 해당과정이 멈추지 않는다.',
    },
  ],
}

/** The questions a page ships with, before any edit. Usually none. */
export function quizSeed(path: string): QuizQuestion[] {
  return pathwayQuiz[path] ?? []
}
