// Batch conversion for /cite/: turns parsed reference entries (DOIs, BibTeX, RIS,
// CSL JSON or plain reference lines) into Article records, verified against
// Crossref and OpenAlex where possible.

import type { Article } from './types'
import { crossrefGetWork, crossrefGetWorks, crossrefSearch, openAlexGetArticle } from './cite-sources'
import { titleMatches, searchQuery, parsePerson, type RefEntry } from './cite-parse'

/**
 * source: where the metadata came from.
 *  - doi: looked up by the entry's DOI (Crossref or OpenAlex)
 *  - search: found by title/reference text and matched on title (worth a quick look)
 *  - input: the entry's own fields, not verified (BibTeX/RIS/CSL without a findable DOI)
 *  - none: nothing usable
 */
export interface BatchItem {
  entry: RefEntry
  article: Article | null
  source: 'doi' | 'search' | 'input' | 'none'
}

function entryToArticle(e: RefEntry): Article | null {
  if (!e.title) return null
  const [first, last] = (e.pages ?? '').split(/\s*[-–—]+\s*/)
  const year = Number(e.year)
  return {
    id: e.doi ?? e.raw.slice(0, 40), doi: e.doi ?? '', title: e.title, subtitle: null,
    journal_id: '', journal_title: e.journal ?? '', journal_code: '',
    volume: e.volume ?? null, issue: e.issue ?? null,
    first_page: first || null, last_page: last || first || null,
    publication_year: Number.isFinite(year) && year > 0 ? year : new Date().getFullYear(),
    publication_date: null, article_type: 'Article', language: 'English', abstract: null,
    keywords: [], license: null, pdf_url: null, html_url: null, openalex_work_id: null,
    crossref_status: null, cited_by_count: 0, reference_count: 0, is_retracted: false,
    metadata_quality_score: 0, created_at: '', updated_at: '',
    authors: e.authors.map((a, i) => {
      const p = a.family || a.given ? a : parsePerson(a.name ?? '')
      return {
        id: `${i}`, display_name: a.name ?? [p.given, p.family].filter(Boolean).join(' '),
        given_name: p.given ?? null, family_name: p.family ?? null, orcid: null,
        openalex_author_id: null, country: null, institution: null,
        is_corresponding: i === 0, author_order: i + 1,
      }
    }),
  }
}

async function pool<T>(items: T[], size: number, fn: (item: T) => Promise<void>): Promise<void> {
  let next = 0
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, async () => {
    while (next < items.length) await fn(items[next++])
  }))
}

export async function resolveEntries(
  entries: RefEntry[],
  onProgress: (done: number, total: number) => void,
): Promise<BatchItem[]> {
  const items: BatchItem[] = entries.map(entry => ({ entry, article: null, source: 'none' }))
  let done = 0
  const finish = () => onProgress(++done, items.length)

  // 1. Every DOI in a few big Crossref requests.
  const withDoi = items.filter(it => it.entry.doi)
  const found = await crossrefGetWorks(withDoi.map(it => it.entry.doi!))
  const rest: BatchItem[] = []
  for (const it of withDoi) {
    const hit = found.get(it.entry.doi!.toLowerCase())
    if (hit) { it.article = hit; it.source = 'doi'; finish() } else rest.push(it)
  }

  // 2. DOIs Crossref did not return (other registries, odd characters): one by one, OpenAlex as a fallback.
  await pool(rest, 4, async it => {
    const doi = it.entry.doi!
    const a = (await crossrefGetWork(doi)) ?? (await openAlexGetArticle(doi))
    if (a) { it.article = a; it.source = 'doi' }
    else {
      const own = entryToArticle(it.entry)
      if (own) { it.article = own; it.source = 'input' }
    }
    finish()
  })

  // 3. Entries without a DOI: search by title or reference text, accept only a title match.
  const noDoi = items.filter(it => !it.entry.doi)
  await pool(noDoi, 4, async it => {
    const e = it.entry
    const hit = await crossrefSearch(searchQuery(e))
    if (hit && titleMatches(e.source === 'text' ? e.raw : e.title ?? e.raw, hit.title)) {
      it.article = hit; it.source = 'search'
    } else {
      const own = entryToArticle(e)
      if (own) { it.article = own; it.source = 'input' }
    }
    finish()
  })

  return items
}
