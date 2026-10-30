// Discovered journal records. The build reads them from the data layer: scripts/sync-live-data.mjs writes
// posi-data's discovered-journals collection, in the site's shape, to src/lib/generated/discovered-journals.json.
// There is no committed copy since #100; the final one is the posi-data release
// site-discovered-journals-2026-10-23. Without the generated file the list is empty (a local build with no
// data layer); a production build fails before it gets here.
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import type { Journal } from './types'
import { withCurrentArticleCounts } from './article-counts'

function load(): Journal[] {
  const generated = join(process.cwd(), 'src/lib/generated', 'discovered-journals.json')
  if (!existsSync(generated)) return []
  return JSON.parse(readFileSync(generated, 'utf-8')) as Journal[]
}

export const DISCOVERED_JOURNALS = withCurrentArticleCounts(load())
