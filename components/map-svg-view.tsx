'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

// LibreOffice 가 변환한 벡터 SVG(슬라이드 20장 + 슬라이드쇼 스크립트)에서
// 스크립트를 제거하고, 선택한 슬라이드(g.Slide#idN)만 CSS 로 표시한다.
// 실제 렌더러 출력이라 화살표/글씨가 PowerPoint 와 동일.

type Cat = 'overview' | 'carbohydrate' | 'lipid' | 'protein' | 'nucleic'
// Category accent colours sampled from each section's cover photo:
// carbohydrate = golden bread/amber, lipid = teal oil bubbles,
// protein = red cured meat, nucleic acid = deep blue DNA helix.
const CAT: Record<Cat, { label: string; color: string }> = {
  overview: { label: 'Overview', color: '#111111' },
  carbohydrate: { label: 'Carbohydrate', color: '#B5793A' },
  lipid: { label: 'Lipid', color: '#1F9E93' },
  protein: { label: 'Protein', color: '#C0433C' },
  nucleic: { label: 'Nucleic acid', color: '#34618E' },
}

// 이 deck 의 슬라이드 순서(고정). id1 = 슬라이드1(전체 지도).
const SLIDES: { id: string; name: string; cat: Cat }[] = [
  { id: 'id1', name: 'Full Metabolic Map', cat: 'overview' },
  { id: 'id2', name: 'Glycolysis', cat: 'carbohydrate' },
  { id: 'id3', name: 'Gluconeogenesis', cat: 'carbohydrate' },
  { id: 'id4', name: 'Other Hexoses and disaccharides', cat: 'carbohydrate' },
  { id: 'id5', name: 'Glycogen Metabolism', cat: 'carbohydrate' },
  { id: 'id6', name: 'Pentose phosphate pathway', cat: 'carbohydrate' },
  { id: 'id7', name: 'Fates of Pyruvate', cat: 'carbohydrate' },
  { id: 'id8', name: 'Citrate Cycle', cat: 'carbohydrate' },
  { id: 'id9', name: 'Electron transfer system & Oxidative Phosphorylation', cat: 'carbohydrate' },
  { id: 'id10', name: 'Glycerol Metabolism', cat: 'lipid' },
  { id: 'id11', name: 'β-Oxidation', cat: 'lipid' },
  { id: 'id12', name: 'Ketone bodies', cat: 'lipid' },
  { id: 'id13', name: 'Fatty acid synthesis', cat: 'lipid' },
  { id: 'id14', name: 'Lipogenesis', cat: 'lipid' },
  { id: 'id15', name: 'Transamination & Oxidative Deamination', cat: 'protein' },
  { id: 'id16', name: 'Urea Cycle', cat: 'protein' },
  { id: 'id17', name: 'Keto acid Oxidation', cat: 'protein' },
  { id: 'id18', name: 'Amino acid Synthesis', cat: 'protein' },
  { id: 'id19', name: 'Purine Nucleotides', cat: 'nucleic' },
  { id: 'id20', name: 'Pyrimidine Nucleotides', cat: 'nucleic' },
]

// The width the slide is drawn at.
const SLIDE_WIDTH = 1000

