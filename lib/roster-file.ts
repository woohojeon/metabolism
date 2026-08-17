// Reads a class roster out of a spreadsheet, in the browser.
//
// The registrar hands out .xls — the old binary format, not a renamed .xlsx —
// so this parses all three shapes a roster arrives in:
//
//   .xls   OLE compound file + BIFF8 records, decoded here from first
//          principles. No library on npm reads it without pulling in a
//          megabyte of workbook writer we would never call.
//   .xlsx  a zip of XML, opened with the JSZip already used by the slide
//          importer.
//   .csv   for a roster that was exported rather than downloaded.
//
// The result is a grid of strings; picking the 학번 and 성명 columns out of it
// is a separate step, so a sheet with extra columns or a title row above the
// header still reads.

import JSZip from 'jszip'

export type RosterRow = {
  /** 학번 — becomes both the username and the password. */
  studentId: string
  /** 성명. */
  name: string
}

// ------------------------------------------------------------------- numbers

/**
 * A cell's number as it was typed, not as JavaScript prints it.
 *
 * A 학번 stored as a number rather than as text would otherwise come back as
 * "202425252" — fine — but a longer one as "2.02425252e+11", which is not an
 * identifier anybody could sign in with.
 */
function numberText(n: number): string {
  if (!Number.isFinite(n)) return ''
  if (Number.isInteger(n)) return n.toFixed(0)
  // Round off the noise a float64 carries, then drop the trailing zeros.
  return String(Number(n.toPrecision(15)))
}

// ------------------------------------------------- OLE2 compound file (.xls)

const OLE_MAGIC = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]

const END_OF_CHAIN = 0xfffffffe

/**
 * Pulls one named stream out of a compound file.
 *
 * A compound file is a FAT filesystem in a single file: a sector table saying
 * which sector follows which, a directory of named streams, and a second,
 * finer-grained table for streams below 4KB. A workbook is far past that
 * cutoff, but the directory itself is read the same way either way, so both
 * are implemented.
 */
