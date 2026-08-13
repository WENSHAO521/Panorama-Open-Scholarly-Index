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

// Real, checkable evidence of >=5 years of OpenAlex-visible publishing
// activity. NOT a ranking split — every citation_preview record is
// status: "diagnostic_only", so there is no "ranked" subset any more (see
// posi-data's audits/migrations/citation-preview-correction-2026/ for why
// the earlier ranked/unclassified split was withdrawn). Sorted by the raw
// OpenAlex citedness value only for display purposes, not as a claim of
// rank.
export function filterMatureEvidence(journals: Journal[]): Journal[] {
  return journals
    .filter(j => j.citation_preview?.history_evidence.has_activity_5y_ago === true)
    .sort((a, b) => (b.citation_preview!.value ?? 0) - (a.citation_preview!.value ?? 0))
}

// Not yet 5+ years of OpenAlex-visible publishing history — this is
// absence of proof of maturity, not proof of Early-Stage (12-59 months);
// callers must not display these as genuinely evaluated Early-Stage rows.
export function filterNotYetMature(journals: Journal[]): Journal[] {
  return journals.filter(j => j.citation_preview?.history_evidence.has_activity_5y_ago === false)
}
