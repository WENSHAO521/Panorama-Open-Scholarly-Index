#!/usr/bin/env node
/**
 * record-data-editions.mjs
 *
 * Writes src/lib/data-editions.json: which upstream data editions the site
 * is built from — the data-layer snapshot and release (current.json at
 * data.posi.panorama-sg.com) and the newest posi-engine global-index
 * release, whose corpus the prebuild step downloads.
 *
 * The scheduled data sync commits this file when it changes. A new global
 * corpus otherwise changes nothing in this repository, so without the
 * commit Cloudflare Pages would not rebuild; with it, every new upstream
 * edition reaches the site through an ordinary push.
 *
 * Keeps the previous value of any source that cannot be reached, so an
 * outage never looks like a change. GITHUB_TOKEN, when set, is sent to the
 * GitHub API to avoid the anonymous rate limit.
 *
 * Usage: node scripts/record-data-editions.mjs
 */
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'src/lib/data-editions.json')
const DATA = process.env.POSI_DATA_BASE || 'https://data.posi.panorama-sg.com'
const RELEASES = 'https://api.github.com/repos/WENSHAO521/posi-engine/releases?per_page=30'

async function get(url, headers = {}) {
  const res = await fetch(url, { signal: AbortSignal.timeout(60_000), headers: { 'User-Agent': 'posi-site-build', ...headers } })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return res.json()
}

const previous = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf-8')) : {}
const next = { ...previous }

try {
  const current = await get(`${DATA}/current.json`)
  next.snapshot = current.snapshot
  next.release = current.release ?? current.latest_release ?? null
} catch (e) {
  console.warn(`record-data-editions: data layer unreachable, keeping ${previous.snapshot ?? 'nothing'} (${e.message})`)
}

try {
  const auth = process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}
  const releases = await get(RELEASES, auth)
  const rel = releases.find(r => r.tag_name?.startsWith('global-index-') && !r.draft && r.assets?.some(a => a.name === 'global-corpus.json.gz'))
  if (rel) next.global_index = rel.tag_name
} catch (e) {
  console.warn(`record-data-editions: posi-engine releases unreachable, keeping ${previous.global_index ?? 'nothing'} (${e.message})`)
}

writeFileSync(OUT, JSON.stringify(next, null, 2) + '\n')
console.log(`record-data-editions: ${JSON.stringify(next)}`)
