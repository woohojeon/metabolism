// 대사지도 편집 내용을 저장한다. Supabase 가 설정돼 있으면 서버에 저장되어
// 다른 컴퓨터에서도 같은 지도가 보이고, 아니면 이 브라우저에만 남는다.
// (lib/site-content.ts 참고)

import { clearContent, loadContent, saveContent } from '@/lib/site-content'

export type NodePatch = Record<string, unknown>

export type MapEdits = {
  overrides: Record<number, NodePatch> // 기존 노드(master index) 부분 수정
  deleted: number[] // 숨긴 기존 노드
  added: NodePatch[] // 새로 추가한 노드 (각자 _id 보유)
}

const KEY = 'metabolic-map-edits'

export const emptyEdits: MapEdits = { overrides: {}, deleted: [], added: [] }

export async function loadMapEdits(): Promise<MapEdits> {
  const e = await loadContent<MapEdits>(KEY)
  if (!e) return { overrides: {}, deleted: [], added: [] }
  return {
    overrides: e.overrides || {},
    deleted: e.deleted || [],
    added: e.added || [],
  }
}

export function saveMapEdits(e: MapEdits): Promise<void> {
  return saveContent(KEY, e)
}

export function clearMapEdits(): Promise<void> {
  return clearContent(KEY)
}
