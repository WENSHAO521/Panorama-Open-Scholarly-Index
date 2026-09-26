'use client'

// Faceted browser over the static index files in /data/index/. Everything
// - search, filtering, sorting, export - runs in the browser against
// files produced at build time; there is no query server.

import Link from 'next/link'
import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { DownloadSimple, MagnifyingGlass, X } from '@phosphor-icons/react/dist/ssr'
import pscSnapshot from '@/lib/psc-v1.0.snapshot.json'
import { VERIFICATION, recordHref, tierOf, type Collection, type IndexRecord, type Tier, type Verification } from '@/lib/records'
import { searchSources, sourceId, type Source } from '@/lib/openalex'
import { CollectionTag, fmt } from './db'

const PAGE_SIZE = 50
const GROUPS = ['core', 'benchmark', 'discovered'] as const
type Group = typeof GROUPS[number]

const PSC_NAME: Record<string, string> = Object.fromEntries(
  (pscSnapshot as { categories: { code: string; name: string }[] }).categories.map(c => [c.code, c.name]),
)
const PSC_DOMAINS = (pscSnapshot as { categories: { code: string; name: string; level: number }[] }).categories.filter(c => c.level === 1)

type SortKey = 'relevance' | 'title' | 'articles' | 'updated'
type Row = IndexRecord & { tn: string; pn: string }

function normalize(s: string) { return s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '') }

function score(r: Row, q: string, qn: string): number {
  if (!q) return 0
  if (r.id && r.id.toLowerCase() === q.toLowerCase()) return 100
  if (r.i.some(x => x.replace('-', '') === q.replace('-', '').toUpperCase())) return 90
  const t = r.tn
  if (t === qn) return 80
  if (t.startsWith(qn)) return 60
  if (t.includes(qn)) return 40
  if (r.pn.includes(qn)) return 20
  if (r.c.includes(qn)) return 10
  return 0
}

function toCsv(rows: Row[]): string {
  const cell = (v: unknown) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }
  const head = 'posi_id,journal_code,title,issn,publisher,country,psc_category,collection,verification,open_access,doaj_status,article_count,updated'
  return [head, ...rows.map(r => [r.id, r.c, r.t, r.i.join(' '), r.p, r.co, r.s, r.k, r.v, r.oa, r.d, r.n, r.u].map(cell).join(','))].join('\n')
}

