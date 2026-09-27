// The publisher model: pure code, safe to import from client components.
// Aggregation over the vendored datasets lives in records-data.ts.
//
// Publishers are keyed by the name as registered on each record; names are
// not merged across spellings. Every publisher gets a stable URL slug. The
// larger publishers get a statically generated page at /publishers/<slug>/;
// the long tail (thousands of single-journal publishers) is served by the
// in-browser viewer at /publisher/?id=<slug>, reading a shard under
// /data/publishers/, to stay inside Cloudflare Pages' 20,000-file limit.

import type { IndexRecord } from './records'

export interface PublisherRow {
  /** publisher name as registered */
  name: string
  /** URL key, unique across publishers */
  slug: string
  /** journals in POSI */
  n: number
  core: number
  benchmark: number
  discovered: number
  /** open-access journals */
  oa: number
  /** DOAJ-listed journals */
  doaj: number
  /** registered articles across its journals */
  articles: number
}

export interface PublisherDetail extends PublisherRow {
  /** countries of registration, most journals first: [display name, journals] */
  countries: [string, number][]
  /** PSC subject categories, most journals first: [code, journals]; unclassified journals are left out */
  subjects: [string, number][]
  /** earliest record creation and latest record update across its journals (YYYY-MM-DD) */
  first_seen: string | null
  last_updated: string | null
  /** other registered names that normalise to the same publisher */
  variants: { name: string; slug: string; n: number }[]
  /** its journals, title order */
  journals: PublisherJournal[]
}

/** A journal row on a publisher page: the index record without the fields the page already knows. */
export type PublisherJournal = Pick<IndexRecord, 'c' | 't' | 'i' | 'co' | 'k' | 'oa' | 'd' | 'n' | 'u'>

/** Publishers with at least this many journals get a static page. */
export const STATIC_PUBLISHER_MIN = 5

export function slugify(name: string): string {
  const s = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '')
  return s || 'publisher'
}

/** Key used to group spelling variants: legal-form suffixes and punctuation removed. */
export function publisherKey(name: string): string {
  return slugify(name)
    .split('-')
    .filter(w => !LEGAL_FORMS.has(w))
    .join('-')
}
const LEGAL_FORMS = new Set(['the', 'bv', 'b-v', 'sa', 's-a', 'ltd', 'limited', 'inc', 'llc', 'gmbh', 'ag', 'co', 'kg', 'plc', 'srl', 'spa', 'pvt', 'private', 'corp', 'corporation', 'company'])

export function publisherHref(p: { slug: string; n: number }): string {
  return p.n >= STATIC_PUBLISHER_MIN ? `/publishers/${p.slug}/` : `/publisher/?id=${encodeURIComponent(p.slug)}`
}

/** Publisher details are sharded by the first character of the slug. */
export function publisherShardOf(slug: string): string {
  const ch = slug.charAt(0)
  return /[a-z]/.test(ch) ? ch : '0'
}
export const PUBLISHER_SHARDS = [...'0abcdefghijklmnopqrstuvwxyz']

export function publisherJsonHref(slug: string): string {
  return `/data/publishers/${publisherShardOf(slug)}.json`
}
