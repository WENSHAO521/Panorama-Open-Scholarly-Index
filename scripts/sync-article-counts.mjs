#!/usr/bin/env node
/**
 * sync-article-counts.mjs
 *
 * Corrects data.ts's static article_count field for every Core Collection
 * journal (PSG_JOURNALS + INDEXED_JOURNALS + SHIHARR_JOURNALS +
 * OTHER_INDEXED_JOURNALS) — several currently show 0 despite the journal
 * having real published content (article_count was never synced after the
 * journal's initial record was created).
 *
 * Primary source: Crossref DOI count for the journal's ISSN
 * (type:journal-article, same query src/lib/api.ts's crossrefFetchJournal
 * already uses for the live per-page count). Fallback, only when Crossref
 * returns 0/unavailable and the journal has an oai_base_url: count
 * <header> records from the journal's own OJS OAI-PMH ListIdentifiers
 * response — the journal's own publishing system is authoritative when
 * DOI registration is incomplete.
 *
 * Operates directly on a corpus JSON file (Journal[]) — src/lib's vendored
 * core-collection.json by default, or any other path via --file (e.g. a
 * posi-data checkout's corpus/core-collection.json, to update the
 * authoritative copy directly). If you write to a posi-data checkout,
 * commit + push there, then run this repo's scripts/sync-corpus.mjs to
 * pull the update back.
 *
 * Usage:
 *   node scripts/sync-article-counts.mjs           # dry run — print counts
 *   node scripts/sync-article-counts.mjs --write    # inject into the corpus file
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const WRITE = process.argv.includes('--write')
const UA = 'POSI-ArticleCountSync/0.1 (+https://posi.panorama-sg.com; posi@panoramagroup.org)'
const DATA_PATH = resolve((() => {
  const i = process.argv.indexOf('--file')
  return i !== -1 ? process.argv[i + 1] : 'src/lib/core-collection.json'
})())

async function fetchCrossrefCount(issn) {
  try {
    const res = await fetch(
      `https://api.crossref.org/journals/${issn}/works?rows=0&filter=type:journal-article&mailto=posi@panoramagroup.org`,
      { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000) }
    )
    if (!res.ok) return 0
    const data = await res.json()
    return data.message?.['total-results'] ?? 0
  } catch {
    return 0
  }
}

async function fetchOaiCount(oaiBaseUrl) {
  try {
    const res = await fetch(`${oaiBaseUrl}?verb=ListIdentifiers&metadataPrefix=oai_dc`, {
      headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return 0
    const xml = await res.text()
    // Small OJS installs return the full set in one page (no resumptionToken
    // pagination needed) — count <header> records directly. If a
    // resumptionToken with more pages exists this undercounts; acceptable
    // for a fallback path, since Crossref is the primary source in practice.
    return (xml.match(/<header/g) ?? []).length
  } catch {
    return 0
  }
}

function toCountTarget(j) {
  return {
    id: j.id,
    issn_online: j.issn_online ?? null,
    oai_base_url: j.oai_base_url ?? null,
    current_count: j.article_count ?? null,
  }
}

function applyCount(journals, id, count) {
  const idx = journals.findIndex(j => j.id === id)
  if (idx === -1) return
  journals[idx] = { ...journals[idx], article_count: count }
}

async function main() {
  const data = JSON.parse(readFileSync(DATA_PATH, 'utf-8'))
  const journals = data.map(toCountTarget)

  console.log(`Found ${journals.length} Core Collection journals.\n`)

  const results = []
  for (const j of journals) {
    let count = 0
    let source = 'none'
    if (j.issn_online) {
      count = await fetchCrossrefCount(j.issn_online)
      if (count > 0) source = 'crossref'
      await new Promise(r => setTimeout(r, 200))
    }
    if (count === 0 && j.oai_base_url) {
      count = await fetchOaiCount(j.oai_base_url)
      if (count > 0) source = 'oai'
      await new Promise(r => setTimeout(r, 200))
    }
    results.push({ ...j, new_count: count, source })
    console.log(`  ${j.id}: ${j.current_count} -> ${count} (${source})`)
  }

  const changed = results.filter(r => r.new_count !== r.current_count)
  console.log(`\n${changed.length} of ${results.length} article counts changed.`)

  if (!WRITE) {
    console.log('\nDry run (pass --write to persist).')
    return
  }

  for (const r of results) {
    if (r.new_count !== r.current_count) applyCount(data, r.id, r.new_count)
  }
  writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + '\n', 'utf-8')
  console.log(`\nWrote updated article_count values to ${DATA_PATH}`)
}

main().catch(err => { console.error(err); process.exit(1) })
