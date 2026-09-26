'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowSquareOut, LockOpen, Warning } from '@phosphor-icons/react/dist/ssr'
import { getWork, abstractOf, doiOf, pages, shortId, toBibtex, toRis, download, TYPE_LABEL, type Work } from '@/lib/openalex'
import { usePosiIssnMap, matchIssn } from '@/lib/use-posi-issn'
import { recordHref } from '@/lib/records'
import { CollectionTag, VerificationPill, SectionTitle } from '@/components/db'

type State = { kind: 'loading' } | { kind: 'error'; notFound: boolean } | { kind: 'ok'; w: Work }
type CiteFormat = 'apa' | 'bibtex' | 'ris'

function apaOf(w: Work): string {
  const src = w.primary_location?.source
  const doi = doiOf(w)
  const names = w.authorships.map(a => a.author.display_name)
  const who = names.slice(0, 20).join(', ') + (names.length > 20 ? ', et al.' : '')
  const vol = (w.biblio?.volume ? `, ${w.biblio.volume}` : '') + (w.biblio?.issue ? `(${w.biblio.issue})` : '')
  const pg = pages(w) ? `, ${pages(w)}` : ''
  return `${who} (${w.publication_year ?? 'n.d.'}). ${w.title ?? ''}. ${src?.display_name ?? ''}${vol}${pg}.${doi ? ` https://doi.org/${doi}` : ''}`
}

function Skeleton() {
  return (
    <div className="pt-10 space-y-4 max-w-[900px]" aria-busy="true" aria-label="Loading publication">
      <div className="h-4 w-48 rounded-[6px] animate-pulse" style={{ background: 'var(--surface-3)' }} />
      <div className="h-8 w-5/6 rounded-[6px] animate-pulse" style={{ background: 'var(--surface-3)' }} />
      <div className="h-4 w-2/3 rounded-[6px] animate-pulse" style={{ background: 'var(--surface-2)' }} />
      <div className="h-40 rounded-[6px] animate-pulse mt-8" style={{ background: 'var(--surface-2)' }} />
    </div>
  )
}

