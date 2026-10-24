'use client'

// Issues the zone certificate for one journal, from its profile record.
// ?issn=<any ISSN of the journal>.

import Link from 'next/link'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DownloadSimple } from '@phosphor-icons/react/dist/ssr'
import { getJournalProfile, journalHref, type JournalProfile } from '@/lib/journal-profile'
import { buildZoneCertificate, type ZoneCertificateData } from '@/lib/zone-certificate'
import { todayIso } from '@/lib/certificate'
import { downloadCertificatePdf } from '@/lib/certificate-download'
import { ZoneCertificateDocument } from './ZoneCertificateDocument'
import { Note } from './db'
import type { Locale } from '@/i18n/config'
import { useLocale } from '@/i18n/LocaleProvider'
import { localizedHref } from '@/i18n/alternates'
import { fill } from '@/i18n/format'

// The tool's words. The certificate itself (ZoneCertificateDocument) stays in English in every language.
const en = {
  issn: 'Journal ISSN', issnHelpA: 'Any of the journal\'s ISSNs. Or open the journal\'s profile and select ', issnHelpB: 'Zone certificate', issnHelpC: '.',
  issue: 'Issue certificate', loading: 'Loading', error: 'The journal could not be loaded. Check your connection and reload the page.',
  noMatch: 'No indexed journal matches “{key}”.',
  noZone: ' has no official POSI Zone in the current Citation Ranking edition, so no zone certificate can be issued. Zones come from the journal\'s PNCI percentile within its PSC category; an official zone needs an official ranking in a category of at least 50 ranked journals. ',
  status: 'See the journal\'s ranking status', statusEnd: '.',
  note: '', verify: 'Verify', preparing: 'Preparing PDF…', download: 'Download PDF',
  pdfError: 'The PDF could not be created in this browser. Try again, or use another browser.',
}
const WORDS: Record<Locale, typeof en> = {
  en,
  'zh-Hans': {
    issn: '期刊 ISSN', issnHelpA: '可输入该期刊的任一 ISSN；也可打开期刊页面，选择', issnHelpB: '“POSI Zone 证书”', issnHelpC: '。',
    issue: '出具证书', loading: '加载中', error: '期刊信息加载失败，请检查网络连接后刷新页面。',
    noMatch: '没有与“{key}”匹配的收录期刊。',
    noZone: ' 在当前引文排名版本中没有正式的 POSI Zone，因此无法出具 Zone 证书。Zone 依据期刊在其 PSC 类别内的 PNCI 百分位划定；正式 Zone 要求期刊获得正式排名，且所在类别至少有 50 种参与排名的期刊。',
    status: '查看该期刊的排名状态', statusEnd: '。',
    note: '证书统一使用英文，以确保在任何场合出示时内容一致；扫码打开的验证页面可切换为中文。',
    verify: '验证', preparing: '正在生成 PDF…', download: '下载 PDF',
    pdfError: '当前浏览器无法生成 PDF，请重试或换用其他浏览器。',
  },
}

type State = { key: string; profile: JournalProfile | null; cert: ZoneCertificateData | null; error?: boolean }

function IssnForm({ t }: { t: typeof en }) {
  const router = useRouter()
  const locale = useLocale()
  const [v, setV] = useState('')
  function go(e: FormEvent) {
    e.preventDefault()
    if (v.trim()) router.push(localizedHref(locale, `/certificate/zone/?issn=${encodeURIComponent(v.trim())}`))
  }
  return (
    <form onSubmit={go} className="panel p-5 flex flex-col gap-2 max-w-[520px]">
      <label htmlFor="zissn" className="text-[13.5px] font-medium">{t.issn}</label>
      <input id="zissn" className="input font-mono text-[13px]" value={v} onChange={e => setV(e.target.value)} placeholder="1234-5678" />
      <p className="text-[12.5px]" style={{ color: 'var(--muted)' }}>
        {t.issnHelpA}<em>{t.issnHelpB}</em>{t.issnHelpC}
      </p>
      <div><button type="submit" className="btn btn-primary mt-1">{t.issue}</button></div>
    </form>
  )
}

export function ZoneCertificateTool() {
  const locale = useLocale()
  const t = WORDS[locale]
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

  if (!key) return <IssnForm t={t} />
  const current = state?.key === key ? state : null
  if (!current) return <div className="h-[480px] max-w-[794px] rounded-[2px] animate-pulse" style={{ background: 'var(--surface-2)' }} aria-busy="true" aria-label={t.loading} />
  if (current.error) return <Note tone="warn">{t.error}</Note>
  if (!current.profile) return <><Note tone="warn">{fill(t.noMatch, { key })}</Note><div className="mt-5"><IssnForm t={t} /></div></>

  const { profile: j, cert } = current
  if (!cert) {
    return (
      <Note tone="warn">
        <strong>{j.t}</strong>{t.noZone}<Link href={localizedHref(locale, journalHref(j.k))} className="link">{t.status}</Link>{t.statusEnd}
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
          <Link href={localizedHref(locale, journalHref(j.k))} className="hover:underline">{j.t}</Link>
        </h2>
        <div className="flex gap-2">
          <a href={cert.verifyUrl} target="_blank" rel="noopener noreferrer" className="btn">{t.verify}</a>
          <button type="button" className="btn btn-primary" onClick={downloadPdf} disabled={pdfState === 'working'} aria-busy={pdfState === 'working'}>
            <DownloadSimple className="h-4 w-4" /> {pdfState === 'working' ? t.preparing : t.download}
          </button>
        </div>
      </div>
      {pdfState === 'error' && (
        <p className="no-print mb-3 text-[13.5px]" style={{ color: 'var(--check)' }}>{t.pdfError}</p>
      )}
      {t.note && <p className="no-print mb-3 text-[13px]" style={{ color: 'var(--muted)' }}>{t.note}</p>}
      <div ref={sheet} lang="en" className="overflow-x-auto"><ZoneCertificateDocument data={cert} /></div>
    </section>
  )
}
