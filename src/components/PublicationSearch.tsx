'use client'

// Publication search over OpenAlex, run from the browser. All state lives in
// the URL so every result page is shareable and bookmarkable.

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CaretLeft, CaretRight, DownloadSimple, MagnifyingGlass, Funnel, X } from '@phosphor-icons/react/dist/ssr'
import { openalexTotals } from '@/lib/openalex-totals'
import { searchWorks, typeFacets, openalexBlockedUntil, toBibtex, toRis, toCsvRows, download, TYPE_LABEL, type Work, type WorkQuery, type Fallback, type SortKey, type Facet, RegistryError } from '@/lib/openalex'
import type { ProviderErrorKind } from '@/lib/scholarly-api/errors'
import { Note } from './db'
import { usePosiIssnMap, matchIssn } from '@/lib/use-posi-issn'
import { WorkItem } from './WorkItem'
import type { Locale } from '@/i18n/config'
import { useLocale } from '@/i18n/LocaleProvider'
import { localizedHref } from '@/i18n/alternates'
import { fill } from '@/i18n/format'
import { PUBLICATION_TYPE_ZH } from '@/i18n/publication-types'

const en = {
  presets: { '7d': 'Last 7 days', '30d': 'Last 30 days', '1y': 'Last 12 months', '5y': 'Last 5 years' } as Record<string, string>,
  down: {
    budget: 'OpenAlex\'s free daily limit for your network is used up until {until}',
    rateLimited: 'OpenAlex is busy right now', timeout: 'OpenAlex did not answer in time',
    unreachable: 'OpenAlex could not be reached from your browser', other: 'OpenAlex is temporarily unavailable',
  },
  dateLocale: 'en-GB',
  filters: 'Filters', clearAll: 'Clear all', published: 'Published', anyTime: 'Any time', fromYear: 'From year', toYear: 'To year', apply: 'Apply',
  access: 'Access', oaOnly: 'Open access only', type: 'Publication type',
  issnLimit: 'Limited to source ISSN ', issnEnd: '.', remove: 'Remove',
  source: 'Publication metadata: OpenAlex (CC0), with Crossref, DataCite and Zenodo as fallbacks.',
  label: 'Search publications', placeholder: 'Title, abstract, author, keyword or DOI', submit: 'Search', results: 'Results',
  filtersCount: ' ({n})', failed: 'Search failed', searching: 'Searching…', publications: ' publications',
  abstracts: 'Show abstracts', sort: 'Sort', sorts: { relevance: 'Most relevant', newest: 'Newest first', cited: 'Most cited' },
  export: 'Export', thisPage: '{format} (this page)',
  unavailable: 'Search is temporarily unavailable',
  errRate: 'The request limit for your connection has been reached on every registry. Wait a few minutes before searching again.',
  errTimeout: 'The registries did not answer in time. Check your connection and try again.',
  errUnreachable: 'The registries could not be reached directly from your browser. A network filter, VPN or extension may be blocking them.',
  errOther: 'None of OpenAlex, Crossref, DataCite or Zenodo answered ({message}). This usually clears within a minute.',
  again: 'Search again',
  via: 'Results from {source} ({why}). Some abstracts, open access details and type filters may be missing.',
  totalsAsOf: ' Totals are OpenAlex’s, as of {date}.',
  retry: 'Retry with OpenAlex',
  freshOne: 'The newest article comes from Crossref; OpenAlex has not indexed it yet.',
  freshMany: 'The {n} newest articles come from Crossref; OpenAlex has not indexed them yet.',
  none: 'No publications match', noneHint: 'Try fewer words, or clear a filter.',
  pagination: 'Pagination', previous: 'Previous', next: 'Next', page: 'page {page} of {pages}',
  types: null as Record<string, string> | null,
}
const WORDS: Record<Locale, typeof en> = {
  en,
  'zh-Hans': {
    presets: { '7d': '最近 7 天', '30d': '最近 30 天', '1y': '最近 12 个月', '5y': '最近 5 年' },
    down: {
      budget: '您所在网络的 OpenAlex 每日免费额度已用完，将于 {until} 恢复',
      rateLimited: 'OpenAlex 当前繁忙', timeout: 'OpenAlex 未能及时响应',
      unreachable: '您的浏览器无法连接 OpenAlex', other: 'OpenAlex 暂时不可用',
    },
    dateLocale: 'zh-Hans-CN',
    filters: '筛选', clearAll: '全部清除', published: '出版时间', anyTime: '不限', fromYear: '起始年份', toYear: '截止年份', apply: '应用',
    access: '获取方式', oaOnly: '仅限开放获取', type: '文献类型',
    issnLimit: '仅限来源 ISSN ', issnEnd: '。', remove: '移除',
    source: '文献元数据：OpenAlex（CC0），Crossref、DataCite 与 Zenodo 作为备用来源。',
    label: '检索文献', placeholder: '题名、摘要、作者、关键词或 DOI', submit: '检索', results: '检索结果',
    filtersCount: '（{n}）', failed: '检索失败', searching: '正在检索…', publications: ' 篇文献',
    abstracts: '显示摘要', sort: '排序', sorts: { relevance: '相关度优先', newest: '最新优先', cited: '被引最多' },
    export: '导出', thisPage: '{format}（本页）',
    unavailable: '检索暂时不可用',
    errRate: '您的网络连接在所有注册机构均已达到请求上限，请等待几分钟后再检索。',
    errTimeout: '注册机构未能及时响应，请检查网络连接后重试。',
    errUnreachable: '您的浏览器无法直接连接注册机构，可能被网络过滤、VPN 或浏览器扩展拦截。',
    errOther: 'OpenAlex、Crossref、DataCite 与 Zenodo 均未响应（{message}）。通常一分钟内即可恢复。',
    again: '重新检索',
    via: '检索结果来自 {source}（{why}）。部分摘要、开放获取信息与类型筛选可能缺失。',
    totalsAsOf: '总数为 OpenAlex 截至 {date} 的数据。',
    retry: '改用 OpenAlex 重试',
    freshOne: '最新的 1 篇论文来自 Crossref，OpenAlex 尚未收录。',
    freshMany: '最新的 {n} 篇论文来自 Crossref，OpenAlex 尚未收录。',
    none: '没有匹配的文献', noneHint: '请减少检索词，或清除某项筛选条件。',
    pagination: '分页', previous: '上一页', next: '下一页', page: '第 {page} 页，共 {pages} 页',
    types: PUBLICATION_TYPE_ZH,
  },
}

