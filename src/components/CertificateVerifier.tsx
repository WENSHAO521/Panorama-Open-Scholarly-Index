'use client'

import Link from 'next/link'
import { useEffect, useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, XCircle, WarningCircle } from '@phosphor-icons/react/dist/ssr'
import { SNAPSHOT, STATUS_TEXT, checkAll, certificateCode, scholarUrl, type CertItem, type ItemStatus } from '@/lib/certificate'
import { useLocale } from '@/i18n/LocaleProvider'
import { localizedHref } from '@/i18n/alternates'
import type { Locale } from '@/i18n/config'

type Verdict = 'valid' | 'changed' | 'tampered'

// The certificate itself is English; the page that verifies it follows the visitor's language (decided 2026-10-24).
const en = {
  verdict: {
    valid: { title: 'Valid certificate', body: 'The certificate is unaltered and every listed publication is indexed in POSI today.' },
    changed: { title: 'Authentic, but status has changed', body: 'The certificate is unaltered, but at least one listed publication is no longer indexed. See the items below.' },
    tampered: { title: 'Not valid', body: 'The certificate number does not match its date, snapshot and publication list. The certificate has been altered or the link is incomplete.' },
  } as Record<Verdict, { title: string; body: string }>,
  status: Object.fromEntries(Object.entries(STATUS_TEXT).map(([k, v]) => [k, v.text])) as Record<ItemStatus, string>,
  badAddress: 'Paste the full verification address printed under the QR code.',
  address: 'Verification address',
  addressHelp: 'Printed at the bottom of every certificate. Scanning the QR code opens the same address.',
  verify: 'Verify',
  number: 'Certificate number', issued: 'Issued', snapshot: 'Data snapshot', missing: 'missing',
  recheckedA: '(re-checked against the current snapshot ', recheckedB: ')',
  integrity: 'Content integrity',
  integrityOk: 'Number matches date, snapshot and publication list', integrityBad: 'Number does not match the content', checking: 'Checking',
  publication: 'Publication', accession: 'Accession', statusToday: 'Status today',
  journalStatus: 'Journal status: ', core: 'Core Collection', indexed: 'Indexed', via: ' · via ',
  footer: 'Verification recomputes the certificate number from its contents and re-checks each publication against Crossref, DataCite, Zenodo, OpenAlex and the current POSI index. The requester\u2019s name is not part of the link and is not verified. ',
  how: 'How certificates work', end: '.',
}
const WORDS: Record<Locale, typeof en> = {
  en,
  'zh-Hans': {
    verdict: {
      valid: { title: '证书有效', body: '证书未经改动，所列文献今天均仍被 POSI 收录。' },
      changed: { title: '证书真实，但收录状态已变化', body: '证书未经改动，但至少有一篇所列文献已不再被收录，详见下方各项。' },
      tampered: { title: '证书无效', body: '证书编号与其出具日期、数据快照和文献列表不符。证书已被改动，或链接不完整。' },
    },
    status: {
      indexed: '已被 POSI 收录',
      not_journal: '非期刊文献（图书、数据集、预印本等）',
      no_issn: '为期刊文章，但登记记录中没有期刊 ISSN',
      not_found: '在 Crossref、DataCite、Zenodo 和 OpenAlex 中均未找到该 DOI',
      invalid: '不是有效的 DOI',
      error: '登记机构未响应，请稍后重试。',
    },
    badAddress: '请粘贴印在二维码下方的完整验证地址。',
    address: '验证地址',
    addressHelp: '印在每份证书底部。扫描二维码打开的是同一地址。',
    verify: '验证',
    number: '证书编号', issued: '出具日期', snapshot: '数据快照', missing: '缺失',
    recheckedA: '（已按当前快照 ', recheckedB: ' 重新核查）',
    integrity: '内容完整性',
    integrityOk: '编号与日期、快照和文献列表相符', integrityBad: '编号与内容不符', checking: '核查中',
    publication: '文献', accession: '收录号', statusToday: '今日状态',
    journalStatus: '期刊状态：', core: '核心合集', indexed: '已收录', via: ' · 来源 ',
    footer: '验证时会根据证书内容重新计算证书编号，并在 Crossref、DataCite、Zenodo、OpenAlex 与当前 POSI 索引中逐一重新核查每篇文献。申请人姓名不在链接中，因此不予验证。',
    how: '证书说明', end: '。',
  },
}

interface Result { key: string; codeOk: boolean; items: CertItem[] }

function Banner({ verdict, t }: { verdict: Verdict; t: typeof en }) {
  const m = {
    valid: { Icon: CheckCircle, color: 'var(--verified)', bg: 'var(--verified-soft)' },
    changed: { Icon: WarningCircle, color: 'var(--check)', bg: 'var(--check-soft)' },
    tampered: { Icon: XCircle, color: 'var(--rejected)', bg: 'var(--rejected-soft)' },
  }[verdict]
  const w = t.verdict[verdict]
  return (
    <div className="rounded-[2px] p-5 flex gap-4 items-start" style={{ background: m.bg, border: '1px solid var(--line)' }} role="status">
      <m.Icon className="h-7 w-7 shrink-0" style={{ color: m.color }} />
      <div>
        <p className="text-[18px] font-semibold" style={{ color: m.color }}>{w.title}</p>
        <p className="mt-1 text-[14px]" style={{ color: 'var(--ink-2)' }}>{w.body}</p>
      </div>
    </div>
  )
}

