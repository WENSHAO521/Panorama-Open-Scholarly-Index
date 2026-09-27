'use client'

import { useRef, useState, type FormEvent } from 'react'
import { CheckCircle, XCircle, DownloadSimple, ArrowSquareOut } from '@phosphor-icons/react/dist/ssr'
import {
  MAX_DOIS, SNAPSHOT, STATUS_TEXT, checkAll, certificateCode, parseDoiList, todayIso, verifyPath, type CertItem,
} from '@/lib/certificate'
import { CertificateDocument, type CertificateData } from './CertificateDocument'
import { downloadCertificatePdf } from '@/lib/certificate-download'
import { Note } from './db'

type Phase = 'form' | 'checking' | 'done'

export function CertificateTool() {
  const [requester, setRequester] = useState('')
  const [affiliation, setAffiliation] = useState('')
  const [purpose, setPurpose] = useState('')
  const [dois, setDois] = useState('')
  const [phase, setPhase] = useState<Phase>('form')
  const [items, setItems] = useState<(CertItem | null)[]>([])
  const [inputs, setInputs] = useState<string[]>([])
  const [cert, setCert] = useState<CertificateData | null>(null)
  const [formError, setFormError] = useState('')
  const abort = useRef<AbortController | null>(null)
  const sheet = useRef<HTMLDivElement | null>(null)
  const [pdfState, setPdfState] = useState<'idle' | 'working' | 'error'>('idle')

  async function downloadPdf() {
    const el = sheet.current?.querySelector<HTMLElement>('.cert')
    if (!el || !cert) return
    setPdfState('working')
    try {
      await downloadCertificatePdf(el, { code: cert.code, issued: cert.issued })
      setPdfState('idle')
    } catch {
      setPdfState('error')
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const list = parseDoiList(dois)
    if (!list.length) { setFormError('Enter at least one DOI.'); return }
    if (list.length > MAX_DOIS) { setFormError(`One certificate covers at most ${MAX_DOIS} DOIs. You entered ${list.length}.`); return }
    setFormError('')
    abort.current?.abort()
    const ctrl = new AbortController()
    abort.current = ctrl
    setInputs(list)
    setItems(list.map(() => null))
    setCert(null)
    setPhase('checking')
    const results: CertItem[] = []
    try {
      await checkAll(list, (i, item) => {
        results[i] = item
        setItems(prev => { const n = [...prev]; n[i] = item; return n })
      }, ctrl.signal)
    } catch { return }

    const indexed = results.filter(r => r.status === 'indexed')
    if (indexed.length) {
      const issued = todayIso()
      const doiList = indexed.map(r => r.doi!)
      const code = await certificateCode(issued, SNAPSHOT, doiList)
      setCert({
        code, issued, snapshot: SNAPSHOT,
        requester: requester.trim(), affiliation: affiliation.trim(), purpose: purpose.trim(),
        items: indexed, excluded: results.length - indexed.length,
        verifyUrl: `${window.location.origin}${verifyPath(code, issued, SNAPSHOT, doiList)}`,
      })
    }
    setPhase('done')
  }

  const indexedCount = items.filter(i => i?.status === 'indexed').length

  return (
    <div className="space-y-10">
      <form onSubmit={submit} className="no-print panel p-5 md:p-6 grid gap-5 md:grid-cols-2" noValidate>
        <div className="flex flex-col gap-2">
          <label htmlFor="req" className="text-[13.5px] font-medium">Requester name</label>
          <input id="req" className="input" value={requester} onChange={e => setRequester(e.target.value)} autoComplete="name" />
          <p className="text-[12.5px]" style={{ color: 'var(--muted)' }}>Printed on the certificate. Not included in the verification link.</p>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="aff" className="text-[13.5px] font-medium">Affiliation <span style={{ color: 'var(--muted)', fontWeight: 400 }}>optional</span></label>
          <input id="aff" className="input" value={affiliation} onChange={e => setAffiliation(e.target.value)} autoComplete="organization" />
          <p className="text-[12.5px]" style={{ color: 'var(--muted)' }}>Optional.</p>
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <label htmlFor="pur" className="text-[13.5px] font-medium">Purpose <span style={{ color: 'var(--muted)', fontWeight: 400 }}>optional</span></label>
          <input id="pur" className="input" value={purpose} onChange={e => setPurpose(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <label htmlFor="dois" className="text-[13.5px] font-medium">DOIs <span style={{ color: 'var(--muted)', fontWeight: 400 }}>one per line, up to {MAX_DOIS}</span></label>
          <textarea
            id="dois"
            value={dois}
            onChange={e => setDois(e.target.value)}
            rows={6}
            className="input font-mono text-[13px] py-2 h-auto"
            placeholder={'10.63802/grhas.v1.i3.44\nhttps://doi.org/10.xxxx/...'}
            aria-invalid={!!formError}
            aria-describedby="dois-help dois-error"
          />
          <p id="dois-help" className="text-[12.5px]" style={{ color: 'var(--muted)' }}>DOI URLs are accepted. Duplicates are removed.</p>
          {formError && <p id="dois-error" className="text-[13px]" style={{ color: 'var(--rejected)' }}>{formError}</p>}
        </div>
        <div className="md:col-span-2 flex flex-wrap items-center gap-3">
          <button type="submit" className="btn btn-primary" disabled={phase === 'checking'}>
            {phase === 'checking' ? 'Checking' : 'Check and issue'}
          </button>
          <span className="text-[12.5px]" style={{ color: 'var(--muted)' }}>Each DOI is checked against Crossref, OpenAlex and the POSI index.</span>
        </div>
      </form>

      {phase !== 'form' && (
        <section aria-labelledby="results" className="no-print">
          <h2 id="results" className="text-[17px] font-semibold tracking-tight mb-3">
            Check results
            <span className="ml-2 font-normal text-[14px]" style={{ color: 'var(--muted)' }}>
              {indexedCount} of {inputs.length} indexed
            </span>
          </h2>
          <div className="panel overflow-x-auto">
            <table className="dtable min-w-[680px]">
              <thead><tr><th>DOI</th><th>Publication</th><th>Result</th></tr></thead>
              <tbody>
                {inputs.map((input, i) => {
                  const it = items[i]
                  const st = it ? STATUS_TEXT[it.status] : null
                  return (
                    <tr key={input}>
                      <td className="font-mono text-[12.5px] max-w-[220px] break-all">{it?.doi ?? input}</td>
                      <td className="text-[13.5px]">
                        {it?.work
                          ? <><span className="font-medium">{it.work.title}</span><br /><span style={{ color: 'var(--muted)' }}>{it.work.container}{it.work.year ? `, ${it.work.year}` : ''}</span></>
                          : it ? <span style={{ color: 'var(--soft)' }}>No metadata</span>
                          : <span className="inline-block h-3.5 w-48 rounded-[2px] animate-pulse" style={{ background: 'var(--surface-3)' }} />}
                      </td>
                      <td className="text-[13px]">
                        {st && (
                          <span className="inline-flex items-start gap-1.5" style={{ color: st.ok ? 'var(--verified)' : 'var(--check)' }}>
                            {st.ok ? <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" /> : <XCircle className="h-4 w-4 shrink-0 mt-0.5" />}
                            <span>{st.text}{it?.status === 'indexed' && <><br /><span style={{ color: 'var(--muted)' }}>Journal status: {it.tier === 'core' ? 'Core Collection' : 'Indexed'}</span></>}</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {phase === 'done' && !cert && (
            <div className="mt-4">
              <Note tone="warn">
                None of these DOIs is an indexed journal publication, so no certificate can be issued. POSI indexes
                journal publications registered with Crossref or OpenAlex.
              </Note>
            </div>
          )}
        </section>
      )}

      {cert && (
        <section aria-labelledby="cert-heading">
          <div className="no-print flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 id="cert-heading" className="text-[17px] font-semibold tracking-tight">Certificate</h2>
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
          <div ref={sheet}><CertificateDocument data={cert} /></div>
        </section>
      )}
    </div>
  )
}
