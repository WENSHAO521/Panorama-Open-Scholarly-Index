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
 * Usage:
 *   node scripts/sync-article-counts.mjs           # dry run — print counts
 *   node scripts/sync-article-counts.mjs --write    # inject into data.ts
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const WRITE = process.argv.includes('--write')
const UA = 'POSI-ArticleCountSync/0.1 (+https://posi.panorama-sg.com; posi@panoramagroup.org)'
const DATA_PATH = resolve('src/lib/data.ts')

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

function parseJournalBlocks(src) {
  const blocks = []
  const issnRe = /issn_online:\s*(null|'[^']+')/
  const oaiRe = /oai_base_url:\s*(null|'[^']+')/
  const countRe = /article_count:\s*(\d+)/
  let idx = 0
  while (true) {
    const idMatch = src.slice(idx).match(/^\s*id:\s*'([^']+)'/m)
    if (!idMatch) break
    const blockStart = idx + idMatch.index
    const nextIdMatch = src.slice(blockStart + idMatch[0].length).match(/^\s*id:\s*'([^']+)'/m)
    const blockEnd = nextIdMatch ? blockStart + idMatch[0].length + nextIdMatch.index : src.length
    const block = src.slice(blockStart, blockEnd)
    const issnMatch = block.match(issnRe)
    const oaiMatch = block.match(oaiRe)
    const countMatch = block.match(countRe)
    blocks.push({
      id: idMatch[1],
      issn_online: issnMatch && issnMatch[1] !== 'null' ? issnMatch[1].slice(1, -1) : null,
      oai_base_url: oaiMatch && oaiMatch[1] !== 'null' ? oaiMatch[1].slice(1, -1) : null,
      current_count: countMatch ? parseInt(countMatch[1], 10) : null,
    })
    idx = blockEnd
  }
  return blocks
}

function injectCount(src, id, count) {
  const idIdx = src.indexOf(`id: '${id}'`)
  if (idIdx === -1) return src
  const blockEnd = src.indexOf('created_at:', idIdx)
  if (blockEnd === -1) return src
  const existingIdx = src.indexOf('article_count:', idIdx)
  if (existingIdx === -1 || existingIdx > blockEnd) return src
  const valueStart = existingIdx + 'article_count:'.length
  const commaIdx = src.indexOf(',', valueStart)
  return src.slice(0, existingIdx) + `article_count: ${count},` + src.slice(commaIdx + 1)
}

async function main() {
  let src = readFileSync(DATA_PATH, 'utf-8')
  const journals = parseJournalBlocks(src)

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
    if (r.new_count !== r.current_count) src = injectCount(src, r.id, r.new_count)
  }
  writeFileSync(DATA_PATH, src, 'utf-8')
  console.log(`\nWrote updated article_count values to ${DATA_PATH}`)
}

main().catch(err => { console.error(err); process.exit(1) })
