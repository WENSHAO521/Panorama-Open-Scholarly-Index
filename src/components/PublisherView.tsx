'use client'

// One publisher: summary figures, where its journals are registered, what
// they cover, and every journal it has in POSI. Rendered by the static
// /publishers/<slug>/ pages and by the in-browser /publisher/ viewer.

import Link from 'next/link'
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { MagnifyingGlass } from '@phosphor-icons/react/dist/ssr'
import psc from '@/lib/psc-v1.0.snapshot.json'
import { publisherHref, publisherJsonHref, type PublisherDetail, type PublisherJournal } from '@/lib/publishers'
import { Note, PageHeader, SectionTitle, fmt } from './db'
import { useLocale } from '@/i18n/LocaleProvider'
import { localizedHref } from '@/i18n/alternates'
import { fill, subjectName } from '@/i18n/format'
import { countryNameIn } from '@/i18n/places'

const PAGE = 50
type Sort = 'works' | 'title'
type Scope = 'all' | 'core' | 'oa' | 'doaj'

const PSC_NAME: Record<string, string> = { multidisciplinary: 'Multidisciplinary', ...Object.fromEntries(psc.categories.map(c => [c.code, c.name])) }
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : '-')

const en = {
  publishers: 'Publishers', download: 'Download JSON',
  lead1: 'indexed journal registered to this publisher name at Crossref or OpenAlex', leadN: 'indexed journals registered to this publisher name at Crossref or OpenAlex',
  mainly: ', mainly in {countries}', end: '.', listSep: ', ',
  stats: { indexed: 'Indexed journals', core: 'Core Collection', certified: 'certified by POSI', noneCertified: 'none certified', oa: 'Open access', oaNote: '{n} journals', doaj: 'In DOAJ', works: 'Works', worksNote: 'OpenAlex works or Crossref DOIs', countries: 'Countries' },
  alsoAs: 'Also registered as ', and: ' and ', noMerge: '. POSI shows publisher names as registered and does not merge them.',
  subjects: 'Subjects', notClassified: '{n} not yet classified', noSubjects: 'No subject profile yet for this publisher\u2019s journals.',
  countries: 'Countries', noCountries: 'No country is registered for this publisher\u2019s journals.', more: 'and {n} more',
  journals: 'Journals', filter: 'Filter journals', placeholder: 'Filter by title or ISSN', show: 'Show',
  scope: { all: 'All journals', core: 'Core Collection only', oa: 'Open access only', doaj: 'In DOAJ only' },
  sort: 'Sort', mostWorks: 'Most works', titleAz: 'Title A to Z', of: ' of {n} journals', loadingFull: ', loading the full list',
  cols: { journal: 'Journal', issn: 'ISSN', subject: 'Subject', oa: 'Open access', works: 'Works' },
  core: 'Core', unclassified: 'Not yet classified', yesDoaj: 'Yes, in DOAJ', yes: 'Yes', no: 'No', none: 'No journal matches that filter.',
  pagination: 'Pagination', previous: 'Previous', next: 'Next', page: 'page {page} of {pages}',
}
const WORDS: Record<'en' | 'zh-Hans', typeof en> = {
  en,
  'zh-Hans': {
    publishers: '出版商', download: '下载 JSON',
    lead1: '种收录期刊在 Crossref 或 OpenAlex 以此出版商名称注册', leadN: '种收录期刊在 Crossref 或 OpenAlex 以此出版商名称注册',
    mainly: '，主要分布在{countries}', end: '。', listSep: '、',
    stats: { indexed: '收录期刊', core: '核心合集', certified: '经 POSI 认证', noneCertified: '暂无认证期刊', oa: '开放获取', oaNote: '{n} 种期刊', doaj: '已收录于 DOAJ', works: '发文量', worksNote: 'OpenAlex 作品或 Crossref DOI', countries: '国家/地区' },
    alsoAs: '该出版商也以下列名称注册：', and: '、', noMerge: '。POSI 按注册名称展示出版商，不作合并。',
    subjects: '学科', notClassified: '{n} 种尚未分类', noSubjects: '该出版商的期刊暂无学科信息。',
    countries: '国家/地区', noCountries: '该出版商的期刊均未登记国家/地区。', more: '另有 {n} 个',
    journals: '期刊', filter: '筛选期刊', placeholder: '按刊名或 ISSN 筛选', show: '显示',
    scope: { all: '全部期刊', core: '仅核心合集', oa: '仅开放获取', doaj: '仅 DOAJ 收录' },
    sort: '排序', mostWorks: '发文量最多', titleAz: '刊名 A–Z', of: ' / 共 {n} 种期刊', loadingFull: '，正在加载完整列表',
    cols: { journal: '期刊', issn: 'ISSN', subject: '学科', oa: '开放获取', works: '发文量' },
    core: '核心合集', unclassified: '尚未分类', yesDoaj: '是，已收录于 DOAJ', yes: '是', no: '否', none: '没有符合筛选条件的期刊。',
    pagination: '分页', previous: '上一页', next: '下一页', page: '第 {page} 页，共 {pages} 页',
  },
}

