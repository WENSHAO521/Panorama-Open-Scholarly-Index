// The Citation Ranking pages, for any edition: the current one at /rankings/
// and every year's at /rankings/edition/<year>/ (see src/lib/ranking-editions.ts).
// Server components.

import Link from 'next/link'
import { RANKING_AVAILABLE, RANKING_DOWNLOADS } from '@/lib/rankings'
import { editionCategories, editionCategoryRanking, editionCategoryUnranked, getEditionList, type Edition } from '@/lib/ranking-editions'
import { RANKING_BASIS } from '@/lib/evaluation/rules'
import { fmtSnapshot } from '@/lib/evaluation/display'
import { PageHeader, SectionTitle, fmt } from '@/components/db'
import { RankingsPending } from '@/components/Evaluation'
import { RankingTable } from '@/components/RankingTable'
import type { Locale } from '@/i18n/config'
import { localizedHref } from '@/i18n/alternates'
import { fill, formatMonth, subjectName } from '@/i18n/format'

// The overview's words. Category pages (CategoryRankingView) are English only so far.
const en = {
  editions: 'Ranking editions', edition: 'Edition', current: ' · current',
  title: 'Journal Citation Rankings', titleYear: 'Journal Citation Rankings {year}', rankings: 'Rankings', download: 'Download {year}',
  leadA: 'Journals are ranked by ',
  leadB: `, the POSI Normalized Citation Indicator, within their PSC subject category. ${RANKING_BASIS} Categories are never pooled. `,
  leadAvailable: '{n} journals ranked in {cats} categories; snapshot {date}. ',
  methodologyPre: '', methodology: 'Methodology', end: '.',
  stats: [
    ['Ranking metric', 'PNCI', 'Citations per item relative to items of the same PSC field, publication year and document type ({pnci}). 1.00 is the field average.'],
    ['Citation Quartile', 'C-Q1 to C-Q4', 'From the mid-rank percentile: C-Q1 at 75 and above. Ties share rank and percentile.'],
    ['POSI Zone', 'Zone 1 to 4', 'Top 5%, top 5–20%, top 20–50%, lower 50%, from the same percentile. Official zones need {zone}+ journals in the category.'],
    ['Minimum data', '{items}+ items', 'Official: {items}+ eligible items over {years}+ publication years and {coverage}% citation coverage; {prov}–{max} items are provisional. Categories under {catq} journals are not ranked.'],
  ] as [string, string, string][],
  cats: 'Subject categories', catsPending: 'Each category gets its own ranking once the first edition is published.',
  notRanked: 'Not ranked', core: '{n} Core', sep: ', ',
  all: 'All categories', highest: 'Highest PNCI journals, top {n}',
  highestNote: 'Listed by PNCI across categories for browsing. Every rank, percentile, quartile and zone shown is the journal’s place within its own PSC category.',
  archived: '', snapshot: '', archive: '',
}
const WORDS: Record<Locale, typeof en> = {
  en,
  'zh-Hans': {
    editions: '排名版本', edition: '版本', current: ' · 当前',
    title: '期刊引文排名', titleYear: '{year} 年期刊引文排名', rankings: '排名', download: '下载 {year} 年数据',
    leadA: '期刊按 ',
    leadB: '（POSI 标准化引文指标）在其 PSC 学科类别内排名。引文分区与 POSI Zone 依据合格 PSC 类别内由 PNCI 得出的百分位划定。不同类别从不合并排名。',
    leadAvailable: '共有 {n} 种期刊在 {cats} 个类别中获得排名；数据快照：{date}。',
    methodologyPre: '详见', methodology: '评价方法', end: '。',
    stats: [
      ['排名指标', 'PNCI', '每篇文献的被引次数相对于同一 PSC 领域、出版年和文献类型文献的比值（{pnci}）。1.00 即该领域平均水平。'],
      ['引文分区', 'C-Q1 至 C-Q4', '依据中位名次百分位划定：百分位 75 及以上为 C-Q1。并列者名次与百分位相同。'],
      ['POSI Zone', 'Zone 1 至 4', '依据同一百分位划分为前 5%、前 5%–20%、前 20%–50% 与后 50%。类别内须有 {zone} 种及以上期刊，方可划定正式 Zone。'],
      ['最低数据要求', '{items} 篇及以上', '正式排名：{items} 篇及以上合格文献，覆盖 {years} 个及以上出版年份，引文覆盖率达 {coverage}%；{prov}–{max} 篇为暂定排名。期刊少于 {catq} 种的类别不参与排名。'],
    ],
    cats: '学科类别', catsPending: '首个版本发布后，每个类别都将有各自的排名。',
    notRanked: '未排名', core: '{n} 种核心合集', sep: '，',
    all: '全部类别', highest: 'PNCI 最高的期刊（前 {n} 种）',
    highestNote: '为便于浏览，此处跨类别按 PNCI 列出。所示名次、百分位、分区和 Zone 均为期刊在其所属 PSC 类别内的位置。',
    archived: '{year} 年版本（已发布）{snapshot}{archive}。版本一经发布即冻结；每年的排名依其所注明的方法版本（{version}、{pnciVersion}）计算，因此不同版本的名次只能用于比较同一年度内的期刊。核心合集资格与 AJR 评级反映期刊的当前状态，仅随当前版本显示。',
    snapshot: '（数据快照：{date}）', archive: '，存档 {archive}',
  },
}
const ZH = WORDS['zh-Hans']

