// The current article count of each POSI record. A record's own article_count
// was taken once, when the journal was added; scripts/sync-live-data.mjs writes
// the count the journal directory and the journal page show (the daily OpenAlex
// refresh, or Crossref DOIs for a journal OpenAlex does not list), by ISSN, to
// src/lib/generated/article-counts.json, so the record page shows the same
// number. Without that file records keep their own count. Server-only.
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import type { Journal } from './types'

function load(): Record<string, number> | null {
  const file = join(process.cwd(), 'src/lib/generated', 'article-counts.json')
  try {
    if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf-8')) as Record<string, number>
  } catch { /* keep the records' own counts */ }
  return null
}

const COUNTS = load()

/** The records with article_count set to the journal's current count, where one is known. */
export function withCurrentArticleCounts<T extends Journal>(records: T[]): T[] {
  if (!COUNTS) return records
  return records.map(j => {
    const n = [j.issn_online, j.issn_print].map(i => (i ? COUNTS[i] : undefined)).find(x => x != null)
    return n == null || n === j.article_count ? j : { ...j, article_count: n }
  })
}
