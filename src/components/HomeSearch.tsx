'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'
import { MagnifyingGlass } from '@phosphor-icons/react/dist/ssr'
import { extractDoi } from '@/lib/utils'
import { getTotalWorks, getTotalJournals } from '@/lib/openalex'
import { OPENALEX_TOTALS } from '@/lib/openalex-totals'
import { useLocale, useMessages } from '@/i18n/LocaleProvider'
import { localizedHref } from '@/i18n/alternates'
import { fill } from '@/i18n/format'

const SCOPES = ['sources', 'publications', 'publishers'] as const
type Scope = typeof SCOPES[number]

export function HomeSearch() {
  const router = useRouter()
  const locale = useLocale()
  const { search: t } = useMessages()
  const [q, setQ] = useState('')
  const [scope, setScope] = useState<Scope>('sources')
  const active = t.scopes[scope]
  const go = (href: string) => router.push(localizedHref(locale, href))

  function submit(e: FormEvent) {
    e.preventDefault()
    const v = q.trim()
    const enc = encodeURIComponent(v)
    if (scope === 'publications') {
      const doi = v ? extractDoi(v) : null
      go(doi ? `/work/?id=${encodeURIComponent(doi)}` : v ? `/publications/?q=${enc}` : '/publications/')
    } else if (scope === 'sources') {
      go(v ? `/journals/?q=${enc}` : '/journals/')
    } else {
      go('/publishers/')
    }
  }

  return (
    <div className="w-full">
      <div role="tablist" aria-label={t.scopeLabel} className="inline-flex gap-1 p-1 mb-3 rounded-[var(--radius-lg)]" style={{ background: 'var(--surface-2)' }}>
        {SCOPES.map(s => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={scope === s}
            onClick={() => setScope(s)}
            className="h-8 px-4 rounded-[var(--radius)] text-[13.5px] font-medium transition-colors"
            style={scope === s
              ? { background: 'var(--surface)', color: 'var(--ink)', boxShadow: 'var(--posi-shadow-card), 0 0 0 1px var(--line)' }
              : { color: 'var(--muted)' }}
          >
            {t.scopes[s].label}
          </button>
        ))}
      </div>
      <form onSubmit={submit} role="search" className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <label htmlFor="home-search" className="sr-only">{fill(t.searchIn, { scope: locale === 'en' ? active.label.toLowerCase() : active.label })}</label>
          <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 pointer-events-none" style={{ color: 'var(--soft)' }} />
          <input
            id="home-search"
            type="search"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder={active.placeholder}
            className="input h-[52px] pl-12 text-[16px] rounded-[var(--radius-lg)]"
            style={{ boxShadow: 'var(--posi-shadow-card)' }}
          />
        </div>
        <button type="submit" className="btn btn-primary h-[52px] px-8 text-[15px] rounded-[var(--radius-lg)]">{t.submit}</button>
      </form>
    </div>
  )
}

/** Live total of works in OpenAlex; shows the round figure until it arrives, or if it never does. */
export function LiveWorksCount() {
  const { search: t } = useMessages()
  const [n, setN] = useState<number | null>(null)
  useEffect(() => {
    const c = new AbortController()
    getTotalWorks(c.signal).then(setN).catch(() => { if (!c.signal.aborted) setN(-1) })
    return () => c.abort()
  }, [])
  const snap = OPENALEX_TOTALS.works
  return n === null || n === -1 ? (n === -1 && snap ? <>{snap.toLocaleString('en-US')}</> : <>{t.worksFallback}</>) : <>{n.toLocaleString('en-US')}</>
}

/** Live total of journals in OpenAlex (every one is indexed by POSI). */
export function LiveJournalsCount() {
  const { search: t } = useMessages()
  const [n, setN] = useState<number | null>(null)
  useEffect(() => {
    const c = new AbortController()
    getTotalJournals(c.signal).then(setN).catch(() => { if (!c.signal.aborted && OPENALEX_TOTALS.journals) setN(OPENALEX_TOTALS.journals) })
    return () => c.abort()
  }, [])
  return n === null
    ? <span className="inline-block h-6 w-24 align-middle rounded-[var(--radius)] animate-pulse" style={{ background: 'var(--surface-3)' }} aria-label={t.loading} />
    : <>{n.toLocaleString('en-US')}</>
}
