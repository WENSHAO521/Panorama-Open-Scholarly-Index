#!/usr/bin/env node
/**
 * sync-live-data.mjs — runs before every build (npm "prebuild").
 *
 * Downloads the current published data into src/lib/generated/ (not
 * committed), so the site reflects the latest edition on every build with no
 * manual step:
 *
 *   pcs-q.json            the PCS-Q ranking edition, from the data layer
 *                         (data.posi.panorama-sg.com -> current.json ->
 *                         manifest -> collections/pcs-q.json)
 *   journals-global.json  the global journal corpus (every Crossref and
 *                         OpenAlex journal), from the newest posi-engine release
 *                         tagged global-index-* (asset global-corpus.json.gz)
 *   public/data/j/*.json  journal profiles for /journal/, in 1024 hashed shards,
 *                         built from the corpus, the OpenAlex profiles asset
 *                         (openalex-profiles.jsonl.gz) and the ranking edition
 *
 * Never fails the build. Rankings fall back to the committed
 * src/lib/pcs-q.json; the journal directory falls back to the curated records.
 * POSI_GLOBAL_CORPUS=<path> and POSI_OPENALEX_PROFILES=<path> use local files
 * instead (development).
 */
import { mkdirSync, writeFileSync, existsSync, readFileSync, copyFileSync, rmSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { gunzipSync } from 'zlib'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const GEN = join(ROOT, 'src/lib/generated')
const DATA = 'https://data.posi.panorama-sg.com'
const RELEASES = 'https://api.github.com/repos/WENSHAO521/posi-engine/releases?per_page=30'

mkdirSync(GEN, { recursive: true })

/** Keep in step with src/lib/journal-profile.ts. */
const SHARDS = 1024
function shardOf(key) {
  let h = 0x811c9dc5
  for (const ch of String(key).toUpperCase()) { h ^= ch.charCodeAt(0); h = Math.imul(h, 0x01000193) >>> 0 }
  return String(h % SHARDS).padStart(4, '0')
}

async function get(url, as = 'json') {
  const res = await fetch(url, { signal: AbortSignal.timeout(120_000), headers: { 'User-Agent': 'posi-site-build' } })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return as === 'json' ? res.json() : Buffer.from(await res.arrayBuffer())
}

// Only the fields the site uses, to keep build memory and page data small.
function slim(corpus) {
  return corpus.map(r => ({
    posi_id: r.posi_id, curated: !!r.curated, title: clean(r.title), publisher: r.publisher,
    issns: r.issns ?? [], issn_l: r.issn_l ?? null, openalex_source_id: r.openalex_source_id ?? null,
    country: r.country ?? null, open_access: r.open_access ?? null, in_doaj: r.in_doaj ?? null,
    works_count: r.works_count ?? null, crossref_total_dois: r.crossref_total_dois ?? null,
    psc_category: r.psc_category ?? null, psc_confidence: r.psc_confidence ?? null,
  }))
}

/** Keep in step with src/lib/journal-search.ts. */
const STOP_WORDS = new Set('journal journals international of and the for in on de la y e des du und der revista research da di del el et les en al'.split(' '))
function titleWords(t) {
  return t.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length >= 2 && !STOP_WORDS.has(w))
}

/** Registry titles occasionally carry control characters. */
const clean = t => t?.replace(/[\u0000-\u001f\u007f-\u009f]/g, '').trim() || null

// 1. Ranking edition
{
  const out = join(GEN, 'pcs-q.json')
  try {
    const current = await get(`${DATA}/current.json`)
    const dir = current.manifest.replace(/manifest\.json$/, '')
    const edition = await get(`${DATA}${dir}collections/pcs-q.json`)
    if (!Array.isArray(edition.records) || !edition.records.length) throw new Error('edition has no records')
    writeFileSync(out, JSON.stringify(edition))
    console.log(`sync-live-data: rankings ${edition.methodology_version} ${edition.metric_year}, ${edition.records.length} journals`)
  } catch (e) {
    if (!existsSync(out)) copyFileSync(join(ROOT, 'src/lib/pcs-q.json'), out)
    console.warn(`sync-live-data: rankings use the committed edition (${e.message})`)
  }
}

