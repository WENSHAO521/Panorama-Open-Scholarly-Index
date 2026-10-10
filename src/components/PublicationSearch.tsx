'use client'

// Publication search over OpenAlex, run from the browser. All state lives in
// the URL so every result page is shareable and bookmarkable.

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CaretLeft, CaretRight, DownloadSimple, MagnifyingGlass, Funnel, X } from '@phosphor-icons/react/dist/ssr'
import { searchWorks, typeFacets, toBibtex, toRis, toCsvRows, download, TYPE_LABEL, type Work, type WorkQuery, type Fallback, type SortKey, type Facet } from '@/lib/openalex'
import { Note } from './db'
import { usePosiIssnMap, matchIssn } from '@/lib/use-posi-issn'
import { WorkItem } from './WorkItem'

const PER_PAGE = 20
const MAX_PAGE = 500 // OpenAlex basic paging stops at 10,000 results

function isoDaysAgo(days: number) {
  const d = new Date(Date.now() - days * 86400000)
  return d.toISOString().slice(0, 10)
}

const PRESETS = [
  { key: '7d', label: 'Last 7 days', from: () => isoDaysAgo(7) },
  { key: '30d', label: 'Last 30 days', from: () => isoDaysAgo(30) },
  { key: '1y', label: 'Last 12 months', from: () => isoDaysAgo(365) },
  { key: '5y', label: 'Last 5 years', from: () => `${new Date().getFullYear() - 5}-01-01` },
]

type Status = { kind: 'idle' } | { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'ok'; count: number; results: Work[]; via?: Fallback }

