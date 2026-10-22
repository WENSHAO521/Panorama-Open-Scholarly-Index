// A journal's newest articles reach Crossref the day the publisher deposits them; OpenAlex picks them up
// days to weeks later. For a journal's "newest first" listing, articles Crossref already has but OpenAlex
// does not are added to the first page so the listing is current.

interface Dated { doi: string | null; publication_date: string | null }

const doiKey = (doi: string | null) => doi?.replace(/^https?:\/\/doi\.org\//, '').toLowerCase() ?? null

/**
 * Crossref works missing from OpenAlex's first page, merged into it newest first. Only works dated no
 * earlier than the oldest work on the OpenAlex page are added: older ones belong on later pages, where
 * OpenAlex most likely already has them. Returns how many were added.
 */
export function mergeNewest<T extends Dated>(openalex: T[], crossref: T[], perPage: number): { results: T[]; added: number } {
  const seen = new Set(openalex.map(w => doiKey(w.doi)).filter(Boolean))
  const full = openalex.length >= perPage
  const floor = full ? openalex.reduce((m, w) => (w.publication_date && w.publication_date < m ? w.publication_date : m), '9999') : ''
  const extra = crossref.filter(w => {
    const k = doiKey(w.doi)
    return k && !seen.has(k) && w.publication_date && w.publication_date >= floor && (seen.add(k), true)
  })
  if (!extra.length) return { results: openalex, added: 0 }
  const results = [...openalex, ...extra].sort((a, b) => (b.publication_date ?? '').localeCompare(a.publication_date ?? ''))
  return { results, added: extra.length }
}
