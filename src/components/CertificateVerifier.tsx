'use client'

import Link from 'next/link'
import { useEffect, useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, XCircle, WarningCircle } from '@phosphor-icons/react/dist/ssr'
import { SNAPSHOT, STATUS_TEXT, checkAll, certificateCode, type CertItem } from '@/lib/certificate'

type Verdict = 'valid' | 'changed' | 'tampered'

interface Result { key: string; codeOk: boolean; items: CertItem[] }

function Banner({ verdict }: { verdict: Verdict }) {
  const m = {
    valid: { Icon: CheckCircle, color: 'var(--verified)', bg: 'var(--verified-soft)', title: 'Valid certificate', body: 'The certificate is unaltered and every listed publication is indexed in POSI today.' },
    changed: { Icon: WarningCircle, color: 'var(--check)', bg: 'var(--check-soft)', title: 'Authentic, but status has changed', body: 'The certificate is unaltered, but at least one listed publication is no longer indexed. See the items below.' },
    tampered: { Icon: XCircle, color: 'var(--rejected)', bg: 'var(--rejected-soft)', title: 'Not valid', body: 'The certificate number does not match its date, snapshot and publication list. The certificate has been altered or the link is incomplete.' },
  }[verdict]
  return (
    <div className="rounded-[2px] p-5 flex gap-4 items-start" style={{ background: m.bg, border: '1px solid var(--line)' }} role="status">
      <m.Icon className="h-7 w-7 shrink-0" style={{ color: m.color }} />
      <div>
        <p className="text-[18px] font-semibold" style={{ color: m.color }}>{m.title}</p>
        <p className="mt-1 text-[14px]" style={{ color: 'var(--ink-2)' }}>{m.body}</p>
      </div>
    </div>
  )
}

function ManualEntry() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [err, setErr] = useState('')
  function go(e: FormEvent) {
    e.preventDefault()
    try {
      const u = new URL(url.trim())
      if (!u.searchParams.get('c')) throw new Error()
      router.push(`/certificate/verify/?${u.searchParams}`)
    } catch { setErr('Paste the full verification address printed under the QR code.') }
  }
  return (
    <form onSubmit={go} className="panel p-5 flex flex-col gap-2 max-w-[720px]">
      <label htmlFor="vurl" className="text-[13.5px] font-medium">Verification address</label>
      <input id="vurl" className="input font-mono text-[13px]" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://posi.panorama-sg.com/certificate/verify/?c=PC-..." aria-describedby="vurl-help" />
      <p id="vurl-help" className="text-[12.5px]" style={{ color: 'var(--muted)' }}>
        Printed at the bottom of every certificate. Scanning the QR code opens the same address.
      </p>
      {err && <p className="text-[13px]" style={{ color: 'var(--rejected)' }}>{err}</p>}
      <div><button type="submit" className="btn btn-primary mt-1">Verify</button></div>
    </form>
  )
}

