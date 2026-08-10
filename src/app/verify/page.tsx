import { Suspense } from 'react'
import Link from 'next/link'
import { Info } from '@phosphor-icons/react/dist/ssr'
import { getCoreCollection, getCandidateJournals } from '@/lib/data'
import { RELEASE_ID, RELEASE_LABEL, METHODOLOGY_VERSION, DATA_CUTOFF, verificationCode } from '@/lib/release'
import { VerifyLookupForm, type VerifiableJournal } from '@/components/VerifyLookupForm'

export const metadata = {
  title: 'Verify a POSI Record',
  description: 'Look up a journal by code or verification code to confirm its current POSI Core Collection, PQF, and AJR status.',
}

export default function VerifyPage() {
  const journals: VerifiableJournal[] = [
    ...getCoreCollection().map(j => ({
      code: j.journal_code,
      title: j.title,
      publisher: j.publisher,
      collectionStatus: 'core' as const,
      pqfGrade: (j.pqf ?? j.ojqf ?? j.auto_pqf)?.grade ?? null,
      pqfTotal: (j.pqf ?? j.ojqf ?? j.auto_pqf)?.total ?? null,
      ajrEligibility: j.early_stage_rating?.eligibility ?? null,
      ajrTotal: j.early_stage_rating?.total ?? null,
      verificationCode: verificationCode(j.journal_code),
    })),
    ...getCandidateJournals().map(j => ({
      code: j.journal_code,
      title: j.title,
      publisher: j.publisher,
      collectionStatus: 'candidate' as const,
      pqfGrade: (j.pqf ?? j.ojqf ?? j.auto_pqf)?.grade ?? null,
      pqfTotal: (j.pqf ?? j.ojqf ?? j.auto_pqf)?.total ?? null,
      ajrEligibility: j.early_stage_rating?.eligibility ?? null,
      ajrTotal: j.early_stage_rating?.total ?? null,
      verificationCode: verificationCode(j.journal_code),
    })),
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <nav className="text-xs flex items-center gap-1.5" style={{ color: 'var(--posi-muted)' }}>
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <span style={{ color: 'var(--posi-text)' }}>Verify</span>
      </nav>

      <div className="border-l-4 pl-5" style={{ borderColor: 'var(--posi-accent)' }}>
        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5" style={{ color: 'var(--posi-accent)', border: '1px solid var(--posi-accent)' }}>
          {RELEASE_ID}
        </span>
        <h1 className="text-2xl font-bold leading-tight mt-2" style={{ color: 'var(--posi-text)' }}>Verify a POSI Record</h1>
        <p className="text-sm leading-relaxed mt-2 max-w-2xl" style={{ color: 'var(--posi-muted)' }}>
          Confirm a journal's current Core Collection, PQF, and AJR status directly from POSI's own data — the
          same source every other page on this site reads from, not a separate claims database that could drift
          out of sync.
        </p>
      </div>

      <div className="p-4 text-xs leading-relaxed flex items-start gap-2.5" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
        <Info className="h-3.5 w-3.5 shrink-0 mt-px" style={{ color: '#1d4ed8' }} />
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1" style={{ color: '#1d4ed8' }}>
          <p><strong>Release:</strong> {RELEASE_LABEL}</p>
          <p><strong>Methodology:</strong> {METHODOLOGY_VERSION}</p>
          <p><strong>Data cutoff:</strong> {DATA_CUTOFF}</p>
          <p><strong>Records verifiable:</strong> {journals.length.toLocaleString()}</p>
        </div>
      </div>

      <Suspense fallback={<div className="text-xs py-8 text-center" style={{ color: 'var(--posi-muted)' }}>Loading…</div>}>
        <VerifyLookupForm journals={journals} releaseId={RELEASE_ID} />
      </Suspense>

      <p className="text-[10px] leading-relaxed" style={{ color: 'var(--posi-muted)' }}>
        A verification code (e.g. <code className="font-mono">{RELEASE_ID}-GRHAS</code>) is deterministic, not a
        claim of a sequentially-issued registry number — it's derived from the journal code and release ID, and
        this page proves it by re-deriving it and checking the record it points to actually exists. Lookups
        always show the record's live current state, not a value frozen at certificate issuance.
      </p>

      <div className="flex flex-wrap gap-5 text-xs">
        <Link href="/ratings" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Ratings &amp; Rankings →</Link>
        <Link href="/core-collection" style={{ color: 'var(--posi-accent)' }} className="hover:underline">POSI Core Collection →</Link>
      </div>
    </div>
  )
}
