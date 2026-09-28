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

export type Collection = 'core' | 'curated' | 'benchmark' | 'discovered'

export type Verification = 'VERIFIED' | 'PARTIALLY_VERIFIED' | 'NEEDS_CHECK' | 'REJECTED'

export type Freshness = 'CURRENT' | 'AGING' | 'STALE' | 'UNKNOWN'

// Two public tiers.
//
//   Indexed   Every journal with DOIs registered at Crossref or a source
//             record in OpenAlex. Nothing to apply for; coverage is automatic.
//   Core      Journals that applied for certification and passed the PQF
//             editorial evaluation. Only Core journals carry the Core mark and are
//             certified.
//
// The internal collection keys (core / curated / benchmark / discovered)
// stay as they are in the data files; they only say where a curated record
// came from. A journal with no curated record at all is still indexed and is
// served as journal profiles at /journal/.
export type Tier = 'core' | 'indexed'

export function tierOf(k: Collection): Tier {
  return k === 'core' ? 'core' : 'indexed'
}

export const TIERS: Record<Tier, { label: string; short: string; description: string }> = {
  core: {
    label: 'Core Collection',
    short: 'Core',
    description: 'Certified. The journal applied for certification and passed the PQF editorial evaluation. Core journals may display the POSI Core Collection mark; they are ranked under the same citation rules as every journal.',
  },
  indexed: {
    label: 'Indexed',
    short: 'Indexed',
    description: 'Indexed from Crossref and OpenAlex. Not certified by POSI. The journal can apply for certification to enter the Core Collection.',
  },
}

/** Where a curated record came from. Secondary detail under the tier. */
export const COLLECTIONS: Record<Collection, { label: string; short: string; description: string }> = {
  core: {
    label: 'Core Collection',
    short: 'Core',
    description: TIERS.core.description,
  },
  curated: {
    label: 'Indexed, curated record',
    short: 'Indexed',
    description: 'Indexed. POSI holds a curated record with a permanent POSI-J id. Not certified: not in the Core Collection.',
  },
  benchmark: {
    label: 'Indexed, benchmark set',
    short: 'Indexed',
    description: 'Indexed. Also in the Global Benchmark reference set that POSI uses to validate its methodology.',
  },
  discovered: {
    label: 'Indexed, curated record',
    short: 'Indexed',
    description: 'Indexed. POSI holds a curated record with a permanent POSI-J id, built from DOAJ, Crossref and OpenAlex.',
  },
}

/** Journals indexed from Crossref/OpenAlex without a curated POSI record. */
export const REGISTRY_TIER = {
  label: 'Indexed',
  description: 'Indexed from Crossref and OpenAlex registry data. POSI holds no curated record yet and has not certified this journal.',
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
  if (j.collection_status && j.collection_status !== 'core') return 'curated'
  return 'core'
}

export function verificationOf(j: Journal): Verification {
  const c = collectionOf(j)
  if (c === 'core' || c === 'curated') return 'VERIFIED'
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
/** Shards of the Discovered records, by a hash of the record key: 64 files of
 *  a few hundred KB, so the /record/ viewer loads little to show one record
 *  (by first letter, the "i" group alone passed 20 MiB). */
export const RECORD_SHARDS = 64

export function shardOf(code: string): string {
  let h = 0x811c9dc5
  for (const c of code.toLowerCase()) { h ^= c.charCodeAt(0); h = Math.imul(h, 0x01000193) >>> 0 }
  return String(h % RECORD_SHARDS).padStart(2, '0')
}

export function countBy<T extends string>(rows: { [k: string]: unknown }[], key: string): Record<T, number> {
  const out = {} as Record<T, number>
  for (const r of rows) {
    const v = r[key] as T
    out[v] = (out[v] ?? 0) + 1
  }
  return out
}
