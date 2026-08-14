'use client'

// Client-side loader for the full PCS (POSI Citation Score, PCS-1.0-SPEC.md)
// collection -- mirrors publisher-catalog-client.ts's pattern exactly:
// fetched at runtime from data.posi.panorama-sg.com rather than statically
// imported, so it can never be pulled into a client component's JS bundle.
//
// Why this exists as a SEPARATE module from src/lib/pcs.ts rather than
// reusing it here: pcs.ts does `import raw from './pcs.json'`, a static
// import. That's safe for the server components that currently use it
// (journal/[code]/page.tsx, citation-reports/page.tsx, pcs/page.tsx) --
// verified empirically (2026-08-14) with a real build at 4320 records
// (1.63MB source JSON): per-page output size was unchanged to the byte on
// every page except /pcs itself (which grew by 4 bytes, from a stat-count
// string, not the array), and _next/static (the client JS bundle) was
// byte-identical, because every current consumer does a single-record
// getPcsEntry() lookup or an aggregate count, never passes the full array
// to a 'use client' component. That safety property does NOT hold here:
// CitationReportsTable.tsx (this module's only consumer) is itself a
// client component, and it needs to look up PCS for the ~3300-record
// Global Benchmark publisher-catalog set it already fetches client-side
// (see publisher-catalog-client.ts) -- if it statically imported pcs.ts
// instead, webpack would bundle the entire pcs.json collection into the
// client JS shipped to every visitor, which is exactly the failure mode
// that broke a live Cloudflare Pages deployment once already (see
// publisher-catalog-client.ts's header and scripts/sync-corpus.mjs's).
//
// Cached at module scope so multiple components/repeat renders don't
// re-fetch within a session.

const POSI_DATA_BASE = 'https://data.posi.panorama-sg.com'

// Mirrors src/lib/pcs.ts's PcsEntry shape exactly (kept as a local literal,
// not `import type` from pcs.ts, so this file has zero import-graph
// connection to pcs.ts/pcs.json -- belt-and-suspenders against an
// accidental future refactor reintroducing a value import).
export interface PcsClientEntry {
  journal_id: string
  metric_year: number
  pcs: number | null
  pcs_window_start_year: number | null
  pcs_window_end_year: number | null
  pcs_eligible_items: number | null
  pcs_items_with_citation_data: number | null
  pcs_coverage: number | null
  pcs_source: 'crossref' | null
  pcs_source_retrieved_at: string | null
  pcs_methodology_version: string | null
}

interface CurrentPointer {
  snapshot: string
  manifest: string
}

let cache: Promise<PcsClientEntry[]> | null = null

export function fetchAllPcsEntriesClient(): Promise<PcsClientEntry[]> {
  if (!cache) {
    cache = fetch(`${POSI_DATA_BASE}/current.json`)
      .then(res => {
        if (!res.ok) throw new Error(`Failed to fetch current.json: HTTP ${res.status}`)
        return res.json() as Promise<CurrentPointer>
      })
      .then(current => {
        const snapshotDir = current.manifest.replace(/\/manifest\.json$/, '')
        return fetch(`${POSI_DATA_BASE}${snapshotDir}/collections/pcs.json`)
      })
      .then(res => {
        if (!res.ok) throw new Error(`Failed to fetch pcs data: HTTP ${res.status}`)
        return res.json() as Promise<PcsClientEntry[]>
      })
      .catch(err => {
        cache = null // allow a retry on the next call rather than caching a permanent failure
        throw err
      })
  }
  return cache
}

/** Builds a journal_id -> entry lookup map, for O(1) joins against a list
 * of Journal records that carry posi_id. */
export function indexPcsEntriesByJournalId(entries: PcsClientEntry[]): Map<string, PcsClientEntry> {
  return new Map(entries.map(e => [e.journal_id, e]))
}
