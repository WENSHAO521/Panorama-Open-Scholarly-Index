#!/usr/bin/env node
/**
 * export-for-posi-migration.mjs
 *
 * Legacy Export Adapter — the ONLY thing in this repo that posi-engine's
 * migration pipeline should ever need to know about. Reads this site's
 * TypeScript data files (data.ts, discovered-journals.ts) and writes a
 * stable, documented, engine-agnostic intermediate format:
 * `migration-source.jsonl` (one JSON object per line, schema below).
 *
 * This isolates posi-engine from this repo's internal file format. If
 * data.ts's shape changes later, only this adapter needs to change — the
 * migration pipeline in posi-engine never reads a .ts file directly.
 *
 * Output record shape (one line per journal):
 *   {
 *     source_collection: 'psg' | 'indexed' | 'shiharr' | 'other_indexed' | 'discovered',
 *     legacy_id: string,
 *     title: string,
 *     short_title: string | null,
 *     issn_print: string | null,
 *     issn_online: string | null,
 *     issn_l: string | null,        // always null today — this site has never stored ISSN-L
 *     publisher: string | null,
 *     country: string | null,
 *     website_url: string | null,
 *     openalex_source_id: string | null,
 *     doaj_status: string | null,
 *     doaj_id: string | null,        // always null today — this site stores doaj_status, not a DOAJ record id
 *     article_count: number
 *   }
 *
 * Usage:
 *   node scripts/export-for-posi-migration.mjs [--out migration-source.jsonl]
 */

import { execFileSync } from 'child_process'
import { mkdtempSync, writeFileSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join, resolve } from 'path'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

const outIdx = process.argv.indexOf('--out')
const OUT_PATH = resolve(outIdx !== -1 ? process.argv[outIdx + 1] : 'migration-source.jsonl')

function compileDataFiles() {
  const tmp = mkdtempSync(join(tmpdir(), 'posi-export-'))
  // Run TypeScript's JS entry point directly with the current Node binary —
  // avoids both npx and Windows .cmd-wrapper spawn quirks (.cmd files can't
  // be spawned without shell:true, which we'd rather not need here).
  const tscJs = require.resolve('typescript/bin/tsc')
  execFileSync(
    process.execPath,
    [
      tscJs,
      'src/lib/data.ts', 'src/lib/discovered-journals.ts', 'src/lib/types.ts',
      '--outDir', tmp,
      '--module', 'commonjs',
      '--target', 'es2020',
      '--moduleResolution', 'node',
      '--skipLibCheck',
      '--esModuleInterop',
    ],
    { stdio: 'inherit' }
  )
  return tmp
}

function toRecord(journal, source_collection) {
  return {
    source_collection,
    legacy_id: journal.id,
    title: journal.title ?? null,
    short_title: journal.short_title ?? null,
    issn_print: journal.issn_print ?? null,
    issn_online: journal.issn_online ?? null,
    issn_l: null, // this site has never tracked ISSN-L as a distinct field
    publisher: journal.publisher ?? null,
    country: journal.registration_country ?? journal.country ?? null,
    website_url: journal.website_url ?? null,
    openalex_source_id: journal.openalex_source_id ?? null,
    doaj_status: journal.doaj_status ?? null,
    doaj_id: null, // this site stores doaj_status only, not a DOAJ record/journal id
    article_count: journal.article_count ?? 0,
  }
}

function main() {
  const tmp = compileDataFiles()
  try {
    const mod = require(join(tmp, 'data.js'))

    const lines = [
      ...mod.PSG_JOURNALS.map(j => toRecord(j, 'psg')),
      ...mod.INDEXED_JOURNALS.map(j => toRecord(j, 'indexed')),
      ...mod.SHIHARR_JOURNALS.map(j => toRecord(j, 'shiharr')),
      ...mod.OTHER_INDEXED_JOURNALS.map(j => toRecord(j, 'other_indexed')),
      ...mod.DISCOVERED_JOURNALS.map(j => toRecord(j, 'discovered')),
    ]

    writeFileSync(OUT_PATH, lines.map(r => JSON.stringify(r)).join('\n') + '\n', 'utf-8')
    console.log(`Wrote ${lines.length} records to ${OUT_PATH}`)
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
}

main()