function oleStream(buf: ArrayBuffer, wanted: string[]): Uint8Array | null {
  const bytes = new Uint8Array(buf)
  if (OLE_MAGIC.some((b, i) => bytes[i] !== b)) return null

  const view = new DataView(buf)
  const u32 = (off: number) => view.getUint32(off, true)

  const sectorSize = 1 << view.getUint16(0x1e, true)
  const miniSize = 1 << view.getUint16(0x20, true)
  const miniCutoff = u32(0x38)

  // Sector 0 begins one sector in, which is where the header ends.
  const at = (sector: number) => (sector + 1) * sectorSize

  // The DIFAT lists the sectors holding the FAT. Its first 109 entries sit in
  // the header; beyond that it continues in its own chain of sectors, each of
  // which ends with a pointer to the next.
  const fatSectors: number[] = []
  for (let i = 0; i < 109; i++) {
    const s = u32(0x4c + i * 4)
    if (s > END_OF_CHAIN - 4) break
    fatSectors.push(s)
  }
  let difat = u32(0x44)
  const perDifat = sectorSize / 4 - 1
  for (let guard = u32(0x48); difat < END_OF_CHAIN - 4 && guard-- > 0; ) {
    const base = at(difat)
    if (base + sectorSize > bytes.length) break
    for (let i = 0; i < perDifat; i++) {
      const s = u32(base + i * 4)
      if (s < END_OF_CHAIN - 4) fatSectors.push(s)
    }
    difat = u32(base + perDifat * 4)
  }

  const perSector = sectorSize / 4
  const fat = new Uint32Array(fatSectors.length * perSector)
  fatSectors.forEach((sector, i) => {
    const base = at(sector)
    for (let j = 0; j < perSector; j++) {
      fat[i * perSector + j] = base + j * 4 + 4 <= bytes.length ? u32(base + j * 4) : END_OF_CHAIN
    }
  })

  /** Walks a sector chain and concatenates it, stopping at `size` bytes. */
  function chain(start: number, size: number, unit: number, from?: Uint8Array): Uint8Array {
    const out = new Uint8Array(size)
    let written = 0
    let sector = start
    // A malformed FAT could loop; the sector count is a hard ceiling on how
    // many hops a well-formed one needs.
    for (let guard = fat.length + 1; sector < END_OF_CHAIN - 4 && written < size && guard-- > 0; ) {
      const offset = from ? sector * unit : at(sector)
      const take = Math.min(unit, size - written)
      const src = from ?? bytes
      if (offset + take > src.length) break
      out.set(src.subarray(offset, offset + take), written)
      written += take
      sector = fat[sector] ?? END_OF_CHAIN
    }
    return written === size ? out : out.subarray(0, written)
  }

  // The directory is itself a stream. Its length is not recorded, so read the
  // whole chain by asking for everything that could possibly be left.
  const dir = chain(u32(0x30), bytes.length, sectorSize)
  const dirView = new DataView(dir.buffer, dir.byteOffset, dir.byteLength)

  type Entry = { name: string; start: number; size: number; type: number }
  const entries: Entry[] = []
  for (let off = 0; off + 128 <= dir.length; off += 128) {
    const type = dir[off + 0x42]
    if (type !== 2 && type !== 5) continue
    const nameLen = dirView.getUint16(off + 0x40, true)
    let name = ''
    // The length counts the UTF-16 terminator, which is not part of the name.
    for (let i = 0; i + 2 <= Math.max(0, nameLen - 2); i += 2) {
      name += String.fromCharCode(dirView.getUint16(off + i, true))
    }
    entries.push({
      name,
      start: dirView.getUint32(off + 0x74, true),
      size: dirView.getUint32(off + 0x78, true),
      type,
    })
  }

  const target = entries.find((e) => e.type === 2 && wanted.includes(e.name))
  if (!target) return null

  if (target.size >= miniCutoff) return chain(target.start, target.size, sectorSize)

  // Small streams are packed into the root entry's stream and indexed by a
  // second, finer table.
  const root = entries.find((e) => e.type === 5)
  if (!root) return null
  const miniData = chain(root.start, root.size, sectorSize)
  const miniFat = chain(u32(0x3c), u32(0x40) * sectorSize, sectorSize)
  const miniView = new DataView(miniFat.buffer, miniFat.byteOffset, miniFat.byteLength)

  const out = new Uint8Array(target.size)
  let written = 0
  let sector = target.start
  for (let guard = miniFat.length / 4 + 1; sector < END_OF_CHAIN - 4 && written < target.size && guard-- > 0; ) {
    const offset = sector * miniSize
    const take = Math.min(miniSize, target.size - written)
    if (offset + take > miniData.length) break
    out.set(miniData.subarray(offset, offset + take), written)
    written += take
    sector = sector * 4 + 4 <= miniFat.length ? miniView.getUint32(sector * 4, true) : END_OF_CHAIN
  }
  return out.subarray(0, written)
}

// ------------------------------------------------------- BIFF records (.xls)

type BiffRecord = { type: number; data: Uint8Array }

function biffRecords(stream: Uint8Array): BiffRecord[] {
  const view = new DataView(stream.buffer, stream.byteOffset, stream.byteLength)
  const out: BiffRecord[] = []
  for (let off = 0; off + 4 <= stream.length; ) {
    const type = view.getUint16(off, true)
    const size = view.getUint16(off + 2, true)
    if (off + 4 + size > stream.length) break
    out.push({ type, data: stream.subarray(off + 4, off + 4 + size) })
    off += 4 + size
  }
  return out
}

/**
 * A cursor over the shared-string table, which spans several records.
 *
 * The table is one long run of strings that Excel chops into 8KB records
 * wherever it happens to fill one — including part-way through a string's
 * characters. Each continuation then restarts with a flag byte saying whether
 * the rest of that string is one byte or two per character, so a name can
 * change width half-way through. Reading it therefore has to be a cursor over
 * the blocks rather than over a single buffer.
 */
class SstCursor {
  private readonly blocks: Uint8Array[]
  private block = 0
  private offset = 0

  constructor(blocks: Uint8Array[]) {
    this.blocks = blocks
  }

  private get done() {
    return this.block >= this.blocks.length
  }

  /** Steps over any blocks already read to the end. */
  private settle() {
    while (!this.done && this.offset >= this.blocks[this.block].length) {
      this.block++
      this.offset = 0
    }
  }

