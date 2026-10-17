// OpenAlex's total works, journals and works per type, refreshed weekly by scripts/fetch-openalex-totals.mjs
// (.github/workflows/openalex-totals.yml). Empty until the first run; every use must cope with that.
import raw from './openalex-totals.json'
import type { Facet } from './openalex'

export interface OpenAlexTotals { fetched_at: string | null; works: number | null; journals: number | null; types: Facet[] }

export const OPENALEX_TOTALS = raw as OpenAlexTotals

/** The totals, or null when they have not been fetched yet. */
export function openalexTotals(): (OpenAlexTotals & { works: number }) | null {
  return OPENALEX_TOTALS.works ? (OPENALEX_TOTALS as OpenAlexTotals & { works: number }) : null
}
