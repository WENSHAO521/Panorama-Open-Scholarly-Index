'use client'

// Journal profile: one page per indexed journal, read from the static profile
// shards (no live registry calls). ?issn=<any ISSN> or ?id=<OpenAlex source id>.

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Books, Certificate, SealCheck } from '@phosphor-icons/react/dist/ssr'
import { getJournalProfile, PSC_CONFIDENCE_TEXT, type JournalProfile } from '@/lib/journal-profile'
import { journalWorksTotal } from '@/lib/openalex'
import { recordHref } from '@/lib/records'
import { countryNameIn } from '@/i18n/places'
import { usePosiIssnMap, matchIssn } from '@/lib/use-posi-issn'
import { EvaluationPanel } from '@/components/Evaluation'
import { evaluationFromProfile } from '@/lib/evaluation/journal'
import { hasZone } from '@/lib/zone-certificate'
import psc from '@/lib/psc-v1.0.snapshot.json'
import { fmt } from '@/components/db'
import { YearTrend } from '@/components/YearTrend'
import { PosiGrades } from '@/components/PosiGrades'
import { IndexChecks } from '@/components/IndexChecks'
import { RankingHistory, type RankingHistoryRow } from '@/components/RankingHistory'
import type { Locale } from '@/i18n/config'
import { useLocale } from '@/i18n/LocaleProvider'
import { localizedHref } from '@/i18n/alternates'
import { fill, subjectName } from '@/i18n/format'

const PSC_NAME: Record<string, string> = Object.fromEntries(psc.categories.map(c => [c.code, c.name]))

type State = { key: string; profile: JournalProfile | null; error?: boolean }

// The page's words. Journal titles, publishers, topics (OpenAlex's English names) and identifiers are not translated.
const en = {
  noneTitle: 'No journal selected', noneBody: 'Open a journal from the directory or search by title or ISSN.',
  errorTitle: 'The journal could not be loaded', errorBody: 'Check your connection and reload the page.',
  missingTitle: 'Journal not found', missingBody: 'No indexed journal matches “{key}”. POSI indexes journals with an ISSN registered with Crossref or described by OpenAlex.',
  multidisciplinary: 'Multidisciplinary', since: 'Since {y}', breadcrumb: 'Breadcrumb', journals: 'Journals',
  openAccess: 'Open access', publisherMissing: 'Publisher not recorded', alsoKnown: 'Also known as ',
  browse: 'Browse publications', website: 'Journal website', record: 'POSI record', certificate: 'Indexing certificate',
  stats: { publications: 'Publications', citations: 'Citations', apc: 'APC', apcUsd: 'APC (USD)', none: 'None', years: 'Years active' },
  subject: 'Subject', notClassified: 'Not yet classified',
  confidence: PSC_CONFIDENCE_TEXT,
  classA: '. Classification follows the', psc: 'POSI Subject Classification', classB: 'from the journal’s OpenAlex topics.',
  topics: 'Top OpenAlex topics, by works',
  coverage: 'Coverage',
  coverageCore: 'In the POSI Core Collection: the journal applied for certification and passed PQF evaluation.',
  coverageIndexed: 'Indexed in POSI from its registry metadata. Journals can apply for Core Collection certification.',
  sources: 'Sources: ', apply: 'Apply for certification',
  identifiers: 'Identifiers', crossrefDois: 'Crossref DOIs', country: 'Country', society: 'Society',
  evaluation: 'Evaluation', history: 'Ranking history', zoneCertificate: 'Zone certificate', how: 'How journals are evaluated',
  loading: 'Loading journal', search: 'Search journals',
}
const WORDS: Record<Locale, typeof en> = {
  en,
  'zh-Hans': {
    noneTitle: '未选择期刊', noneBody: '请从期刊目录中打开一种期刊，或按刊名、ISSN 检索。',
    errorTitle: '无法加载该期刊', errorBody: '请检查网络连接后刷新页面。',
    missingTitle: '未找到该期刊', missingBody: '没有与“{key}”匹配的已收录期刊。POSI 收录 ISSN 已在 Crossref 注册或由 OpenAlex 描述的期刊。',
    multidisciplinary: '多学科', since: '{y} 年至今', breadcrumb: '面包屑导航', journals: '期刊',
    openAccess: '开放获取', publisherMissing: '未记录出版商', alsoKnown: '又名：',
    browse: '浏览文献', website: '期刊网站', record: 'POSI 记录', certificate: '收录证书',
    stats: { publications: '发文量', citations: '被引量', apc: 'APC', apcUsd: 'APC（美元）', none: '无', years: '出版年份' },
    subject: '学科', notClassified: '尚未分类',
    confidence: {
      high: '高置信度归类', verified: '经学科编辑核实', medium: '暂定：文献少于 50 篇', low: '暂定：无单一主导学科',
      multidisciplinary: '多学科期刊', unclassified: '尚未分类',
    },
    classA: '。分类依据期刊的 OpenAlex 主题，按照', psc: 'POSI 学科分类', classB: '确定。',
    topics: 'OpenAlex 主要主题（按文献数）',
    coverage: '收录情况',
    coverageCore: '已入选 POSI 核心合集：期刊已申请认证并通过 PQF 评审。',
    coverageIndexed: '依据注册机构元数据被 POSI 收录。期刊可申请核心合集认证。',
    sources: '数据来源：', apply: '申请认证',
    identifiers: '标识符', crossrefDois: 'Crossref DOI 数', country: '国家/地区', society: '学会',
    evaluation: '评价', history: '排名历史', zoneCertificate: 'POSI Zone 证书', how: '期刊评价方法',
    loading: '正在加载期刊', search: '检索期刊',
  },
}

