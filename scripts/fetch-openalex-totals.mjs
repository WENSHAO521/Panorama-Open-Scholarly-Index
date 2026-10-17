#!/usr/bin/env node
/**
 * fetch-openalex-totals.mjs
 *
 * Writes src/lib/openalex-totals.json: OpenAlex's total number of works, its journals, and its works per type.
 * The publication search page shows these figures when OpenAlex cannot answer a visitor's browser (their free daily
 * request budget is spent, or it is busy) and the query has no search words or filters, so the page keeps the
 * OpenAlex total and type counts instead of Crossref's. Totals move slowly, so a weekly refresh is enough.
 *
 * Set OPENALEX_API_KEY to use the project's key (added as api_key); without it the free keyless budget is used,
 * which is enough for the three requests this script makes. If any request fails the file is left as it was and the
 * script still exits 0, so a busy OpenAlex does not turn the scheduled job red.
 *
 *   node scripts/fetch-openalex-totals.mjs [--out path.json]
 */
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const i = process.argv.indexOf('--out')
const OUT = resolve(i !== -1 ? process.argv[i + 1] : 'src/lib/openalex-totals.json')
const API = 'https://api.openalex.org'
const UA = 'POSI/0.1 (mailto:posi@panorama-sg.com)'

async function get(path, params) {
  const sp = new URLSearchParams({ ...params, mailto: 'posi@panorama-sg.com' })
  if (process.env.OPENALEX_API_KEY) sp.set('api_key', process.env.OPENALEX_API_KEY)
  const r = await fetch(`${API}${path}?${sp}`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(20000) })
  if (!r.ok) throw new Error(`${path} ${r.status}`)
  return r.json()
}

try {
  const [works, journals, types] = await Promise.all([
    get('/works', { per_page: 1, select: 'id' }),
    get('/sources', { filter: 'type:journal', per_page: 1, select: 'id' }),
    get('/works', { group_by: 'type', per_page: 50 }),
  ])
  const out = {
    fetched_at: new Date().toISOString().slice(0, 10),
    works: works.meta.count,
    journals: journals.meta.count,
    types: types.group_by.map((g) => ({ key: g.key.replace('https://openalex.org/types/', ''), label: g.key_display_name, count: g.count })),
  }
  if (!Number.isInteger(out.works) || out.works < 1e6 || !out.types.length) throw new Error('unexpected response')
  writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n')
  console.log(`openalex totals: ${out.works.toLocaleString('en-US')} works, ${out.journals.toLocaleString('en-US')} journals, ${out.types.length} types (${out.fetched_at})`)
} catch (e) {
  console.warn(`::warning::OpenAlex totals not refreshed (${e.message}); ${OUT} left as it was`)
  try { readFileSync(OUT) } catch { writeFileSync(OUT, JSON.stringify({ fetched_at: null, works: null, journals: null, types: [] }, null, 2) + '\n') }
}