const PER_PAGE = 20
const MAX_PAGE = 500 // OpenAlex basic paging stops at 10,000 results

function isoDaysAgo(days: number) {
  const d = new Date(Date.now() - days * 86400000)
  return d.toISOString().slice(0, 10)
}

const PRESETS = [
  { key: '7d', from: () => isoDaysAgo(7) },
  { key: '30d', from: () => isoDaysAgo(30) },
  { key: '1y', from: () => isoDaysAgo(365) },
  { key: '5y', from: () => `${new Date().getFullYear() - 5}-01-01` },
]

// Why the results below did not come from OpenAlex, in a few words. A spent daily budget says when it resets. The
// keyless budget belongs to the visitor's IP address (shared on a VPN or campus network), not to this browser.
function openalexDown(t: typeof en, why?: ProviderErrorKind): string {
  const until = openalexBlockedUntil()
  if (until) return fill(t.down.budget, { until: new Date(until).toLocaleString(t.dateLocale, { dateStyle: 'medium', timeStyle: 'short' }) })
  if (why === 'rate-limited') return t.down.rateLimited
  if (why === 'timeout') return t.down.timeout
  if (why === 'unreachable') return t.down.unreachable
  return t.down.other
}

type Status = { kind: 'idle' } | { kind: 'loading' } | { kind: 'error'; message: string; why?: ProviderErrorKind } | { kind: 'ok'; count: number; results: Work[]; via?: Fallback; viaWhy?: ProviderErrorKind; fresh?: number }

