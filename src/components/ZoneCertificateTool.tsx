'use client'

// Issues the zone certificate for one journal, from its profile record.
// ?issn=<any ISSN of the journal>.

import Link from 'next/link'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowSquareOut, DownloadSimple } from '@phosphor-icons/react/dist/ssr'
import { getJournalProfile, journalHref, type JournalProfile } from '@/lib/journal-profile'
import { buildZoneCertificate, type ZoneCertificateData } from '@/lib/zone-certificate'
import { todayIso } from '@/lib/certificate'
import { downloadCertificatePdf } from '@/lib/certificate-download'
import { ZoneCertificateDocument } from './ZoneCertificateDocument'
import { Note } from './db'

type State = { key: string; profile: JournalProfile | null; cert: ZoneCertificateData | null; error?: boolean }

function IssnForm() {
  const router = useRouter()
  const [v, setV] = useState('')
  function go(e: FormEvent) {
    e.preventDefault()
    if (v.trim()) router.push(`/certificate/zone/?issn=${encodeURIComponent(v.trim())}`)
  }
  return (
    <form onSubmit={go} className="panel p-5 flex flex-col gap-2 max-w-[520px]">
      <label htmlFor="zissn" className="text-[13.5px] font-medium">Journal ISSN</label>
      <input id="zissn" className="input font-mono text-[13px]" value={v} onChange={e => setV(e.target.value)} placeholder="1234-5678" />
      <p className="text-[12.5px]" style={{ color: 'var(--muted)' }}>
        Any of the journal&apos;s ISSNs. Or open the journal&apos;s profile and select <em>Zone certificate</em>.
      </p>
      <div><button type="submit" className="btn btn-primary mt-1">Issue certificate</button></div>
    </form>
  )
}

export function ZoneCertificateTool() {
  const sp = useSearchParams()
  const key = sp.get('issn') ?? ''
  const [state, setState] = useState<State | null>(null)
  const sheet = useRef<HTMLDivElement | null>(null)
  const [pdfState, setPdfState] = useState<'idle' | 'working' | 'error'>('idle')

  useEffect(() => {
    if (!key) return
    const ctrl = new AbortController()
    getJournalProfile(key, ctrl.signal)
      .then(async profile => {
        const cert = profile ? await buildZoneCertificate(profile, todayIso(), window.location.origin) : null
        if (!ctrl.signal.aborted) setState({ key, profile, cert })
      })
      .catch(e => { if (e.name !== 'AbortError') setState({ key, profile: null, cert: null, error: true }) })
    return () => ctrl.abort()
  }, [key])

  if (!key) return <IssnForm />
  const current = state?.key === key ? state : null
  if (!current) return <div className="h-[480px] max-w-[794px] rounded-[2px] animate-pulse" style={{ background: 'var(--surface-2)' }} aria-busy="true" aria-label="Loading" />
  if (current.error) return <Note tone="warn">The journal could not be loaded. Check your connection and reload the page.</Note>
  if (!current.profile) return <><Note tone="warn">No indexed journal matches “{key}”.</Note><div className="mt-5"><IssnForm /></div></>

  const { profile: j, cert } = current
  if (!cert) {
    return (
      <Note tone="warn">
        <strong>{j.t}</strong> has no official POSI Zone in the current Citation Ranking edition, so no zone certificate
        can be issued. Zones come from the journal&apos;s PNCI percentile within its PSC category; an official zone needs an
        official ranking in a category of at least 50 ranked journals. <Link href={journalHref(j.k)} className="link">See the journal&apos;s ranking status</Link>.
      </Note>
    )
  }

  async function downloadPdf() {
    const el = sheet.current?.querySelector<HTMLElement>('.cert')
    if (!el || !cert) return
    setPdfState('working')
    try {
      await downloadCertificatePdf(el, {
        code: cert.code, issued: cert.issued, subject: 'Certificate of journal zone', fileName: `POSI-zone-certificate-${cert.code}.pdf`, singlePage: true, landscape: true,
      })
      setPdfState('idle')
    } catch {
      setPdfState('error')
    }
  }

  return (
    <section aria-labelledby="cert-heading">
      <div className="no-print flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 id="cert-heading" className="text-[17px] font-semibold tracking-tight">
          <Link href={journalHref(j.k)} className="hover:underline">{j.t}</Link>
        </h2>
        <div className="flex gap-2">
          <a href={cert.verifyUrl} target="_blank" rel="noopener noreferrer" className="btn">Verify <ArrowSquareOut className="h-4 w-4" /></a>
          <button type="button" className="btn btn-primary" onClick={downloadPdf} disabled={pdfState === 'working'} aria-busy={pdfState === 'working'}>
            <DownloadSimple className="h-4 w-4" /> {pdfState === 'working' ? 'Preparing PDF…' : 'Download PDF'}
          </button>
        </div>
      </div>
      {pdfState === 'error' && (
        <p className="no-print mb-3 text-[13.5px]" style={{ color: 'var(--check)' }}>The PDF could not be created in this browser. Try again, or use another browser.</p>
      )}
      <div ref={sheet} className="overflow-x-auto"><ZoneCertificateDocument data={cert} /></div>
    </section>
  )
}
