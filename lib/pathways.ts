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
    image: '/images/chemistry.jpg',
    items: [['Metabolism', ['Catabolism', 'Anabolism']], 'Study Tips for Metabolism'],
  }),
  cat({
    slug: 'digestion-absorption-transportation',
    name: 'Digestion, Absorption, Transportation',
    tagline: 'From the gut to the cell',
    image: '/images/carbohydrate.jpg',
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
    image: '/images/carbohydrate.jpg',
    items: [
      'Glycolysis',
      'Gluconeogenesis',
      ['Other Hexoses and Disaccharides', ['Disaccharides', 'Hexoses']],
      ['Glycogen Metabolism', ['Glycogenolysis', 'Glycogenesis']],
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
    image: '/images/lipid.jpg',
    items: [
      'Lipolysis',
      'Glycerol Metabolism',
      'β-Oxidation',
      'Ketogenesis',
      'Ketolysis',
      'Fatty Acid Synthesis',
      ['Lipogenesis', ['Triglyceride', 'Glycerophospholipid', 'Sphingolipid', 'Cholesterol']],
    ],
  }),
  cat({
    slug: 'protein-metabolism',
    name: 'Protein Metabolism',
    tagline: 'Recycling nitrogen and carbon skeletons',
    image: '/images/protein.jpg',
    items: [
      'Transamination',
      'Oxidative Deamination',
      'Urea Cycle',
      ['Keto Acid Oxidation', ['Glucogenic Amino Acids', 'Ketogenic Amino Acids']],
      'Amino Acid Synthesis',
      'Molecules Derived From Amino Acids',
    ],
  }),
  cat({
    slug: 'nucleic-acid-metabolism',
    name: 'Nucleic Acid Metabolism',
    tagline: 'Building and salvaging the code of life',
    image: '/images/nucleic-acid.jpg',
    items: ['Purine Nucleotides', 'Pyrimidine Nucleotides'],
  }),
  cat({
    slug: 'vitamin-metabolism',
    name: 'Vitamin Metabolism',
    tagline: 'Micronutrients that drive the machinery',
    image: '/images/chemistry.jpg',
    items: ['Fat Soluble Vitamins', 'Water Soluble Vitamins'],
  }),
  cat({
    slug: 'comparative-vet-biochem',
    name: 'Comparative Vet. Biochem',
    tagline: 'How metabolism differs across species',
    image: '/images/protein.jpg',
    items: ['Dog', 'Cat', 'Ruminants', 'Avian'],
  }),
  cat({
    slug: 'hormonal-regulation-and-metabolism',
    name: 'Hormonal Regulation and Metabolism',
    tagline: 'The chemical signals that tune it all',
    image: '/images/lipid.jpg',
    items: [
      'Hormone',
      ['Hormonal Regulation and Metabolism', ['Insulin', 'Glucagon', 'Epinephrine', 'Cortisol', 'Others']],
    ],
  }),
]

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
