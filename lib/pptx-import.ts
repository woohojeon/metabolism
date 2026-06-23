// 브라우저에서 .pptx 를 직접 파싱해 대사지도 데이터(metabolic_data.json 과 동일 구조)를 만든다.
// extract_map.py 의 로직을 TypeScript 로 포팅한 것.
import JSZip from 'jszip'

export type RawNode = Record<string, any>
export type MapData = {
  slide_w: number
  slide_h: number
  master_nodes: RawNode[]
  pathways: { slide: number; note: string; name: string; category: string; node_indices: number[] }[]
}

// ---- DOM helpers (namespace-agnostic via localName) ----
function kids(el: Element, name: string): Element[] {
  return Array.from(el.children).filter((c) => c.localName === name)
}
function kid(el: Element, name: string): Element | null {
  for (const c of Array.from(el.children)) if (c.localName === name) return c
  return null
}
function descendants(el: Element, name: string): Element[] {
  return Array.from(el.getElementsByTagName('*')).filter((e) => e.localName === name)
}
function textOf(el: Element): string {
  return descendants(el, 't')
    .map((t) => t.textContent || '')
    .join('')
    .trim()
}

// ---- color ----
function hexToRgb(h: string): [number, number, number] {
  h = h.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}
function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0').toUpperCase()
  return c(r) + c(g) + c(b)
}
function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h /= 6
  }
  return [h, s, l]
}
function hslToRgb(h: number, s: number, l: number) {
  let r, g, b
  if (s === 0) { r = g = b = l } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1; if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1 / 3)
  }
  return [r * 255, g * 255, b * 255] as [number, number, number]
}
function applyMods(rgb: [number, number, number], mods: [string, string | null][]) {
  let [h, s, l] = rgbToHsl(rgb[0], rgb[1], rgb[2])
  for (const [tag, val] of mods) {
    const v = val ? parseInt(val) / 100000 : 0
    if (tag === 'lumMod') l *= v
    else if (tag === 'lumOff') l += v
    else if (tag === 'shade') l *= v
    else if (tag === 'tint') l = l * v + (1 - v)
    else if (tag === 'satMod') s *= v
  }
  l = Math.max(0, Math.min(1, l)); s = Math.max(0, Math.min(1, s))
  return hslToRgb(h, s, l)
}

