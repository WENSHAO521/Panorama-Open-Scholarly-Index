import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCategories, getCategoryRanking, getCategoryUnranked, getRankings, RANKING_AVAILABLE, RANKING_SNAPSHOT, RANKING_VERSION, RANKING_THRESHOLDS } from '@/lib/rankings'
import { fmtSnapshot } from '@/lib/evaluation/display'
import { PageHeader, fmt } from '@/components/db'
import { RankingTable } from '@/components/RankingTable'
import { RankingsPending } from '@/components/Evaluation'

export const dynamicParams = false

// Every PSC category and "all", ranked or not, so no category URL ever 404s.
export function generateStaticParams() {
  return [{ code: 'all' }, ...getCategories().map(c => ({ code: c.code }))]
}

export async function generateMetadata(props: { params: Promise<{ code: string }> }) {
  const { code } = await props.params
  if (code === 'all') return { title: 'Citation Rankings, all categories', description: 'Every journal ranked by PNCI within its PSC category, listed together; ranks are category ranks.', alternates: { canonical: '/rankings/all/' } }
  const c = getCategories().find(x => x.code === code)
  return c ? { title: `${c.name} journal citation ranking`, description: `Journals in ${c.name} (${c.code}) ranked by PNCI, with citation percentile, Citation Quartile (C-Q1 to C-Q4) and POSI Zone.`, alternates: { canonical: `/rankings/${c.code}/` } } : {}
}

export default async function CategoryRankingPage(props: { params: Promise<{ code: string }> }) {
  const { code } = await props.params
  const { year, ranked } = getRankings()
  const all = code === 'all'
  const cats = getCategories()
  const c = all ? null : cats.find(x => x.code === code)
  if (!all && !c) notFound()
  const allRows = all ? ranked : getCategoryRanking(code)
  const unranked = all ? [] : getCategoryUnranked(code)
  // Very large lists render their top part; the full list is in the CSV.
  const CAP = 1000
  const rows = allRows.slice(0, CAP)
  const n = allRows[0]?.n ?? 0

  return (
    <div className="wrap pb-10">
      <PageHeader
        title={all ? 'Citation Rankings, all categories' : c!.name}
        crumbs={[{ label: 'POSI', href: '/' }, { label: 'Rankings', href: '/rankings/' }, { label: all ? 'All categories' : c!.code }]}
        actions={RANKING_AVAILABLE ? <a href={`/data/rankings/citation-${year}.csv`} className="btn">Ranked journals CSV</a> : undefined}
      >
        <p className="max-w-[70ch]">
          {all
            ? <>All {fmt(allRows.length)} journals with a category rank, listed by PNCI. Ranks, percentiles, quartiles and zones are each journal&rsquo;s place within its own PSC category.</>
            : allRows.length
              ? <>{fmt(allRows.length)} journals in <span className="font-mono">{c!.code}</span> {c!.name} ({c!.domainName}), ranked by PNCI. {c!.core > 0 ? `${c!.core} of them are Core Collection journals.` : ''}</>
              : <><span className="font-mono">{c!.code}</span> {c!.name} ({c!.domainName}) has no Citation Ranking yet{RANKING_AVAILABLE ? `: fewer than ${RANKING_THRESHOLDS.categoryQuartile} journals meet the minimum data requirements` : ''}.</>}
          {RANKING_SNAPSHOT && <> Snapshot {fmtSnapshot(RANKING_SNAPSHOT)}.</>}{' '}
          <Link href="/methodology/#ranking" className="link">How the ranking works</Link>.
        </p>
      </PageHeader>
      {!RANKING_AVAILABLE && <div className="mb-6"><RankingsPending /></div>}
      {allRows.length > CAP && (
        <p className="mb-4 text-[13.5px]" style={{ color: 'var(--muted)' }}>
          Showing the top {fmt(CAP)} of {fmt(allRows.length)} journals. The{' '}
          <a href={`/data/rankings/citation-${year}.csv`} className="link">ranked journals CSV</a> lists every ranked journal;
          the <a href={`/data/rankings/citation-${year}.json`} className="link">edition index</a> links the complete files.
        </p>
      )}
      {!all && n > 0 && n < RANKING_THRESHOLDS.categoryOfficialZone && (
        <p className="mb-4 text-[13.5px]" style={{ color: 'var(--muted)' }}>
          {n >= RANKING_THRESHOLDS.categoryProvisionalZone
            ? `This category has ${n} ranked journals: POSI Zones are provisional below ${RANKING_THRESHOLDS.categoryOfficialZone}.`
            : `This category has ${n} ranked journals: no POSI Zones are assigned below ${RANKING_THRESHOLDS.categoryProvisionalZone}.`}
        </p>
      )}
      {allRows.length > 0 && (
        <RankingTable rows={rows} fileName={`posi-citation-ranking-${code}-${year}.csv`}
          categories={all ? cats.filter(x => x.ranked > 0).map(x => ({ code: x.code, name: x.name })) : undefined} />
      )}
      <p className="mt-6 text-[12.5px]" style={{ color: 'var(--muted)' }}>
        {RANKING_VERSION}. Provisional rankings (dashed) have {RANKING_THRESHOLDS.provisionalItems}–{RANKING_THRESHOLDS.officialItems - 1} eligible items or items from a single publication year, and carry no zone.
        {unranked.length > 0 && ` ${fmt(unranked.length)} further journals in this category have citation data but no rank (too few items, incomplete citation coverage, or category too small); their PNCI is shown on their journal pages.`}
      </p>
    </div>
  )
}
