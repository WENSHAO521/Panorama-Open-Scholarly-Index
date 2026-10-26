// Discovered journal records. The build reads them from the data layer: scripts/sync-live-data.mjs writes
// posi-data's discovered-journals collection, in the site's shape, to src/lib/generated/discovered-journals.json
// (unless POSI_DISCOVERED_FROM_DATA_LAYER=0). The committed discovered-journals.json is the fallback, used when
// that file is missing; it is no longer updated (the website's own sync jobs stopped, #97) and goes in #100.
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import type { Journal } from './types'
import committed from './discovered-journals.json'
import { withCurrentArticleCounts } from './article-counts'

function load(): Journal[] {
  const generated = join(process.cwd(), 'src/lib/generated', 'discovered-journals.json')
  try {
    if (existsSync(generated)) return JSON.parse(readFileSync(generated, 'utf-8')) as Journal[]
  } catch { /* fall back to the committed records */ }
  return committed as unknown as Journal[]
}

export const DISCOVERED_JOURNALS = withCurrentArticleCounts(load())
