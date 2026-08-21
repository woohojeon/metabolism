import type { Pathway } from '@/lib/pathways'
import type { QuizQuestion } from '@/lib/pathway-quiz'
import { loadContent, saveContent } from '@/lib/site-content'

// Pathway article edits, stored per category/pathway. These go to Supabase when
// it is configured, so an edit is visible on every computer; see
// lib/site-content.ts for the fallback when it is not.

const PREFIX = 'metabolism-edit:'

function keyFor(categorySlug: string, pathwaySlug: string) {
  return `${PREFIX}${categorySlug}/${pathwaySlug}`
}

export function loadPathwayEdit(
  categorySlug: string,
  pathwaySlug: string,
): Promise<Pathway | null> {
  return loadContent<Pathway>(keyFor(categorySlug, pathwaySlug))
}

export function savePathwayEdit(
  categorySlug: string,
  pathwaySlug: string,
  data: Pathway,
): Promise<void> {
  return saveContent(keyFor(categorySlug, pathwaySlug), data)
}

// The self-check quiz, kept as its own document rather than a field on the
// pathway edit: the article and the questions are edited separately, and one
// save must not overwrite the other. `path` is the page's own path —
// `${category}/${pathway}`, or with the child slug appended for a depth-3
// sub-topic.

const QUIZ_PREFIX = 'metabolism-quiz:'

export function loadPathwayQuiz(path: string): Promise<QuizQuestion[] | null> {
  return loadContent<QuizQuestion[]>(QUIZ_PREFIX + path)
}

export function savePathwayQuiz(path: string, questions: QuizQuestion[]): Promise<void> {
  return saveContent(QUIZ_PREFIX + path, questions)
}

// The home page hero: its headline, the paragraph under it, and the background
// photograph. One document, shared the same way as everything else.

/**
 * A text box's size, as chosen by dragging its corner while editing. The width
 * is a percentage so the box keeps its proportions on a narrow screen; the
 * height is in pixels, and only ever a floor — copy is never clipped.
 */
export type BoxSize = { width?: number; height?: number }

export type HomeHero = {
  title: string
  standfirst: string
  /** A path under /public, or a URL from uploadFile once an image is replaced. */
  image: string
  titleBox?: BoxSize
  bodyBox?: BoxSize
  /**
   * Type size, as a multiplier on what the design already works out for the
   * width of the screen — not a fixed number of pixels. A size chosen on a
   * desktop would otherwise be that same size on a phone, where the headline
   * is held to one line and would run off the side of it.
   */
  titleScale?: number
  bodyScale?: number
}

export const HERO_KEY = 'metabolism-home-hero'

export function loadHomeHero(): Promise<HomeHero | null> {
  return loadContent<HomeHero>(HERO_KEY)
}

export function saveHomeHero(hero: HomeHero): Promise<void> {
  return saveContent(HERO_KEY, hero)
}

// The newspaper had a download card of its own here, keyed
// `metabolism-home-newspaper`. It is now handed out through the ordinary
// lecture-slide card on its own page (lib/pathways.ts), so the card, its type
// and its loaders are gone. The saved row is left where it is rather than
// deleted — it still holds the PDF that was uploaded through it, and nothing
// reads it now, so nothing depends on its shape either.

// The instructor page: who is teaching the course and how to reach them. One
// document, shared the same way as everything else. The portrait is not part of
// it — only the writing is edited here.

export type InstructorProfile = {
  name: string
  title: string
  department: string
  college: string
  degree: string
  email: string
  phone: string
  office: string
}

export const INSTRUCTOR_KEY = 'metabolism-instructor'

export function loadInstructorProfile(): Promise<InstructorProfile | null> {
  return loadContent<InstructorProfile>(INSTRUCTOR_KEY)
}

export function saveInstructorProfile(profile: InstructorProfile): Promise<void> {
  return saveContent(INSTRUCTOR_KEY, profile)
}

// Category-level figure gallery edits (add/remove images), shared the same way.
// The entries are URLs from /api/upload rather than data: URLs once Supabase is
// configured, which is also what keeps this document small.
const FIGURES_PREFIX = 'metabolism-cat-figures:'

export function loadCategoryFigures(categorySlug: string): Promise<string[] | null> {
  return loadContent<string[]>(FIGURES_PREFIX + categorySlug)
}

export function saveCategoryFigures(
  categorySlug: string,
  figures: string[],
): Promise<void> {
  return saveContent(FIGURES_PREFIX + categorySlug, figures)
}
