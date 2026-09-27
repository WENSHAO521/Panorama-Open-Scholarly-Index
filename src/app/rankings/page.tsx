import Link from 'next/link'
import { getCategories, getRankings, MIN_ITEMS, RANKING_VERSION } from '@/lib/rankings'
import { PageHeader, SectionTitle, fmt } from '@/components/db'
import { RankingTable } from '@/components/RankingTable'

export const metadata = {
  title: 'Journal Rankings',
  description: 'Journal rankings by subject category: POSI Citation Score, category rank, percentile and PCS quartile for every ranked journal.',
}

export default function RankingsPage() {
  const { ranked, notRanked, year } = getRankings()
  const cats = getCategories().filter(c => c.ranked > 0)
  const domains = [...new Map(cats.map(c => [c.domain, c.domainName])).entries()]
  const top = ranked.slice(0, 300)

  return (
    <div className="wrap pb-10">
      <PageHeader
        title="Journal Rankings"
        crumbs={[{ label: 'POSI', href: '/' }, { label: 'Rankings' }]}
        actions={<>
          <a href={`/data/rankings/pcs-${year}.csv`} className="btn btn-primary">Download {year}</a>
        </>}
      >
        <p className="max-w-[68ch]">
          {fmt(ranked.length)} journals ranked within {cats.length} subject categories by POSI Citation Score, {year} edition.
          Core and indexed journals are ranked together; the Core filter shows certified journals within the same ranking.
        </p>
      </PageHeader>

      <dl className="grid grid-cols-2 lg:grid-cols-4 gap-px rounded-[2px] overflow-hidden mb-12" style={{ background: 'var(--line)', border: '1px solid var(--line)' }}>
        {[
          ['Metric', 'PCS', 'Citations in the year to items from the previous 4 years, per item. Source: Crossref.'],
          ['Quartile', 'PCS-Q1 to Q4', 'From the percentile: Q1 at 75 and above. Categories under 20 journals get none.'],
          ['Percentile', '100(N - mid + 0.5)/N', 'Tied journals share the mid-rank of their positions (RANK-1.0).'],
          ['Eligibility', `${MIN_ITEMS}+ items`, `Journals with fewer eligible items are listed but not ranked (${fmt(notRanked.length)} this edition).`],
        ].map(([k, v, note]) => (
          <div key={k} className="p-4" style={{ background: 'var(--surface)' }}>
            <dt className="text-[12.5px]" style={{ color: 'var(--muted)' }}>{k}</dt>
            <dd className="mt-1 font-mono text-[17px]" style={{ color: 'var(--ink)' }}>{v}</dd>
            <dd className="mt-1 text-[12.5px] leading-snug" style={{ color: 'var(--muted)' }}>{note}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="cats" className="mb-14">
        <SectionTitle id="cats" aside={`${RANKING_VERSION}, PSC v1.0`}>Subject categories</SectionTitle>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {domains.map(([d, name]) => (
            <div key={d}>
              <h3 className="text-[13px] font-medium mb-2" style={{ color: 'var(--muted)' }}>{name}</h3>
              <ul className="panel overflow-hidden">
                {cats.filter(c => c.domain === d).map((c, i) => (
                  <li key={c.code} style={i ? { borderTop: '1px solid var(--line-soft)' } : undefined}>
                    <Link href={`/rankings/${c.code}/`} className="grid grid-cols-[52px_minmax(0,1fr)_auto] gap-2 items-baseline px-3 py-2 transition-colors hover:bg-[var(--hover)]">
                      <span className="font-mono text-[12px]" style={{ color: 'var(--muted)' }}>{c.code}</span>
                      <span className="text-[14px] truncate" style={{ color: 'var(--ink)' }}>{c.name}</span>
                      <span className="font-mono text-[12px] tnum" style={{ color: 'var(--muted)' }}>
                        {fmt(c.ranked)}{c.core > 0 && <span style={{ color: 'var(--teal)' }}>, {c.core} Core</span>}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="overall">
        <SectionTitle id="overall" aside={<Link href="/rankings/all/" className="link">Full overall ranking</Link>}>Overall ranking, top {top.length}</SectionTitle>
        <RankingTable rows={top} overall fileName={`posi-ranking-overall-top${top.length}-${year}.csv`} />
      </section>
    </div>
  )
}
