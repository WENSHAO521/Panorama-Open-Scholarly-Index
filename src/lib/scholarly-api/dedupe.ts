// DOI normalisation and conservative merging of works returned by different providers. Citation counts from
// different sources are never added together: each source's count is kept beside its source name.

export function normalizeDoi(s: string | null | undefined): string | null {
  const m = /10\.\d{4,9}\/\S+/i.exec(decodeURIComponentSafe((s ?? '').trim()))
  return m ? m[0].replace(/[.,;:)\]}>]+$/, '').toLowerCase() : null
}

function decodeURIComponentSafe(s: string): string {
  try { return decodeURIComponent(s) } catch { return s }
}

export interface DedupeWork {
  doi: string | null
  title: string | null
  year: number | null
  source: string
  citations: number | null
}

export interface MergedWork<T extends DedupeWork> {
  primary: T
  /** every provider's copy, including the primary */
  sources: T[]
  citationsBySource: { source: string; count: number }[]
  /** set when providers disagree about the title or year of a DOI */
  conflict: boolean
}

const norm = (t: string | null) => (t ?? '').toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}]+/gu, ' ').trim()

/**
 * Group by normalised DOI. Works without a DOI are kept apart unless title and year both match exactly after
 * normalisation (a deliberately strict rule: a missed merge is cheaper than a wrong one). Order follows the
 * first appearance, and the first copy of a group is the primary.
 */
export function mergeWorks<T extends DedupeWork>(works: T[]): MergedWork<T>[] {
  const groups = new Map<string, T[]>()
  works.forEach((w, i) => {
    const doi = normalizeDoi(w.doi)
    const title = norm(w.title)
    const key = doi ? `doi:${doi}` : title && w.year ? `t:${title}|${w.year}` : `u:${i}`
    groups.set(key, [...(groups.get(key) ?? []), w])
  })
  return [...groups.values()].map(sources => {
    const primary = sources[0]
    const conflict = sources.some(s => (norm(s.title) && norm(primary.title) && norm(s.title) !== norm(primary.title)) || (s.year && primary.year && s.year !== primary.year))
    const citationsBySource = sources.filter(s => s.citations != null).map(s => ({ source: s.source, count: s.citations as number }))
    return { primary, sources, citationsBySource, conflict }
  })
}
