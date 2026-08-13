'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { CaretLeft, CaretRight, ArrowRight } from '@phosphor-icons/react/dist/ssr'
import { pageWindow } from '@/lib/pagination'

/**
 * Shared Prev/Next + windowed page-number list + jump-to-page control, for
 * any list built from a fully-known, already-fetched array (client-side
 * slice, real `<Link>` navigation via `makeHref` — not a server refetch
 * per page; see src/app/search/page.tsx for that different case, which
 * intentionally keeps its own button+refetch pagination rather than using
 * this component). Page state lives in the URL (`?page=`), not React
 * state, so a page is directly linkable/shareable and works without JS.
 *
 * Rendered as its own bordered white bar (not bare text on the page's gray
 * background) — a prior version had no background of its own, so it
 * inherited the page's gray directly and its hover states (which lit up
 * to that *same* gray) were invisible. Numbers stay ghost buttons with one
 * solid-fill accent for the current page — no per-item borders — while the
 * jump-to-page control is grouped into a single bordered chip (label,
 * input, submit share one boundary) instead of three loose floating
 * pieces, matching the rest of the site's restrained black/white/red,
 * hairline-divider language.
 */
export function Pagination({
  page,
  totalPages,
  makeHref,
}: {
  page: number
  totalPages: number
  makeHref: (page: number) => string
}) {
  const router = useRouter()
  const [jumpValue, setJumpValue] = useState('')
  if (totalPages <= 1) return null
  const prev = page > 1 ? makeHref(page - 1) : null
  const next = page < totalPages ? makeHref(page + 1) : null

  function handleJumpSubmit(e: React.FormEvent) {
    e.preventDefault()
    const n = parseInt(jumpValue, 10)
    if (!Number.isFinite(n)) return
    const clamped = Math.min(Math.max(1, n), totalPages)
    router.push(makeHref(clamped))
    setJumpValue('')
  }

  function focusGroup(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.closest('form')?.style.setProperty('border-color', 'var(--posi-accent)')
  }
  function blurGroup(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.closest('form')?.style.setProperty('border-color', 'var(--posi-border)')
  }

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 mt-3 px-4 py-2.5"
      style={{ background: 'var(--posi-surface)', border: '1px solid var(--posi-border)' }}
    >
      <div className="flex items-center gap-0.5">
        {prev ? (
          <Link
            href={prev}
            aria-label="Previous page"
            className="tactile flex items-center justify-center h-8 w-8 transition-colors"
            style={{ color: 'var(--posi-text)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--posi-bg)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <CaretLeft className="h-3.5 w-3.5" weight="bold" />
          </Link>
        ) : (
          <span aria-hidden className="flex items-center justify-center h-8 w-8" style={{ color: 'var(--posi-soft)' }}>
            <CaretLeft className="h-3.5 w-3.5" weight="bold" />
          </span>
        )}

        {pageWindow(page, totalPages).map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className="px-1 text-xs font-mono select-none" style={{ color: 'var(--posi-soft)' }}>
              &hellip;
            </span>
          ) : p === page ? (
            <span
              key={p}
              aria-current="page"
              className="flex items-center justify-center h-8 min-w-8 px-1.5 text-xs font-mono font-bold"
              style={{ background: 'var(--posi-accent)', color: '#fff' }}
            >
              {p}
            </span>
          ) : (
            <Link
              key={p}
              href={makeHref(p)}
              className="tactile flex items-center justify-center h-8 min-w-8 px-1.5 text-xs font-mono transition-colors"
              style={{ color: 'var(--posi-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--posi-bg)'; e.currentTarget.style.color = 'var(--posi-text)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--posi-muted)' }}
            >
              {p}
            </Link>
          )
        )}

        {next ? (
          <Link
            href={next}
            aria-label="Next page"
            className="tactile flex items-center justify-center h-8 w-8 transition-colors"
            style={{ color: 'var(--posi-text)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--posi-bg)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <CaretRight className="h-3.5 w-3.5" weight="bold" />
          </Link>
        ) : (
          <span aria-hidden className="flex items-center justify-center h-8 w-8" style={{ color: 'var(--posi-soft)' }}>
            <CaretRight className="h-3.5 w-3.5" weight="bold" />
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-[11px] font-mono hidden sm:inline" style={{ color: 'var(--posi-muted)' }}>
          Page {page.toLocaleString()} of {totalPages.toLocaleString()}
        </span>
        <form onSubmit={handleJumpSubmit} className="flex items-center h-8 transition-colors" style={{ border: '1px solid var(--posi-border)' }}>
          <label htmlFor="pagination-jump" className="pl-2.5 pr-1.5 text-[10px] font-mono uppercase tracking-wide select-none" style={{ color: 'var(--posi-soft)' }}>
            Go to
          </label>
          <input
            id="pagination-jump"
            type="number"
            min={1}
            max={totalPages}
            value={jumpValue}
            onChange={e => setJumpValue(e.target.value)}
            onFocus={focusGroup}
            onBlur={blurGroup}
            placeholder={String(page)}
            className="w-10 h-full px-1 text-xs font-mono text-center focus:outline-none"
            style={{ color: 'var(--posi-text)', background: 'transparent' }}
          />
          <button
            type="submit"
            aria-label="Go to page"
            className="tactile flex items-center justify-center h-full w-8 shrink-0 transition-colors"
            style={{ color: 'var(--posi-accent)', borderLeft: '1px solid var(--posi-border)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--posi-accent-light)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <ArrowRight className="h-3.5 w-3.5" weight="bold" />
          </button>
        </form>
      </div>
    </nav>
  )
}
