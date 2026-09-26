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
import { collectionOf, recordHref } from './records'

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
export const SPLIT_THRESHOLD = 20000

/** File names a category is served as: one file, or one per letter when large. */
export function categoryFiles(code: string): string[] {
  const n = getCategoryJournals(code).length
  return n > SPLIT_THRESHOLD ? LETTERS.map(l => `${code}--${l}.json`) : [`${code}.json`]
}
