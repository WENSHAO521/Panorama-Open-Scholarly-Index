'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { LockOpen, Warning } from '@phosphor-icons/react/dist/ssr'
import { getWork, abstractOf, doiOf, pages, shortId, toBibtex, toRis, download, TYPE_LABEL, type Work, RegistryError } from '@/lib/openalex'
import { generateCitationText, generatePsgInText, generateShortNote } from '@/components/CitationFormatter'
import type { Article } from '@/lib/types'
import { usePosiIssnMap, matchIssn } from '@/lib/use-posi-issn'
import { recordHref } from '@/lib/records'
import { CollectionTag, SectionTitle } from '@/components/db'
import { PUBLICATION_TYPE_ZH } from '@/i18n/publication-types'
import type { Locale } from '@/i18n/config'
import { useLocale } from '@/i18n/LocaleProvider'
import { localizedHref } from '@/i18n/alternates'
import { fill } from '@/i18n/format'

type State = { kind: 'loading' } | { kind: 'error'; notFound: boolean } | { kind: 'ok'; w: Work }
const CITE_FORMATS = [
  { id: 'apa', label: 'APA' }, { id: 'psg', label: 'PSG' }, { id: 'footnote', label: 'Footnote' },
  { id: 'bibtex', label: 'BibTeX' }, { id: 'ris', label: 'RIS' },
] as const

// The page's words. The citations themselves stay in English, as on the citation generator.
const en = {
  loading: 'Loading publication', notFoundTitle: 'Publication not found', errorTitle: 'Could not load this publication',
  notFoundBody: 'No work found for "{id}" in OpenAlex, Crossref, DataCite or Zenodo.',
  errorBody: 'None of OpenAlex, Crossref, DataCite or Zenodo answered. This usually clears within a minute; reload the page to try again.',
  search: 'Search publications', breadcrumb: 'Breadcrumb', publications: 'Publications',
  openAccess: 'Open access ({status})', retracted: 'Retracted', untitled: 'Untitled',
  publisherPage: 'Publisher page', fullText: 'Full text', abstract: 'Abstract', noAbstract: 'No abstract is available for this publication.',
  keywords: 'Keywords', cite: 'Cite', citeFormat: 'Citation format', footnote: 'Footnote', inText: 'In-text', shortNote: 'Short note',
  copy: 'Copy', download: 'Download', moreStyles: 'MLA, Chicago and GB/T',
  publishedIn: 'Published in', noSource: 'No source recorded', volume: 'Volume', issue: 'Issue', pages: 'Pages', license: 'License',
  moreFromSource: 'More from this source', inPosi: 'In POSI', indexed: 'Indexed',
  inCore: 'Published in a Core Collection journal.', inIndexed: 'Published in an indexed journal.', eligible: ' Eligible for an indexing certificate.',
  issueCertificate: 'Issue a certificate', notJournal: 'Not a journal publication, so it is not certified.',
  citations: 'Citations', references: 'References', topic: 'Topic: {topic}{field}. Data: OpenAlex, CC0.',
  types: null as Record<string, string> | null,
}
const WORDS: Record<Locale, typeof en> = {
  en,
  'zh-Hans': {
    loading: '正在加载文献', notFoundTitle: '未找到该文献', errorTitle: '无法加载该文献',
    notFoundBody: '在 OpenAlex、Crossref、DataCite 和 Zenodo 中均未找到“{id}”。',
    errorBody: 'OpenAlex、Crossref、DataCite 和 Zenodo 均未响应。这通常会在一分钟内恢复，请刷新页面重试。',
    search: '检索文献', breadcrumb: '面包屑导航', publications: '文献',
    openAccess: '开放获取（{status}）', retracted: '已撤稿', untitled: '无题名',
    publisherPage: '出版商页面', fullText: '全文', abstract: '摘要', noAbstract: '该文献暂无摘要。',
    keywords: '关键词', cite: '引用', citeFormat: '引文格式', footnote: '脚注', inText: '文内引注', shortNote: '简注',
    copy: '复制', download: '下载', moreStyles: 'MLA、Chicago 与 GB/T',
    publishedIn: '发表于', noSource: '未记录来源', volume: '卷', issue: '期', pages: '页码', license: '许可协议',
    moreFromSource: '该来源的更多文献', inPosi: 'POSI 收录情况', indexed: '已收录',
    inCore: '发表于核心合集期刊。', inIndexed: '发表于收录期刊。', eligible: '可申请收录证书。',
    issueCertificate: '开具证书', notJournal: '并非期刊文献，因此不予认证。',
    citations: '被引次数', references: '参考文献', topic: '主题：{topic}{field}。数据来源：OpenAlex，CC0。',
    types: PUBLICATION_TYPE_ZH,
  },
}
type CiteFormat = typeof CITE_FORMATS[number]['id']
// APA is the default; a visitor's last pick is remembered on their browser.
const CITE_KEY = 'posi:work-cite-format'

