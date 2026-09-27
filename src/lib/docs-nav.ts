// Sidebar for every documentation page (the (docs) route group).
export interface DocsLink { label: string; href: string; external?: boolean }
export interface DocsSection { title: string; blurb: string; links: DocsLink[] }

export const DOCS_NAV: DocsSection[] = [
  {
    title: 'About',
    blurb: 'Who publishes POSI, what it covers, and how to reach us.',
    links: [
      { label: 'About POSI', href: '/about/' },
      { label: 'News', href: '/announcements/' },
      { label: 'Contact', href: '/contact/' },
    ],
  },
  {
    title: 'Policies',
    blurb: 'Indexing, certification, coverage changes and appropriate use.',
    links: [
      { label: 'Editorial policy', href: '/editorial-policy/' },
      { label: 'Core Collection', href: '/core-collection/' },
      { label: 'Responsible use', href: '/responsible-use/' },
      { label: 'Conflict of interest', href: '/coi/' },
    ],
  },
  {
    title: 'Methodology',
    blurb: 'Subject classification, the POSI Citation Score and the rankings.',
    links: [
      { label: 'Methodology', href: '/methodology/' },
      { label: 'Certificates', href: '/docs/certificates/' },
      { label: 'PSG citation format', href: '/psg-format/' },
    ],
  },
  {
    title: 'Data',
    blurb: 'Sources, record fields, provenance and downloads.',
    links: [
      { label: 'Documentation home', href: '/docs/' },
      { label: 'Data sources and access', href: '/docs/data/' },
      { label: 'Record schema', href: '/docs/schema/' },
      { label: 'Provenance and verification', href: '/docs/provenance/' },
    ],
  },
  {
    title: 'Legal',
    blurb: 'Terms of use and privacy.',
    links: [
      { label: 'Terms of use', href: '/terms/' },
      { label: 'Privacy policy', href: '/privacy/' },
    ],
  },
]
