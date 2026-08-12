import type { MetadataRoute } from 'next'
import { ALL_JOURNALS, PSG_JOURNALS } from '@/lib/data'
import { crossrefSearch, crossrefHarvestJournal } from '@/lib/api'
import { ANNOUNCEMENTS } from '@/lib/announcements'

export const dynamic = 'force-static'

const BASE = 'https://posi.panorama-sg.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`,                       lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE}/search/`,                lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE}/advanced-search/`,       lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/journals/`,              lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE}/journal-evidence/`,      lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/doi-lookup/`,            lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/isbn-lookup/`,           lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/cite/`,                  lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/pqf/`,                   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/pci/`,                   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/ratings/`,               lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/ratings/early-stage/`,   lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE}/ratings/mature/`,        lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE}/citation-reports/`,      lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE}/subjects/`,              lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/core-collection/`,       lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE}/coverage/global-benchmark/`, lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.6 },
    { url: `${BASE}/coverage/policy/`,       lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/coverage/changes/`,      lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.5 },
    { url: `${BASE}/evidence/`,              lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/cvi/`,                   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/mqs/`,                   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/irs/`,                   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/ojqf/`,                  lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/verify/`,                lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/badges/`,                lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/data-sources/`,          lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/source-status/`,         lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.5 },
    { url: `${BASE}/open-data/`,             lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/export-formats/`,        lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/psg-format/`,            lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/api/`,                   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/submit-journal/`,        lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/policies/`,              lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/policy/`,                lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/announcements/`,         lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.5 },
    { url: `${BASE}/what-posi-is/`,          lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/what-posi-is-not/`,      lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/responsible-use/`,       lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/coi/`,                   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/operator/`,              lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/about/`,                 lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/contact/`,               lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/privacy/`,               lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE}/terms/`,                 lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
  ]

  const announcementRoutes: MetadataRoute.Sitemap = ANNOUNCEMENTS.map(a => ({
    url: `${BASE}/announcements/${a.slug}/`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.4,
  }))

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

  return [...staticRoutes, ...announcementRoutes, ...journalRoutes, ...articleRoutes]
}
