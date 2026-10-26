// OpenAlex indexes few repository records (data sets, software, preprints, reports deposited in Zenodo and other
// DataCite repositories), and new ones late. A text search therefore also asks DataCite and Zenodo for the same
// page, and their records that OpenAlex did not return are mixed into the page.

interface Mergeable {
  doi: string | null
  title: string | null
  publication_year: number | null
  publication_date: string | null
  cited_by_count: number
}

/** At most this many repository records are added to a search page (a journal's listing takes them all). */
export const MAX_ADDED = 6
/** For relevance order, one repository record after every this many OpenAlex results. */
const EVERY = 3

const doiKey = (doi: string | null) => doi?.replace(/^https?:\/\/(dx\.)?doi\.org\//, '').toLowerCase() || null
const titleKey = (w: Mergeable) => {
  const t = (w.title ?? '').toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
  return t ? `${t}|${w.publication_year ?? ''}` : null
}

/**
 * Repository records missing from the OpenAlex page, merged into it. Lists are taken in turn (the first list's
 * first record, then the second list's first, ...), so each registry gets a share. A record counts as present
 * when its DOI, or its title and year, match one already on the page: Zenodo deposits are registered with
 * DataCite too, and each version of a deposit has its own DOI. Newest-first and most-cited pages keep their order;
 * a relevance page places one repository record after every few OpenAlex results.
 */
export function mergeRepositories<T extends Mergeable>(
  base: T[], lists: T[][], sort: 'relevance' | 'newest' | 'cited', max = MAX_ADDED,
): { results: T[]; added: number } {
  const seen = new Set<string>()
  const mark = (w: T) => {
    const d = doiKey(w.doi), t = titleKey(w)
    if ((d && seen.has(d)) || (t && seen.has(t))) return false
    if (d) seen.add(d)
    if (t) seen.add(t)
    return true
  }
  base.forEach(mark)
  const extra: T[] = []
  for (let i = 0; extra.length < max && lists.some(l => i < l.length); i++) {
    for (const l of lists) if (i < l.length && extra.length < max && l[i].title && mark(l[i])) extra.push(l[i])
  }
  if (!extra.length) return { results: base, added: 0 }
  if (sort === 'newest') {
    const results = [...base, ...extra].sort((a, b) => (b.publication_date ?? '').localeCompare(a.publication_date ?? ''))
    return { results, added: extra.length }
  }
  if (sort === 'cited') {
    const results = [...base, ...extra].sort((a, b) => b.cited_by_count - a.cited_by_count)
    return { results, added: extra.length }
  }
  const results: T[] = []
  let next = 0
  base.forEach((w, i) => {
    results.push(w)
    if ((i + 1) % EVERY === 0 && next < extra.length) results.push(extra[next++])
  })
  return { results: [...results, ...extra.slice(next)], added: extra.length }
}
