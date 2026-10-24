'use client'

// Builds a complete certification application and hands it to the
// applicant's own mail client. Nothing is stored or sent by the site.
// The form is translated; the email itself stays in English, the language the editorial office works in.

import { useState, type FormEvent } from 'react'
import { CheckCircle, WarningCircle, EnvelopeSimple } from '@phosphor-icons/react/dist/ssr'
import { getSource } from '@/lib/openalex'
import type { Locale } from '@/i18n/config'
import { useLocale } from '@/i18n/LocaleProvider'
import { fill } from '@/i18n/format'

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

const en = {
  label: Object.fromEntries(FIELDS.map(f => [f.key, f.label])) as Record<Key, string>,
  help: Object.fromEntries(FIELDS.map(f => [f.key, 'help' in f ? f.help : ''])) as Record<Key, string>,
  optional: ' optional', check: 'Check', checking: 'Checking',
  badIssn: 'Enter an ISSN like 1234-5678.', required: 'Required.',
  badUrl: 'Enter a full address starting with https://', badEmail: 'Enter a valid email address.',
  found: (via: string, name: string) => <>Indexed via {via} as &ldquo;{name}&rdquo;</>,
  missing: 'Not found in Crossref or OpenAlex. Register DOIs with Crossref first; journals must be indexed before certification.',
  prepare: 'Prepare application', openMail: 'Open in your email',
  ready: 'Your mail app opens with the application addressed to {to}. Review it and press send.',
  notSent: 'Nothing is sent until you press send in your own email app.',
}
const WORDS: Record<Locale, typeof en> = {
  en,
  'zh-Hans': {
    label: {
      title: '期刊名称', issn: 'ISSN（印刷版或电子版）', publisher: '出版商', website: '期刊网站', contact: '联系邮箱',
      prefix: 'Crossref DOI 前缀', board: '编委会页面', review: '同行评审政策页面', fees: 'APC 或收费信息页面',
      license: '开放获取或许可政策页面', ethics: '出版伦理与更正政策页面',
    },
    help: {
      title: '', issn: '用于在申请前确认期刊已被收录。', publisher: '', website: '', contact: '评审报告将发送至此邮箱。',
      prefix: '例如 10.12345。', board: '', review: '', fees: '', license: '', ethics: '',
    },
    optional: '（选填）', check: '核查', checking: '核查中',
    badIssn: '请输入格式如 1234-5678 的 ISSN。', required: '必填项。',
    badUrl: '请输入以 https:// 开头的完整网址', badEmail: '请输入有效的电子邮箱地址。',
    found: (via: string, name: string) => <>已通过 {via} 收录，名称为“{name}”</>,
    missing: '在 Crossref 与 OpenAlex 中均未找到。请先在 Crossref 注册 DOI；期刊须先被收录，方可申请认证。',
    prepare: '生成申请', openMail: '在邮件应用中打开',
    ready: '您的邮件应用将打开一封发往 {to} 的申请邮件（英文）。请核对内容后发送。',
    notSent: '在您于自己的邮件应用中点击发送之前，不会发送任何内容。',
  },
}
type Check = { state: 'idle' } | { state: 'checking' } | { state: 'found'; name: string; via: string } | { state: 'missing' }

export function CertificationApply() {
  const w = WORDS[useLocale()]
  const [v, setV] = useState<Record<Key, string>>(() => Object.fromEntries(FIELDS.map(f => [f.key, ''])) as Record<Key, string>)
  const [errors, setErrors] = useState<Partial<Record<Key, string>>>({})
  const [check, setCheck] = useState<Check>({ state: 'idle' })
  const [ready, setReady] = useState<string | null>(null)

  async function checkIssn() {
    const issn = v.issn.trim().toUpperCase()
    if (!/^\d{4}-?\d{3}[\dX]$/.test(issn)) { setErrors(e => ({ ...e, issn: w.badIssn })); return }
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
      if (f.required && !val) errs[f.key] = w.required
      else if (val && f.type === 'url' && !/^https?:\/\/\S+\.\S+/.test(val)) errs[f.key] = w.badUrl
      else if (val && f.type === 'email' && !/^\S+@\S+\.\S+$/.test(val)) errs[f.key] = w.badEmail
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
              {w.label[f.key]}{!f.required && <span className="font-normal" style={{ color: 'var(--muted)' }}>{w.optional}</span>}
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
              {f.key === 'issn' && <button type="button" className="btn shrink-0" onClick={checkIssn} disabled={check.state === 'checking'}>{check.state === 'checking' ? w.checking : w.check}</button>}
            </div>
            <p id={`ap-${f.key}-help`} className="text-[12.5px]" style={{ color: errors[f.key] ? 'var(--rejected)' : 'var(--muted)' }}>
              {errors[f.key] ?? w.help[f.key]}
            </p>
            {f.key === 'issn' && check.state === 'found' && (
              <p className="text-[13px] inline-flex items-center gap-1.5" style={{ color: 'var(--verified)' }}>
                <CheckCircle className="h-4 w-4" /> {w.found(check.via, check.name)}
              </p>
            )}
            {f.key === 'issn' && check.state === 'missing' && (
              <p className="text-[13px] inline-flex items-start gap-1.5" style={{ color: 'var(--check)' }}>
                <WarningCircle className="h-4 w-4 shrink-0 mt-0.5" /> {w.missing}
              </p>
            )}
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="submit" className="btn btn-primary">{w.prepare}</button>
        {ready && (
          <a href={ready} className="btn"><EnvelopeSimple className="h-4 w-4" /> {w.openMail}</a>
        )}
        <span className="text-[12.5px]" style={{ color: 'var(--muted)' }}>
          {ready ? fill(w.ready, { to: TO }) : w.notSent}
        </span>
      </div>
    </form>
  )
}
