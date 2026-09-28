// Scopus source title list (Elsevier), reduced by scripts/import-scopus-list.py
// to what the journal pages need: each ISSN's Scopus source ID and its status
// in that list. Shared by the static /data/scopus/<NN>.json shards (server)
// and the IndexChecks component (client), which fetches only the shard for
// the journal's ISSN.

export type ScopusCode = 'a' | 'i' | 'x' | 'p'
/** [source id (null while accepted, not yet added), status, detail] */
export type ScopusEntry = [number | null, ScopusCode, number | string | null]

/** 8-character key: digits and X, no hyphen. */
export function scopusKey(issn: string): string | null {
  const v = issn.replace(/[^0-9Xx]/g, '').toUpperCase()
  return v.length === 8 ? v : null
}

/** Shard name for an ISSN: its first two digits (00-99). */
export const scopusShard = (key: string) => key.slice(0, 2)

export const scopusSourceHref = (id: number) => `https://www.scopus.com/sourceid/${id}`

/** Preference when a journal's ISSNs match different entries. */
export const SCOPUS_RANK: Record<ScopusCode, number> = { a: 0, p: 1, i: 2, x: 3 }
