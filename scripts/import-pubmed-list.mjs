#!/usr/bin/env node
/**
 * import-pubmed-list.mjs — build src/lib/pubmed-journals.json from NLM's
 * list of journals cited in PubMed (J_Medline.txt, from
 * https://ftp.ncbi.nlm.nih.gov/pubmed/J_Medline.txt).
 *
 * The list holds every journal cited in PubMed, current and past, including
 * titles whose articles reach PubMed through PubMed Central, so being listed
 * does not mean the journal is indexed for MEDLINE; its NLM Catalog page
 * (linked by NLM ID) states that. Kept per ISSN (8 characters, no hyphen):
 * the NLM ID only.
 *
 *   node scripts/import-pubmed-list.mjs <J_Medline.txt> [--as-of 2026-09]
 */
import { readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const [src] = process.argv.slice(2)
const i = process.argv.indexOf('--as-of')
const asOf = i > 0 ? process.argv[i + 1] : new Date().toISOString().slice(0, 7)
if (!src) { console.error('usage: import-pubmed-list.mjs <J_Medline.txt> [--as-of YYYY-MM]'); process.exit(1) }

const key = v => { const k = (v ?? '').replace(/[^0-9Xx]/g, '').toUpperCase(); return k.length === 8 ? k : null }
const records = readFileSync(src, 'utf-8').split(/^-+$/m).map(block => Object.fromEntries(
  block.trim().split('\n').filter(Boolean).map(line => { const c = line.indexOf(':'); return [line.slice(0, c).trim(), line.slice(c + 1).trim()] }),
)).filter(r => r.JrId && r.NlmId)

const d = {}
for (const r of records) for (const k of [key(r['ISSN (Print)']), key(r['ISSN (Online)'])]) if (k && !d[k]) d[k] = r.NlmId

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'src/lib/pubmed-journals.json')
writeFileSync(out, JSON.stringify({ as_of: asOf, list: 'NLM journals cited in PubMed (J_Medline.txt)', d: Object.fromEntries(Object.entries(d).sort()) }))
console.log(`pubmed-journals.json: ${Object.keys(d).length} ISSNs from ${records.length} journals (as of ${asOf})`)
