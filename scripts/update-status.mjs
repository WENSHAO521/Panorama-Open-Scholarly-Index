#!/usr/bin/env node
/**
 * update-status.mjs
 *
 * One-screen health check of the site's data, the first step of every update
 * round (see docs/UPDATING.md). Read-only: it writes nothing.
 *
 *   1. Upstream: is src/lib/data-editions.json on the data layer's current
 *      snapshot and release, and do the synced collections match its counts?
 *   2. Freshness: when did each committed data file last change in git?
 *   3. Discovered journals: does the data layer's discovered-journals
 *      collection pass the build's safety checks (scripts/lib/discovered-sync.mjs:
 *      record floor, unique ids, titles, aliases), and how old are its
 *      auto-PQF scores. The site keeps no copy of its own since #100.
 *
 * Exit code 1 when a check fails (a warning does not fail), so a scheduled
 * run can open an alert. Without network access the upstream checks are
 * skipped and reported as such.
 *
 * Usage: node scripts/update-status.mjs [--json]
 */
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execFileSync } from 'child_process'
import { gunzipSync } from 'zlib'
import { buildDiscovered } from './lib/discovered-sync.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DATA = process.env.POSI_DATA_BASE || 'https://data.posi.panorama-sg.com'
const asJson = process.argv.includes('--json')
const read = (f) => JSON.parse(readFileSync(join(ROOT, 'src/lib', f), 'utf-8'))

/** @type {{level:'ok'|'warn'|'fail'|'skip', name:string, detail:string}[]} */
const results = []
const add = (level, name, detail) => results.push({ level, name, detail })

async function getJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000), headers: { 'User-Agent': 'posi-update-status' } })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return res.json()
}

async function getGzJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(60_000), headers: { 'User-Agent': 'posi-update-status' } })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return JSON.parse(gunzipSync(Buffer.from(await res.arrayBuffer())).toString('utf-8'))
}

function lastCommit(file) {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', `src/lib/${file}`], { cwd: ROOT, encoding: 'utf-8' }).trim()
    return out || null
  } catch {
    return null
  }
}

const today = new Date().toISOString().slice(0, 10)
const ageDays = (iso) => Math.round((Date.parse(today) - Date.parse(iso)) / 86_400_000)

// ---- 1. upstream ----------------------------------------------------------
const editions = read('data-editions.json')
let current = null
try {
  current = await getJson(`${DATA}/current.json`)
  const same = editions.snapshot === current.snapshot && editions.release === current.latest_release
  add(same ? 'ok' : 'warn', 'data-editions vs data layer',
    `site ${editions.snapshot} / ${editions.release}; upstream ${current.snapshot} / ${current.latest_release}` +
    (same ? '' : ' (data-sync commits this within about an hour; older than a day means data-sync is stuck)'))

  const manifest = await getJson(`${DATA}${current.manifest}`)
  const core = read('core-collection.json')
  const counts = [
    ['core-collection', core.length, manifest.core_collection_count],
    ['global-benchmark', read('global-benchmark.json').length, manifest.benchmark_curated_count],
    ['pcs records', read('pcs.json').length, manifest.journal_count],
    ['pcs with a value', read('pcs.json').filter((r) => r.pcs != null).length, manifest.pcs_computed_count],
  ]
  for (const [name, local, upstream] of counts) {
    add(local === upstream ? 'ok' : 'warn', `${name} count`, `site ${local}; upstream manifest ${upstream}`)
  }
} catch (e) {
  add('skip', 'upstream checks', `data layer unreachable (${e.message})`)
}

// ---- 2. freshness of committed files --------------------------------------
// maxAge is the longest quiet period the owning workflow should allow.
const files = [
  ['data-editions.json', 14, 'data-sync (every 20 min), only commits on a new upstream edition'],
  ['citation-stats.json', 10, 'citation-stats (weekly, Monday)'],
  ['core-collection.json', 45, 'data-sync from posi-data; changes on the monthly AJR rerate'],
]
for (const [file, maxAge, owner] of files) {
  const date = lastCommit(file)
  if (!date) { add('skip', file, 'no git history in this checkout'); continue }
  const age = ageDays(date)
  add(age <= maxAge ? 'ok' : 'warn', file, `last changed ${date} (${age} d ago, expect at most ${maxAge}); ${owner}`)
}

// ---- 3. discovered journals in the data layer ------------------------------
if (current) {
  try {
    const collection = await getGzJson(`${DATA}${current.manifest.replace(/manifest\.json$/, '')}collections/discovered-journals.json.gz`)
    try {
      const { records, report } = buildDiscovered(collection)
      add('ok', 'discovered journals', `${report.records} records, ${report.aliases} old codes redirected; passes the build's checks`)
      const unscored = records.filter((j) => !j.auto_pqf).length
      const newest = records.reduce((m, j) => (j.auto_pqf && j.auto_pqf.evaluated_at > m ? j.auto_pqf.evaluated_at : m), '')
      // Scored in posi-engine (directory-sync); a gap of more than a few days means that job is stuck.
      add(newest && ageDays(newest) > 7 ? 'warn' : 'ok', 'auto-PQF scoring',
        `${unscored} of ${records.length} not yet scored; newest score ${newest || 'none'}`)
      const stale = records.filter((j) => j.auto_pqf && ageDays(j.auto_pqf.evaluated_at) > 90).length
      add('ok', 'auto-PQF age', `${stale} scores older than 90 days (refresh backlog, informational)`)
    } catch (e) {
      add('fail', 'discovered journals', `the collection fails the build's checks (${e.message}); production builds will fail until it is fixed`)
    }
  } catch (e) {
    add('skip', 'discovered journals', `collection not downloaded (${e.message})`)
  }
} else {
  add('skip', 'discovered journals', 'data layer unreachable')
}

// ---- report ---------------------------------------------------------------
if (asJson) {
  console.log(JSON.stringify({ date: today, results }, null, 1))
} else {
  const mark = { ok: 'OK  ', warn: 'WARN', fail: 'FAIL', skip: 'SKIP' }
  console.log(`POSI site data status, ${today}\n`)
  for (const r of results) console.log(`${mark[r.level]}  ${r.name}: ${r.detail}`)
}
process.exit(results.some((r) => r.level === 'fail') ? 1 : 0)
