'use client'

import type { Journal } from './types'

// Client-side loader for the 2026-08 Elsevier/Frontiers bulk publisher-
// catalog expansion (~3300 records) — deliberately NOT a static import.
// See benchmark-journals.ts's header and scripts/sync-corpus.mjs for why:
// baking this into the build produced multi-MB static HTML and broke a
// live Cloudflare Pages deployment. This fetches the plain JSON asset at
// runtime instead, cached at module scope so multiple components on the
// same page (or repeat visits within a session) don't re-fetch.

const DATA_URL = '/data/global-benchmark-publisher-catalog.json'

let cache: Promise<Journal[]> | null = null

export function fetchPublisherCatalogJournals(): Promise<Journal[]> {
  if (!cache) {
    cache = fetch(DATA_URL)
      .then(res => {
        if (!res.ok) throw new Error(`Failed to fetch publisher-catalog data: HTTP ${res.status}`)
        return res.json() as Promise<Journal[]>
      })
      .catch(err => {
        cache = null // allow a retry on the next call rather than caching a permanent failure
        throw err
      })
  }
  return cache
}

// Mature, PSC-classified at high confidence, in a same-category cohort of
// >=20 — the only group with an actual Citation Q quartile.
export function filterMatureRanked(journals: Journal[]): Journal[] {
  return journals
    .filter(j => j.citation_rating?.lifecycle_bucket === 'mature' && j.citation_rating?.citation_q?.ranking_method === 'pci_midrank')
    .sort((a, b) => (b.citation_rating!.citation_q!.percentile ?? 0) - (a.citation_rating!.citation_q!.percentile ?? 0))
}

// Mature, but unclassified/low-confidence or cohort too small to rank.
export function filterMatureUnclassified(journals: Journal[]): Journal[] {
  return journals.filter(j => j.citation_rating?.lifecycle_bucket === 'mature' && j.citation_rating?.citation_q?.ranking_method !== 'pci_midrank')
}

// Not yet 5+ years of OpenAlex-visible publishing history.
export function filterNotYetMature(journals: Journal[]): Journal[] {
  return journals.filter(j => j.citation_rating?.lifecycle_bucket === 'not_yet_mature')
}
