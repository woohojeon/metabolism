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
