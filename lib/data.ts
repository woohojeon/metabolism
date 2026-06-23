export type Article = {
  category: string
  date?: string
  title: string
  byline?: string
  summary?: string
  image?: string
}

export const navLinks = ['NEWS', 'CAREERS', 'COMMENTARY', 'JOURNALS']

export const heroArticle: Article = {
  category: 'SCIENCE IMMUNOLOGY',
  date: '19 JUN 2026',
  title: 'DNA-chemokine adjuvant enables mucosal vaccination against genital herpes',
  byline: 'SACHIN H. BHAGCHANDANI, STEPHEN EHRENZELLER, ET AL.',
  summary:
    'A chemokine–nucleic acid nanoparticle adjuvant elicits protective mucosal immunity against genital herpes simplex virus 2 infection in mice.',
  image: '/images/hero-dna.png',
}

export const heroCards: Article[] = [
  {
    category: 'SCIENCE TRANSLATIONAL MEDICINE',
    date: '17 JUN 2026',
    title: 'Thrombosis and therapeutic target prediction in cancer',
    byline: 'BY DIMITRA KARAGKOUNI, MARISA A. BRAKE, ET AL.',
  },
  {
    category: 'SCIENCE SIGNALING',
    date: '16 JUN 2026',
    title: 'Deorphanizing an adipocyte GPCR',
    byline: 'BY ERIC JOHANSEN, GUAN-DA SYU, ET AL.',
  },
  {
    category: 'SCIENCE ROBOTICS',
    date: '17 JUN 2026',
    title: 'Therapist-exoskeleton-patient interaction for gait therapy',
    byline: 'BY EMEK BARIŞ KÜÇÜKTABAK, MATTHEW R. SHORT, ET AL.',
  },
]

export const heroMiddle: Article[] = [
  {
    category: 'SCIENCE',
    date: '18 JUN 2026',
    title: 'Violet seed propulsion inspires robot design',
    byline: 'BY S. N. PATEK',
    image: '/images/violet-seed.png',
  },
  {
    category: 'SCIENCE ADVANCES',
    date: '17 JUN 2026',
    title: 'Noninvasive whole-brain glymphatic imaging',
    byline: 'BY NANCHAO WANG, XINYUAN YU, ET AL.',
    image: '/images/glymphatic.png',
  },
]

export const latestNews = [
  {
    date: '19 JUN 2026',
    title: 'Researchers caught in the crossfire as companies and government grapple over AI safety',
  },
  {
    date: '19 JUN 2026',
    title: "'Light in a bottle' liquid can harvest and store energy from multiple sources",
  },
  {
    date: '18 JUN 2026',
    title: 'New NIH security rules for genomic data sets are slowing research, prompting workarounds',
  },
  {
    date: '18 JUN 2026',
    title: 'With new law, European Union can more quickly greenlight gene-edited crops',
  },
  {
    date: '18 JUN 2026',
    title: 'Speedy, spiraling electrical waves may be key to brain’s information flow',
  },
  {
    date: '18 JUN 2026',
    title: 'Wolves are reconquering Europe. Can people learn to live with them?',
  },
]

export const editorialQuote = {
  quote:
    '… Britain is … reckoning with doubts that the return on investment in public research is being felt at home.',
  category: 'EDITORIAL',
  date: '18 JUNE 2026',
  byline: 'BEN JOHNSON AND WILL STONE',
}

export const firstRelease: Article[] = [
  {
    category: 'SCIENCE',
    date: '18 JUN 2026',
    title: 'Dynamic asymmetric strain imprinted into substrates by an oxide thin film',
  },
  {
    category: 'SCIENCE',
    date: '18 JUN 2026',
    title:
      'Indium-free perovskite/silicon tandem solar cells with tin oxide recombination layer and electrodes',
  },
  {
    category: 'SCIENCE',
    date: '18 JUN 2026',
    title: 'EU Omnibus proposal increases pesticide risks',
  },
]

export const issueArticles: Article[] = [
  {
    category: 'RESEARCH ARTICLE',
    byline: 'BY QIAOSHI LIAN, JIA NIE, ET AL.',
    title: 'CD4⁺ T cells impair tumor growth through IL-3 and TNF-dependent vascular damage',
  },
  {
    category: 'RESEARCH ARTICLE',
    byline: 'BY ZHIWEN YE, ALEXANDER E. LADD, ET AL.',
    title: 'Brain-wide topographic coordination of rotating waves',
  },
  {
    category: 'RESEARCH ARTICLE',
    byline: 'BY LI CAO, SHUHAO AN, ET AL.',
    title: 'Scalable fabrication of COF membranes for aliphatic/aromatic separation of crude oil',
  },
  {
    category: 'RESEARCH ARTICLE',
    byline: 'BY HAIXU WU, DUOYUAN CHEN, ET AL.',
    title:
      'Lamprey 3D single-cell transcriptomics reveals ancestral and specialized features of the vertebrate brain',
  },
]

