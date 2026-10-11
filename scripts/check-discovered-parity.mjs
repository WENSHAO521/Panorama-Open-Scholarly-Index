#!/usr/bin/env node
/**
 * check-discovered-parity.mjs
 *
 * Compares the data layer's discovered-journals collection, as the site would build it
 * (scripts/lib/discovered-from-data-layer.mjs), with the committed src/lib/discovered-journals.json.
 * This is the gate before the site stops committing its own copy: it says what would change on the
 * live pages. Read-only.
 *
 *   node scripts/check-discovered-parity.mjs <discovered-journals.json[.gz] of the data layer>
 *
 * Differences are "cosmetic" when only case, punctuation, a trailing slash or http/https differs;
 * a "regression" is a field the data layer leaves empty where the site shows a value, and a
 * "disagreement" is a field both have, with different values (the data layer wins once the site reads
 * it, so these are reported, not failed). A site journal whose code is an alias of another is redirected,
 * not missing. Exit 1 if any journal is missing or the regressions exceed --max-regressions (default 0).
 */
import { readFileSync } from 'fs'
import { gunzipSync } from 'zlib'
import { toSiteRecord } from './lib/discovered-from-data-layer.mjs'

const file = process.argv[2]
if (!file) { console.error('usage: check-discovered-parity.mjs <collection>'); process.exit(2) }
const max = Number((process.argv.includes('--max-regressions') && process.argv[process.argv.indexOf('--max-regressions') + 1]) || 0)
const raw = readFileSync(file)
const composed = JSON.parse((file.endsWith('.gz') ? gunzipSync(raw) : raw).toString('utf8')).map(toSiteRecord)
const site = JSON.parse(readFileSync(new URL('../src/lib/discovered-journals.json', import.meta.url), 'utf8'))

const text = (v) => String(v ?? '').normalize('NFKD').replace(/\p{M}+/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
const url = (v) => String(v ?? '').toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/\/+$/, '')
const cosmetic = { title: text, short_title: text, publisher: text, website_url: url }

const by = new Map(composed.map((r) => [r.id, r]))
const aliasOf = new Map()
for (const d of JSON.parse((file.endsWith('.gz') ? gunzipSync(raw) : raw).toString('utf8'))) for (const a of d.journal_code_aliases ?? []) aliasOf.set(`j-disc-${a}`, `j-disc-${d.journal_code}`)
const siteIds = new Set(site.map((r) => r.id))
const empty = (v) => v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0)
const counts = { identical: 0, cosmetic_only: 0, disagreement: 0, regression: 0 }
const regressions = {}, disagreements = {}, examples = {}
let missing = 0, aliased = 0
for (const s of site) {
  const c = by.get(s.id)
  if (!c) { if (aliasOf.has(s.id)) aliased++; else missing++; continue }
  let kind = 'identical'
  const rank = { identical: 0, cosmetic_only: 1, disagreement: 2, regression: 3 }
  for (const k of new Set([...Object.keys(s), ...Object.keys(c)])) {
    if (JSON.stringify(s[k] ?? null) === JSON.stringify(c[k] ?? null)) continue
    const norm = cosmetic[k]
    if (norm && norm(s[k]) === norm(c[k])) { if (rank[kind] < 1) kind = 'cosmetic_only'; continue }
    // A regression: the data layer has nothing where the site shows something.
    if (empty(c[k]) && !empty(s[k])) { regressions[k] = (regressions[k] ?? 0) + 1; kind = 'regression'; if ((examples[k] ??= []).length < 3) examples[k].push([s.id, s[k], c[k]]); continue }
    // Both have a value and differ: the data layer is the authority once the site reads it.
    disagreements[k] = (disagreements[k] ?? 0) + 1
    if (rank[kind] < 2) kind = 'disagreement'
  }
  counts[kind]++
}
const extra = composed.filter((c) => !siteIds.has(c.id)).length
console.log({ site: site.length, data_layer: composed.length, ...counts, redirected_aliases: aliased, missing_in_data_layer: missing, extra_in_data_layer: extra })
console.log('regressions by field (data layer empty, site not):', regressions)
console.log('accepted disagreements by field (both set, differ):', disagreements)
for (const [k, v] of Object.entries(examples)) console.log(`  ${k}: ${JSON.stringify(v).slice(0, 300)}`)
process.exit(missing === 0 && counts.regression <= max ? 0 : 1)
