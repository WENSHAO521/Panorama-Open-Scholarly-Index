'use client'

// The printable certificate. It is a paper document, so it always renders
// on a white sheet with fixed ink colours, whatever the site theme.

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import type { CertItem } from '@/lib/certificate'

export interface CertificateData {
  code: string
  issued: string
  snapshot: string
  requester: string
  affiliation: string
  purpose: string
  items: CertItem[]
  excluded: number
  verifyUrl: string
}

const INK = '#15191c'
const MUTED = '#5a6368'
const RULE = '#cfd5d6'
const TEAL = '#0b5e66'

function Mark() {
  return (
    <svg width="34" height="34" viewBox="20 20 54 54" aria-hidden="true">
      <rect x="20" y="20" width="24" height="24" fill={INK} />
      <rect x="50" y="20" width="24" height="24" fill="#e30613" />
      <rect x="20" y="50" width="24" height="24" fill={INK} />
      <rect x="50" y="50" width="24" height="8" fill={INK} />
    </svg>
  )
}

function Bi({ zh, en }: { zh: string; en: string }) {
  return <>{zh}<span style={{ color: MUTED, fontWeight: 400 }}> / {en}</span></>
}

export function CertificateDocument({ data }: { data: CertificateData }) {
  const [qr, setQr] = useState<string | null>(null)
  useEffect(() => {
    QRCode.toDataURL(data.verifyUrl, { margin: 0, width: 220, errorCorrectionLevel: 'M', color: { dark: INK, light: '#ffffff' } })
      .then(setQr).catch(() => setQr(null))
  }, [data.verifyUrl])

  const cell: React.CSSProperties = { padding: '7px 8px', borderBottom: `1px solid ${RULE}`, verticalAlign: 'top', textAlign: 'left' }
  const head: React.CSSProperties = { ...cell, fontWeight: 600, fontSize: 10.5, color: MUTED, background: '#f3f5f5' }

  return (
    <article
      className="cert"
      aria-label="Indexing certificate"
      style={{
        background: '#ffffff', color: INK, width: '100%', maxWidth: 794, margin: '0 auto',
        padding: '44px 48px', borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,.12), 0 8px 24px rgba(0,0,0,.08)',
        fontFamily: 'var(--font-ibm), "IBM Plex Sans", "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif',
        fontSize: 12, lineHeight: 1.55,
      }}
    >
      <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, borderBottom: `2px solid ${INK}`, paddingBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Mark />
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Panorama Open Scholarly Index</div>
            <div style={{ color: MUTED, fontSize: 11 }}>POSI · posi.panorama-sg.com</div>
          </div>
        </div>
        <dl style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '2px 12px', fontSize: 11, margin: 0 }}>
          <dt style={{ color: MUTED }}>证明编号 No.</dt><dd style={{ margin: 0, fontFamily: 'var(--font-mono), monospace', fontWeight: 600 }}>{data.code}</dd>
          <dt style={{ color: MUTED }}>签发日期 Issued</dt><dd style={{ margin: 0, fontFamily: 'var(--font-mono), monospace' }}>{data.issued}</dd>
          <dt style={{ color: MUTED }}>数据快照 Snapshot</dt><dd style={{ margin: 0, fontFamily: 'var(--font-mono), monospace' }}>{data.snapshot}</dd>
        </dl>
      </header>

      <h1 style={{ textAlign: 'center', margin: '26px 0 4px', fontSize: 22, fontWeight: 700, letterSpacing: '0.04em' }}>论文收录检索证明</h1>
      <p style={{ textAlign: 'center', margin: 0, fontSize: 13, color: MUTED, letterSpacing: '0.06em' }}>CERTIFICATE OF INDEXING</p>

      <dl style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '4px 12px', margin: '26px 0 0', fontSize: 12 }}>
        <dt style={{ color: MUTED }}>委托人 Requester</dt><dd style={{ margin: 0, fontWeight: 600 }}>{data.requester || '(not stated)'}</dd>
        {data.affiliation && <><dt style={{ color: MUTED }}>单位 Affiliation</dt><dd style={{ margin: 0 }}>{data.affiliation}</dd></>}
        {data.purpose && <><dt style={{ color: MUTED }}>用途 Purpose</dt><dd style={{ margin: 0 }}>{data.purpose}</dd></>}
        <dt style={{ color: MUTED }}>检索范围 Scope</dt><dd style={{ margin: 0 }}>POSI Core Collection</dd>
      </dl>

      <p style={{ margin: '20px 0 0' }}>
        经检索，下列 {data.items.length} 篇文献发表于 POSI 核心合集（POSI Core Collection）收录期刊，其 DOI 已在 Crossref 注册于该期刊 ISSN 之下。特此证明。
      </p>
      <p style={{ margin: '6px 0 0', color: MUTED }}>
        This is to certify that the {data.items.length} publication{data.items.length === 1 ? '' : 's'} listed below
        {data.items.length === 1 ? ' was' : ' were'} published in {data.items.length === 1 ? 'a journal' : 'journals'} indexed in the POSI Core Collection, with DOIs
        registered in Crossref under the journal ISSN.
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 18, fontSize: 11 }}>
        <thead>
          <tr>
            <th style={{ ...head, width: 22 }}>#</th>
            <th style={head}><Bi zh="文献" en="Publication" /></th>
            <th style={{ ...head, width: 150 }}><Bi zh="收录号" en="Accession" /></th>
            <th style={{ ...head, width: 54, textAlign: 'right' }}><Bi zh="被引" en="Cited" /></th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((it, i) => {
            const w = it.work!
            const loc = [w.volume && `${w.volume}`, w.issue && `(${w.issue})`].filter(Boolean).join('')
            return (
              <tr key={it.doi}>
                <td style={{ ...cell, color: MUTED }}>{i + 1}</td>
                <td style={cell}>
                  <div style={{ fontWeight: 600 }}>{w.title}</div>
                  <div style={{ color: MUTED }}>{w.authors.slice(0, 12).join(', ')}{w.authors.length > 12 ? ', et al.' : ''}</div>
                  <div>
                    <em>{w.container}</em>{loc ? `, ${loc}` : ''}{w.page ? `, ${w.page}` : ''}{w.year ? ` (${w.year})` : ''}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10.5, color: TEAL }}>doi.org/{w.doi}</div>
                  <div style={{ fontSize: 10.5, color: MUTED }}>{it.journal?.id} · ISSN {w.issn.join(', ')}</div>
                </td>
                <td style={{ ...cell, fontFamily: 'var(--font-mono), monospace', fontSize: 10.5 }}>{it.accession}</td>
                <td style={{ ...cell, textAlign: 'right', fontFamily: 'var(--font-mono), monospace' }}>{w.citations}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p style={{ margin: '6px 0 0', fontSize: 10, color: MUTED }}>
        被引次数取自 Crossref（is-referenced-by-count），检索日为签发日期。Citation counts from Crossref on the issue date.
        {data.excluded > 0 && ` ${data.excluded} submitted DOI${data.excluded === 1 ? ' was' : 's were'} not indexed and ${data.excluded === 1 ? 'is' : 'are'} not listed.`}
      </p>

      <footer style={{ marginTop: 28, paddingTop: 16, borderTop: `1px solid ${RULE}`, display: 'grid', gridTemplateColumns: '1fr 110px', gap: 20, alignItems: 'end' }}>
        <div style={{ fontSize: 10.5, color: MUTED }}>
          <p style={{ margin: 0, color: INK, fontWeight: 600 }}>核验 Verification</p>
          <p style={{ margin: '4px 0 0' }}>
            扫描二维码或访问以下地址核验本证明。核验时将重新查询 Crossref 与 POSI 当前索引，逐项确认收录事实。
            Scan the code or open the address below. Verification re-checks every item against Crossref and the live POSI index.
          </p>
          <p style={{ margin: '4px 0 0', fontFamily: 'var(--font-mono), monospace', color: TEAL, wordBreak: 'break-all' }}>{data.verifyUrl}</p>
          <p style={{ margin: '8px 0 0' }}>
            本证明仅说明收录状态，不构成对论文或期刊质量的评价，POSI 指标不得用于个人科研评价。
            This certificate states indexing status only. It is not a quality assessment, and POSI indicators must not be used to evaluate individual researchers.
            Issued automatically by POSI from open data.
          </p>
        </div>
        <div style={{ textAlign: 'center' }}>
          {qr
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={qr} alt="Verification QR code" width={110} height={110} style={{ display: 'block' }} />
            : <div style={{ width: 110, height: 110, background: '#eef1f1' }} />}
          <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 9.5, marginTop: 4 }}>{data.code}</div>
        </div>
      </footer>
    </article>
  )
}