export function PublicationSearch() {
  const router = useRouter()
  const sp = useSearchParams()
  const locale = useLocale()
  const t = WORDS[locale]

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
  // OpenAlex cannot answer and nothing narrows the query: keep OpenAlex's own total and type counts (a weekly snapshot)
  // rather than showing Crossref's.
  const totals = openalexTotals()
  const unnarrowed = !q && !preset && !fromYear && !toYear && !types.length && !oa && !issn
  const snapshot = status.kind === 'ok' && status.via && unnarrowed && totals ? totals : null
  const facets = snapshot ? snapshot.types : fac?.key === queryKey ? fac.facets : null

  useEffect(() => {
    const ctrl = new AbortController()
    searchWorks(query, ctrl.signal)
      .then(r => {
        setRes({ key: queryKey, status: { kind: 'ok', ...r } })
        // The type counts come from OpenAlex too: when it just failed, asking again only spends its request budget.
        if (r.via) { setFac({ key: queryKey, facets: [] }); return }
        typeFacets(query, ctrl.signal).then(f => setFac({ key: queryKey, facets: f })).catch(e => { if (e.name !== 'AbortError') setFac({ key: queryKey, facets: [] }) })
      })
      .catch(e => { if (e.name !== 'AbortError') setRes({ key: queryKey, status: { kind: 'error', message: String(e.message || e), why: e instanceof RegistryError ? e.kind : undefined } }) })
    return () => ctrl.abort()
  }, [query, queryKey, attempt])

  function update(patch: Record<string, string | null>, resetPage = true) {
    const n = new URLSearchParams(sp.toString())
    for (const [k, v] of Object.entries(patch)) { if (v === null || v === '') n.delete(k); else n.set(k, v) }
    if (resetPage) n.delete('page')
    router.push(localizedHref(locale, `/publications/?${n}`), { scroll: resetPage ? false : true })
  }

  function submit(e: FormEvent) { e.preventDefault(); update({ q: draft.trim() }) }

  function toggleType(t: string) {
    const next = types.includes(t) ? types.filter(x => x !== t) : [...types, t]
    update({ type: next.join(',') })
  }

  const activeFilters = (preset ? 1 : 0) + (fromYear || toYear ? 1 : 0) + types.length + (oa ? 1 : 0) + (issn ? 1 : 0)
  const results = status.kind === 'ok' ? status.results : []
  const count = snapshot ? snapshot.works : status.kind === 'ok' ? status.count : null
  const lastPage = count !== null ? Math.min(MAX_PAGE, Math.max(1, Math.ceil(count / PER_PAGE))) : page

  const filterPanel = (
    <div className="space-y-6 text-[13.5px]">
      <div className="flex items-center justify-between">
        <p className="font-medium">{t.filters}</p>
        {activeFilters > 0 && (
          <button type="button" className="link text-[12.5px]" onClick={() => update({ range: null, from: null, to: null, type: null, oa: null, issn: null })}>
            {t.clearAll}
          </button>
        )}
      </div>

      <fieldset>
        <legend className="font-medium mb-2" style={{ color: 'var(--ink-2)' }}>{t.published}</legend>
        <div className="space-y-1.5">
          {PRESETS.map(p => (
            <label key={p.key} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="range" checked={preset === p.key} onChange={() => update({ range: p.key, from: null, to: null })} style={{ accentColor: 'var(--teal)' }} />
              {t.presets[p.key]}
            </label>
          ))}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="range" checked={!preset} onChange={() => update({ range: null })} style={{ accentColor: 'var(--teal)' }} />
            {t.anyTime}
          </label>
        </div>
        <form
          className="mt-3 grid grid-cols-[1fr_1fr_auto] gap-2 items-end"
          onSubmit={e => { e.preventDefault(); update({ range: null, from: yearDraft.from, to: yearDraft.to }) }}
        >
          <div className="flex flex-col gap-1">
            <label htmlFor="yf" className="text-[12px]" style={{ color: 'var(--muted)' }}>{t.fromYear}</label>
            <input id="yf" inputMode="numeric" pattern="[0-9]{4}" className="input h-8 text-[13px] px-2" value={yearDraft.from} onChange={e => setYearDraft(d => ({ ...d, from: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="yt" className="text-[12px]" style={{ color: 'var(--muted)' }}>{t.toYear}</label>
            <input id="yt" inputMode="numeric" pattern="[0-9]{4}" className="input h-8 text-[13px] px-2" value={yearDraft.to} onChange={e => setYearDraft(d => ({ ...d, to: e.target.value }))} />
          </div>
          <button type="submit" className="btn btn-sm h-8">{t.apply}</button>
        </form>
      </fieldset>

      <fieldset>
        <legend className="font-medium mb-2" style={{ color: 'var(--ink-2)' }}>{t.access}</legend>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={oa} onChange={() => update({ oa: oa ? null : '1' })} style={{ accentColor: 'var(--teal)' }} />
          {t.oaOnly}
        </label>
      </fieldset>

      <fieldset>
        <legend className="font-medium mb-2" style={{ color: 'var(--ink-2)' }}>{t.type}</legend>
        {facets === null ? (
          <div className="space-y-2" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-3.5 rounded-[var(--radius)] animate-pulse" style={{ background: 'var(--surface-3)', width: `${80 - i * 10}%` }} />)}
          </div>
        ) : (
          <ul className="space-y-1.5">
            {facets.slice(0, 10).map(f => (
              <li key={f.key}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={types.includes(f.key)} onChange={() => toggleType(f.key)} style={{ accentColor: 'var(--teal)' }} />
                  <span className="flex-1">{t.types?.[f.key] ?? TYPE_LABEL[f.key] ?? f.label}</span>
                  <span className="font-mono text-[11.5px] tnum" style={{ color: 'var(--soft)' }}>{f.count.toLocaleString('en-US')}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </fieldset>

      {issn && (
        <div className="rounded-[var(--radius)] p-3 text-[12.5px]" style={{ background: 'var(--teal-soft)' }}>
          {t.issnLimit}<span className="font-mono">{issn}</span>{t.issnEnd}{' '}
          <button type="button" className="link" onClick={() => update({ issn: null })}>{t.remove}</button>
        </div>
      )}

      <p className="text-[12px] leading-relaxed" style={{ color: 'var(--soft)' }}>
        {t.source}
      </p>
    </div>
  )

  return (
    <div>
      <form onSubmit={submit} role="search" className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <label htmlFor="pub-q" className="sr-only">{t.label}</label>
          <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 pointer-events-none" style={{ color: 'var(--soft)' }} />
          <input id="pub-q" type="search" value={draft} onChange={e => setDraft(e.target.value)} placeholder={t.placeholder} className="input h-12 pl-11 text-[16px] rounded-[var(--radius-lg)]" style={{ boxShadow: 'var(--posi-shadow-card)' }} />
        </div>
        <button type="submit" className="btn btn-primary h-12 px-6 text-[15px] rounded-[var(--radius-lg)]">{t.submit}</button>
      </form>

      <div className="mt-6 grid gap-8 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start panel p-5">{filterPanel}</aside>

        <section aria-label={t.results} className="min-w-0">
          <div className="flex flex-wrap items-center gap-3 pb-3">
            <button type="button" className="btn btn-sm lg:hidden" onClick={() => setFiltersOpen(o => !o)} aria-expanded={filtersOpen}>
              {filtersOpen ? <X className="h-4 w-4" /> : <Funnel className="h-4 w-4" />} {t.filters}{activeFilters ? fill(t.filtersCount, { n: activeFilters }) : ''}
            </button>
            <p className="text-[14px]" aria-live="polite" style={{ color: 'var(--muted)' }}>
              {count === null
                ? status.kind === 'error' ? t.failed : t.searching
                : <><span className="font-semibold tnum" style={{ color: 'var(--ink)' }}>{count.toLocaleString('en-US')}</span>{t.publications}</>}
            </p>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-[13px] cursor-pointer" style={{ color: 'var(--ink-2)' }}>
                <input type="checkbox" checked={expand} onChange={() => update({ expand: expand ? null : '1' }, false)} style={{ accentColor: 'var(--teal)' }} />
                {t.abstracts}
              </label>
              <label htmlFor="sort" className="sr-only">{t.sort}</label>
              <select id="sort" value={sort} onChange={e => update({ sort: e.target.value === 'relevance' ? null : e.target.value })} className="input h-8 w-auto text-[13px] pr-8">
                <option value="relevance">{t.sorts.relevance}</option>
                <option value="newest">{t.sorts.newest}</option>
                <option value="cited">{t.sorts.cited}</option>
              </select>
              <details className="relative">
                <summary className="btn btn-sm list-none cursor-pointer"><DownloadSimple className="h-4 w-4" /> {t.export}</summary>
                <div className="absolute right-0 mt-1 z-20 panel p-1 w-44 text-[13px]">
                  {[
                    ['CSV', () => download('posi-publications.csv', toCsvRows(results), 'text/csv')],
                    ['BibTeX', () => download('posi-publications.bib', results.map(toBibtex).join('\n\n'), 'application/x-bibtex')],
                    ['RIS', () => download('posi-publications.ris', results.map(toRis).join('\n'), 'application/x-research-info-systems')],
                  ].map(([label, fn]) => (
                    <button key={label as string} type="button" disabled={!results.length} onClick={fn as () => void} className="block w-full text-left px-3 py-1.5 rounded-[var(--radius)] hover:bg-[var(--hover)]">
                      {fill(t.thisPage, { format: label as string })}
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
                <div key={i} className="panel p-5 mt-3 space-y-2">
                  <div className="h-3 w-40 rounded-[var(--radius)] animate-pulse" style={{ background: 'var(--surface-3)' }} />
                  <div className="h-4 w-4/5 rounded-[var(--radius)] animate-pulse" style={{ background: 'var(--surface-3)' }} />
                  <div className="h-3 w-3/5 rounded-[var(--radius)] animate-pulse" style={{ background: 'var(--surface-2)' }} />
                  <div className="h-3 w-2/5 rounded-[var(--radius)] animate-pulse" style={{ background: 'var(--surface-2)' }} />
                </div>
              ))}
            </div>
          )}

          {status.kind === 'error' && (
            <div className="panel p-6 mt-2">
              <p className="font-medium">{t.unavailable}</p>
              <p className="mt-1 text-[14px]" style={{ color: 'var(--muted)' }}>
                {status.why === 'rate-limited'
                  ? t.errRate
                  : status.why === 'timeout'
                    ? t.errTimeout
                    : status.why === 'unreachable'
                      ? t.errUnreachable
                      : fill(t.errOther, { message: status.message })}
              </p>
              <button type="button" className="btn btn-sm mt-4" onClick={() => { setRes(null); setAttempt(a => a + 1) }}>{t.again}</button>
            </div>
          )}

          {status.kind === 'ok' && status.via && (
            <div className="mt-2 mb-3">
              <Note>
                {fill(t.via, { source: { crossref: 'Crossref', datacite: 'DataCite', zenodo: 'Zenodo' }[status.via], why: openalexDown(t, status.viaWhy) })}
                {snapshot?.fetched_at && fill(t.totalsAsOf, { date: snapshot.fetched_at })}{' '}
                {/* While the free daily budget is spent the page sends no OpenAlex request, so a retry would change nothing. */}
                {!openalexBlockedUntil() && <button type="button" className="link" onClick={() => { setRes(null); setAttempt(a => a + 1) }}>{t.retry}</button>}
              </Note>
            </div>
          )}

          {status.kind === 'ok' && !status.via && !!status.fresh && (
            <p className="mt-2 mb-3 text-[12.5px]" style={{ color: 'var(--muted)' }}>
              {status.fresh === 1 ? t.freshOne : fill(t.freshMany, { n: status.fresh })}
            </p>
          )}

          {status.kind === 'ok' && !results.length && (
            <div className="panel py-16 mt-3 text-center">
              <p className="font-medium">{t.none}</p>
              <p className="mt-1 text-[14px]" style={{ color: 'var(--muted)' }}>{t.noneHint}</p>
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
            <nav aria-label={t.pagination} className="flex items-center justify-between pt-5">
              <button type="button" className="btn btn-sm" disabled={page <= 1} onClick={() => update({ page: String(page - 1) }, false)}>
                <CaretLeft className="h-4 w-4" /> {t.previous}
              </button>
              <span className="font-mono text-[13px]" style={{ color: 'var(--muted)' }}>
                {fill(t.page, { page, pages: lastPage.toLocaleString('en-US') })}
              </span>
              <button type="button" className="btn btn-sm" disabled={page >= lastPage} onClick={() => update({ page: String(page + 1) }, false)}>
                {t.next} <CaretRight className="h-4 w-4" />
              </button>
            </nav>
          )}
        </section>
      </div>
    </div>
  )
}
