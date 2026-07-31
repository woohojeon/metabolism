'use client'

import { Check, Pencil, RotateCcw, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/components/auth-provider'
import { sanitizeRich } from '@/lib/rich-text'
import { type QuizKind, type QuizQuestion, quizSeed } from '@/lib/pathway-quiz'
import { clearPathwayQuiz, loadPathwayQuiz, savePathwayQuiz } from '@/lib/edits'

// A self-check quiz, answered one question at a time: picking a choice reveals
// the verdict and the explanation straight away rather than saving the score
// for the end. The point is studying, not examining — a wrong answer should
// teach on the spot, while the reader still remembers why they picked it.
//
// The questions themselves are the administrator's to write, and they are
// stored like every other page edit (lib/edits.ts -> /api/content), so a change
// made on one computer is what every student loads. `isAdmin` only decides
// whether the editing UI is drawn; the write itself is refused server-side
// unless the request carries the administrator cookie set by /api/login, so
// nothing a student does in their own browser can rewrite a question.
//
// A reader's own score is a different thing entirely and stays in localStorage:
// students have no write access to the shared document, and shouldn't.
//
// Every pathway page carries this block, but only Glycolysis ships with
// questions. Elsewhere it stays invisible to readers until the administrator
// writes some — an empty quiz is not something a student should be shown.

const PROGRESS_PREFIX = 'metabolism-quiz-progress:'

export function PathwayQuiz({ path }: { path: string }) {
  const { isAdmin } = useAuth()
  // The questions the page ships with, used until a saved edit replaces them.
  const seed = useMemo(() => quizSeed(path), [path])
  const [questions, setQuestions] = useState<QuizQuestion[]>(seed)
  // Non-null means the administrator is editing; the player is hidden meanwhile.
  const [draft, setDraft] = useState<QuizQuestion[] | null>(null)
  const [hasEdits, setHasEdits] = useState(false)

  useEffect(() => {
    let stale = false
    loadPathwayQuiz(path).then((saved) => {
      if (stale || !saved) return
      setQuestions(saved)
      setHasEdits(true)
    })
    return () => {
      stale = true
    }
  }, [path])

  // Drop out of edit mode if the administrator logs out mid-edit.
  useEffect(() => {
    if (!isAdmin) setDraft(null)
  }, [isAdmin])

  // Saving reaches the server, so it can fail. Stay in edit mode when it does,
  // rather than showing questions no other visitor would see.
  async function save() {
    if (!draft) return
    const cleaned = normalize(draft)
    if (typeof cleaned === 'string') {
      window.alert(cleaned)
      return
    }
    try {
      await savePathwayQuiz(path, cleaned)
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '저장하지 못했습니다.')
      return
    }
    setQuestions(cleaned)
    setHasEdits(true)
    setDraft(null)
  }

  async function resetToOriginal() {
    if (!window.confirm(seed.length ? '퀴즈를 원래 문제로 되돌립니다.' : '이 페이지의 퀴즈를 모두 삭제합니다.')) {
      return
    }
    try {
      await clearPathwayQuiz(path)
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '되돌리지 못했습니다.')
      return
    }
    setQuestions(seed)
    setHasEdits(false)
    setDraft(null)
  }

  const editing = draft !== null

  // Nothing written yet: the administrator sees the way in, a reader sees no
  // section at all rather than an empty one.
  if (!editing && questions.length === 0 && !isAdmin) return null

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between gap-3 border-t-2 border-foreground pt-3">
        <h2 className="text-lg font-extrabold uppercase tracking-wide">Quiz</h2>

        {editing ? (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={save}
              className="rounded bg-science-red px-3 py-1 text-[12px] font-bold text-white transition-opacity hover:opacity-90"
            >
              저장
            </button>
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="rounded border border-neutral-300 px-3 py-1 text-[12px] font-bold text-neutral-600 transition-colors hover:border-neutral-500"
            >
              취소
            </button>
          </div>
        ) : (
          <div className="flex shrink-0 items-center gap-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              {questions.length} questions
            </span>
            {isAdmin && (
              <button
                type="button"
                // Opening an empty quiz starts one question, so there is
                // something to type into rather than a bare "add" button.
                onClick={() =>
                  setDraft(
                    questions.length ? structuredClone(questions) : [blankQuestion('choice')],
                  )
                }
                className="inline-flex items-center gap-1 rounded border border-science-red/40 bg-science-red/5 px-2.5 py-1 text-[12px] font-bold text-science-red transition-colors hover:bg-science-red/10"
              >
                <Pencil className="size-[13px]" />
                편집
              </button>
            )}
          </div>
        )}
      </div>

      {editing ? (
        <QuizEditor questions={draft} onChange={setDraft} />
      ) : questions.length === 0 ? (
        <p className="mt-4 rounded border border-dashed border-neutral-300 bg-panel px-4 py-8 text-center text-[13px] text-neutral-500">
          아직 문제가 없습니다. <b className="font-bold">편집</b>을 눌러 이 페이지의 퀴즈를
          만들어 주세요.
          <br />
          문제를 저장하기 전까지 학생에게는 이 영역이 보이지 않습니다.
        </p>
      ) : (
        // Remount on an edit, so a half-finished attempt cannot carry a stale
        // deck into the new question set.
        <QuizPlayer
          key={questions.map((q) => q.id).join('|')}
          questions={questions}
          progressKey={path}
        />
      )}

      {isAdmin && hasEdits && !editing && (
        <div className="mt-3 text-right">
          <button
            type="button"
            onClick={resetToOriginal}
            className="text-[12px] font-bold text-neutral-400 transition-colors hover:text-science-red"
          >
            {seed.length ? '원래 문제로 되돌리기' : '퀴즈 전체 삭제'}
          </button>
        </div>
      )}
    </section>
  )
}

