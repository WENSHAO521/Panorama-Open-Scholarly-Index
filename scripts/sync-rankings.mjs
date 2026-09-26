#!/usr/bin/env node
/**
 * sync-rankings.mjs — runs before every build (npm "prebuild").
 *
 * Downloads the current PCS-Q ranking edition from the public data layer
 * (data.posi.panorama-sg.com -> current.json -> manifest -> collections/pcs-q.json)
 * into src/lib/generated/pcs-q.json, which is not committed. Rankings on the
 * site therefore update on the next build after posi-engine publishes a new
 * edition, with no manual step and no large file in this repository's history.
 *
 * Never fails the build: if the data layer is unreachable or has no edition,
 * the committed fallback src/lib/pcs-q.json is used instead.
 */
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'src/lib/generated/pcs-q.json')
const FALLBACK = join(ROOT, 'src/lib/pcs-q.json')
const BASE = 'https://data.posi.panorama-sg.com'

async function getJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(60_000) })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return res.json()
}

mkdirSync(dirname(OUT), { recursive: true })
try {
  const current = await getJson(`${BASE}/current.json`)
  const dir = current.manifest.replace(/manifest\.json$/, '')
  const edition = await getJson(`${BASE}${dir}collections/pcs-q.json`)
  if (!Array.isArray(edition.records) || !edition.records.length) throw new Error('edition has no records')
  writeFileSync(OUT, JSON.stringify(edition))
  console.log(`sync-rankings: ${edition.methodology_version} ${edition.metric_year}, ${edition.records.length} journals from snapshot ${current.snapshot}`)
} catch (e) {
  if (!existsSync(OUT)) writeFileSync(OUT, readFileSync(FALLBACK))
  console.warn(`sync-rankings: using the committed edition (${e.message})`)
}
