import type { Pathway } from '@/lib/pathways'

// 게시글(대사 경로) 편집 내용을 브라우저 localStorage 에 저장한다.
// 백엔드가 없는 정적 사이트이므로, 편집 내용은 "이 브라우저"에만 남는다.

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