  byte(): number {
    this.settle()
    if (this.done) return 0
    return this.blocks[this.block][this.offset++]
  }

  u16(): number {
    return this.byte() | (this.byte() << 8)
  }

  u32(): number {
    return (this.u16() | (this.u16() << 16)) >>> 0
  }

  skip(n: number) {
    for (let i = 0; i < n; i++) this.byte()
  }

  atEnd(): boolean {
    this.settle()
    return this.done
  }

  /** Reads `count` characters, following the string across block boundaries. */
  chars(count: number, wide: boolean): string {
    let out = ''
    let left = count
    while (left > 0) {
      this.settle()
      if (this.done) break

      const blk = this.blocks[this.block]
      const width = wide ? 2 : 1
      const fits = Math.min(left, Math.floor((blk.length - this.offset) / width))
      for (let i = 0; i < fits; i++) {
        out += String.fromCharCode(
          wide ? blk[this.offset] | (blk[this.offset + 1] << 8) : blk[this.offset],
        )
        this.offset += width
      }
      left -= fits

      if (left > 0) {
        // This block ended mid-string. The next one opens with a fresh flag
        // byte for whatever is left. (`fits` can be 0 on a stray odd byte,
        // which this also steps past.)
        this.block++
        this.offset = 0
        this.settle()
        if (this.done) break
        wide = (this.byte() & 1) === 1
      }
    }
    return out
  }
}

/** Decodes the shared-string table into the array cells index into. */
function sharedStrings(blocks: Uint8Array[]): string[] {
  if (blocks.length === 0) return []

  const cursor = new SstCursor(blocks)
  cursor.u32() // total references, which we do not need
  const unique = cursor.u32()

  const out: string[] = []
  // A corrupt count could ask for millions of strings; the byte total is a
  // ceiling on how many could actually be there.
  const ceiling = blocks.reduce((n, b) => n + b.length, 0)
  for (let i = 0; i < unique && i < ceiling && !cursor.atEnd(); i++) {
    const cch = cursor.u16()
    const flags = cursor.byte()
    const runs = flags & 0x08 ? cursor.u16() : 0
    const extra = flags & 0x04 ? cursor.u32() : 0

    out.push(cursor.chars(cch, (flags & 0x01) === 1))

    cursor.skip(runs * 4) // rich-text formatting runs
    cursor.skip(extra) // phonetic (furigana) text
  }
  return out
}

/** Turns Excel's packed 30-bit number back into a float. */
function rkNumber(raw: number): number {
  let value: number
  if (raw & 0x02) {
    // A signed integer in the top 30 bits.
    value = (raw | 0) >> 2
  } else {
    // The top 30 bits of a float64, with the rest zero.
    const bits = new DataView(new ArrayBuffer(8))
    bits.setUint32(0, raw & 0xfffffffc)
    value = bits.getFloat64(0)
  }
  return raw & 0x01 ? value / 100 : value
}

