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
  // Downloadable lecture slides (pptx under /public), gated behind login.
  slidesPptx?: string
  // Depth-3 sub-topics (mirrors the structure/ folder hierarchy).
  children: Pathway[]
}

export type Category = {
  slug: string
  name: string
  tagline: string
  image: string
  intro: string[]
  pathways: Pathway[]
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
}): Category {
  return {
    slug: o.slug,
    name: o.name,
    tagline: o.tagline,
    image: o.image,
    intro: [],
    pathways: o.items.map((it) => (Array.isArray(it) ? p(it[0], it[1]) : p(it))),
  }
}

export const categories: Category[] = [
  cat({
    slug: 'metabolism',
    name: 'Metabolism',
    tagline: 'The grammar of energy and matter',
    image: '/images/metabolism.png',
    items: [['Metabolism', ['Catabolism', 'Anabolism']], 'Study Tips for Metabolism'],
  }),
  cat({
    slug: 'digestion-absorption-transportation',
    name: 'Digestion, Absorption, Transportation',
    tagline: 'From the gut to the cell',
    image: '/images/digestion-absorption-transportation.jpg',
    items: [
      ['Digestion', ['Carbohydrate Digestion', 'Lipid Digestion', 'Protein Digestion', 'Nucleic Acid Digestion']],
      ['Absorption', ['Carbohydrate Absorption', 'Lipid Absorption', 'Protein Absorption', 'Nucleic Acid Absorption']],
      ['Transportation', ['Carbohydrate Transportation', 'Lipid Transportation', 'Protein Transportation', 'Nucleic Acid Transportation']],
    ],
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
    items: [
      'Hormone',
      ['Hormonal Regulation and Metabolism', ['Insulin', 'Glucagon', 'Epinephrine', 'Cortisol', 'Others']],
    ],
  }),
]

// Downloadable lecture-slide decks, keyed by `${categorySlug}/${pathwaySlug}`.
const pathwaySlides: Record<string, string> = {
  'carbohydrate-metabolism/glycolysis': '/downloads/glycolysis.pptx',
}

// Merge PPT-derived Overview text + Key-step diagrams into the pathway tree.
function injectContent(p: Pathway, categorySlug: string) {
  const key = `${categorySlug}/${p.slug}`
  const content = pathwayContent[key]
  if (content) {
    p.overview = content.overview
    if (content.keyStepSvg) p.keyStepSvg = content.keyStepSvg
  }
  if (pathwaySlides[key]) p.slidesPptx = pathwaySlides[key]
  p.children.forEach((c) => injectContent(c, categorySlug))
}
for (const c of categories) {
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