export function JournalProfileView() {
  const locale = useLocale()
  const w = WORDS[locale]
  const href = (p: string) => localizedHref(locale, p)
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

  // Publications: OpenAlex, Crossref and DataCite (Zenodo included) merged, each record counted once, the total the
  // journal's listing shows. The directory's figure stands until it arrives, or if no registry answers.
  const [merged, setMerged] = useState<{ key: string; total: number } | null>(null)
  useEffect(() => {
    if (!key) return
    const ctrl = new AbortController()
    journalWorksTotal(key, ctrl.signal)
      .then(t => { if (t) setMerged({ key, total: t.total }) })
      .catch(() => {})
    return () => ctrl.abort()
  }, [key])

  if (!key) return <Empty title={w.noneTitle} body={w.noneBody} w={w} />
  const current = state?.key === key ? state : null
  if (!current) return <Skeleton label={w.loading} />
  if (current.error) return <Empty title={w.errorTitle} body={w.errorBody} w={w} />
  if (!current.profile) return <Empty title={w.missingTitle} body={fill(w.missingBody, { key })} w={w} />

  const j = current.profile
  const curated = matchIssn(issnMap, j.is)
  const core = curated?.k === 'core'
  const ev = evaluationFromProfile(j.ev, j.ev?.cat ? PSC_NAME[j.ev.cat] ?? null : null)
  const catName = j.sc === 'multidisciplinary' ? w.multidisciplinary : j.s ? (PSC_NAME[j.s] ? subjectName(locale, j.s, PSC_NAME[j.s]) : j.s) : null
  const catHref = j.sc === 'multidisciplinary' ? href('/journals/subject/multidisciplinary/') : j.s ? href(`/journals/subject/${j.s}/`) : null
  const country = countryNameIn(locale, j.cc)
  const years = j.y0 ? (j.y1 && j.y1 < new Date().getFullYear() - 1 ? `${j.y0}–${String(j.y1).slice(2)}` : fill(w.since, { y: j.y0 })) : null

  return (
    <article className="pb-12">
      <header className="pt-6 pb-6 md:pt-8">
        <nav aria-label={w.breadcrumb} className="mb-2.5 text-[12.5px]" style={{ color: 'var(--muted)' }}>
          <Link href={href('/')} className="hover:underline">POSI</Link>
          <span className="mx-1.5" style={{ color: 'var(--soft)' }}>&rsaquo;</span>
          <Link href={href('/journals/')} className="hover:underline">{w.journals}</Link>
          {catName && catHref && <>
            <span className="mx-1.5" style={{ color: 'var(--soft)' }}>&rsaquo;</span>
            <Link href={catHref} className="hover:underline">{catName}</Link>
          </>}
        </nav>
        <div className="panel p-5 md:p-7">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <PosiGrades size="md" showEmpty tier={core ? 'core' : 'indexed'} locale={locale}
            ajr={ev.ajr.rating} quartile={ev.ranking.quartile} quartileProvisional={ev.ranking.status === 'provisional'}
            zone={ev.ranking.zone} zoneStatus={ev.ranking.zoneStatus} />
          {j.oa && <span className="chip">{w.openAccess}</span>}
          {j.dj && <span className="chip">DOAJ</span>}
          {j.sc === 'multidisciplinary' && <span className="chip">{w.multidisciplinary}</span>}
        </div>
        <h1 className="text-[24px] md:text-[32px] font-semibold leading-tight tracking-tight max-w-4xl" style={{ color: 'var(--ink)' }}>{j.t}</h1>
        <p className="mt-2 text-[15.5px]" style={{ color: 'var(--ink-2)' }}>
          {[j.pub ?? curated?.p, country].filter(Boolean).join(' · ') || w.publisherMissing}
        </p>
        {(j.ab || j.alt?.length) && (
          <p className="mt-1 text-[13.5px]" style={{ color: 'var(--muted)' }}>
            {w.alsoKnown}{[j.ab, ...(j.alt ?? [])].filter((x, i, a) => x && a.indexOf(x) === i).join('; ')}
          </p>
        )}
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[12.5px]" style={{ color: 'var(--muted)' }}>
          {j.is.map(i => <span key={i}>ISSN {i}</span>)}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13.5px]">
          <Link href={href(`/publications/?issn=${encodeURIComponent(j.k)}&sort=newest`)} className="btn btn-primary" prefetch={false}>
            <Books className="h-4 w-4" /> {w.browse}
          </Link>
          {j.hp && (
            <a href={j.hp} className="link inline-flex items-center gap-1" target="_blank" rel="noopener noreferrer">
              {w.website}
            </a>
          )}
          {curated && <Link href={href(recordHref(curated))} className="link" prefetch={false}>{w.record}</Link>}
          <Link href={href('/certificate/')} className="link inline-flex items-center gap-1"><Certificate className="h-4 w-4" /> {w.certificate}</Link>
        </div>
        </div>
      </header>

      <dl className="stat-strip grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {([
          [w.stats.publications, fmt(merged?.key === key ? merged.total : j.w ?? j.cr)],
          [w.stats.citations, fmt(j.c)],
          ['h-index', fmt(j.h)],
          ['i10-index', fmt(j.i10)],
          [j.apcx ? w.stats.apc : w.stats.apcUsd, j.apcx ?? (j.apc != null ? (j.apc === 0 ? w.stats.none : fmt(j.apc)) : '-')],
          [w.stats.years, years ?? '-'],
        ] as const).map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd className="mt-1 figure text-[22px]">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-10">
          {!!j.cy?.length && <YearTrend rows={j.cy} />}

          <section aria-labelledby="subject">
            <h2 id="subject" className="text-[17px] font-semibold tracking-tight mb-3">{w.subject}</h2>
            <div className="panel p-4">
              <p className="text-[15px]">
                {catName && catHref
                  ? <Link href={catHref} className="font-medium hover:underline" style={{ color: 'var(--teal)' }}>{j.s && j.sc !== 'multidisciplinary' ? `${j.s} ` : ''}{catName}</Link>
                  : <span style={{ color: 'var(--muted)' }}>{w.notClassified}</span>}
              </p>
              <p className="mt-1 text-[13px]" style={{ color: 'var(--muted)' }}>
                {w.confidence[j.sc ?? 'unclassified'] ?? j.sc}{w.classA}{locale === 'en' ? ' ' : ''}<Link href={href('/subjects/')} className="link">{w.psc}</Link>{locale === 'en' ? ' ' : ''}{w.classB}
              </p>
              {!!j.tp?.length && (
                <p className="mt-4 text-[12.5px] font-medium" style={{ color: 'var(--muted)' }}>{w.topics}</p>
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

        <aside className="space-y-6 order-first lg:order-none">
          <EvaluationCard j={j} core={core} w={w} locale={locale} />

          <section aria-labelledby="coverage" className="panel p-4">
            <h2 id="coverage" className="text-[15px] font-semibold">{w.coverage}</h2>
            <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>
              {core
                ? w.coverageCore
                : w.coverageIndexed}
            </p>
            <p className="mt-2 text-[12.5px]" style={{ color: 'var(--muted)' }}>
              {w.sources}{(j.src ?? []).map(s => (s === 'openalex' ? 'OpenAlex' : s === 'crossref' ? 'Crossref' : s)).join(', ') || 'POSI'}
            </p>
            {!core && (
              <Link href={href('/certification/')} className="btn mt-3 w-full justify-center">
                <SealCheck className="h-4 w-4" /> {w.apply}
              </Link>
            )}
            <div className="mt-3"><IndexChecks issns={[j.k, ...j.is.filter(i => i !== j.k)]} /></div>
          </section>
          <section aria-labelledby="ids" className="panel">
            <h2 id="ids" className="px-4 pt-4 text-[15px] font-semibold">{w.identifiers}</h2>
            <dl className="px-4 pb-4 pt-2 text-[13.5px] divide-y divide-[var(--line-soft)]">
              <Row k="ISSN-L" v={j.k} mono />
              <Row k="ISSN" v={j.is.join(', ')} mono />
              <Row k="POSI ID" v={j.pid} mono />
              {j.oid && <Row k="OpenAlex" v={<a href={`https://openalex.org/${j.oid}`} className="link" target="_blank" rel="noopener noreferrer">{j.oid}</a>} mono />}
              {j.cr != null && <Row k={w.crossrefDois} v={fmt(j.cr)} mono />}
              {country && <Row k={w.country} v={country} />}
              {!!j.soc?.length && <Row k={w.society} v={j.soc.join('; ')} />}
            </dl>
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

function EvaluationCard({ j, core, w, locale }: { j: JournalProfile; core: boolean; w: typeof en; locale: Locale }) {
  const href = (p: string) => localizedHref(locale, p)
  const ev = evaluationFromProfile(j.ev, j.ev?.cat ? PSC_NAME[j.ev.cat] ?? null : null)
  const history = historyRows(j)
  return (
    <section aria-labelledby="evaluation" className="panel p-4">
      <h2 id="evaluation" className="text-[15px] font-semibold mb-3">{w.evaluation}</h2>
      <EvaluationPanel ev={ev} core={core ? 'core' : 'indexed'} idPrefix="pev" showPqf={core} locale={locale} />
      {history.length > 0 && (
        <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--line-soft)' }}>
          <h3 id="history" className="mb-2.5 text-[13px] font-semibold">{w.history}</h3>
          <RankingHistory rows={history} locale={locale} />
        </div>
      )}
      {hasZone(j) && (
        <Link href={href(`/certificate/zone/?issn=${encodeURIComponent(j.k)}`)} className="btn mt-4 w-full justify-center" prefetch={false}>
          <Certificate className="h-4 w-4" /> {w.zoneCertificate}
        </Link>
      )}
      <Link href={href('/methodology/')} className="link mt-3 inline-block text-[12.5px]">{w.how}</Link>
    </section>
  )
}

function historyRows(j: JournalProfile): RankingHistoryRow[] {
  const rows: RankingHistoryRow[] = []
  const ev = j.ev
  if (ev?.r != null && ev.y != null && ev.st) {
    rows.push({ year: ev.y, current: true, cat: ev.cat ?? null, catName: ev.cat ? PSC_NAME[ev.cat] ?? null : null, rank: ev.r, total: ev.rt ?? null, q: ev.q ?? null, zone: ev.z ?? null, zoneStatus: ev.zs ?? null, status: ev.st })
  }
  for (const [year, cat, rank, total, q, zone, zoneStatus, status] of j.hist ?? []) {
    if (year === ev?.y) continue
    rows.push({ year, current: false, cat, catName: cat ? PSC_NAME[cat] ?? null : null, rank, total, q, zone, zoneStatus, status })
  }
  return rows
}

function Skeleton({ label }: { label: string }) {
  return (
    <div className="pt-10 space-y-4" aria-busy="true" aria-label={label}>
      <div className="h-4 w-48 rounded-[var(--radius)] animate-pulse" style={{ background: 'var(--surface-2)' }} />
      <div className="h-9 w-2/3 rounded-[var(--radius)] animate-pulse" style={{ background: 'var(--surface-3)' }} />
      <div className="h-4 w-1/3 rounded-[var(--radius)] animate-pulse" style={{ background: 'var(--surface-2)' }} />
      <div className="h-20 rounded-[var(--radius)] animate-pulse mt-6" style={{ background: 'var(--surface-2)' }} />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="h-64 rounded-[var(--radius)] animate-pulse" style={{ background: 'var(--surface-2)' }} />
        <div className="h-64 rounded-[var(--radius)] animate-pulse" style={{ background: 'var(--surface-2)' }} />
      </div>
    </div>
  )
}

function Empty({ title, body, w }: { title: string; body: string; w: typeof en }) {
  const locale = useLocale()
  return (
    <div className="py-16 max-w-xl">
      <h1 className="text-[24px] font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-[15px]" style={{ color: 'var(--ink-2)' }}>{body}</p>
      <Link href={localizedHref(locale, '/journals/')} className="btn btn-primary mt-5">{w.search}</Link>
    </div>
  )
}
