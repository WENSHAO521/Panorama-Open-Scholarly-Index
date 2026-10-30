// Builds the site's discovered-journal records from the data layer's discovered-journals collection
// (posi-data: scripts/lib/compose-discovered.mjs) and decides whether they are safe to use. Used by
// scripts/sync-live-data.mjs.
import { toSiteRecord } from './discovered-from-data-layer.mjs'

/**
 * A collection with fewer records is taken as a broken download. The site listed 25,766 discovered journals
 * when it switched to the data layer (2026-10-23), which holds them as 25,434 records and 503 old codes.
 * Raise it as the directory grows; lower it only for a deliberate removal.
 */
export const MIN_RECORDS = 25000

/**
 * @param collection   parsed discovered-journals collection (array)
 * @param minRecords   the smallest collection taken as whole (MIN_RECORDS; tests pass less)
 * @returns an object with records, aliases and report; records are site-shaped; aliases maps an old journal code to its journal's code
 * @throws when the collection is not safe to use
 */
export function buildDiscovered(collection, minRecords = MIN_RECORDS) {
  if (!Array.isArray(collection) || collection.length === 0) throw new Error('collection is empty')
  if (collection.length < minRecords) throw new Error(`collection has ${collection.length} records (need ${minRecords})`)
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
  return { records, aliases, report: { records: records.length, aliases: Object.keys(aliases).length } }
}
