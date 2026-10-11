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
 * everything else is "substantive" (a different country, ISSN, publisher, identifier, open-access
 * value, or a journal missing on one side). Exit 1 if any journal is missing or the substantive
 * differences exceed --max-substantive (default 0).
 */
import { readFileSync } from 'fs'
import { gunzipSync } from 'zlib'
import { toSiteRecord } from './lib/discovered-from-data-layer.mjs'

const file = process.argv[2]
if (!file) { console.error('usage: check-discovered-parity.mjs <collection>'); process.exit(2) }
const max = Number((process.argv.includes('--max-substantive') && process.argv[process.argv.indexOf('--max-substantive') + 1]) || 0)
const raw = readFileSync(file)
const composed = JSON.parse((file.endsWith('.gz') ? gunzipSync(raw) : raw).toString('utf8')).map(toSiteRecord)
const site = JSON.parse(readFileSync(new URL('../src/lib/discovered-journals.json', import.meta.url), 'utf8'))

const text = (v) => String(v ?? '').normalize('NFKD').replace(/\p{M}+/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
const url = (v) => String(v ?? '').toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/\/+$/, '')
const cosmetic = { title: text, short_title: text, publisher: text, website_url: url }

const by = new Map(composed.map((r) => [r.id, r]))
const siteIds = new Set(site.map((r) => r.id))
const counts = { identical: 0, cosmetic_only: 0, substantive: 0 }
const fields = {}, examples = {}
let missing = 0
for (const s of site) {
  const c = by.get(s.id)
  if (!c) { missing++; continue }
  let kind = 'identical'
  for (const k of new Set([...Object.keys(s), ...Object.keys(c)])) {
    if (JSON.stringify(s[k] ?? null) === JSON.stringify(c[k] ?? null)) continue
    const norm = cosmetic[k]
    if (norm && norm(s[k]) === norm(c[k])) { if (kind === 'identical') kind = 'cosmetic_only'; continue }
    kind = 'substantive'
    fields[k] = (fields[k] ?? 0) + 1
    if ((examples[k] ??= []).length < 3) examples[k].push([s.id, s[k], c[k]])
  }
  counts[kind]++
}
const extra = composed.filter((c) => !siteIds.has(c.id)).length
console.log({ site: site.length, data_layer: composed.length, ...counts, missing_in_data_layer: missing, extra_in_data_layer: extra })
console.log('substantive differences by field:', fields)
for (const [k, v] of Object.entries(examples)) console.log(`  ${k}: ${JSON.stringify(v).slice(0, 360)}`)
process.exit(missing === 0 && counts.substantive <= max ? 0 : 1)
