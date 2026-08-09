import Link from 'next/link'
import { Info } from '@phosphor-icons/react/dist/ssr'
import { PSG_JOURNALS, INDEXED_JOURNALS, SHIHARR_JOURNALS, OTHER_INDEXED_JOURNALS } from '@/lib/data'

export const metadata = {
  title: 'POSI Automated Journal Ratings — Pilot 2026',
  description: 'Evidence-based, rules-driven, and reproducible journal evaluation for the POSI Core Collection. 100% automated — no manual score, percentile, or quartile adjustment.',
}

const ELIGIBILITY_LABEL: Record<string, string> = {
  rated: 'Evaluated',
  not_yet_rateable: 'Not Yet Rateable',
  unknown: 'Unknown',
  graduated: 'Graduated',
}

const ELIGIBILITY_COLOR: Record<string, string> = {
  rated: '#1F7A4D',
  not_yet_rateable: '#B45309',
  unknown: '#6B7280',
  graduated: '#1d4ed8',
}

export default function RatingsPage() {
  const coreCollection = [...PSG_JOURNALS, ...INDEXED_JOURNALS, ...SHIHARR_JOURNALS, ...OTHER_INDEXED_JOURNALS]
    .sort((a, b) => {
      const at = a.early_stage_rating?.total ?? -1
      const bt = b.early_stage_rating?.total ?? -1
      return bt - at
    })
  const evaluatedCount = coreCollection.filter(j => j.early_stage_rating?.eligibility === 'rated').length

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <nav className="text-xs flex items-center gap-1.5" style={{ color: 'var(--posi-muted)' }}>
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <span style={{ color: 'var(--posi-text)' }}>Automated Ratings</span>
      </nav>

      <div className="border-l-4 pl-5" style={{ borderColor: 'var(--posi-accent)' }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5" style={{ color: 'var(--posi-accent)', border: '1px solid var(--posi-accent)' }}>
            PILOT 2026
          </span>
          <span className="text-[10px] font-mono uppercase tracking-[0.15em]" style={{ color: 'var(--posi-muted)' }}>
            {coreCollection.length} journals · Core Collection
          </span>
        </div>
        <h1 className="text-2xl font-bold leading-tight" style={{ color: 'var(--posi-text)' }}>POSI Automated Journal Ratings</h1>
        <p className="text-sm leading-relaxed mt-2 max-w-2xl" style={{ color: 'var(--posi-muted)' }}>
          Evidence-based, rules-driven, and reproducible journal evaluation. Published as a <strong style={{ color: 'var(--posi-text)' }}>pilot</strong>,
          not a final release — this first cohort (the entire POSI Core Collection) is the methodology's
          proving ground before it scales to a larger, more subject-diverse corpus.
        </p>
      </div>

      <div className="p-4 text-xs leading-relaxed flex items-start gap-2.5" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
        <Info className="h-3.5 w-3.5 shrink-0 mt-px" style={{ color: '#1d4ed8' }} />
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1" style={{ color: '#1d4ed8' }}>
          <p><strong>Coverage:</strong> {coreCollection.length} Core Collection journals ({evaluatedCount} evaluated to date)</p>
          <p><strong>Methodology:</strong> AJR-1.0 Pilot</p>
          <p><strong>Scoring:</strong> 100% rules-driven, from crawled site evidence and sampled Crossref articles</p>
          <p><strong>Manual score adjustment:</strong> Not permitted</p>
          <p><strong>External indexing weight:</strong> 0 (DOAJ/Scopus/WoS/PubMed listing has no effect)</p>
          <p><strong>Quartiles:</strong> Assigned only once a minimum same-category PSC peer group exists</p>
        </div>
      </div>

      <section className="bg-white" style={{ border: '1px solid var(--posi-border)' }}>
        <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--posi-border-light)', background: 'var(--posi-bg)' }}>
          <h2 className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--posi-muted)' }}>Core Collection Ratings</h2>
          <Link href="https://github.com/WENSHAO521/posi-data/blob/master/EARLY-STAGE-RATING-SPEC.md" target="_blank" rel="noopener noreferrer" className="text-[10px] hover:underline" style={{ color: 'var(--posi-accent)' }}>
            Methodology (AJR-1.0) →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: 'var(--posi-bg)', borderBottom: '1px solid var(--posi-border)' }}>
                <th className="text-left px-4 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>Journal</th>
                <th className="text-left px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>PSC</th>
                <th className="text-center px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>Score</th>
                <th className="text-center px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>Status</th>
                <th className="text-center px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>P-Q</th>
              </tr>
            </thead>
            <tbody>
              {coreCollection.map(j => {
                const r = j.early_stage_rating
                const eligibility = r?.eligibility ?? 'unknown'
                return (
                  <tr key={j.id} className="hover:bg-gray-50 transition-colors" style={{ borderBottom: '1px solid var(--posi-border-light)' }}>
                    <td className="px-4 py-3">
                      <Link href={`/journal/${j.journal_code}`} className="font-medium block leading-tight transition-colors hover:text-[#c41e3a]" style={{ color: 'var(--posi-text)' }}>
                        {j.title}
                      </Link>
                      <span className="font-mono text-[10px]" style={{ color: 'var(--posi-muted)' }}>{j.short_title}</span>
                    </td>
                    <td className="px-3 py-3" style={{ color: 'var(--posi-muted)' }}>Not yet classified</td>
                    <td className="px-3 py-3 text-center font-mono font-semibold" style={{ color: 'var(--posi-text)' }}>
                      {r?.total != null ? `${r.total}/100` : <span style={{ color: 'var(--posi-muted)' }}>—</span>}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="font-mono text-[10px] font-semibold" style={{ color: ELIGIBILITY_COLOR[eligibility] }}>
                        {ELIGIBILITY_LABEL[eligibility]}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center text-[10px]" style={{ color: 'var(--posi-muted)' }} title="Not assigned — insufficient peer cohort">
                      —
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="px-5 py-3 text-[10px]" style={{ color: 'var(--posi-muted)', borderTop: '1px solid var(--posi-border-light)' }}>
          P-Q (Provisional Quartile) is not assigned to any journal yet — insufficient peer cohort. It requires
          PSC subject classification (not yet run on any journal) and a minimum same-category, same-cohort peer
          group per EARLY-STAGE-RATING-SPEC.md § 7. This is expected at this stage, not an error.
        </p>
      </section>

      <div className="flex flex-wrap gap-5 text-xs">
        <Link href="/core-collection" style={{ color: 'var(--posi-accent)' }} className="hover:underline">POSI Core Collection →</Link>
        <Link href="/citation-reports" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Citation Analytics (Preview) →</Link>
        <Link href="/open-data" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Open Data →</Link>
      </div>
    </div>
  )
}