function xlsGrid(buf: ArrayBuffer): string[][] {
  const stream = oleStream(buf, ['Workbook', 'Book'])
  if (!stream) {
    throw new Error('엑셀 파일을 읽지 못했습니다. .xlsx 로 다시 저장한 뒤 올려 주세요.')
  }

  const records = biffRecords(stream)
  const first = records[0]
  if (first?.type === 0x0809 && first.data.length >= 2) {
    const version = new DataView(first.data.buffer, first.data.byteOffset).getUint16(0, true)
    if (version < 0x0600) {
      throw new Error(
        'Excel 95 이전 형식입니다. Excel 에서 .xlsx 로 다시 저장한 뒤 올려 주세요.',
      )
    }
  }

  // Gather the shared strings first: they live in the workbook globals, ahead
  // of every sheet that refers to them.
  const sstBlocks: Uint8Array[] = []
  for (let i = 0; i < records.length; i++) {
    if (records[i].type !== 0x00fc) continue
    sstBlocks.push(records[i].data)
    for (let j = i + 1; j < records.length && records[j].type === 0x003c; j++) {
      sstBlocks.push(records[j].data)
    }
    break
  }
  const strings = sharedStrings(sstBlocks)

  // Then the first worksheet's cells. A workbook may hold charts and macro
  // sheets too, so this stops at the end of the first substream that actually
  // carried a cell.
  const cells = new Map<string, string>()
  let maxRow = -1
  let maxCol = -1
  let inSheet = false
  let seenCell = false

  const put = (row: number, col: number, text: string) => {
    if (!text) return
    cells.set(`${row}:${col}`, text)
    if (row > maxRow) maxRow = row
    if (col > maxCol) maxCol = col
    seenCell = true
  }

  for (const rec of records) {
    const view = new DataView(rec.data.buffer, rec.data.byteOffset, rec.data.byteLength)

    if (rec.type === 0x0809) {
      // A worksheet substream. Anything before the first one is globals.
      inSheet = rec.data.length >= 4 && view.getUint16(2, true) === 0x0010
      continue
    }
    if (rec.type === 0x000a) {
      if (inSheet && seenCell) break
      inSheet = false
      continue
    }
    if (!inSheet || rec.data.length < 6) continue

    const row = view.getUint16(0, true)
    const col = view.getUint16(2, true)

    switch (rec.type) {
      case 0x00fd: {
        // LABELSST — an index into the shared strings.
        if (rec.data.length < 10) break
        put(row, col, strings[view.getUint32(6, true)] ?? '')
        break
      }
      case 0x0204: {
        // LABEL — a string written inline.
        if (rec.data.length < 9) break
        const cch = view.getUint16(6, true)
        const wide = (rec.data[8] & 0x01) === 1
        let text = ''
        for (let i = 0; i < cch; i++) {
          const at = 9 + i * (wide ? 2 : 1)
          if (at >= rec.data.length) break
          text += String.fromCharCode(wide ? view.getUint16(at, true) : rec.data[at])
        }
        put(row, col, text)
        break
      }
      case 0x027e: {
        // RK — a packed number.
        if (rec.data.length < 10) break
        put(row, col, numberText(rkNumber(view.getUint32(6, true))))
        break
      }
      case 0x0203: {
        // NUMBER — a plain float64.
        if (rec.data.length < 14) break
        put(row, col, numberText(view.getFloat64(6, true)))
        break
      }
      case 0x0006: {
        // FORMULA — only its cached numeric result is of any use here. The
        // sentinel exponent marks a non-numeric result, which arrives in a
        // STRING record we do not chase.
        if (rec.data.length < 14) break
        if (view.getUint16(12, true) === 0xffff) break
        put(row, col, numberText(view.getFloat64(6, true)))
        break
      }
      case 0x00bd: {
        // MULRK — a run of packed numbers sharing one record.
        for (let i = 0, at = 4; at + 6 <= rec.data.length - 2; i++, at += 6) {
          put(row, col + i, numberText(rkNumber(view.getUint32(at + 2, true))))
        }
        break
      }
    }
  }

  const grid: string[][] = []
  for (let r = 0; r <= maxRow; r++) {
    const line: string[] = []
    for (let c = 0; c <= maxCol; c++) line.push(cells.get(`${r}:${c}`) ?? '')
    grid.push(line)
  }
  return grid
}

// ------------------------------------------------------------ OOXML (.xlsx)

/** The column index encoded in a cell reference: "C7" → 2. */
function columnOf(ref: string): number {
  let n = 0
  for (const ch of ref) {
    const code = ch.charCodeAt(0)
    if (code < 65 || code > 90) break
    n = n * 26 + (code - 64)
  }
  return n - 1
}

