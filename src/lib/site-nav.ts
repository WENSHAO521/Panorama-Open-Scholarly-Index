// Primary, utility and footer navigation. The structure (which links exist, and where they go) is here; the
// words are in src/i18n/messages, looked up by id, so the same structure serves every language.
import type { Messages } from '../i18n/index.ts'

export interface NavLink { label: string; href: string; description?: string }
/** `match` lists extra path prefixes that belong to the group without being in its menu, so the header highlights it on those pages. */
export interface NavGroup { id: string; label: string; href?: string; links?: NavLink[]; match?: string[] }

interface LinkDef { id: string; href: string }
interface GroupDef { id: string; href?: string; match?: string[]; links?: LinkDef[] }

export const PRIMARY_STRUCTURE: GroupDef[] = [
  { id: 'journals', match: ['/journal/', '/record/'], links: [
      { id: 'browseJournals', href: '/journals/' },
      { id: 'coreCollection', href: '/core-collection/' },
      { id: 'openAccessDirectory', href: '/journals/open-access/' },
      { id: 'publishers', href: '/publishers/' },
      { id: 'subjectCategories', href: '/subjects/' },
    ]
  },
  { id: 'rankings', match: ['/grades/', '/pqf/', '/pci/', '/ratings/'], links: [
      { id: 'citationRankings', href: '/rankings/' },
      { id: 'allCategories', href: '/rankings/all/' },
      { id: 'methodology', href: '/methodology/' },
    ]
  },
  { id: 'publications', href: '/publications/', match: ['/work/'] },
  { id: 'services', links: [
      { id: 'certificateOfIndexing', href: '/certificate/' },
      { id: 'verifyACertificate', href: '/certificate/verify/' },
      { id: 'zoneCertificate', href: '/certificate/zone/' },
      { id: 'journalCertification', href: '/certification/' },
      { id: 'citationGenerator', href: '/cite/' },
      { id: 'pSGCitationFormat', href: '/psg-format/' },
      { id: 'logosAndJournalMarks', href: '/logos/' },
    ]
  },
  { id: 'data', href: '/datasets/' },
  { id: 'about', match: ['/coi/', '/privacy/', '/terms/', '/responsible-use/'], links: [
      { id: 'aboutPOSI', href: '/about/' },
      { id: 'editorialPolicy', href: '/editorial-policy/' },
      { id: 'documentation', href: '/docs/' },
      { id: 'news', href: '/announcements/' },
      { id: 'contact', href: '/contact/' },
    ]
  },
]

/** Utility strip above the main header. */
export const UTILITY_STRUCTURE: LinkDef[] = [
  { id: 'editorialPolicy', href: '/editorial-policy/' },
  { id: 'methodology', href: '/methodology/' },
  { id: 'documentation', href: '/docs/' },
  { id: 'contact', href: '/contact/' },
]

export const FOOTER_STRUCTURE: { id: string; links: LinkDef[] }[] = [
  {
    id: 'search',
    links: [
      { id: 'publications', href: '/publications/' },
      { id: 'journals', href: '/journals/' },
      { id: 'publishers', href: '/publishers/' },
      { id: 'subjectCategories', href: '/subjects/' },
      { id: 'citationRankings', href: '/rankings/' },
    ],
  },
  {
    id: 'services',
    links: [
      { id: 'certificateOfIndexing', href: '/certificate/' },
      { id: 'verifyACertificate', href: '/certificate/verify/' },
      { id: 'zoneCertificate', href: '/certificate/zone/' },
      { id: 'journalCertification', href: '/certification/' },
      { id: 'citationGenerator', href: '/cite/' },
      { id: 'pSGCitationFormat', href: '/psg-format/' },
      { id: 'logosAndJournalMarks', href: '/logos/' },
      { id: 'dataDownloads', href: '/datasets/' },
    ],
  },
  {
    id: 'about',
    links: [
      { id: 'aboutPOSI', href: '/about/' },
      { id: 'editorialPolicy', href: '/editorial-policy/' },
      { id: 'methodology', href: '/methodology/' },
      { id: 'documentation', href: '/docs/' },
      { id: 'news', href: '/announcements/' },
      { id: 'contact', href: '/contact/' },
    ],
  },
  {
    id: 'legal',
    links: [
      { id: 'termsOfUse', href: '/terms/' },
      { id: 'privacyPolicy', href: '/privacy/' },
      { id: 'responsibleUse', href: '/responsible-use/' },
      { id: 'conflictOfInterest', href: '/coi/' },
    ],
  },
]

type PrimaryText = Record<string, { label: string; links?: Record<string, { label: string; description?: string }> }>

export function primaryNav(nav: Messages['nav']): NavGroup[] {
  const text: PrimaryText = nav.primary
  return PRIMARY_STRUCTURE.map(g => ({
    id: g.id,
    label: text[g.id].label,
    href: g.href,
    match: g.match,
    links: g.links?.map(l => ({ href: l.href, ...text[g.id].links![l.id] })),
  }))
}

export function utilityNav(nav: Messages['nav']): NavLink[] {
  const text: Record<string, string> = nav.utility
  return UTILITY_STRUCTURE.map(l => ({ href: l.href, label: text[l.id] }))
}

export function footerNav(nav: Messages['nav']): { title: string; links: NavLink[] }[] {
  const text: Record<string, { title: string; links: Record<string, string> }> = nav.footer
  return FOOTER_STRUCTURE.map(c => ({ title: text[c.id].title, links: c.links.map(l => ({ href: l.href, label: text[c.id].links[l.id] })) }))
}
