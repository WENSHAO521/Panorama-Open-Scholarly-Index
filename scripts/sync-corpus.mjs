#!/usr/bin/env node
/**
 * sync-corpus.mjs
 *
 * Refreshes src/lib/core-collection.json and src/lib/global-benchmark.json
 * from posi-data's corpus/ (see that repo's corpus/README.md) at a pinned
 * commit — deliberate, not automatic on every build, so this repo's git
 * history only grows when a sync is actually intended (that's the whole
 * point of moving the corpus out of this repo in the first place).
 *
 * Usage:
 *   node scripts/sync-corpus.mjs <commit-sha>
 *   node scripts/sync-corpus.mjs af68b73f3f582afe903a558e25f33a7f7881bbc6
 */

import { writeFileSync } from 'fs'
import { resolve } from 'path'

const commit = process.argv[2]
if (!commit) {
  console.error('Usage: node scripts/sync-corpus.mjs <posi-data-commit-sha>')
  process.exit(1)
}

const FILES = ['core-collection.json', 'global-benchmark.json']
const UA = 'POSI-CorpusSync/0.1 (+https://posi.panorama-sg.com; posi@panoramagroup.org)'

async function main() {
  for (const file of FILES) {
    const url = `https://raw.githubusercontent.com/WENSHAO521/posi-data/${commit}/corpus/${file}`
    console.log(`Fetching ${url} ...`)
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) })
    if (!res.ok) throw new Error(`Failed to fetch ${file}: HTTP ${res.status}`)
    const text = await res.text()
    JSON.parse(text) // fail fast on malformed JSON rather than writing it
    writeFileSync(resolve('src/lib', file), text, 'utf-8')
    console.log(`  Wrote src/lib/${file} (${(text.length / 1024).toFixed(0)} KB)`)
  }
  console.log(`\nSynced to posi-data@${commit.slice(0, 7)}. Review the diff, then commit.`)
}

main().catch(err => { console.error(err); process.exit(1) })