async function xlsxGrid(buf: ArrayBuffer): Promise<string[][]> {
  const zip = await JSZip.loadAsync(buf)
  const parser = new DOMParser()
  const readXml = async (path: string) => {
    const file = zip.file(path)
    if (!file) return null
    return parser.parseFromString(await file.async('string'), 'application/xml')
  }
  // Walked by hand rather than by getElementsByTagName, which would have to be
  // called with '*' and filtered: these documents are namespaced, and the
  // prefix Excel picks for the spreadsheet namespace is not fixed.
  function tags(root: Document | Element, name: string): Element[] {
    const out: Element[] = []
    const walk = (el: Element | null) => {
      if (!el) return
      for (const child of Array.from(el.children)) {
        if (child.localName === name) out.push(child)
        walk(child)
      }
    }
    walk('documentElement' in root ? root.documentElement : root)
    return out
  }

  const sharedDoc = await readXml('xl/sharedStrings.xml')
  const shared = sharedDoc
    ? tags(sharedDoc, 'si').map((si) =>
        tags(si, 't')
          .map((t) => t.textContent || '')
          .join(''),
      )
    : []

  // The first sheet in the workbook's own order, which is not always sheet1.xml.
  let sheetPath = 'xl/worksheets/sheet1.xml'
  const workbook = await readXml('xl/workbook.xml')
  const rels = await readXml('xl/_rels/workbook.xml.rels')
  if (workbook && rels) {
    const sheet = tags(workbook, 'sheet')[0]
    const id = sheet
      ? Array.from(sheet.attributes).find((a) => a.name.endsWith(':id') || a.name === 'id')?.value
      : null
    const target = tags(rels, 'Relationship').find((r) => r.getAttribute('Id') === id)
    const path = target?.getAttribute('Target')
    if (path) {
      const cleaned = path.replace(/^\/?xl\//, '').replace(/^\.\.\//, '')
      if (zip.file(`xl/${cleaned}`)) sheetPath = `xl/${cleaned}`
    }
  }

  const sheet = await readXml(sheetPath)
  if (!sheet) throw new Error('엑셀 파일에 시트가 없습니다.')

  const grid: string[][] = []
  for (const rowEl of tags(sheet, 'row')) {
    const line: string[] = []
    for (const cell of tags(rowEl, 'c')) {
      const col = columnOf(cell.getAttribute('r') || '')
      const kind = cell.getAttribute('t')

      let text: string
      if (kind === 'inlineStr') {
        text = tags(cell, 't')
          .map((t) => t.textContent || '')
          .join('')
      } else {
        const raw = tags(cell, 'v')[0]?.textContent ?? ''
        if (kind === 's') text = shared[Number(raw)] ?? ''
        else if (kind === 'str' || kind === 'e') text = raw
        else text = raw === '' ? '' : numberText(Number(raw))
      }

      if (col >= 0) {
        while (line.length < col) line.push('')
        line[col] = text.trim()
      } else {
        line.push(text.trim())
      }
    }
    grid.push(line)
  }
  return grid
}

// --------------------------------------------------------------------- (.csv)

function csvGrid(text: string): string[][] {
  const body = text.replace(/^﻿/, '')
  // Excel writes a Korean CSV with semicolons on some locales and tabs when
  // "Unicode text" was chosen; take whichever separator the first line favours.
  const head = body.slice(0, body.indexOf('\n') + 1 || body.length)
  const counts: [string, number][] = [
    [',', (head.match(/,/g) || []).length],
    ['\t', (head.match(/\t/g) || []).length],
    [';', (head.match(/;/g) || []).length],
  ]
  const sep = counts.sort((a, b) => b[1] - a[1])[0][0]

  const grid: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false

  for (let i = 0; i < body.length; i++) {
    const ch = body[i]
    if (quoted) {
      if (ch !== '"') cell += ch
      else if (body[i + 1] === '"') {
        cell += '"'
        i++
      } else quoted = false
      continue
    }
    if (ch === '"') quoted = true
    else if (ch === sep) {
      row.push(cell.trim())
      cell = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && body[i + 1] === '\n') i++
      row.push(cell.trim())
      grid.push(row)
      row = []
      cell = ''
    } else cell += ch
  }
  if (cell || row.length) {
    row.push(cell.trim())
    grid.push(row)
  }
  return grid
}

/** Decodes CSV bytes, falling back to the codepage Korean Excel still writes. */
function csvText(buf: ArrayBuffer): string {
  const utf8 = new TextDecoder('utf-8').decode(buf)
  if (!utf8.includes('�')) return utf8
  try {
    return new TextDecoder('euc-kr').decode(buf)
  } catch {
    return utf8
  }
}

// ------------------------------------------------------------ column picking

