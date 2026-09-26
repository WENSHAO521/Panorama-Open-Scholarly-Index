'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowSquareOut, Globe } from '@phosphor-icons/react/dist/ssr'
import { getSource, sourceId, type Source } from '@/lib/openalex'
import { usePosiIssnMap, matchIssn } from '@/lib/use-posi-issn'
import { COLLECTIONS, REGISTRY_TIER, countryName, recordHref } from '@/lib/records'
import { CollectionTag, SectionTitle, Note, fmt } from '@/components/db'

interface CrossrefJournal { title: string; publisher: string | null; issn: string[]; total: number; byYear: [number, number][] }
type State = { kind: 'loading' } | { kind: 'missing' } | { kind: 'error' } | { kind: 'ok'; s: Source } | { kind: 'crossref'; j: CrossrefJournal }

/** Journals registered at Crossref but absent from OpenAlex are indexed too. */
async function crossrefJournal(issn: string, signal: AbortSignal): Promise<CrossrefJournal | null> {
  const r = await fetch(`https://api.crossref.org/journals/${encodeURIComponent(issn)}?mailto=posi@panorama-sg.com`, { signal })
  if (!r.ok) return null
  const m = (await r.json()).message
  return {
    title: m.title, publisher: m.publisher ?? null,
    issn: (m['issn-type'] ?? []).map((x: { value: string }) => x.value),
    total: m.counts?.['total-dois'] ?? 0,
    byYear: [...(m.breakdowns?.['dois-by-issued-year'] ?? [])].sort((a: [number, number], b: [number, number]) => b[0] - a[0]),
  }
}

