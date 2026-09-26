// The open-database record model.
//
// Every journal POSI knows about - Core Collection, curated Global
// Benchmark seed, or auto-discovered - is presented as one uniform record
// type with an explicit collection, a provenance verification state, and a
// freshness state. The states follow the provenance discipline of
// scholarly-corpus-builder (references/provenance-schema.md and
// references/refresh-policy.md): identity is only "verified" when a
// persistent identifier was actually checked, nothing is upgraded because
// it merely looks plausible, and staleness is computed from real
// timestamps rather than assumed.
//
// Nothing here computes a score. Scores come from posi-engine via the
// vendored corpus files; this module only classifies and reshapes records
// for display and for the static JSON files under /data/.

import type { Journal } from './types'
import { DATA_CUTOFF } from './release'

// Pure model code only: safe to import from client components. Anything
// that touches the vendored datasets lives in records-data.ts (server only).

export type Collection = 'core' | 'candidate' | 'benchmark' | 'discovered'

export type Verification = 'VERIFIED' | 'PARTIALLY_VERIFIED' | 'NEEDS_CHECK' | 'REJECTED'

export type Freshness = 'CURRENT' | 'AGING' | 'STALE' | 'UNKNOWN'

export const COLLECTIONS: Record<Collection, { label: string; short: string; description: string }> = {
  core: {
    label: 'Core Collection',
    short: 'Core',
    description: 'Admitted through the PQF editorial selection gate. Fully indexed, with article-level metadata and published evidence.',
  },
  candidate: {
    label: 'Core Candidate',
    short: 'Candidate',
    description: 'Previously admitted; a PQF re-review found it below the eligibility bar. Record retained, excluded from Core counts, rankings and badges until re-review.',
  },
  benchmark: {
    label: 'Global Benchmark',
    short: 'Benchmark',
    description: 'External validation corpus used to test POSI methodology against established journals. Never a POSI admission candidate.',
  },
  discovered: {
    label: 'Discovered',
    short: 'Discovered',
    description: 'Found in open registries (DOAJ, Crossref, OpenAlex). POSI holds a record; it has not reviewed or admitted the journal.',
  },
}

export const VERIFICATION: Record<Verification, { label: string; rule: string; color: string; bg: string }> = {
  VERIFIED: {
    label: 'Verified',
    rule: 'Persistent identifiers (ISSN, DOI prefix) checked and publisher evidence reviewed under PQF.',
    color: 'var(--verified)', bg: 'var(--verified-soft)',
  },
  PARTIALLY_VERIFIED: {
    label: 'Partially verified',
    rule: 'ISSN resolved to an OpenAlex source record; journal-level evidence not reviewed by POSI.',
    color: 'var(--partial)', bg: 'var(--partial-soft)',
  },
  NEEDS_CHECK: {
    label: 'Needs check',
    rule: 'Harvested from an open registry and plausible, but not independently confirmed. Do not use for high-confidence claims.',
    color: 'var(--check)', bg: 'var(--check-soft)',
  },
  REJECTED: {
    label: 'Rejected',
    rule: 'Could not be confirmed, or evidence contradicts the registry record. Retained only as an audit trail.',
    color: 'var(--rejected)', bg: 'var(--rejected-soft)',
  },
}

// Journal-profile freshness windows from scholarly-corpus-builder's
// refresh policy: current within 6 months, aging to 12, stale after.
export const FRESHNESS: Record<Freshness, { label: string; rule: string; color: string }> = {
  CURRENT: { label: 'Current', rule: 'Record updated within 6 months of the data cutoff.', color: 'var(--verified)' },
  AGING: { label: 'Aging', rule: 'Record last updated 6-12 months before the data cutoff.', color: 'var(--partial)' },
  STALE: { label: 'Stale', rule: 'Record last updated more than 12 months before the data cutoff. Refresh due.', color: 'var(--check)' },
  UNKNOWN: { label: 'Unknown', rule: 'No reliable update timestamp on the record.', color: 'var(--soft)' },
}

export function collectionOf(j: Journal): Collection {
  if (j.id.startsWith('j-disc-')) return 'discovered'
  if (j.is_external_benchmark) return 'benchmark'
  if (j.collection_status === 'candidate') return 'candidate'
  return 'core'
}

export function verificationOf(j: Journal): Verification {
  const c = collectionOf(j)
  if (c === 'core' || c === 'candidate') return 'VERIFIED'
  if (c === 'benchmark') return j.openalex_source_id && (j.issn_online || j.issn_print) ? 'PARTIALLY_VERIFIED' : 'NEEDS_CHECK'
  return 'NEEDS_CHECK'
}

export function freshnessOf(j: Journal, cutoff = DATA_CUTOFF): Freshness {
  const t = Date.parse(j.updated_at)
  const c = Date.parse(cutoff)
  if (Number.isNaN(t) || Number.isNaN(c)) return 'UNKNOWN'
  const months = (c - t) / (1000 * 60 * 60 * 24 * 30.44)
  if (months <= 6) return 'CURRENT'
  if (months <= 12) return 'AGING'
  return 'STALE'
}

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })

export function countryName(raw: string | null | undefined): string | null {
  if (!raw) return null
  const v = raw.trim()
  if (/^[A-Z]{2}$/.test(v)) {
    try { return regionNames.of(v) ?? v } catch { return v }
  }
  return v
}

/** Compact record used by the browser and by /data/index/*.json. Short keys keep the files small. */
export interface IndexRecord {
  /** POSI-J id, when minted */
  id: string | null
  /** journal_code - the URL key */
  c: string
  /** title */
  t: string
  /** ISSNs (online first) */
  i: string[]
  /** publisher */
  p: string
  /** country (display name) */
  co: string | null
  /** PSC category code */
  s: string | null
  /** collection */
  k: Collection
  /** verification state */
  v: Verification
  /** open access */
  oa: boolean
  /** DOAJ status */
  d: Journal['doaj_status']
  /** article count */
  n: number
  /** updated (YYYY-MM-DD) */
  u: string
}

export function toIndexRecord(j: Journal): IndexRecord {
  return {
    id: j.posi_id ?? null,
    c: j.journal_code,
    t: j.title,
    i: [j.issn_online, j.issn_print].filter((x, idx, a): x is string => !!x && a.indexOf(x) === idx),
    p: j.publisher || '',
    co: countryName(j.registration_country || j.country),
    s: j.psc_category ?? null,
    k: collectionOf(j),
    v: verificationOf(j),
    oa: !!j.open_access,
    d: j.doaj_status ?? null,
    n: j.article_count ?? 0,
    u: (j.updated_at || '').slice(0, 10),
  }
}

export function recordHref(r: { c: string; k: Collection }): string {
  return r.k === 'discovered' ? `/record/?code=${encodeURIComponent(r.c)}` : `/journal/${r.c}/`
}

/** Discovered records are sharded by the first character of journal_code for the static record viewer. */
export function shardOf(code: string): string {
  const ch = code.charAt(0).toLowerCase()
  return /[a-z]/.test(ch) ? ch : '0'
}

export function countBy<T extends string>(rows: { [k: string]: unknown }[], key: string): Record<T, number> {
  const out = {} as Record<T, number>
  for (const r of rows) {
    const v = r[key] as T
    out[v] = (out[v] ?? 0) + 1
  }
  return out
}