function ManualEntry({ locale }: { locale: Locale }) {
  const t = WORDS[locale]
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [err, setErr] = useState('')
  function go(e: FormEvent) {
    e.preventDefault()
    try {
      const u = new URL(url.trim())
      if (!u.searchParams.get('c')) throw new Error()
      router.push(`${localizedHref(locale, '/certificate/verify/')}?${u.searchParams}`)
    } catch { setErr(t.badAddress) }
  }
  return (
    <form onSubmit={go} className="panel p-5 flex flex-col gap-2 max-w-[720px]">
      <label htmlFor="vurl" className="text-[13.5px] font-medium">{t.address}</label>
      <input id="vurl" className="input font-mono text-[13px]" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://posi.panorama-sg.com/certificate/verify/?c=PC-..." aria-describedby="vurl-help" />
      <p id="vurl-help" className="text-[12.5px]" style={{ color: 'var(--muted)' }}>
        {t.addressHelp}
      </p>
      {err && <p className="text-[13px]" style={{ color: 'var(--rejected)' }}>{err}</p>}
      <div><button type="submit" className="btn btn-primary mt-1">{t.verify}</button></div>
    </form>
  )
}

export function CertificateVerifier() {
  const locale = useLocale()
  const t = WORDS[locale]
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

  if (!code) return <ManualEntry locale={locale} />

  const current = result?.key === key ? result : null
  const rows = current?.items ?? (partial?.key === key ? partial.items : dois.map(() => null))
  const verdict: Verdict | null = current
    ? !current.codeOk ? 'tampered' : current.items.every(i => i.status === 'indexed') ? 'valid' : 'changed'
    : null

  return (
    <div className="space-y-6 max-w-[960px]">
      {verdict ? <Banner verdict={verdict} t={t} /> : (
        <div className="rounded-[2px] p-5 animate-pulse" style={{ background: 'var(--surface-2)' }} aria-busy="true">
          <div className="h-5 w-56 rounded-[2px]" style={{ background: 'var(--surface-3)' }} />
          <div className="h-4 w-80 rounded-[2px] mt-2" style={{ background: 'var(--surface-3)' }} />
        </div>
      )}

      <dl className="panel p-5 grid gap-x-8 gap-y-2 sm:grid-cols-[auto_minmax(0,1fr)] text-[14px]">
        <dt style={{ color: 'var(--muted)' }}>{t.number}</dt>
        <dd className="font-mono font-medium">{code}</dd>
        <dt style={{ color: 'var(--muted)' }}>{t.issued}</dt>
        <dd className="font-mono">{issued || t.missing}</dd>
        <dt style={{ color: 'var(--muted)' }}>{t.snapshot}</dt>
        <dd className="font-mono">
          {snapshot || t.missing}
          {snapshot && snapshot !== SNAPSHOT && <span className="ml-2 font-sans text-[13px]" style={{ color: 'var(--muted)' }}>{t.recheckedA}{SNAPSHOT}{t.recheckedB}</span>}
        </dd>
        <dt style={{ color: 'var(--muted)' }}>{t.integrity}</dt>
        <dd>{current ? (current.codeOk ? t.integrityOk : t.integrityBad) : t.checking}</dd>
      </dl>

      <div className="panel overflow-x-auto">
        <table className="dtable min-w-[680px]">
          <thead><tr><th>{t.publication}</th><th>{t.accession}</th><th>{t.statusToday}</th></tr></thead>
          <tbody>
            {dois.map((d, i) => {
              const it = rows[i]
              const st = it ? { ok: STATUS_TEXT[it.status].ok, text: t.status[it.status] } : null
              return (
                <tr key={d}>
                  <td className="text-[13.5px]">
                    {it?.work ? <><span className="font-medium">{it.work.title}</span><br /><span style={{ color: 'var(--muted)' }}>{it.work.container}{it.work.year ? `, ${it.work.year}` : ''}</span><br /></> : null}
                    <span className="font-mono text-[12px]" style={{ color: 'var(--muted)' }}>{d}</span>
                  </td>
                  <td className="font-mono text-[12px]">{it?.accession ?? ''}</td>
                  <td className="text-[13px]">
                    <div className="flex items-start justify-between gap-3">
                      {st ? (
                        <span className="inline-flex items-start gap-1.5" style={{ color: st.ok ? 'var(--verified)' : 'var(--check)' }}>
                          {st.ok ? <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" /> : <XCircle className="h-4 w-4 shrink-0 mt-0.5" />}
                          <span>{st.text}{it?.status === 'indexed' && <><br /><span style={{ color: 'var(--muted)' }}>{t.journalStatus}{it.tier === 'core' ? t.core : t.indexed}{t.via}{it.via}</span></>}</span>
                        </span>
                      ) : <span className="inline-block h-3.5 w-40 rounded-[2px] animate-pulse" style={{ background: 'var(--surface-3)' }} />}
                      {it && it.status !== 'invalid' && <a href={scholarUrl(it)} target="_blank" rel="noopener noreferrer" className="link shrink-0 whitespace-nowrap text-[12.5px]">Google Scholar</a>}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-[13px] leading-relaxed max-w-[75ch]" style={{ color: 'var(--muted)' }}>
        {t.footer}<Link href={localizedHref(locale, '/docs/certificates/')} className="link">{t.how}</Link>{t.end}
      </p>
    </div>
  )
}
