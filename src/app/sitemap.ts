import type { MetadataRoute } from 'next'
import { ANNOUNCEMENTS } from '@/lib/announcements'
import { getStaticRecordJournals } from '@/lib/records-data'
import { getPublishers } from '@/lib/global-journals'
import { DOCS_STRUCTURE } from '@/lib/docs-nav'
import { getEditionList } from '@/lib/ranking-editions'
import { availableLocales, sitemapLanguages, TRANSLATED_PATHS } from '@/i18n/alternates'
import { URL_PREFIX, LOCALES, DEFAULT_LOCALE } from '@/i18n/config'

export const dynamic = 'force-static'

const BASE = 'https://posi.panorama-sg.com'

// hreflang entries for a page that exists in more than one language.
const alternatesOf = (p: string) => { const languages = sitemapLanguages(p, BASE); return languages ? { alternates: { languages } } : {} }

// Built entirely from vendored data: no network calls at build time.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const top = ['/', '/publications/', '/journals/', '/journals/open-access/', '/core-collection/', '/publishers/', '/subjects/', '/datasets/', '/certificate/', '/certificate/verify/', '/certificate/zone/', '/certification/', '/cite/', '/logos/', '/rankings/']
  const docs = DOCS_STRUCTURE.flatMap(s => s.links.map(l => l.href))
  const paths = [...new Set([...top, ...docs])]
  // The translated pages, each at its own address with the same hreflang set as its English original.
  const translated = LOCALES.filter(l => l !== DEFAULT_LOCALE).flatMap(l => (TRANSLATED_PATHS[l] ?? []).map(p => ({ l, p })))
  return [
    ...paths.map(p => ({ url: `${BASE}${p}`, lastModified: now, changeFrequency: 'weekly' as const, priority: p === '/' ? 1 : 0.7, ...alternatesOf(p) })),
    ...translated.map(({ l, p }) => ({ url: `${BASE}${URL_PREFIX[l]}${p}`, lastModified: now, changeFrequency: 'weekly' as const, priority: p === '/' ? 0.9 : 0.6, ...alternatesOf(p) })),
    ...ANNOUNCEMENTS.map(a => ({ url: `${BASE}/announcements/${a.slug}/`, lastModified: new Date(a.date), changeFrequency: 'yearly' as const, priority: 0.4 })),
    ...getStaticRecordJournals().map(j => ({ url: `${BASE}/journal/${j.journal_code}/`, lastModified: new Date(j.updated_at), changeFrequency: 'monthly' as const, priority: 0.6, ...alternatesOf(`/journal/${j.journal_code}/`) })),
    // Each Citation Ranking edition's permanent address, in every language; an edition does not change once published.
    ...getEditionList().flatMap(e => LOCALES.filter(l => availableLocales(`/rankings/edition/${e.year}/`).includes(l)).map(l => ({ url: `${BASE}${URL_PREFIX[l]}/rankings/edition/${e.year}/`, lastModified: e.ranking_snapshot_date ? new Date(e.ranking_snapshot_date) : now, changeFrequency: (e.current ? 'monthly' : 'yearly') as 'monthly' | 'yearly', priority: 0.5, ...alternatesOf(`/rankings/edition/${e.year}/`) }))),
    ...getPublishers().filter(p => p.page).map(p => ({ url: `${BASE}/publishers/${p.slug}/`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.5 })),
  ]
}
