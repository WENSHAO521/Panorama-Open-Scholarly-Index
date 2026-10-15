// Sidebar for every documentation page (the (docs) route group). The structure is here; the words are in
// src/i18n/messages, looked up by id.
import type { Messages } from '../i18n/index.ts'

export interface DocsLink { label: string; href: string; external?: boolean }
export interface DocsSection { title: string; blurb: string; links: DocsLink[] }

interface LinkDef { id: string; href: string; external?: boolean }

export const DOCS_STRUCTURE: { id: string; links: LinkDef[] }[] = [
  {
    id: 'about',
    links: [
      { id: 'aboutPOSI', href: '/about/' },
      { id: 'news', href: '/announcements/' },
      { id: 'contact', href: '/contact/' },
    ],
  },
  {
    id: 'policies',
    links: [
      { id: 'editorialPolicy', href: '/editorial-policy/' },
      { id: 'responsibleUse', href: '/responsible-use/' },
      { id: 'conflictOfInterest', href: '/coi/' },
    ],
  },
  {
    id: 'methodology',
    links: [
      { id: 'methodology', href: '/methodology/' },
      { id: 'howToReadPOSIGrades', href: '/grades/' },
      { id: 'pQFCoreCollectionEligibility', href: '/pqf/' },
      { id: 'aJRRatings', href: '/ratings/' },
      { id: 'aJRE', href: '/ratings/early-stage/' },
      { id: 'aJRM', href: '/ratings/mature/' },
      { id: 'citationIndicators', href: '/pci/' },
      { id: 'certificates', href: '/docs/certificates/' },
      { id: 'pSGCitationFormat', href: '/psg-format/' },
    ],
  },
  {
    id: 'data',
    links: [
      { id: 'documentationHome', href: '/docs/' },
      { id: 'dataSourcesAndAccess', href: '/docs/data/' },
      { id: 'recordSchema', href: '/docs/schema/' },
      { id: 'provenanceAndVerification', href: '/docs/provenance/' },
    ],
  },
  {
    id: 'legal',
    links: [
      { id: 'termsOfUse', href: '/terms/' },
      { id: 'privacyPolicy', href: '/privacy/' },
    ],
  },
]

export function docsNav(docs: Messages['docs']): DocsSection[] {
  const text: Record<string, { title: string; blurb: string; links: Record<string, string> }> = docs
  return DOCS_STRUCTURE.map(s => ({
    title: text[s.id].title,
    blurb: text[s.id].blurb,
    links: s.links.map(l => ({ href: l.href, label: text[s.id].links[l.id], ...(l.external ? { external: true } : {}) })),
  }))
}
