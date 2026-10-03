// Journals withdrawn from the database (src/lib/withdrawn-journals.json).
// The data layer and the global corpus still carry them, so every sync
// drops them: sync-corpus.mjs from the vendored files, sync-live-data.mjs
// from the corpus, the profiles, the search index and the editions.
import { readFileSync } from 'fs'

export const WITHDRAWN = JSON.parse(readFileSync(new URL('../../src/lib/withdrawn-journals.json', import.meta.url), 'utf-8'))
const ids = new Set(WITHDRAWN.map(j => j.posi_id))
const codes = new Set(WITHDRAWN.map(j => j.journal_code))
const issns = new Set(WITHDRAWN.flatMap(j => j.issns))

/** True for a record of a withdrawn journal: a corpus, core-collection or edition record. */
export function isWithdrawn(r) {
  if (ids.has(r.posi_id ?? r.journal_id) || codes.has(r.journal_code)) return true
  const is = [...(r.issns ?? []), ...[r.issn ?? []].flat(), r.issn_l, r.issn_online, r.issn_print]
  return is.some(i => i && issns.has(i))
}

/** Drops withdrawn journals from a list of records, logging how many went. */
export function withoutWithdrawn(records, what) {
  const kept = records.filter(r => !isWithdrawn(r))
  if (kept.length < records.length) console.log(`  ${what}: dropped ${records.length - kept.length} withdrawn journal(s)`)
  return kept
}
