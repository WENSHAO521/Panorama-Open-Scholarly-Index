'use client'

import type { Journal } from './types'

// Client-side loader for the 2026-08 Elsevier/Frontiers bulk publisher-
// catalog expansion (~3300 records) — deliberately NOT a static import,
// and as of 2026-08-13 no longer even a same-origin static asset copied
// into this repo's own Cloudflare Pages deployment. It's fetched directly
// from posi-data-delivery (https://github.com/WENSHAO521/posi-data-delivery),
// a dedicated public GitHub-Pages-hosted data layer — so this repo never
// vendors the file at all, not even as a build artifact. See that repo's
// README for the current.json -> manifest -> collection fetch pattern
// this follows, and scripts/sync-corpus.mjs's header for the earlier
// incident (a multi-MB static HTML page broke a live Cloudflare Pages
// deployment) that motivated moving this data out of the deployment
// entirely rather than just moving the fetch to runtime within it.
// Cached at module scope so multiple components on the same page (or
// repeat visits within a session) don't re-fetch.

// Duplicated as a plain literal in scripts/sync-corpus.mjs (see that
// file's comment for why it's not a shared cross-boundary import).
const POSI_DATA_BASE = 'https://data.posi.panorama-sg.com'

interface CurrentPointer {
  snapshot: string
  manifest: string
}

let cache: Promise<Journal[]> | null = null

export function fetchPublisherCatalogJournals(): Promise<Journal[]> {
  if (!cache) {
    cache = fetch(`${POSI_DATA_BASE}/current.json`)
      .then(res => {
        if (!res.ok) throw new Error(`Failed to fetch current.json: HTTP ${res.status}`)
        return res.json() as Promise<CurrentPointer>
      })
      .then(current => {
        const snapshotDir = current.manifest.replace(/\/manifest\.json$/, '')
        return fetch(`${POSI_DATA_BASE}${snapshotDir}/collections/publisher-catalog.json`)
      })
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
