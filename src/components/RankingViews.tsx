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

/** Where an edition's pages live: the current edition at /rankings/ (and at
 *  its year's permanent address when `byYear`), others by year. */
export const editionBase = (e: { year: number; current: boolean }, byYear = false) => (e.current && !byYear ? '/rankings' : `/rankings/edition/${e.year}`)

/** One link per edition, newest first; `code` keeps the reader on the same category. */
export function EditionNav({ year, code }: { year: number; code?: string }) {
  const list = getEditionList()
  return (
    <nav aria-label="Ranking editions" className="mb-6 flex flex-wrap items-center gap-2 text-[13px]">
      <span style={{ color: 'var(--muted)' }}>Edition</span>
      {list.map(e => {
        const active = e.year === year
        return (
          <Link key={e.year} href={`${editionBase(e)}/${code ? `${code}/` : ''}`} aria-current={active ? 'page' : undefined}
            className="rounded-[3px] px-2.5 py-1 font-mono tnum"
            style={active
              ? { background: 'var(--ink)', color: 'var(--paper)', border: '1px solid var(--ink)' }
              : { border: '1px solid var(--line)', color: 'var(--ink-2)' }}>
            {e.year}{e.current ? ' · current' : ''}
          </Link>
        )
      })}
    </nav>
  )
}

function EditionNote({ e }: { e: Edition }) {
  if (e.current) return null
  const archive = e.info.edition
  return (
    <p className="mb-6 text-[13.5px] max-w-[75ch] panel px-4 py-3" style={{ color: 'var(--ink-2)' }}>
      The {e.year} edition, as published{e.snapshot ? ` (snapshot ${fmtSnapshot(e.snapshot)})` : ''}{archive ? `, archive ${archive}` : ''}.
      Editions are frozen once published; each year is computed under the methodology version it names ({e.version}, {e.pnciVersion}),
      so ranks from different editions compare journals within that year only. Core Collection membership and AJR Ratings describe
      a journal&rsquo;s current state and are shown with the current edition only.
    </p>
  )
}

export function RankingsOverview({ e, byYear = false }: { e: Edition; byYear?: boolean }) {
  const base = editionBase(e, byYear)
  const cats = editionCategories(e)
  const rankedCats = cats.filter(c => c.ranked > 0)
  const domains = [...new Map(cats.map(c => [c.domain, c.domainName])).entries()]
  const top = e.ranked.slice(0, 300)
  const t = e.thresholds
  const available = e.current ? RANKING_AVAILABLE : e.ranked.length > 0
  const title = e.current && !byYear ? 'Journal Citation Rankings' : `Journal Citation Rankings ${e.year}`

  return (
    <div className="wrap pb-10">
      <PageHeader
        title={title}
        crumbs={e.current && !byYear ? [{ label: 'POSI', href: '/' }, { label: 'Rankings' }] : [{ label: 'POSI', href: '/' }, { label: 'Rankings', href: '/rankings/' }, { label: String(e.year) }]}
        actions={available ? <a href={`${RANKING_DOWNLOADS}/citation-${e.year}.csv`} className="btn btn-primary">Download {e.year}</a> : undefined}
      >
        <p className="max-w-[70ch]">
          Journals are ranked by <strong>PNCI</strong>, the POSI Normalized Citation Indicator, within their PSC subject
          category. {RANKING_BASIS} Categories are never pooled.{' '}
          {available
            ? <>{fmt(e.ranked.length)} journals ranked in {rankedCats.length} categories; snapshot {fmtSnapshot(e.snapshot)}.</>
            : null}{' '}
          <Link href="/methodology/#ranking" className="link">Methodology</Link>.
        </p>
      </PageHeader>

      <EditionNav year={e.year} />
      <EditionNote e={e} />
      {!available && <div className="mb-8"><RankingsPending /></div>}

      <dl className="stat-strip grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-12">
        {[
          ['Ranking metric', 'PNCI', `Citations per item relative to items of the same PSC field, publication year and document type (${e.pnciVersion}). 1.00 is the field average.`],
          ['Citation Quartile', 'C-Q1 to C-Q4', 'From the mid-rank percentile: C-Q1 at 75 and above. Ties share rank and percentile.'],
          ['POSI Zone', 'Zone 1 to 4', `Top 5%, top 5–20%, top 20–50%, lower 50%, from the same percentile. Official zones need ${t.categoryOfficialZone}+ journals in the category.`],
          ['Minimum data', `${t.officialItems}+ items`, `Official: ${t.officialItems}+ eligible items over ${t.officialPublicationYears}+ publication years and ${t.minCoverage * 100}% citation coverage; ${t.provisionalItems}–${t.officialItems - 1} items are provisional. Categories under ${t.categoryQuartile} journals are not ranked.`],
        ].map(([k, v, note]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd className="mt-1 figure text-[17px]">{v}</dd>
            <dd className="note">{note}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="cats" className="mb-14">
        <SectionTitle id="cats" aside={`${e.version}, PSC v1.0`}>Subject categories</SectionTitle>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {domains.map(([d, name]) => (
            <div key={d}>
              <h3 className="text-[13px] font-medium mb-2" style={{ color: 'var(--muted)' }}>{name}</h3>
              <ul className="panel overflow-hidden">
                {cats.filter(c => c.domain === d).map((c, i) => (
                  <li key={c.code} style={i ? { borderTop: '1px solid var(--line-soft)' } : undefined}>
                    <Link href={`${base}/${c.code}/`} className="grid grid-cols-[52px_minmax(0,1fr)_auto] gap-2 items-baseline px-3 py-2 transition-colors hover:bg-[var(--hover)]">
                      <span className="font-mono text-[12px]" style={{ color: 'var(--muted)' }}>{c.code}</span>
                      <span className="text-[14px] truncate" style={{ color: 'var(--ink)' }}>{c.name}</span>
                      <span className="font-mono text-[12px] tnum" style={{ color: 'var(--muted)' }}>
                        {c.ranked ? fmt(c.ranked) : 'Not ranked'}{c.core > 0 && <span style={{ color: 'var(--teal)' }}>, {c.core} Core</span>}
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
          <SectionTitle id="highest" aside={<Link href={`${base}/all/`} className="link">All categories</Link>}>Highest PNCI journals, top {top.length}</SectionTitle>
          <p className="mb-4 text-[13.5px] max-w-[70ch]" style={{ color: 'var(--muted)' }}>
            Listed by PNCI across categories for browsing. Every rank, percentile, quartile and zone shown is the
            journal&rsquo;s place within its own PSC category.
          </p>
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
