'use client'

// Journal profile: one page per indexed journal, read from the static profile
// shards (no live registry calls). ?issn=<any ISSN> or ?id=<OpenAlex source id>.

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowSquareOut, Books, Certificate, SealCheck } from '@phosphor-icons/react/dist/ssr'
import { getJournalProfile, PSC_CONFIDENCE_TEXT, type JournalProfile } from '@/lib/journal-profile'
import { countryName, recordHref } from '@/lib/records'
import { usePosiIssnMap, matchIssn } from '@/lib/use-posi-issn'
import { EvaluationPanel } from '@/components/Evaluation'
import { evaluationFromProfile } from '@/lib/evaluation/journal'
import { hasZone } from '@/lib/zone-certificate'
import psc from '@/lib/psc-v1.0.snapshot.json'
import { fmt } from '@/components/db'

const PSC_NAME: Record<string, string> = Object.fromEntries(psc.categories.map(c => [c.code, c.name]))

type State = { key: string; profile: JournalProfile | null; error?: boolean }

export function JournalProfileView() {
  const sp = useSearchParams()
  const key = sp.get('issn') ?? sp.get('id') ?? ''
  const [state, setState] = useState<State | null>(null)
  const issnMap = usePosiIssnMap()

  useEffect(() => {
    if (!key) return
    const ctrl = new AbortController()
    getJournalProfile(key, ctrl.signal)
      .then(profile => setState({ key, profile }))
      .catch(e => { if (e.name !== 'AbortError') setState({ key, profile: null, error: true }) })
    return () => ctrl.abort()
  }, [key])

  if (!key) return <Empty title="No journal selected" body="Open a journal from the directory or search by title or ISSN." />
  const current = state?.key === key ? state : null
  if (!current) return <Skeleton />
  if (current.error) return <Empty title="The journal could not be loaded" body="Check your connection and reload the page." />
  if (!current.profile) return <Empty title="Journal not found" body={`No indexed journal matches “${key}”. POSI indexes journals with an ISSN registered with Crossref or described by OpenAlex.`} />

  const j = current.profile
  const curated = matchIssn(issnMap, j.is)
  const core = curated?.k === 'core'
  const catName = j.sc === 'multidisciplinary' ? 'Multidisciplinary' : j.s ? PSC_NAME[j.s] ?? j.s : null
  const catHref = j.sc === 'multidisciplinary' ? '/journals/subject/multidisciplinary/' : j.s ? `/journals/subject/${j.s}/` : null
  const country = countryName(j.cc)
  const years = j.y0 ? (j.y1 && j.y1 < new Date().getFullYear() - 1 ? `${j.y0}–${String(j.y1).slice(2)}` : `Since ${j.y0}`) : null

  return (
    <article className="pb-12">
      <header className="pt-8 pb-6 md:pt-10">
        <nav aria-label="Breadcrumb" className="mb-2.5 text-[12.5px]" style={{ color: 'var(--muted)' }}>
          <Link href="/" className="hover:underline">POSI</Link>
          <span className="mx-1.5" style={{ color: 'var(--soft)' }}>&rsaquo;</span>
          <Link href="/journals/" className="hover:underline">Journals</Link>
          {catName && catHref && <>
            <span className="mx-1.5" style={{ color: 'var(--soft)' }}>&rsaquo;</span>
            <Link href={catHref} className="hover:underline">{catName}</Link>
          </>}
        </nav>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="chip" style={core ? { color: 'var(--on-teal)', background: 'var(--teal)', borderColor: 'var(--teal)' } : undefined}>
            {core ? 'Core Collection' : 'Indexed'}
          </span>
          {j.oa && <span className="chip">Open access</span>}
          {j.dj && <span className="chip">DOAJ</span>}
          {j.sc === 'multidisciplinary' && <span className="chip">Multidisciplinary</span>}
        </div>
        <h1 className="text-[24px] md:text-[28px] font-semibold leading-tight tracking-tight max-w-4xl" style={{ color: 'var(--ink)' }}>{j.t}</h1>
        <p className="mt-2 text-[15.5px]" style={{ color: 'var(--ink-2)' }}>
          {[j.pub ?? curated?.p, country].filter(Boolean).join(' · ') || 'Publisher not recorded'}
        </p>
        {(j.ab || j.alt?.length) && (
          <p className="mt-1 text-[13.5px]" style={{ color: 'var(--muted)' }}>
            Also known as {[j.ab, ...(j.alt ?? [])].filter((x, i, a) => x && a.indexOf(x) === i).join('; ')}
          </p>
        )}
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13.5px]">
          <Link href={`/publications/?issn=${encodeURIComponent(j.k)}&sort=newest`} className="btn btn-primary" prefetch={false}>
            <Books className="h-4 w-4" /> Browse publications
          </Link>
          {j.hp && (
            <a href={j.hp} className="link inline-flex items-center gap-1" target="_blank" rel="noopener noreferrer">
              Journal website <ArrowSquareOut className="h-3.5 w-3.5" />
            </a>
          )}
          {curated && <Link href={recordHref(curated)} className="link" prefetch={false}>POSI record</Link>}
          <Link href="/certificate/" className="link inline-flex items-center gap-1"><Certificate className="h-4 w-4" /> Indexing certificate</Link>
        </div>
      </header>

      <dl className="stat-strip grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {([
          ['Publications', fmt(j.w ?? j.cr)],
          ['Citations', fmt(j.c)],
          ['h-index', fmt(j.h)],
          ['i10-index', fmt(j.i10)],
          [j.apcx ? 'APC' : 'APC (USD)', j.apcx ?? (j.apc != null ? (j.apc === 0 ? 'None' : fmt(j.apc)) : '-')],
          ['Years active', years ?? '-'],
        ] as const).map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd className="mt-1 figure text-[22px]">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-10">
          {!!j.cy?.length && <YearChart rows={j.cy} />}

          <section aria-labelledby="subject">
            <h2 id="subject" className="text-[17px] font-semibold tracking-tight mb-3">Subject</h2>
            <div className="panel p-4">
              <p className="text-[15px]">
                {catName && catHref
                  ? <Link href={catHref} className="font-medium hover:underline" style={{ color: 'var(--teal)' }}>{j.s && j.sc !== 'multidisciplinary' ? `${j.s} ` : ''}{catName}</Link>
                  : <span style={{ color: 'var(--muted)' }}>Not yet classified</span>}
              </p>
              <p className="mt-1 text-[13px]" style={{ color: 'var(--muted)' }}>
                {PSC_CONFIDENCE_TEXT[j.sc ?? 'unclassified'] ?? j.sc}. Classification follows the{' '}<Link href="/subjects/" className="link">POSI Subject Classification</Link>{' '}from the journal&rsquo;s OpenAlex topics.
              </p>
              {!!j.tp?.length && (
                <p className="mt-4 text-[12.5px] font-medium" style={{ color: 'var(--muted)' }}>Top OpenAlex topics, by works</p>
              )}
              {!!j.tp?.length && (
                <ul className="mt-2 space-y-2.5">
                  {j.tp.map(([topic, subfield, field, n]) => {
                    const max = j.tp![0][3] || 1
                    return (
                      <li key={topic}>
                        <div className="flex justify-between gap-3 text-[13.5px]">
                          <span className="min-w-0 truncate" style={{ color: 'var(--ink)' }}>{topic}</span>
                          <span className="font-mono tnum shrink-0" style={{ color: 'var(--muted)' }}>{fmt(n)}</span>
                        </div>
                        <div className="mt-1 h-1.5 rounded-[1px]" style={{ background: 'var(--surface-2)' }}>
                          <div className="h-1.5 rounded-[1px]" style={{ width: `${Math.max(2, (n / max) * 100)}%`, background: 'var(--teal)' }} />
                        </div>
                        <p className="mt-0.5 text-[12px]" style={{ color: 'var(--soft)' }}>{[field, subfield].filter(Boolean).join(' › ')}</p>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <EvaluationCard j={j} core={core} />

          <section aria-labelledby="ids" className="panel">
            <h2 id="ids" className="px-4 pt-4 text-[15px] font-semibold">Identifiers</h2>
            <dl className="px-4 pb-4 pt-2 text-[13.5px] divide-y divide-[var(--line-soft)]">
              <Row k="ISSN-L" v={j.k} mono />
              <Row k="ISSN" v={j.is.join(', ')} mono />
              <Row k="POSI ID" v={j.pid} mono />
              {j.oid && <Row k="OpenAlex" v={<a href={`https://openalex.org/${j.oid}`} className="link" target="_blank" rel="noopener noreferrer">{j.oid}</a>} mono />}
              {j.cr != null && <Row k="Crossref DOIs" v={fmt(j.cr)} mono />}
              {country && <Row k="Country" v={country} />}
              {!!j.soc?.length && <Row k="Society" v={j.soc.join('; ')} />}
            </dl>
          </section>

          <section aria-labelledby="coverage" className="panel p-4">
            <h2 id="coverage" className="text-[15px] font-semibold">Coverage</h2>
            <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>
              {core
                ? 'In the POSI Core Collection: the journal applied for certification and passed PQF evaluation.'
                : 'Indexed in POSI from its registry metadata. Journals can apply for Core Collection certification.'}
            </p>
            <p className="mt-2 text-[12.5px]" style={{ color: 'var(--muted)' }}>
              Sources: {(j.src ?? []).map(s => (s === 'openalex' ? 'OpenAlex' : s === 'crossref' ? 'Crossref' : s)).join(', ') || 'POSI'}
            </p>
            {!core && (
              <Link href="/certification/" className="btn mt-3 w-full justify-center">
                <SealCheck className="h-4 w-4" /> Apply for certification
              </Link>
            )}
          </section>
        </aside>
      </div>
    </article>
  )
}

function Row({ k, v, mono }: { k: string; v: React.ReactNode; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-3 py-2">
      <dt style={{ color: 'var(--muted)' }}>{k}</dt>
      <dd className={`break-words ${mono ? 'font-mono text-[13px]' : ''}`}>{v}</dd>
    </div>
  )
}

function EvaluationCard({ j, core }: { j: JournalProfile; core: boolean }) {
  const ev = evaluationFromProfile(j.ev, j.ev?.cat ? PSC_NAME[j.ev.cat] ?? null : null)
  return (
    <section aria-labelledby="evaluation" className="panel p-4">
      <h2 id="evaluation" className="text-[15px] font-semibold mb-3">Evaluation</h2>
      <EvaluationPanel ev={ev} core={core ? 'core' : 'indexed'} idPrefix="pev" showPqf={core} />
      {hasZone(j) && (
        <Link href={`/certificate/zone/?issn=${encodeURIComponent(j.k)}`} className="btn mt-4 w-full justify-center" prefetch={false}>
          <Certificate className="h-4 w-4" /> Zone certificate
        </Link>
      )}
      <Link href="/methodology/" className="link mt-3 inline-block text-[12.5px]">How journals are evaluated</Link>
    </section>
  )
}

function YearChart({ rows }: { rows: [number, number, number][] }) {
  const recent = rows.slice(-10)
  const maxW = Math.max(1, ...recent.map(r => r[1]))
  const maxC = Math.max(1, ...recent.map(r => r[2]))
  return (
    <section aria-labelledby="per-year">
      <div className="flex items-baseline justify-between gap-4 mb-3">
        <h2 id="per-year" className="text-[17px] font-semibold tracking-tight">Publications and citations per year</h2>
        <div className="flex gap-4 text-[12px]" style={{ color: 'var(--muted)' }}>
          <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: 'var(--teal)' }} />Publications</span>
          <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: 'var(--line)' }} />Citations</span>
        </div>
      </div>
      <div className="panel p-4">
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${recent.length}, minmax(0, 1fr))` }}>
          {recent.map(([y, w, c]) => (
            <div key={y} className="flex flex-col items-center gap-1.5 min-w-0" title={`${y}: ${fmt(w)} publications, ${fmt(c)} citations`}>
              <div className="flex items-end gap-0.5 h-36 w-full justify-center">
                <div className="w-1/3 max-w-4 rounded-t-sm" style={{ height: `${(w / maxW) * 100}%`, minHeight: w ? 2 : 0, background: 'var(--teal)' }} />
                <div className="w-1/3 max-w-4 rounded-t-sm" style={{ height: `${(c / maxC) * 100}%`, minHeight: c ? 2 : 0, background: 'var(--line)' }} />
              </div>
              <span className="font-mono text-[11px] tnum" style={{ color: 'var(--muted)' }}>{String(y).slice(2)}</span>
            </div>
          ))}
        </div>
        <table className="sr-only">
          <caption>Publications and citations per year</caption>
          <thead><tr><th>Year</th><th>Publications</th><th>Citations</th></tr></thead>
          <tbody>{recent.map(([y, w, c]) => <tr key={y}><td>{y}</td><td>{w}</td><td>{c}</td></tr>)}</tbody>
        </table>
        <p className="mt-3 text-[12px]" style={{ color: 'var(--soft)' }}>Bars are scaled separately. Citations are counted in the year they were received.</p>
      </div>
    </section>
  )
}

function Skeleton() {
  return (
    <div className="pt-10 space-y-4" aria-busy="true" aria-label="Loading journal">
      <div className="h-4 w-48 rounded-[2px] animate-pulse" style={{ background: 'var(--surface-2)' }} />
      <div className="h-9 w-2/3 rounded-[2px] animate-pulse" style={{ background: 'var(--surface-3)' }} />
      <div className="h-4 w-1/3 rounded-[2px] animate-pulse" style={{ background: 'var(--surface-2)' }} />
      <div className="h-20 rounded-[2px] animate-pulse mt-6" style={{ background: 'var(--surface-2)' }} />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="h-64 rounded-[2px] animate-pulse" style={{ background: 'var(--surface-2)' }} />
        <div className="h-64 rounded-[2px] animate-pulse" style={{ background: 'var(--surface-2)' }} />
      </div>
    </div>
  )
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="py-16 max-w-xl">
      <h1 className="text-[24px] font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-[15px]" style={{ color: 'var(--ink-2)' }}>{body}</p>
      <Link href="/journals/" className="btn btn-primary mt-5">Search journals</Link>
    </div>
  )
}