export function MapSvgView() {
  const [svg, setSvg] = useState('')
  const [sel, setSel] = useState('id1')
  // A phone is a third of a slide wide, so opening at 100% would drop the
  // reader into the top-left corner of a map they would then have to pan
  // blind. `null` means "as wide as it will go", which is where every screen
  // narrower than the slide starts and what the percentage button returns to.
  const [zoom, setZoom] = useState<number | null>(null)
  const [fit, setFit] = useState(1)
  const viewRef = useRef<HTMLDivElement>(null)
  const ZMIN = 0.3, ZMAX = 5
  const scale = zoom ?? fit
  const bump = (d: number) =>
    setZoom(Math.round(Math.min(ZMAX, Math.max(ZMIN, scale + d)) * 100) / 100)

  // Track the width the slide has to sit in, so "fit" stays true through a
  // rotation or a split-screen resize. Rounded down, so fitting never itself
  // brings on the sideways scrollbar it exists to avoid.
  useEffect(() => {
    const el = viewRef.current
    if (!el) return
    const measure = () =>
      setFit(Math.min(1, Math.floor((el.clientWidth / SLIDE_WIDTH) * 100) / 100))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    fetch('/metabolic-map.svg')
      .then((r) => r.text())
      .then((t) =>
        setSvg(
          t
            .replace(/<\?xml[\s\S]*?\?>/, '')
            .replace(/<!DOCTYPE[\s\S]*?>/, '')
            .replace(/<script[\s\S]*?<\/script>/gi, ''),
        ),
      )
      .catch(() => setSvg(''))
  }, [])

  const groups = useMemo(() => {
    const order: Cat[] = ['overview', 'carbohydrate', 'lipid', 'protein', 'nucleic']
    return order.map((c) => ({ cat: c, ...CAT[c], items: SLIDES.filter((s) => s.cat === c) }))
  }, [])
  const current = SLIDES.find((s) => s.id === sel)!

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      {/* Twenty slide titles ahead of the map would push the map itself off a
          phone screen entirely, so below `lg` the same choice is a one-line
          picker sitting directly above the slide it changes. */}
      <div className="lg:hidden">
        <label
          htmlFor="map-slide"
          className="text-[12px] font-bold uppercase tracking-[0.15em] text-neutral-500"
        >
          Slide
        </label>
        <select
          id="map-slide"
          value={sel}
          onChange={(e) => setSel(e.target.value)}
          className="mt-1.5 h-11 w-full rounded border border-neutral-300 bg-background px-3 text-[14px] font-semibold text-foreground outline-none focus:border-foreground"
        >
          {groups.map((g) =>
            g.cat === 'overview' ? (
              g.items.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))
            ) : (
              <optgroup key={g.cat} label={g.label}>
                {g.items.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </optgroup>
            ),
          )}
        </select>
      </div>

      {/* Sidebar list */}
      <aside className="hidden lg:block lg:w-[280px] lg:shrink-0">
        <div className="border-b-2 border-foreground pb-2">
          <h2 className="text-[12px] font-bold uppercase tracking-[0.15em] text-neutral-500">Slides</h2>
        </div>
        <div className="mt-3 flex flex-col gap-4 lg:max-h-[calc(100vh-180px)] lg:overflow-y-auto lg:pr-1">
          {groups.map((g) => (
            <div key={g.cat}>
              {g.cat !== 'overview' && (
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-sm" style={{ backgroundColor: g.color }} aria-hidden />
                  <h3 className="text-[13px] font-extrabold uppercase tracking-wide text-foreground">{g.label}</h3>
                  <span className="text-[11px] text-neutral-400">{g.items.length}</span>
                </div>
              )}
              <ul className={g.cat === 'overview' ? '' : 'mt-1.5'}>
                {g.items.map((s) => {
                  const on = sel === s.id
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => setSel(s.id)}
                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[13px] leading-snug transition-colors hover:text-science-red"
                        style={on ? { backgroundColor: g.color + '22', color: g.color, fontWeight: 700 } : undefined}
                      >
                        {s.name}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </aside>

      {/* Slide view */}
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-center justify-between">
          <p className="min-w-0 truncate text-[12px] font-semibold" style={{ color: CAT[current.cat].color }}>{current.name}</p>
          <div className="flex shrink-0 items-center gap-1">
            <button type="button" onClick={() => bump(-0.2)} disabled={scale <= ZMIN} aria-label="Zoom out"
              className="flex size-9 items-center justify-center rounded border border-neutral-300 text-[16px] font-bold text-neutral-600 transition-colors hover:border-foreground disabled:opacity-30 sm:size-7">−</button>
            <button type="button" onClick={() => setZoom(null)} title="화면 너비에 맞추기"
              className="h-9 min-w-[3.4rem] rounded border border-neutral-300 px-2 text-[11px] font-bold tabular-nums text-neutral-600 transition-colors hover:border-foreground sm:h-7">{Math.round(scale * 100)}%</button>
            <button type="button" onClick={() => bump(0.2)} disabled={scale >= ZMAX} aria-label="Zoom in"
              className="flex size-9 items-center justify-center rounded border border-neutral-300 text-[16px] font-bold text-neutral-600 transition-colors hover:border-foreground disabled:opacity-30 sm:size-7">+</button>
          </div>
        </div>

        {/* `dvh`, not `vh`: on a phone `vh` is measured against the tallest the
            window ever gets, so the bottom of the map would sit under the
            browser's own toolbar. */}
        <div
          ref={viewRef}
          className="overflow-auto overscroll-contain rounded border border-neutral-200 bg-white"
          style={{ maxHeight: 'calc(100dvh - 200px)', minHeight: '18rem' }}
        >
          {/* 선택 슬라이드만 표시 */}
          {/* 전체 지도(id1)를 흐리게 깔고, 선택 슬라이드를 위에 또렷하게 겹쳐 강조 */}
          <style>{`.mapsvg svg{width:100%;height:auto;display:block}.mapsvg g.Slide{visibility:hidden}.mapsvg g#id1{visibility:visible;opacity:0.16}.mapsvg g#${sel}{visibility:visible;opacity:1}`}</style>
          {svg ? (
            <div className="mapsvg" style={{ width: `${SLIDE_WIDTH * scale}px`, maxWidth: 'none' }} dangerouslySetInnerHTML={{ __html: svg }} />
          ) : (
            <div className="flex h-[50dvh] items-center justify-center text-[13px] text-neutral-400">불러오는 중…</div>
          )}
        </div>
      </div>
    </div>
  )
}
