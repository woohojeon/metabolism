'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/components/auth-provider'
import { loadMapEdits, saveMapEdits, clearMapEdits, type MapEdits } from '@/lib/map-edits'
import { parsePptx } from '@/lib/pptx-import'

const DATA_KEY = 'metabolic-map-data'

// ---------------------------------------------------------------------------
type CatKey = 'carbohydrate' | 'lipid' | 'protein' | 'nucleic'
type PathCmd = (string | number)[]
type RawNode = {
  type: 'AUTO_SHAPE' | 'LINE' | 'FREEFORM' | 'PICTURE'
  text: string
  boxed: boolean
  x: number
  y: number
  w: number
  h: number
  prst?: string
  rot?: number
  fH?: boolean
  fV?: boolean
  fill?: string
  stroke?: string
  color?: string
  fs?: number
  aTail?: boolean
  aHead?: boolean
  dash?: boolean
  path?: PathCmd[][]
  arc?: [number, number]
  ex1?: number
  ey1?: number
  ex2?: number
  ey2?: number
  _id?: number
}
type RawPathway = { slide: number; note: string; name: string; category: CatKey; node_indices: number[] }
type Data = { slide_w: number; slide_h: number; master_nodes: RawNode[]; pathways: RawPathway[] }

const SLIDE_W = 13322300
const SLIDE_H = 18722975
const VB_W = 1000
const VB_H = Math.round((SLIDE_H / SLIDE_W) * VB_W)
const EMPTY: Data = { slide_w: SLIDE_W, slide_h: SLIDE_H, master_nodes: [], pathways: [] }
const ADD_BASE = 100000

const CATEGORIES: Record<CatKey, { label: string; color: string; soft: string }> = {
  carbohydrate: { label: 'Carbohydrate', color: '#2563eb', soft: '#dbeafe' },
  lipid: { label: 'Lipid', color: '#ea580c', soft: '#ffedd5' },
  protein: { label: 'Protein', color: '#16a34a', soft: '#dcfce7' },
  nucleic: { label: 'Nucleic acid', color: '#9333ea', soft: '#f3e8ff' },
}

