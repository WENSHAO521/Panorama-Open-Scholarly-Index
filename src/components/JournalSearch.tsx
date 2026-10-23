'use client'

// Search across every indexed journal by title, ISSN or OpenAlex id, over
// POSI's own journal index (no registry calls). Curated POSI records
// (Core Collection and others) are marked.

import Link from 'next/link'
import { PosiGrades } from './PosiGrades'
import { useEffect, useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MagnifyingGlass } from '@phosphor-icons/react/dist/ssr'
import { searchJournals, type JournalHit } from '@/lib/journal-search'
import { journalHref } from '@/lib/journal-profile'
import { usePosiIssnMap, matchIssn } from '@/lib/use-posi-issn'
import { fmt } from './db'
import type { Locale } from '@/i18n/config'
import { useLocale } from '@/i18n/LocaleProvider'
import { localizedHref } from '@/i18n/alternates'
import { fill } from '@/i18n/format'

const en = {
  label: 'Search all journals',
  placeholder: 'Journal title or ISSN',
  submit: 'Search',
  results: 'Journal search results',
  error: 'The journal index could not be loaded. Check your connection and try again.',
  none: 'No indexed journal matches “{q}”. Try another word from the title, or an ISSN.',
  top: 'Top {shown} of {total} journals, closest title matches first. Add words to narrow the search.',
  one: '1 journal',
  many: '{n} journals',
  works: '{n} works',
  openAccess: 'Open access',
}
const WORDS: Record<Locale, typeof en> = {
  en,
  'zh-Hans': {
    label: '检索全部期刊',
    placeholder: '期刊名称或 ISSN',
    submit: '检索',
    results: '期刊检索结果',
    error: '期刊索引加载失败，请检查网络连接后重试。',
    none: '没有与“{q}”匹配的收录期刊。请尝试题名中的其他词语，或输入 ISSN。',
    top: '共 {total} 种期刊，显示题名最接近的前 {shown} 种。增加检索词可缩小范围。',
    one: '1 种期刊',
    many: '{n} 种期刊',
    works: '{n} 篇文献',
    openAccess: '开放获取',
  },
}

export function JournalSearch() {
  const router = useRouter()
  const locale = useLocale()
  const w = WORDS[locale]
  const params = useSearchParams()
  const q = params.get('q') ?? ''
  const [draft, setDraft] = useState({ for: q, v: q })
  const value = draft.for === q ? draft.v : q
  const [result, setResult] = useState<{ q: string; hits: JournalHit[]; total: number; error?: boolean } | null>(null)
  const issnMap = usePosiIssnMap()

  useEffect(() => {
    if (!q.trim()) return
    const ctrl = new AbortController()
    searchJournals(q, 50, ctrl.signal)
      .then(r => setResult({ q, ...r }))
      .catch(e => { if (e.name !== 'AbortError') setResult({ q, hits: [], total: 0, error: true }) })
    return () => ctrl.abort()
  }, [q])

  function submit(e: FormEvent) {
    e.preventDefault()
    const v = value.trim()
    router.push(localizedHref(locale, v ? `/journals/?q=${encodeURIComponent(v)}` : '/journals/'), { scroll: false })
  }

  const current = result?.q === q ? result : null

  return (
    <div>
      <form onSubmit={submit} role="search" className="flex flex-col sm:flex-row gap-2 max-w-[760px]">
        <div className="relative flex-1">
          <label htmlFor="journal-q" className="sr-only">{w.label}</label>
          <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 pointer-events-none" style={{ color: 'var(--soft)' }} />
          <input id="journal-q" type="search" value={value} onChange={e => setDraft({ for: q, v: e.target.value })}
            placeholder={w.placeholder} className="input h-12 pl-11 text-[16px] rounded-[var(--radius-lg)]" style={{ boxShadow: 'var(--posi-shadow-card)' }} />
        </div>
        <button type="submit" className="btn btn-primary h-12 px-6 text-[15px] rounded-[var(--radius-lg)]">{w.submit}</button>
      </form>

      {q.trim() && (
        <section aria-label={w.results} className="mt-6">
          {!current && (
            <div className="panel divide-y divide-[var(--line-soft)]" aria-busy="true">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-4 py-3 space-y-2" style={{ borderColor: 'var(--line-soft)' }}>
                  <div className="h-4 w-1/2 rounded-[var(--radius)] animate-pulse" style={{ background: 'var(--surface-3)' }} />
                  <div className="h-3 w-1/3 rounded-[var(--radius)] animate-pulse" style={{ background: 'var(--surface-2)' }} />
                </div>
              ))}
            </div>
          )}
          {current?.error && <p className="text-[14px]" style={{ color: 'var(--check)' }}>{w.error}</p>}
          {current && !current.error && !current.hits.length && (
            <p className="text-[14px]" style={{ color: 'var(--muted)' }}>{fill(w.none, { q })}</p>
          )}
          {!!current?.hits.length && (
            <>
              <p className="mb-2 text-[13px]" style={{ color: 'var(--muted)' }}>
                {current.total > current.hits.length
                  ? fill(w.top, { shown: current.hits.length, total: fmt(current.total) })
                  : current.total === 1 ? w.one : fill(w.many, { n: fmt(current.total) })}
              </p>
              <ul className="panel overflow-hidden">
                {current.hits.map((h, i) => {
                  const curated = matchIssn(issnMap, [h.key])
                  return (
                    <li key={h.key} className="px-5 py-3.5 grid gap-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center" style={i ? { borderTop: '1px solid var(--line-soft)' } : undefined}>
                      <div className="min-w-0">
                        <Link href={localizedHref(locale, journalHref(h.key))} prefetch={false} className="font-medium hover:underline" style={{ color: 'var(--teal)' }}>{h.title}</Link>
                        <p className="text-[12.5px] truncate" style={{ color: 'var(--muted)' }}>
                          {[h.publisher, `ISSN ${h.key}`, h.psc ? `PSC ${h.psc}` : null].filter(Boolean).join(', ')}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[12.5px]" style={{ color: 'var(--muted)' }}>
                        {h.works > 0 && <span className="font-mono tnum">{fill(w.works, { n: fmt(h.works) })}</span>}
                        {h.oa && <span>{w.openAccess}</span>}
                        <PosiGrades tier={curated?.k === 'core' ? 'core' : 'indexed'}
                          ajr={h.ajr} quartile={h.quartile} quartileProvisional={h.status === 'provisional'}
                          zone={h.zone} zoneStatus={h.zoneStatus ?? 'not_assigned'} locale={locale} />
                      </div>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </section>
      )}
    </div>
  )
}
