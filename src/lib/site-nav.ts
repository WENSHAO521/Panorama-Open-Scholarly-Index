// Primary navigation. One source for the header menu and the footer.

export interface NavLink { label: string; href: string; description?: string }
/** `match` lists extra path prefixes that belong to the group without being in its menu, so the header highlights it on those pages. */
export interface NavGroup { label: string; href?: string; links?: NavLink[]; match?: string[] }

export const PRIMARY_NAV: NavGroup[] = [
  {
    label: 'Journals',
    match: ['/journal/', '/record/'],
    links: [
      { label: 'Browse journals', href: '/journals/', description: 'Every indexed journal, by subject category' },
      { label: 'Core Collection', href: '/core-collection/', description: 'Journals certified after editorial evaluation' },
      { label: 'Open access directory', href: '/journals/open-access/', description: 'Open access journals by subject' },
      { label: 'Publishers', href: '/publishers/', description: 'Publishers and their journals' },
      { label: 'Subject categories', href: '/subjects/', description: 'The PSC subject classification' },
    ],
  },
  {
    label: 'Rankings',
    match: ['/grades/', '/pqf/', '/pci/', '/ratings/'],
    links: [
      { label: 'Citation Rankings', href: '/rankings/', description: 'PNCI ranks, Citation Quartiles and POSI Zones by subject category' },
      { label: 'All categories', href: '/rankings/all/', description: 'Every ranked journal, with its category rank' },
      { label: 'Methodology', href: '/methodology/', description: 'PQF, AJR, citation indicators and the ranking method' },
    ],
  },
  { label: 'Publications', href: '/publications/', match: ['/work/'] },
  {
    label: 'Services',
    links: [
      { label: 'Certificate of indexing', href: '/certificate/', description: 'For authors of indexed publications' },
      { label: 'Verify a certificate', href: '/certificate/verify/', description: 'Check a certificate number' },
      { label: 'Zone certificate', href: '/certificate/zone/', description: 'A journal’s official POSI Zone in its subject category' },
      { label: 'Journal certification', href: '/certification/', description: 'Apply for the Core Collection' },
      { label: 'Citation generator', href: '/cite/', description: 'Convert one or many DOIs, titles or references to PSG, APA, MLA and Chicago' },
      { label: 'PSG citation format', href: '/psg-format/', description: 'The PSG author-date citation standard' },
      { label: 'Logos and journal marks', href: '/logos/', description: 'POSI marks for indexed and Core Collection journals' },
    ],
  },
  { label: 'Data', href: '/datasets/' },
  {
    label: 'About',
    match: ['/coi/', '/privacy/', '/terms/', '/responsible-use/'],
    links: [
      { label: 'About POSI', href: '/about/', description: 'Publisher, coverage and independence' },
      { label: 'Editorial policy', href: '/editorial-policy/', description: 'Indexing, certification and coverage changes' },
      { label: 'Documentation', href: '/docs/', description: 'Data sources, schema and provenance' },
      { label: 'News', href: '/announcements/', description: 'Updates and coverage changes' },
      { label: 'Contact', href: '/contact/', description: 'Corrections, certification and data enquiries' },
    ],
  },
]

/** Utility strip above the main header. */
export const UTILITY_NAV: NavLink[] = [
  { label: 'Editorial policy', href: '/editorial-policy/' },
  { label: 'Methodology', href: '/methodology/' },
  { label: 'Documentation', href: '/docs/' },
  { label: 'Contact', href: '/contact/' },
]

export const FOOTER_NAV: { title: string; links: NavLink[] }[] = [
  {
    title: 'Search',
    links: [
      { label: 'Publications', href: '/publications/' },
      { label: 'Journals', href: '/journals/' },
      { label: 'Publishers', href: '/publishers/' },
      { label: 'Subject categories', href: '/subjects/' },
      { label: 'Citation Rankings', href: '/rankings/' },
    ],
  },
  {
    title: 'Services',
    links: [
      { label: 'Certificate of indexing', href: '/certificate/' },
      { label: 'Verify a certificate', href: '/certificate/verify/' },
      { label: 'Zone certificate', href: '/certificate/zone/' },
      { label: 'Journal certification', href: '/certification/' },
      { label: 'Citation generator', href: '/cite/' },
      { label: 'PSG citation format', href: '/psg-format/' },
      { label: 'Logos and journal marks', href: '/logos/' },
      { label: 'Data downloads', href: '/datasets/' },
    ],
  },
  {
    title: 'About',
    links: [
      { label: 'About POSI', href: '/about/' },
      { label: 'Editorial policy', href: '/editorial-policy/' },
      { label: 'Methodology', href: '/methodology/' },
      { label: 'Documentation', href: '/docs/' },
      { label: 'News', href: '/announcements/' },
      { label: 'Contact', href: '/contact/' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms of use', href: '/terms/' },
      { label: 'Privacy policy', href: '/privacy/' },
      { label: 'Responsible use', href: '/responsible-use/' },
      { label: 'Conflict of interest', href: '/coi/' },
    ],
  },
]
