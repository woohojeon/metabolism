import type { Pathway } from '@/lib/pathways'

// Persist pathway article edits in the browser's localStorage.
// This is a static site with no backend, so edits stay only in "this browser".

const PREFIX = 'metabolism-edit:'

function keyFor(categorySlug: string, pathwaySlug: string) {
  return `${PREFIX}${categorySlug}/${pathwaySlug}`
}

export function loadPathwayEdit(
  categorySlug: string,
  pathwaySlug: string,
): Pathway | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(keyFor(categorySlug, pathwaySlug))
    return raw ? (JSON.parse(raw) as Pathway) : null
  } catch {
    return null
  }
}

export function savePathwayEdit(
  categorySlug: string,
  pathwaySlug: string,
  data: Pathway,
) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(keyFor(categorySlug, pathwaySlug), JSON.stringify(data))
}

export function clearPathwayEdit(categorySlug: string, pathwaySlug: string) {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(keyFor(categorySlug, pathwaySlug))
}

// Category-level figure gallery edits (add/remove images), kept per browser
// like the pathway edits above.
const FIGURES_PREFIX = 'metabolism-cat-figures:'

export function loadCategoryFigures(categorySlug: string): string[] | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(FIGURES_PREFIX + categorySlug)
    return raw ? (JSON.parse(raw) as string[]) : null
  } catch {
    return null
  }
}

export function saveCategoryFigures(categorySlug: string, figures: string[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(FIGURES_PREFIX + categorySlug, JSON.stringify(figures))
  } catch {
    // A large data: URL upload can overflow localStorage; ignore.
  }
}
