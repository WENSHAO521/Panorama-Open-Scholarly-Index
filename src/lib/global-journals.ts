// The global journal directory: every journal indexed by POSI (Crossref and
// OpenAlex, GLOBAL-INDEX-1.0), organised by PSC subject category.
//
// Source: the global corpus built by posi-engine (scripts/global/), which
// scripts/sync-live-data.mjs downloads before each build into
// src/lib/generated/journals-global.json. When it is not available the
// directory falls back to the curated records this repository carries.
// Server-only (reads files at build time).

import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import psc from './psc-v1.0.snapshot.json'
import { getAllRecords } from './records-data'
import { collectionOf, countryName, recordHref } from './records'
import { STATIC_PUBLISHER_PAGES, publisherKey, slugify, type PublisherDetail, type PublisherRow } from './publishers'

/** Compact directory record. Short keys keep the per-category files small. */
export interface DirRecord {
  /** key: POSI-J id or ISSNL-<issn> */
  id: string
  /** title */
  t: string
  /** publisher */
  p: string | null
  /** ISSNs, ISSN-L first */
  i: string[]
  /** country code or name */
  co: string | null
  /** open access */
  oa: boolean | null
  /** in DOAJ */
  dj: boolean | null
  /** works (OpenAlex) or DOIs (Crossref) */
  w: number | null
  /** PSC category, null when unclassified */
  s: string | null
  /** true for the Core Collection */
  core: boolean
  /** link to the journal page */
  h: string
}

export interface DirCategory { code: string; name: string; domain: string; domainName: string; count: number; core: number; oa: number }

interface GlobalCorpusRecord {
  posi_id: string
  curated: boolean
  title: string | null
  publisher: string | null
  issns: string[]
  issn_l: string | null
  openalex_source_id: string | null
  country: string | null
  open_access: boolean | null
  in_doaj: boolean | null
  works_count: number | null
  crossref_total_dois: number | null
  psc_category: string | null
  psc_confidence?: string | null
}

export const UNCLASSIFIED = 'unclassified'
/** General journals whose output spans several domains (PSC-CROSSWALK-0.3). Not ranked by subject. */
export const MULTIDISCIPLINARY = 'multidisciplinary'

const PSC = psc.categories as { code: string; name: string; level: number; parent: string | null }[]
const PSC_NAME: Record<string, string> = Object.fromEntries(PSC.map(c => [c.code, c.name]))

function loadGlobal(): GlobalCorpusRecord[] | null {
  const file = join(process.cwd(), 'src/lib/generated/journals-global.json')
  if (!existsSync(file)) return null
  try { return JSON.parse(readFileSync(file, 'utf-8')) } catch { return null }
}

let cache: { records: DirRecord[]; source: 'global' | 'curated' } | null = null

export function getDirectory() {
  if (cache) return cache
  // Curated records decide tier and link targets.
  const curated = new Map(getAllRecords().map(j => [j.posi_id ?? j.id, j]))
  const global = loadGlobal()

  let records: DirRecord[]
  if (global) {
    records = global.map(g => {
      const c = curated.get(g.posi_id)
      const k = c ? collectionOf(c) : null
      const href = c
        ? recordHref({ c: c.journal_code, k: k! })
        : `/journal/?issn=${g.issn_l ?? g.issns[0]}`
      return {
        id: g.posi_id,
        t: g.title ?? c?.title ?? g.issns[0],
        p: g.publisher ?? c?.publisher ?? null,
        i: g.issns,
        co: g.country ?? null,
        oa: g.open_access,
        dj: g.in_doaj,
        w: g.works_count ?? g.crossref_total_dois ?? null,
        s: g.psc_confidence === 'multidisciplinary' ? MULTIDISCIPLINARY : g.psc_category ?? c?.psc_category ?? null,
        core: k === 'core',
        h: href,
      }
    })
  } else {
    records = [...curated.values()].map(c => ({
      id: c.posi_id ?? c.id,
      t: c.title,
      p: c.publisher || null,
      i: [c.issn_online, c.issn_print].filter((x): x is string => !!x),
      co: c.registration_country || c.country || null,
      oa: c.open_access,
      dj: c.doaj_status === 'listed',
      w: c.article_count ?? null,
      s: c.psc_category ?? null,
      core: collectionOf(c) === 'core',
      h: recordHref({ c: c.journal_code, k: collectionOf(c) }),
    }))
  }
  records.sort((a, b) => a.t.localeCompare(b.t, 'en', { sensitivity: 'base' }))
  cache = { records, source: global ? 'global' : 'curated' }
  return cache
}

export function getDirectoryCategories(): DirCategory[] {
  const { records } = getDirectory()
  const counts = new Map<string, { n: number; core: number; oa: number }>()
  for (const r of records) {
    const k = r.s && (PSC_NAME[r.s] || r.s === MULTIDISCIPLINARY) ? r.s : UNCLASSIFIED
    const c = counts.get(k) ?? { n: 0, core: 0, oa: 0 }
    c.n++; if (r.core) c.core++; if (r.oa) c.oa++
    counts.set(k, c)
  }
  const multi = counts.get(MULTIDISCIPLINARY)
  const cats: DirCategory[] = multi
    ? [{ code: MULTIDISCIPLINARY, name: 'Multidisciplinary', domain: 'P0', domainName: 'General', count: multi.n, core: multi.core, oa: multi.oa }]
    : []
  cats.push(...PSC.filter(c => c.level === 2).map(c => ({
    code: c.code, name: c.name, domain: c.parent!, domainName: PSC_NAME[c.parent!] ?? c.parent!,
    count: counts.get(c.code)?.n ?? 0, core: counts.get(c.code)?.core ?? 0, oa: counts.get(c.code)?.oa ?? 0,
  })))
  const un = counts.get(UNCLASSIFIED)
  if (un) cats.push({ code: UNCLASSIFIED, name: 'Not yet classified', domain: 'X', domainName: 'Other', count: un.n, core: un.core, oa: un.oa })
  return cats
}

