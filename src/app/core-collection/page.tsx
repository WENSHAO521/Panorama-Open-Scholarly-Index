import Link from 'next/link'
import { Info } from '@phosphor-icons/react/dist/ssr'
import { PSG_JOURNALS, INDEXED_JOURNALS, SHIHARR_JOURNALS, OTHER_INDEXED_JOURNALS, DISCOVERED_JOURNALS } from '@/lib/data'
import { Badge } from '@/components/Badge'

export const metadata = {
  title: 'POSI Core Collection',
  description: 'Journals admitted through POSI\'s published editorial selection criteria — distinct from journals POSI has merely discovered and not yet reviewed.',
}

const STATES = [
  {
    name: 'Discovered',
    color: '#6B7280',
    body: 'POSI found this journal via DOAJ, Crossref, or OpenAlex discovery. It has not been reviewed. A discovered record is metadata only — it is not a POSI endorsement, and it is not part of the Core Collection.',
  },
  {
    name: 'Indexed',
    color: '#1d4ed8',
    body: 'The journal has passed POSI\'s editorial selection criteria (see PQF Eligibility) and is part of the POSI Core Collection. It has a full journal record: policy evidence, metadata quality assessment, and technical discoverability score.',
  },
  {
    name: 'Metric Eligible',
    color: '#1F7A4D',
    body: 'An Indexed journal with enough continuous coverage and citation history to receive PCI/PCS citation-impact metrics and — once PSC classification and enough same-category peers exist — a subject ranking and quartile.',
  },
]

export default function CoreCollectionPage() {
  const coreCollection = [...PSG_JOURNALS, ...INDEXED_JOURNALS, ...SHIHARR_JOURNALS, ...OTHER_INDEXED_JOURNALS]
    .sort((a, b) => a.title.localeCompare(b.title))
  const discoveredCount = DISCOVERED_JOURNALS.length
  // Metric Eligible = has a PCI/PCS record today, i.e. today's entire Core
  // Collection (see /citation-reports) — will diverge once coverage-history
  // requirements are enforced in a later phase.
  const metricEligibleCount = coreCollection.length

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <nav className="text-xs flex items-center gap-1.5" style={{ color: 'var(--posi-muted)' }}>
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <span style={{ color: 'var(--posi-text)' }}>Core Collection</span>
      </nav>

      <div className="border-l-4 pl-5" style={{ borderColor: 'var(--posi-accent)' }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5" style={{ color: 'var(--posi-accent)', border: '1px solid var(--posi-accent)' }}>CORE COLLECTION</span>
        </div>
        <h1 className="text-2xl font-bold leading-tight" style={{ color: 'var(--posi-text)' }}>POSI Core Collection</h1>
        <p className="text-sm leading-relaxed mt-2 max-w-2xl" style={{ color: 'var(--posi-muted)' }}>
          <strong style={{ color: 'var(--posi-text)' }}>POSI has a record of a journal</strong> and{' '}
          <strong style={{ color: 'var(--posi-text)' }}>POSI has reviewed and indexed a journal</strong> are
          two different claims. This page keeps them visibly separate.
        </p>
      </div>

      <div className="p-4 text-xs leading-relaxed flex items-start gap-2.5" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
        <Info className="h-3.5 w-3.5 shrink-0 mt-px" style={{ color: '#1d4ed8' }} />
        <span style={{ color: '#1d4ed8' }}>
          {discoveredCount.toLocaleString()} journals are Discovered but not reviewed — they are not
          counted as part of POSI's indexed coverage. See{' '}
          <Link href="/journals?tab=discovered" className="underline">Auto-discovered Records →</Link> to browse them anyway.
        </span>
      </div>

      <section className="grid sm:grid-cols-3 gap-4">
        {STATES.map(s => (
          <div key={s.name} className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
            <h2 className="text-xs font-bold uppercase tracking-[0.1em] mb-2" style={{ color: s.color }}>{s.name}</h2>
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--posi-muted)' }}>{s.body}</p>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-3 gap-px" style={{ background: 'var(--posi-border)', border: '1px solid var(--posi-border)' }}>
        {[
          { label: 'Discovered', value: discoveredCount },
          { label: 'Indexed (Core Collection)', value: coreCollection.length },
          { label: 'Metric Eligible', value: metricEligibleCount },
        ].map(s => (
          <div key={s.label} className="bg-white px-5 py-4 text-center">
            <p className="text-2xl font-bold font-mono" style={{ color: 'var(--posi-text)' }}>{s.value.toLocaleString()}</p>
            <p className="text-[10px] uppercase tracking-[0.12em] mt-0.5" style={{ color: 'var(--posi-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      <section className="bg-white" style={{ border: '1px solid var(--posi-border)' }}>
        <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--posi-border-light)', background: 'var(--posi-bg)' }}>
          <h2 className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--posi-muted)' }}>Indexed Journals</h2>
          <span className="text-[10px] font-mono" style={{ color: 'var(--posi-muted)' }}>{coreCollection.length} journals</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: 'var(--posi-bg)', borderBottom: '1px solid var(--posi-border)' }}>
                <th className="text-left px-4 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>Journal</th>
                <th className="text-left px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>Publisher</th>
                <th className="text-center px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>PQF</th>
                <th className="text-center px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>Metric Eligible</th>
              </tr>
            </thead>
            <tbody>
              {coreCollection.map(j => {
                const score = (j.pqf ?? j.ojqf) ?? j.auto_pqf ?? null
                return (
                  <tr key={j.id} className="hover:bg-gray-50 transition-colors" style={{ borderBottom: '1px solid var(--posi-border-light)' }}>
                    <td className="px-4 py-3">
                      <Link href={`/journal/${j.journal_code}`} className="font-medium block leading-tight transition-colors hover:text-[#c41e3a]" style={{ color: 'var(--posi-text)' }}>
                        {j.title}
                      </Link>
                      <span className="font-mono text-[10px]" style={{ color: 'var(--posi-muted)' }}>{j.short_title}</span>
                    </td>
                    <td className="px-3 py-3" style={{ color: 'var(--posi-muted)' }}>{j.publisher}</td>
                    <td className="px-3 py-3 text-center font-mono font-bold" style={{ color: score ? 'var(--posi-accent)' : 'var(--posi-muted)' }}>
                      {score ? `${score.grade}` : '—'}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <Badge label="Yes" variant="oa" />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex flex-wrap gap-5 text-xs">
        <Link href="/citation-reports" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Citation Reports →</Link>
        <Link href="/pqf#eligibility" style={{ color: 'var(--posi-accent)' }} className="hover:underline">PQF Eligibility →</Link>
        <Link href="/journals?tab=discovered" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Auto-discovered Records →</Link>
      </div>
    </div>
  )
}
