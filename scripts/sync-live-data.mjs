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
 *                         OpenAlex journal), from the newest posi-data release
 *                         tagged global-index-* (asset global-corpus.json.gz)
 *
 * Never fails the build. Rankings fall back to the committed
 * src/lib/pcs-q.json; the journal directory falls back to the curated records.
 * POSI_GLOBAL_CORPUS=<path> uses a local corpus file instead (development).
 */
import { mkdirSync, writeFileSync, existsSync, readFileSync, copyFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { gunzipSync } from 'zlib'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const GEN = join(ROOT, 'src/lib/generated')
const DATA = 'https://data.posi.panorama-sg.com'
const RELEASES = 'https://api.github.com/repos/WENSHAO521/posi-data/releases?per_page=30'

mkdirSync(GEN, { recursive: true })

async function get(url, as = 'json') {
  const res = await fetch(url, { signal: AbortSignal.timeout(120_000), headers: { 'User-Agent': 'posi-site-build' } })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return as === 'json' ? res.json() : Buffer.from(await res.arrayBuffer())
}

// Only the fields the site uses, to keep build memory and page data small.
function slim(corpus) {
  return corpus.map(r => ({
    posi_id: r.posi_id, curated: !!r.curated, title: r.title, publisher: r.publisher,
    issns: r.issns ?? [], issn_l: r.issn_l ?? null, openalex_source_id: r.openalex_source_id ?? null,
    country: r.country ?? null, open_access: r.open_access ?? null, in_doaj: r.in_doaj ?? null,
    works_count: r.works_count ?? null, crossref_total_dois: r.crossref_total_dois ?? null,
    psc_category: r.psc_category ?? null,
  }))
}

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
{
  const out = join(GEN, 'journals-global.json')
  try {
    let corpus
    if (process.env.POSI_GLOBAL_CORPUS) {
      corpus = JSON.parse(readFileSync(process.env.POSI_GLOBAL_CORPUS, 'utf-8'))
    } else {
      const releases = await get(RELEASES)
      const rel = releases.find(r => r.tag_name?.startsWith('global-index-') && !r.draft)
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
