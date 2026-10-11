// Discovered journal records. By default the data lives in discovered-journals.json (one record per
// line); scripts read and write it through scripts/lib/discovered-store.mjs. Do not edit the JSON by hand.
//
// When the build runs with POSI_DISCOVERED_FROM_DATA_LAYER=1, scripts/sync-live-data.mjs writes the data
// layer's records to src/lib/generated/discovered-journals.json (posi-data's discovered-journals collection,
// in the same shape), and those are used instead. If the file is missing the committed records are used.
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import type { Journal } from './types'
import committed from './discovered-journals.json'

function load(): Journal[] {
  const generated = join(process.cwd(), 'src/lib/generated', 'discovered-journals.json')
  try {
    if (existsSync(generated)) return JSON.parse(readFileSync(generated, 'utf-8')) as Journal[]
  } catch { /* fall back to the committed records */ }
  return committed as unknown as Journal[]
}

export const DISCOVERED_JOURNALS = load()
