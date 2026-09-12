import Link from 'next/link'
import { Callout } from '@/components/Callout'
import { getCoreCollection } from '@/lib/data'
import { BENCHMARK_JOURNALS } from '@/lib/benchmark-journals'
import { isInEarlyStageWindow, isMatureStage } from '@/lib/early-stage'
import { getPscTaxonomy, PSC_PINNED_COMMIT } from '@/lib/site-metrics'

export const metadata = {
  title: 'PSC Subject Classification',
  description: 'The POSI Subject Classification (PSC) — a versioned, PR-reviewed taxonomy that every POSI subject ranking is computed within.',
}

interface PscCategory {
  code: string
  name: string
  level: 1 | 2 | 3
  parent: string | null
  aliases?: string[]
}

export default async function SubjectsPage() {
  const { taxonomy, usedFallback } = await getPscTaxonomy()
  const domains = taxonomy.categories.filter(c => c.level === 1)
  const byParent = new Map<string, PscCategory[]>()
  for (const c of taxonomy.categories) {
    if (c.level !== 2 || !c.parent) continue
    if (!byParent.has(c.parent)) byParent.set(c.parent, [])
    byParent.get(c.parent)!.push(c)
  }

  const allJournals = [...getCoreCollection(), ...BENCHMARK_JOURNALS]
  const countsByCategory = new Map<string, { total: number; earlyStage: number; mature: number }>()
  for (const j of allJournals) {
    if (!j.psc_category) continue
    const c = countsByCategory.get(j.psc_category) ?? { total: 0, earlyStage: 0, mature: 0 }
    c.total++
    if (isInEarlyStageWindow(j.early_stage_rating)) c.earlyStage++
    if (isMatureStage(j.early_stage_rating)) c.mature++
    countsByCategory.set(j.psc_category, c)
  }
  const classifiedCount = allJournals.filter(j => j.psc_category).length

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <nav className="text-xs flex items-center gap-1.5" style={{ color: 'var(--posi-muted)' }}>
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <span style={{ color: 'var(--posi-text)' }}>PSC Subject Classification</span>
      </nav>

      <div className="border-l-4 pl-5" style={{ borderColor: 'var(--posi-accent)' }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5" style={{ color: 'var(--posi-accent)', border: '1px solid var(--posi-accent)' }}>PSC {taxonomy.version}</span>
          <span className="text-[10px] font-mono uppercase tracking-[0.15em]" style={{ color: 'var(--posi-muted)' }}>
            {taxonomy.categories.length} categories
          </span>
        </div>
        <h1 className="text-2xl font-bold leading-tight" style={{ color: 'var(--posi-text)' }}>PSC Subject Classification</h1>
        <p className="text-sm leading-relaxed mt-2 max-w-2xl text-justify" style={{ color: 'var(--posi-muted)' }}>
          {taxonomy.basis}
        </p>
      </div>

      <Callout variant="info">
        {classifiedCount.toLocaleString()} of {allJournals.length.toLocaleString()} journals (Core Collection +
        Global Benchmark) have been classified against this taxonomy via OpenAlex topic data — see{' '}
        <a href="https://github.com/WENSHAO521/posi-data/blob/master/PSC-CROSSWALK.md" target="_blank" rel="noopener noreferrer" className="underline">PSC-CROSSWALK.md →</a>.
        PSC is not yet wired into ranking cohorts (E-Q/M-Q/Citation Q peer groups) — the counts below are
        classification coverage, not ranked cohorts. Taxonomy pinned to{' '}
        <a href={`https://github.com/WENSHAO521/posi-data/commit/${PSC_PINNED_COMMIT}`} target="_blank" rel="noopener noreferrer" className="underline font-mono">posi-data@{PSC_PINNED_COMMIT.slice(0, 7)}</a>{' '}
        — the same taxonomy on every rebuild, not whatever happens to be on <span className="font-mono">master</span> that day.
      </Callout>

      {usedFallback && (
        <Callout variant="warning">
          Live fetch from GitHub failed at build time — showing a vendored snapshot of the same pinned
          commit (<span className="font-mono">src/lib/psc-v1.0.snapshot.json</span>) instead. Content is
          identical; this notice just means the build fell back rather than failing outright.
        </Callout>
      )}

      <section className="space-y-3">
        {domains.map(domain => (
          <div key={domain.code} className="bg-white" style={{ border: '1px solid var(--posi-border)' }}>
            <div className="px-5 py-3 flex items-center gap-3" style={{ borderBottom: '1px solid var(--posi-border-light)', background: 'var(--posi-bg)' }}>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5" style={{ color: 'var(--posi-accent)', border: '1px solid var(--posi-accent)' }}>{domain.code}</span>
              <h2 className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--posi-text)' }}>{domain.name}</h2>
              <span className="ml-auto text-[10px] font-mono" style={{ color: 'var(--posi-muted)' }}>
                {(byParent.get(domain.code) ?? []).length} categories
              </span>
            </div>
            <div className="p-4 grid sm:grid-cols-2 md:grid-cols-3 gap-2">
              {(byParent.get(domain.code) ?? []).map(cat => {
                const counts = countsByCategory.get(cat.code)
                return (
                  <div key={cat.code} className="px-3 py-2 text-xs" style={{ background: 'var(--posi-bg)', border: '1px solid var(--posi-border-light)' }}>
                    <div>
                      <span className="font-mono text-[10px] mr-1.5" style={{ color: 'var(--posi-muted)' }}>{cat.code}</span>
                      <span style={{ color: 'var(--posi-text)' }}>{cat.name}</span>
                    </div>
                    {counts && counts.total > 0 && (
                      <p className="text-[9px] font-mono mt-1" style={{ color: 'var(--posi-muted)' }}>
                        {counts.total} journal{counts.total === 1 ? '' : 's'}
                        {(counts.earlyStage > 0 || counts.mature > 0) && (
                          <> · {counts.earlyStage} early-stage · {counts.mature} mature</>
                        )}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </section>

      <section className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
        <h2 className="text-xs font-bold uppercase tracking-[0.1em] mb-3" style={{ color: 'var(--posi-muted)' }}>PSC Governance</h2>
        <p className="text-[11px] leading-relaxed text-justify" style={{ color: 'var(--posi-muted)' }}>
          Changes to this taxonomy happen only via pull request against{' '}
          <a href="https://github.com/WENSHAO521/posi-data/tree/master/taxonomy/psc" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--posi-accent)' }}>posi-data</a>,
          reviewed against journal scope statements, article topic distribution, and citation network
          data. Level 3 subcategories are added incrementally as journal coverage in a level-2 category
          grows large enough to warrant splitting it — not designed upfront by guesswork.
        </p>
      </section>

      <div className="flex flex-wrap gap-5 text-xs">
        <Link href="/core-collection" style={{ color: 'var(--posi-accent)' }} className="hover:underline">POSI Core Collection →</Link>
        <Link href="/citation-reports" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Citation Reports →</Link>
        <Link href="/open-data" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Open Data →</Link>
      </div>
    </div>
  )
}
