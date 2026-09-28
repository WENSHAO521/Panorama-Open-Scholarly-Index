// The publisher model: pure code, safe to import from client components.
// Aggregation lives in global-journals.ts (server only).
//
// Publishers are aggregated from the global journal directory (every
// Crossref and OpenAlex journal, GLOBAL-INDEX-1.0), keyed by the publisher
// name as registered on each journal; names are not merged across
// spellings. Every publisher gets a stable URL slug. The largest publishers
// get a statically generated page at /publishers/<slug>/; the long tail
// (tens of thousands of publishers) is served by the in-browser viewer at
// /publisher/?id=<slug>, reading a hashed shard under /data/publishers/, to
// stay inside Cloudflare Pages' 20,000-file limit.

import { dataUrl } from './data-base'

export interface PublisherRow {
  /** publisher name as registered */
  name: string
  /** URL key, unique across publishers */
  slug: string
  /** journals indexed */
  n: number
  /** journals in the Core Collection */
  core: number
  /** open-access journals */
  oa: number
  /** journals in DOAJ */
  doaj: number
  /** works across its journals (OpenAlex works, or Crossref DOIs) */
  works: number
  /** has a static page at /publishers/<slug>/ */
  page: boolean
}

/** A journal on a publisher page. Short keys keep the shard files small. */
export interface PublisherJournal {
  /** title */
  t: string
  /** ISSN-L or first ISSN */
  i: string | null
  /** country (display name) */
  co: string | null
  oa: boolean | null
  dj: boolean | null
  /** works */
  w: number | null
  /** PSC category */
  s: string | null
  core: boolean
  /** link to the journal page */
  h: string
}

export interface PublisherDetail extends PublisherRow {
  /** countries, most journals first: [display name, journals] */
  countries: [string, number][]
  /** PSC subject categories, most journals first: [code, journals]; unclassified journals are left out */
  subjects: [string, number][]
  /** other registered names that normalise to the same publisher */
  variants: { name: string; slug: string; n: number; page: boolean }[]
  /** its journals, most works first */
  journals: PublisherJournal[]
}

/** How many publishers (largest first) get a static page. */
export const STATIC_PUBLISHER_PAGES = 500

export function slugify(name: string): string {
  const s = name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
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

export function publisherHref(p: { slug: string; page: boolean }): string {
  return p.page ? `/publishers/${p.slug}/` : `/publisher/?id=${encodeURIComponent(p.slug)}`
}

/** Publisher details are served in hashed shards so no one file gets large. */
export const PUBLISHER_SHARD_COUNT = 256

export function publisherShardOf(slug: string): string {
  let h = 0x811c9dc5
  for (const ch of slug) { h ^= ch.charCodeAt(0); h = Math.imul(h, 0x01000193) >>> 0 }
  return (h % PUBLISHER_SHARD_COUNT).toString(16).padStart(2, '0')
}

export const PUBLISHER_SHARDS = Array.from({ length: PUBLISHER_SHARD_COUNT }, (_, i) => i.toString(16).padStart(2, '0'))

export function publisherJsonHref(slug: string): string {
  return dataUrl(`publishers/${publisherShardOf(slug)}.json`)
}
