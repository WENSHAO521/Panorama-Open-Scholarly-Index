'use client'

import { useRef, useState, type FormEvent } from 'react'
import { CheckCircle, XCircle, DownloadSimple } from '@phosphor-icons/react/dist/ssr'
import {
  MAX_DOIS, SNAPSHOT, STATUS_TEXT, checkAll, certificateCode, parseDoiList, scholarUrl, todayIso, verifyPath, type CertItem,
} from '@/lib/certificate'
import { CertificateDocument, type CertificateData } from './CertificateDocument'
import { downloadCertificatePdf } from '@/lib/certificate-download'
import { Note } from './db'
import type { Locale } from '@/i18n/config'
import { useLocale } from '@/i18n/LocaleProvider'
import { fill } from '@/i18n/format'

// The tool's words. The certificate itself (CertificateDocument) and its verification page stay in English in every
// language, so a certificate reads the same wherever it is shown.
const en = {
  noDoi: 'Enter at least one DOI.', tooMany: 'One certificate covers at most {max} DOIs. You entered {n}.',
  requester: 'Requester name', requesterHelp: 'Printed on the certificate. Not included in the verification link.',
  affiliation: 'Affiliation', optional: 'optional', optionalHelp: 'Optional.', purpose: 'Purpose',
  dois: 'DOIs', doisHint: 'one per line, up to {max}', doisHelp: 'DOI URLs are accepted. Duplicates are removed.',
  checking: 'Checking', submit: 'Check and issue',
  submitNote: 'Each DOI is checked against Crossref, DataCite, Zenodo, OpenAlex and the POSI index. Google Scholar has no API; each result links to a Google Scholar search to check by hand.',
  results: 'Check results', indexedOf: '{n} of {total} indexed',
  cols: { doi: 'DOI', publication: 'Publication', result: 'Result' }, noMetadata: 'No metadata',
  status: null as Record<string, string> | null,
  journalStatus: 'Journal status: {tier} · via {via}', core: 'Core Collection', indexed: 'Indexed',
  none: 'None of these DOIs is an indexed journal publication, so no certificate can be issued. POSI indexes journal publications registered with Crossref or DataCite, or recorded in OpenAlex.',
  certificate: 'Certificate', certificateNote: '', verify: 'Verify', preparing: 'Preparing PDF…', download: 'Download PDF',
  pdfError: 'The PDF could not be created in this browser. Try again, or use another browser.',
}
const WORDS: Record<Locale, typeof en> = {
  en,
  'zh-Hans': {
    noDoi: '请至少输入一个 DOI。', tooMany: '每份证书最多包含 {max} 个 DOI，您输入了 {n} 个。',
    requester: '申请人姓名', requesterHelp: '将印在证书上，不包含在验证链接中。',
    affiliation: '所属机构', optional: '选填', optionalHelp: '选填。', purpose: '用途',
    dois: 'DOI', doisHint: '每行一个，最多 {max} 个', doisHelp: '可输入 DOI 链接，重复项会自动去除。',
    checking: '正在核查', submit: '核查并出具证书',
    submitNote: '每个 DOI 均会在 Crossref、DataCite、Zenodo、OpenAlex 与 POSI 索引中核查。Google Scholar 未提供 API，每条结果均附有 Google Scholar 检索链接，供人工核对。',
    results: '核查结果', indexedOf: '{total} 篇中 {n} 篇已收录',
    cols: { doi: 'DOI', publication: '文献', result: '结果' }, noMetadata: '无元数据',
    status: {
      indexed: '已被 POSI 收录',
      not_journal: '非期刊文献（图书、数据集、预印本等）',
      no_issn: '期刊论文，但注册记录未注明期刊 ISSN',
      not_found: '在 Crossref、DataCite、Zenodo 与 OpenAlex 中均未找到该 DOI',
      invalid: '不是有效的 DOI',
      error: '注册机构未响应，请重试。',
    },
    journalStatus: '期刊状态：{tier} · 来源 {via}', core: '核心合集', indexed: '已收录',
    none: '以上 DOI 均不是已收录的期刊文献，因此无法出具证书。POSI 收录在 Crossref 或 DataCite 注册、或被 OpenAlex 记录的期刊文献。',
    certificate: '证书', certificateNote: '证书及其验证页面统一使用英文，以确保在任何场合出示和核验时内容一致。',
    verify: '验证', preparing: '正在生成 PDF…', download: '下载 PDF',
    pdfError: '当前浏览器无法生成 PDF，请重试或换用其他浏览器。',
  },
}