// 2. Global journal directory
let corpus = null
let release = null
{
  const out = join(GEN, 'journals-global.json')
  try {
    if (process.env.POSI_GLOBAL_CORPUS) {
      corpus = JSON.parse(readFileSync(process.env.POSI_GLOBAL_CORPUS, 'utf-8'))
    } else {
      const releases = await get(RELEASES)
      const rel = releases.find(r => r.tag_name?.startsWith('global-index-') && !r.draft)
      release = rel ?? null
      const asset = rel?.assets?.find(a => a.name === 'global-corpus.json.gz')
      if (!asset) throw new Error('no global-index release yet')
      corpus = JSON.parse(gunzipSync(await get(asset.browser_download_url, 'buffer')).toString('utf-8'))
    }
    writeFileSync(out, JSON.stringify(slim(corpus)))
    console.log(`sync-live-data: journal directory, ${corpus.length} journals`)
  } catch (e) {
    console.warn(`sync-live-data: journal directory uses curated records only (${e.message})`)
  }
}

// 3. Journal profiles
{
  const dir = join(ROOT, 'public/data/j')
  try {
    if (!corpus) throw new Error('no corpus')
    let lines
    if (process.env.POSI_OPENALEX_PROFILES) {
      lines = readFileSync(process.env.POSI_OPENALEX_PROFILES, 'utf-8')
    } else {
      const asset = release?.assets?.find(a => a.name === 'openalex-profiles.jsonl.gz')
      if (!asset) throw new Error('no profiles asset in the release')
      lines = gunzipSync(await get(asset.browser_download_url, 'buffer')).toString('utf-8')
    }
    const oa = new Map()
    for (const l of lines.split('\n')) { if (l) { const p = JSON.parse(l); oa.set(p.id, p) } }
    lines = null

    const edition = JSON.parse(readFileSync(join(GEN, 'pcs-q.json'), 'utf-8'))
    const ranks = new Map(edition.records.map(r => [r.journal_id, r]))

    const shards = new Map()
    const shard = k => { const n = shardOf(k); if (!shards.has(n)) shards.set(n, { p: {}, a: {} }); return shards.get(n) }
    let n = 0
    for (const r of corpus) {
      const key = r.issn_l ?? r.issns?.[0]
      if (!key) continue
      const o = r.openalex_source_id ? oa.get(r.openalex_source_id) : null
      const rk = ranks.get(r.posi_id)
      const prof = {
        k: key, pid: r.posi_id, cur: r.curated ? 1 : undefined,
        t: clean(r.title) ?? clean(o?.t) ?? key, ab: o?.ab, alt: o?.alt,
        pub: r.publisher ?? o?.pub, cc: r.country ?? o?.cc, is: r.issns ?? [key],
        hp: o?.hp, apc: r.apc_usd ?? o?.apc, oa: r.open_access ?? undefined, dj: r.in_doaj ?? undefined,
        w: o?.w ?? r.works_count ?? undefined, c: o?.c, h: o?.h, i10: o?.i10, y0: o?.y0, y1: o?.y1,
        cy: o?.cy, tp: o?.tp, soc: o?.soc,
        s: r.psc_category ?? undefined, sc: r.psc_confidence ?? undefined,
        cr: r.crossref_total_dois ?? undefined, src: r.sources, oid: r.openalex_source_id ?? undefined,
        rk: rk ? {
          y: rk.metric_year, pcs: rk.pcs, n: rk.pcs_eligible_items,
          oq: rk.overall_quartile, op: rk.overall_percentile, or: rk.overall_rank, os: rk.overall_size,
          cat: rk.category_code, cq: rk.quartile, cp: rk.percentile, cr: rk.rank, cs: rk.category_size,
          ex: rk.exclusion_reason ?? undefined,
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
  }
}

// 4. Journal title index for /journals/ search: every title word (minus
// generic words) -> its first two letters -> one file. Entries are
// [key, title, publisher, works, open access], most works first.
{
  const dir = join(ROOT, 'public/data/jt')
  try {
    if (!corpus) throw new Error('no corpus')
    const byPrefix = new Map()
    for (const r of corpus) {
      const key = r.issn_l ?? r.issns?.[0]
      if (!key || !r.title) continue
      const entry = [key, clean(r.title), r.publisher ?? null, r.works_count ?? r.crossref_total_dois ?? 0, r.open_access ? 1 : 0]
      for (const p of new Set(titleWords(r.title).map(w => w.slice(0, 2)))) {
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
  }
}
