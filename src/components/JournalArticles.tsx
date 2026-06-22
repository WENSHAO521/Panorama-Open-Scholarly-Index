'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArticleCard } from './ArticleCard'
import type { Article } from '@/lib/types'

interface Props {
  issn: string | null
  journalCode: string
  initialArticles: Article[]
  initialTotal: number
}

export function JournalArticles({ issn, journalCode, initialArticles, initialTotal }: Props) {
  const [articles, setArticles] = useState<Article[]>(initialArticles)
  const [total, setTotal] = useState(initialTotal)
  const [loading, setLoading] = useState(initialArticles.length === 0 && !!issn)
  const [tried, setTried] = useState(false)

  useEffect(() => {
    if (initialArticles.length > 0 || !issn || tried) return
    setTried(true)
    setLoading(true)

    // Try Crossref journal/works directly from browser
    const url = `https://api.crossref.org/journals/${issn}/works?` +
      `rows=20&sort=published&order=desc&filter=type:journal-article&mailto=posi@panoramagroup.org`

    fetch(url)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const msg = data?.message
        if (!msg) return
        const count: number = msg['total-results'] ?? 0
        const items: Article[] = (msg.items ?? []).map(mapWork)
        if (items.length > 0) {
          setTotal(count)
          setArticles(items)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issn])

  if (loading) {
    return (
      <div className="space-y-3">
        <h2 className="text-sm font-bold" style={{ color: 'var(--posi-text)' }}>Recent Articles</h2>
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white p-4 animate-pulse space-y-2" style={{ border: '1px solid var(--posi-border)' }}>
            <div className="h-3 rounded w-3/4" style={{ background: '#e5e5e5' }} />
            <div className="h-2.5 rounded w-1/2" style={{ background: '#e5e5e5' }} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-bold" style={{ color: 'var(--posi-text)' }}>
        Recent Articles
        {total > 0 && (
          <span className="ml-1.5 font-normal font-mono text-xs" style={{ color: 'var(--posi-muted)' }}>
            {total} total
          </span>
        )}
      </h2>

      {articles.length === 0 ? (
        <div className="bg-white p-8 text-center" style={{ border: '1px solid var(--posi-border)' }}>
          <p className="text-sm" style={{ color: 'var(--posi-muted)' }}>No articles indexed yet.</p>
        </div>
      ) : (
        articles.map(article => (
          <ArticleCard key={article.id} article={article} showAbstract={false} />
        ))
      )}

      {total > 20 && (
        <p className="text-xs text-center" style={{ color: 'var(--posi-muted)' }}>
          Showing 20 of {total} articles ·{' '}
          <Link href={`/search?journal=${journalCode}`} className="hover:underline" style={{ color: 'var(--posi-accent)' }}>
            Browse all →
          </Link>
        </p>
      )}
    </div>
  )
}

// Minimal inline mapper (mirrors mapCrossrefWork in api.ts but runs client-side)
function mapWork(item: Record<string, unknown>): Article {
  const rawTitle = item.title as string | string[]
  const title = Array.isArray(rawTitle) ? rawTitle[0] : (rawTitle ?? '')
  const rawJt = item['container-title'] as string | string[]
  const journalTitle = Array.isArray(rawJt) ? rawJt[0] : (rawJt ?? '')
  const dp = ((item['published-online'] ?? item.issued) as { 'date-parts': number[][] } | undefined)?.['date-parts']?.[0] ?? []
  const year = dp[0] ?? new Date().getFullYear()
  const pubDate = dp.length >= 3
    ? `${dp[0]}-${String(dp[1]).padStart(2, '0')}-${String(dp[2]).padStart(2, '0')}`
    : dp[0] ? String(dp[0]) : null
  const doi = item.DOI as string ?? ''
  const authors = ((item.author ?? []) as Record<string, unknown>[]).map((a, i) => ({
    id: (a.ORCID as string) ?? `${doi}-au-${i}`,
    display_name: [a.given, a.family].filter(Boolean).join(' '),
    given_name: (a.given as string) ?? null,
    family_name: (a.family as string) ?? null,
    orcid: a.ORCID ? (a.ORCID as string).replace('https://orcid.org/', '') : null,
    openalex_author_id: null,
    country: null,
    institution: ((a.affiliation as { name: string }[] | undefined)?.[0]?.name) ?? null,
    is_corresponding: a.sequence === 'first',
    author_order: i + 1,
  }))
  return {
    id: doi,
    doi,
    title,
    subtitle: null,
    journal_id: '',
    journal_title: journalTitle,
    journal_code: '',
    volume: (item.volume as string) ?? null,
    issue: (item.issue as string) ?? null,
    first_page: null,
    last_page: null,
    publication_year: year,
    publication_date: pubDate,
    article_type: 'Research Article',
    language: 'English',
    abstract: null,
    keywords: [],
    license: null,
    pdf_url: null,
    html_url: null,
    openalex_work_id: null,
    crossref_status: 'registered',
    cited_by_count: (item['is-referenced-by-count'] as number) ?? 0,
    reference_count: (item['reference-count'] as number) ?? 0,
    is_retracted: false,
    metadata_quality_score: 40,
    authors,
    created_at: '',
    updated_at: '',
  }
}
