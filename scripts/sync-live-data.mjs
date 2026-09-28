#!/usr/bin/env node
/**
 * sync-live-data.mjs — runs before every build (npm "prebuild").
 *
 * Downloads the current published data into src/lib/generated/ (not
 * committed), so the site reflects the latest edition on every build with no
 * manual step:
 *
 *   citation-ranking.json the POSI Citation Ranking edition (POSI-EVAL-1.0: PNCI-1.0,
 *                         CITATION-RANK-1.0, POSI-ZONES-2.0), from the data layer
 *                         (data.posi.panorama-sg.com -> current.json -> manifest ->
 *                         collections/citation-ranking.json.gz)
 *   pcs-q.json            the PCS edition, for PCS values only (collections/pcs-q.json.gz,
 *                         or pcs-q.json in older snapshots); its PCS-Q quartiles are retired
 *   journals-global.json  the global journal corpus (every Crossref and
 *                         OpenAlex journal), from the newest posi-engine release
 *                         tagged journals-* (monthly directory refresh) or
 *                         global-index-* (yearly ranking), asset global-corpus.json.gz
 *   public/data/j/*.json  journal profiles for /journal/, in 1024 hashed shards,
 *                         built from the corpus, the OpenAlex profiles asset
 *                         (openalex-profiles.jsonl.gz), the Citation Ranking edition
 *                         and PCS
 *
 * The ranking falls back to the committed src/lib/citation-ranking.json and
 * PCS to src/lib/pcs-q.json. The journal directory, profiles and title index
 * need the global corpus: every download is retried, and the release is
 * found through the GitHub API (authenticated with GITHUB_TOKEN when set) or,
 * if the API refuses (its unauthenticated limit is 60 requests an hour per
 * IP, shared on build machines), through the releases/latest/download link.
 * Locally they fall back to the curated records. On Cloudflare Pages
 * (CF_PAGES=1) a build without them fails instead, so the last good
 * deployment stays live rather than one with ~25k of ~158k journals and no
 * search; POSI_ALLOW_PARTIAL_DATA=1 overrides that.
 * POSI_GLOBAL_CORPUS=<path> and POSI_OPENALEX_PROFILES=<path> use local files
 * instead (development). --rankings-only syncs the ranking edition alone (the
 * scheduled data sync, which only needs that and runs every few hours).
 */
