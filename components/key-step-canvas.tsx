'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  ArrowLeftRight,
  ArrowRight,
  Bold,
  ChevronDown,
  ChevronUp,
  Italic,
  Redo2,
  Subscript,
  Superscript,
  Type,
  Undo2,
  X,
} from 'lucide-react'
import { sanitizeRich } from '@/lib/rich-text'
import type {
  KeyStepArrowItem,
  KeyStepCanvas as Canvas,
  KeyStepItem,
  KeyStepTextItem,
} from '@/lib/pathways'

// The canvas has a fixed coordinate space and is scaled down to fit the article
// column, so a diagram looks the same everywhere it is shown.
export const CANVAS_WIDTH = 900

export function emptyCanvas(): Canvas {
  return { height: 240, items: [] }
}

export function hasCanvas(canvas?: Canvas) {
  return Boolean(canvas?.items.length)
}

const uid = () => Math.random().toString(36).slice(2, 9)

// Text size, in canvas px. The generated diagrams are laid out against the
// default, so changing it here would shift every one of them.
export const FONT_PX = 15
const FONT_MIN = 9
const FONT_MAX = 40

// The board grows to hold whatever has been placed on it — no manual sizing.
// Text is measured generously so a box near the bottom never gets clipped.
export function boardHeight(canvas: Canvas) {
  const bottoms = canvas.items.map((it) =>
    it.kind === 'text' ? it.y + (it.size ?? FONT_PX) * 1.6 + 15 : Math.max(it.y1, it.y2) + 20,
  )
  return Math.round(Math.max(160, ...bottoms, 0) + 20)
}

// How close (in canvas px) a dragged box must come to another box's left edge
// before it snaps to it.
const SNAP_DISTANCE = 6
const BULLET = '· '

// Fit the board before the browser paints, not after: measuring in a plain
// useEffect lets the 900px board show at full size for one frame and then snap
// down to fit, which reads as a jump on the way into a page. useLayoutEffect
// runs before paint; it has no meaning on the server, so fall back there.
const useFitEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

// ---------------------------------------------------------------------------

