import Link from 'next/link'
import { Info } from '@phosphor-icons/react/dist/ssr'
import { PSG_JOURNALS, INDEXED_JOURNALS, SHIHARR_JOURNALS, OTHER_INDEXED_JOURNALS, getCoreCollection} from '@/lib/data'
import { LifecycleRatingsTable } from '@/components/LifecycleRatingsTable'
import { RELEASE_LABEL } from '@/lib/release'

export const metadata = {
  title: 'POSI Early-Stage Journal Rankings — AJR-E',
  description: 'Journals 12–59 months after first regular scholarly publication, evaluated through AJR-E. E-Q1–E-Q4 quartiles are assigned once a same-cohort PSC peer group exists.',
}

export default function EarlyStageRankingsPage() {
  const journals = getCoreCollection()
    .sort((a, b) => (b.early_stage_rating?.total ?? -1) - (a.early_stage_rating?.total ?? -1))
  const evaluated = journals.filter(j => j.early_stage_rating?.eligibility === 'early_stage')

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <nav className="text-xs flex items-center gap-1.5" style={{ color: 'var(--posi-muted)' }}>
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <Link href="/ratings" className="hover:text-gray-700">Ratings &amp; Rankings</Link>
        <span>/</span>
        <span style={{ color: 'var(--posi-text)' }}>Early-Stage Rankings</span>
      </nav>

      <div className="border-l-4 pl-5" style={{ borderColor: 'var(--posi-accent)' }}>
        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5" style={{ color: 'var(--posi-accent)', border: '1px solid var(--posi-accent)' }}>
          RELEASE {RELEASE_LABEL}
        </span>
        <h1 className="text-2xl font-bold leading-tight mt-2" style={{ color: 'var(--posi-text)' }}>Early-Stage Journal Rankings</h1>
        <p className="text-sm leading-relaxed mt-2 max-w-2xl" style={{ color: 'var(--posi-muted)' }}>
          Journals 12–59 months after their first regular scholarly publication, evaluated through{' '}
          <strong style={{ color: 'var(--posi-text)' }}>AJR-E</strong>, the early-stage track of{' '}
          <strong style={{ color: 'var(--posi-text)' }}>AJR (POSI Automated Rating)</strong>. E-Q1–E-Q4
          quartiles are assigned once a minimum same-category, same-cohort PSC (POSI Subject
          Classification) peer group exists — see AJR-SPEC.md § 1, § 5.
        </p>
      </div>

      <div className="p-4 text-xs leading-relaxed flex items-start gap-2.5" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
        <Info className="h-3.5 w-3.5 shrink-0 mt-px" style={{ color: '#1d4ed8' }} />
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1" style={{ color: '#1d4ed8' }}>
          <p><strong>Lifecycle window:</strong> 12–59 months since first publication</p>
          <p><strong>Methodology:</strong> AJR-E (AJR 1.0 Lifecycle Framework)</p>
          <p><strong>Scoring:</strong> 100% rules-driven, from crawled site evidence and sampled Crossref articles</p>
          <p><strong>Manual score adjustment:</strong> Not permitted</p>
          <p><strong>E-Q assignment:</strong> Pending — needs a same-category PSC peer cohort</p>
          <p><strong>Journals evaluated:</strong> {evaluated.length} of {journals.length}</p>
        </div>
      </div>

      <section className="bg-white" style={{ border: '1px solid var(--posi-border)' }}>
        <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--posi-border-light)', background: 'var(--posi-bg)' }}>
          <h2 className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--posi-muted)' }}>Core Collection — Early-Stage Track</h2>
          <a href="https://github.com/WENSHAO521/posi-data/blob/master/AJR-SPEC.md" target="_blank" rel="noopener noreferrer" className="text-[10px] hover:underline" style={{ color: 'var(--posi-accent)' }}>
            Methodology (AJR-E) →
          </a>
        </div>
        <LifecycleRatingsTable
          journals={journals}
          extraColumns={[{
            header: 'E-Q',
            render: () => ({ value: '—', title: 'Not assigned — insufficient peer cohort' }),
          }]}
        />
        <p className="px-5 py-3 text-[10px]" style={{ color: 'var(--posi-muted)', borderTop: '1px solid var(--posi-border-light)' }}>
          Every Core Collection journal is listed here regardless of lifecycle stage or eligibility, so the
          full status distribution stays visible — journals in Observation Stage (0–11 months) or below the
          minimum evidence bar have no score yet, and that is expected. Only journals in the 12–59 month
          window with a score are candidates for a future E-Q.
        </p>
      </section>

      <div className="flex flex-wrap gap-5 text-xs">
        <Link href="/ratings/mature" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Mature Journal Rankings →</Link>
        <Link href="/citation-reports" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Citation Rankings →</Link>
        <Link href="/coverage/global-benchmark" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Global Benchmark Collection →</Link>
      </div>
    </div>
  )
}
