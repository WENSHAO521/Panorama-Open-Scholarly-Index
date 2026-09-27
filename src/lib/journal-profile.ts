// Journal profiles for /journal/. Built at prebuild by scripts/sync-live-data.mjs
// into /data/j/<shard>.json: every indexed journal, keyed by ISSN-L, with
// aliases for its other ISSNs and its OpenAlex source id.

export interface JournalProfile {
  /** ISSN-L, or the first ISSN */
  k: string
  /** POSI-J id or ISSNL-<issn> */
  pid: string
  /** curated POSI record exists */
  cur?: 1
  t: string
  ab?: string
  alt?: string[]
  pub?: string
  cc?: string
  is: string[]
  hp?: string
  apc?: number
  /** APC as stated on the journal's website, when POSI has verified it (Core Collection), e.g. "USD 450" or "None" */
  apcx?: string
  /** page the verified APC is stated on */
  apcsrc?: string
  oa?: boolean
  dj?: boolean
  /** works, citations, h-index, i10-index */
  w?: number
  c?: number
  h?: number
  i10?: number
  /** first and last publication year */
  y0?: number
  y1?: number
  /** [year, works, citations] ascending */
  cy?: [number, number, number][]
  /** [topic, subfield, field, works] */
  tp?: [string, string | null, string | null, number][]
  soc?: string[]
  /** PSC category and confidence */
  s?: string
  sc?: string
  /** Crossref DOI count */
  cr?: number
  src?: string[]
  oid?: string
  rk?: {
    y: number
    pcs: number | null
    n: number | null
    oq: string | null
    op: number | null
    or: number | null
    os: number | null
    cat: string | null
    cq: string | null
    cp: number | null
    cr: number | null
    cs: number | null
    ex?: string
  }
}

interface Shard { p: Record<string, JournalProfile>; a: Record<string, string> }

/** Keep in step with scripts/sync-live-data.mjs. */
const SHARDS = 1024
export function profileShard(key: string): string {
  let h = 0x811c9dc5
  for (const ch of key.toUpperCase()) { h ^= ch.charCodeAt(0); h = Math.imul(h, 0x01000193) >>> 0 }
  return String(h % SHARDS).padStart(4, '0')
}

export function normalizeKey(raw: string): string {
  const v = raw.trim().toUpperCase()
  const issn = v.replace(/[^0-9X]/g, '')
  if (/^\d{7}[\dX]$/.test(issn)) return `${issn.slice(0, 4)}-${issn.slice(4)}`
  if (/^S\d+$/.test(v)) return v
  return raw.trim()
}

// Shards are shared between callers, so a request is never tied to one
// caller's AbortSignal: aborting one caller must not cancel the others.
const cache = new Map<string, Promise<Shard | null>>()
function loadShard(name: string): Promise<Shard | null> {
  let p = cache.get(name)
  if (!p) {
    p = fetch(`/data/j/${name}.json`)
      .then(r => (r.ok ? r.json() : null))
      .catch(e => { cache.delete(name); throw e })
    cache.set(name, p)
  }
  return p
}

/** Resolves an ISSN (any of the journal's) or an OpenAlex source id to its profile. */
export async function getJournalProfile(raw: string, signal?: AbortSignal): Promise<JournalProfile | null> {
  const key = normalizeKey(raw)
  const shard = await loadShard(profileShard(key))
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
  if (!shard) return null
  if (shard.p[key]) return shard.p[key]
  const target = shard.a[key]
  if (!target) return null
  const home = await loadShard(profileShard(target))
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
  return home?.p[target] ?? null
}

export function journalHref(key: string): string {
  return `/journal/?issn=${encodeURIComponent(key)}`
}

export const PSC_CONFIDENCE_TEXT: Record<string, string> = {
  high: 'Assigned with high confidence',
  verified: 'Verified by a subject editor',
  medium: 'Provisional: fewer than 50 works',
  low: 'Provisional: no single subject dominates',
  multidisciplinary: 'Multidisciplinary journal',
  unclassified: 'Not yet classified',
}