function contrastText(hex?: string): string {
  if (!hex || hex.length < 7) return '#1f2937'
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? '#1f2937' : '#ffffff'
}
function transformOf(n: N): string | undefined {
  const cx = n.X + n.W / 2
  const cy = n.Y + n.H / 2
  const parts: string[] = []
  if (n.rot) parts.push(`rotate(${n.rot} ${cx} ${cy})`)
  if (n.fH || n.fV) parts.push(`translate(${cx} ${cy}) scale(${n.fH ? -1 : 1} ${n.fV ? -1 : 1}) translate(${-cx} ${-cy})`)
  return parts.length ? parts.join(' ') : undefined
}
function starPoints(X: number, Y: number, W: number, H: number): string {
  const cx = X + W / 2, cy = Y + H / 2, ro = Math.min(W, H) / 2, ri = ro * 0.4
  const pts: string[] = []
  for (let k = 0; k < 10; k++) {
    const r = k % 2 === 0 ? ro : ri
    const a = -Math.PI / 2 + (k * Math.PI) / 5
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`)
  }
  return pts.join(' ')
}
function pathD(subs: PathCmd[][], X: number, Y: number, W: number, H: number): string {
  const out: string[] = []
  for (const cmds of subs)
    for (const c of cmds) {
      if (c[0] === 'Z') { out.push('Z'); continue }
      const nums: number[] = []
      for (let k = 1; k < c.length; k += 2) nums.push(X + (c[k] as number) * W, Y + (c[k + 1] as number) * H)
      out.push(c[0] + nums.map((v) => v.toFixed(1)).join(' '))
    }
  return out.join(' ')
}

type N = RawNode & { id: number; X: number; Y: number; W: number; H: number; label: string }
function prep(n: RawNode, id: number): N {
  return { ...n, id, X: n.x * VB_W, Y: n.y * VB_H, W: n.w * VB_W, H: n.h * VB_H, label: (n.text || '').trim() }
}
function lineEnds(n: N) {
  if (n.ex1 != null && n.ey1 != null && n.ex2 != null && n.ey2 != null)
    return { x1: n.ex1 * VB_W, y1: n.ey1 * VB_H, x2: n.ex2 * VB_W, y2: n.ey2 * VB_H }
  return {
    x1: n.X + (n.fH ? n.W : 0),
    y1: n.Y + (n.fV ? n.H : 0),
    x2: n.X + (n.fH ? 0 : n.W),
    y2: n.Y + (n.fV ? 0 : n.H),
  }
}
type Kind = 'arrow' | 'line' | 'ellipse' | 'arc' | 'triangle' | 'box' | 'text'
function kindOf(n: N): Kind {
  if (n.type === 'LINE') return n.aTail ? 'arrow' : 'line'
  if (n.label) return 'text'
  if (n.prst === 'ellipse') return 'ellipse'
  if (n.prst === 'arc') return 'arc'
  if (n.prst === 'triangle') return 'triangle'
  return 'box'
}

// ---------------------------------------------------------------------------
export function MetabolicMap() {
  const { user } = useAuth()
  const [zoom, setZoom] = useState(1)
  const [activeSlide, setActiveSlide] = useState<number | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [selId, setSelId] = useState<number | null>(null)
  const [edits, setEdits] = useState<MapEdits>({ overrides: {}, deleted: [], added: [] })
  const [loaded, setLoaded] = useState(false)
  const [mapData, setMapData] = useState<Data>(EMPTY)
  const [importing, setImporting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const dragRef = useRef<any>(null)
  const historyRef = useRef<MapEdits[]>([])

  // 변경 직전 상태를 스냅샷으로 저장 (되돌리기용)
  function snapshot() {
    historyRef.current.push(edits)
    if (historyRef.current.length > 100) historyRef.current.shift()
  }
  function undo() {
    const prev = historyRef.current.pop()
    if (!prev) return
    setEdits(prev)
    setSelId(null)
  }
  // 히스토리를 거치는 수정 (패널 조작용)
  function histUpdate(id: number, patch: Partial<RawNode>) {
    snapshot()
    updateNode(id, patch)
  }
  const clipboardRef = useRef<RawNode | null>(null)
  function copySel() {
    if (!selId) return
    const n = nodes.find((x) => x.id === selId)
    if (!n) return
    const { id, X, Y, W, H, label, _id, ...rest } = n as any
    clipboardRef.current = JSON.parse(JSON.stringify(rest))
  }
  function pasteClip() {
    const c = clipboardRef.current
    if (!c) return
    snapshot()
    const id = ADD_BASE + (edits.added.reduce((m, a) => Math.max(m, ((a as RawNode)._id as number) - ADD_BASE), -1) + 1)
    const off = 0.012
    const n: RawNode = { ...(JSON.parse(JSON.stringify(c)) as RawNode), x: (c.x ?? 0) + off, y: (c.y ?? 0) + off, _id: id }
    if (n.ex1 != null) { n.ex1 += off; n.ey1 = (n.ey1 ?? 0) + off; n.ex2 = (n.ex2 ?? 0) + off; n.ey2 = (n.ey2 ?? 0) + off }
    setEdits((prev) => ({ ...prev, added: [...prev.added, n] }))
    setSelId(id)
  }
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingVal, setEditingVal] = useState('')
  function startTextEdit(n: N) {
    setSelId(n.id)
    setEditingVal(n.label)
    setEditingId(n.id)
  }
  function commitText() {
    if (editingId != null) histUpdate(editingId, { text: editingVal })
    setEditingId(null)
  }
  async function pickColor(key: 'fill' | 'stroke' | 'color') {
    const EyeDropper = (window as any).EyeDropper
    if (!EyeDropper) { window.alert('이 브라우저는 스포이드를 지원하지 않습니다. (Chrome/Edge 권장)'); return }
    try {
      const res = await new EyeDropper().open()
      if (selId != null && res?.sRGBHex) histUpdate(selId, { [key]: res.sRGBHex } as any)
    } catch { /* cancelled */ }
  }

  const ZOOM_MIN = 0.3, ZOOM_MAX = 4
  const changeZoom = (d: number) =>
    setZoom((z) => Math.round(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z + d)) * 100) / 100)

  useEffect(() => {
    setEdits(loadMapEdits())
    try {
      const raw = window.localStorage.getItem(DATA_KEY)
      if (raw) setMapData(JSON.parse(raw) as Data)
    } catch { /* ignore */ }
    setLoaded(true)
  }, [])

  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (e.target) e.target.value = ''
    if (!file) return
    setImporting(true)
    try {
      const buf = await file.arrayBuffer()
      const parsed = await parsePptx(buf)
      setMapData(parsed)
      setEdits({ overrides: {}, deleted: [], added: [] })
      setSelId(null)
      setActiveSlide(null)
      try { window.localStorage.setItem(DATA_KEY, JSON.stringify(parsed)) } catch { /* too big */ }
    } catch (err) {
      console.error(err)
      window.alert('PPTX 파싱에 실패했습니다. 콘솔을 확인하세요.')
    } finally {
      setImporting(false)
    }
  }
  useEffect(() => { if (loaded) saveMapEdits(edits) }, [edits, loaded])
  useEffect(() => { if (!user) { setEditMode(false); setSelId(null) } }, [user])

  // Ctrl+Z / Cmd+Z 되돌리기 (편집 모드에서만)
  useEffect(() => {
    if (!editMode) return
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName
      const inField = tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA'
      if (inField) return
      const mod = e.ctrlKey || e.metaKey
      if (mod && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) { e.preventDefault(); undo() }
      else if ((e.key === 'Delete' || e.key === 'Backspace') && selId != null) { e.preventDefault(); deleteNode(selId) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editMode, edits, selId])

  const nodes = useMemo<N[]>(() => {
    const out: N[] = []
    mapData.master_nodes.forEach((n, i) => {
      if (edits.deleted.includes(i)) return
      const ov = edits.overrides[i]
      out.push(prep(ov ? ({ ...n, ...ov } as RawNode) : n, i))
    })
    edits.added.forEach((n) => out.push(prep(n as RawNode, (n as RawNode)._id as number)))
    return out
  }, [edits, mapData])

  const pathways = useMemo(
    () => mapData.pathways.map((p) => ({ ...p, set: new Set(p.node_indices) })),
    [mapData],
  )
  const active = editMode || activeSlide == null ? null : pathways.find((p) => p.slide === activeSlide) ?? null
  const catColor = active ? CATEGORIES[active.category].color : null
  const grouped = useMemo(() => {
    const order: CatKey[] = ['carbohydrate', 'lipid', 'protein', 'nucleic']
    return order.map((key) => ({ key, ...CATEGORIES[key], items: pathways.filter((p) => p.category === key) }))
  }, [pathways])
  const selected = selId == null ? null : nodes.find((n) => n.id === selId) ?? null

  // ---- editing helpers ----
  function updateNode(id: number, patch: Partial<RawNode>) {
    setEdits((prev) => {
      if (id >= ADD_BASE)
        return { ...prev, added: prev.added.map((a) => ((a as RawNode)._id === id ? { ...a, ...patch } : a)) }
      return { ...prev, overrides: { ...prev.overrides, [id]: { ...(prev.overrides[id] || {}), ...patch } } }
    })
  }
  function deleteNode(id: number) {
    snapshot()
    setEdits((prev) =>
      id >= ADD_BASE
        ? { ...prev, added: prev.added.filter((a) => (a as RawNode)._id !== id) }
        : { ...prev, deleted: [...prev.deleted, id] },
    )
    setSelId(null)
  }
  function addNode(kind: Kind, dash = false) {
    snapshot()
    const id = ADD_BASE + (edits.added.reduce((m, a) => Math.max(m, ((a as RawNode)._id as number) - ADD_BASE), -1) + 1)
    let n: RawNode
    if (kind === 'arrow' || kind === 'line')
      n = { type: 'LINE', text: '', boxed: false, x: 0.45, y: 0.45, w: 0.08, h: 0, ex1: 0.45, ey1: 0.45, ex2: 0.53, ey2: 0.45, stroke: '#333333', aTail: kind === 'arrow', dash, _id: id }
    else if (kind === 'ellipse')
      n = { type: 'AUTO_SHAPE', prst: 'ellipse', text: '', boxed: true, x: 0.47, y: 0.47, w: 0.04, h: 0.03, fill: '#ffffff', stroke: '#333333', _id: id }
    else
      n = { type: 'AUTO_SHAPE', prst: 'roundRect', text: 'New', boxed: true, x: 0.45, y: 0.46, w: 0.07, h: 0.022, fill: '#ffffff', stroke: '#333333', color: '#111111', fs: 7, _id: id }
    setEdits((prev) => ({ ...prev, added: [...prev.added, n] }))
    setSelId(id)
  }
  function applyKind(id: number, kind: Kind) {
    const n = nodes.find((x) => x.id === id)
    if (!n) return
    snapshot()
    const patch: Partial<RawNode> = { aTail: undefined, aHead: undefined, path: undefined, arc: undefined, prst: undefined }
    if (kind === 'arrow') { patch.type = 'LINE'; patch.aTail = true }
    else if (kind === 'line') { patch.type = 'LINE'; patch.aTail = false }
    else if (kind === 'ellipse') { patch.type = 'AUTO_SHAPE'; patch.prst = 'ellipse'; patch.boxed = true }
    else if (kind === 'arc') { patch.type = 'AUTO_SHAPE'; patch.prst = 'arc'; patch.arc = [270, 0] }
    else if (kind === 'triangle') { patch.type = 'AUTO_SHAPE'; patch.prst = 'triangle'; patch.boxed = true }
    else if (kind === 'box') { patch.type = 'AUTO_SHAPE'; patch.prst = 'roundRect'; patch.boxed = true }
    else if (kind === 'text') { patch.type = 'AUTO_SHAPE'; patch.boxed = false; if (!n.label) patch.text = 'Text' }
    updateNode(id, patch)
  }

  // ---- pointer drag ----
  function vbFromEvent(e: PointerEvent | React.PointerEvent) {
    const r = svgRef.current!.getBoundingClientRect()
    return { x: (e.clientX - r.left) / zoom, y: (e.clientY - r.top) / zoom }
  }
  function beginDrag(e: React.PointerEvent, id: number, mode: string) {
    if (!editMode) return
    e.stopPropagation()
    e.preventDefault()
    setSelId(id)
    snapshot()
    const n = nodes.find((x) => x.id === id)!
    const le = lineEnds(n)
    dragRef.current = {
      id, mode, zoom,
      sx: e.clientX, sy: e.clientY,
      base: { x: n.x, y: n.y, w: n.w, h: n.h, rot: n.rot || 0 },
      ends: { ex1: n.ex1 ?? le.x1 / VB_W, ey1: n.ey1 ?? le.y1 / VB_H, ex2: n.ex2 ?? le.x2 / VB_W, ey2: n.ey2 ?? le.y2 / VB_H },
      cx: n.X + n.W / 2, cy: n.Y + n.H / 2,
      isLine: n.type === 'LINE',
    }
    window.addEventListener('pointermove', onDragMove)
    window.addEventListener('pointerup', endDrag)
  }
  function onDragMove(e: PointerEvent) {
    const d = dragRef.current
    if (!d) return
    const dvx = (e.clientX - d.sx) / d.zoom
    const dvy = (e.clientY - d.sy) / d.zoom
    const dnx = dvx / VB_W
    const dny = dvy / VB_H
    if (d.mode === 'move') {
      const patch: Partial<RawNode> = { x: d.base.x + dnx, y: d.base.y + dny }
      if (d.isLine && d.ends) { patch.ex1 = d.ends.ex1 + dnx; patch.ey1 = d.ends.ey1 + dny; patch.ex2 = d.ends.ex2 + dnx; patch.ey2 = d.ends.ey2 + dny }
      updateNode(d.id, patch)
    } else if (d.mode === 'resize') {
      updateNode(d.id, { w: Math.max(0.004, d.base.w + dnx), h: Math.max(0.004, d.base.h + dny) })
    } else if (d.mode === 'rotate') {
      const p = vbFromEvent(e)
      const ang = (Math.atan2(p.y - d.cy, p.x - d.cx) * 180) / Math.PI + 90
      updateNode(d.id, { rot: Math.round(ang) })
    } else if (d.mode === 'p1') {
      updateNode(d.id, { ex1: d.ends.ex1 + dnx, ey1: d.ends.ey1 + dny })
    } else if (d.mode === 'p2') {
      updateNode(d.id, { ex2: d.ends.ex2 + dnx, ey2: d.ends.ey2 + dny })
    }
  }
  function endDrag() {
    dragRef.current = null
    window.removeEventListener('pointermove', onDragMove)
    window.removeEventListener('pointerup', endDrag)
  }

  function selectPathway(slide: number) {
    if (activeSlide === slide) return setActiveSlide(null)
    setActiveSlide(slide)
  }

  // ---- node rendering ----
  function renderNode(n: N) {
    if (!n.label && n.type !== 'LINE' && n.fill && n.w * n.h > 0.5) return null
    const hit = active ? active.set.has(n.id) : false
    const dim = active ? !hit : false
    const opacity = dim ? 0.1 : 1
    const stroke = n.stroke || (n.fill ? 'rgba(0,0,0,0.18)' : '#9ca3af')
    const fillShape = n.fill || 'none'
    const pdown = editMode ? (e: React.PointerEvent) => beginDrag(e, n.id, 'move') : undefined
    const cursor = editMode ? 'move' : undefined
    const ddbl = editMode ? () => startTextEdit(n) : undefined

    if (n.type === 'LINE') {
      const { x1, y1, x2, y2 } = lineEnds(n)
      const col = n.stroke || '#6b7280'
      const heads: any[] = []
      const mk = (hx: number, hy: number, fx: number, fy: number) => {
        const a = Math.atan2(hy - fy, hx - fx), s = hit ? 5 : 4
        return `${hx},${hy} ${hx + s * Math.cos(a + Math.PI - 0.42)},${hy + s * Math.sin(a + Math.PI - 0.42)} ${hx + s * Math.cos(a + Math.PI + 0.42)},${hy + s * Math.sin(a + Math.PI + 0.42)}`
      }
      if (n.aTail) heads.push(<polygon key="t" points={mk(x2, y2, x1, y1)} fill={col} />)
      if (n.aHead) heads.push(<polygon key="h" points={mk(x1, y1, x2, y2)} fill={col} />)
      return (
        <g key={n.id} opacity={opacity} onPointerDown={pdown} style={{ cursor }}>
          {editMode && <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth={8} />}
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={col} strokeWidth={hit ? 1.6 : 1} strokeDasharray={n.dash ? '4 3' : undefined} />
          {heads}
        </g>
      )
    }
    if (n.type === 'PICTURE') return null

    if (n.label) {
      const fill = n.fill || (n.boxed ? '#f5f5f4' : 'none')
      const tStroke = hit && catColor ? catColor : n.stroke || (n.fill ? 'rgba(0,0,0,0.18)' : '#d6d3d1')
      const textColor = n.color || (n.boxed ? contrastText(n.fill) : '#374151')
      const lines = n.label.split('\n')
      const fs = Math.max(1.4, n.fs || 6)
      return (
        <g key={n.id} opacity={opacity} transform={transformOf(n)} onPointerDown={pdown} onDoubleClick={ddbl} style={{ cursor }}>
          {n.boxed ? (
            <rect x={n.X} y={n.Y} width={n.W} height={n.H} rx={3} fill={fill} stroke={tStroke} strokeWidth={hit ? 1.6 : 0.7} />
          ) : (
            editMode && <rect x={n.X} y={n.Y} width={n.W} height={n.H} fill="transparent" />
          )}
          <text x={n.X + n.W / 2} y={n.Y + n.H / 2} fontSize={fs} fill={textColor} textAnchor="middle" dominantBaseline="central" fontWeight={hit ? 700 : 400} style={{ pointerEvents: 'none' }}>
            {lines.length === 1 ? n.label : lines.map((ln, li) => (
              <tspan key={li} x={n.X + n.W / 2} dy={li === 0 ? `-${((lines.length - 1) * fs) / 2}` : fs}>{ln}</tspan>
            ))}
          </text>
        </g>
      )
    }

    if (n.type === 'FREEFORM' && n.path)
      return <path key={n.id} d={pathD(n.path, n.X, n.Y, n.W, n.H)} fill={fillShape} stroke={n.stroke || (n.fill ? 'none' : '#6b7280')} strokeWidth={hit ? 1.4 : 0.9} opacity={opacity} transform={transformOf(n)} onPointerDown={pdown} style={{ cursor }} />

    const prst = n.prst || 'rect'
    const t = transformOf(n)
    const cx = n.X + n.W / 2, cy = n.Y + n.H / 2
    const common: any = { fill: fillShape, stroke, strokeWidth: hit ? 1.4 : 0.7, opacity, onPointerDown: pdown, onDoubleClick: ddbl, style: { cursor } }

    if (prst === 'arc') {
      const [a1, a2] = n.arc || [270, 0]
      const wR = n.W / 2, hR = n.H / 2
      const r1 = (a1 * Math.PI) / 180, r2 = (a2 * Math.PI) / 180
      const sx = cx + wR * Math.cos(r1), sy = cy + hR * Math.sin(r1)
      const ex = cx + wR * Math.cos(r2), ey = cy + hR * Math.sin(r2)
      let sw = a2 - a1; while (sw < 0) sw += 360
      return <path key={n.id} d={`M${sx.toFixed(1)} ${sy.toFixed(1)} A${wR.toFixed(1)} ${hR.toFixed(1)} 0 ${sw > 180 ? 1 : 0} 1 ${ex.toFixed(1)} ${ey.toFixed(1)}`} fill="none" stroke={n.stroke || '#6b7280'} strokeWidth={hit ? 1.5 : 1} opacity={opacity} transform={t} onPointerDown={pdown} style={{ cursor }} />
    }
    if (prst === 'ellipse') return <ellipse key={n.id} cx={cx} cy={cy} rx={n.W / 2} ry={n.H / 2} {...common} transform={t} />
    if (prst === 'triangle') return <polygon key={n.id} points={`${cx},${n.Y} ${n.X},${n.Y + n.H} ${n.X + n.W},${n.Y + n.H}`} {...common} transform={t} />
    if (prst === 'star5') return <polygon key={n.id} points={starPoints(n.X, n.Y, n.W, n.H)} {...common} transform={t} />
    if (prst === 'flowChartSummingJunction') {
      const d = Math.min(n.W, n.H) / 2 / Math.SQRT2
      return (
        <g key={n.id} opacity={opacity} transform={t} onPointerDown={pdown} style={{ cursor }}>
          <ellipse cx={cx} cy={cy} rx={n.W / 2} ry={n.H / 2} fill={fillShape} stroke={stroke} strokeWidth={common.strokeWidth} />
          <line x1={cx - d} y1={cy - d} x2={cx + d} y2={cy + d} stroke={stroke} strokeWidth={common.strokeWidth} />
          <line x1={cx - d} y1={cy + d} x2={cx + d} y2={cy - d} stroke={stroke} strokeWidth={common.strokeWidth} />
        </g>
      )
    }
    return <rect key={n.id} x={n.X} y={n.Y} width={n.W} height={n.H} rx={prst === 'roundRect' || prst === 'flowChartMagneticDrum' ? Math.min(n.W, n.H) * 0.2 : 0} {...common} transform={t} />
  }

  // ---- selection overlay ----
  function overlay() {
    if (!editMode || !selected) return null
    const n = selected
    const hsz = 7 / zoom
    if (n.type === 'LINE') {
      const { x1, y1, x2, y2 } = lineEnds(n)
      return (
        <g>
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#2563eb" strokeWidth={1.2 / zoom} strokeDasharray={`${4 / zoom} ${3 / zoom}`} />
          <circle cx={x1} cy={y1} r={hsz} fill="#fff" stroke="#2563eb" strokeWidth={1.5 / zoom} style={{ cursor: 'pointer' }} onPointerDown={(e) => beginDrag(e, n.id, 'p1')} />
          <circle cx={x2} cy={y2} r={hsz} fill="#2563eb" stroke="#fff" strokeWidth={1.5 / zoom} style={{ cursor: 'pointer' }} onPointerDown={(e) => beginDrag(e, n.id, 'p2')} />
        </g>
      )
    }
    const t = transformOf(n)
    return (
      <g transform={t}>
        <rect x={n.X} y={n.Y} width={n.W} height={n.H} fill="none" stroke="#2563eb" strokeWidth={1.2 / zoom} strokeDasharray={`${4 / zoom} ${3 / zoom}`} />
        <rect x={n.X + n.W - hsz} y={n.Y + n.H - hsz} width={hsz * 2} height={hsz * 2} fill="#2563eb" style={{ cursor: 'nwse-resize' }} onPointerDown={(e) => beginDrag(e, n.id, 'resize')} />
        <circle cx={n.X + n.W / 2} cy={n.Y - 16 / zoom} r={hsz} fill="#fff" stroke="#2563eb" strokeWidth={1.5 / zoom} style={{ cursor: 'grab' }} onPointerDown={(e) => beginDrag(e, n.id, 'rotate')} />
        <line x1={n.X + n.W / 2} y1={n.Y} x2={n.X + n.W / 2} y2={n.Y - 16 / zoom} stroke="#2563eb" strokeWidth={1 / zoom} />
      </g>
    )
  }

  const colorInput = (label: string, key: 'fill' | 'stroke' | 'color', def: string) =>
    selected && (
      <label className="flex items-center justify-between gap-2 text-[12px]">
        <span className="text-neutral-600">{label}</span>
        <span className="flex items-center gap-1">
          <input type="color" value={(selected as any)[key] || def} onChange={(e) => histUpdate(selected.id, { [key]: e.target.value } as any)} className="h-6 w-8 cursor-pointer rounded border border-neutral-300" />
          <button type="button" onClick={() => pickColor(key)} title="스포이드 (화면에서 색 추출)" className="rounded border border-neutral-300 px-1 text-[12px] hover:border-foreground">💧</button>
          <button type="button" onClick={() => histUpdate(selected.id, { [key]: undefined } as any)} title="색 제거" className="text-[10px] text-neutral-400 hover:text-science-red">×</button>
        </span>
      </label>
    )

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      {/* Sidebar */}
      <aside className="lg:w-[300px] lg:shrink-0">
        {/* PPTX import */}
        <div className="mb-4">
          <input ref={fileRef} type="file" accept=".pptx" onChange={onImport} className="hidden" />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="w-full rounded border border-neutral-300 px-3 py-2 text-[12px] font-bold uppercase tracking-wider text-neutral-700 transition-colors hover:border-foreground disabled:opacity-50"
          >
            {importing ? '가져오는 중…' : 'PPTX 가져오기'}
          </button>
          {mapData.master_nodes.length > 0 && (
            <button
              type="button"
              onClick={() => { if (window.confirm('지도를 비울까요?')) { setMapData(EMPTY); setEdits({ overrides: {}, deleted: [], added: [] }); setSelId(null); try { window.localStorage.removeItem(DATA_KEY) } catch {} } }}
              className="mt-1 w-full text-[11px] font-semibold text-neutral-400 hover:text-science-red"
            >
              지도 비우기
            </button>
          )}
        </div>

        {/* Editor toolbar (logged-in only) */}
        {user && (
          <div className="mb-4 rounded border border-neutral-200 bg-panel/40 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold uppercase tracking-wider text-neutral-500">Editor</span>
              <button
                type="button"
                onClick={() => { setEditMode((v) => !v); setSelId(null); setActiveSlide(null) }}
                className={`rounded px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors ${editMode ? 'bg-science-red text-white' : 'border border-neutral-300 text-neutral-600 hover:border-foreground'}`}
              >
                {editMode ? '편집 종료' : '편집 모드'}
              </button>
            </div>

            {editMode && (
              <>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <button type="button" onClick={undo} title="되돌리기 (Ctrl+Z)" className="rounded border border-neutral-300 px-2 py-1 text-[11px] font-semibold hover:border-foreground">↶ 되돌리기</button>
                </div>

                {selected ? (
                  <div className="mt-3 space-y-2 border-t border-neutral-200 pt-3">
                    <label className="flex items-center justify-between gap-2 text-[12px]">
                      <span className="text-neutral-600">타입</span>
                      <select
                        value={kindOf(selected)}
                        onChange={(e) => applyKind(selected.id, e.target.value as Kind)}
                        className="rounded border border-neutral-300 px-1 py-0.5 text-[12px]"
                      >
                        <option value="arrow">화살표</option>
                        <option value="line">선</option>
                        <option value="ellipse">원</option>
                        <option value="arc">곡선 화살표(arc)</option>
                        <option value="triangle">삼각형</option>
                        <option value="box">박스</option>
                        <option value="text">텍스트</option>
                      </select>
                    </label>

                    {(kindOf(selected) === 'text' || kindOf(selected) === 'box') && (
                      <label className="block text-[12px]">
                        <span className="text-neutral-600">라벨</span>
                        <input value={selected.label} onChange={(e) => histUpdate(selected.id, { text: e.target.value })} className="mt-1 w-full rounded border border-neutral-300 px-2 py-1 text-[12px]" />
                      </label>
                    )}

                    {selected.type === 'LINE' && (
                      <div className="flex gap-3 text-[12px]">
                        <label className="flex items-center gap-1"><input type="checkbox" checked={!!selected.aTail} onChange={(e) => histUpdate(selected.id, { aTail: e.target.checked })} />끝 화살촉</label>
                        <label className="flex items-center gap-1"><input type="checkbox" checked={!!selected.aHead} onChange={(e) => histUpdate(selected.id, { aHead: e.target.checked })} />앞 화살촉</label>
                        <label className="flex items-center gap-1"><input type="checkbox" checked={!!selected.dash} onChange={(e) => histUpdate(selected.id, { dash: e.target.checked })} />점선</label>
                      </div>
                    )}

                    {selected.type === 'LINE'
                      ? colorInput('선 색', 'stroke', '#333333')
                      : (
                        <>
                          {colorInput('채움', 'fill', '#ffffff')}
                          {colorInput('테두리', 'stroke', '#333333')}
                          {selected.label && colorInput('글자색', 'color', '#111111')}
                        </>
                      )}

                    {selected.label && (
                      <label className="flex items-center justify-between gap-2 text-[12px]">
                        <span className="text-neutral-600">글자 크기</span>
                        <input type="number" step={0.5} value={selected.fs ?? 6} onChange={(e) => histUpdate(selected.id, { fs: parseFloat(e.target.value) })} className="w-16 rounded border border-neutral-300 px-1 py-0.5 text-[12px]" />
                      </label>
                    )}

                    <button type="button" onClick={() => deleteNode(selected.id)} className="mt-1 w-full rounded bg-science-red/10 py-1.5 text-[12px] font-bold text-science-red hover:bg-science-red/20">삭제</button>
                  </div>
                ) : (
                  <p className="mt-3 text-[11px] leading-snug text-neutral-400">요소를 클릭해 선택하세요. 본체 드래그=이동, 모서리=크기, 위 손잡이=회전, 선은 양 끝점 드래그.</p>
                )}

                <button type="button" onClick={() => { if (window.confirm('모든 편집을 지우고 원본으로 되돌릴까요?')) { clearMapEdits(); setEdits({ overrides: {}, deleted: [], added: [] }); setSelId(null) } }} className="mt-3 w-full text-[11px] font-bold text-neutral-400 hover:text-science-red">전체 편집 초기화</button>
              </>
            )}
          </div>
        )}

        {/* Pathways list */}
        <div className="flex items-center justify-between border-b-2 border-foreground pb-2">
          <h2 className="text-[12px] font-bold uppercase tracking-[0.15em] text-neutral-500">Pathways</h2>
          <button type="button" onClick={() => setActiveSlide(null)} disabled={!active} className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${active ? 'text-science-red hover:text-foreground' : 'text-neutral-300'}`}>전체 보기</button>
        </div>
        <div className="mt-4 flex flex-col gap-5">
          {grouped.map((g) => (
            <div key={g.key}>
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-sm" style={{ backgroundColor: g.color }} aria-hidden />
                <h3 className="text-[13px] font-extrabold uppercase tracking-wide text-foreground">{g.label}</h3>
                <span className="text-[11px] text-neutral-400">{g.items.length}</span>
              </div>
              <ul className="mt-1.5 flex flex-col">
                {g.items.map((p) => {
                  const on = activeSlide === p.slide
                  return (
                    <li key={p.slide}>
                      <button type="button" disabled={editMode} onClick={() => selectPathway(p.slide)} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[13px] leading-snug transition-colors disabled:opacity-40" style={on ? { backgroundColor: g.soft, color: g.color, fontWeight: 700 } : undefined}>
                        <span className={on ? '' : 'text-neutral-700 hover:text-foreground'}>{p.name}</span>
                        <span className="ml-auto text-[10px] text-neutral-400">{p.node_indices.length}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </aside>

      {/* Map */}
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[12px] text-neutral-500">
            {editMode ? <span className="font-bold text-science-red">편집 모드 — 클릭/드래그로 수정</span>
              : active ? <><span className="font-bold" style={{ color: catColor! }}>{active.name}</span> — {active.node_indices.length} components highlighted</>
                : <>Select a pathway to highlight only its components</>}
          </p>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => changeZoom(-0.2)} aria-label="Zoom out" disabled={zoom <= ZOOM_MIN} className="flex size-7 items-center justify-center rounded border border-neutral-300 text-[16px] font-bold text-neutral-600 transition-colors hover:border-foreground disabled:opacity-30">−</button>
            <button type="button" onClick={() => setZoom(1)} className="min-w-[3.2rem] rounded border border-neutral-300 px-2 py-1 text-[11px] font-bold tabular-nums text-neutral-600 transition-colors hover:border-foreground">{Math.round(zoom * 100)}%</button>
            <button type="button" onClick={() => changeZoom(0.2)} aria-label="Zoom in" disabled={zoom >= ZOOM_MAX} className="flex size-7 items-center justify-center rounded border border-neutral-300 text-[16px] font-bold text-neutral-600 transition-colors hover:border-foreground disabled:opacity-30">+</button>
          </div>
        </div>

        <div className="overflow-auto rounded border border-neutral-200 bg-white" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {mapData.master_nodes.length === 0 ? (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-2 text-center text-neutral-400">
              <p className="text-[15px] font-semibold text-neutral-500">대사 지도가 비어 있습니다</p>
              <p className="text-[12px]">왼쪽 <b>PPTX 가져오기</b>로 슬라이드를 업로드하세요.</p>
            </div>
          ) : (
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            width={VB_W * zoom}
            height={VB_H * zoom}
            style={{ display: 'block' }}
            role="img"
            aria-label="Metabolic pathway map"
            onPointerDown={() => { if (editMode) setSelId(null) }}
          >
            {nodes.map(renderNode)}
            {overlay()}
            {editMode && editingId != null && (() => {
              const n = nodes.find((x) => x.id === editingId)
              if (!n) return null
              const fw = Math.max(n.W, 90)
              const fh = Math.max(n.H, 16)
              return (
                <foreignObject x={n.X + n.W / 2 - fw / 2} y={n.Y + n.H / 2 - fh / 2} width={fw} height={fh} transform={transformOf(n)}>
                  <input
                    autoFocus
                    value={editingVal}
                    onChange={(e) => setEditingVal(e.target.value)}
                    onBlur={commitText}
                    onKeyDown={(e) => {
                      e.stopPropagation()
                      if (e.key === 'Enter') { e.preventDefault(); commitText() }
                      else if (e.key === 'Escape') { e.preventDefault(); setEditingId(null) }
                    }}
                    onFocus={(e) => e.currentTarget.select()}
                    style={{
                      width: '100%', height: '100%', boxSizing: 'border-box',
                      fontSize: `${Math.max(6, n.fs || 7)}px`, textAlign: 'center',
                      border: '1px solid #2563eb', borderRadius: 3, padding: '0 2px',
                      background: '#fff', color: '#111', outline: 'none',
                    }}
                  />
                </foreignObject>
              )
            })()}
          </svg>
          )}
        </div>
      </div>
    </div>
  )
}
