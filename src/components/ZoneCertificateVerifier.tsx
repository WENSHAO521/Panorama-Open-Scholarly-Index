'use client'

// Verifies a zone certificate: recomputes its number from the date of issue
// and the journal's current ranking record. ?c=<number>&d=<date>&issn=<ISSN>.

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, WarningCircle } from '@phosphor-icons/react/dist/ssr'
import { getJournalProfile, journalHref, type JournalProfile } from '@/lib/journal-profile'
import { placements, zoneCertificateCode, ZONE_SHARE } from '@/lib/zone-certificate'
import { fmt, Note } from './db'

interface Result { key: string; profile: JournalProfile | null; expected: string | null; error?: boolean }

export function ZoneCertificateVerifier() {
  const sp = useSearchParams()
  const code = (sp.get('c') ?? '').trim().toUpperCase()
  const issued = sp.get('d') ?? ''
  const issn = sp.get('issn') ?? ''
  const key = sp.toString()
  const [result, setResult] = useState<Result | null>(null)

  useEffect(() => {
    if (!code || !issued || !issn) return
    const ctrl = new AbortController()
    getJournalProfile(issn, ctrl.signal)
      .then(async profile => {
        const expected = profile ? await zoneCertificateCode(issued, profile) : null
        if (!ctrl.signal.aborted) setResult({ key, profile, expected })
      })
      .catch(e => { if (e.name !== 'AbortError') setResult({ key, profile: null, expected: null, error: true }) })
    return () => ctrl.abort()
  }, [key, code, issued, issn])

  if (!code || !issued || !issn) {
    return <Note tone="warn">This verification address is incomplete. Open it from the QR code on the certificate, or copy the full address printed under it.</Note>
  }
  const current = result?.key === key ? result : null
  if (!current) {
    return (
      <div className="rounded-[2px] p-5 animate-pulse max-w-[860px]" style={{ background: 'var(--surface-2)' }} aria-busy="true">
        <div className="h-5 w-56 rounded-[2px]" style={{ background: 'var(--surface-3)' }} />
        <div className="h-4 w-80 rounded-[2px] mt-2" style={{ background: 'var(--surface-3)' }} />
      </div>
    )
  }
  if (current.error) return <Note tone="warn">The journal record could not be loaded. Check your connection and reload the page.</Note>

  const j = current.profile
  const valid = !!current.expected && current.expected === code
  const zones = j ? placements(j) : []
  const m = valid
    ? { Icon: CheckCircle, color: 'var(--verified)', bg: 'var(--verified-soft)', title: 'Valid certificate', body: 'The certificate number matches its date of issue and the journal’s zones in the current ranking edition.' }
    : { Icon: WarningCircle, color: 'var(--check)', bg: 'var(--check-soft)', title: 'Does not match the current ranking', body: j
        ? 'The certificate number does not match the journal’s current zone. Either the zone has changed since the date of issue (rankings are refreshed monthly), the certificate was issued under the retired PCS-based zone trial (before 28 September 2026), or the certificate has been altered. The current zone is shown below; a new certificate can be issued from the journal’s profile.'
        : 'No indexed journal matches the ISSN in this address.' }

  return (
    <div className="space-y-6 max-w-[860px]">
      <div className="rounded-[2px] p-5 flex gap-4 items-start" style={{ background: m.bg, border: '1px solid var(--line)' }} role="status">
        <m.Icon className="h-7 w-7 shrink-0" style={{ color: m.color }} />
        <div>
          <p className="text-[18px] font-semibold" style={{ color: m.color }}>{m.title}</p>
          <p className="mt-1 text-[14px]" style={{ color: 'var(--ink-2)' }}>{m.body}</p>
        </div>
      </div>

      <dl className="panel p-5 grid gap-x-8 gap-y-2 sm:grid-cols-[auto_minmax(0,1fr)] text-[14px]">
        <dt style={{ color: 'var(--muted)' }}>Certificate number</dt>
        <dd className="font-mono font-medium">{code}</dd>
        <dt style={{ color: 'var(--muted)' }}>Issued</dt>
        <dd className="font-mono">{issued}</dd>
        {j && <>
          <dt style={{ color: 'var(--muted)' }}>Journal</dt>
          <dd><Link href={journalHref(j.k)} className="link">{j.t}</Link> <span className="font-mono text-[12.5px]" style={{ color: 'var(--muted)' }}>{j.pid}</span></dd>
          <dt style={{ color: 'var(--muted)' }}>ISSN</dt>
          <dd className="font-mono">{j.is.join(', ')}</dd>
          <dt style={{ color: 'var(--muted)' }}>Zone today</dt>
          <dd>
            {zones.length ? (
              <ul className="space-y-0.5">
                {zones.map(p => (
                  <li key={p.scope}>
                    <strong>Zone {p.zone}</strong> ({ZONE_SHARE[p.zone]}) in {p.label}
                    <span className="font-mono text-[12.5px]" style={{ color: 'var(--muted)' }}> · rank {fmt(p.rank)} / {fmt(p.size)}{j.ev?.y ? ` · ${j.ev.y}` : ''}</span>
                  </li>
                ))}
              </ul>
            ) : <span style={{ color: 'var(--muted)' }}>No official zone in the current Citation Ranking edition</span>}
          </dd>
        </>}
      </dl>

      <p className="text-[13px] leading-relaxed max-w-[75ch]" style={{ color: 'var(--muted)' }}>
        The certificate number is recomputed from the date of issue and the journal&apos;s current zones, so a
        certificate stays valid while its zones hold, whatever the rank movements within a zone.{' '}
        <Link href="/docs/certificates/#zone-certificates" className="link">How zone certificates work</Link>.
      </p>
    </div>
  )
}