const snapshotOf = (locale: Locale, d: string | null | undefined) => (locale === 'zh-Hans' && d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? formatMonth(locale, d) : fmtSnapshot(d))

/** Where an edition's pages live: the current edition at /rankings/ (and at
 *  its year's permanent address when `byYear`), others by year. */
export const editionBase = (e: { year: number; current: boolean }, byYear = false) => (e.current && !byYear ? '/rankings' : `/rankings/edition/${e.year}`)

/** One link per edition, newest first; `code` keeps the reader on the same category. */
export function EditionNav({ year, code, locale = 'en' }: { year: number; code?: string; locale?: Locale }) {
  const list = getEditionList()
  const zh = locale === 'zh-Hans'
  return (
    <nav aria-label={zh ? ZH.editions : 'Ranking editions'} className="mb-6 flex flex-wrap items-center gap-2 text-[13px]">
      <span style={{ color: 'var(--muted)' }}>{zh ? ZH.edition : 'Edition'}</span>
      {list.map(e => {
        const active = e.year === year
        return (
          <Link key={e.year} href={localizedHref(locale, `${editionBase(e)}/${code ? `${code}/` : ''}`)} aria-current={active ? 'page' : undefined}
            className="rounded-full px-3 py-1 tnum transition-colors hover:border-[var(--posi-brand)]"
            style={active
              ? { background: 'var(--posi-brand)', color: 'var(--posi-on-brand)', border: '1px solid var(--posi-brand)' }
              : { border: '1px solid var(--line)', color: 'var(--ink-2)', background: 'var(--surface)' }}>
            {e.year}{e.current ? (zh ? ZH.current : ' · current') : ''}
          </Link>
        )
      })}
    </nav>
  )
}

function EditionNote({ e, locale = 'en' }: { e: Edition; locale?: Locale }) {
  if (e.current) return null
  const archive = e.info.edition
  if (locale === 'zh-Hans') return (
    <p className="mb-6 text-[13.5px] max-w-[75ch] panel px-4 py-3" style={{ color: 'var(--ink-2)' }}>
      {fill(ZH.archived, { year: e.year, snapshot: e.snapshot ? fill(ZH.snapshot, { date: snapshotOf(locale, e.snapshot) }) : '', archive: archive ? fill(ZH.archive, { archive }) : '', version: e.version, pnciVersion: e.pnciVersion })}
    </p>
  )
  return (
    <p className="mb-6 text-[13.5px] max-w-[75ch] panel px-4 py-3" style={{ color: 'var(--ink-2)' }}>
      The {e.year} edition, as published{e.snapshot ? ` (snapshot ${fmtSnapshot(e.snapshot)})` : ''}{archive ? `, archive ${archive}` : ''}.
      Editions are frozen once published; each year is computed under the methodology version it names ({e.version}, {e.pnciVersion}),
      so ranks from different editions compare journals within that year only. Core Collection membership and AJR Ratings describe
      a journal&rsquo;s current state and are shown with the current edition only.
    </p>
  )
}