// ---------------------------------------------------------------------------
// Editing

function blankQuestion(kind: QuizKind): QuizQuestion {
  return {
    id: `q${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    kind,
    prompt: '',
    choices: kind === 'ox' ? ['O', 'X'] : ['', '', '', ''],
    answer: 0,
    explanation: '',
  }
}

/**
 * Tidies a draft for storage, or returns the message to show the editor when a
 * question is unusable. Blank choices are dropped rather than published, and
 * `answer` is re-pointed at whatever the correct choice ended up as.
 */
function normalize(draft: QuizQuestion[]): QuizQuestion[] | string {
  if (draft.length === 0) return '문제를 한 개 이상 만들어 주세요.'

  const out: QuizQuestion[] = []
  for (const [i, q] of draft.entries()) {
    const prompt = q.prompt.trim()
    const explanation = q.explanation.trim()
    if (!prompt) return `${i + 1}번 문제의 지문을 입력해 주세요.`

    if (q.kind === 'ox') {
      out.push({ ...q, prompt, explanation, choices: ['O', 'X'], answer: q.answer === 1 ? 1 : 0 })
      continue
    }

    const kept = q.choices
      .map((text, at) => ({ text: text.trim(), at }))
      .filter((c) => c.text)
    if (kept.length < 2) return `${i + 1}번 문제의 보기를 두 개 이상 입력해 주세요.`

    const answer = kept.findIndex((c) => c.at === q.answer)
    if (answer < 0) return `${i + 1}번 문제는 정답으로 고른 보기가 비어 있습니다.`

    out.push({ ...q, prompt, explanation, choices: kept.map((c) => c.text), answer })
  }
  return out
}

function QuizEditor({
  questions,
  onChange,
}: {
  questions: QuizQuestion[]
  onChange: (questions: QuizQuestion[]) => void
}) {
  function update(i: number, patch: Partial<QuizQuestion>) {
    onChange(questions.map((q, j) => (j === i ? { ...q, ...patch } : q)))
  }

  // Switching type throws the old options away: O/X has its own fixed pair, and
  // a multiple-choice question can't be built out of 'O' and 'X'.
  function setKind(i: number, kind: QuizKind) {
    if (questions[i].kind === kind) return
    update(i, {
      kind,
      choices: kind === 'ox' ? ['O', 'X'] : ['', '', '', ''],
      answer: 0,
    })
  }

  function setChoice(i: number, at: number, text: string) {
    update(i, { choices: questions[i].choices.map((c, j) => (j === at ? text : c)) })
  }

  function removeChoice(i: number, at: number) {
    const q = questions[i]
    update(i, {
      choices: q.choices.filter((_, j) => j !== at),
      // Keep the same option marked correct as the list closes up.
      answer: q.answer > at ? q.answer - 1 : q.answer === at ? 0 : q.answer,
    })
  }

  return (
    <div className="mt-4 space-y-4">
      {questions.map((q, i) => (
        <div key={q.id} className="rounded border border-neutral-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              문제 {i + 1}
            </span>
            <div className="flex items-center gap-2">
              {/* Question type — the editor's choice, per question. */}
              <div className="flex overflow-hidden rounded border border-neutral-300">
                {(
                  [
                    ['choice', '객관식'],
                    ['ox', 'O/X'],
                  ] as [QuizKind, string][]
                ).map(([kind, label]) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => setKind(i, kind)}
                    className={`px-2.5 py-1 text-[11px] font-bold transition-colors ${
                      q.kind === kind
                        ? 'bg-science-red text-white'
                        : 'bg-white text-neutral-500 hover:text-science-red'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => onChange(questions.filter((_, j) => j !== i))}
                className="rounded border border-neutral-300 px-2 py-1 text-[11px] font-bold text-neutral-400 transition-colors hover:border-science-red hover:text-science-red"
              >
                문제 삭제
              </button>
            </div>
          </div>

          <textarea
            value={q.prompt}
            onChange={(e) => update(i, { prompt: e.target.value })}
            rows={2}
            placeholder="문제 지문"
            className="mt-3 w-full resize-y rounded border border-neutral-300 px-3 py-2 text-[15px] leading-snug text-foreground focus:border-science-red focus:outline-none"
          />

          <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
            {q.kind === 'ox' ? '정답' : '보기 — 왼쪽 동그라미로 정답을 지정하세요'}
          </p>

          <div className="mt-2 space-y-2">
            {q.choices.map((choice, at) => (
              <div key={at} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`answer-${q.id}`}
                  checked={q.answer === at}
                  onChange={() => update(i, { answer: at })}
                  aria-label={`${at + 1}번 보기를 정답으로 지정`}
                  className="size-4 shrink-0 accent-science-red"
                />
                {q.kind === 'ox' ? (
                  <span className="text-[14px] font-bold text-foreground">{choice}</span>
                ) : (
                  <>
                    <input
                      type="text"
                      value={choice}
                      onChange={(e) => setChoice(i, at, e.target.value)}
                      placeholder={`보기 ${at + 1}`}
                      className="w-full rounded border border-neutral-300 px-2.5 py-1.5 text-[14px] text-foreground focus:border-science-red focus:outline-none"
                    />
                    {q.choices.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeChoice(i, at)}
                        aria-label={`보기 ${at + 1} 삭제`}
                        className="shrink-0 rounded border border-neutral-300 p-1.5 text-neutral-400 transition-colors hover:border-science-red hover:text-science-red"
                      >
                        <X className="size-[13px]" />
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          {q.kind === 'choice' && q.choices.length < 6 && (
            <button
              type="button"
              onClick={() => update(i, { choices: [...q.choices, ''] })}
              className="mt-2 text-[12px] font-bold text-science-red hover:underline"
            >
              + 보기 추가
            </button>
          )}

          <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
            해설 — 답을 고른 뒤 보여집니다
          </p>
          <textarea
            value={q.explanation}
            onChange={(e) => update(i, { explanation: e.target.value })}
            rows={2}
            placeholder="왜 그 답인지 설명"
            className="mt-2 w-full resize-y rounded border border-neutral-300 px-3 py-2 text-[14px] leading-relaxed text-neutral-700 focus:border-science-red focus:outline-none"
          />
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onChange([...questions, blankQuestion('choice')])}
          className="rounded border border-science-red/40 bg-science-red/5 px-3 py-1.5 text-[12px] font-bold text-science-red transition-colors hover:bg-science-red/10"
        >
          + 객관식 문제 추가
        </button>
        <button
          type="button"
          onClick={() => onChange([...questions, blankQuestion('ox')])}
          className="rounded border border-science-red/40 bg-science-red/5 px-3 py-1.5 text-[12px] font-bold text-science-red transition-colors hover:bg-science-red/10"
        >
          + O/X 문제 추가
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Answering

/** One question with its choices in the order they will be shown. */
type Shuffled = {
  question: QuizQuestion
  choices: string[]
  answer: number
}

function shuffle<T>(items: T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function prepare(questions: QuizQuestion[]): Shuffled[] {
  return shuffle(questions).map((question) => {
    // O/X keeps its natural order — shuffling it would only read as a typo.
    if (question.kind === 'ox') {
      return { question, choices: question.choices, answer: question.answer }
    }
    const correct = question.choices[question.answer]
    const choices = shuffle(question.choices)
    return { question, choices, answer: choices.indexOf(correct) }
  })
}

function QuizPlayer({
  questions,
  progressKey,
}: {
  questions: QuizQuestion[]
  progressKey: string
}) {
  const { user } = useAuth()

  // Built in an effect, not in useState: shuffling during render would give the
  // server and the client different orders and break hydration.
  const [deck, setDeck] = useState<Shuffled[] | null>(null)
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [missed, setMissed] = useState<string[]>([])
  const [done, setDone] = useState(false)
  const [best, setBest] = useState<number | null>(null)

  const storageKey = `${PROGRESS_PREFIX}${user ?? 'guest'}:${progressKey}`

  const start = useCallback((pool: QuizQuestion[]) => {
    setDeck(prepare(pool))
    setIndex(0)
    setPicked(null)
    setMissed([])
    setDone(false)
  }, [])

  useEffect(() => {
    start(questions)
  }, [questions, start])

  // A best score only means something against the same number of questions, so
  // it is dropped when the administrator edits the quiz.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey)
      const saved = raw ? (JSON.parse(raw) as { best?: number; total?: number }) : null
      setBest(saved?.total === questions.length ? saved.best ?? null : null)
    } catch {
      // ignore storage access errors
    }
  }, [storageKey, questions.length])

  const current = deck?.[index]
  const revealed = picked !== null
  const correct = revealed && current ? picked === current.answer : false

  function choose(i: number) {
    if (revealed || !current) return
    setPicked(i)
    if (i !== current.answer) setMissed((m) => [...m, current.question.id])
  }

  const next = useCallback(() => {
    if (!deck || picked === null) return
    if (index + 1 < deck.length) {
      setIndex(index + 1)
      setPicked(null)
      return
    }
    setDone(true)

    // Only a full run is a score worth keeping; a "wrong ones only" retry is a
    // shorter deck and would otherwise look like a lower best.
    if (deck.length !== questions.length) return
    const score = deck.length - missed.length
    try {
      const top = Math.max(score, best ?? 0)
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({ best: top, total: deck.length, at: Date.now() }),
      )
      setBest(top)
    } catch {
      // ignore storage access errors
    }
  }, [best, deck, index, missed.length, picked, questions.length, storageKey])

  const missedQuestions = useMemo(
    () => questions.filter((q) => missed.includes(q.id)),
    [missed, questions],
  )

  if (!deck || !current) {
    return <div className="mt-4 h-64 rounded border border-neutral-200 bg-panel" />
  }

  if (done) {
    const score = deck.length - missed.length
    return (
      <div className="mt-4 rounded border border-neutral-200 bg-white p-6 text-center sm:p-8">
        <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Result</p>
        <p className="mt-2 font-serif text-5xl leading-none text-science-red">
          {score}
          <span className="text-neutral-300"> / {deck.length}</span>
        </p>
        <p className="mt-3 text-[14px] text-neutral-700">
          {score === deck.length
            ? '전부 맞혔습니다. 해당과정의 뼈대는 잡혔습니다.'
            : `${missed.length}문제를 놓쳤습니다. 틀린 문제만 다시 풀어 보세요.`}
        </p>
        {best !== null && (
          <p className="mt-1 text-[12px] text-neutral-400">
            최고 기록 {best} / {questions.length}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {missedQuestions.length > 0 && (
            <button
              type="button"
              onClick={() => start(missedQuestions)}
              className="rounded bg-science-red px-4 py-2 text-[13px] font-bold text-white transition-opacity hover:opacity-90"
            >
              틀린 문제만 다시 풀기 ({missedQuestions.length})
            </button>
          )}
          <button
            type="button"
            onClick={() => start(questions)}
            className="inline-flex items-center gap-1.5 rounded border border-neutral-300 px-4 py-2 text-[13px] font-bold text-neutral-600 transition-colors hover:border-science-red hover:text-science-red"
          >
            <RotateCcw className="size-[14px]" />
            처음부터 다시 풀기
          </button>
        </div>
      </div>
    )
  }

  const answered = index + (revealed ? 1 : 0)

  return (
    <div className="mt-4 rounded border border-neutral-200 bg-white p-5 sm:p-6">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
          {index + 1} / {deck.length}
        </span>
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-neutral-200">
          <div
            className="h-full bg-science-red transition-[width] duration-300"
            style={{ width: `${(answered / deck.length) * 100}%` }}
          />
        </div>
      </div>

      <h3
        className="mt-4 text-[17px] font-bold leading-snug text-foreground"
        dangerouslySetInnerHTML={{ __html: sanitizeRich(current.question.prompt) }}
      />

      <div className="mt-4 space-y-2" role="radiogroup" aria-label="보기">
        {current.choices.map((choice, i) => {
          const isAnswer = i === current.answer
          const isPicked = i === picked

          // Before answering: neutral, hoverable. After: the right one is always
          // marked, and a wrong pick is marked too, so both are visible at once.
          // The site's red is what the eye should land on, so it belongs to the
          // right answer; a wrong pick is called out in ink rather than a second
          // accent colour the rest of the page never uses.
          let tone = 'border-neutral-300 hover:border-science-red hover:bg-science-red/5'
          if (revealed && isAnswer) tone = 'border-science-red bg-science-red/5'
          else if (revealed && isPicked) tone = 'border-foreground bg-panel'
          else if (revealed) tone = 'border-neutral-200 opacity-60'

          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={isPicked}
              disabled={revealed}
              onClick={() => choose(i)}
              className={`flex w-full items-start gap-3 rounded border px-3 py-2.5 text-left transition-colors disabled:cursor-default ${tone}`}
            >
              <span className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full border border-current text-[11px] font-bold text-neutral-500">
                {i + 1}
              </span>
              <span className="flex-1 text-[14px] leading-snug text-foreground">{choice}</span>
              {revealed && isAnswer && (
                <Check className="mt-0.5 size-[16px] shrink-0 text-science-red" />
              )}
              {revealed && isPicked && !isAnswer && (
                <X className="mt-0.5 size-[16px] shrink-0 text-foreground" />
              )}
            </button>
          )
        })}
      </div>

      {/* Verdict + explanation, announced for screen readers as it appears. */}
      <div aria-live="polite">
        {revealed && (
          <div
            className={`mt-4 rounded border-l-4 bg-panel p-4 ${
              correct ? 'border-science-red' : 'border-foreground'
            }`}
          >
            <p
              className={`text-[12px] font-bold uppercase tracking-wider ${
                correct ? 'text-science-red' : 'text-neutral-500'
              }`}
            >
              {correct ? '정답' : '오답'}
            </p>
            {current.question.explanation && (
              <p className="mt-1.5 text-[14px] leading-relaxed text-neutral-700">
                {current.question.explanation}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={next}
          disabled={!revealed}
          className="rounded bg-science-red px-4 py-2 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:bg-neutral-200 disabled:text-neutral-400"
        >
          {index + 1 === deck.length ? '결과 보기' : '다음 문제 →'}
        </button>
      </div>
    </div>
  )
}
