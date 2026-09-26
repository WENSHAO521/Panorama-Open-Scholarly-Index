#!/usr/bin/env node
// Vendors the identity fields rankings need for the Global Benchmark
// publisher-catalog journals (~3,300), whose full records are not bundled
// in this repo (see src/lib/publisher-catalog-client.ts). Only title,
// publisher, ISSNs, subject category and ids are kept, so the file stays
// small (~400 KB) while every journal with a PCS value can be ranked and
// named at build time.
//
// Reads the current snapshot pointer from the public data layer, the same
// way scripts/sync-corpus.mjs does. Run deliberately, review, commit:
//
//   node scripts/sync-ranking-titles.mjs

import { writeFile } from 'node:fs/promises'

const BASE = 'https://data.posi.panorama-sg.com'
const OUT = new URL('../src/lib/ranking-titles.json', import.meta.url)

const current = await (await fetch(`${BASE}/current.json`)).json()
const dir = current.manifest.replace(/manifest\.json$/, '')
const res = await fetch(`${BASE}${dir}collections/publisher-catalog.json`)
if (!res.ok) throw new Error(`publisher-catalog.json: HTTP ${res.status}`)
const rows = await res.json()

const slim = rows
  .filter(r => r.posi_id)
  .map(r => ({
    id: r.posi_id,
    c: r.journal_code,
    t: r.title,
    p: r.publisher || null,
    i: [r.issn_online, r.issn_print].filter((x, n, a) => x && a.indexOf(x) === n),
    s: r.psc_category ?? r.citation_preview?.psc_category ?? null,
    sc: r.psc_confidence ?? r.citation_preview?.psc_confidence ?? null,
    oa: r.openalex_source_id ?? null,
  }))
  .sort((a, b) => a.id.localeCompare(b.id))

await writeFile(OUT, JSON.stringify({ snapshot: current.snapshot, count: slim.length, journals: slim }) + '\n')
console.log(`Wrote ${slim.length} journals from snapshot ${current.snapshot} to src/lib/ranking-titles.json`)