/** The citation styles are written for the citation generator's Article; map a Work onto it. */
function workToArticle(w: Work): Article {
  const doi = doiOf(w) ?? ''
  return {
    id: doi || w.id, doi, title: w.title ?? '', subtitle: null,
    journal_id: '', journal_title: w.primary_location?.source?.display_name ?? '',
    volume: w.biblio?.volume ?? null, issue: w.biblio?.issue ?? null,
    first_page: w.biblio?.first_page ?? null, last_page: w.biblio?.last_page ?? null,
    // 0 is not a plausible year, so the styles print "n.d."
    publication_year: w.publication_year ?? 0, publication_date: w.publication_date,
    article_type: w.type === 'dataset' ? 'Dataset' : w.type === 'software' ? 'Software' : (w.type ?? 'Article'),
    language: w.language ?? '', abstract: null, keywords: [], license: null, pdf_url: null, html_url: null,
    openalex_work_id: null, crossref_status: null, cited_by_count: w.cited_by_count, reference_count: 0,
    is_retracted: !!w.is_retracted, metadata_quality_score: 0, created_at: '', updated_at: '',
    authors: w.authorships.map((a, i) => ({
      id: a.author.id || String(i), display_name: a.author.display_name,
      given_name: a.author.given ?? null, family_name: a.author.family ?? null,
      orcid: a.author.orcid, openalex_author_id: null, country: null,
    })),
  }
}

// OpenAlex gives either a short key ("cc-by") or a licence URL; show a short label, link the URL.
function LicenseValue({ value }: { value: string }) {
  const cc = value.match(/creativecommons\.org\/(?:licenses|publicdomain)\/([a-z-]+)\/([\d.]+)/i)
  const kind = cc?.[1].toLowerCase()
  const label = !cc ? value : kind === 'zero' ? 'CC0' : `CC ${kind!.toUpperCase()} ${cc[2]}`
  return /^https?:\/\//.test(value)
    ? <a href={value} target="_blank" rel="noopener noreferrer" className="link">{label}</a>
    : <>{label}</>
}

function Skeleton({ label }: { label: string }) {
  return (
    <div className="pt-10 space-y-4 max-w-[900px]" aria-busy="true" aria-label={label}>
      <div className="h-4 w-48 rounded-[var(--radius)] animate-pulse" style={{ background: 'var(--surface-3)' }} />
      <div className="h-8 w-5/6 rounded-[var(--radius)] animate-pulse" style={{ background: 'var(--surface-3)' }} />
      <div className="h-4 w-2/3 rounded-[var(--radius)] animate-pulse" style={{ background: 'var(--surface-2)' }} />
      <div className="h-40 rounded-[var(--radius)] animate-pulse mt-8" style={{ background: 'var(--surface-2)' }} />
    </div>
  )
}

