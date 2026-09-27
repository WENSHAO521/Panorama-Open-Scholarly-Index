// Server-only access to the vendored datasets, in the record model's terms.
// Never import this from a client component: it pulls in every record.
import type { Journal } from './types'
import { ALL_JOURNALS, DISCOVERED_JOURNALS, getCoreCollection, getCandidateJournals } from './data'
import { BENCHMARK_JOURNALS } from './benchmark-journals'
import { collectionOf, countryName, toIndexRecord } from './records'
import { slugify, publisherKey, type PublisherDetail, type PublisherRow } from './publishers'

export type { PublisherRow, PublisherDetail }

/** Journals that get a statically generated record page (Core, Candidate, Benchmark). */
export function getStaticRecordJournals(): Journal[] {
  return [...getCoreCollection(), ...getCandidateJournals(), ...BENCHMARK_JOURNALS]
}

/** Every record, any collection. */
export function getAllRecords(): Journal[] {
  const seen = new Set<string>()
  const out: Journal[] = []
  for (const j of [...getStaticRecordJournals(), ...DISCOVERED_JOURNALS]) {
    if (seen.has(j.id)) continue
    seen.add(j.id)
    out.push(j)
  }
  return out
}

export function findRecord(code: string): Journal | undefined {
  return ALL_JOURNALS.find(j => j.journal_code === code) ?? BENCHMARK_JOURNALS.find(j => j.journal_code === code)
}


/** Publishers aggregated from every record, with their journals. Records without a publisher are left out. */
function buildPublishers(): PublisherDetail[] {
  const groups = new Map<string, Journal[]>()
  for (const j of getAllRecords()) {
    const name = (j.publisher || '').trim()
    if (!name) continue
    const g = groups.get(name)
    if (g) g.push(j)
    else groups.set(name, [j])
  }

  const out: PublisherDetail[] = [...groups].map(([name, js]) => {
    const r: PublisherDetail = {
      name, slug: '', n: js.length, core: 0, benchmark: 0, discovered: 0, oa: 0, doaj: 0, articles: 0,
      countries: [], subjects: [], first_seen: null, last_updated: null, variants: [], journals: [],
    }
    const countries = new Map<string, number>()
    const subjects = new Map<string, number>()
    for (const j of js) {
      const k = collectionOf(j)
      if (k === 'core' || k === 'candidate') r.core++
      else if (k === 'benchmark') r.benchmark++
      else r.discovered++
      if (j.open_access) r.oa++
      if (j.doaj_status === 'listed') r.doaj++
      r.articles += j.article_count || 0
      const co = countryName(j.registration_country || j.country)
      if (co) countries.set(co, (countries.get(co) ?? 0) + 1)
      if (j.psc_category) subjects.set(j.psc_category, (subjects.get(j.psc_category) ?? 0) + 1)
      const created = j.created_at?.slice(0, 10)
      const updated = j.updated_at?.slice(0, 10)
      if (created && (!r.first_seen || created < r.first_seen)) r.first_seen = created
      if (updated && (!r.last_updated || updated > r.last_updated)) r.last_updated = updated
    }
    const byCount = (a: [string, number], b: [string, number]) => b[1] - a[1] || a[0].localeCompare(b[0])
    r.countries = [...countries].sort(byCount)
    r.subjects = [...subjects].sort(byCount)
    r.journals = js.map(toIndexRecord).map(({ c, t, i, co, k, oa, d, n, u }) => ({ c, t, i, co, k, oa, d, n, u })).sort((a, b) => a.t.localeCompare(b.t, 'en', { sensitivity: 'base' }))
    return r
  })
  out.sort((a, b) => b.n - a.n || a.name.localeCompare(b.name))

  // Slugs are assigned in that order, so the larger publisher keeps the plain slug on a collision.
  const taken = new Set<string>()
  for (const p of out) {
    const base = slugify(p.name)
    let slug = base
    for (let i = 2; taken.has(slug); i++) slug = `${base}-${i}`
    taken.add(slug)
    p.slug = slug
  }

  const byKey = new Map<string, PublisherDetail[]>()
  for (const p of out) {
    const k = publisherKey(p.name)
    byKey.set(k, [...(byKey.get(k) ?? []), p])
  }
  for (const p of out) {
    p.variants = (byKey.get(publisherKey(p.name)) ?? [])
      .filter(v => v !== p)
      .map(v => ({ name: v.name, slug: v.slug, n: v.n }))
  }
  return out
}

let publishersCache: PublisherDetail[] | null = null

export function getPublisherDetails(): PublisherDetail[] {
  return publishersCache ??= buildPublishers()
}

/** Summary rows, most journals first (the /data/meta/publishers.json file). */
export function getPublishers(): PublisherRow[] {
  return getPublisherDetails().map(p => ({
    name: p.name, slug: p.slug, n: p.n, core: p.core, benchmark: p.benchmark, discovered: p.discovered,
    oa: p.oa, doaj: p.doaj, articles: p.articles,
  }))
}

export function findPublisher(slug: string): PublisherDetail | undefined {
  return getPublisherDetails().find(p => p.slug === slug)
}
