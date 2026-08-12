import Link from 'next/link'
import type { Metadata } from 'next'
import { WarningCircle } from '@phosphor-icons/react/dist/ssr'

export const metadata: Metadata = {
  title: 'Coverage Policy | POSI',
  description: 'What happens to a journal after it is admitted to the POSI Core Collection — continuing review, warning, suspension, withdrawal, delisting, appeal, and reinstatement.',
}

function SectionHeader({ num, title }: { num: string; title: string }) {
  return (
    <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--posi-border-light)', background: 'var(--posi-bg)' }}>
      <div className="flex items-center gap-2.5">
        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 leading-none shrink-0" style={{ color: 'var(--posi-accent)', border: '1px solid var(--posi-accent)' }}>{num}</span>
        <h2 className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--posi-muted)' }}>{title}</h2>
      </div>
    </div>
  )
}

const LIFECYCLE_STATES = [
  {
    state: 'Admission',
    desc: 'A record passes evidence review (see the Journal Inclusion and Verification Policy) and receives a PQF editorial-selection assessment. It joins the Core Collection and enters continuing review going forward.',
    visible: 'Full public record, PQF grade, lifecycle and PSC classification.',
  },
  {
    state: 'Continuing Review',
    desc: 'The default ongoing state for every Core Collection member. Records are re-checked against the same public-evidence criteria on at least an annual cadence, or sooner if a specific concern is raised.',
    visible: 'No change to public status — this is the steady state most journals stay in.',
  },
  {
    state: 'Warning',
    desc: 'Applied when continuing review finds a specific, unresolved concern — e.g. a policy page has disappeared, the editorial board can no longer be verified, or an integrity concern has been raised — while POSI seeks clarification from the publisher.',
    visible: 'A visible warning notice on the journal record stating the specific concern. Existing PQF/AJR figures remain displayed, marked as under review.',
  },
  {
    state: 'Suspension',
    desc: 'Applied when a Warning is not resolved within the response window, or when a citation-integrity finding requires withholding a metric pending review (see PJR-SPEC.md § 9). The Core Collection record itself is not removed.',
    visible: 'Ranking and/or metric fields show "suppressed" with the reason. The record stays visible — POSI does not silently delete a suspended journal\'s history.',
  },
  {
    state: 'Withdrawal',
    desc: 'A publisher may request their journal be withdrawn from active Core Collection evaluation at any time, for any reason, without it being treated as an integrity finding.',
    visible: 'Record marked as withdrawn at publisher request; historical PQF/AJR figures remain visible for reference, clearly dated.',
  },
  {
    state: 'Ceased',
    desc: 'Applied when a journal itself stops publishing — no new issues for an extended period and no indication of a future resumption.',
    visible: 'Record marked ceased with its last known publication date.',
  },
  {
    state: 'Delisting',
    desc: 'POSI-initiated permanent removal from the Core Collection, applied only after a Suspension is not resolved within the defined window, or in response to a severe, confirmed integrity violation (e.g. fabricated editorial board, citation cartel).',
    visible: 'Record marked delisted with the specific reason. The historical record — including that it was once admitted and what changed — is not erased.',
  },
  {
    state: 'Appeal',
    desc: 'A publisher may appeal any Warning, Suspension, or Delisting decision by submitting counter-evidence to the POSI editorial team. Appeals are reviewed independently of the original finding.',
    visible: 'Appeal status noted on the record while under review.',
  },
  {
    state: 'Reinstatement',
    desc: 'If a suspended or delisted journal resolves the underlying issue (documented and independently verifiable), it may be reinstated through the same evidence-review process as a new submission.',
    visible: 'Record returns to Continuing Review with the resolution documented.',
  },
]

export default function CoveragePolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <nav className="text-xs flex items-center gap-1.5" style={{ color: 'var(--posi-muted)' }}>
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <span style={{ color: 'var(--posi-text)' }}>Coverage Policy</span>
      </nav>

      <div className="border-l-4 pl-5" style={{ borderColor: 'var(--posi-accent)' }}>
        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5" style={{ color: 'var(--posi-accent)', border: '1px solid var(--posi-accent)' }}>
          PILOT 2026
        </span>
        <h1 className="text-2xl font-bold leading-tight mt-2" style={{ color: 'var(--posi-text)' }}>Coverage Policy</h1>
        <p className="text-sm leading-relaxed mt-2 max-w-2xl" style={{ color: 'var(--posi-muted)' }}>
          Admission to the Core Collection is not a one-time event. This page defines what happens
          to a journal record over time — continuing review, warning, suspension, withdrawal, ceased,
          delisting, appeal, and reinstatement — so that a status change is never a surprise. See the{' '}
          <Link href="/policy" className="underline">Journal Inclusion and Verification Policy</Link>{' '}
          for how a record is admitted in the first place, and{' '}
          <Link href="/coverage/changes" className="underline">Coverage Changes</Link> for the public log
          of status changes as they happen.
        </p>
      </div>

      <div className="flex items-start gap-3 p-4 text-xs leading-relaxed" style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e' }}>
        <WarningCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <span>
          <strong>Pilot 2026 note:</strong> this policy is in effect from launch. No Core Collection
          journal has moved past Admission / Continuing Review yet — see{' '}
          <Link href="/coverage/changes" className="underline">Coverage Changes</Link> for the current,
          empty log.
        </span>
      </div>

      <section className="bg-white" style={{ border: '1px solid var(--posi-border)' }}>
        <SectionHeader num="1" title="Lifecycle States" />
        <div className="divide-y" style={{ divideColor: 'var(--posi-border-light)' } as React.CSSProperties}>
          {LIFECYCLE_STATES.map((s, i) => (
            <div key={s.state} className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-mono font-bold" style={{ color: 'var(--posi-accent)' }}>{i + 1}.</span>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--posi-text)' }}>{s.state}</h3>
              </div>
              <p className="text-xs leading-relaxed mb-2" style={{ color: 'var(--posi-muted)' }}>{s.desc}</p>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--posi-text)' }}>
                <strong>What readers see: </strong>{s.visible}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
        <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--posi-text)' }}>Principles</h2>
        <ul className="space-y-2.5">
          {[
            'A journal\'s access model (open access, hybrid, subscription) and its DOAJ listing status are never, by themselves, grounds for Warning, Suspension, or Delisting.',
            'A Warning or Suspension always names the specific, evidence-based concern — never an unexplained status change.',
            'A suspended or delisted record is never silently deleted. The public record preserves what happened and when.',
            'No manual score, ranking, or quartile override exists at any stage of this process — a status change affects visibility and metric availability, never the underlying PQF/AJR calculation itself.',
            'Every Warning, Suspension, and Delisting carries an appeal right, reviewed independently of the original finding.',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: 'var(--posi-muted)' }}>
              <span className="shrink-0 font-mono text-[10px] mt-0.5" style={{ color: '#1F7A4D' }}>✓</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap gap-5 text-xs">
        <Link href="/coverage/changes" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Coverage Changes →</Link>
        <Link href="/policy" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Journal Inclusion Policy →</Link>
        <Link href="/pqf" style={{ color: 'var(--posi-accent)' }} className="hover:underline">PQF Methodology →</Link>
        <Link href="/core-collection" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Core Collection →</Link>
      </div>
    </div>
  )
}