export function PublicationSearch() {
  const router = useRouter()
  const sp = useSearchParams()

  const q = sp.get('q') ?? ''
  const page = Math.min(MAX_PAGE, Math.max(1, Number(sp.get('page')) || 1))
  const sort = (sp.get('sort') as SortKey) || 'relevance'
  const preset = sp.get('range') ?? ''
  const fromYear = sp.get('from') ?? ''
  const toYear = sp.get('to') ?? ''
  const types = useMemo(() => sp.get('type')?.split(',').filter(Boolean) ?? [], [sp])
  const oa = sp.get('oa') === '1'
  const issn = sp.get('issn') ?? ''
  const expand = sp.get('expand') === '1'

  // Drafts follow the URL until the user edits them (derived, not synced by an effect).
  const [draftState, setDraftState] = useState({ for: q, v: q })
  const draft = draftState.for === q ? draftState.v : q
  const setDraft = (v: string) => setDraftState({ for: q, v })
  const yearKey = `${fromYear}|${toYear}`
  const [yearState, setYearState] = useState({ for: yearKey, v: { from: fromYear, to: toYear } })
  const yearDraft = yearState.for === yearKey ? yearState.v : { from: fromYear, to: toYear }
  const setYearDraft = (f: (d: { from: string; to: string }) => { from: string; to: string }) => setYearState({ for: yearKey, v: f(yearDraft) })
  const [filtersOpen, setFiltersOpen] = useState(false)
  const issnMap = usePosiIssnMap()


  const query: WorkQuery = useMemo(() => {
    const p = PRESETS.find(x => x.key === preset)
    return {
      q, page, perPage: PER_PAGE, sort,
      from: p ? p.from() : fromYear ? `${fromYear}-01-01` : undefined,
      to: !p && toYear ? `${toYear}-12-31` : undefined,
      type: types, oa, issn: issn || undefined,
    }
  }, [q, page, sort, preset, fromYear, toYear, types, oa, issn])

  // Results and facets are keyed by the query they answer; anything else reads as loading.
  const queryKey = JSON.stringify(query)
  const [res, setRes] = useState<{ key: string; status: Status } | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [fac, setFac] = useState<{ key: string; facets: Facet[] } | null>(null)
  const status: Status = res?.key === queryKey ? res.status : { kind: 'loading' }
  const facets = fac?.key === queryKey ? fac.facets : null

  useEffect(() => {
    const ctrl = new AbortController()
    searchWorks(query, ctrl.signal)
      .then(r => setRes({ key: queryKey, status: { kind: 'ok', ...r } }))
      .catch(e => { if (e.name !== 'AbortError') setRes({ key: queryKey, status: { kind: 'error', message: String(e.message || e) } }) })
    typeFacets(query, ctrl.signal).then(f => setFac({ key: queryKey, facets: f })).catch(e => { if (e.name !== 'AbortError') setFac({ key: queryKey, facets: [] }) })
    return () => ctrl.abort()
  }, [query, queryKey, attempt])

  function update(patch: Record<string, string | null>, resetPage = true) {
    const n = new URLSearchParams(sp.toString())
    for (const [k, v] of Object.entries(patch)) { if (v === null || v === '') n.delete(k); else n.set(k, v) }
    if (resetPage) n.delete('page')
    router.push(`/publications/?${n}`, { scroll: resetPage ? false : true })
  }

  function submit(e: FormEvent) { e.preventDefault(); update({ q: draft.trim() }) }

  function toggleType(t: string) {
    const next = types.includes(t) ? types.filter(x => x !== t) : [...types, t]
    update({ type: next.join(',') })
  }

  const activeFilters = (preset ? 1 : 0) + (fromYear || toYear ? 1 : 0) + types.length + (oa ? 1 : 0) + (issn ? 1 : 0)
  const results = status.kind === 'ok' ? status.results : []
  const count = status.kind === 'ok' ? status.count : null
  const lastPage = count !== null ? Math.min(MAX_PAGE, Math.max(1, Math.ceil(count / PER_PAGE))) : page

  const filterPanel = (
    <div className="space-y-6 text-[13.5px]">
      <div className="flex items-center justify-between">
        <p className="font-medium">Filters</p>
        {activeFilters > 0 && (
          <button type="button" className="link text-[12.5px]" onClick={() => update({ range: null, from: null, to: null, type: null, oa: null, issn: null })}>
            Clear all
          </button>
        )}
      </div>

      <fieldset>
        <legend className="font-medium mb-2" style={{ color: 'var(--ink-2)' }}>Published</legend>
        <div className="space-y-1.5">
          {PRESETS.map(p => (
            <label key={p.key} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="range" checked={preset === p.key} onChange={() => update({ range: p.key, from: null, to: null })} style={{ accentColor: 'var(--teal)' }} />
              {p.label}
            </label>
          ))}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="range" checked={!preset} onChange={() => update({ range: null })} style={{ accentColor: 'var(--teal)' }} />
            Any time
          </label>
        </div>
        <form
          className="mt-3 grid grid-cols-[1fr_1fr_auto] gap-2 items-end"
          onSubmit={e => { e.preventDefault(); update({ range: null, from: yearDraft.from, to: yearDraft.to }) }}
        >
          <div className="flex flex-col gap-1">
            <label htmlFor="yf" className="text-[12px]" style={{ color: 'var(--muted)' }}>From year</label>
            <input id="yf" inputMode="numeric" pattern="[0-9]{4}" className="input h-8 text-[13px] px-2" value={yearDraft.from} onChange={e => setYearDraft(d => ({ ...d, from: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="yt" className="text-[12px]" style={{ color: 'var(--muted)' }}>To year</label>
            <input id="yt" inputMode="numeric" pattern="[0-9]{4}" className="input h-8 text-[13px] px-2" value={yearDraft.to} onChange={e => setYearDraft(d => ({ ...d, to: e.target.value }))} />
          </div>
          <button type="submit" className="btn btn-sm h-8">Apply</button>
        </form>
      </fieldset>

      <fieldset>
        <legend className="font-medium mb-2" style={{ color: 'var(--ink-2)' }}>Access</legend>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={oa} onChange={() => update({ oa: oa ? null : '1' })} style={{ accentColor: 'var(--teal)' }} />
          Open access only
        </label>
      </fieldset>

      <fieldset>
        <legend className="font-medium mb-2" style={{ color: 'var(--ink-2)' }}>Publication type</legend>
        {facets === null ? (
          <div className="space-y-2" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-3.5 rounded-[2px] animate-pulse" style={{ background: 'var(--surface-3)', width: `${80 - i * 10}%` }} />)}
          </div>
        ) : (
          <ul className="space-y-1.5">
            {facets.slice(0, 10).map(f => (
              <li key={f.key}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={types.includes(f.key)} onChange={() => toggleType(f.key)} style={{ accentColor: 'var(--teal)' }} />
                  <span className="flex-1">{TYPE_LABEL[f.key] ?? f.label}</span>
                  <span className="font-mono text-[11.5px] tnum" style={{ color: 'var(--soft)' }}>{f.count.toLocaleString('en-US')}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </fieldset>

      {issn && (
        <div className="rounded-[2px] p-3 text-[12.5px]" style={{ background: 'var(--teal-soft)' }}>
          Limited to source ISSN <span className="font-mono">{issn}</span>.{' '}
          <button type="button" className="link" onClick={() => update({ issn: null })}>Remove</button>
        </div>
      )}

      <p className="text-[12px] leading-relaxed" style={{ color: 'var(--soft)' }}>
        Publication metadata: OpenAlex (CC0), with Crossref, DataCite and Zenodo as fallbacks.
      </p>
    </div>
  )

  return (
    <div>
      <form onSubmit={submit} role="search" className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <label htmlFor="pub-q" className="sr-only">Search publications</label>
          <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 pointer-events-none" style={{ color: 'var(--soft)' }} />
          <input id="pub-q" type="search" value={draft} onChange={e => setDraft(e.target.value)} placeholder="Title, abstract, author, keyword or DOI" className="input h-12 pl-11 text-[16px]" />
        </div>
        <button type="submit" className="btn btn-primary h-12 px-6 text-[15px]">Search</button>
      </form>

      <div className="mt-6 grid gap-8 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start">{filterPanel}</aside>

        <section aria-label="Results" className="min-w-0">
          <div className="flex flex-wrap items-center gap-3 pb-3">
            <button type="button" className="btn btn-sm lg:hidden" onClick={() => setFiltersOpen(o => !o)} aria-expanded={filtersOpen}>
              {filtersOpen ? <X className="h-4 w-4" /> : <Funnel className="h-4 w-4" />} Filters{activeFilters ? ` (${activeFilters})` : ''}
            </button>
            <p className="text-[14px]" aria-live="polite" style={{ color: 'var(--muted)' }}>
              {count === null
                ? status.kind === 'error' ? 'Search failed' : 'Searching…'
                : <><span className="font-semibold tnum" style={{ color: 'var(--ink)' }}>{count.toLocaleString('en-US')}</span> publications</>}
            </p>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-[13px] cursor-pointer" style={{ color: 'var(--ink-2)' }}>
                <input type="checkbox" checked={expand} onChange={() => update({ expand: expand ? null : '1' }, false)} style={{ accentColor: 'var(--teal)' }} />
                Show abstracts
              </label>
              <label htmlFor="sort" className="sr-only">Sort</label>
              <select id="sort" value={sort} onChange={e => update({ sort: e.target.value === 'relevance' ? null : e.target.value })} className="input h-8 w-auto text-[13px] pr-8">
                <option value="relevance">Most relevant</option>
                <option value="newest">Newest first</option>
                <option value="cited">Most cited</option>
              </select>
              <details className="relative">
                <summary className="btn btn-sm list-none cursor-pointer"><DownloadSimple className="h-4 w-4" /> Export</summary>
                <div className="absolute right-0 mt-1 z-20 panel p-1 w-44 text-[13px]">
                  {[
                    ['CSV', () => download('posi-publications.csv', toCsvRows(results), 'text/csv')],
                    ['BibTeX', () => download('posi-publications.bib', results.map(toBibtex).join('\n\n'), 'application/x-bibtex')],
                    ['RIS', () => download('posi-publications.ris', results.map(toRis).join('\n'), 'application/x-research-info-systems')],
                  ].map(([label, fn]) => (
                    <button key={label as string} type="button" disabled={!results.length} onClick={fn as () => void} className="block w-full text-left px-3 py-1.5 rounded-[2px] hover:bg-[var(--hover)]">
                      {label as string} (this page)
                    </button>
                  ))}
                </div>
              </details>
            </div>
          </div>

          {filtersOpen && <div className="lg:hidden panel p-4 mb-4">{filterPanel}</div>}

          {status.kind === 'loading' && (
            <div aria-hidden="true">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="py-5 space-y-2" style={{ borderTop: '1px solid var(--line-soft)' }}>
                  <div className="h-3 w-40 rounded-[2px] animate-pulse" style={{ background: 'var(--surface-3)' }} />
                  <div className="h-4 w-4/5 rounded-[2px] animate-pulse" style={{ background: 'var(--surface-3)' }} />
                  <div className="h-3 w-3/5 rounded-[2px] animate-pulse" style={{ background: 'var(--surface-2)' }} />
                  <div className="h-3 w-2/5 rounded-[2px] animate-pulse" style={{ background: 'var(--surface-2)' }} />
                </div>
              ))}
            </div>
          )}

          {status.kind === 'error' && (
            <div className="panel p-6 mt-2">
              <p className="font-medium">Search is temporarily unavailable</p>
              <p className="mt-1 text-[14px]" style={{ color: 'var(--muted)' }}>
                None of OpenAlex, Crossref, DataCite or Zenodo answered ({status.message}). This usually clears within a minute.
              </p>
              <button type="button" className="btn btn-sm mt-4" onClick={() => { setRes(null); setAttempt(a => a + 1) }}>Search again</button>
            </div>
          )}

          {status.kind === 'ok' && status.via && (
            <div className="mt-2 mb-3">
              <Note>
                OpenAlex is busy, so these results come from {{ crossref: 'Crossref', datacite: 'DataCite', zenodo: 'Zenodo' }[status.via]}. Abstracts, open access status and type
                filters may be incomplete. <button type="button" className="link" onClick={() => { setRes(null); setAttempt(a => a + 1) }}>Retry with OpenAlex</button>
              </Note>
            </div>
          )}

          {status.kind === 'ok' && !results.length && (
            <div className="py-16 text-center" style={{ borderTop: '1px solid var(--line-soft)' }}>
              <p className="font-medium">No publications match</p>
              <p className="mt-1 text-[14px]" style={{ color: 'var(--muted)' }}>Try fewer words, or clear a filter.</p>
            </div>
          )}

          {status.kind === 'ok' && results.map(w => (
            <WorkItem
              key={w.id}
              w={w}
              expand={expand}
              posi={matchIssn(issnMap, w.primary_location?.source?.issn ?? (w.primary_location?.source?.issn_l ? [w.primary_location.source.issn_l] : null))}
            />
          ))}

          {status.kind === 'ok' && count! > PER_PAGE && (
            <nav aria-label="Pagination" className="flex items-center justify-between pt-5" style={{ borderTop: '1px solid var(--line-soft)' }}>
              <button type="button" className="btn btn-sm" disabled={page <= 1} onClick={() => update({ page: String(page - 1) }, false)}>
                <CaretLeft className="h-4 w-4" /> Previous
              </button>
              <span className="font-mono text-[13px]" style={{ color: 'var(--muted)' }}>
                page {page} of {lastPage.toLocaleString('en-US')}
              </span>
              <button type="button" className="btn btn-sm" disabled={page >= lastPage} onClick={() => update({ page: String(page + 1) }, false)}>
                Next <CaretRight className="h-4 w-4" />
              </button>
            </nav>
          )}
        </section>
      </div>
    </div>
  )
}
