// Builds the site's discovered-journal records from the data layer's discovered-journals collection
// (posi-data: scripts/lib/compose-discovered.mjs) and decides whether they are safe to use in place of
// the committed src/lib/discovered-journals.json. Used by scripts/sync-live-data.mjs.
import { toSiteRecord } from './discovered-from-data-layer.mjs'

/** A data-layer set smaller than this share of the committed records is taken as a broken download. */
export const MIN_COVERAGE = 0.99

/**
 * @param collection   parsed discovered-journals collection (array)
 * @param committed    the committed site records (array), the baseline
 * @returns an object with records, aliases and report; records are site-shaped; aliases maps an old journal code to its journal's code
 * @throws when the collection is not safe to use
 */
export function buildDiscovered(collection, committed) {
  if (!Array.isArray(collection) || collection.length === 0) throw new Error('collection is empty')
  const records = collection.map(toSiteRecord)
  const ids = new Set(), codes = new Set()
  for (const r of records) {
    if (!r.journal_code) throw new Error(`record ${r.title} has no journal_code`)
    if (!r.title || !String(r.title).trim()) throw new Error(`record ${r.id} has no title`)
    if (ids.has(r.id)) throw new Error(`duplicate id ${r.id}`)
    ids.add(r.id); codes.add(r.journal_code)
  }
  const aliases = {}
  for (const d of collection) for (const a of d.journal_code_aliases ?? []) {
    if (codes.has(a)) throw new Error(`alias ${a} is also a journal code`)
    aliases[a] = d.journal_code
  }
  const covered = committed.filter((c) => ids.has(c.id) || aliases[c.journal_code]).length
  const coverage = committed.length ? covered / committed.length : 1
  if (coverage < MIN_COVERAGE) throw new Error(`covers ${(coverage * 100).toFixed(1)}% of the committed journals (need ${MIN_COVERAGE * 100}%)`)
  return { records, aliases, report: { records: records.length, aliases: Object.keys(aliases).length, committed: committed.length, covered } }
}