export function KeyStepCanvas({
  canvas,
  editing,
  onChange,
  boardWidth,
}: {
  canvas: Canvas
  editing: boolean
  onChange: (canvas: Canvas) => void
  /**
   * An exact width to draw the board at, in px. Without it the board fills the
   * column it is in and holds a floor so a phone scrolls across it rather than
   * shrinking it past reading size. The zoom view sets it to the size it has
   * worked out for the window.
   */
  boardWidth?: number
}) {
  const [selected, setSelected] = useState<string | null>(null)
  // The box whose text is being typed into (entered by double-click, as in PPT).
  const [typing, setTyping] = useState<string | null>(null)
  // Alignment guides shown while dragging, at the edges being snapped to.
  const [guideX, setGuideX] = useState<number | null>(null)
  const [guideY, setGuideY] = useState<number | null>(null)
  const scaleRef = useRef(1)
  const boardRef = useRef<HTMLDivElement>(null)
  // The board is drawn at 900px and scaled down once its column is measured.
  // Until that first fit it is held invisible so its full width never flashes;
  // the parent reserves the right height through its aspect-ratio, so revealing
  // the fitted board shifts nothing.
  const [fitted, setFitted] = useState(false)

  // Draw the fixed coordinate space at whatever width it has been given, and
  // keep it there as the column or the window changes. The observer is torn
  // down on unmount — the zoom view mounts a second board and closing it must
  // not leave one behind.
  useFitEffect(() => {
    const el = boardRef.current
    const parent = el?.parentElement
    if (!el || !parent) return

    const fit = () => {
      const s = parent.clientWidth / CANVAS_WIDTH
      scaleRef.current = s
      el.style.transform = `scale(${s})`
    }
    fit()
    setFitted(true)

    const ro = new ResizeObserver(fit)
    ro.observe(parent)
    return () => ro.disconnect()
  }, [])

  // Undo/redo. Consecutive edits of the same kind on the same item (typing a
  // word, dragging a box) collapse into one step, so Ctrl+Z undoes an action
  // rather than a keystroke. `rev` forces the text boxes to re-seed their DOM
  // after an undo, since they are uncontrolled while being edited.
  const past = useRef<Canvas[]>([])
  const future = useRef<Canvas[]>([])
  const lastEdit = useRef<{ tag: string; at: number } | null>(null)
  const [rev, setRev] = useState(0)

  const commit = useCallback(
    (next: Canvas, tag = 'structure') => {
      const now = Date.now()
      const merge =
        tag !== 'structure' &&
        lastEdit.current?.tag === tag &&
        now - lastEdit.current.at < 700
      if (!merge) past.current.push(canvas)
      lastEdit.current = { tag, at: now }
      future.current = []
      onChange(next)
    },
    [canvas, onChange],
  )

  const undo = useCallback(() => {
    const previous = past.current.pop()
    if (!previous) return
    future.current.push(canvas)
    lastEdit.current = null
    setRev((r) => r + 1)
    onChange(previous)
  }, [canvas, onChange])

  const redo = useCallback(() => {
    const next = future.current.pop()
    if (!next) return
    past.current.push(canvas)
    lastEdit.current = null
    setRev((r) => r + 1)
    onChange(next)
  }, [canvas, onChange])

  useEffect(() => {
    if (!editing) {
      setSelected(null)
      setTyping(null)
      return
    }
    function onKey(e: KeyboardEvent) {
      const undoKey = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z'
      const redoKey =
        (e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))
      if (redoKey) {
        e.preventDefault()
        redo()
      } else if (undoKey) {
        // Take over from the browser's own contentEditable undo, which only
        // knows about the DOM of one box and not about moves or deletions.
        e.preventDefault()
        undo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editing, undo, redo])

  function update(
    id: string,
    patch: Partial<KeyStepTextItem> & Partial<KeyStepArrowItem>,
    tag = 'structure',
  ) {
    commit(
      {
        ...canvas,
        items: canvas.items.map((it) => (it.id === id ? ({ ...it, ...patch } as KeyStepItem) : it)),
      },
      tag,
    )
  }
  function remove(id: string) {
    commit({ ...canvas, items: canvas.items.filter((it) => it.id !== id) })
    setSelected(null)
    setTyping(null)
  }
  function addText() {
    const id = uid()
    commit({
      ...canvas,
      items: [...canvas.items, { id, kind: 'text', x: 40, y: 40, html: '텍스트' }],
    })
    setSelected(id)
    setTyping(id)
  }
  function addArrow(double: boolean) {
    const id = uid()
    commit({
      ...canvas,
      items: [...canvas.items, { id, kind: 'arrow', x1: 60, y1: 90, x2: 220, y2: 90, double }],
    })
    setSelected(id)
  }

  // Drags run in canvas coordinates, so they stay correct while the board is
  // scaled down to fit the column.
  function startDrag(
    e: React.PointerEvent,
    tag: string,
    onMove: (dx: number, dy: number) => void,
    cursor?: string,
  ) {
    e.preventDefault()
    e.stopPropagation()
    const scale = scaleRef.current || 1
    const startX = e.clientX
    const startY = e.clientY

    // Hold the cursor for the whole drag, the way a slide editor does: without
    // this it flickers back to the arrow as the pointer leaves the small handle.
    const previousCursor = document.body.style.cursor
    const previousSelect = document.body.style.userSelect
    if (cursor) document.body.style.cursor = cursor
    document.body.style.userSelect = 'none'

    const move = (ev: PointerEvent) =>
      onMove(Math.round((ev.clientX - startX) / scale), Math.round((ev.clientY - startY) / scale))
    const up = () => {
      lastEdit.current = null // end the coalescing window for this drag
      setGuideX(null)
      setGuideY(null)
      document.body.style.cursor = previousCursor
      document.body.style.userSelect = previousSelect
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    void tag
  }

  // The cursor a slide editor shows on a line's end handle: it points along the
  // direction that end will travel.
  function endCursor(a: KeyStepArrowItem) {
    const dx = a.x2 - a.x1
    const dy = a.y2 - a.y1
    if (Math.abs(dy) < Math.abs(dx) / 2) return 'ew-resize'
    if (Math.abs(dx) < Math.abs(dy) / 2) return 'ns-resize'
    return dx * dy > 0 ? 'nwse-resize' : 'nesw-resize'
  }

  function dragItem(e: React.PointerEvent, item: KeyStepItem) {
    const tag = `move:${item.id}`
    if (item.kind === 'text') {
      const { x, y } = item
      const others = canvas.items.filter(
        (it): it is KeyStepTextItem => it.kind === 'text' && it.id !== item.id,
      )
      const lefts = others.map((it) => it.x)
      const tops = others.map((it) => it.y)

      // Equal spacing: the gaps already set between the other boxes, continued
      // above the topmost and below the bottommost of each pair. Dragging into
      // one of these lands the box an even step away from its neighbours.
      const rows = [...tops].sort((a, b) => a - b)
      const evenGaps: number[] = []
      for (let i = 0; i < rows.length - 1; i++) {
        const gap = rows[i + 1] - rows[i]
        if (gap > 0) evenGaps.push(rows[i + 1] + gap, rows[i] - gap)
      }

      const near = (candidates: number[], value: number) =>
        candidates.find((c) => Math.abs(c - value) <= SNAP_DISTANCE)

      startDrag(
        e,
        tag,
        (dx, dy) => {
          const rawX = Math.max(0, x + dx)
          const rawY = Math.max(0, y + dy)
          const snapX = near(lefts, rawX)
          const snapY = near(tops, rawY) ?? near(evenGaps, rawY)
          setGuideX(snapX ?? null)
          setGuideY(snapY ?? null)
          update(item.id, { x: snapX ?? rawX, y: snapY ?? rawY }, tag)
        },
        'move',
      )
    } else {
      const { x1, y1, x2, y2 } = item
      startDrag(
        e,
        tag,
        (dx, dy) => update(item.id, { x1: x1 + dx, y1: y1 + dy, x2: x2 + dx, y2: y2 + dy }, tag),
        'move',
      )
    }
  }

  // Bump the selected box's text size, one step at a time.
  function resizeFont(delta: number) {
    if (selectedItem?.kind !== 'text') return
    const next = Math.min(FONT_MAX, Math.max(FONT_MIN, (selectedItem.size ?? FONT_PX) + delta))
    update(selectedItem.id, { size: next })
  }

  // A middle dot in front of the text, the way the lecture slides mark a step.
  function toggleBullet() {
    if (selectedItem?.kind !== 'text') return
    const { id, html } = selectedItem
    update(id, { html: html.startsWith(BULLET) ? html.slice(BULLET.length) : BULLET + html })
    setRev((r) => r + 1) // the box is uncontrolled while typing; force a re-seed
  }

  const selectedItem = canvas.items.find((it) => it.id === selected)
  const height = boardHeight(canvas)

  return (
    <div className="mt-4">
      {editing && (
        <Toolbar
          onAddText={addText}
          onAddArrow={() => addArrow(false)}
          onAddDoubleArrow={() => addArrow(true)}
          selected={selectedItem}
          onDelete={() => selected && remove(selected)}
          onBullet={toggleBullet}
          onBigger={() => resizeFont(2)}
          onSmaller={() => resizeFont(-2)}
          onUndo={undo}
          onRedo={redo}
          canUndo={past.current.length > 0}
          canRedo={future.current.length > 0}
        />
      )}

      {/* The board is scaled to whatever width it is given. On a phone that
          would be a scale of about 0.4, putting the labels at 6px — so it is
          held to a floor and the narrow screen scrolls sideways across it
          instead of shrinking it past reading size.

          That sideways scroll belongs here only in the article, where this is
          the sole scroller. In the zoom view the board is handed an exact width
          and fills this wrapper edge to edge, so there is nothing here to
          scroll; keeping it a scroll container only lets it swallow the swipe
          and — with `overscroll-x-contain` — stop it chaining out to the
          overlay that actually pans, snapping the diagram back to its left
          edge. So drop the scroller when a boardWidth is set. */}
      <div
        className={`w-full rounded border bg-white ${
          boardWidth ? '' : 'overflow-x-auto overscroll-x-contain'
        } ${editing ? 'border-neutral-300' : 'border-neutral-200'}`}
      >
        <div
          className={`relative ${boardWidth ? '' : 'w-full min-w-[620px]'}`}
          style={{ aspectRatio: `${CANVAS_WIDTH} / ${height}`, width: boardWidth }}
          onPointerDown={() => {
            setSelected(null)
            setTyping(null)
          }}
        >
          {/* Fixed coordinate space, scaled to the rendered width. */}
          <div
            ref={boardRef}
            className="absolute left-0 top-0 origin-top-left"
            style={{ width: CANVAS_WIDTH, height, opacity: fitted ? 1 : 0 }}
          >
            {/* Arrows sit under the text boxes */}
            <svg
              className="absolute inset-0"
              width={CANVAS_WIDTH}
              height={height}
              style={{ pointerEvents: 'none' }}
            >
              <defs>
                <marker id="ks-head" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
                  <path d="M0,0 L9,4.5 L0,9 z" fill="currentColor" />
                </marker>
                <marker id="ks-tail" markerWidth="9" markerHeight="9" refX="1" refY="4.5" orient="auto">
                  <path d="M9,0 L0,4.5 L9,9 z" fill="currentColor" />
                </marker>
              </defs>

              {canvas.items
                .filter((it): it is KeyStepArrowItem => it.kind === 'arrow')
                .map((a) => (
                  <g key={a.id} className="text-foreground">
                    <line
                      x1={a.x1}
                      y1={a.y1}
                      x2={a.x2}
                      y2={a.y2}
                      stroke="currentColor"
                      strokeWidth={1.5}
                      markerEnd="url(#ks-head)"
                      markerStart={a.double ? 'url(#ks-tail)' : undefined}
                    />
                    {editing && (
                      <line
                        x1={a.x1}
                        y1={a.y1}
                        x2={a.x2}
                        y2={a.y2}
                        stroke="transparent"
                        strokeWidth={14}
                        className="cursor-move"
                        style={{ pointerEvents: 'stroke' }}
                        onPointerDown={(e) => {
                          setSelected(a.id)
                          setTyping(null)
                          dragItem(e, a)
                        }}
                      />
                    )}
                    {editing && selected === a.id && (
                      <>
                        <EndHandle
                          x={a.x1}
                          y={a.y1}
                          cursor={endCursor(a)}
                          onPointerDown={(e) =>
                            startDrag(
                              e,
                              `end:${a.id}:1`,
                              (dx, dy) =>
                                update(a.id, { x1: a.x1 + dx, y1: a.y1 + dy }, `end:${a.id}:1`),
                              endCursor(a),
                            )
                          }
                        />
                        <EndHandle
                          x={a.x2}
                          y={a.y2}
                          cursor={endCursor(a)}
                          onPointerDown={(e) =>
                            startDrag(
                              e,
                              `end:${a.id}:2`,
                              (dx, dy) =>
                                update(a.id, { x2: a.x2 + dx, y2: a.y2 + dy }, `end:${a.id}:2`),
                              endCursor(a),
                            )
                          }
                        />
                      </>
                    )}
                  </g>
                ))}
            </svg>

            {canvas.items
              .filter((it): it is KeyStepTextItem => it.kind === 'text')
              .map((t) => (
                <TextBox
                  key={t.id}
                  item={t}
                  rev={rev}
                  editing={editing}
                  selected={selected === t.id}
                  typing={typing === t.id}
                  onSelect={() => {
                    setSelected(t.id)
                    setTyping(null)
                  }}
                  onType={() => {
                    setSelected(t.id)
                    setTyping(t.id)
                  }}
                  onDrag={(e) => dragItem(e, t)}
                  onResize={(e) => {
                    const startW = t.w ?? 0
                    const tag = `size:${t.id}`
                    startDrag(
                      e,
                      tag,
                      (dx) => update(t.id, { w: Math.max(40, (startW || 120) + dx) }, tag),
                      'ew-resize',
                    )
                  }}
                  onChange={(html) => update(t.id, { html }, `text:${t.id}`)}
                />
              ))}

            {guideX !== null && (
              <span
                className="pointer-events-none absolute bottom-0 top-0 border-l border-dashed border-science-red"
                style={{ left: guideX }}
              />
            )}
            {guideY !== null && (
              <span
                className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-science-red"
                style={{ top: guideY }}
              />
            )}
          </div>
        </div>
      </div>

      {editing && (
        <p className="mt-2 text-[11px] leading-snug text-neutral-500">
          클릭해 선택하고 끌어서 옮깁니다. 글자를 고치려면 더블클릭하세요. Ctrl+Z 되돌리기,
          Ctrl+Shift+Z 다시 실행.
        </p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
/**
 * The diagram at full size, over the page, closed by the backdrop or Escape —
 * the same gesture the figure galleries answer to.
 *
 * Nothing is converted to an image on the way. The board is already drawn into
 * a fixed coordinate space and scaled to whatever width it is handed, so
 * enlarging it is only a matter of handing it a bigger one: the labels stay
 * live text and the arrows stay SVG, sharp at any size.
 */
export function KeyStepZoom({ canvas, onClose }: { canvas: Canvas; onClose: () => void }) {
  const height = boardHeight(canvas)
  const [width, setWidth] = useState(CANVAS_WIDTH)

  useEffect(() => {
    const measure = () => {
      // As large as fits within both the width and the height of the window —
      // but never below the size the diagram was drawn at. On a phone, fitting
      // 900px into a 375px screen would put the labels at 6px, which is not
      // enlarging anything; there the board keeps its own size and the screen
      // pans across it.
      const room = Math.min(
        window.innerWidth - 32,
        ((window.innerHeight - 96) * CANVAS_WIDTH) / height,
      )
      setWidth(Math.round(Math.max(CANVAS_WIDTH, room)))
    }
    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('orientationchange', measure)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('orientationchange', measure)
    }
  }, [height])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 overflow-auto overscroll-contain bg-black/85 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Key step diagram"
    >
      {/* Fixed, not absolute: the overlay scrolls when the board is wider than
          the screen, and the way out must not scroll away with it. */}
      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        className="fixed right-4 top-4 z-10 inline-flex items-center gap-1 rounded bg-white/90 px-3 py-1.5 text-[12px] font-bold text-foreground transition-colors hover:bg-white"
      >
        <X className="size-[15px]" />
        닫기
      </button>

      {/* `w-max` lets this row grow to the full diagram width so the overlay
          scrolls — and swipes on a phone pan — across the whole of it; without
          it a diagram wider than the screen has its left and right edges
          centred out of reach. `min-w-full` keeps it at least a screenful so a
          diagram narrower than the window still sits centred. */}
      <div className="flex min-h-full w-max min-w-full items-center justify-center">
        <div style={{ width }} onClick={(e) => e.stopPropagation()}>
          <KeyStepCanvas
            canvas={canvas}
            editing={false}
            onChange={() => {}}
            boardWidth={width}
          />
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// PowerPoint-style selection furniture: a thin grey frame with small white
// square handles.
function EndHandle({
  x,
  y,
  cursor,
  onPointerDown,
}: {
  x: number
  y: number
  cursor: string
  onPointerDown: (e: React.PointerEvent) => void
}) {
  return (
    <rect
      x={x - 4}
      y={y - 4}
      width={8}
      height={8}
      className="fill-white stroke-neutral-500"
      strokeWidth={1}
      style={{ pointerEvents: 'all', cursor }}
      onPointerDown={onPointerDown}
    />
  )
}

function TextBox({
  item,
  rev,
  editing,
  selected,
  typing,
  onSelect,
  onType,
  onDrag,
  onResize,
  onChange,
}: {
  item: KeyStepTextItem
  rev: number
  editing: boolean
  selected: boolean
  typing: boolean
  onSelect: () => void
  onType: () => void
  onDrag: (e: React.PointerEvent) => void
  onResize: (e: React.PointerEvent) => void
  onChange: (html: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  // Seed the DOM when typing starts and after an undo/redo (`rev`). Writing the
  // value back on every keystroke would rebuild the node and throw the caret to
  // the start.
  useEffect(() => {
    if (ref.current) ref.current.innerHTML = item.html
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typing, rev, editing])

  useEffect(() => {
    if (typing) ref.current?.focus()
  }, [typing])

  const style = {
    left: item.x,
    top: item.y,
    width: item.w,
    fontSize: item.size ?? FONT_PX,
  }
  const textClass = `px-1 leading-relaxed text-foreground outline-none ${item.w ? 'whitespace-normal' : 'whitespace-nowrap'}`

  if (!editing) {
    return (
      <div
        className={`absolute ${textClass}`}
        style={style}
        dangerouslySetInnerHTML={{ __html: sanitizeRich(item.html) }}
      />
    )
  }

  return (
    <div
      className={`absolute ${typing ? 'outline outline-1 outline-neutral-500' : selected ? 'outline outline-1 outline-neutral-400' : 'outline outline-1 outline-transparent hover:outline-neutral-300'}`}
      style={style}
      onPointerDown={(e) => {
        e.stopPropagation()
        if (typing) return // let the caret land where it was clicked
        onSelect()
        onDrag(e) // click to select, drag to move — as in a slide editor
      }}
      onDoubleClick={onType}
    >
      <div
        ref={ref}
        contentEditable={typing}
        suppressContentEditableWarning
        role="textbox"
        className={`${textClass} ${typing ? 'cursor-text' : 'cursor-move select-none'}`}
        onInput={(e) => onChange(sanitizeRich(e.currentTarget.innerHTML))}
        onPaste={(e) => {
          e.preventDefault()
          document.execCommand('insertText', false, e.clipboardData.getData('text/plain'))
        }}
      />

      {selected && (
        <>
          {/* Corner marks, and a live handle on the right edge for the width. */}
          {['-left-1 -top-1', '-right-1 -top-1', '-left-1 -bottom-1', '-right-1 -bottom-1'].map(
            (pos) => (
              <span
                key={pos}
                className={`absolute ${pos} size-2 border border-neutral-500 bg-white`}
              />
            ),
          )}
          <span
            onPointerDown={(e) => {
              e.stopPropagation()
              onResize(e)
            }}
            className="absolute -right-1 top-1/2 size-2 -translate-y-1/2 cursor-ew-resize border border-neutral-500 bg-white"
          />
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Formatting acts on whatever text box currently holds the caret. execCommand is
// deprecated but it is the only API that edits a contentEditable selection
// without hand-rolling range surgery, and every target browser still ships it.
function Toolbar({
  onAddText,
  onAddArrow,
  onAddDoubleArrow,
  selected,
  onDelete,
  onBullet,
  onBigger,
  onSmaller,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: {
  onAddText: () => void
  onAddArrow: () => void
  onAddDoubleArrow: () => void
  selected?: KeyStepItem
  onDelete: () => void
  onBullet: () => void
  onBigger: () => void
  onSmaller: () => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
}) {
  const run = (command: string) => document.execCommand(command, false)

  return (
    <div className="mb-2 flex flex-wrap items-center gap-1 rounded border border-neutral-200 bg-panel/40 px-2 py-2">
      <ToolButton onClick={onUndo} title="되돌리기 (Ctrl+Z)" disabled={!canUndo}>
        <Undo2 className="size-[13px]" />
      </ToolButton>
      <ToolButton onClick={onRedo} title="다시 실행 (Ctrl+Shift+Z)" disabled={!canRedo}>
        <Redo2 className="size-[13px]" />
      </ToolButton>

      <span className="mx-1 h-5 w-px bg-neutral-300" />

      <ToolButton onClick={onAddText} title="텍스트 상자 넣기" wide>
        <Type className="size-[13px]" />
        텍스트 상자
      </ToolButton>
      <ToolButton onClick={onAddArrow} title="화살표 넣기 — 한쪽 방향" wide>
        <ArrowRight className="size-[13px]" />
        화살표
      </ToolButton>
      <ToolButton onClick={onAddDoubleArrow} title="화살표 넣기 — 양쪽 방향 (가역)" wide>
        <ArrowLeftRight className="size-[13px]" />
        양방향
      </ToolButton>

      <span className="mx-1 h-5 w-px bg-neutral-300" />

      <ToolButton onClick={() => run('italic')} title="기울임 (효소명)">
        <Italic className="size-[13px]" />
      </ToolButton>
      <ToolButton onClick={() => run('bold')} title="굵게">
        <Bold className="size-[13px]" />
      </ToolButton>
      <ToolButton onClick={() => run('superscript')} title="위첨자 — 이온 (H+, Mg2+)">
        <Superscript className="size-[13px]" />
      </ToolButton>
      <ToolButton onClick={() => run('subscript')} title="아래첨자 — 화학식 (H2O, CO2)">
        <Subscript className="size-[13px]" />
      </ToolButton>
      <ToolButton
        onClick={onBullet}
        title="글머리 가운뎃점 — 글자 맨 앞에 · 넣기/빼기"
        disabled={selected?.kind !== 'text'}
      >
        ·
      </ToolButton>

      <span className="mx-1 h-5 w-px bg-neutral-300" />

      <ToolButton
        onClick={onBigger}
        title="글씨 크게 — 선택한 상자"
        disabled={selected?.kind !== 'text'}
        wide
      >
        <span className="text-[14px]">A</span>
        <ChevronUp className="size-[13px]" />
      </ToolButton>
      <ToolButton
        onClick={onSmaller}
        title="글씨 작게 — 선택한 상자"
        disabled={selected?.kind !== 'text'}
        wide
      >
        <span className="text-[11px]">A</span>
        <ChevronDown className="size-[13px]" />
      </ToolButton>

      <span className="mx-1 h-5 w-px bg-neutral-300" />

      <ToolButton onClick={onDelete} title="선택한 것 삭제" wide disabled={!selected}>
        선택 삭제
      </ToolButton>
    </div>
  )
}

function ToolButton({
  onClick,
  title,
  children,
  wide,
  disabled,
}: {
  onClick: () => void
  title: string
  children: React.ReactNode
  wide?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      // Keep the caret in the text box being formatted — a focus change would
      // collapse the selection before execCommand runs.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`flex h-7 items-center justify-center gap-1 rounded border border-neutral-300 bg-white text-[12px] font-bold text-neutral-600 transition-colors hover:border-science-red hover:text-science-red disabled:opacity-40 disabled:hover:border-neutral-300 disabled:hover:text-neutral-600 ${wide ? 'px-2.5' : 'w-7'}`}
    >
      {children}
    </button>
  )
}
