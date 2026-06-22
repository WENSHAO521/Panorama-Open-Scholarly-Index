'use client'

import Link from 'next/link'
import { ArrowSquareOut } from '@phosphor-icons/react/dist/ssr'
import type { Article } from '@/lib/types'
import { Badge, mqsVariant, mqsLabel } from './Badge'
import { clsx } from 'clsx'

const CROSSREF_VARIANT = {
  verified: 'verified' as const,
  registered: 'registered' as const,
  pending: 'pending' as const,
  not_found: 'not_found' as const,
  conflict: 'conflict' as const,
  broken: 'broken' as const,
}

interface ArticleCardProps {
  article: Article
  showAbstract?: boolean
  className?: string
}

export function ArticleCard({ article, showAbstract = true, className }: ArticleCardProps) {

  const citationLine = [
    article.journal_title ? <em key="jt">{article.journal_title}</em> : null,
    article.volume ? `. ${article.publication_year};${article.volume}` : `. ${article.publication_year}`,
    article.issue ? `(${article.issue})` : null,
    article.first_page ? `:${article.first_page}${article.last_page ? `–${article.last_page}` : ''}` : null,
  ]

  return (
    <article
      className={clsx('bg-white border-l-4 p-4', className)}
      style={{ border: '1px solid var(--posi-border)', borderLeftColor: 'var(--posi-border)', transition: 'border-left-color 0.15s' }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderLeftColor = 'var(--posi-accent)')}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderLeftColor = 'var(--posi-border)')}
    >
      {/* Title — always links to journal's own article page */}
      <a
        href={article.html_url ?? `https://doi.org/${article.doi}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[14.5px] font-semibold leading-snug block mb-1.5 transition-colors"
        style={{ color: 'var(--posi-text)' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--posi-primary)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--posi-text)')}
      >
        {article.title}
      </a>

      {/* Authors */}
      {article.authors.length > 0 && (
        <p className="text-[13px] mb-1 leading-snug" style={{ color: 'var(--posi-muted)' }}>
          {article.authors.map((a, i) => (
            <span key={a.id}>
              {i > 0 && '; '}
              <span className={a.is_corresponding ? 'font-medium' : ''}>
                {a.family_name && a.given_name
                  ? `${a.family_name}, ${a.given_name.charAt(0)}.`
                  : a.display_name}
              </span>
            </span>
          ))}
        </p>
      )}

      {/* Citation line */}
      <p className="text-[12.5px] mb-2 leading-snug" style={{ color: 'var(--posi-muted)' }}>
        {citationLine}
        {article.doi && (
          <>
            {' · '}
            <a
              href={`https://doi.org/${article.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline inline-flex items-center gap-0.5"
              style={{ color: 'var(--posi-accent)' }}
            >
              {article.doi}
              <ArrowSquareOut className="h-2.5 w-2.5" />
            </a>
          </>
        )}
      </p>

      {/* Abstract */}
      {showAbstract && article.abstract && (
        <p className="text-[12.5px] line-clamp-3 leading-relaxed mb-2.5" style={{ color: 'var(--posi-muted)' }}>
          {article.abstract}
        </p>
      )}

      {/* Keywords */}
      {article.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {article.keywords.slice(0, 5).map(kw => (
            <Link
              key={kw}
              href={`/search?q=${encodeURIComponent(kw)}`}
              className="text-[11px] px-1.5 py-0.5 transition-colors"
              style={{ background: 'var(--posi-bg)', color: 'var(--posi-muted)' }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--posi-accent-light)'
                e.currentTarget.style.color = 'var(--posi-accent)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--posi-bg)'
                e.currentTarget.style.color = 'var(--posi-muted)'
              }}
            >
              {kw}
            </Link>
          ))}
        </div>
      )}

      {/* Footer metadata row */}
      <div className="flex flex-wrap items-center gap-1.5 text-[11px] pt-2" style={{ borderTop: '1px solid var(--posi-border-light)', color: 'var(--posi-muted)' }}>
        <Badge label="OA" variant="oa" />
        {article.license && <Badge label={article.license} variant="license" />}
        {article.crossref_status && (
          <Badge
            label={`Crossref: ${article.crossref_status.replace('_', ' ')}`}
            variant={CROSSREF_VARIANT[article.crossref_status] || 'default'}
          />
        )}
        <Badge
          label={`MQS ${article.metadata_quality_score} — ${mqsLabel(article.metadata_quality_score)}`}
          variant={mqsVariant(article.metadata_quality_score)}
        />
        {article.cited_by_count > 0 && (
          <span style={{ color: 'var(--posi-muted)' }}>
            {article.cited_by_count} cited
          </span>
        )}
        <span className="ml-auto uppercase tracking-wide text-[10px]" style={{ color: 'var(--posi-border)' }}>
          {article.article_type.replace(/_/g, ' ')}
        </span>
      </div>
    </article>
  )
}