export function WorkViewer() {
  const id = (useSearchParams().get('id') ?? '').trim()
  const [result, setResult] = useState<{ id: string; state: State } | null>(null)
  const state: State = !id ? { kind: 'error', notFound: true } : result?.id === id ? result.state : { kind: 'loading' }
  const [cite, setCite] = useState<CiteFormat>('apa')
  const issnMap = usePosiIssnMap()

  useEffect(() => {
    if (!id) return
    const ctrl = new AbortController()
    getWork(id, ctrl.signal)
      .then(w => setResult({ id, state: { kind: 'ok', w } }))
      .catch(e => { if (e.name !== 'AbortError') setResult({ id, state: { kind: 'error', notFound: /404/.test(String(e.message)) } }) })
    return () => ctrl.abort()
  }, [id])

  if (state.kind === 'loading') return <Skeleton />

  if (state.kind === 'error') {
    return (
      <div className="pt-16 max-w-xl">
        <h1 className="text-[24px] font-semibold">{state.notFound ? 'Publication not found' : 'Could not load this publication'}</h1>
        <p className="mt-2" style={{ color: 'var(--muted)' }}>
          {state.notFound
            ? `OpenAlex has no work for "${id}".`
            : 'OpenAlex did not answer. It may be rate limiting anonymous requests. Try again shortly.'}
        </p>
        <Link href={`/publications/?q=${encodeURIComponent(id)}`} className="btn btn-primary mt-6">Search publications</Link>
      </div>
    )
  }

  const w = state.w
  const src = w.primary_location?.source
  const doi = doiOf(w)
  const abs = abstractOf(w)
  const posi = matchIssn(issnMap, src?.issn ?? (src?.issn_l ? [src.issn_l] : null))
  const citeText = cite === 'apa' ? apaOf(w) : cite === 'bibtex' ? toBibtex(w) : toRis(w)
  const pg = pages(w)

  return (
    <article className="pt-8 md:pt-10">
      <nav aria-label="Breadcrumb" className="mb-3 text-[12.5px] font-mono" style={{ color: 'var(--muted)' }}>
        <Link href="/publications/" className="hover:underline">Publications</Link>
        <span className="mx-1.5" style={{ color: 'var(--soft)' }}>/</span>
        <span>{shortId(w)}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]" style={{ color: 'var(--muted)' }}>
            {w.type && <span>{TYPE_LABEL[w.type] ?? w.type}</span>}
            {w.publication_date && <time className="font-mono" dateTime={w.publication_date}>{w.publication_date}</time>}
            {w.open_access?.is_oa && (
              <span className="inline-flex items-center gap-1" style={{ color: 'var(--verified)' }}>
                <LockOpen className="h-3.5 w-3.5" /> Open access ({w.open_access.oa_status})
              </span>
            )}
            {w.is_retracted && (
              <span className="inline-flex items-center gap-1" style={{ color: 'var(--rejected)' }}>
                <Warning className="h-3.5 w-3.5" /> Retracted
              </span>
            )}
          </div>
          <h1 className="mt-2 text-[26px] md:text-[32px] font-semibold leading-tight tracking-tight" style={{ color: 'var(--ink)' }}>
            {w.title || 'Untitled'}
          </h1>

          <ul className="mt-4 flex flex-wrap gap-x-1 text-[14.5px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>
            {w.authorships.map((a, i) => (
              <li key={a.author.id + i}>
                {a.author.orcid
                  ? <a href={a.author.orcid} target="_blank" rel="noopener noreferrer" className="hover:underline">{a.author.display_name}</a>
                  : a.author.display_name}
                {a.institutions[0]?.country_code && (
                  <sup className="ml-0.5 text-[10px]" style={{ color: 'var(--soft)' }} title={a.institutions[0].display_name}>{a.institutions[0].country_code}</sup>
                )}
                {i < w.authorships.length - 1 && ','}
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-wrap gap-2">
            {doi && <a href={`https://doi.org/${doi}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary">Publisher page <ArrowSquareOut className="h-4 w-4" /></a>}
            {w.open_access?.oa_url && <a href={w.open_access.oa_url} target="_blank" rel="noopener noreferrer" className="btn">Full text <ArrowSquareOut className="h-4 w-4" /></a>}
            <a href={w.id} target="_blank" rel="noopener noreferrer" className="btn">OpenAlex <ArrowSquareOut className="h-4 w-4" /></a>
          </div>

          <section className="mt-10" aria-labelledby="abstract">
            <SectionTitle id="abstract">Abstract</SectionTitle>
            {abs
              ? <p className="text-[15.5px] leading-[1.75] max-w-[75ch]" style={{ color: 'var(--ink-2)' }}>{abs}</p>
              : <p className="text-[14px]" style={{ color: 'var(--muted)' }}>No abstract is available in OpenAlex for this publication.</p>}
          </section>

          {!!w.keywords?.length && (
            <section className="mt-8" aria-labelledby="kw">
              <SectionTitle id="kw">Keywords</SectionTitle>
              <ul className="flex flex-wrap gap-2">
                {w.keywords.map(k => (
                  <li key={k.display_name}>
                    <Link href={`/publications/?q=${encodeURIComponent(k.display_name)}`} className="chip hover:underline">{k.display_name}</Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-8" aria-labelledby="cite">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 id="cite" className="text-[17px] font-semibold tracking-tight">Cite</h2>
              <div className="flex gap-1" role="tablist" aria-label="Citation format">
                {(['apa', 'bibtex', 'ris'] as const).map(f => (
                  <button
                    key={f}
                    role="tab"
                    aria-selected={cite === f}
                    type="button"
                    onClick={() => setCite(f)}
                    className="btn btn-sm"
                    style={cite === f ? { background: 'var(--teal-soft)', color: 'var(--teal)', borderColor: 'var(--teal-line)' } : undefined}
                  >
                    {f === 'apa' ? 'APA' : f === 'bibtex' ? 'BibTeX' : 'RIS'}
                  </button>
                ))}
              </div>
            </div>
            <pre className="code whitespace-pre-wrap break-words"><code>{citeText}</code></pre>
            <div className="mt-2 flex gap-2">
              <button type="button" className="btn btn-sm" onClick={() => navigator.clipboard?.writeText(citeText)}>Copy</button>
              {cite !== 'apa' && (
                <button type="button" className="btn btn-sm" onClick={() => download(`${shortId(w)}.${cite === 'bibtex' ? 'bib' : 'ris'}`, citeText, 'text/plain')}>
                  Download
                </button>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start text-[13.5px]">
          <div className="panel p-4">
            <p className="text-[12.5px]" style={{ color: 'var(--muted)' }}>Published in</p>
            <p className="mt-1 font-medium" style={{ color: 'var(--ink)' }}>{src?.display_name ?? 'No source recorded'}</p>
            {src?.host_organization_name && <p style={{ color: 'var(--muted)' }}>{src.host_organization_name}</p>}
            <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5">
              {w.biblio?.volume && <><dt style={{ color: 'var(--muted)' }}>Volume</dt><dd className="font-mono">{w.biblio.volume}</dd></>}
              {w.biblio?.issue && <><dt style={{ color: 'var(--muted)' }}>Issue</dt><dd className="font-mono">{w.biblio.issue}</dd></>}
              {pg && <><dt style={{ color: 'var(--muted)' }}>Pages</dt><dd className="font-mono">{pg}</dd></>}
              {src?.issn_l && <><dt style={{ color: 'var(--muted)' }}>ISSN-L</dt><dd className="font-mono">{src.issn_l}</dd></>}
              {doi && <><dt style={{ color: 'var(--muted)' }}>DOI</dt><dd className="font-mono break-all">{doi}</dd></>}
              {w.primary_location?.license && <><dt style={{ color: 'var(--muted)' }}>License</dt><dd>{w.primary_location.license}</dd></>}
            </dl>
            {src?.issn_l && <Link href={`/publications/?issn=${src.issn_l}&sort=newest`} className="mt-3 inline-block link">More from this source</Link>}
          </div>

          <div className="panel p-4">
            <p className="font-medium" style={{ color: 'var(--ink)' }}>In POSI</p>
            {posi ? (
              <>
                <div className="mt-2 flex flex-wrap gap-2"><CollectionTag k={posi.k} /><VerificationPill v={posi.v} /></div>
                <Link href={recordHref(posi)} className="mt-3 inline-block link">Open journal record</Link>
              </>
            ) : (
              <p className="mt-1 leading-relaxed" style={{ color: 'var(--muted)' }}>
                {issnMap ? 'This source is not in the Core Collection or the Global Benchmark.' : 'Checking the index.'}
              </p>
            )}
          </div>

          <div className="panel grid grid-cols-2">
            <div className="p-4" style={{ borderRight: '1px solid var(--line)' }}>
              <p className="font-mono text-[22px] tnum">{w.cited_by_count.toLocaleString('en-US')}</p>
              <p className="text-[12.5px]" style={{ color: 'var(--muted)' }}>Citations</p>
            </div>
            <div className="p-4">
              <p className="font-mono text-[22px] tnum">{(w.referenced_works_count ?? 0).toLocaleString('en-US')}</p>
              <p className="text-[12.5px]" style={{ color: 'var(--muted)' }}>References</p>
            </div>
          </div>
          {w.primary_topic && (
            <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
              Topic: {w.primary_topic.display_name}{w.primary_topic.field ? ` (${w.primary_topic.field.display_name})` : ''}. Data: OpenAlex, CC0.
            </p>
          )}
        </aside>
      </div>
    </article>
  )
}
