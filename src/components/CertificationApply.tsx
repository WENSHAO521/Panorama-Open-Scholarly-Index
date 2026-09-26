'use client'

// Builds a complete certification application and hands it to the
// applicant's own mail client. Nothing is stored or sent by the site.

import { useState, type FormEvent } from 'react'
import { CheckCircle, WarningCircle, EnvelopeSimple } from '@phosphor-icons/react/dist/ssr'
import { getSource } from '@/lib/openalex'

const TO = 'posi@panorama-sg.com'

const FIELDS = [
  { key: 'title', label: 'Journal title', required: true, type: 'text' },
  { key: 'issn', label: 'ISSN (print or electronic)', required: true, type: 'text', help: 'Used to confirm the journal is indexed before you apply.' },
  { key: 'publisher', label: 'Publisher', required: true, type: 'text' },
  { key: 'website', label: 'Journal website', required: true, type: 'url' },
  { key: 'contact', label: 'Contact email', required: true, type: 'email', help: 'Where the evaluation report will be sent.' },
  { key: 'prefix', label: 'Crossref DOI prefix', required: false, type: 'text', help: 'For example 10.12345.' },
  { key: 'board', label: 'Editorial board page', required: true, type: 'url' },
  { key: 'review', label: 'Peer review policy page', required: true, type: 'url' },
  { key: 'fees', label: 'APC or fee information page', required: true, type: 'url' },
  { key: 'license', label: 'Open access or license policy page', required: false, type: 'url' },
  { key: 'ethics', label: 'Publication ethics and corrections policy page', required: true, type: 'url' },
] as const

type Key = typeof FIELDS[number]['key']
type Check = { state: 'idle' } | { state: 'checking' } | { state: 'found'; name: string; via: string } | { state: 'missing' }

export function CertificationApply() {
  const [v, setV] = useState<Record<Key, string>>(() => Object.fromEntries(FIELDS.map(f => [f.key, ''])) as Record<Key, string>)
  const [errors, setErrors] = useState<Partial<Record<Key, string>>>({})
  const [check, setCheck] = useState<Check>({ state: 'idle' })
  const [ready, setReady] = useState<string | null>(null)

  async function checkIssn() {
    const issn = v.issn.trim().toUpperCase()
    if (!/^\d{4}-?\d{3}[\dX]$/.test(issn)) { setErrors(e => ({ ...e, issn: 'Enter an ISSN like 1234-5678.' })); return }
    setErrors(e => ({ ...e, issn: undefined }))
    setCheck({ state: 'checking' })
    try {
      const s = await getSource(issn)
      if (s) return setCheck({ state: 'found', name: s.display_name, via: 'OpenAlex' })
      const r = await fetch(`https://api.crossref.org/journals/${encodeURIComponent(issn)}?mailto=${TO}`)
      if (r.ok) return setCheck({ state: 'found', name: (await r.json()).message.title, via: 'Crossref' })
      setCheck({ state: 'missing' })
    } catch { setCheck({ state: 'missing' }) }
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    const errs: Partial<Record<Key, string>> = {}
    for (const f of FIELDS) {
      const val = v[f.key].trim()
      if (f.required && !val) errs[f.key] = 'Required.'
      else if (val && f.type === 'url' && !/^https?:\/\/\S+\.\S+/.test(val)) errs[f.key] = 'Enter a full address starting with https://'
      else if (val && f.type === 'email' && !/^\S+@\S+\.\S+$/.test(val)) errs[f.key] = 'Enter a valid email address.'
    }
    setErrors(errs)
    if (Object.keys(errs).length) { setReady(null); return }
    const body = [
      'POSI Core Collection certification application',
      '',
      ...FIELDS.map(f => `${f.label}: ${v[f.key].trim() || '(not provided)'}`),
      '',
      `Index check: ${check.state === 'found' ? `found in ${check.via} as "${check.name}"` : 'not run'}`,
      '',
      'We confirm that the linked pages are public and that the information above is accurate.',
    ].join('\n')
    const subject = `POSI certification application: ${v.title.trim()}`
    setReady(`mailto:${TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
  }

  return (
    <form onSubmit={submit} noValidate className="panel p-5 md:p-6">
      <div className="grid gap-5 md:grid-cols-2">
        {FIELDS.map(f => (
          <div key={f.key} className={`flex flex-col gap-2 ${f.key === 'title' || f.key === 'ethics' || f.key === 'license' ? 'md:col-span-2' : ''}`}>
            <label htmlFor={`ap-${f.key}`} className="text-[13.5px] font-medium">
              {f.label}{!f.required && <span className="font-normal" style={{ color: 'var(--muted)' }}> optional</span>}
            </label>
            <div className={f.key === 'issn' ? 'flex gap-2' : undefined}>
              <input
                id={`ap-${f.key}`}
                type={f.type}
                value={v[f.key]}
                onChange={e => { setV(s => ({ ...s, [f.key]: e.target.value })); if (f.key === 'issn') setCheck({ state: 'idle' }) }}
                aria-invalid={!!errors[f.key]}
                aria-describedby={`ap-${f.key}-help`}
                className="input"
                autoComplete={f.key === 'contact' ? 'email' : 'off'}
              />
              {f.key === 'issn' && <button type="button" className="btn shrink-0" onClick={checkIssn} disabled={check.state === 'checking'}>{check.state === 'checking' ? 'Checking' : 'Check'}</button>}
            </div>
            <p id={`ap-${f.key}-help`} className="text-[12.5px]" style={{ color: errors[f.key] ? 'var(--rejected)' : 'var(--muted)' }}>
              {errors[f.key] ?? ('help' in f ? f.help : '')}
            </p>
            {f.key === 'issn' && check.state === 'found' && (
              <p className="text-[13px] inline-flex items-center gap-1.5" style={{ color: 'var(--verified)' }}>
                <CheckCircle className="h-4 w-4" /> Indexed via {check.via} as &ldquo;{check.name}&rdquo;
              </p>
            )}
            {f.key === 'issn' && check.state === 'missing' && (
              <p className="text-[13px] inline-flex items-start gap-1.5" style={{ color: 'var(--check)' }}>
                <WarningCircle className="h-4 w-4 shrink-0 mt-0.5" /> Not found in Crossref or OpenAlex. Register DOIs with Crossref first; journals must be indexed before certification.
              </p>
            )}
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="submit" className="btn btn-primary">Prepare application</button>
        {ready && (
          <a href={ready} className="btn"><EnvelopeSimple className="h-4 w-4" /> Open in your email</a>
        )}
        <span className="text-[12.5px]" style={{ color: 'var(--muted)' }}>
          {ready ? `Your mail app opens with the application addressed to ${TO}. Review it and press send.` : 'Nothing is sent until you press send in your own email app.'}
        </span>
      </div>
    </form>
  )
}
