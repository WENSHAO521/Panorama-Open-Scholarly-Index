import type { MetadataRoute } from 'next'
import { ANNOUNCEMENTS } from '@/lib/announcements'
import { getStaticRecordJournals } from '@/lib/records-data'
import { getPublishers } from '@/lib/global-journals'
import { DOCS_NAV } from '@/lib/docs-nav'
import { getEditionList } from '@/lib/ranking-editions'
import { LOCALES, TRANSLATED_PAGES, localizedPath } from '@/lib/i18n/locales'
import { languageAlternates } from '@/lib/i18n/metadata'

export const dynamic = 'force-static'

const BASE = 'https://posi.panorama-sg.com'

function alternates(page: string) {
  if (!TRANSLATED_PAGES.includes(page)) return {}
  return { alternates: { languages: Object.fromEntries(Object.entries(languageAlternates(page)).map(([k, v]) => [k, `${BASE}${v}`])) } }
}

// Built entirely from vendored data: no network calls at build time.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const top = ['/', '/publications/', '/journals/', '/journals/open-access/', '/core-collection/', '/publishers/', '/subjects/', '/datasets/', '/certificate/', '/certificate/verify/', '/certificate/zone/', '/certification/', '/cite/', '/logos/', '/rankings/']
  const docs = DOCS_NAV.flatMap(s => s.links.map(l => l.href))
  const paths = [...new Set([...top, ...docs])]
  return [
    ...paths.map(p => ({ url: `${BASE}${p}`, lastModified: now, changeFrequency: 'weekly' as const, priority: p === '/' ? 1 : 0.7, ...alternates(p) })),
    // The localized copies (/ja/, /ko/, /zh-cn/, /zh-tw/), each listing its alternates.
    ...TRANSLATED_PAGES.flatMap(p => LOCALES.filter(l => l.path).map(l => ({ url: `${BASE}${localizedPath(p, l.code)}`, lastModified: now, changeFrequency: 'weekly' as const, priority: p === '/' ? 0.9 : 0.6, ...alternates(p) }))),
    ...ANNOUNCEMENTS.map(a => ({ url: `${BASE}/announcements/${a.slug}/`, lastModified: new Date(a.date), changeFrequency: 'yearly' as const, priority: 0.4 })),
    ...getStaticRecordJournals().map(j => ({ url: `${BASE}/journal/${j.journal_code}/`, lastModified: new Date(j.updated_at), changeFrequency: 'monthly' as const, priority: 0.6 })),
    // Each Citation Ranking edition's permanent address; an edition does not change once published.
    ...getEditionList().map(e => ({ url: `${BASE}/rankings/edition/${e.year}/`, lastModified: e.ranking_snapshot_date ? new Date(e.ranking_snapshot_date) : now, changeFrequency: (e.current ? 'monthly' : 'yearly') as 'monthly' | 'yearly', priority: 0.5 })),
    ...getPublishers().filter(p => p.page).map(p => ({ url: `${BASE}/publishers/${p.slug}/`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.5 })),
  ]
}
