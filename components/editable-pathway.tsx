'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { CategoryLabel } from '@/components/article-bits'
import type { Category, Pathway } from '@/lib/pathways'
import { clearPathwayEdit, loadPathwayEdit, savePathwayEdit } from '@/lib/edits'
import { useAuth } from '@/components/auth-provider'

const inputClass =
  'w-full rounded border border-neutral-300 bg-white px-3 py-2 text-[14px] leading-relaxed text-foreground focus:border-science-red focus:outline-none focus:ring-1 focus:ring-science-red'

const labelClass =
  'mb-1 block text-[10px] font-bold uppercase tracking-wider text-neutral-500'

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T
}

export function EditablePathway({
  category,
  pathway,
}: {
  category: Category
  pathway: Pathway
}) {
  const [data, setData] = useState<Pathway>(pathway)
  const [draft, setDraft] = useState<Pathway>(pathway)
  const [editing, setEditing] = useState(false)
  const [hasEdits, setHasEdits] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    const saved = loadPathwayEdit(category.slug, pathway.slug)
    if (saved) {
      setData({ ...pathway, ...saved })
      setHasEdits(true)
    }
  }, [category.slug, pathway.slug, pathway])

  // Exit edit mode if the user logs out mid-edit.
  useEffect(() => {
    if (!user) setEditing(false)
  }, [user])

  function save() {
    savePathwayEdit(category.slug, pathway.slug, draft)
    setData(draft)
    setHasEdits(true)
    setEditing(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancel() {
    setEditing(false)
  }

  function resetToOriginal() {
    if (!window.confirm('Discard all edits to this article and restore the original?')) return
    clearPathwayEdit(category.slug, pathway.slug)
    setData(pathway)
    setHasEdits(false)
    setEditing(false)
  }

  // draft helpers -----------------------------------------------------------
  function setField<K extends keyof Pathway>(key: K, value: Pathway[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  function setListItem(key: 'overview' | 'regulation', i: number, value: string) {
    setDraft((d) => {
      const arr = [...d[key]]
      arr[i] = value
      return { ...d, [key]: arr }
    })
  }
  function addListItem(key: 'overview' | 'regulation') {
    setDraft((d) => ({ ...d, [key]: [...d[key], ''] }))
  }
  function removeListItem(key: 'overview' | 'regulation', i: number) {
    setDraft((d) => ({ ...d, [key]: d[key].filter((_, j) => j !== i) }))
  }

  function setStep(i: number, field: 'title' | 'detail', value: string) {
    setDraft((d) => {
      const steps = d.steps.map((s, j) => (j === i ? { ...s, [field]: value } : s))
      return { ...d, steps }
    })
  }
  function addStep() {
    setDraft((d) => ({ ...d, steps: [...d.steps, { title: '', detail: '' }] }))
  }
  function removeStep(i: number) {
    setDraft((d) => ({ ...d, steps: d.steps.filter((_, j) => j !== i) }))
  }

  // ======================================================================
  // EDIT MODE
  // ======================================================================
  if (editing) {
    return (
      <div className="mt-6">
        <EditToolbar
          editing
          hasEdits={hasEdits}
          onSave={save}
          onCancel={cancel}
          onReset={resetToOriginal}
        />

        <div className="mt-6 space-y-8">
          {/* Basic fields */}
          <section className="space-y-4 rounded border border-neutral-200 bg-panel/40 p-5">
            <div>
              <label className={labelClass}>Name</label>
              <input
                className={inputClass}
                value={draft.name}
                onChange={(e) => setField('name', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Equation</label>
              <input
                className={`${inputClass} font-mono`}
                value={draft.equation}
                onChange={(e) => setField('equation', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Location</label>
              <input
                className={inputClass}
                value={draft.location}
                onChange={(e) => setField('location', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Summary</label>
              <textarea
                className={inputClass}
                rows={3}
                value={draft.summary}
                onChange={(e) => setField('summary', e.target.value)}
              />
            </div>
          </section>

          {/* Overview */}
          <ListEditor
            title="Overview"
            items={draft.overview}
            onChange={(i, v) => setListItem('overview', i, v)}
            onAdd={() => addListItem('overview')}
            onRemove={(i) => removeListItem('overview', i)}
            addLabel="+ Add paragraph"
            rows={3}
          />

          {/* Steps */}
          <section className="rounded border border-neutral-200 p-5">
            <h3 className="mb-3 text-[13px] font-extrabold uppercase tracking-wide text-foreground">
              Key Steps
            </h3>
            <div className="space-y-4">
              {draft.steps.map((s, i) => (
                <div key={i} className="rounded border border-neutral-200 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-science-red">
                      Step {String(i + 1).padStart(2, '0')}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeStep(i)}
                      className="text-[11px] font-bold text-neutral-400 hover:text-science-red"
                    >
                      Remove ✕
                    </button>
                  </div>
                  <input
                    className={`${inputClass} mb-2`}
                    placeholder="Step title"
                    value={s.title}
                    onChange={(e) => setStep(i, 'title', e.target.value)}
                  />
                  <textarea
                    className={inputClass}
                    rows={2}
                    placeholder="Step description"
                    value={s.detail}
                    onChange={(e) => setStep(i, 'detail', e.target.value)}
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addStep}
              className="mt-3 text-[12px] font-bold text-science-red hover:underline"
            >
              + Add step
            </button>
          </section>

          {/* Regulation */}
          <ListEditor
            title="Regulation"
            items={draft.regulation}
            onChange={(i, v) => setListItem('regulation', i, v)}
            onAdd={() => addListItem('regulation')}
            onRemove={(i) => removeListItem('regulation', i)}
            addLabel="+ Add item"
            rows={2}
          />

          {/* Energetics + vetNote */}
          <section className="space-y-4 rounded border border-neutral-200 bg-panel/40 p-5">
            <div>
              <label className={labelClass}>Energetics</label>
              <textarea
                className={inputClass}
                rows={2}
                value={draft.energetics}
                onChange={(e) => setField('energetics', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Veterinary Note</label>
              <textarea
                className={inputClass}
                rows={3}
                value={draft.vetNote}
                onChange={(e) => setField('vetNote', e.target.value)}
              />
            </div>
          </section>
        </div>

        <div className="mt-6">
          <EditToolbar
            editing
            hasEdits={hasEdits}
            onSave={save}
            onCancel={cancel}
            onReset={resetToOriginal}
          />
        </div>
      </div>
    )
  }

  // ======================================================================
  // VIEW MODE
  // ======================================================================
  return (
    <>
      {/* Title block */}
      <header className="mt-6 border-b border-neutral-200 pb-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-2">
            <CategoryLabel>{category.name}</CategoryLabel>
            <span className="text-neutral-300">|</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              {data.location}
            </span>
            {hasEdits && (
              <span className="rounded-full bg-science-red/10 px-2 py-0.5 text-[10px] font-bold text-science-red">
                Edited
              </span>
            )}
          </div>
        </div>
        <h1 className="mt-2 max-w-4xl text-balance text-4xl font-extrabold leading-tight text-foreground sm:text-5xl">
          {data.name}
        </h1>
        <p className="mt-4 max-w-3xl rounded-sm bg-panel px-4 py-3 font-mono text-[13px] leading-relaxed text-neutral-700">
          {data.equation}
        </p>
        <p className="mt-4 max-w-3xl text-[18px] leading-relaxed text-foreground">
          {data.summary}
        </p>
      </header>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-12">
        {/* Main column */}
        <article className="lg:col-span-8">
          <section>
            <div className="border-t-2 border-foreground pt-3">
              <h2 className="text-lg font-extrabold uppercase tracking-wide">Overview</h2>
            </div>
            <div className="mt-4 space-y-4">
              {data.overview.map((para, i) => (
                <p key={i} className="text-[16px] leading-relaxed text-neutral-700">
                  {para}
                </p>
              ))}
            </div>
          </section>

          <section className="mt-10">
            <div className="border-t-2 border-foreground pt-3">
              <h2 className="text-lg font-extrabold uppercase tracking-wide">Key Steps</h2>
            </div>
            <ol className="mt-4">
              {data.steps.map((step, i) => (
                <li
                  key={i}
                  className={`grid grid-cols-[2.5rem_1fr] gap-4 py-4 ${i === 0 ? '' : 'border-t border-neutral-200'}`}
                >
                  <span className="font-serif text-2xl leading-none text-science-red">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="text-[15px] font-bold text-foreground">{step.title}</h3>
                    <p className="mt-1 text-[14px] leading-snug text-neutral-700">
                      {step.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-10">
            <div className="border-t-2 border-foreground pt-3">
              <h2 className="text-lg font-extrabold uppercase tracking-wide">Regulation</h2>
            </div>
            <ul className="mt-4 space-y-3">
              {data.regulation.map((r, i) => (
                <li key={i} className="flex gap-3 text-[15px] leading-snug text-neutral-700">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-science-red" />
                  {r}
                </li>
              ))}
            </ul>
          </section>
        </article>

        {/* Sidebar */}
        <aside className="lg:col-span-4">
          <div className="sticky top-20 space-y-6">
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100">
              <Image
                src={category.image}
                alt={category.name}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 400px, 100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3">
                <Link href={`/${category.slug}`}>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-white">
                    {category.name}
                  </span>
                </Link>
              </div>
            </div>

            <div className="bg-panel p-5">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                Location
              </h3>
              <p className="mt-1 text-[14px] font-semibold text-foreground">
                {data.location}
              </p>
              <h3 className="mt-4 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                Energetics
              </h3>
              <p className="mt-1 text-[14px] leading-snug text-neutral-700">
                {data.energetics}
              </p>
            </div>

            <div className="border-l-4 border-science-red bg-panel p-5">
              <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-science-red">
                Veterinary Note
              </h3>
              <p className="mt-2 text-[14px] leading-snug text-neutral-700">
                {data.vetNote}
              </p>
            </div>

            <div>
              <h3 className="border-b-2 border-foreground pb-2 text-[11px] font-bold uppercase tracking-wider text-foreground">
                More in {category.name}
              </h3>
              <ul className="mt-2">
                {category.pathways
                  .filter((p) => p.slug !== pathway.slug)
                  .map((p) => (
                    <li key={p.slug} className="border-b border-neutral-200">
                      <Link
                        href={`/${category.slug}/${p.slug}`}
                        className="group block py-2.5 text-[14px] font-semibold text-foreground transition-colors hover:text-science-red"
                      >
                        {p.name}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}

// ------------------------------------------------------------------------
function EditToolbar({
  hasEdits,
  onSave,
  onCancel,
  onReset,
}: {
  editing: boolean
  hasEdits: boolean
  onSave: () => void
  onCancel: () => void
  onReset: () => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded border border-science-red/30 bg-science-red/5 px-4 py-3">
      <span className="mr-auto text-[12px] font-bold text-science-red">Edit mode</span>
      <button
        type="button"
        onClick={onSave}
        className="rounded bg-science-red px-4 py-1.5 text-[12px] font-bold text-white transition-opacity hover:opacity-90"
      >
        Save
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="rounded border border-neutral-300 px-4 py-1.5 text-[12px] font-bold text-neutral-600 hover:border-neutral-500"
      >
        Cancel
      </button>
      {hasEdits && (
        <button
          type="button"
          onClick={onReset}
          className="rounded px-3 py-1.5 text-[12px] font-bold text-neutral-400 hover:text-science-red"
        >
          Restore original
        </button>
      )}
    </div>
  )
}

function ListEditor({
  title,
  items,
  onChange,
  onAdd,
  onRemove,
  addLabel,
  rows,
}: {
  title: string
  items: string[]
  onChange: (i: number, v: string) => void
  onAdd: () => void
  onRemove: (i: number) => void
  addLabel: string
  rows: number
}) {
  return (
    <section className="rounded border border-neutral-200 p-5">
      <h3 className="mb-3 text-[13px] font-extrabold uppercase tracking-wide text-foreground">
        {title}
      </h3>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <textarea
              className={inputClass}
              rows={rows}
              value={item}
              onChange={(e) => onChange(i, e.target.value)}
            />
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="shrink-0 self-start rounded border border-neutral-300 px-2 py-2 text-[11px] font-bold text-neutral-400 hover:border-science-red hover:text-science-red"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="mt-3 text-[12px] font-bold text-science-red hover:underline"
      >
        {addLabel}
      </button>
    </section>
  )
}