export function SourceViewer() {
  const sp = useSearchParams()
  const key = (sp.get('id') ?? sp.get('issn') ?? '').trim()
  const [result, setResult] = useState<{ key: string; state: State } | null>(null)
  const state: State = !key ? { kind: 'missing' } : result?.key === key ? result.state : { kind: 'loading' }
  const issnMap = usePosiIssnMap()

  useEffect(() => {
    if (!key) return
    const ctrl = new AbortController()
    const isIssn = /^\d{4}-?\d{3}[\dXx]$/.test(key)
    getSource(key, ctrl.signal)
      .then(async s => {
        if (s && s.type === 'journal') return setResult({ key, state: { kind: 'ok', s } })
        const j = isIssn ? await crossrefJournal(key, ctrl.signal) : null
        setResult({ key, state: j ? { kind: 'crossref', j } : { kind: 'missing' } })
      })
      .catch(e => { if (e.name !== 'AbortError') setResult({ key, state: /404/.test(String(e.message)) ? { kind: 'missing' } : { kind: 'error' } }) })
    return () => ctrl.abort()
  }, [key])

  if (state.kind === 'loading') {
    return (
      <div className="pt-10 space-y-4" aria-busy="true" aria-label="Loading journal">
        <div className="h-4 w-40 rounded-[6px] animate-pulse" style={{ background: 'var(--surface-3)' }} />
        <div className="h-9 w-2/3 rounded-[6px] animate-pulse" style={{ background: 'var(--surface-3)' }} />
        <div className="h-24 rounded-[6px] animate-pulse mt-8" style={{ background: 'var(--surface-2)' }} />
      </div>
    )
  }
  if (state.kind === 'crossref') return <CrossrefView j={state.j} issnMap={issnMap} />

  if (state.kind !== 'ok') {
    return (
      <div className="pt-16 max-w-xl">
        <h1 className="text-[24px] font-semibold">{state.kind === 'error' ? 'Could not load this journal' : 'Journal not found'}</h1>
        <p className="mt-2" style={{ color: 'var(--muted)' }}>
          {state.kind === 'error' ? 'OpenAlex did not answer. It may be rate limiting anonymous requests. Try again shortly.' : `No indexed journal matches "${key}".`}
        </p>
        <Link href="/journals/" className="btn btn-primary mt-6">Search sources</Link>
      </div>
    )
  }

  const s = state.s
  const curated = matchIssn(issnMap, s.issn ?? (s.issn_l ? [s.issn_l] : null))
  const stats = s.summary_stats
  const years = (s.counts_by_year ?? []).filter(y => y.year <= new Date().getFullYear()).slice(0, 8)
  const maxWorks = Math.max(1, ...years.map(y => y.works_count))
  const issnForSearch = s.issn_l ?? s.issn?.[0]

  return (
    <article>
      <header className="pt-8 pb-6 md:pt-10">
        <nav aria-label="Breadcrumb" className="mb-3 text-[12.5px] font-mono" style={{ color: 'var(--muted)' }}>
          <Link href="/journals/" className="hover:underline">Sources</Link>
          <span className="mx-1.5" style={{ color: 'var(--soft)' }}>/</span>
          <span>{sourceId(s)}</span>
        </nav>
        <h1 className="text-[26px] md:text-[32px] font-semibold leading-tight tracking-tight" style={{ color: 'var(--ink)' }}>{s.display_name}</h1>
        <p className="mt-1.5 text-[15px]" style={{ color: 'var(--muted)' }}>
          {[s.host_organization_name, countryName(s.country_code)].filter(Boolean).join(', ')}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {curated?.id && <span className="id-tag">{curated.id}</span>}
          {(s.issn ?? []).map(i => <span key={i} className="id-tag">ISSN {i}</span>)}
          <span className="chip" style={{ color: 'var(--verified)', background: 'var(--verified-soft)', borderColor: 'transparent' }}>Indexed</span>
          {curated?.k === 'core' && <CollectionTag k="core" />}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {issnForSearch && <Link href={`/publications/?issn=${issnForSearch}&sort=newest`} className="btn btn-primary">Publications</Link>}
          <Link href="/certificate/" className="btn">Indexing certificate</Link>
          {s.homepage_url && <a href={s.homepage_url} target="_blank" rel="noopener noreferrer" className="btn"><Globe className="h-4 w-4" /> Website</a>}
          <a href={s.id} target="_blank" rel="noopener noreferrer" className="btn">OpenAlex <ArrowSquareOut className="h-3.5 w-3.5" /></a>
        </div>
      </header>

      {curated ? (
        <div className="mb-8">
          <Note tone="ok">
            POSI also holds a curated record for this journal ({COLLECTIONS[curated.k].label}).{' '}
            <Link href={recordHref(curated)} className="link">Open the POSI record</Link> for identifiers, provenance and POSI indicators.
          </Note>
        </div>
      ) : (
        <div className="mb-8">
          <Note>{REGISTRY_TIER.description} Its publications are indexed and eligible for indexing certificates.</Note>
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-10">
          <section aria-labelledby="registry-stats">
            <SectionTitle id="registry-stats" aside="OpenAlex registry values, not POSI indicators">Coverage</SectionTitle>
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-px rounded-[6px] overflow-hidden" style={{ background: 'var(--line)', border: '1px solid var(--line)' }}>
              {[
                ['Works', fmt(s.works_count)],
                ['Citations', fmt(s.cited_by_count)],
                ['h-index', fmt(stats?.h_index)],
                ['2-yr mean citedness', stats?.['2yr_mean_citedness'] != null ? stats['2yr_mean_citedness']!.toFixed(2) : 'n/a'],
              ].map(([l, v]) => (
                <div key={l} className="p-4" style={{ background: 'var(--surface)' }}>
                  <dt className="text-[12.5px]" style={{ color: 'var(--muted)' }}>{l}</dt>
                  <dd className="mt-1 font-mono text-[20px] tnum">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          {years.length > 0 && (
            <section aria-labelledby="by-year">
              <SectionTitle id="by-year">Works per year</SectionTitle>
              <ul className="space-y-1.5">
                {years.map(y => (
                  <li key={y.year} className="grid grid-cols-[48px_minmax(0,1fr)_80px] items-center gap-3 text-[13px]">
                    <span className="font-mono" style={{ color: 'var(--muted)' }}>{y.year}</span>
                    <span className="h-2 rounded-[2px]" style={{ width: `${Math.max(1, (y.works_count / maxWorks) * 100)}%`, background: 'var(--teal)' }} />
                    <span className="font-mono tnum text-right">{fmt(y.works_count)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!!s.topics?.length && (
            <section aria-labelledby="topics">
              <SectionTitle id="topics">Main topics</SectionTitle>
              <ul className="flex flex-wrap gap-2">
                {s.topics.slice(0, 10).map(t => (
                  <li key={t.display_name}>
                    <Link href={`/publications/?q=${encodeURIComponent(t.display_name)}${issnForSearch ? `&issn=${issnForSearch}` : ''}`} className="chip hover:underline">{t.display_name}</Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <dl className="panel p-4 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-[13.5px]">
            <dt style={{ color: 'var(--muted)' }}>ISSN-L</dt><dd className="font-mono">{s.issn_l ?? 'Not recorded'}</dd>
            <dt style={{ color: 'var(--muted)' }}>Open access</dt><dd>{s.is_oa ? 'Yes' : 'No'}</dd>
            <dt style={{ color: 'var(--muted)' }}>In DOAJ</dt><dd>{s.is_in_doaj ? 'Yes' : 'No'}</dd>
            <dt style={{ color: 'var(--muted)' }}>APC</dt><dd>{s.apc_usd != null ? `USD ${fmt(s.apc_usd)}` : 'Not recorded'}</dd>
            <dt style={{ color: 'var(--muted)' }}>Publishing</dt><dd className="font-mono">{s.first_publication_year ?? '?'} to {s.last_publication_year ?? '?'}</dd>
            <dt style={{ color: 'var(--muted)' }}>OpenAlex id</dt><dd className="font-mono">{sourceId(s)}</dd>
          </dl>
          <p className="mt-3 text-[12.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>Registry data from OpenAlex (CC0), read live in your browser.</p>
        </aside>
      </div>
    </article>
  )
}

function CrossrefView({ j, issnMap }: { j: CrossrefJournal; issnMap: ReturnType<typeof usePosiIssnMap> }) {
  const curated = matchIssn(issnMap, j.issn)
  const years = j.byYear.slice(0, 8)
  const max = Math.max(1, ...years.map(y => y[1]))
  return (
    <article>
      <header className="pt-8 pb-6 md:pt-10">
        <nav aria-label="Breadcrumb" className="mb-3 text-[12.5px] font-mono" style={{ color: 'var(--muted)' }}>
          <Link href="/journals/" className="hover:underline">Sources</Link>
          <span className="mx-1.5" style={{ color: 'var(--soft)' }}>/</span>
          <span>ISSN {j.issn[0]}</span>
        </nav>
        <h1 className="text-[26px] md:text-[32px] font-semibold leading-tight tracking-tight" style={{ color: 'var(--ink)' }}>{j.title}</h1>
        {j.publisher && <p className="mt-1.5 text-[15px]" style={{ color: 'var(--muted)' }}>{j.publisher}</p>}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {j.issn.map(i => <span key={i} className="id-tag">ISSN {i}</span>)}
          <span className="chip" style={{ color: 'var(--verified)', background: 'var(--verified-soft)', borderColor: 'transparent' }}>Indexed</span>
          {curated?.k === 'core' && <CollectionTag k="core" />}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/certificate/" className="btn btn-primary">Indexing certificate</Link>
          {curated && <Link href={recordHref(curated)} className="btn">POSI record</Link>}
        </div>
      </header>
      <div className="mb-8"><Note>Indexed from Crossref DOI registrations. OpenAlex holds no source record for this journal yet, so coverage figures come from Crossref alone.</Note></div>
      <section aria-labelledby="cr-years" className="max-w-[720px]">
        <SectionTitle id="cr-years" aside={`${fmt(j.total)} DOIs registered`}>DOIs per year</SectionTitle>
        <ul className="space-y-1.5">
          {years.map(([y, c]) => (
            <li key={y} className="grid grid-cols-[48px_minmax(0,1fr)_80px] items-center gap-3 text-[13px]">
              <span className="font-mono" style={{ color: 'var(--muted)' }}>{y}</span>
              <span className="h-2 rounded-[2px]" style={{ width: `${Math.max(1, (c / max) * 100)}%`, background: 'var(--teal)' }} />
              <span className="font-mono tnum text-right">{fmt(c)}</span>
            </li>
          ))}
        </ul>
      </section>
    </article>
  )
}