const ID_HEADER = /^(학\s*번|학생\s*번호|student\s*(id|number|no)|아이디|id)$/i
const NAME_HEADER = /^(성\s*명|이\s*름|성명\(한글\)|name|student\s*name|학생\s*명)$/i

/** A plausible 학번: digits only, long enough not to be a row counter. */
const ID_SHAPED = /^\d{6,12}$/
const NAME_SHAPED = /^[가-힣A-Za-z][가-힣A-Za-z .·'-]{0,40}$/

/**
 * Finds which columns hold the 학번 and the 성명.
 *
 * Header names first, since a sheet that labels its columns is saying so
 * plainly. Failing that — an export with no header, or one titled in a way
 * the patterns above do not cover — the columns are recognised by what they
 * contain, which also rules out the 순번 counter in the first column.
 */
function pickColumns(grid: string[][]): { id: number; name: number; from: number } {
  const width = grid.reduce((n, r) => Math.max(n, r.length), 0)

  for (let r = 0; r < Math.min(grid.length, 20); r++) {
    const row = grid[r]
    const id = row.findIndex((c) => ID_HEADER.test(c.trim()))
    const name = row.findIndex((c) => NAME_HEADER.test(c.trim()))
    if (id >= 0 && name >= 0) return { id, name, from: r + 1 }
  }

  let id = -1
  let name = -1
  let bestId = 0
  let bestName = 0
  for (let c = 0; c < width; c++) {
    let ids = 0
    let names = 0
    for (const row of grid) {
      const cell = (row[c] ?? '').trim()
      if (!cell) continue
      if (ID_SHAPED.test(cell)) ids++
      else if (NAME_SHAPED.test(cell)) names++
    }
    if (ids > bestId) {
      bestId = ids
      id = c
    }
    if (names > bestName) {
      bestName = names
      name = c
    }
  }

  if (id < 0 || name < 0 || bestId < 1 || bestName < 1) {
    throw new Error('학번과 이름 열을 찾지 못했습니다. 열 제목을 "학번", "성명" 으로 맞춰 주세요.')
  }
  return { id, name, from: 0 }
}

// ------------------------------------------------------------------ the read

export type RosterFile = {
  rows: RosterRow[]
  /** Rows that were present but unusable, for the report shown to the admin. */
  skipped: number
  /** 학번 that appeared more than once in the file. */
  duplicates: string[]
}

export async function readRosterFile(file: File): Promise<RosterFile> {
  const buf = await file.arrayBuffer()
  const bytes = new Uint8Array(buf)
  const lower = file.name.toLowerCase()

  // The extension is a hint; the first bytes are the answer. A .xls that is
  // really a zip, or a .xlsx that is really the old format, both turn up.
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b
  const isOle = OLE_MAGIC.every((b, i) => bytes[i] === b)

  let grid: string[][]
  if (isZip) grid = await xlsxGrid(buf)
  else if (isOle) grid = xlsGrid(buf)
  else if (lower.endsWith('.csv') || lower.endsWith('.txt')) grid = csvGrid(csvText(buf))
  else {
    throw new Error('엑셀(.xls, .xlsx) 또는 CSV 파일만 올릴 수 있습니다.')
  }

  grid = grid.map((row) => row.map((cell) => (cell ?? '').trim()))
  const { id, name, from } = pickColumns(grid)

  const rows: RosterRow[] = []
  const seen = new Set<string>()
  const duplicates: string[] = []
  let skipped = 0

  for (let r = from; r < grid.length; r++) {
    const studentId = (grid[r][id] ?? '').replace(/\s+/g, '')
    const studentName = (grid[r][name] ?? '').replace(/\s+/g, ' ').trim()

    if (!studentId && !studentName) continue // a blank spacer row is not an error
    if (!studentId || !studentName || !/^[\w-]+$/.test(studentId)) {
      skipped++
      continue
    }
    if (seen.has(studentId)) {
      if (!duplicates.includes(studentId)) duplicates.push(studentId)
      continue
    }
    seen.add(studentId)
    rows.push({ studentId, name: studentName })
  }

  if (rows.length === 0) {
    throw new Error('명단에서 학생을 찾지 못했습니다. 파일을 확인해 주세요.')
  }
  return { rows, skipped, duplicates }
}
