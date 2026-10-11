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
 *   3. Invariants of the records this repository owns
 *      (src/lib/discovered-journals.json): unique ids, scoring backlog,
 *      records missing required fields.
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
try {
  const current = await getJson(`${DATA}/current.json`)
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
  ['discovered-journals.json', 3, 'daily-sync (daily), doaj-sync (1st and 16th)'],
  ['citation-stats.json', 10, 'citation-stats (weekly, Monday)'],
  ['core-collection.json', 45, 'data-sync from posi-data; changes on the monthly AJR rerate'],
]
for (const [file, maxAge, owner] of files) {
  const date = lastCommit(file)
  if (!date) { add('skip', file, 'no git history in this checkout'); continue }
  const age = ageDays(date)
  add(age <= maxAge ? 'ok' : 'warn', file, `last changed ${date} (${age} d ago, expect at most ${maxAge}); ${owner}`)
}

// ---- 3. invariants of owned records ---------------------------------------
const journals = read('discovered-journals.json')
const idCount = new Map()
for (const j of journals) idCount.set(j.id, (idCount.get(j.id) || 0) + 1)
const dupIds = [...idCount].filter(([, n]) => n > 1)
const dupRecords = dupIds.reduce((s, [, n]) => s + n, 0)
add(dupIds.length ? 'fail' : 'ok', 'unique journal ids',
  dupIds.length
    ? `${dupIds.length} ids are shared by ${dupRecords} records (e.g. ${dupIds.slice(0, 3).map(([id]) => JSON.stringify(id)).join(', ')})`
    : `${journals.length} records, all ids unique`)

const noTitle = journals.filter((j) => !j.title || !j.title.trim()).length
add(noTitle ? 'fail' : 'ok', 'records with a title', noTitle ? `${noTitle} without a title` : 'all have a title')

const unscored = journals.filter((j) => !j.auto_pqf).length
const newest = journals.reduce((m, j) => (j.auto_pqf && j.auto_pqf.evaluated_at > m ? j.auto_pqf.evaluated_at : m), '')
add(newest && ageDays(newest) > 3 ? 'warn' : 'ok', 'auto-PQF scoring',
  `${unscored} of ${journals.length} not yet scored (the daily run scores never-scored journals first); newest score ${newest || 'none'}`)

const stale = journals.filter((j) => j.auto_pqf && ageDays(j.auto_pqf.evaluated_at) > 90).length
// The daily run refreshes oldest-first within a 20-minute budget, so a backlog is normal;
// it matters only if it stops shrinking between rounds.
add('ok', 'auto-PQF age', `${stale} scores older than 90 days (refresh backlog, informational)`)

// ---- report ---------------------------------------------------------------
if (asJson) {
  console.log(JSON.stringify({ date: today, results }, null, 1))
} else {
  const mark = { ok: 'OK  ', warn: 'WARN', fail: 'FAIL', skip: 'SKIP' }
  console.log(`POSI site data status, ${today}\n`)
  for (const r of results) console.log(`${mark[r.level]}  ${r.name}: ${r.detail}`)
}
process.exit(results.some((r) => r.level === 'fail') ? 1 : 0)