function download(name: string, body: string, type: string) {
  const url = URL.createObjectURL(new Blob([body], { type }))
  const a = document.createElement('a')
  a.href = url; a.download = name; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function Facet<T extends string>({
  title, options, selected, onToggle,
}: {
  title: string
  options: { value: T; label: string; count: number }[]
  selected: Set<T>
  onToggle: (v: T) => void
}) {
  return (
    <fieldset className="py-4" style={{ borderBottom: '1px solid var(--line-soft)' }}>
      <legend className="eyebrow mb-2">{title}</legend>
      <ul className="space-y-1">
        {options.map(o => (
          <li key={o.value}>
            <label className="flex items-center gap-2 text-[13.5px] cursor-pointer py-0.5" style={{ color: o.count ? 'var(--ink-2)' : 'var(--soft)' }}>
              <input type="checkbox" checked={selected.has(o.value)} onChange={() => onToggle(o.value)} style={{ accentColor: 'var(--teal)' }} />
              <span className="flex-1 min-w-0 truncate">{o.label}</span>
              <span className="font-mono text-[11.5px] tnum" style={{ color: 'var(--soft)' }}>{fmt(o.count)}</span>
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  )
}

function toggle<T>(set: Set<T>, v: T): Set<T> {
  const n = new Set(set)
  if (n.has(v)) n.delete(v); else n.add(v)
  return n
}

export function RecordBrowser({ expected }: { expected: Record<Group, number> }) {
  const params = useSearchParams()
  const router = useRouter()
  const [data, setData] = useState<Partial<Record<Group, Row[]>>>({})
  const [failed, setFailed] = useState<Group[]>([])
  const [q, setQ] = useState(params.get('q') ?? '')
  // ?status=core|indexed. The old ?collection= links map onto the two tiers.
  const [cols, setCols] = useState<Set<Tier>>(() => {
    const st = params.get('status')?.split(',').filter(Boolean) as Tier[] | undefined
    if (st?.length) return new Set(st)
    const legacy = params.get('collection')?.split(',').filter(Boolean) as Collection[] | undefined
    return new Set((legacy ?? []).map(tierOf))
  })
  const [vers, setVers] = useState<Set<Verification>>(new Set())
  const [domains, setDomains] = useState<Set<string>>(() => new Set(params.get('psc')?.split(',').filter(Boolean) ?? []))
  const [oa, setOa] = useState<Set<'oa' | 'doaj'>>(() => new Set(params.get('oa') === '1' ? ['oa'] : []))
  const [pub, setPub] = useState(params.get('pub') ?? '')
  const [sort, setSort] = useState<SortKey>('relevance')

  useEffect(() => {
    let cancelled = false
    for (const g of GROUPS) {
      fetch(`/data/index/${g}.json`)
        .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json() })
        .then((rows: IndexRecord[]) => {
          if (cancelled) return
          const prepared = rows.map(r => ({ ...r, tn: normalize(r.t), pn: normalize(r.p) }))
          setData(d => ({ ...d, [g]: prepared }))
        })
        .catch(() => { if (!cancelled) setFailed(f => [...f, g]) })
    }
    return () => { cancelled = true }
  }, [])

  // Keep the shareable parts of the query in the URL.
  useEffect(() => {
    const sp = new URLSearchParams()
    if (q.trim()) sp.set('q', q.trim())
    if (cols.size) sp.set('status', [...cols].join(','))
    if (domains.size) sp.set('psc', [...domains].join(','))
    if (pub) sp.set('pub', pub)
    const s = sp.toString()
    router.replace(s ? `/journals/?${s}` : '/journals/', { scroll: false })
  }, [q, cols, domains, pub, router])

  // Page resets whenever the filter state changes (derived, not an effect).
  const filterKey = JSON.stringify([q, [...cols], [...vers], [...domains], [...oa], sort, pub])
  const [pageState, setPageState] = useState({ key: filterKey, n: 1 })
  const page = pageState.key === filterKey ? pageState.n : 1
  const setPage = (f: (p: number) => number) => setPageState({ key: filterKey, n: f(page) })

  const all = useMemo(() => GROUPS.flatMap(g => data[g] ?? []), [data])
  const loading = GROUPS.filter(g => !data[g] && !failed.includes(g))

  const dq = useDeferredValue(q)

  // Every Crossref/OpenAlex journal is indexed, not only the curated records
  // above, so a search also asks OpenAlex for matching journals.
  const [more, setMore] = useState<{ q: string; count: number; results: Source[] } | null>(null)
  useEffect(() => {
    const term = dq.trim()
    if (term.length < 3) return
    const ctrl = new AbortController()
    const t = setTimeout(() => {
      searchSources(term, 10, ctrl.signal).then(r => setMore({ q: term, ...r })).catch(() => {})
    }, 350)
    return () => { clearTimeout(t); ctrl.abort() }
  }, [dq])
  const qt = dq.trim()
  const qn = normalize(qt)

  // Rows matching everything except facet `skip` - for facet counts.
  const filterExcept = (skip: string) => all.filter(r =>
    (skip === 'k' || !cols.size || cols.has(tierOf(r.k))) &&
    (skip === 'v' || !vers.size || vers.has(r.v)) &&
    (skip === 's' || !domains.size || (r.s && domains.has(r.s.split('.')[0]))) &&
    (skip === 'oa' || !oa.size || ((!oa.has('oa') || r.oa) && (!oa.has('doaj') || r.d === 'listed'))) &&
    (!pub || r.p === pub) &&
    (!qt || score(r, qt, qn) > 0),
  )

  const results = useMemo(() => {
    const rows = filterExcept('')
    const s = [...rows]
    if (sort === 'title') s.sort((a, b) => a.t.localeCompare(b.t))
    else if (sort === 'articles') s.sort((a, b) => b.n - a.n)
    else if (sort === 'updated') s.sort((a, b) => b.u.localeCompare(a.u))
    else {
      const rank: Record<Collection, number> = { core: 0, candidate: 1, benchmark: 2, discovered: 3 }
      s.sort((a, b) => (qt ? score(b, qt, qn) - score(a, qt, qn) : 0) || rank[a.k] - rank[b.k] || a.t.localeCompare(b.t))
    }
    return s
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, dq, cols, vers, domains, oa, sort, pub])

  const facetCount = <T extends string>(skip: string, key: (r: IndexRecord) => T | null) => {
    const m: Record<string, number> = {}
    for (const r of filterExcept(skip)) { const v = key(r); if (v) m[v] = (m[v] ?? 0) + 1 }
    return m
  }
  const kCounts = facetCount('k', r => tierOf(r.k))
  const vCounts = facetCount('v', r => r.v)
  const sCounts = facetCount('s', r => r.s?.split('.')[0] ?? null)
  const oaRows = filterExcept('oa')
  const pages = Math.max(1, Math.ceil(results.length / PAGE_SIZE))
  const shown = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const active = cols.size + vers.size + domains.size + oa.size

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside aria-label="Filters" className="lg:sticky lg:top-[104px] lg:self-start lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto scrollbar-none">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-medium">Filters</p>
          {active > 0 && (
            <button type="button" className="text-[12.5px] link" onClick={() => { setCols(new Set()); setVers(new Set()); setDomains(new Set()); setOa(new Set()) }}>
              Clear {active}
            </button>
          )}
        </div>
        <Facet
          title="Status"
          options={(['core', 'indexed'] as Tier[]).map(t => ({ value: t, label: t === 'core' ? 'Core (certified)' : 'Indexed', count: kCounts[t] ?? 0 }))}
          selected={cols}
          onToggle={v => setCols(s => toggle(s, v))}
        />
        <Facet
          title="Verification"
          options={(['VERIFIED', 'PARTIALLY_VERIFIED', 'NEEDS_CHECK', 'REJECTED'] as Verification[]).map(v => ({ value: v, label: VERIFICATION[v].label, count: vCounts[v] ?? 0 }))}
          selected={vers}
          onToggle={v => setVers(s => toggle(s, v))}
        />
        <Facet
          title="PSC domain"
          options={PSC_DOMAINS.map(d => ({ value: d.code, label: `${d.code} ${d.name}`, count: sCounts[d.code] ?? 0 }))}
          selected={domains}
          onToggle={v => setDomains(s => toggle(s, v))}
        />
        <Facet
          title="Access"
          options={[
            { value: 'oa' as const, label: 'Open access', count: oaRows.filter(r => r.oa).length },
            { value: 'doaj' as const, label: 'Listed in DOAJ', count: oaRows.filter(r => r.d === 'listed').length },
          ]}
          selected={oa}
          onToggle={v => setOa(s => toggle(s, v))}
        />
        <p className="pt-4 text-[12px] leading-relaxed" style={{ color: 'var(--soft)' }}>
          PSC domain is only assigned to Core and Benchmark records; Discovered records are not yet classified.
        </p>
      </aside>

      <section aria-label="Results" className="min-w-0">
        <div className="panel p-3 flex flex-col md:flex-row gap-2 md:items-center">
          <div className="relative flex-1">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'var(--soft)' }} />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search title, publisher, ISSN or POSI-J id"
              aria-label="Search records"
              type="search"
              className="input pl-9 h-10 text-[15px]"
              autoFocus={!!params.get('q')}
            />
            {q && (
              <button type="button" aria-label="Clear search" onClick={() => setQ('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1" style={{ color: 'var(--soft)' }}>
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <select aria-label="Sort" value={sort} onChange={e => setSort(e.target.value as SortKey)} className="input h-10 w-auto pr-8">
              <option value="relevance">Sort: relevance</option>
              <option value="title">Sort: title A-Z</option>
              <option value="articles">Sort: most articles</option>
              <option value="updated">Sort: recently updated</option>
            </select>
            <button type="button" className="btn h-10" onClick={() => download('posi-records.csv', toCsv(results), 'text/csv')} disabled={!results.length} title="Download the current result set as CSV">
              <DownloadSimple className="h-4 w-4" /> CSV
            </button>
            <button type="button" className="btn h-10" onClick={() => download('posi-records.json', JSON.stringify(results.map(r => { const { tn, pn, ...rest } = r; void tn; void pn; return rest })), 'application/json')} disabled={!results.length} title="Download the current result set as JSON">
              JSON
            </button>
          </div>
        </div>

        {pub && (
          <div className="mt-3 flex items-center gap-2 text-[13px]">
            <span style={{ color: 'var(--muted)' }}>Publisher:</span>
            <span className="chip" style={{ background: 'var(--teal-soft)', color: 'var(--teal)', borderColor: 'transparent' }}>
              {pub}
              <button type="button" aria-label="Remove publisher filter" onClick={() => setPub('')}><X className="h-3 w-3" /></button>
            </span>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-4 mb-2 text-[13px]" style={{ color: 'var(--muted)' }}>
          <p aria-live="polite">
            <span className="font-semibold tnum" style={{ color: 'var(--ink)' }}>{fmt(results.length)}</span> records
            {loading.length > 0 && (
              <span className="ml-3" style={{ color: 'var(--soft)' }}>
                Loading {loading.map(g => `${fmt(expected[g])} ${g}`).join(', ')} records
              </span>
            )}
            {failed.length > 0 && <span className="ml-3" style={{ color: 'var(--check)' }}>Could not load: {failed.join(', ')}</span>}
          </p>
        </div>

        <div className="panel overflow-x-auto">
          <table className="dtable min-w-[680px]">
            <thead>
              <tr>
                <th>Title</th>
                <th>ISSN</th>
                <th>PSC</th>
                <th className="text-right">Articles</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {shown.map(r => (
                <tr key={`${r.k}-${r.c}`}>
                  <td className="max-w-[380px]">
                    <Link href={recordHref(r)} className="font-medium hover:underline" style={{ color: 'var(--teal)' }}>{r.t}</Link>
                    <div className="text-[12.5px] mt-0.5 truncate" style={{ color: 'var(--muted)' }}>
                      {[r.p, r.co].filter(Boolean).join(' · ')}
                    </div>
                  </td>
                  <td className="font-mono text-[12.5px] whitespace-nowrap">{r.i[0] ?? <span style={{ color: 'var(--soft)' }}>-</span>}</td>
                  <td className="text-[12.5px]" title={r.s ? PSC_NAME[r.s] : undefined}>
                    {r.s ? <span className="font-mono">{r.s}</span> : <span style={{ color: 'var(--soft)' }}>-</span>}
                  </td>
                  <td className="text-right font-mono text-[12.5px] tnum">{fmt(r.n)}</td>
                  <td><CollectionTag k={r.k} /></td>
                </tr>
              ))}
              {!shown.length && loading.length === GROUPS.length && Array.from({ length: 8 }).map((_, i) => (
                <tr key={`sk-${i}`} aria-hidden="true">
                  {Array.from({ length: 5 }).map((__, j) => (
                    <td key={j}><div className="h-3.5 rounded-[6px] animate-pulse" style={{ background: 'var(--surface-3)', width: j === 0 ? '80%' : '60%' }} /></td>
                  ))}
                </tr>
              ))}
              {!shown.length && loading.length < GROUPS.length && (
                <tr><td colSpan={5} className="py-14 text-center">
                  <p className="font-medium" style={{ color: 'var(--ink)' }}>No records match</p>
                  <p className="text-[13px] mt-1" style={{ color: 'var(--muted)' }}>
                    Try a shorter query or clear a filter. Journals beyond the curated records appear below when OpenAlex has a match.
                  </p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <nav aria-label="Pagination" className="flex items-center justify-between mt-4 text-[13px]">
            <button type="button" className="btn btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Previous</button>
            <span className="font-mono" style={{ color: 'var(--muted)' }}>page {page} / {fmt(pages)}</span>
            <button type="button" className="btn btn-sm" disabled={page === pages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </nav>
        )}

        {more && more.q === dq.trim() && more.results.length > 0 && (() => {
          const known = new Set(all.flatMap(r => r.i.map(i => i.toUpperCase())))
          const extra = more.results.filter(src => !(src.issn ?? []).some(i => known.has(i.toUpperCase())))
          if (!extra.length) return null
          return (
            <section aria-labelledby="registry-results" className="mt-10">
              <h2 id="registry-results" className="text-[16px] font-semibold tracking-tight">
                More indexed journals
                <span className="ml-2 font-normal text-[13px]" style={{ color: 'var(--muted)' }}>{fmt(more.count)} matches in the full index (OpenAlex)</span>
              </h2>
              <ul className="mt-3 panel divide-y" style={{ borderColor: 'var(--line)' }}>
                {extra.map(src => (
                  <li key={src.id} className="px-4 py-3 grid gap-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center" style={{ borderColor: 'var(--line-soft)' }}>
                    <div className="min-w-0">
                      <Link href={`/source/?id=${sourceId(src)}`} className="font-medium hover:underline" style={{ color: 'var(--teal)' }}>{src.display_name}</Link>
                      <p className="text-[12.5px] truncate" style={{ color: 'var(--muted)' }}>
                        {[src.host_organization_name, src.issn_l && `ISSN ${src.issn_l}`].filter(Boolean).join(', ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-[12.5px]" style={{ color: 'var(--muted)' }}>
                      <span className="font-mono tnum">{fmt(src.works_count)} works</span>
                      <span className="chip">Indexed</span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )
        })()}
      </section>
    </div>
  )
}