export function WorkViewer() {
  const locale = useLocale()
  const t = WORDS[locale]
  const href = (p: string) => localizedHref(locale, p)
  const id = (useSearchParams().get('id') ?? '').trim()
  const [result, setResult] = useState<{ id: string; state: State } | null>(null)
  const state: State = !id ? { kind: 'error', notFound: true } : result?.id === id ? result.state : { kind: 'loading' }
  const [cite, setCiteState] = useState<CiteFormat>('apa')
  const setCite = (f: CiteFormat) => {
    setCiteState(f)
    try { localStorage.setItem(CITE_KEY, f) } catch { /* storage blocked */ }
  }
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CITE_KEY)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read once after hydration; the server render has no storage
      if (CITE_FORMATS.some(f => f.id === saved)) setCiteState(saved as CiteFormat)
    } catch { /* storage blocked */ }
  }, [])
  const issnMap = usePosiIssnMap()

  useEffect(() => {
    if (!id) return
    const ctrl = new AbortController()
    getWork(id, ctrl.signal)
      .then(w => setResult({ id, state: { kind: 'ok', w } }))
      .catch(e => { if (e.name !== 'AbortError') setResult({ id, state: { kind: 'error', notFound: e instanceof RegistryError ? e.kind === 'not-found' : /404/.test(String(e.message)) } }) })
    return () => ctrl.abort()
  }, [id])

  if (state.kind === 'loading') return <Skeleton label={t.loading} />

  if (state.kind === 'error') {
    return (
      <div className="pt-16 max-w-xl">
        <h1 className="text-[24px] font-semibold">{state.notFound ? t.notFoundTitle : t.errorTitle}</h1>
        <p className="mt-2" style={{ color: 'var(--muted)' }}>
          {state.notFound
            ? fill(t.notFoundBody, { id })
            : t.errorBody}
        </p>
        <Link href={href(`/publications/?q=${encodeURIComponent(id)}`)} className="btn btn-primary mt-6">{t.search}</Link>
      </div>
    )
  }

  const w = state.w
  const src = w.primary_location?.source
  const doi = doiOf(w)
  const abs = abstractOf(w)
  const posi = matchIssn(issnMap, src?.issn ?? (src?.issn_l ? [src.issn_l] : null))
  const article = workToArticle(w)
  const citeText = cite === 'bibtex' ? toBibtex(w) : cite === 'ris' ? toRis(w) : generateCitationText(article, cite)
  const citeExtra = cite === 'psg' ? { label: t.inText, text: generatePsgInText(article.authors, w.publication_year) }
    : cite === 'footnote' ? { label: t.shortNote, text: generateShortNote(article) } : null
  const pg = pages(w)

  return (
    <article className="pt-6 md:pt-8">
      <nav aria-label={t.breadcrumb} className="mb-2.5 text-[12.5px]" style={{ color: 'var(--muted)' }}>
        <Link href={href('/')} className="hover:underline">POSI</Link>
        <span className="mx-1.5" style={{ color: 'var(--soft)' }}>&rsaquo;</span>
        <Link href={href('/publications/')} className="hover:underline">{t.publications}</Link>
        <span className="mx-1.5" style={{ color: 'var(--soft)' }}>&rsaquo;</span>
        <span>{shortId(w)}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]" style={{ color: 'var(--muted)' }}>
            {w.type && <span>{t.types?.[w.type] ?? TYPE_LABEL[w.type] ?? w.type}</span>}
            {w.publication_date && <time className="font-mono" dateTime={w.publication_date}>{w.publication_date}</time>}
            {w.open_access?.is_oa && (
              <span className="inline-flex items-center gap-1" style={{ color: 'var(--verified)' }}>
                <LockOpen className="h-3.5 w-3.5" /> {fill(t.openAccess, { status: w.open_access.oa_status })}
              </span>
            )}
            {w.is_retracted && (
              <span className="inline-flex items-center gap-1" style={{ color: 'var(--rejected)' }}>
                <Warning className="h-3.5 w-3.5" /> {t.retracted}
              </span>
            )}
          </div>
          <h1 className="mt-2 text-[24px] md:text-[32px] font-semibold leading-tight tracking-tight" style={{ color: 'var(--ink)' }}>
            {w.title || t.untitled}
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
            {doi && <a href={`https://doi.org/${doi}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary">{t.publisherPage}</a>}
            {w.open_access?.oa_url && <a href={w.open_access.oa_url} target="_blank" rel="noopener noreferrer" className="btn">{t.fullText}</a>}
            {w.id.startsWith('https://openalex.org/') && <a href={w.id} target="_blank" rel="noopener noreferrer" className="btn">OpenAlex</a>}
          </div>

          <section className="mt-10" aria-labelledby="abstract">
            <SectionTitle id="abstract">{t.abstract}</SectionTitle>
            {abs
              ? <p className="text-[15.5px] leading-[1.75] max-w-[75ch]" style={{ color: 'var(--ink-2)' }}>{abs}</p>
              : <p className="text-[14px]" style={{ color: 'var(--muted)' }}>{t.noAbstract}</p>}
          </section>

          {!!w.keywords?.length && (
            <section className="mt-8" aria-labelledby="kw">
              <SectionTitle id="kw">{t.keywords}</SectionTitle>
              <ul className="flex flex-wrap gap-2">
                {w.keywords.map(k => (
                  <li key={k.display_name}>
                    <Link href={href(`/publications/?q=${encodeURIComponent(k.display_name)}`)} className="chip hover:underline">{k.display_name}</Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-10 panel p-5" aria-labelledby="cite">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <h2 id="cite" className="text-[20px] font-semibold tracking-tight">{t.cite}</h2>
              <div className="flex gap-1" role="tablist" aria-label={t.citeFormat}>
                {CITE_FORMATS.map(({ id: f, label }) => (
                  <button
                    key={f}
                    role="tab"
                    aria-selected={cite === f}
                    type="button"
                    onClick={() => setCite(f)}
                    className="btn btn-sm"
                    style={cite === f ? { background: 'var(--teal-soft)', color: 'var(--teal)', borderColor: 'var(--teal-line)' } : undefined}
                  >
                    {f === 'footnote' ? t.footnote : label}
                  </button>
                ))}
              </div>
            </div>
            <pre className="code whitespace-pre-wrap break-words"><code>{citeText}</code></pre>
            {citeExtra?.text && (
              <p className="mt-2 text-[13px]" style={{ color: 'var(--muted)' }}>
                {citeExtra.label}: <span className="font-mono" style={{ color: 'var(--ink-2)' }}>{citeExtra.text}</span>
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button type="button" className="btn btn-sm" onClick={() => navigator.clipboard?.writeText(citeText)}>{t.copy}</button>
              {(cite === 'bibtex' || cite === 'ris') && (
                <button type="button" className="btn btn-sm" onClick={() => download(`${shortId(w)}.${cite === 'bibtex' ? 'bib' : 'ris'}`, citeText, 'text/plain')}>
                  {t.download}
                </button>
              )}
              {doi && <Link href={href(`/cite/?doi=${encodeURIComponent(doi)}`)} prefetch={false} className="link text-[13px] ml-auto">{t.moreStyles}</Link>}
            </div>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start text-[13.5px]">
          <div className="panel p-4">
            <p className="text-[12.5px]" style={{ color: 'var(--muted)' }}>{t.publishedIn}</p>
            {src ? (
              (posi || src.id)
              ? <Link href={href(posi ? recordHref(posi) : `/journal/?id=${src.id.replace('https://openalex.org/', '')}`)} className="mt-1 block font-medium hover:underline" style={{ color: 'var(--ink)' }}>{src.display_name}</Link>
              : <span className="mt-1 block font-medium" style={{ color: 'var(--ink)' }}>{src.display_name}</span>
            ) : <p className="mt-1 font-medium">{t.noSource}</p>}
            {src?.host_organization_name && <p style={{ color: 'var(--muted)' }}>{src.host_organization_name}</p>}
            <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5">
              {w.biblio?.volume && <><dt style={{ color: 'var(--muted)' }}>{t.volume}</dt><dd className="font-mono">{w.biblio.volume}</dd></>}
              {w.biblio?.issue && <><dt style={{ color: 'var(--muted)' }}>{t.issue}</dt><dd className="font-mono">{w.biblio.issue}</dd></>}
              {pg && <><dt style={{ color: 'var(--muted)' }}>{t.pages}</dt><dd className="font-mono">{pg}</dd></>}
              {src?.issn_l && <><dt style={{ color: 'var(--muted)' }}>ISSN-L</dt><dd className="font-mono">{src.issn_l}</dd></>}
              {doi && <><dt style={{ color: 'var(--muted)' }}>DOI</dt><dd className="font-mono break-all">{doi}</dd></>}
              {w.primary_location?.license && <><dt style={{ color: 'var(--muted)' }}>{t.license}</dt><dd className="break-all"><LicenseValue value={w.primary_location.license} /></dd></>}
            </dl>
            {src?.issn_l && <Link href={href(`/publications/?issn=${src.issn_l}&sort=newest`)} className="mt-3 inline-block link">{t.moreFromSource}</Link>}
          </div>

          <div className="panel p-4">
            <p className="font-medium" style={{ color: 'var(--ink)' }}>{t.inPosi}</p>
            {src?.type === 'journal' || posi ? (
              <>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="chip" style={{ color: 'var(--verified)', background: 'var(--verified-soft)', borderColor: 'transparent' }}>{t.indexed}</span>
                  {posi?.k === 'core' && <CollectionTag k="core" locale={locale} />}
                </div>
                <p className="mt-2 leading-relaxed" style={{ color: 'var(--muted)' }}>
                  {posi?.k === 'core' ? t.inCore : t.inIndexed}{t.eligible}
                </p>
                <Link href={href('/certificate/')} className="mt-2 inline-block link">{t.issueCertificate}</Link>
              </>
            ) : (
              <p className="mt-1 leading-relaxed" style={{ color: 'var(--muted)' }}>{t.notJournal}</p>
            )}
          </div>

          <div className="panel grid grid-cols-2">
            <div className="p-4" style={{ borderRight: '1px solid var(--line)' }}>
              <p className="font-mono text-[22px] tnum">{w.cited_by_count.toLocaleString('en-US')}</p>
              <p className="text-[12.5px]" style={{ color: 'var(--muted)' }}>{t.citations}</p>
            </div>
            <div className="p-4">
              <p className="font-mono text-[22px] tnum">{(w.referenced_works_count ?? 0).toLocaleString('en-US')}</p>
              <p className="text-[12.5px]" style={{ color: 'var(--muted)' }}>{t.references}</p>
            </div>
          </div>
          {w.primary_topic && (
            <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
              {fill(t.topic, { topic: w.primary_topic.display_name, field: w.primary_topic.field ? (locale === 'zh-Hans' ? `（${w.primary_topic.field.display_name}）` : ` (${w.primary_topic.field.display_name})`) : '' })}
            </p>
          )}
        </aside>
      </div>
    </article>
  )
}
