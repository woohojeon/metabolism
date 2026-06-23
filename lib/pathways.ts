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
}

export type Category = {
  slug: string
  name: string
  korean: string
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

// Build a first-level pathway entry. Body content is intentionally left empty —
// only the item name (and optional location) is populated for now.
function p(name: string, location = ''): Pathway {
  return {
    slug: slugify(name),
    name,
    equation: '',
    location,
    summary: '',
    overview: [],
    steps: [],
    regulation: [],
    energetics: '',
    vetNote: '',
  }
}

function cat(o: {
  slug: string
  name: string
  korean: string
  tagline: string
  image: string
  items: string[]
}): Category {
  return {
    slug: o.slug,
    name: o.name,
    korean: o.korean,
    tagline: o.tagline,
    image: o.image,
    intro: [],
    pathways: o.items.map((n) => p(n)),
  }
}

export const categories: Category[] = [
  cat({
    slug: 'metabolism',
    name: 'Metabolism',
    korean: '물질대사',
    tagline: 'The grammar of energy and matter',
    image: '/images/chemistry.jpg',
    items: ['Metabolism', 'Study Tips for Metabolism'],
  }),
  cat({
    slug: 'digestion-absorption-transportation',
    name: 'Digestion, Absorption, Transportation',
    korean: '소화 · 흡수 · 운반',
    tagline: 'From the gut to the cell',
    image: '/images/carbohydrate.jpg',
    items: ['Digestion', 'Absorption', 'Transportation'],
  }),
  cat({
    slug: 'carbohydrate-metabolism',
    name: 'Carbohydrate Metabolism',
    korean: '탄수화물 대사',
    tagline: 'Central energy currency of the cell',
    image: '/images/carbohydrate.jpg',
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
    korean: '지질 대사',
    tagline: 'Storing and burning the body’s richest fuel',
    image: '/images/lipid.jpg',
    items: [
      'Lipolysis',
      'Glycerol Metabolism',
      'β-Oxidation',
      'Ketogenesis',
      'Ketolysis',
      'Fatty Acid Synthesis',
      'Lipogenesis',
    ],
  }),
  cat({
    slug: 'protein-metabolism',
    name: 'Protein Metabolism',
    korean: '단백질 대사',
    tagline: 'Recycling nitrogen and carbon skeletons',
    image: '/images/protein.jpg',
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
    korean: '핵산 대사',
    tagline: 'Building and salvaging the code of life',
    image: '/images/nucleic-acid.jpg',
    items: ['Purine Nucleotides', 'Pyrimidine Nucleotides'],
  }),
  cat({
    slug: 'vitamin-metabolism',
    name: 'Vitamin Metabolism',
    korean: '비타민 대사',
    tagline: 'Micronutrients that drive the machinery',
    image: '/images/chemistry.jpg',
    items: ['Fat Soluble Vitamins', 'Water Soluble Vitamins'],
  }),
  cat({
    slug: 'comparative-vet-biochem',
    name: 'Comparative Vet. Biochem',
    korean: '비교 수의생화학',
    tagline: 'How metabolism differs across species',
    image: '/images/protein.jpg',
    items: ['Dog', 'Cat', 'Ruminants', 'Avian'],
  }),
  cat({
    slug: 'hormonal-regulation-and-metabolism',
    name: 'Hormonal Regulation and Metabolism',
    korean: '호르몬 조절과 대사',
    tagline: 'The chemical signals that tune it all',
    image: '/images/lipid.jpg',
    items: ['Hormone', 'Hormonal Regulation and Metabolism'],
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
