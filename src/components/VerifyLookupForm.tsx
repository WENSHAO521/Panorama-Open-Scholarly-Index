'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export interface VerifiableJournal {
  code: string
  title: string
  publisher: string
  collectionStatus: 'core' | 'candidate' | 'discovered'
  pqfGrade: string | null
  pqfTotal: number | null
  ajrEligibility: string | null
  ajrTotal: number | null
  verificationCode: string
}

const STATUS_LABEL: Record<VerifiableJournal['collectionStatus'], string> = {
  core: 'Core Collection',
  candidate: 'Candidate (below PQF eligibility bar)',
  discovered: 'Discovered (not yet reviewed)',
}
const STATUS_COLOR: Record<VerifiableJournal['collectionStatus'], string> = {
  core: 'var(--verified)',
  candidate: 'var(--check)',
  discovered: 'var(--muted)',
}

function normalize(s: string): string {
  return s.trim().toUpperCase().replace(/^POSI-R-\d{4}-PILOT-/, '')
}

export function VerifyLookupForm({ journals, releaseId }: { journals: VerifiableJournal[]; releaseId: string }) {
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('code') ?? '')

  const match = useMemo(() => {
    const q = normalize(query)
    if (!q) return null
    return journals.find(j => j.code.toUpperCase() === q || j.verificationCode.toUpperCase() === q.toUpperCase() || normalize(j.verificationCode) === q) ?? null
  }, [journals, query])

  return (
    <div className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
      <h2 className="text-xs font-bold uppercase tracking-[0.1em] mb-3" style={{ color: 'var(--posi-muted)' }}>Verify a Record</h2>
      <p className="text-[11px] mb-3" style={{ color: 'var(--posi-muted)' }}>
        Enter a journal code (e.g. <code className="font-mono">grhas</code>) or the verification code printed on a
        POSI certificate (e.g. <code className="font-mono">{releaseId}-GRHAS</code>).
      </p>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="e.g. grhas or POSI-R-2026.1-GRHAS"
        className="w-full text-xs px-3 py-2 focus:outline-none mb-1"
        style={{ border: '1px solid var(--posi-border)', color: 'var(--posi-text)' }}
      />

      {query.trim() && !match && (
        <div className="mt-3 p-3 text-[11px] leading-relaxed text-justify" style={{ background: 'var(--rejected-soft)', border: '1px solid #fecaca', color: 'var(--rejected)' }}>
          No POSI record matches "{query}". Only journals with an actual POSI record can be verified - there is no
          way to produce a valid result for a code that doesn't exist.
        </div>
      )}

      {match && (
        <div className="mt-4" style={{ border: '1px solid var(--posi-border)' }}>
          <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: 'var(--verified-soft)', borderBottom: '1px solid #bbf7d0' }}>
            <span className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--verified)' }}>✓ Record Verified</span>
            <span className="text-[9px] font-mono" style={{ color: 'var(--verified)' }}>{releaseId}</span>
          </div>
          <div className="p-4 space-y-2 text-xs">
            <div className="flex justify-between">
              <span style={{ color: 'var(--posi-muted)' }}>Journal</span>
              <Link href={`/journal/${match.code}`} className="font-semibold hover:underline" style={{ color: 'var(--posi-text)' }}>{match.title}</Link>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--posi-muted)' }}>Publisher</span>
              <span style={{ color: 'var(--posi-text)' }}>{match.publisher}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--posi-muted)' }}>Collection Status</span>
              <span className="font-semibold" style={{ color: STATUS_COLOR[match.collectionStatus] }}>{STATUS_LABEL[match.collectionStatus]}</span>
            </div>
            {match.pqfTotal != null && (
              <div className="flex justify-between">
                <span style={{ color: 'var(--posi-muted)' }}>PQF</span>
                <span className="font-mono" style={{ color: 'var(--posi-text)' }}>{match.pqfTotal}/100{match.pqfGrade ? ` (${match.pqfGrade})` : ''}</span>
              </div>
            )}
            {match.ajrTotal != null && (
              <div className="flex justify-between">
                <span style={{ color: 'var(--posi-muted)' }}>AJR</span>
                <span className="font-mono" style={{ color: 'var(--posi-text)' }}>{match.ajrTotal}/100{match.ajrEligibility ? ` (${match.ajrEligibility})` : ''}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span style={{ color: 'var(--posi-muted)' }}>Verification Code</span>
              <span className="font-mono text-[10px]" style={{ color: 'var(--posi-text)' }}>{match.verificationCode}</span>
            </div>
          </div>
          <div className="px-4 py-2 text-[10px]" style={{ borderTop: '1px solid var(--posi-border-light)', color: 'var(--posi-muted)' }}>
            This reflects the record's current, live status - not a snapshot frozen at certificate issuance. Full
            detail: <Link href={`/journal/${match.code}`} className="underline">journal page →</Link>
          </div>
        </div>
      )}
    </div>
  )
}
