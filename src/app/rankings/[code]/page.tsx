import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCategories, getCategoryRanking, getCategoryUnranked, getRankings, RANKING_VERSION } from '@/lib/rankings'
import { PageHeader, fmt } from '@/components/db'
import { RankingTable } from '@/components/RankingTable'

export const dynamicParams = false

export function generateStaticParams() {
  return [{ code: 'all' }, ...getCategories().filter(c => c.ranked > 0).map(c => ({ code: c.code }))]
}

export async function generateMetadata(props: { params: Promise<{ code: string }> }) {
  const { code } = await props.params
  if (code === 'all') return { title: 'Overall journal ranking' }
  const c = getCategories().find(x => x.code === code)
  return c ? { title: `${c.name} journal ranking`, description: `Journals in ${c.name} (${c.code}) ranked by POSI Citation Score, with category percentile and quartile.` } : {}
}

export default async function CategoryRankingPage(props: { params: Promise<{ code: string }> }) {
  const { code } = await props.params
  const { year, ranked } = getRankings()
  const all = code === 'all'
  const c = all ? null : getCategories().find(x => x.code === code)
  if (!all && !c) notFound()
  const allRows = all ? ranked : getCategoryRanking(code)
  // Very large lists render their top part; the full list is in the CSV.
  const CAP = 1000
  const rows = allRows.slice(0, CAP)

  return (
    <div className="wrap pb-10">
      <PageHeader
        title={all ? 'Overall ranking' : c!.name}
        crumbs={[{ label: 'POSI', href: '/' }, { label: 'Rankings', href: '/rankings/' }, { label: all ? 'Overall' : c!.code }]}
        actions={<a href={`/data/rankings/pcs-${year}.csv`} className="btn">Full dataset CSV</a>}
      >
        <p className="max-w-[68ch]">
          {all
            ? <>All {fmt(allRows.length)} ranked journals across every category, {year} edition.</>
              : <>{fmt(allRows.length)} journals in <span className="font-mono">{c!.code}</span> {c!.name} ({c!.domainName}), ranked by POSI Citation Score, {year} edition. {c!.core > 0 ? `${c!.core} of them are Core Collection journals.` : 'No Core Collection journal is ranked in this category yet.'}</>}
          {' '}<Link href="/methodology/#pcs" className="link">How PCS is calculated</Link>.
        </p>
      </PageHeader>
      {allRows.length > CAP && (
        <p className="mb-4 text-[13.5px]" style={{ color: 'var(--muted)' }}>
          Showing the top {fmt(CAP)} of {fmt(allRows.length)} journals. The{' '}
          <a href={`/data/rankings/pcs-${year}.csv`} className="link">full dataset</a> lists every ranked journal.
        </p>
      )}
      <RankingTable rows={rows} overall={all} fileName={`posi-ranking-${code}-${year}.csv`} />
      <p className="mt-6 text-[12.5px]" style={{ color: 'var(--muted)' }}>
        {RANKING_VERSION}. PCS determines the PCS-Q ranking only; it does not determine Citation Rank, Citation Percentile or Citation Quartile. Item counts in amber are below 20 and should be read as a limited sample.
        {!all && getCategoryUnranked(code).length > 0 && ` ${getCategoryUnranked(code).length} further journals are assigned to this category with low subject confidence and are not ranked in it.`}
      </p>
    </div>
  )
}