export const journalCovers = [
  { name: 'Science', image: '/images/mag-cover.png', active: true },
  { name: 'Science Advances', image: '/images/journal-advances.png' },
  { name: 'Science Immunology', image: '/images/journal-immunology.png' },
  { name: 'Science Robotics', image: '/images/journal-robotics.png' },
  { name: 'Science Signaling', image: '/images/journal-signaling.png' },
  { name: 'Science Translational Medicine', image: '/images/journal-transmed.png' },
]

export const customPublishing = [
  {
    image: '/images/custom-1.png',
    tag: 'FEATURE',
    title: 'Science education with real-world impact',
  },
  {
    image: '/images/custom-2.png',
    tag: 'FEATURE',
    title: 'Morgan State University rethinks graduate education for a changing world',
  },
  {
    image: '/images/custom-3.png',
    tag: 'FEATURE',
    title: 'Harnessing the promise of Latin American Science',
    large: true,
  },
  {
    image: '/images/custom-4.png',
    tag: 'BOOKLET',
    title: 'Frontiers of Medical Research: Genomic Medicine',
  },
  {
    image: '/images/custom-5.png',
    tag: 'PODCAST',
    title: 'When genomic medicine becomes medicine',
  },
]

export const careersArticles: Article[] = [
  {
    date: '18 JUN 2026',
    byline: 'BY MANUEL SPITSCHAN',
    title: 'What my dog taught me about leading a lab',
    image: '/images/career-1.png',
    category: '',
  },
  {
    date: '15 JUN 2026',
    byline: 'BY ELISABETH PAIN',
    title: 'The road to research independence may be bumpy. These lessons can help',
    image: '/images/career-2.png',
    category: '',
  },
  {
    date: '12 JUN 2026',
    byline: 'BY PERRI THALER',
    title: 'New documentary follows researchers’ increasingly fraught career path',
    image: '/images/career-3.png',
    category: '',
  },
  {
    date: '11 JUN 2026',
    byline: 'BY HOUDA KHALED',
    title: 'To succeed in my Ph.D., I had to rethink my mother’s story',
    image: '/images/career-4.png',
    category: '',
  },
  {
    date: '5 JUN 2026',
    byline: 'BY ADAM RUBEN',
    title: 'A fun way for scientists to reach out—as a pen pal',
    image: '/images/career-5.png',
    category: '',
  },
  {
    date: '4 JUN 2026',
    byline: 'BY SAKSHI GHAI',
    title: "I may not 'look like' a professor, but now I know I belong",
    image: '/images/career-6.png',
    category: '',
  },
]

export const newsFeatures: Article[] = [
  {
    date: '18 JUN 2026',
    byline: 'BY GRETCHEN VOGEL',
    title: 'Wolves are reconquering Europe. Can people learn to live with them?',
    summary:
      'As populations rebound, attacks on livestock and humans are fueling debate over the limits of coexistence',
    image: '/images/news-1.png',
    category: '',
  },
  {
    date: '11 JUN 2026',
    byline: 'BY PAUL VOOSEN',
    title: 'The ocean current that warms Europe may be more resilient than feared',
    summary:
      "Studies of the Atlantic's circulation find signs of both weakening and unexpected stability in the face of global warming",
    image: '/images/news-2.png',
    category: '',
  },
  {
    date: '4 JUN 2026',
    byline: 'BY JOSHUA SOKOL',
    title: 'Amid a flood of AI advances, astrophysicists are questioning the soul of their field',
    summary:
      'Researchers see enormous power in new tools—but also the potential end of astrophysics as a human endeavor',
    image: '/images/news-3.png',
    category: '',
  },
  {
    date: '21 MAY 2026',
    byline: 'BY RICHARD STONE',
    title: 'Ancient wars between microbes gave us key immune defenses',
    summary:
      'A better understanding of battles between bacteria and viruses could inspire new medicines',
    image: '/images/news-4.png',
    category: '',
  },
  {
    date: '18 MAY 2026',
    byline: 'BY HUMBERTO BASILIO',
    title: '¿Este científico fue demasiado lejos en su intento por salvar la vida silvestre de Ecuador?',
    summary:
      'Los esfuerzos de Alejandro Arteaga por identificar y proteger reptiles y anfibios tropicales lo han envuelto en controversia',
    image: '/images/news-5.png',
    category: '',
  },
]