export function CertificateVerifier() {
  const sp = useSearchParams()
  const code = sp.get('c') ?? ''
  const issued = sp.get('d') ?? ''
  const snapshot = sp.get('s') ?? ''
  const dois = (sp.get('doi') ?? '').split(',').map(s => s.trim()).filter(Boolean)
  const key = sp.toString()
  const [result, setResult] = useState<Result | null>(null)
  const [partial, setPartial] = useState<{ key: string; items: (CertItem | null)[] } | null>(null)

  useEffect(() => {
    if (!code || !issued || !snapshot || !dois.length) return
    const ctrl = new AbortController()
    ;(async () => {
      const expected = await certificateCode(issued, snapshot, dois)
      const items: CertItem[] = []
      try {
        await checkAll(dois, (i, it) => {
          items[i] = it
          setPartial(p => { const arr = p?.key === key ? [...p.items] : dois.map(() => null); arr[i] = it; return { key, items: arr } })
        }, ctrl.signal)
      } catch { return }
      setResult({ key, codeOk: expected === code, items })
    })()
    return () => ctrl.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  if (!code) return <ManualEntry />

  const current = result?.key === key ? result : null
  const rows = current?.items ?? (partial?.key === key ? partial.items : dois.map(() => null))
  const verdict: Verdict | null = current
    ? !current.codeOk ? 'tampered' : current.items.every(i => i.status === 'indexed') ? 'valid' : 'changed'
    : null

  return (
    <div className="space-y-6 max-w-[960px]">
      {verdict ? <Banner verdict={verdict} /> : (
        <div className="rounded-[2px] p-5 animate-pulse" style={{ background: 'var(--surface-2)' }} aria-busy="true">
          <div className="h-5 w-56 rounded-[2px]" style={{ background: 'var(--surface-3)' }} />
          <div className="h-4 w-80 rounded-[2px] mt-2" style={{ background: 'var(--surface-3)' }} />
        </div>
      )}

      <dl className="panel p-5 grid gap-x-8 gap-y-2 sm:grid-cols-[auto_minmax(0,1fr)] text-[14px]">
        <dt style={{ color: 'var(--muted)' }}>Certificate number</dt>
        <dd className="font-mono font-medium">{code}</dd>
        <dt style={{ color: 'var(--muted)' }}>Issued</dt>
        <dd className="font-mono">{issued || 'missing'}</dd>
        <dt style={{ color: 'var(--muted)' }}>Data snapshot</dt>
        <dd className="font-mono">
          {snapshot || 'missing'}
          {snapshot && snapshot !== SNAPSHOT && <span className="ml-2 font-sans text-[13px]" style={{ color: 'var(--muted)' }}>(re-checked against the current snapshot {SNAPSHOT})</span>}
        </dd>
        <dt style={{ color: 'var(--muted)' }}>Content integrity</dt>
        <dd>{current ? (current.codeOk ? 'Number matches date, snapshot and publication list' : 'Number does not match the content') : 'Checking'}</dd>
      </dl>

      <div className="panel overflow-x-auto">
        <table className="dtable min-w-[680px]">
          <thead><tr><th>Publication</th><th>Accession</th><th>Status today</th></tr></thead>
          <tbody>
            {dois.map((d, i) => {
              const it = rows[i]
              const st = it ? STATUS_TEXT[it.status] : null
              return (
                <tr key={d}>
                  <td className="text-[13.5px]">
                    {it?.work ? <><span className="font-medium">{it.work.title}</span><br /><span style={{ color: 'var(--muted)' }}>{it.work.container}{it.work.year ? `, ${it.work.year}` : ''}</span><br /></> : null}
                    <span className="font-mono text-[12px]" style={{ color: 'var(--muted)' }}>{d}</span>
                  </td>
                  <td className="font-mono text-[12px]">{it?.accession ?? ''}</td>
                  <td className="text-[13px]">
                    {st ? (
                      <span className="inline-flex items-start gap-1.5" style={{ color: st.ok ? 'var(--verified)' : 'var(--check)' }}>
                        {st.ok ? <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" /> : <XCircle className="h-4 w-4 shrink-0 mt-0.5" />}
                        <span>{st.text}{it?.status === 'indexed' && <><br /><span style={{ color: 'var(--muted)' }}>Journal status: {it.tier === 'core' ? 'Core Collection' : 'Indexed'}</span></>}</span>
                      </span>
                    ) : <span className="inline-block h-3.5 w-40 rounded-[2px] animate-pulse" style={{ background: 'var(--surface-3)' }} />}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-[13px] leading-relaxed max-w-[75ch]" style={{ color: 'var(--muted)' }}>
        Verification recomputes the certificate number from its contents and re-checks each publication against
        Crossref, OpenAlex and the current POSI index. The requester&apos;s name is not part of the link and is not
        verified. <Link href="/docs/certificates/" className="link">How certificates work</Link>.
      </p>
    </div>
  )
}