export async function parsePptx(buf: ArrayBuffer): Promise<MapData> {
  const zip = await JSZip.loadAsync(buf)
  const dp = new DOMParser()
  const readXml = async (p: string) => dp.parseFromString(await zip.file(p)!.async('string'), 'application/xml')

  // theme + colorMap
  const theme = await readXml('ppt/theme/theme1.xml')
  const THEME: Record<string, string> = {}
  const clrScheme = descendants(theme.documentElement, 'clrScheme')[0]
  for (const c of Array.from(clrScheme.children)) {
    const ch = c.children[0]
    THEME[c.localName] = ch.getAttribute('lastClr') || ch.getAttribute('val') || ''
  }
  const master = await readXml('ppt/slideMasters/slideMaster1.xml')
  const clrMapEl = descendants(master.documentElement, 'clrMap')[0]
  const CLRMAP: Record<string, string> = {}
  if (clrMapEl) for (const a of Array.from(clrMapEl.attributes)) CLRMAP[a.name.replace(/^.*:/, '')] = a.value

  function resolve(clr: Element): string | null {
    const tag = clr.localName
    let base: string | null = null
    if (tag === 'srgbClr') base = clr.getAttribute('val')
    else if (tag === 'sysClr') base = clr.getAttribute('lastClr')
    else if (tag === 'schemeClr') {
      let nm = clr.getAttribute('val') || ''
      nm = CLRMAP[nm] || nm
      if (nm === 'phClr') return null
      base = THEME[nm] || null
    }
    if (!base) return null
    const mods: [string, string | null][] = Array.from(clr.children).map((m) => [m.localName, m.getAttribute('val')])
    if (mods.length) { const r = applyMods(hexToRgb(base), mods); return rgbToHex(r[0], r[1], r[2]) }
    return base.toUpperCase()
  }
  function firstColor(container: Element | null): string | null {
    if (!container) return null
    const sf = kid(container, 'solidFill')
    if (!sf || sf.children.length === 0) return null
    return resolve(sf.children[0])
  }

  // presentation size + slide order
  const pres = await readXml('ppt/presentation.xml')
  const sldSz = descendants(pres.documentElement, 'sldSz')[0]
  const CX = parseInt(sldSz.getAttribute('cx')!), CY = parseInt(sldSz.getAttribute('cy')!)
  const presRels = await readXml('ppt/_rels/presentation.xml.rels')
  const rid2: Record<string, string> = {}
  for (const r of descendants(presRels.documentElement, 'Relationship')) rid2[r.getAttribute('Id')!] = r.getAttribute('Target')!
  const order: string[] = []
  const sldIdLst = descendants(pres.documentElement, 'sldIdLst')[0]
  for (const sid of Array.from(sldIdLst.children)) {
    const rid = sid.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id') ||
      Array.from(sid.attributes).find((a) => a.name.endsWith(':id'))?.value || ''
    order.push('ppt/' + rid2[rid].replace('../', ''))
  }

  const FILLS = new Set(['solidFill', 'gradFill', 'blipFill', 'pattFill'])
  function fontPt(sp: Element): [number, number] {
    const tx = kid(sp, 'txBody')
    let autofit = 1, sz: number | null = null
    if (tx) {
      const bodyPr = kid(tx, 'bodyPr')
      const naf = bodyPr ? kid(bodyPr, 'normAutofit') : null
      if (naf && naf.getAttribute('fontScale')) autofit = parseInt(naf.getAttribute('fontScale')!) / 100000
      const r = descendants(tx, 'r')[0]
      const rpr = r ? kid(r, 'rPr') : null
      if (rpr && rpr.getAttribute('sz')) sz = parseInt(rpr.getAttribute('sz')!)
      if (sz == null) {
        for (const p of descendants(tx, 'p')) {
          const ppr = kid(p, 'pPr'), dr = ppr ? kid(ppr, 'defRPr') : null
          if (dr && dr.getAttribute('sz')) { sz = parseInt(dr.getAttribute('sz')!); break }
        }
      }
    }
    if (sz == null) sz = 1100
    return [sz / 100, autofit]
  }
  function nodeStyle(sp: Element): [string | null, string | null, string | null] {
    const spPr = kid(sp, 'spPr'), style = kid(sp, 'style')
    let fill: string | null = null
    if (spPr) {
      if (kid(spPr, 'noFill')) fill = null
      else fill = firstColor(spPr)
    }
    if (!fill && style) {
      const fr = kid(style, 'fillRef')
      if (fr && (fr.getAttribute('idx') || '0') !== '0' && fr.children.length) fill = resolve(fr.children[0])
    }
    let stroke: string | null = null
    const ln = spPr ? kid(spPr, 'ln') : null
    if (ln && !kid(ln, 'noFill')) {
      stroke = firstColor(ln)
      if (!stroke && ln.getAttribute('w')) stroke = '808080'
    }
    if (!stroke && style) {
      const lr = kid(style, 'lnRef')
      if (lr && (lr.getAttribute('idx') || '0') !== '0' && lr.children.length) stroke = resolve(lr.children[0])
    }
    let color: string | null = null
    for (const rpr of descendants(sp, 'rPr')) { color = firstColor(rpr); if (color) break }
    return [fill, stroke, color]
  }
  function parsePath(spPr: Element): any[] | null {
    const cg = kid(spPr, 'custGeom'); if (!cg) return null
    const pl = kid(cg, 'pathLst'); if (!pl) return null
    const subs: any[] = []
    for (const path of kids(pl, 'path')) {
      const pw = parseInt(path.getAttribute('w') || '0'), ph = parseInt(path.getAttribute('h') || '0')
      if (!pw || !ph) return null
      const cmds: any[] = []
      for (const c of Array.from(path.children)) {
        const pts = kids(c, 'pt')
        const nx = (p: Element) => Math.round((parseInt(p.getAttribute('x')!) / pw) * 1e4) / 1e4
        const ny = (p: Element) => Math.round((parseInt(p.getAttribute('y')!) / ph) * 1e4) / 1e4
        if (c.localName === 'moveTo') cmds.push(['M', nx(pts[0]), ny(pts[0])])
        else if (c.localName === 'lnTo') cmds.push(['L', nx(pts[0]), ny(pts[0])])
        else if (c.localName === 'cubicBezTo') cmds.push(['C', nx(pts[0]), ny(pts[0]), nx(pts[1]), ny(pts[1]), nx(pts[2]), ny(pts[2])])
        else if (c.localName === 'quadBezTo') cmds.push(['Q', nx(pts[0]), ny(pts[0]), nx(pts[1]), ny(pts[1])])
        else if (c.localName === 'close') cmds.push(['Z'])
        else if (c.localName === 'arcTo') return null
      }
      subs.push(cmds)
    }
    return subs.length ? subs : null
  }

  type Mapper = (lx: number, ly: number, lw: number, lh: number) => [number, number, number, number]
  function collect(el: Element, mapper: Mapper, gscale: number, out: RawNode[]) {
    const tag = el.localName
    if (tag === 'grpSp') {
      const gp = kid(el, 'grpSpPr')!, x = kid(gp, 'xfrm')!
      const off = kid(x, 'off')!, ext = kid(x, 'ext')!, choff = kid(x, 'chOff')!, chext = kid(x, 'chExt')!
      const ox = +off.getAttribute('x')!, oy = +off.getAttribute('y')!
      const ex = +ext.getAttribute('cx')!, ey = +ext.getAttribute('cy')!
      const cox = +choff.getAttribute('x')!, coy = +choff.getAttribute('y')!
      const cex = +chext.getAttribute('cx')!, cey = +chext.getAttribute('cy')!
      const sx = cex ? ex / cex : 1, sy = cey ? ey / cey : 1
      for (const ch of Array.from(el.children))
        collect(ch, (lx, ly, lw, lh) => mapper(ox + (lx - cox) * sx, oy + (ly - coy) * sy, lw * sx, lh * sy), gscale * ((sx + sy) / 2), out)
      return
    }
    if (tag !== 'sp' && tag !== 'cxnSp' && tag !== 'pic') return
    const spPr = kid(el, 'spPr'); if (!spPr) return
    const x = kid(spPr, 'xfrm'); if (!x) return
    const off = kid(x, 'off'), ext = kid(x, 'ext'); if (!off || !ext) return
    const lx = +off.getAttribute('x')!, ly = +off.getAttribute('y')!, lw = +ext.getAttribute('cx')!, lh = +ext.getAttribute('cy')!
    const [ax, ay, aw, ah] = mapper(lx, ly, lw, lh)
    const g = kid(spPr, 'prstGeom')
    const prst = g ? g.getAttribute('prst') : null
    const isCustom = !!kid(spPr, 'custGeom')
    let type_: string
    if (tag === 'cxnSp') type_ = 'LINE'
    else if (tag === 'pic') type_ = 'PICTURE'
    else if (isCustom) type_ = 'FREEFORM'
    else type_ = 'AUTO_SHAPE'
    let fill: string | null = null, stroke: string | null = null, color: string | null = null
    if (tag === 'sp' || tag === 'cxnSp') [fill, stroke, color] = nodeStyle(el)
    const node: RawNode = {
      type: type_, text: tag === 'sp' ? textOf(el) : '',
      x: ax / CX, y: ay / CY, w: aw / CX, h: ah / CY, boxed: !!(fill || stroke),
    }
    if (prst) node.prst = prst
    if (prst === 'arc') {
      const av = kid(g!, 'avLst')
      let a1 = 16200000, a2 = 0
      if (av) for (const gd of kids(av, 'gd')) {
        const fm = (gd.getAttribute('fmla') || '').split(' ')
        const v = fm.length ? parseInt(fm[fm.length - 1]) : NaN
        if (!isNaN(v)) { if (gd.getAttribute('name') === 'adj1') a1 = v; else if (gd.getAttribute('name') === 'adj2') a2 = v }
      }
      node.arc = [Math.round(a1 / 600) / 100, Math.round(a2 / 600) / 100]
    }
    const rot = x.getAttribute('rot')
    if (rot && +rot !== 0) node.rot = Math.round(+rot / 600) / 100
    if (x.getAttribute('flipH') === '1') node.fH = true
    if (x.getAttribute('flipV') === '1') node.fV = true
    if (fill) node.fill = '#' + fill
    if (stroke) node.stroke = '#' + stroke
    if (color) node.color = '#' + color
    if (tag === 'cxnSp') {
      const ln = kid(spPr, 'ln')
      if (ln) {
        const te = kid(ln, 'tailEnd'), he = kid(ln, 'headEnd')
        if (te && te.getAttribute('type') && te.getAttribute('type') !== 'none') node.aTail = true
        if (he && he.getAttribute('type') && he.getAttribute('type') !== 'none') node.aHead = true
      }
    }
    if (node.text) {
      const [pt, af] = fontPt(el)
      node.fs = Math.round(pt * af * gscale * ((12700 * 1000) / CX) * 100) / 100
    }
    if (type_ === 'FREEFORM') { const p = parsePath(spPr); if (p) node.path = p }
    out.push(node)
  }

  async function shapesOf(file: string): Promise<RawNode[]> {
    const doc = await readXml(file)
    const spTree = kid(kid(doc.documentElement, 'cSld')!, 'spTree')!
    const out: RawNode[] = []
    for (const ch of Array.from(spTree.children)) collect(ch, (x, y, w, h) => [x, y, w, h], 1, out)
    return out
  }
  async function noteOf(file: string): Promise<string> {
    const relPath = file.replace('ppt/slides/', 'ppt/slides/_rels/') + '.rels'
    const f = zip.file(relPath); if (!f) return ''
    const rr = dp.parseFromString(await f.async('string'), 'application/xml')
    let nt: string | null = null
    for (const r of descendants(rr.documentElement, 'Relationship'))
      if ((r.getAttribute('Target') || '').includes('notesSlide')) nt = 'ppt/' + r.getAttribute('Target')!.replace('../', '')
    if (!nt) return ''
    const nr = await readXml(nt)
    return textOf(nr.documentElement)
  }

  const masterNodes = await shapesOf(order[0])
  const idx = new Map<string, number[]>()
  masterNodes.forEach((s, i) => {
    const k = `${s.x.toFixed(4)},${s.y.toFixed(4)}`
    if (!idx.has(k)) idx.set(k, [])
    idx.get(k)!.push(i)
  })
  function match(shape: RawNode): number | null {
    const k = `${shape.x.toFixed(4)},${shape.y.toFixed(4)}`
    const cands = idx.get(k)
    if (cands) {
      for (const i of cands) if (masterNodes[i].text === shape.text) return i
      return cands[0]
    }
    let best: number | null = null, bd = 1e9
    masterNodes.forEach((s, i) => {
      const d = Math.abs(s.x - shape.x) + Math.abs(s.y - shape.y)
      if (d < bd) { bd = d; best = i }
    })
    return bd < 0.0015 ? best : null
  }
  const catOf = (n: string) => {
    const t = n.trim()
    return t.startsWith('2.') ? 'lipid' : t.startsWith('3.') ? 'protein' : t.startsWith('4.') ? 'nucleic' : 'carbohydrate'
  }
  const clean = (n: string) => n.trim().replace(/\s*\d+\s*$/, '')
  const nameOf = (n: string) => { const m = n.match(/\(([^)]*)\)/); return (m ? m[1] : n).replace(/\s+/g, ' ').trim() }

  const pathways: MapData['pathways'] = []
  for (let i = 1; i < order.length; i++) {
    const sh = await shapesOf(order[i])
    const note = clean(await noteOf(order[i]))
    const set = new Set<number>()
    for (const s of sh) { const mi = match(s); if (mi != null) set.add(mi) }
    let nm = nameOf(note)
    if (catOf(note) === 'lipid' && nm.endsWith('Oxidation') && nm !== 'Keto acid Oxidation') nm = 'β-Oxidation'
    pathways.push({ slide: i + 1, note, name: nm, category: catOf(note), node_indices: Array.from(set).sort((a, b) => a - b) })
  }

  return { slide_w: CX, slide_h: CY, master_nodes: masterNodes, pathways }
}