export function RankingsOverview({ e, byYear = false, locale = 'en' }: { e: Edition; byYear?: boolean; locale?: Locale }) {
  const w = WORDS[locale]
  const href = (p: string) => localizedHref(locale, p)
  const base = editionBase(e, byYear)
  const cats = editionCategories(e).map(c => ({ ...c, name: subjectName(locale, c.code, c.name), domainName: subjectName(locale, c.domain, c.domainName) }))
  const rankedCats = cats.filter(c => c.ranked > 0)
  const domains = [...new Map(cats.map(c => [c.domain, c.domainName])).entries()]
  const top = e.ranked.slice(0, 300)
  const t = e.thresholds
  const available = e.current ? RANKING_AVAILABLE : e.ranked.length > 0
  const title = e.current && !byYear ? w.title : fill(w.titleYear, { year: e.year })
  const stats = w.stats.map(([k, v, note]) => [k, fill(v, { items: t.officialItems }), fill(note, {
    pnci: e.pnciVersion, zone: t.categoryOfficialZone, items: t.officialItems, years: t.officialPublicationYears,
    coverage: t.minCoverage * 100, prov: t.provisionalItems, max: t.officialItems - 1, catq: t.categoryQuartile,
  })])

  return (
    <div className="wrap pb-10">
      <PageHeader
        locale={locale}
        title={title}
        crumbs={e.current && !byYear ? [{ label: 'POSI', href: href('/') }, { label: w.rankings }] : [{ label: 'POSI', href: href('/') }, { label: w.rankings, href: href('/rankings/') }, { label: String(e.year) }]}
        actions={available ? <a href={`${RANKING_DOWNLOADS}/citation-${e.year}.csv`} className="btn btn-primary">{fill(w.download, { year: e.year })}</a> : undefined}
      >
        <p className="max-w-[70ch]">
          {w.leadA}<strong>PNCI</strong>{w.leadB}
          {available ? fill(w.leadAvailable, { n: fmt(e.ranked.length), cats: rankedCats.length, date: snapshotOf(locale, e.snapshot) }) : null}
          {w.methodologyPre}<Link href={href('/methodology/#ranking')} className="link">{w.methodology}</Link>{w.end}
        </p>
      </PageHeader>

      <EditionNav year={e.year} locale={locale} />
      <EditionNote e={e} locale={locale} />
      {!available && <div className="mb-8"><RankingsPending locale={locale} /></div>}

      <dl className="stat-strip grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-12">
        {stats.map(([k, v, note]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd className="mt-1 figure text-[17px]">{v}</dd>
            <dd className="note">{note}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="cats" className="mb-14">
        <SectionTitle id="cats" aside={`${e.version}, PSC v1.0`}>{w.cats}</SectionTitle>
        {!available && <p className="-mt-1 mb-4 text-[14px]" style={{ color: 'var(--muted)' }}>{w.catsPending}</p>}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 items-start">
          {domains.map(([d, name]) => (
            <div key={d} className="panel">
              <h3 className="px-4 py-3 text-[14px] font-semibold" style={{ color: 'var(--ink)', borderBottom: '1px solid var(--line)' }}>{name}</h3>
              <ul>
                {cats.filter(c => c.domain === d).map((c, i) => (
                  <li key={c.code} style={i ? { borderTop: '1px solid var(--line-soft)' } : undefined}>
                    <Link href={href(`${base}/${c.code}/`)} className="grid grid-cols-[52px_minmax(0,1fr)_auto] gap-2 items-baseline px-4 py-2.5 transition-colors hover:bg-[var(--hover)]">
                      <span className="font-mono text-[12px]" style={{ color: 'var(--muted)' }}>{c.code}</span>
                      <span className="text-[14px] truncate" style={{ color: 'var(--ink)' }}>{c.name}</span>
                      <span className="font-mono text-[12px] tnum" style={{ color: 'var(--muted)' }}>
                        {available && (c.ranked ? fmt(c.ranked) : w.notRanked)}{c.core > 0 && <span style={{ color: 'var(--teal)' }}>{available ? w.sep : ''}{fill(w.core, { n: c.core })}</span>}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {available && (
        <section aria-labelledby="highest">
          <SectionTitle id="highest" aside={<Link href={href(`${base}/all/`)} className="link">{w.all}</Link>}>{fill(w.highest, { n: top.length })}</SectionTitle>
          <p className="mb-4 text-[13.5px] max-w-[70ch]" style={{ color: 'var(--muted)' }}>{w.highestNote}</p>
          <RankingTable rows={top} categories={rankedCats.map(c => ({ code: c.code, name: c.name }))} fileName={`posi-citation-ranking-highest-pnci-top${top.length}-${e.year}.csv`} />
        </section>
      )}
    </div>
  )
}

export function CategoryRankingView({ e, code, byYear = false }: { e: Edition; code: string; byYear?: boolean }) {
  const base = editionBase(e, byYear)
  const all = code === 'all'
  const cats = editionCategories(e)
  const c = all ? null : cats.find(x => x.code === code)!
  const allRows = all ? e.ranked : editionCategoryRanking(e, code)
  const unranked = all ? [] : editionCategoryUnranked(e, code)
  const available = e.current ? RANKING_AVAILABLE : e.ranked.length > 0
  const t = e.thresholds
  // Very large lists render their top part; the full list is in the CSV.
  const CAP = 1000
  const rows = allRows.slice(0, CAP)
  const n = allRows[0]?.n ?? 0
  const yearLabel = e.current && !byYear ? '' : ` ${e.year}`

  return (
    <div className="wrap pb-10">
      <PageHeader
        title={(all ? 'Citation Rankings, all categories' : c!.name) + yearLabel}
        crumbs={[
          { label: 'POSI', href: '/' }, { label: 'Rankings', href: '/rankings/' },
          ...(e.current && !byYear ? [] : [{ label: String(e.year), href: `${base}/` }]),
          { label: all ? 'All categories' : c!.code },
        ]}
        actions={available ? <a href={`${RANKING_DOWNLOADS}/citation-${e.year}.csv`} className="btn">Ranked journals CSV</a> : undefined}
      >
        <p className="max-w-[70ch]">
          {all
            ? <>All {fmt(allRows.length)} journals with a category rank, listed by PNCI. Ranks, percentiles, quartiles and zones are each journal&rsquo;s place within its own PSC category.</>
            : allRows.length
              ? <>{fmt(allRows.length)} journals in <span className="font-mono">{c!.code}</span> {c!.name} ({c!.domainName}), ranked by PNCI. {c!.core > 0 ? `${c!.core} of them are Core Collection journals.` : ''}</>
              : <><span className="font-mono">{c!.code}</span> {c!.name} ({c!.domainName}) has no Citation Ranking{e.current ? ' yet' : ` in ${e.year}`}{available ? `: fewer than ${t.categoryQuartile} journals meet the minimum data requirements` : ''}.</>}
          {e.snapshot && <> Snapshot {fmtSnapshot(e.snapshot)}.</>}{' '}
          <Link href="/methodology/#ranking" className="link">How the ranking works</Link>.
        </p>
      </PageHeader>
      <EditionNav year={e.year} code={code} />
      <EditionNote e={e} />
      {!available && <div className="mb-6"><RankingsPending /></div>}
      {allRows.length > CAP && (
        <p className="mb-4 text-[13.5px]" style={{ color: 'var(--muted)' }}>
          Showing the top {fmt(CAP)} of {fmt(allRows.length)} journals. The{' '}
          <a href={`${RANKING_DOWNLOADS}/citation-${e.year}.csv`} className="link">ranked journals CSV</a> lists every ranked journal;
          the <a href={`${RANKING_DOWNLOADS}/citation-${e.year}-all.csv`} className="link">complete CSV</a> has every journal of the edition, and the <a href={`${RANKING_DOWNLOADS}/citation-${e.year}.json`} className="link">edition index</a> lists one file per category.
        </p>
      )}
      {!all && n > 0 && n < t.categoryOfficialZone && (
        <p className="mb-4 text-[13.5px]" style={{ color: 'var(--muted)' }}>
          {n >= t.categoryProvisionalZone
            ? `This category has ${n} ranked journals: POSI Zones are provisional below ${t.categoryOfficialZone}.`
            : `This category has ${n} ranked journals: no POSI Zones are assigned below ${t.categoryProvisionalZone}.`}
        </p>
      )}
      {allRows.length > 0 && (
        <RankingTable rows={rows} fileName={`posi-citation-ranking-${code}-${e.year}.csv`}
          categories={all ? cats.filter(x => x.ranked > 0).map(x => ({ code: x.code, name: x.name })) : undefined} />
      )}
      <p className="mt-6 text-[12.5px]" style={{ color: 'var(--muted)' }}>
        {e.version}. Provisional rankings (dashed) have {t.provisionalItems}–{t.officialItems - 1} eligible items or items from a single publication year, and carry no zone.
        {unranked.length > 0 && ` ${fmt(unranked.length)} further journals in this category have citation data but no rank (too few items, incomplete citation coverage, or category too small)${e.current ? '; their PNCI is shown on their journal pages' : ''}.`}
      </p>
    </div>
  )
}
