import { keyStepCanvases } from './keystep-canvases'
import { pathwayContent } from './pathway-content'

export type Pathway = {
  slug: string
  name: string
  equation: string
  location: string
  summary: string
  overview: string[]
  steps: { title: string; detail: string }[]
  regulation: string[]
  energetics: string
  vetNote: string
  // Cropped Key-step reaction diagram (SVG under /public), when the source deck
  // provides one. Rendered in place of the text `steps` list.
  keyStepSvg?: string
  // A diagram laid out in the browser. Takes precedence over `keyStepSvg`.
  keyStepCanvas?: KeyStepCanvas
  // Lecture slides as a PDF — a path under /public, or an uploaded file's URL.
  // Gated behind login: viewable inline and downloadable.
  slidesPdf?: string
  // Supplementary YouTube lectures, embedded at the foot of the article.
  videos?: Video[]
  // Supplementary figure images (paths under /public), shown as a gallery.
  figures?: string[]
  // Publish an Overview and the lecture slides, and nothing else — no key-step
  // diagram, figure gallery, videos or quiz, not even the empty editors the
  // administrator is otherwise offered. For a page that is a document rather
  // than a reaction, and so has no apparatus to show.
  overviewOnly?: boolean
  // Depth-3 sub-topics (mirrors the structure/ folder hierarchy).
  children: Pathway[]
}

export type Video = {
  // YouTube video id (the `v=` parameter), not a full URL.
  id: string
  title: string
}

// A key-step diagram laid out like a slide: text boxes and arrows placed freely
// on a canvas. Coordinates are pixels in the canvas' own space (CANVAS_WIDTH
// wide, `height` tall); the canvas scales to fit the column when displayed.
export type KeyStepCanvas = {
  height: number
  items: KeyStepItem[]
}

export type KeyStepItem = KeyStepTextItem | KeyStepArrowItem

export type KeyStepTextItem = {
  id: string
  kind: 'text'
  x: number
  y: number
  // Set once the box has been resized; unset means "as wide as the text".
  w?: number
  // Font size in px; unset means the canvas default.
  size?: number
  // A restricted subset of HTML — <i>, <b>, <sup>, <sub>, <br> only — so ions
  // and formulae (H<sup>+</sup>, H<sub>2</sub>O) and italic enzyme names
  // survive a round-trip. See sanitizeRich() in key-step-canvas.tsx.
  html: string
}

export type KeyStepArrowItem = {
  id: string
  kind: 'arrow'
  x1: number
  y1: number
  x2: number
  y2: number
  // Draw a head at both ends, for a reversible reaction.
  double: boolean
}

