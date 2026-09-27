import type { MetadataRoute } from 'next'
import { ANNOUNCEMENTS } from '@/lib/announcements'
import { getStaticRecordJournals } from '@/lib/records-data'
import { getPublishers } from '@/lib/global-journals'
import { DOCS_NAV } from '@/lib/docs-nav'

export const dynamic = 'force-static'

const BASE = 'https://posi.panorama-sg.com'

// Built entirely from vendored data: no network calls at build time.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const top = ['/', '/publications/', '/journals/', '/journals/open-access/', '/publishers/', '/subjects/', '/datasets/', '/certificate/', '/certificate/verify/', '/certificate/zone/', '/certification/', '/cite/', '/logos/', '/rankings/']
  const docs = DOCS_NAV.flatMap(s => s.links.map(l => l.href))
  const paths = [...new Set([...top, ...docs])]
  return [
    ...paths.map(p => ({ url: `${BASE}${p}`, lastModified: now, changeFrequency: 'weekly' as const, priority: p === '/' ? 1 : 0.7 })),
    ...ANNOUNCEMENTS.map(a => ({ url: `${BASE}/announcements/${a.slug}/`, lastModified: new Date(a.date), changeFrequency: 'yearly' as const, priority: 0.4 })),
    ...getStaticRecordJournals().map(j => ({ url: `${BASE}/journal/${j.journal_code}/`, lastModified: new Date(j.updated_at), changeFrequency: 'monthly' as const, priority: 0.6 })),
    ...getPublishers().filter(p => p.page).map(p => ({ url: `${BASE}/publishers/${p.slug}/`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.5 })),
  ]
}
