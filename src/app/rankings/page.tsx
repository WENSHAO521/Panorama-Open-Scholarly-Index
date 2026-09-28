import Link from 'next/link'
import { getCategories, getRankings, RANKING_AVAILABLE, RANKING_SNAPSHOT, RANKING_VERSION, PNCI_VERSION, RANKING_THRESHOLDS } from '@/lib/rankings'
import { RANKING_BASIS } from '@/lib/evaluation/rules'
import { fmtSnapshot } from '@/lib/evaluation/display'
import { PageHeader, SectionTitle, fmt } from '@/components/db'
import { RankingsPending } from '@/components/Evaluation'
import { RankingTable } from '@/components/RankingTable'

export const metadata = {
  title: 'Journal Citation Rankings',
  description: 'POSI Citation Rankings: journals ranked by PNCI within their PSC subject category, with citation percentile, Citation Quartile (C-Q1 to C-Q4) and POSI Zone.',
  alternates: { canonical: '/rankings/' },
}

export default function RankingsPage() {
  const { ranked, year } = getRankings()
  const cats = getCategories()
  const rankedCats = cats.filter(c => c.ranked > 0)
  const domains = [...new Map(cats.map(c => [c.domain, c.domainName])).entries()]
  const top = ranked.slice(0, 300)
  const t = RANKING_THRESHOLDS

  return (
    <div className="wrap pb-10">
      <PageHeader
        title="Journal Citation Rankings"
        crumbs={[{ label: 'POSI', href: '/' }, { label: 'Rankings' }]}
        actions={RANKING_AVAILABLE ? <a href={`/data/rankings/citation-${year}.csv`} className="btn btn-primary">Download {year}</a> : undefined}
      >
        <p className="max-w-[70ch]">
          Journals are ranked by <strong>PNCI</strong>, the POSI Normalized Citation Indicator, within their PSC subject
          category. {RANKING_BASIS} Categories are never pooled.{' '}
          {RANKING_AVAILABLE
            ? <>{fmt(ranked.length)} journals ranked in {rankedCats.length} categories; snapshot {fmtSnapshot(RANKING_SNAPSHOT)}.</>
            : null}{' '}
          <Link href="/methodology/#ranking" className="link">Methodology</Link>.
        </p>
      </PageHeader>

      {!RANKING_AVAILABLE && <div className="mb-8"><RankingsPending /></div>}

      <dl className="stat-strip grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-12">
        {[
          ['Ranking metric', 'PNCI', `Citations per item relative to items of the same PSC field, publication year and document type (${PNCI_VERSION}). 1.00 is the field average.`],
          ['Citation Quartile', 'C-Q1 to C-Q4', 'From the mid-rank percentile: C-Q1 at 75 and above. Ties share rank and percentile.'],
          ['POSI Zone', 'Zone 1 to 4', 'Top 5%, top 5–20%, top 20–50%, lower 50%, from the same percentile. Official zones need 50+ journals in the category.'],
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
                        {c.ranked ? fmt(c.ranked) : 'Not yet ranked'}{c.core > 0 && <span style={{ color: 'var(--teal)' }}>, {c.core} Core</span>}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {RANKING_AVAILABLE && (
        <section aria-labelledby="highest">
          <SectionTitle id="highest" aside={<Link href="/rankings/all/" className="link">All categories</Link>}>Highest PNCI journals, top {top.length}</SectionTitle>
          <p className="mb-4 text-[13.5px] max-w-[70ch]" style={{ color: 'var(--muted)' }}>
            Listed by PNCI across categories for browsing. Every rank, percentile, quartile and zone shown is the
            journal&rsquo;s place within its own PSC category.
          </p>
          <RankingTable rows={top} categories={rankedCats.map(c => ({ code: c.code, name: c.name }))} fileName={`posi-citation-ranking-highest-pnci-top${top.length}-${year}.csv`} />
        </section>
      )}
    </div>
  )
}
