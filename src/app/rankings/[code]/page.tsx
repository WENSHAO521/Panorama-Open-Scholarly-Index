import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCategories, getCategoryRanking, getRankings, RANKING_VERSION } from '@/lib/rankings'
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
  const rows = all ? ranked : getCategoryRanking(code)

  return (
    <div className="wrap pb-10">
      <PageHeader
        title={all ? 'Overall ranking' : c!.name}
        crumbs={[{ label: 'POSI', href: '/' }, { label: 'Rankings', href: '/rankings/' }, { label: all ? 'Overall' : c!.code }]}
        actions={<a href={`/data/rankings/pcs-${year}.csv`} className="btn">Full dataset CSV</a>}
      >
        <p className="max-w-[68ch]">
          {all
            ? <>All {fmt(rows.length)} ranked journals across every category, {year} edition.</>
            : <>{fmt(rows.length)} journals in <span className="font-mono">{c!.code}</span> {c!.name} ({c!.domainName}), ranked by POSI Citation Score, {year} edition. {c!.core > 0 ? `${c!.core} of them are Core Collection journals.` : 'No Core Collection journal is ranked in this category yet.'}</>}
          {' '}<Link href="/pcs/" className="link">How PCS is calculated</Link>.
        </p>
      </PageHeader>
      <RankingTable rows={rows} overall={all} fileName={`posi-ranking-${code}-${year}.csv`} />
      <p className="mt-6 text-[12.5px]" style={{ color: 'var(--muted)' }}>
        {RANKING_VERSION}. Item counts in amber are below 20 and should be read as a limited sample. Journals with a
        low-confidence subject assignment are ranked in their best-match category and marked.
      </p>
    </div>
  )
}
