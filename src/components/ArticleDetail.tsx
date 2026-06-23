'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowSquareOut, BookOpen, User, Buildings, Hash, Quotes, FileText, Calendar, Globe, Medal } from '@phosphor-icons/react/dist/ssr'
import { crossrefGetWork, openAlexGetWork, rorMatchAffiliation, crossrefGetReferences } from '@/lib/api'
import { Badge, mqsVariant, mqsLabel } from './Badge'
import { MetadataQualityBar } from './MetadataQualityBar'
import type { Article, Reference, RorOrganization } from '@/lib/types'
import { decodeHtml } from '@/lib/utils'

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-gray-100 animate-pulse ${className ?? ''}`} />
}

function LoadingSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
      <Skeleton className="h-3 w-48" />
      <div className="bg-white border border-gray-200 p-5 space-y-4">
        <div className="flex gap-2"><Skeleton className="h-5 w-10" /><Skeleton className="h-5 w-20" /></div>
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-full" />
      </div>
      <div className="grid md:grid-cols-3 gap-5">
        <div className="md:col-span-2 space-y-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-20" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-28" />
        </div>
      </div>
    </div>
  )
}

export function ArticleDetail({ doiSlug, initialArticle, fallbackJournalUrl }: { doiSlug: string; initialArticle?: Article | null; fallbackJournalUrl?: string | null }) {
  const doi = doiSlug.replace(/_/g, '/')
  // When server pre-fetches data (static generation), use it immediately
  const hasServerData = initialArticle !== undefined
  const [article, setArticle] = useState<Article | null>(initialArticle ?? null)
  const [loading, setLoading] = useState(!hasServerData)
  const [error, setError] = useState(hasServerData && !initialArticle)
  const [rorMap, setRorMap] = useState<Record<string, RorOrganization>>({})
  const [references, setReferences] = useState<Reference[]>([])
  const [refsLoading, setRefsLoading] = useState(false)

  function doRorLookup(art: Article) {
    const institutions = [...new Set(
      (art.authors ?? []).map(a => a.institution).filter(Boolean) as string[]
    )]
    if (institutions.length === 0) return
    Promise.all(institutions.map(async inst => [inst, await rorMatchAffiliation(inst)] as const))
      .then(pairs => {
        const map: Record<string, RorOrganization> = {}
        pairs.forEach(([inst, org]) => { if (org) map[inst] = org })
        setRorMap(map)
      })
      .catch(() => {})
  }

  useEffect(() => {
    if (hasServerData) {
      if (initialArticle) {
        doRorLookup(initialArticle)
        if (initialArticle.reference_count > 0) {
          setRefsLoading(true)
          crossrefGetReferences(doi).then(setReferences).catch(() => {}).finally(() => setRefsLoading(false))
        }
      }
      return
    }
    setLoading(true)
    setError(false)
    Promise.all([
      crossrefGetWork(doi),
      openAlexGetWork(doi).catch(() => null),
    ]).then(([cr, oa]) => {
      if (!cr) { setError(true); return }
      if (oa) {
        if (oa.cited_by_count > cr.cited_by_count) cr.cited_by_count = oa.cited_by_count
        if (oa.keywords.length > 0) cr.keywords = oa.keywords
        if (!cr.abstract && oa.abstract) cr.abstract = oa.abstract
        if (oa.id) cr.openalex_work_id = oa.id.replace('https://openalex.org/', '')
      }
      setArticle(cr)
      doRorLookup(cr)
      if (cr.reference_count > 0) {
        setRefsLoading(true)
        crossrefGetReferences(doi).then(setReferences).catch(() => {}).finally(() => setRefsLoading(false))
      }
    }).catch(() => setError(true)).finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doi])

  if (loading) return <LoadingSkeleton />

  if (error || !article) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-gray-500 font-medium mb-2">Article not found</p>
        <p className="text-xs text-gray-400 mb-4">DOI: {doi}</p>
        <div className="flex flex-col items-center gap-3">
          {fallbackJournalUrl && (
            <a
              href={fallbackJournalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-white bg-[#c41e3a] px-4 py-2 hover:bg-[#a01830] transition-colors inline-flex items-center gap-1.5"
            >
              View on Journal Website <ArrowSquareOut className="h-3.5 w-3.5" />
            </a>
          )}
          <a
            href={`https://doi.org/${doi}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[#c41e3a] hover:underline inline-flex items-center gap-1"
          >
            Try resolving on doi.org <ArrowSquareOut className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    )
  }

  const mqs = article.metadata_quality_score

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
      {/* Breadcrumb */}
      <nav className="text-xs text-gray-400 flex items-center gap-1.5">
        <Link href="/" className="hover:text-gray-700 transition-colors">Home</Link>
        <span>/</span>
        <Link href="/search" className="hover:text-gray-700 transition-colors">Search</Link>
        <span>/</span>
        <span className="text-gray-600 truncate max-w-xs">{decodeHtml(article.title)}</span>
      </nav>

      {/* Header */}
      <div className="bg-white border border-gray-200 p-5 space-y-4">
        <div className="flex flex-wrap gap-1.5">
          <Badge label="OA" variant="oa" />
          {article.license && <Badge label={article.license} variant="license" />}
          {article.crossref_status && (
            <Badge
              label={`Crossref: ${article.crossref_status.replace('_', ' ')}`}
              variant={article.crossref_status}
            />
          )}
          <Badge label={article.article_type} variant="default" />
        </div>

        <h1 className="text-lg md:text-xl font-bold text-gray-900 leading-tight">{decodeHtml(article.title)}</h1>

        {/* Authors */}
        {article.authors.length > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {article.authors.map(author => (
              <div key={author.id} className="flex items-center gap-1.5 text-sm">
                <User className="h-3.5 w-3.5 text-gray-400" />
                <span className={author.is_corresponding ? 'font-medium text-gray-900' : 'text-gray-700'}>
                  {author.display_name}
                </span>
                {author.orcid && (
                  <a
                    href={`https://orcid.org/${author.orcid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-600 hover:underline flex items-center gap-0.5"
                  >
                    ORCID <ArrowSquareOut className="h-2.5 w-2.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Institutions */}
        {article.authors.some(a => a.institution) && (
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {article.authors
              .filter((a, i, arr) => a.institution && arr.findIndex(x => x.institution === a.institution) === i)
              .map(a => {
                const ror = rorMap[a.institution!]
                return (
                  <div key={a.institution} className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Buildings className="h-3.5 w-3.5 text-gray-400" />
                    <span>{a.institution}</span>
                    {ror && (
                      <a
                        href={ror.id}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`${ror.name} · ${ror.country} · ROR`}
                        className="inline-flex items-center gap-0.5 text-[10px] font-mono font-semibold px-1.5 py-0.5 transition-colors hover:opacity-80"
                        style={{ background: '#f0f9f4', color: '#1F7A4D', border: '1px solid #bbdece' }}
                      >
                        ROR
                      </a>
                    )}
                  </div>
                )
              })}
          </div>
        )}

        {/* Journal meta */}
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500 pt-3 border-t border-gray-100">
          {article.journal_code && (
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-gray-400" />
              <Link href={`/journal/${article.journal_code}`} className="text-[#c41e3a] hover:underline">
                {article.journal_title}
              </Link>
            </span>
          )}
          {!article.journal_code && article.journal_title && (
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-gray-400" />
              {article.journal_title}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-gray-400" />
            {article.publication_date || article.publication_year}
          </span>
          {article.volume && (
            <span>
              Vol.{article.volume}
              {article.issue ? ` No.${article.issue}` : ''}
              {article.first_page ? ` · pp.${article.first_page}–${article.last_page ?? ''}` : ''}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 text-gray-400" />
            {article.language}
          </span>
        </div>

        {/* Links */}
        <div className="flex flex-wrap gap-4 text-xs">
          <a
            href={`https://doi.org/${article.doi}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[#c41e3a] hover:underline"
          >
            <Hash className="h-3.5 w-3.5" />
            https://doi.org/{article.doi}
            <ArrowSquareOut className="h-3 w-3" />
          </a>
          {article.pdf_url && (
            <a href={article.pdf_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[#c41e3a] hover:underline">
              <FileText className="h-3.5 w-3.5" />PDF<ArrowSquareOut className="h-3 w-3" />
            </a>
          )}
          {article.html_url && (
            <a href={article.html_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[#c41e3a] hover:underline">
              Full Text<ArrowSquareOut className="h-3 w-3" />
            </a>
          )}
          <a
            href={`/cite?doi=${encodeURIComponent(article.doi)}`}
            className="flex items-center gap-1 text-[#c41e3a] hover:underline"
          >
            <Quotes className="h-3.5 w-3.5" />
            Generate Citation
          </a>
        </div>
      </div>

      {/* Two columns */}
      <div className="grid md:grid-cols-3 gap-5">
        <div className="md:col-span-2 space-y-4">
          {article.abstract && (
            <div className="bg-white border border-gray-200 p-5">
              <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.12em] mb-3">Abstract</h2>
              <p className="text-sm text-gray-700 leading-relaxed">{decodeHtml(article.abstract)}</p>
            </div>
          )}

          {article.keywords.length > 0 && (
            <div className="bg-white border border-gray-200 p-5">
              <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.12em] mb-3">Keywords</h2>
              <div className="flex flex-wrap gap-1.5">
                {article.keywords.map(kw => (
                  <Link
                    key={kw}
                    href={`/search?q=${encodeURIComponent(kw)}`}
                    className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs hover:bg-[#fef2f2] hover:text-[#c41e3a] transition-colors"
                  >
                    {kw}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* References */}
          {(refsLoading || references.length > 0 || article.reference_count > 0) && (
            <div className="bg-white border border-gray-200 p-5">
              <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.12em] mb-3 flex items-center gap-2">
                References
                {article.reference_count > 0 && (
                  <span className="font-mono font-normal text-gray-400">({article.reference_count})</span>
                )}
              </h2>

              {refsLoading && (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-3 bg-gray-100 rounded w-full mb-1" />
                      <div className="h-3 bg-gray-100 rounded w-2/3" />
                    </div>
                  ))}
                </div>
              )}

              {!refsLoading && references.length === 0 && article.reference_count > 0 && (
                <p className="text-xs text-gray-400">
                  Reference metadata not deposited with Crossref for this article.
                </p>
              )}

              {!refsLoading && references.length > 0 && (
                <ol className="space-y-3">
                  {references.map((ref, i) => (
                    <li key={ref.key} className="flex gap-3 text-[12px]">
                      <span className="text-[10px] font-mono text-gray-300 shrink-0 pt-0.5 w-5 text-right leading-tight">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        {(ref.title || ref.author || ref.year) ? (
                          <p className="leading-snug text-gray-700">
                            {ref.author && <span className="font-medium">{ref.author}</span>}
                            {ref.author && ref.year && '. '}
                            {!ref.author && ref.year && ''}
                            {ref.year && `(${ref.year}). `}
                            {ref.title && <em className="not-italic font-medium">{ref.title}. </em>}
                            {ref.journal && <span className="italic">{ref.journal}</span>}
                            {ref.volume && `, ${ref.volume}`}
                            {ref.issue && `(${ref.issue})`}
                            {ref.first_page && `:${ref.first_page}`}
                            {!ref.title && !ref.author && !ref.journal && ref.unstructured && (
                              <span className="text-gray-600">{ref.unstructured}</span>
                            )}
                          </p>
                        ) : ref.unstructured ? (
                          <p className="leading-snug text-gray-600">{ref.unstructured}</p>
                        ) : null}
                        {ref.doi && (
                          <a
                            href={`https://doi.org/${ref.doi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10.5px] text-[#c41e3a] hover:underline inline-flex items-center gap-0.5 mt-0.5"
                          >
                            {ref.doi} <ArrowSquareOut className="h-2.5 w-2.5" />
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 p-4">
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.12em] mb-3 flex items-center gap-1.5">
              <Quotes className="h-3.5 w-3.5" />
              Citation Visibility
            </h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Open Citations</span>
                <span className="font-semibold font-mono text-gray-900">{article.cited_by_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">References</span>
                <span className="font-semibold font-mono text-gray-900">{article.reference_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">OpenAlex</span>
                <span className={article.openalex_work_id ? 'text-emerald-600 font-medium' : 'text-gray-300'}>
                  {article.openalex_work_id ? 'Indexed' : 'Not indexed'}
                </span>
              </div>
              {article.openalex_work_id && (
                <a
                  href={`https://openalex.org/works/${article.openalex_work_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-[11px] text-[#c41e3a] hover:underline mt-1"
                >
                  View on OpenAlex →
                </a>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-4">
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.12em] mb-3 flex items-center gap-1.5">
              <Medal className="h-3.5 w-3.5" />
              Metadata Quality
            </h2>
            <div className="mb-3">
              <div className="flex justify-between items-baseline mb-1.5">
                <span className="text-2xl font-bold font-mono text-gray-900">{mqs}</span>
                <span className="text-xs text-gray-400">/ 100</span>
              </div>
              <Badge label={mqsLabel(mqs)} variant={mqsVariant(mqs)} />
            </div>
            <MetadataQualityBar score={mqs} showLabel={false} />
          </div>

          <div className="bg-white border border-gray-200 p-4">
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.12em] mb-3">Actions</h2>
            <div className="space-y-1.5">
              <Link
                href={`/cite?doi=${encodeURIComponent(article.doi)}`}
                className="flex items-center justify-between w-full text-xs text-[#c41e3a] border border-[#c41e3a]/20 px-3 py-2 hover:bg-[#fef2f2] transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Quotes className="h-3.5 w-3.5" />
                  Generate Citation
                </span>
                <span>→</span>
              </Link>
              <Link
                href={`/doi-lookup?doi=${encodeURIComponent(article.doi)}`}
                className="flex items-center justify-between w-full text-xs text-gray-500 border border-gray-200 px-3 py-2 hover:bg-gray-50 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5" />
                  DOI Status Check
                </span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
