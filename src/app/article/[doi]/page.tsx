import { cache } from 'react'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { crossrefSearch, crossrefGetWork, openAlexGetWork, crossrefHarvestJournal, oaiHarvestJournal } from '@/lib/api'
import { PSG_JOURNALS, ALL_JOURNALS, getJournalByCode } from '@/lib/data'
import type { Article } from '@/lib/types'
import { ArticleDetail } from '@/components/ArticleDetail'

// Extract PSG journal code from DOI (e.g. 10.63802/grhas.v1.i1.7 → 'grhas')
function journalCodeFromDoi(doi: string): string | null {
  const m = doi.match(/10\.\d{5}\/([a-z]+)[.\-]/i)
  return m ? m[1].toLowerCase() : null
}

// Deduplicates fetch across generateMetadata + page render for the same DOI
const fetchArticle = cache(async (realDoi: string): Promise<Article | null> => {
  const [cr, oa] = await Promise.all([
    crossrefGetWork(realDoi).catch(() => null),
    openAlexGetWork(realDoi).catch(() => null),
  ])

  if (cr) {
    if (oa) {
      if (oa.cited_by_count > cr.cited_by_count) cr.cited_by_count = oa.cited_by_count
      if (oa.keywords.length > 0) cr.keywords = oa.keywords
      if (!cr.abstract && oa.abstract) cr.abstract = oa.abstract
      if (oa.id) cr.openalex_work_id = oa.id.replace('https://openalex.org/', '')
    }
    return cr as Article
  }

  // Crossref failed — try OAI harvest for the journal
  const code = journalCodeFromDoi(realDoi)
  if (code) {
    const oaiItems = await oaiHarvestJournal(code).catch(() => [])
    const found = oaiItems.find(a => a.doi.toLowerCase() === realDoi.toLowerCase())
    if (found) return found
  }

  return null
})

export async function generateStaticParams(): Promise<{ doi: string }[]> {
  const doiSet = new Set<string>()

  // Strategy 1: OAI per-journal harvest (primary — all indexed journals)
  await Promise.allSettled(
    ALL_JOURNALS.map(j =>
      oaiHarvestJournal(j.journal_code)
        .then(items => items.forEach(a => { if (a.doi) doiSet.add(a.doi.replace(/\//g, '_')) }))
        .catch(() => {})
    )
  )

  // Strategy 2: Crossref PSG member endpoint (supplement)
  try {
    const { items } = await crossrefSearch('', { rows: 250, scope: 'psg' })
    items.forEach(a => doiSet.add(a.doi.replace(/\//g, '_')))
  } catch {}

  // Strategy 3: Per-journal Crossref harvest (final fallback)
  if (doiSet.size === 0) {
    await Promise.allSettled(
      PSG_JOURNALS
        .filter(j => j.issn_online)
        .map(j =>
          crossrefHarvestJournal(j.issn_online!)
            .then(items => items.forEach(a => doiSet.add(a.doi.replace(/\//g, '_'))))
            .catch(() => {})
        )
    )
  }

  return Array.from(doiSet).map(doi => ({ doi }))
}

export async function generateMetadata(
  props: { params: Promise<{ doi: string }> }
): Promise<Metadata> {
  const { doi } = await props.params
  const article = await fetchArticle(doi.replace(/_/g, '/'))
  if (!article) return { title: doi.replace(/_/g, '/') }

  const journal = article.journal_code ? getJournalByCode(article.journal_code) : undefined
  const authorNames = article.authors.map(a => a.display_name).filter(Boolean)

  return {
    title: article.title,
    description: article.abstract?.slice(0, 200) ?? `${article.journal_title} · ${article.publication_year}`,
    other: {
      citation_title: article.title,
      citation_doi: article.doi,
      citation_publication_date: article.publication_date || String(article.publication_year),
      citation_journal_title: article.journal_title ?? '',
      citation_language: article.language ?? 'en',
      ...(journal?.issn_online ? { citation_issn: journal.issn_online } : {}),
      ...(authorNames.length > 0 ? { citation_author: authorNames } : {}),
      ...(article.volume ? { citation_volume: article.volume } : {}),
      ...(article.issue ? { citation_issue: article.issue } : {}),
      ...(article.first_page ? { citation_firstpage: article.first_page } : {}),
      ...(article.last_page ? { citation_lastpage: article.last_page } : {}),
      ...(article.pdf_url ? { citation_pdf_url: article.pdf_url } : {}),
      ...(article.html_url ? { citation_abstract_html_url: article.html_url } : {}),
    },
  }
}

export default async function ArticlePage(props: { params: Promise<{ doi: string }> }) {
  const { doi } = await props.params
  const realDoi = doi.replace(/_/g, '/')
  const article = await fetchArticle(realDoi)

  // If article not found anywhere, redirect to doi.org (resolves to journal's article page)
  if (!article) {
    redirect(`https://doi.org/${realDoi}`)
  }

  const fallbackJournalUrl: string | null = null

  const jsonLd = article ? {
    '@context': 'https://schema.org',
    '@type': 'ScholarlyArticle',
    headline: article.title,
    identifier: `https://doi.org/${article.doi}`,
    datePublished: article.publication_date || String(article.publication_year),
    ...(article.abstract ? { abstract: article.abstract } : {}),
    ...(article.journal_title ? { isPartOf: { '@type': 'Periodical', name: article.journal_title } } : {}),
    ...(article.authors?.length > 0 ? {
      author: article.authors.map(a => ({
        '@type': 'Person',
        name: a.display_name,
        ...(a.orcid ? { identifier: `https://orcid.org/${a.orcid}` } : {}),
      }))
    } : {}),
  } : null

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ArticleDetail doiSlug={doi} initialArticle={article} fallbackJournalUrl={fallbackJournalUrl} />
    </>
  )
}