import { mkdirSync, writeFileSync, existsSync, readFileSync, copyFileSync, rmSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { gunzipSync } from 'zlib'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const GEN = join(ROOT, 'src/lib/generated')
const DATA = 'https://data.posi.panorama-sg.com'
const RELEASES = 'https://api.github.com/repos/WENSHAO521/posi-engine/releases?per_page=30'
const RELEASE_DOWNLOADS = 'https://github.com/WENSHAO521/posi-engine/releases'

mkdirSync(GEN, { recursive: true })

/** Keep in step with src/lib/journal-profile.ts. */
const SHARDS = 1024
function shardOf(key) {
  let h = 0x811c9dc5
  for (const ch of String(key).toUpperCase()) { h ^= ch.charCodeAt(0); h = Math.imul(h, 0x01000193) >>> 0 }
  return String(h % SHARDS).padStart(4, '0')
}

async function getOnce(url, as) {
  const headers = { 'User-Agent': 'posi-site-build' }
  if (url.startsWith('https://api.github.com/') && process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  const res = await fetch(url, { signal: AbortSignal.timeout(180_000), headers })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return as === 'json' ? res.json() : Buffer.from(await res.arrayBuffer())
}

/** Fetch with up to three attempts; a 404 is final, not retried. */
async function get(url, as = 'json', tries = 3) {
  for (let i = 1; ; i++) {
    try { return await getOnce(url, as) } catch (e) {
      if (i >= tries || /^404 /.test(e.message)) throw e
      console.warn(`sync-live-data: ${e.message}; retry ${i} of ${tries - 1}`)
      await new Promise(r => setTimeout(r, 3000 * i))
    }
  }
}

// Only the fields the site uses, to keep build memory and page data small.
function slim(corpus) {
  return corpus.map(r => ({
    posi_id: r.posi_id, curated: !!r.curated, title: titlesOf(r.posi_id, r.title, r.alternate_titles).title, publisher: r.publisher,
    issns: r.issns ?? [], issn_l: r.issn_l ?? null, openalex_source_id: r.openalex_source_id ?? null,
    country: r.country ?? null, open_access: r.open_access ?? null, in_doaj: r.in_doaj ?? null,
    works_count: r.works_count ?? null, crossref_total_dois: r.crossref_total_dois ?? null,
    psc_category: r.psc_category ?? null, psc_confidence: r.psc_confidence ?? null,
  }))
}

/** Keep in step with src/lib/journal-search.ts. */
const STOP_WORDS = new Set('journal journals international of and the for in on de la y e des du und der revista research da di del el et les en al'.split(' '))
// Latin words of 2+ letters, and each Chinese character on its own (Chinese
// titles have no spaces between words).
function titleWords(t) {
  return (t.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().match(/[a-z0-9]+|\p{Script=Han}/gu) ?? [])
    .filter(w => (w.length >= 2 || /\p{Script=Han}/u.test(w)) && !STOP_WORDS.has(w))
}
// Index file a word lives in: its first two letters, or one of 64 buckets
// for Chinese characters.
function prefixOf(w) {
  return /\p{Script=Han}/u.test(w) ? `zh${w.codePointAt(0) % 64}` : w.slice(0, 2)
}

/** Registry titles occasionally carry control characters. */
const clean = t => t?.replace(/[\u0000-\u001f\u007f-\u009f]/g, '').trim() || null

// Core Collection titles are checked against the ISSN Portal and win over the
// title Crossref / OpenAlex carry, which can lag a rename. The registry title
// and any alternate_titles stay searchable as "also known as".
const CURATED = new Map(JSON.parse(readFileSync(join(ROOT, 'src/lib/core-collection.json'), 'utf-8'))
  .filter(j => j.posi_id).map(j => [j.posi_id, j]))
function titlesOf(posiId, registryTitle, more = []) {
  const c = CURATED.get(posiId)
  const title = clean(c?.title) ?? clean(registryTitle)
  // one entry per title that differs only in punctuation or case
  const seen = new Set([titleKey(title)])
  // an alternate title is a string or { title, type, lang?, until? }
  const alt = [...(c?.alternate_titles ?? []), registryTitle, ...more].map(a => clean(typeof a === 'string' ? a : a?.title))
    .filter(t => t && !seen.has(titleKey(t)) && seen.add(titleKey(t)))
  return { title, alt }
}
function titleKey(t) {
  return t?.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
}

// AJR Rating by posi_id for curated journals: [rating, model, score, rating status]. The
// rating is the one stored with the record (AJR-RATING-1.0) or, for records
// synced before it, derived from the score by the same table as
// src/lib/evaluation/rules.ts getAJRRating(); the build's invariant check
// fails if the two ever disagree.
const AJR_SCALE = [['A+', 90], ['A', 85], ['A−', 80], ['B+', 75], ['B', 70], ['B−', 65], ['C+', 60], ['C', 50], ['D', 0]]
function ajrRatings() {
  const out = new Map()
  for (const j of CURATED.values()) {
    const r = j.early_stage_rating
    if (!r || r.version !== 'AJR-E-1.1' || !['official', 'provisional'].includes(r.rating_status) || r.lifecycle_stage === 'mature' || r.total == null) continue
    const rating = r.rating ?? AJR_SCALE.find(([, min]) => r.total >= min)?.[0]
    out.set(j.posi_id, [rating, 'AJR-E', r.total, r.rating_status])
  }
  return out
}

// 1. Editions: the Citation Ranking (the ranking) and PCS (values only).
let current = null
try { current = await get(`${DATA}/current.json`) } catch (e) { console.warn(`sync-live-data: data layer unavailable (${e.message})`) }
const snapshotDir = current ? current.manifest.replace(/manifest\.json$/, '') : null

{
  const out = join(GEN, 'citation-ranking.json')
  try {
    if (!snapshotDir) throw new Error('no current snapshot')
    const edition = JSON.parse(gunzipSync(await get(`${DATA}${snapshotDir}collections/citation-ranking.json.gz`, 'buffer')).toString('utf-8'))
    if (!Array.isArray(edition.records) || !edition.records.length) throw new Error('edition has no records')
    for (const r of edition.records) if (CURATED.has(r.journal_id)) r.title = titlesOf(r.journal_id, r.title).title
    writeFileSync(out, JSON.stringify(edition))
    console.log(`sync-live-data: citation ranking ${edition.ranking_methodology_version} ${edition.pnci_model_version} snapshot ${edition.snapshot_date}, ${edition.records.length} journals`)
  } catch (e) {
    if (!existsSync(out)) copyFileSync(join(ROOT, 'src/lib/citation-ranking.json'), out)
    console.warn(`sync-live-data: citation ranking uses the committed edition (${e.message})`)
  }
}

{
  const out = join(GEN, 'pcs-q.json')
  try {
    if (!snapshotDir) throw new Error('no current snapshot')
    // Published gzipped since the global edition (~90 MB as JSON); older
    // snapshots carry plain pcs-q.json.
    let edition
    try {
      edition = JSON.parse(gunzipSync(await get(`${DATA}${snapshotDir}collections/pcs-q.json.gz`, 'buffer')).toString('utf-8'))
    } catch (e) {
      if (!/^404 /.test(e.message)) throw e
      edition = await get(`${DATA}${snapshotDir}collections/pcs-q.json`)
    }
    if (!Array.isArray(edition.records) || !edition.records.length) throw new Error('edition has no records')
    // Only what the site reads: PCS values and identity. The PCS-Q rank,
    // percentile and quartile fields are retired (POSI-EVAL-1.0).
    edition.records = edition.records.map(r => ({
      journal_id: r.journal_id, metric_year: r.metric_year, pcs: r.pcs, pcs_eligible_items: r.pcs_eligible_items,
      title: CURATED.has(r.journal_id) ? titlesOf(r.journal_id, r.title).title : r.title, publisher: r.publisher ?? null, issn: r.issn ?? [],
    }))
    writeFileSync(out, JSON.stringify(edition))
    console.log(`sync-live-data: PCS ${edition.methodology_version} ${edition.metric_year}, ${edition.records.length} journals`)
  } catch (e) {
    if (!existsSync(out)) copyFileSync(join(ROOT, 'src/lib/pcs-q.json'), out)
    console.warn(`sync-live-data: PCS uses the committed edition (${e.message})`)
  }
}

const RANKINGS_ONLY = process.argv.includes('--rankings-only')

// 2. Global journal directory
let corpus = null
// Where the release assets are downloaded from: the newest global-index-*
// release by tag, or the latest release when the API cannot be reached.
let assetBase = null
const missing = []
if (!RANKINGS_ONLY) {
  const out = join(GEN, 'journals-global.json')
  try {
    if (process.env.POSI_GLOBAL_CORPUS) {
      corpus = JSON.parse(readFileSync(process.env.POSI_GLOBAL_CORPUS, 'utf-8'))
    } else {
      try {
        const releases = await get(RELEASES)
        // Newest first: the monthly journals-<YYYY-MM> directory refresh or
        // the yearly global-index-<cycle> ranking release, whichever is newer.
        const rel = releases.find(r => /^(journals|global-index)-/.test(r.tag_name ?? '') && !r.draft)
        if (!rel) throw new Error('no journals-* or global-index-* release yet')
        assetBase = `${RELEASE_DOWNLOADS}/download/${rel.tag_name}`
      } catch (e) {
        assetBase = `${RELEASE_DOWNLOADS}/latest/download`
        console.warn(`sync-live-data: release lookup failed (${e.message}); using the latest release`)
      }
      corpus = JSON.parse(gunzipSync(await get(`${assetBase}/global-corpus.json.gz`, 'buffer')).toString('utf-8'))
    }
    writeFileSync(out, JSON.stringify(slim(corpus)))
    console.log(`sync-live-data: journal directory, ${corpus.length} journals`)
  } catch (e) {
    console.warn(`sync-live-data: journal directory uses curated records only (${e.message})`)
    missing.push('journal directory')
  }
}

// 3. Journal profiles
if (!RANKINGS_ONLY) {
  const dir = join(ROOT, 'public/data/j')
  try {
    if (!corpus) throw new Error('no corpus')
    let lines
    if (process.env.POSI_OPENALEX_PROFILES) {
      lines = readFileSync(process.env.POSI_OPENALEX_PROFILES, 'utf-8')
    } else {
      if (!assetBase) throw new Error('no release to download profiles from')
      lines = gunzipSync(await get(`${assetBase}/openalex-profiles.jsonl.gz`, 'buffer')).toString('utf-8')
    }
    const oa = new Map()
    for (const l of lines.split('\n')) { if (l) { const p = JSON.parse(l); oa.set(p.id, p) } }
    lines = null

    // APCs POSI has verified on the journal's own website (Core Collection records).
    const verifiedApc = new Map([...CURATED.values()].filter(j => j.apc).map(j => [j.posi_id, j.apc]))

    const citation = JSON.parse(readFileSync(join(GEN, 'citation-ranking.json'), 'utf-8'))
    const ranks = new Map(citation.records.map(r => [r.journal_id, r]))
    const pcsValues = new Map(JSON.parse(readFileSync(join(GEN, 'pcs-q.json'), 'utf-8')).records.map(r => [r.journal_id, r]))
    // PCI for the curated journals (src/lib/pci.json, from posi-data): the
    // Citation Ranking edition carries PCI only when its run was given it.
    const pciValues = new Map(JSON.parse(readFileSync(join(ROOT, 'src/lib/pci.json'), 'utf-8')).map(r => [r.journal_id, r.pci]))
    const ajr = ajrRatings()

    const shards = new Map()
    const shard = k => { const n = shardOf(k); if (!shards.has(n)) shards.set(n, { p: {}, a: {} }); return shards.get(n) }
    let n = 0
    for (const r of corpus) {
      const key = r.issn_l ?? r.issns?.[0]
      if (!key) continue
      const o = r.openalex_source_id ? oa.get(r.openalex_source_id) : null
      const rk = ranks.get(r.posi_id)
      const pv = pcsValues.get(r.posi_id)
      const va = verifiedApc.get(r.posi_id)
      const tt = titlesOf(r.posi_id, r.title ?? o?.t, [...(r.alternate_titles ?? []), ...(o?.alt ?? [])])
      const prof = {
        k: key, pid: r.posi_id, cur: r.curated ? 1 : undefined,
        t: tt.title ?? key, ab: o?.ab, alt: tt.alt.length ? tt.alt : undefined,
        pub: r.publisher ?? o?.pub, cc: r.country ?? o?.cc, is: r.issns ?? [key],
        hp: o?.hp, apc: va ? (va.currency === 'USD' ? va.amount : undefined) : r.apc_usd ?? o?.apc,
        apcx: va ? (va.amount === 0 ? 'None' : `${va.currency} ${va.amount.toLocaleString('en-US')}`) : undefined,
        apcsrc: va?.source_url, oa: r.open_access ?? undefined, dj: r.in_doaj ?? undefined,
        w: o?.w ?? r.works_count ?? undefined, c: o?.c, h: o?.h, i10: o?.i10, y0: o?.y0, y1: o?.y1,
        cy: o?.cy, tp: o?.tp, soc: o?.soc,
        s: r.psc_category ?? undefined, sc: r.psc_confidence ?? undefined,
        cr: r.crossref_total_dois ?? undefined, src: r.sources, oid: r.openalex_source_id ?? undefined,
        // POSI-EVAL-1.0 evaluation: Citation Ranking (PNCI) and PCS; see
        // src/lib/journal-profile.ts JournalProfile.ev for the keys.
        ev: rk || pv || CURATED.has(r.posi_id) ? {
          y: rk?.metric_year ?? pv?.metric_year, snap: rk?.ranking_snapshot_date ?? undefined,
          pnci: rk?.pnci ?? undefined, pm: rk?.pnci_model_version ?? undefined,
          n: rk?.eligible_citable_items ?? pv?.pcs_eligible_items ?? undefined, cov: rk?.citation_coverage ?? undefined,
          cat: rk?.ranking_category_id ?? undefined, r: rk?.citation_rank ?? undefined, rt: rk?.citation_rank_total ?? undefined,
          p: rk?.citation_percentile ?? undefined, q: rk?.citation_quartile ?? undefined, z: rk?.posi_zone ?? undefined,
          zs: rk?.zone_status ?? undefined, st: rk?.citation_ranking_status ?? undefined, why: rk?.ranking_status_reason ?? undefined,
          pcs: pv?.pcs ?? rk?.pcs ?? undefined, pci: rk?.pci ?? pciValues.get(r.posi_id) ?? undefined, ajr: ajr.get(r.posi_id),
          pqf: CURATED.get(r.posi_id)?.pqf?.total ?? undefined,
        } : undefined,
      }
      shard(key).p[key] = prof
      for (const alias of [...(r.issns ?? []), r.openalex_source_id].filter(Boolean)) {
        if (alias !== key) shard(alias).a[alias] = key
      }
      n++
    }
    rmSync(dir, { recursive: true, force: true })
    mkdirSync(dir, { recursive: true })
    let bytes = 0
    for (const [name, data] of shards) { const s = JSON.stringify(data); bytes += s.length; writeFileSync(join(dir, `${name}.json`), s) }
    console.log(`sync-live-data: journal profiles, ${n} journals in ${shards.size} shards (${(bytes / 1e6).toFixed(0)} MB)`)
  } catch (e) {
    console.warn(`sync-live-data: journal profiles not built (${e.message})`)
    missing.push('journal profiles')
  }
}

// 4. Journal title index for /journals/ search: every title word (minus
// generic words) -> its first two letters -> one file. Entries are
// [key, title, publisher, works, open access, alternate titles, evaluation?],
// most works first; alternate titles are matched but not shown. evaluation is
// [PSC category, Citation Quartile, POSI Zone, ranking status, AJR Rating, zone status].
if (!RANKINGS_ONLY) {
  const dir = join(ROOT, 'public/data/jt')
  try {
    if (!corpus) throw new Error('no corpus')
    const byPrefix = new Map()
    const citation = JSON.parse(readFileSync(join(GEN, 'citation-ranking.json'), 'utf-8'))
    const ranks = new Map(citation.records.map(r => [r.journal_id, r]))
    const ajr = ajrRatings()
    for (const r of corpus) {
      const key = r.issn_l ?? r.issns?.[0]
      if (!key || !r.title) continue
      const { title, alt } = titlesOf(r.posi_id, r.title, r.alternate_titles)
      const entry = [key, title, r.publisher ?? null, r.works_count ?? r.crossref_total_dois ?? 0, r.open_access ? 1 : 0]
      const rk = ranks.get(r.posi_id)
      const ev = rk || ajr.has(r.posi_id)
        ? [rk?.ranking_category_id ?? r.psc_category ?? null, rk?.citation_quartile ?? null, rk?.posi_zone ?? null, rk?.citation_ranking_status ?? null, ajr.get(r.posi_id)?.[0] ?? null, rk?.zone_status ?? null]
        : null
      if (alt.length || ev) entry.push(alt.join(' | '))
      if (ev) entry.push(ev)
      for (const p of new Set([title, ...alt].flatMap(titleWords).map(prefixOf))) {
        if (!byPrefix.has(p)) byPrefix.set(p, [])
        byPrefix.get(p).push(entry)
      }
    }
    rmSync(dir, { recursive: true, force: true })
    mkdirSync(dir, { recursive: true })
    for (const [p, list] of byPrefix) writeFileSync(join(dir, `${p}.json`), JSON.stringify(list.sort((a, b) => b[3] - a[3])))
    console.log(`sync-live-data: journal title index, ${byPrefix.size} files`)
  } catch (e) {
    console.warn(`sync-live-data: journal title index not built (${e.message})`)
    missing.push('journal title index')
  }
}

// A production build without the global corpus would publish a site with a
// fraction of the journals and no search. Fail it so the last good
// deployment stays live.
if (missing.length) {
  const production = process.env.CF_PAGES === '1' && process.env.POSI_ALLOW_PARTIAL_DATA !== '1'
  console.warn(`sync-live-data: missing ${missing.join(', ')}`)
  if (production) {
    console.error('sync-live-data: failing the Cloudflare Pages build so the last good deployment stays live (set POSI_ALLOW_PARTIAL_DATA=1 to deploy anyway)')
    process.exit(1)
  }
}