type Phase = 'form' | 'checking' | 'done'

export function CertificateTool() {
  const t = WORDS[useLocale()]
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
    if (!list.length) { setFormError(t.noDoi); return }
    if (list.length > MAX_DOIS) { setFormError(fill(t.tooMany, { max: MAX_DOIS, n: list.length })); return }
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
          <label htmlFor="req" className="text-[13.5px] font-medium">{t.requester}</label>
          <input id="req" className="input" value={requester} onChange={e => setRequester(e.target.value)} autoComplete="name" />
          <p className="text-[12.5px]" style={{ color: 'var(--muted)' }}>{t.requesterHelp}</p>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="aff" className="text-[13.5px] font-medium">{t.affiliation} <span style={{ color: 'var(--muted)', fontWeight: 400 }}>{t.optional}</span></label>
          <input id="aff" className="input" value={affiliation} onChange={e => setAffiliation(e.target.value)} autoComplete="organization" />
          <p className="text-[12.5px]" style={{ color: 'var(--muted)' }}>{t.optionalHelp}</p>
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <label htmlFor="pur" className="text-[13.5px] font-medium">{t.purpose} <span style={{ color: 'var(--muted)', fontWeight: 400 }}>{t.optional}</span></label>
          <input id="pur" className="input" value={purpose} onChange={e => setPurpose(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <label htmlFor="dois" className="text-[13.5px] font-medium">{t.dois} <span style={{ color: 'var(--muted)', fontWeight: 400 }}>{fill(t.doisHint, { max: MAX_DOIS })}</span></label>
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
          <p id="dois-help" className="text-[12.5px]" style={{ color: 'var(--muted)' }}>{t.doisHelp}</p>
          {formError && <p id="dois-error" className="text-[13px]" style={{ color: 'var(--rejected)' }}>{formError}</p>}
        </div>
        <div className="md:col-span-2 flex flex-wrap items-center gap-3">
          <button type="submit" className="btn btn-primary" disabled={phase === 'checking'}>
            {phase === 'checking' ? t.checking : t.submit}
          </button>
          <span className="text-[12.5px]" style={{ color: 'var(--muted)' }}>{t.submitNote}</span>
        </div>
      </form>

      {phase !== 'form' && (
        <section aria-labelledby="results" className="no-print">
          <h2 id="results" className="text-[17px] font-semibold tracking-tight mb-3">
            {t.results}
            <span className="ml-2 font-normal text-[14px]" style={{ color: 'var(--muted)' }}>
              {fill(t.indexedOf, { n: indexedCount, total: inputs.length })}
            </span>
          </h2>
          <div className="panel overflow-x-auto">
            <table className="dtable min-w-[680px]">
              <thead><tr><th>{t.cols.doi}</th><th>{t.cols.publication}</th><th>{t.cols.result}</th></tr></thead>
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
                          : it ? <span style={{ color: 'var(--soft)' }}>{t.noMetadata}</span>
                          : <span className="inline-block h-3.5 w-48 rounded-[2px] animate-pulse" style={{ background: 'var(--surface-3)' }} />}
                      </td>
                      <td className="text-[13px]">
                        <div className="flex items-start justify-between gap-3">
                          {st && (
                            <span className="inline-flex items-start gap-1.5" style={{ color: st.ok ? 'var(--verified)' : 'var(--check)' }}>
                              {st.ok ? <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" /> : <XCircle className="h-4 w-4 shrink-0 mt-0.5" />}
                              <span>{t.status?.[it!.status] ?? st.text}{it?.status === 'indexed' && <><br /><span style={{ color: 'var(--muted)' }}>{fill(t.journalStatus, { tier: it.tier === 'core' ? t.core : t.indexed, via: it.via ?? '' })}</span></>}</span>
                            </span>
                          )}
                          {it && it.status !== 'invalid' && <a href={scholarUrl(it)} target="_blank" rel="noopener noreferrer" className="link shrink-0 whitespace-nowrap text-[12.5px]">Google Scholar</a>}
                        </div>
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
                {t.none}
              </Note>
            </div>
          )}
        </section>
      )}

      {cert && (
        <section aria-labelledby="cert-heading">
          <div className="no-print flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 id="cert-heading" className="text-[17px] font-semibold tracking-tight">{t.certificate}</h2>
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
          {t.certificateNote && <p className="no-print mb-3 text-[13px]" style={{ color: 'var(--muted)' }}>{t.certificateNote}</p>}
          <div ref={sheet} lang="en"><CertificateDocument data={cert} /></div>
        </section>
      )}
    </div>
  )
}