export type Category = {
  slug: string
  name: string
  tagline: string
  image: string
  intro: string[]
  pathways: Pathway[]
  // An optional illustrative figure shown in the category Overview.
  figure?: string
  // Supplementary figure images (paths under /public), shown as a gallery on
  // the category page.
  figures?: string[]
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// Build a pathway entry. Body content is intentionally left empty —
// only the item name (and any depth-3 children) are populated for now.
function p(name: string, children: string[] = []): Pathway {
  return {
    slug: slugify(name),
    name,
    equation: '',
    location: '',
    summary: '',
    overview: [],
    steps: [],
    regulation: [],
    energetics: '',
    vetNote: '',
    children: children.map((c) => p(c)),
  }
}

// An item is either a plain name (no children) or [name, [childNames]].
type Item = string | [string, string[]]

function cat(o: {
  slug: string
  name: string
  tagline: string
  image: string
  items: Item[]
  figure?: string
}): Category {
  return {
    slug: o.slug,
    name: o.name,
    tagline: o.tagline,
    image: o.image,
    intro: [],
    pathways: o.items.map((it) => (Array.isArray(it) ? p(it[0], it[1]) : p(it))),
    figure: o.figure,
  }
}

export const categories: Category[] = [
  cat({
    slug: 'metabolism',
    name: 'Metabolism',
    tagline: 'The grammar of energy and matter',
    image: '/images/metabolism.png',
    items: [
      ['Metabolism', ['Catabolism', 'Anabolism']],
      'Study Tips for Metabolism',
      'Veterinary Biochemistry Newspaper',
    ],
  }),
  cat({
    slug: 'digestion-absorption-transportation',
    name: 'Digestion, Absorption, Transportation',
    tagline: 'From the gut to the cell',
    image: '/images/digestion-absorption-transportation.jpg',
    // The source deck covers all four macromolecules in a single write-up per
    // stage ("구분하지 말고 하나로 통합"), so these have no per-macromolecule children.
    items: ['Digestion', 'Absorption', 'Transportation'],
  }),
  cat({
    slug: 'carbohydrate-metabolism',
    name: 'Carbohydrate Metabolism',
    tagline: 'Central energy currency of the cell',
    image: '/images/carbohydrate-metabolism.jpg',
    items: [
      'Glycolysis',
      'Gluconeogenesis',
      'Other Hexoses and Disaccharides',
      'Glycogen Metabolism',
      'Fates of Glucose-6-phosphate',
      'Pentose Phosphate Pathway',
      'Fates of Pyruvate',
      'Citrate Cycle',
      'Electron Transfer System and Oxidative Phosphorylation',
    ],
  }),
  cat({
    slug: 'lipid-metabolism',
    name: 'Lipid Metabolism',
    tagline: 'Storing and burning the body’s richest fuel',
    image: '/images/lipid-metabolism.jpg',
    items: [
      'Lipolysis',
      'Glycerol Metabolism',
      'β-Oxidation',
      'Ketone Bodies',
      'Fatty Acid Synthesis',
      'Lipogenesis',
    ],
  }),
  cat({
    slug: 'protein-metabolism',
    name: 'Protein Metabolism',
    tagline: 'Recycling nitrogen and carbon skeletons',
    image: '/images/protein-metabolism.jpg',
    items: [
      'Transamination',
      'Oxidative Deamination',
      'Urea Cycle',
      'Keto Acid Oxidation',
      'Amino Acid Synthesis',
      'Molecules Derived From Amino Acids',
    ],
  }),
  cat({
    slug: 'nucleic-acid-metabolism',
    name: 'Nucleic Acid Metabolism',
    tagline: 'Building and salvaging the code of life',
    image: '/images/nucleic-acid-metabolism.jpg',
    items: ['Purine Nucleotides', 'Pyrimidine Nucleotides'],
  }),
  cat({
    slug: 'vitamin-metabolism',
    name: 'Vitamin Metabolism',
    tagline: 'Micronutrients that drive the machinery',
    image: '/images/vitamin-metabolism.jpg',
    items: ['Fat Soluble Vitamins', 'Water Soluble Vitamins'],
  }),
  cat({
    slug: 'comparative-vet-biochem',
    name: 'Comparative Vet. Biochem',
    tagline: 'How metabolism differs across species',
    image: '/images/comparative-vet-biochem.jpg',
    items: ['Dog', 'Cat', 'Ruminants', 'Avian'],
  }),
  cat({
    slug: 'hormonal-regulation-and-metabolism',
    name: 'Hormonal Regulation and Metabolism',
    tagline: 'The chemical signals that tune it all',
    image: '/images/hormonal-regulation-and-metabolism.jpg',
    // The deck treats the individual hormones as one write-up ("insulin,
    // glucagon, epinephrine, cortisol, others 구분X") — hence no children.
    items: ['Hormone', 'Hormonal Regulation and Metabolism'],
  }),
]

// Pages that publish an Overview and the PDF alone. See `overviewOnly` above.
const overviewOnlyPages = new Set<string>([])

// Lecture-slide PDFs, keyed by `${categorySlug}/${pathwaySlug}`.
const pathwaySlidesPdf: Record<string, string> = {
  'carbohydrate-metabolism/glycolysis': '/downloads/glycolysis.pdf',
  // The newspaper is handed out through the slide card like any other reading.
  'metabolism/veterinary-biochemistry-newspaper': '/downloads/vet-biochem-news-2026.pdf',
}

// Supplementary YouTube lectures, keyed by `${categorySlug}/${pathwaySlug}`.
const pathwayVideos: Record<string, Video[]> = {
  'carbohydrate-metabolism/glycolysis': [
    {
      id: '8qij1m7XUhk',
      title: 'Glycolysis Pathway Made Simple !! Biochemistry Lecture on Glycolysis',
    },
    {
      id: 'uWOURkrxpH4',
      title: 'Steps of Glycolysis Reactions Explained – Animation',
    },
  ],
}

// Supplementary figure images, keyed by `${categorySlug}/${pathwaySlug}`.
const pathwayFigures: Record<string, string[]> = {}

// Supplementary figure galleries per category, extracted in slide order from
// 'Figures_upload.pptx' into /public/figures/<category-slug>/NN.png.
const categoryFigureCounts: Record<string, number> = {
  metabolism: 1,
  'digestion-absorption-transportation': 2,
  'carbohydrate-metabolism': 18,
  'lipid-metabolism': 8,
  'protein-metabolism': 5,
  'comparative-vet-biochem': 3,
  'hormonal-regulation-and-metabolism': 4,
}
const categoryFigures: Record<string, string[]> = Object.fromEntries(
  Object.entries(categoryFigureCounts).map(([slug, count]) => [
    slug,
    Array.from(
      { length: count },
      (_, i) => `/figures/${slug}/${String(i + 1).padStart(2, '0')}.png`,
    ),
  ]),
)

// Merge PPT-derived Overview text + Key-step diagrams into the pathway tree.
function injectContent(p: Pathway, categorySlug: string) {
  const key = `${categorySlug}/${p.slug}`
  const content = pathwayContent[key]
  if (content) {
    p.overview = content.overview
    if (content.keyStepSvg) p.keyStepSvg = content.keyStepSvg
  }
  if (overviewOnlyPages.has(key)) p.overviewOnly = true
  if (pathwaySlidesPdf[key]) p.slidesPdf = pathwaySlidesPdf[key]
  if (pathwayVideos[key]) p.videos = pathwayVideos[key]
  if (pathwayFigures[key]) p.figures = pathwayFigures[key]
  if (keyStepCanvases[key]) p.keyStepCanvas = keyStepCanvases[key]
  p.children.forEach((c) => injectContent(c, categorySlug))
}
for (const c of categories) {
  if (categoryFigures[c.slug]) c.figures = categoryFigures[c.slug]
  c.pathways.forEach((p) => injectContent(p, c.slug))
}

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug)
}

export function getPathway(categorySlug: string, pathwaySlug: string) {
  const category = getCategory(categorySlug)
  const pathway = category?.pathways.find((p) => p.slug === pathwaySlug)
  return pathway ? { category, pathway } : null
}

export function getChild(
  categorySlug: string,
  pathwaySlug: string,
  childSlug: string,
) {
  const result = getPathway(categorySlug, pathwaySlug)
  if (!result || !result.category) return null
  const child = result.pathway.children.find((c) => c.slug === childSlug)
  return child
    ? { category: result.category, pathway: result.pathway, child }
    : null
}
