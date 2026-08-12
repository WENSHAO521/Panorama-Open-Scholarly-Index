import Link from 'next/link'
import type { Metadata } from 'next'
import { Info } from '@phosphor-icons/react/dist/ssr'
import { RELEASE_LABEL, DATA_CUTOFF } from '@/lib/release'

export const metadata: Metadata = {
  title: 'Coverage Changes | POSI',
  description: 'The public log of Core Collection status changes — warnings, suspensions, withdrawals, delistings, and reinstatements — as they happen.',
}

// Append-only log of Core Collection status changes (see /coverage/policy for
// what each state means). Empty at Pilot 2026 launch — this is the honest
// starting state, not a placeholder to be replaced later.
type CoverageChange = {
  date: string
  journal: string
  from_state: string
  to_state: string
  reason: string
}

const COVERAGE_CHANGES: CoverageChange[] = []

export default function CoverageChangesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <nav className="text-xs flex items-center gap-1.5" style={{ color: 'var(--posi-muted)' }}>
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <span style={{ color: 'var(--posi-text)' }}>Coverage Changes</span>
      </nav>

      <div className="border-l-4 pl-5" style={{ borderColor: 'var(--posi-accent)' }}>
        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5" style={{ color: 'var(--posi-accent)', border: '1px solid var(--posi-accent)' }}>
          {RELEASE_LABEL.toUpperCase()}
        </span>
        <h1 className="text-2xl font-bold leading-tight mt-2" style={{ color: 'var(--posi-text)' }}>Coverage Changes</h1>
        <p className="text-sm leading-relaxed mt-2 max-w-2xl" style={{ color: 'var(--posi-muted)' }}>
          A public, append-only log of Core Collection status changes — Warning, Suspension,
          Withdrawal, Ceased, Delisting, and Reinstatement — as they happen. See{' '}
          <Link href="/coverage/policy" className="underline">Coverage Policy</Link> for what each
          status means and how a journal moves between them.
        </p>
      </div>

      <div className="flex items-start gap-3 p-4 text-xs leading-relaxed" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8' }}>
        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <span>
          <strong>No status changes have been recorded</strong> as of the {DATA_CUTOFF} data cutoff.
          Every Core Collection journal is currently in Continuing Review — this log will be updated
          the first time any journal moves to Warning, Suspension, Withdrawal, Ceased, Delisting, or
          Reinstatement. An empty log means exactly that, not that nothing has happened to check.
        </span>
      </div>

      <section className="bg-white" style={{ border: '1px solid var(--posi-border)' }}>
        <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--posi-border-light)', background: 'var(--posi-bg)' }}>
          <h2 className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--posi-muted)' }}>
            Change Log ({COVERAGE_CHANGES.length})
          </h2>
        </div>
        {COVERAGE_CHANGES.length > 0 ? (
          <div className="divide-y" style={{ divideColor: 'var(--posi-border-light)' } as React.CSSProperties}>
            {COVERAGE_CHANGES.map((c, i) => (
              <div key={i} className="px-5 py-3 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
                <span className="text-[10px] font-mono shrink-0" style={{ color: 'var(--posi-muted)' }}>{c.date}</span>
                <span className="text-xs font-semibold shrink-0" style={{ color: 'var(--posi-text)' }}>{c.journal}</span>
                <span className="text-xs" style={{ color: 'var(--posi-muted)' }}>
                  {c.from_state} → {c.to_state} — {c.reason}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-5 py-8 text-xs text-center" style={{ color: 'var(--posi-muted)' }}>
            No entries yet.
          </p>
        )}
      </section>

      <div className="flex flex-wrap gap-5 text-xs">
        <Link href="/coverage/policy" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Coverage Policy →</Link>
        <Link href="/core-collection" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Core Collection →</Link>
      </div>
    </div>
  )
}