export function PublisherView({ p }: { p: PublisherDetail }) {
  const locale = useLocale()
  const t = WORDS[locale]
  const href = (h: string) => localizedHref(locale, h)
  const country = (c: string) => countryNameIn(locale, c) ?? c
  const subject = (code: string) => subjectName(locale, code, PSC_NAME[code] ?? code)
  // Static pages embed only the first journals; the full list loads from the publisher's shard.
  const [loaded, setLoaded] = useState<{ slug: string; journals: PublisherJournal[] } | null>(null)
  const partial = p.journals.length < p.n
  const journals = loaded?.slug === p.slug ? loaded.journals : p.journals
  useEffect(() => {
    if (!partial) return
    let cancelled = false
    fetch(publisherJsonHref(p.slug))
      .then(r => r.json())
      .then((rows: PublisherDetail[]) => {
        const full = rows.find(x => x.slug === p.slug)
        if (!cancelled && full) setLoaded({ slug: p.slug, journals: full.journals })
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [p.slug, partial])

  const [q, setQ] = useState('')
  const [sort, setSort] = useState<Sort>('works')
  const [scope, setScope] = useState<Scope>('all')
  const dq = useDeferredValue(q)
  const filterKey = `${q}|${sort}|${scope}`
  const [pageState, setPageState] = useState({ key: filterKey, n: 1 })
  const page = pageState.key === filterKey ? pageState.n : 1
  const tableTop = useRef<HTMLDivElement>(null)
  const setPage = (f: (p: number) => number) => { setPageState({ key: filterKey, n: f(page) }); tableTop.current?.scrollIntoView({ block: 'start' }) }

  const filtered = useMemo(() => {
    const n = dq.trim().toLowerCase()
    let out = journals
    if (scope === 'core') out = out.filter(j => j.core)
    else if (scope === 'oa') out = out.filter(j => j.oa)
    else if (scope === 'doaj') out = out.filter(j => j.dj)
    if (n) out = out.filter(j => j.t.toLowerCase().includes(n) || j.i?.toLowerCase().includes(n))
    if (sort === 'title') out = [...out].sort((a, b) => a.t.localeCompare(b.t, 'en', { sensitivity: 'base' }))
    return out
  }, [journals, dq, sort, scope])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE))
  const shown = filtered.slice((page - 1) * PAGE, page * PAGE)
  const topCountries = p.countries.slice(0, 8)
  const classified = p.subjects.reduce((s, [, n]) => s + n, 0)

  return (
    <div className="pb-10">
      <PageHeader
        title={p.name}
        locale={locale}
        crumbs={[{ label: 'POSI', href: href('/') }, { label: t.publishers, href: href('/publishers/') }, { label: p.name }]}
        actions={<a href={publisherJsonHref(p.slug)} className="btn">{t.download}</a>}
      >
        <p className="max-w-[68ch]">
          {fmt(p.n)} {p.n === 1 ? t.lead1 : t.leadN}
          {topCountries.length > 0 && fill(t.mainly, { countries: topCountries.slice(0, 3).map(c => country(c[0])).join(t.listSep) })}{t.end}
        </p>
      </PageHeader>

      <div className="stat-strip grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {([
          [t.stats.indexed, fmt(p.n), null],
          [t.stats.core, fmt(p.core), p.core ? t.stats.certified : t.stats.noneCertified],
          [t.stats.oa, pct(p.oa, p.n), fill(t.stats.oaNote, { n: fmt(p.oa) })],
          [t.stats.doaj, fmt(p.doaj), pct(p.doaj, p.n)],
          [t.stats.works, fmt(p.works), t.stats.worksNote],
          [t.stats.countries, fmt(p.countries.length), null],
        ] as const).map(([label, value, note]) => (
          <div key={label}>
            <p className="label">{label}</p>
            <p className="mt-1 figure text-[22px]">{value}</p>
            {note && <p className="note">{note}</p>}
          </div>
        ))}
      </div>

      {p.variants.length > 0 && (
        <div className="mt-6">
          <Note>
            {t.alsoAs}
            {p.variants.map((v, i) => (
              <span key={v.slug}>
                {i > 0 && (i === p.variants.length - 1 ? t.and : t.listSep)}
                <Link href={href(publisherHref(v))} prefetch={false} className="link">{v.name}</Link> ({fmt(v.n)})
              </span>
            ))}
            {t.noMerge}
          </Note>
        </div>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <section aria-labelledby="pub-subjects">
          <SectionTitle id="pub-subjects" aside={classified < p.n ? fill(t.notClassified, { n: fmt(p.n - classified) }) : undefined}>{t.subjects}</SectionTitle>
          {p.subjects.length ? (
            <ul className="panel overflow-hidden text-[14px]">
              {p.subjects.slice(0, 10).map(([code, n], i) => (
                <li key={code} className="flex items-baseline justify-between gap-4 px-4 py-2.5" style={i ? { borderTop: '1px solid var(--line-soft)' } : undefined}>
                  <Link href={href(`/journals/subject/${code}/`)} className="hover:underline" style={{ color: 'var(--teal)' }}>{subject(code)}</Link>
                  <span className="font-mono tnum" style={{ color: 'var(--muted)' }}>{fmt(n)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[14px]" style={{ color: 'var(--muted)' }}>{t.noSubjects}</p>
          )}
        </section>

        <section aria-labelledby="pub-countries">
          <SectionTitle id="pub-countries">{t.countries}</SectionTitle>
          {topCountries.length ? (
            <ul className="panel overflow-hidden text-[14px]">
              {topCountries.map(([c, n], i) => (
                <li key={c} className="flex items-baseline justify-between gap-4 px-4 py-2.5" style={i ? { borderTop: '1px solid var(--line-soft)' } : undefined}>
                  <span style={{ color: 'var(--ink)' }}>{country(c)}</span>
                  <span className="font-mono tnum" style={{ color: 'var(--muted)' }}>{fmt(n)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[14px]" style={{ color: 'var(--muted)' }}>{t.noCountries}</p>
          )}
          {p.countries.length > topCountries.length && (
            <p className="mt-2 text-[13px]" style={{ color: 'var(--muted)' }}>{fill(t.more, { n: fmt(p.countries.length - topCountries.length) })}</p>
          )}
        </section>
      </div>

      <section aria-labelledby="pub-journals" className="mt-12">
        <SectionTitle id="pub-journals">{t.journals}</SectionTitle>
        {p.n > 5 && (
          <div className="panel p-3 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <label htmlFor="pub-j-search" className="sr-only">{t.filter}</label>
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'var(--soft)' }} />
              <input id="pub-j-search" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder={t.placeholder} className="input h-10 pl-9" />
            </div>
            <label htmlFor="pub-j-scope" className="sr-only">{t.show}</label>
            <select id="pub-j-scope" value={scope} onChange={e => setScope(e.target.value as Scope)} className="input h-10 w-auto pr-8">
              <option value="all">{t.scope.all}</option>
              <option value="core">{t.scope.core}</option>
              <option value="oa">{t.scope.oa}</option>
              <option value="doaj">{t.scope.doaj}</option>
            </select>
            <label htmlFor="pub-j-sort" className="sr-only">{t.sort}</label>
            <select id="pub-j-sort" value={sort} onChange={e => setSort(e.target.value as Sort)} className="input h-10 w-auto pr-8">
              <option value="works">{t.mostWorks}</option>
              <option value="title">{t.titleAz}</option>
            </select>
          </div>
        )}

        {p.n > 5 && (
          <p className="mt-4 mb-2 text-[13px]" style={{ color: 'var(--muted)' }} aria-live="polite">
            <span className="font-semibold tnum" style={{ color: 'var(--ink)' }}>{fmt(filtered.length)}</span>{fill(t.of, { n: fmt(p.n) })}
            {journals.length < p.n && <span style={{ color: 'var(--soft)' }}>{t.loadingFull}</span>}
          </p>
        )}

        <div ref={tableTop} className="panel overflow-x-auto" style={{ scrollMarginTop: 72 }}>
          <table className="dtable min-w-[720px]">
            <thead>
              <tr>
                <th>{t.cols.journal}</th>
                <th>{t.cols.issn}</th>
                <th>{t.cols.subject}</th>
                <th>{t.cols.oa}</th>
                <th className="text-right">{t.cols.works}</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((j, idx) => (
                <tr key={`${j.i ?? j.t}-${idx}`}>
                  <td className="max-w-[380px]">
                    <Link href={href(j.h)} prefetch={false} className="font-medium hover:underline" style={{ color: 'var(--teal)' }}>{j.t}</Link>
                    {j.core && <span className="chip ml-2" style={{ color: 'var(--teal)', background: 'var(--teal-soft)', borderColor: 'transparent' }}>{t.core}</span>}
                    {j.co && <span className="block text-[12.5px]" style={{ color: 'var(--muted)' }}>{country(j.co)}</span>}
                  </td>
                  <td className="font-mono text-[12.5px] whitespace-nowrap">{j.i ?? '-'}</td>
                  <td className="text-[13px]" style={{ color: j.s ? 'var(--ink-2)' : 'var(--soft)' }}>{j.s ? subject(j.s) : t.unclassified}</td>
                  <td className="text-[13px]" style={{ color: j.oa ? 'var(--ink)' : 'var(--soft)' }}>
                    {j.oa ? (j.dj ? t.yesDoaj : t.yes) : j.oa === false ? t.no : '-'}
                  </td>
                  <td className="text-right font-mono tnum" style={{ color: 'var(--muted)' }}>{fmt(j.w)}</td>
                </tr>
              ))}
              {!shown.length && (
                <tr><td colSpan={5} className="py-12 text-center" style={{ color: 'var(--muted)' }}>{t.none}</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <nav aria-label={t.pagination} className="flex items-center justify-between mt-4 text-[13px]">
            <button type="button" className="btn btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>{t.previous}</button>
            <span className="font-mono" style={{ color: 'var(--muted)' }}>{fill(t.page, { page, pages: fmt(pages) })}</span>
            <button type="button" className="btn btn-sm" disabled={page === pages} onClick={() => setPage(p => p + 1)}>{t.next}</button>
          </nav>
        )}
      </section>
    </div>
  )
}
