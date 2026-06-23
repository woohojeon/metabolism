// 대사지도 편집 내용을 브라우저 localStorage 에 저장한다.
// 백엔드가 없으므로 "이 브라우저"에만 남는다. (추후 Supabase 로 교체)

export type NodePatch = Record<string, unknown>

export type MapEdits = {
  overrides: Record<number, NodePatch> // 기존 노드(master index) 부분 수정
  deleted: number[] // 숨긴 기존 노드
  added: NodePatch[] // 새로 추가한 노드 (각자 _id 보유)
}

const KEY = 'metabolic-map-edits'

export const emptyEdits: MapEdits = { overrides: {}, deleted: [], added: [] }

export function loadMapEdits(): MapEdits {
  if (typeof window === 'undefined') return { overrides: {}, deleted: [], added: [] }
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return { overrides: {}, deleted: [], added: [] }
    const e = JSON.parse(raw) as MapEdits
    return {
      overrides: e.overrides || {},
      deleted: e.deleted || [],
      added: e.added || [],
    }
  } catch {
    return { overrides: {}, deleted: [], added: [] }
  }
}

export function saveMapEdits(e: MapEdits) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(e))
  } catch {
    /* ignore */
  }
}

export function clearMapEdits() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(KEY)
}