export function getCategoryJournals(code: string): DirRecord[] {
  const { records } = getDirectory()
  return code === UNCLASSIFIED
    ? records.filter(r => !r.s || (!PSC_NAME[r.s] && r.s !== MULTIDISCIPLINARY))
    : records.filter(r => r.s === code)
}

export function categoryLabel(code: string): string {
  if (code === MULTIDISCIPLINARY) return 'Multidisciplinary'
  return code === UNCLASSIFIED ? 'Not yet classified' : PSC_NAME[code] ?? code
}

/** First letter bucket for splitting very large groups: a-z, or 0 for anything else. */
export function letterOf(title: string): string {
  const ch = title.normalize('NFKD').replace(/[^A-Za-z0-9]/g, '').charAt(0).toLowerCase()
  return /[a-z]/.test(ch) ? ch : '0'
}
export const LETTERS = [...'abcdefghijklmnopqrstuvwxyz', '0']

/** Groups above this size are served as per-letter files. */
/** A category larger than this is served as per-letter parts, keeping each
 *  file the subject pages load under about 1 MiB. */
export const SPLIT_THRESHOLD = 4000

/** File names a category is served as: one file, or one per letter when large. */
export function categoryFiles(code: string): string[] {
  const n = getCategoryJournals(code).length
  return n > SPLIT_THRESHOLD ? LETTERS.map(l => `${code}--${l}.json`) : [`${code}.json`]
}

/** Publishers aggregated from the directory, largest first. Journals without a publisher are left out. */
function buildPublishers(): PublisherDetail[] {
  const groups = new Map<string, DirRecord[]>()
  for (const r of getDirectory().records) {
    const name = r.p?.replace(/\s+/g, ' ').trim()
    if (!name) continue
    const g = groups.get(name)
    if (g) g.push(r)
    else groups.set(name, [r])
  }

  const byCount = (a: [string, number], b: [string, number]) => b[1] - a[1] || a[0].localeCompare(b[0])
  const out: PublisherDetail[] = [...groups].map(([name, rs]) => {
    const countries = new Map<string, number>()
    const subjects = new Map<string, number>()
    let core = 0, oa = 0, doaj = 0, works = 0
    for (const r of rs) {
      if (r.core) core++
      if (r.oa) oa++
      if (r.dj) doaj++
      works += r.w ?? 0
      const co = countryName(r.co)
      if (co) countries.set(co, (countries.get(co) ?? 0) + 1)
      if (r.s && (PSC_NAME[r.s] || r.s === MULTIDISCIPLINARY)) subjects.set(r.s, (subjects.get(r.s) ?? 0) + 1)
    }
    return {
      name, slug: '', n: rs.length, core, oa, doaj, works, page: false,
      countries: [...countries].sort(byCount),
      subjects: [...subjects].sort(byCount),
      variants: [],
      journals: rs
        .map(r => ({ t: r.t, i: r.i[0] ?? null, co: countryName(r.co), oa: r.oa, dj: r.dj, w: r.w, s: r.s, core: r.core, h: r.h }))
        .sort((a, b) => (b.w ?? 0) - (a.w ?? 0) || a.t.localeCompare(b.t)),
    }
  })
  out.sort((a, b) => b.n - a.n || b.works - a.works || a.name.localeCompare(b.name))

  // Slugs are assigned in that order, so the larger publisher keeps the plain slug on a collision.
  const taken = new Set<string>()
  out.forEach((p, idx) => {
    const base = slugify(p.name)
    let slug = base
    for (let i = 2; taken.has(slug); i++) slug = `${base}-${i}`
    taken.add(slug)
    p.slug = slug
    p.page = idx < STATIC_PUBLISHER_PAGES
  })

  const byKey = new Map<string, PublisherDetail[]>()
  for (const p of out) {
    const k = publisherKey(p.name)
    const g = byKey.get(k)
    if (g) g.push(p)
    else byKey.set(k, [p])
  }
  for (const p of out) {
    const g = byKey.get(publisherKey(p.name))!
    if (g.length > 1) p.variants = g.filter(v => v !== p).slice(0, 20).map(v => ({ name: v.name, slug: v.slug, n: v.n, page: v.page }))
  }
  return out
}

let publishers: PublisherDetail[] | null = null

export function getPublisherDetails(): PublisherDetail[] {
  return publishers ??= buildPublishers()
}

/** Summary rows, largest first (the /data/meta/publishers.json file). */
export function getPublishers(): PublisherRow[] {
  return getPublisherDetails().map(({ name, slug, n, core, oa, doaj, works, page }) => ({ name, slug, n, core, oa, doaj, works, page }))
}

export function findPublisher(slug: string): PublisherDetail | undefined {
  return getPublisherDetails().find(p => p.slug === slug)
}
