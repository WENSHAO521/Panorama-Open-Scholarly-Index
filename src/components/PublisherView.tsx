'use client'

// One publisher: summary figures, where its journals are registered, what
// they cover, and every journal it has in POSI. Rendered by the static
// /publishers/<slug>/ pages and by the in-browser /publisher/ viewer.

import Link from 'next/link'
import { useDeferredValue, useMemo, useRef, useState } from 'react'
import { MagnifyingGlass } from '@phosphor-icons/react/dist/ssr'
import psc from '@/lib/psc-v1.0.snapshot.json'
import { recordHref } from '@/lib/records'
import { publisherHref, publisherJsonHref, type PublisherDetail } from '@/lib/publishers'
import { CollectionTag, Note, PageHeader, SectionTitle, Stat, fmt } from './db'

const PAGE = 50
type Sort = 'title' | 'articles' | 'updated'

const PSC_NAME: Record<string, string> = Object.fromEntries(psc.categories.map(c => [c.code, c.name]))
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : '-')

export function PublisherView({ p }: { p: PublisherDetail }) {
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<Sort>('title')
  const [scope, setScope] = useState<'all' | 'core' | 'oa'>('all')
  const dq = useDeferredValue(q)
  const filterKey = `${q}|${sort}|${scope}`
  const [pageState, setPageState] = useState({ key: filterKey, n: 1 })
  const page = pageState.key === filterKey ? pageState.n : 1
  const tableTop = useRef<HTMLDivElement>(null)
  const setPage = (f: (p: number) => number) => { setPageState({ key: filterKey, n: f(page) }); tableTop.current?.scrollIntoView({ block: 'start' }) }

  const filtered = useMemo(() => {
    const n = dq.trim().toLowerCase()
    let out = p.journals
    if (scope === 'core') out = out.filter(j => j.k === 'core')
    else if (scope === 'oa') out = out.filter(j => j.oa)
    if (n) out = out.filter(j => j.t.toLowerCase().includes(n) || j.i.some(i => i.toLowerCase().includes(n)))
    out = [...out]
    if (sort === 'articles') out.sort((a, b) => b.n - a.n)
    else if (sort === 'updated') out.sort((a, b) => b.u.localeCompare(a.u))
    return out
  }, [p.journals, dq, sort, scope])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE))
  const shown = filtered.slice((page - 1) * PAGE, page * PAGE)
  const topCountries = p.countries.slice(0, 8)
  const classified = p.subjects.reduce((s, [, n]) => s + n, 0)

  return (
    <div className="pb-10">
      <PageHeader
        title={p.name}
        crumbs={[{ label: 'POSI', href: '/' }, { label: 'Publishers', href: '/publishers/' }, { label: p.name }]}
        actions={<a href={publisherJsonHref(p.slug)} className="btn">Download JSON</a>}
      >
        <p className="max-w-[68ch]">
          {fmt(p.n)} {p.n === 1 ? 'journal' : 'journals'} in POSI registered to this publisher name
          {topCountries.length > 0 && <>, mainly in {topCountries.slice(0, 3).map(c => c[0]).join(', ')}</>}.
          {p.last_updated && <> Records last updated {p.last_updated}.</>}
        </p>
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px rounded-[2px] overflow-hidden" style={{ background: 'var(--line)', border: '1px solid var(--line)' }}>
        {([
          ['Journals', fmt(p.n), null],
          ['Core Collection', fmt(p.core), p.core ? 'certified' : 'none certified'],
          ['Open access', pct(p.oa, p.n), `${fmt(p.oa)} journals`],
          ['In DOAJ', fmt(p.doaj), pct(p.doaj, p.n)],
          ['Registered articles', fmt(p.articles), null],
          ['Countries', fmt(p.countries.length), null],
        ] as const).map(([label, value, note]) => (
          <div key={label} style={{ background: 'var(--surface)' }}><Stat label={label} value={value} note={note ?? undefined} /></div>
        ))}
      </div>

      {p.variants.length > 0 && (
        <div className="mt-6">
          <Note>
            Also registered under{' '}
            {p.variants.map((v, i) => (
              <span key={v.slug}>
                {i > 0 && (i === p.variants.length - 1 ? ' and ' : ', ')}
                <Link href={publisherHref(v)} className="link">{v.name}</Link> ({fmt(v.n)})
              </span>
            ))}
            . POSI shows names as registered on each record and does not merge them.
          </Note>
        </div>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <section aria-labelledby="pub-collections">
          <SectionTitle id="pub-collections">Records by collection</SectionTitle>
          <dl className="panel overflow-hidden text-[14px]">
            {([
              ['Core Collection', p.core, 'Certified through the PQF editorial evaluation'],
              ['Global Benchmark', p.benchmark, 'Indexed, in the methodology reference set'],
              ['Discovered', p.discovered, 'Indexed from DOAJ, Crossref and OpenAlex'],
            ] as const).map(([label, n, note], i) => (
              <div key={label} className="flex items-baseline justify-between gap-4 px-4 py-2.5" style={i ? { borderTop: '1px solid var(--line-soft)' } : undefined}>
                <dt>
                  <span style={{ color: 'var(--ink)' }}>{label}</span>
                  <span className="block text-[12.5px]" style={{ color: 'var(--muted)' }}>{note}</span>
                </dt>
                <dd className="font-mono tnum" style={{ color: n ? 'var(--ink)' : 'var(--soft)' }}>{fmt(n)}</dd>
              </div>
            ))}
            <div className="flex items-baseline justify-between gap-4 px-4 py-2.5" style={{ borderTop: '1px solid var(--line-soft)' }}>
              <dt style={{ color: 'var(--ink)' }}>First recorded</dt>
              <dd className="font-mono tnum">{p.first_seen ?? '-'}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 px-4 py-2.5" style={{ borderTop: '1px solid var(--line-soft)' }}>
              <dt style={{ color: 'var(--ink)' }}>Last updated</dt>
              <dd className="font-mono tnum">{p.last_updated ?? '-'}</dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="pub-subjects">
          <SectionTitle id="pub-subjects" aside={classified < p.n ? `${fmt(p.n - classified)} not yet classified` : undefined}>Subjects</SectionTitle>
          {p.subjects.length ? (
            <ul className="panel overflow-hidden text-[14px]">
              {p.subjects.slice(0, 10).map(([code, n], i) => (
                <li key={code} className="flex items-baseline justify-between gap-4 px-4 py-2.5" style={i ? { borderTop: '1px solid var(--line-soft)' } : undefined}>
                  {PSC_NAME[code]
                    ? <Link href={`/journals/subject/${code}/`} className="hover:underline" style={{ color: 'var(--teal)' }}>{PSC_NAME[code]}</Link>
                    : <span>{code}</span>}
                  <span className="font-mono tnum" style={{ color: 'var(--muted)' }}>{fmt(n)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[14px]" style={{ color: 'var(--muted)' }}>No subject profile yet for this publisher&rsquo;s journals.</p>
          )}
          {topCountries.length > 1 && (
            <p className="mt-4 text-[13.5px]" style={{ color: 'var(--ink-2)' }}>
              <span style={{ color: 'var(--muted)' }}>Countries of registration: </span>
              {topCountries.map(([c, n]) => `${c} (${fmt(n)})`).join(', ')}
              {p.countries.length > topCountries.length && `, and ${p.countries.length - topCountries.length} more`}
            </p>
          )}
        </section>
      </div>

      <section aria-labelledby="pub-journals" className="mt-12">
        <SectionTitle id="pub-journals">Journals</SectionTitle>
        {p.n > 5 && (
          <div className="panel p-3 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <label htmlFor="pub-j-search" className="sr-only">Filter journals</label>
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'var(--soft)' }} />
              <input id="pub-j-search" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Filter by title or ISSN" className="input h-10 pl-9" />
            </div>
            <label htmlFor="pub-j-scope" className="sr-only">Show</label>
            <select id="pub-j-scope" value={scope} onChange={e => setScope(e.target.value as typeof scope)} className="input h-10 w-auto pr-8">
              <option value="all">All journals</option>
              <option value="core">Core Collection only</option>
              <option value="oa">Open access only</option>
            </select>
            <label htmlFor="pub-j-sort" className="sr-only">Sort</label>
            <select id="pub-j-sort" value={sort} onChange={e => setSort(e.target.value as Sort)} className="input h-10 w-auto pr-8">
              <option value="title">Title A to Z</option>
              <option value="articles">Most articles</option>
              <option value="updated">Recently updated</option>
            </select>
          </div>
        )}

        {p.n > 5 && (
          <p className="mt-4 mb-2 text-[13px]" style={{ color: 'var(--muted)' }} aria-live="polite">
            <span className="font-semibold tnum" style={{ color: 'var(--ink)' }}>{fmt(filtered.length)}</span> of {fmt(p.n)} journals
          </p>
        )}

        <div ref={tableTop} className="panel overflow-x-auto" style={{ scrollMarginTop: 72 }}>
          <table className="dtable min-w-[720px]">
            <thead>
              <tr>
                <th>Journal</th>
                <th>ISSN</th>
                <th>Tier</th>
                <th>Open access</th>
                <th className="text-right">Articles</th>
                <th className="text-right">Updated</th>
              </tr>
            </thead>
            <tbody>
              {shown.map(j => (
                <tr key={j.c}>
                  <td className="max-w-[380px]">
                    <Link href={recordHref(j)} prefetch={false} className="font-medium hover:underline" style={{ color: 'var(--teal)' }}>{j.t}</Link>
                    {j.co && <span className="block text-[12.5px]" style={{ color: 'var(--muted)' }}>{j.co}</span>}
                  </td>
                  <td className="font-mono text-[12.5px] whitespace-nowrap">{j.i[0] ?? '-'}</td>
                  <td><CollectionTag k={j.k} /></td>
                  <td className="text-[13px]" style={{ color: j.oa ? 'var(--ink)' : 'var(--soft)' }}>
                    {j.oa ? (j.d === 'listed' ? 'Yes, in DOAJ' : 'Yes') : 'No'}
                  </td>
                  <td className="text-right font-mono tnum" style={{ color: 'var(--muted)' }}>{fmt(j.n)}</td>
                  <td className="text-right font-mono tnum text-[12.5px]" style={{ color: 'var(--muted)' }}>{j.u || '-'}</td>
                </tr>
              ))}
              {!shown.length && (
                <tr><td colSpan={6} className="py-12 text-center" style={{ color: 'var(--muted)' }}>No journal matches that filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <nav aria-label="Pagination" className="flex items-center justify-between mt-4 text-[13px]">
            <button type="button" className="btn btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
            <span className="font-mono" style={{ color: 'var(--muted)' }}>page {page} of {fmt(pages)}</span>
            <button type="button" className="btn btn-sm" disabled={page === pages} onClick={() => setPage(p => p + 1)}>Next</button>
          </nav>
        )}
      </section>
    </div>
  )
}
