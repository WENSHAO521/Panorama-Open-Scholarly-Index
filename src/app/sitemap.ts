import type { MetadataRoute } from 'next'
import { ALL_JOURNALS, PSG_JOURNALS } from '@/lib/data'
import { crossrefSearch, crossrefHarvestJournal } from '@/lib/api'

export const dynamic = 'force-static'

const BASE = 'https://posi.panorama-sg.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`,               lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE}/search/`,        lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE}/journals/`,      lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE}/doi-lookup/`,    lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/pqf/`,           lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/evidence/`,      lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/data-sources/`,  lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/api/`,           lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/submit-journal/`,lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/about/`,         lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ]

  const journalRoutes: MetadataRoute.Sitemap = ALL_JOURNALS.map(j => ({
    url: `${BASE}/journal/${j.journal_code}/`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  // Collect article DOIs
  const doiSet = new Set<string>()
  try {
    const { items } = await crossrefSearch('', { rows: 250, scope: 'psg' })
    items.forEach(a => doiSet.add(a.doi.replace(/\//g, '_')))
  } catch {}
  if (doiSet.size === 0) {
    await Promise.allSettled(
      PSG_JOURNALS
        .filter(j => j.issn_online)
        .map(j =>
          crossrefHarvestJournal(j.issn_online!)
            .then(items => items.forEach(a => doiSet.add(a.doi.replace(/\//g, '_'))))
            .catch(() => {})
        )
    )
  }

  const articleRoutes: MetadataRoute.Sitemap = Array.from(doiSet).map(doi => ({
    url: `${BASE}/article/${doi}/`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  return [...staticRoutes, ...journalRoutes, ...articleRoutes]
}
