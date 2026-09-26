// Sidebar for every documentation page (the (docs) route group).
export interface DocsLink { label: string; href: string; external?: boolean }
export interface DocsSection { title: string; links: DocsLink[] }

export const DOCS_NAV: DocsSection[] = [
  {
    title: 'Start here',
    links: [
      { label: 'Documentation home', href: '/docs/' },
      { label: 'About POSI', href: '/about/' },
      { label: 'What POSI is', href: '/what-posi-is/' },
      { label: 'What POSI is not', href: '/what-posi-is-not/' },
      { label: 'Changelog', href: '/announcements/' },
    ],
  },
  {
    title: 'Data model',
    links: [
      { label: 'Record schema', href: '/docs/schema/' },
      { label: 'Provenance & verification', href: '/docs/provenance/' },
      { label: 'Indexing certificates', href: '/docs/certificates/' },
      { label: 'Data sources', href: '/data-sources/' },
      { label: 'Source status', href: '/source-status/' },
      { label: 'Programmatic access', href: '/api/' },
      { label: 'Export formats', href: '/export-formats/' },
    ],
  },
  {
    title: 'Collections',
    links: [
      { label: 'Core Collection', href: '/core-collection/' },
      { label: 'Global Benchmark', href: '/coverage/global-benchmark/' },
      { label: 'Coverage policy', href: '/coverage/policy/' },
      { label: 'Coverage changes', href: '/coverage/changes/' },
      { label: 'Inclusion & verification policy', href: '/policy/' },
    ],
  },
  {
    title: 'Ratings & indicators',
    links: [
      { label: 'Lifecycle ratings (AJR)', href: '/ratings/' },
      { label: 'Early-stage rankings', href: '/ratings/early-stage/' },
      { label: 'Mature rankings', href: '/ratings/mature/' },
      { label: 'Citation rankings', href: '/citation-reports/' },
      { label: 'Citation impact (PCI)', href: '/pci/' },
      { label: 'Citation score (PCS)', href: '/pcs/' },
      { label: 'Metadata quality (MQS)', href: '/mqs/' },
      { label: 'Indexing readiness (IRS)', href: '/irs/' },
      { label: 'Citation visibility (CVI)', href: '/cvi/' },
    ],
  },
  {
    title: 'Editorial selection',
    links: [
      { label: 'PQF methodology', href: '/pqf/' },
      { label: 'Evidence registry', href: '/evidence/' },
      { label: 'Journal evidence records', href: '/journal-evidence/' },
      { label: 'Policy coverage estimate', href: '/policies/' },
      { label: 'Submit a journal', href: '/submit-journal/' },
      { label: 'Badges', href: '/badges/' },
    ],
  },
  {
    title: 'Governance',
    links: [
      { label: 'Responsible use', href: '/responsible-use/' },
      { label: 'Conflict of interest', href: '/coi/' },
      { label: 'Operator', href: '/operator/' },
      { label: 'Terms of use', href: '/terms/' },
      { label: 'Privacy', href: '/privacy/' },
      { label: 'Contact', href: '/contact/' },
      { label: 'PSG citation format', href: '/psg-format/' },
    ],
  },
]
