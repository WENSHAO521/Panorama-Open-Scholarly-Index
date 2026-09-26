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
const MONO = 'var(--font-mono), ui-monospace, monospace'

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

export function CertificateDocument({ data }: { data: CertificateData }) {
  const [qr, setQr] = useState<string | null>(null)
  useEffect(() => {
    QRCode.toDataURL(data.verifyUrl, { margin: 0, width: 220, errorCorrectionLevel: 'M', color: { dark: INK, light: '#ffffff' } })
      .then(setQr).catch(() => setQr(null))
  }, [data.verifyUrl])

  const n = data.items.length
  const cell: React.CSSProperties = { padding: '7px 8px', borderBottom: `1px solid ${RULE}`, verticalAlign: 'top', textAlign: 'left' }
  const head: React.CSSProperties = { ...cell, fontWeight: 600, fontSize: 10.5, color: MUTED, background: '#f3f5f5' }
  const coreCount = data.items.filter(i => i.tier === 'core').length

  return (
    <article
      className="cert"
      aria-label="Certificate of indexing"
      style={{
        background: '#ffffff', color: INK, width: '100%', maxWidth: 794, margin: '0 auto',
        padding: '44px 48px', borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,.12), 0 8px 24px rgba(0,0,0,.08)',
        fontFamily: 'var(--font-ibm), "IBM Plex Sans", Arial, sans-serif', fontSize: 12, lineHeight: 1.55,
      }}
    >
      <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, borderBottom: `2px solid ${INK}`, paddingBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Mark />
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Panorama Open Scholarly Index</div>
            <div style={{ color: MUTED, fontSize: 11 }}>Panorama Scholarly Group Ltd, posi.panorama-sg.com</div>
          </div>
        </div>
        <dl style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '2px 12px', fontSize: 11, margin: 0 }}>
          <dt style={{ color: MUTED }}>Certificate No.</dt><dd style={{ margin: 0, fontFamily: MONO, fontWeight: 600 }}>{data.code}</dd>
          <dt style={{ color: MUTED }}>Date of issue</dt><dd style={{ margin: 0, fontFamily: MONO }}>{data.issued}</dd>
          <dt style={{ color: MUTED }}>Data snapshot</dt><dd style={{ margin: 0, fontFamily: MONO }}>{data.snapshot}</dd>
        </dl>
      </header>

      <h1 style={{ textAlign: 'center', margin: '28px 0 0', fontSize: 22, fontWeight: 700, letterSpacing: '0.08em' }}>CERTIFICATE OF INDEXING</h1>

      <dl style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '4px 12px', margin: '26px 0 0', fontSize: 12 }}>
        <dt style={{ color: MUTED }}>Requested by</dt><dd style={{ margin: 0, fontWeight: 600 }}>{data.requester || 'Not stated'}</dd>
        {data.affiliation && <><dt style={{ color: MUTED }}>Affiliation</dt><dd style={{ margin: 0 }}>{data.affiliation}</dd></>}
        {data.purpose && <><dt style={{ color: MUTED }}>Purpose</dt><dd style={{ margin: 0 }}>{data.purpose}</dd></>}
        <dt style={{ color: MUTED }}>Database</dt><dd style={{ margin: 0 }}>Panorama Open Scholarly Index (POSI)</dd>
      </dl>

      <p style={{ margin: '20px 0 0' }}>
        This is to certify that the {n} publication{n === 1 ? '' : 's'} listed below {n === 1 ? 'is' : 'are'} indexed
        in the Panorama Open Scholarly Index as of the date of issue.
        {coreCount > 0 && ` ${coreCount === n ? (n === 1 ? 'It was' : 'All of them were') : coreCount === 1 ? '1 of them was' : `${coreCount} of them were`} published in ${coreCount === 1 ? 'a journal' : 'journals'} certified in the POSI Core Collection.`}
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 18, fontSize: 11 }}>
        <thead>
          <tr>
            <th style={{ ...head, width: 22 }}>#</th>
            <th style={head}>Publication</th>
            <th style={{ ...head, width: 128 }}>Accession No.</th>
            <th style={{ ...head, width: 70 }}>Journal status</th>
            <th style={{ ...head, width: 48, textAlign: 'right' }}>Citations</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((it, i) => {
            const w = it.work!
            const loc = [w.volume, w.issue && `(${w.issue})`].filter(Boolean).join('')
            return (
              <tr key={it.doi}>
                <td style={{ ...cell, color: MUTED }}>{i + 1}</td>
                <td style={cell}>
                  <div style={{ fontWeight: 600 }}>{w.title}</div>
                  <div style={{ color: MUTED }}>{w.authors.slice(0, 12).join(', ')}{w.authors.length > 12 ? ', et al.' : ''}</div>
                  <div><em>{w.container}</em>{loc ? `, ${loc}` : ''}{w.page ? `, ${w.page}` : ''}{w.year ? ` (${w.year})` : ''}</div>
                  <div style={{ fontFamily: MONO, fontSize: 10.5, color: TEAL }}>https://doi.org/{w.doi}</div>
                  <div style={{ fontSize: 10.5, color: MUTED }}>
                    ISSN {w.issn.join(', ')}{it.journal?.id ? `, ${it.journal.id}` : ''}, indexed via {it.via}
                  </div>
                </td>
                <td style={{ ...cell, fontFamily: MONO, fontSize: 10.5 }}>{it.accession}</td>
                <td style={cell}>{it.tier === 'core' ? <strong>Core Collection</strong> : 'Indexed'}</td>
                <td style={{ ...cell, textAlign: 'right', fontFamily: MONO }}>{w.citations}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p style={{ margin: '6px 0 0', fontSize: 10, color: MUTED }}>
        Citation counts are taken from the registry named for each item on the date of issue.
        {data.excluded > 0 && ` ${data.excluded} submitted DOI${data.excluded === 1 ? ' was' : 's were'} not indexed and ${data.excluded === 1 ? 'is' : 'are'} not listed.`}
      </p>

      <footer style={{ marginTop: 28, paddingTop: 16, borderTop: `1px solid ${RULE}`, display: 'grid', gridTemplateColumns: '1fr 110px', gap: 20, alignItems: 'end' }}>
        <div style={{ fontSize: 10.5, color: MUTED }}>
          <p style={{ margin: 0, color: INK, fontWeight: 600 }}>Verification</p>
          <p style={{ margin: '4px 0 0' }}>
            Scan the code or open the address below. Verification recomputes the certificate number and re-checks every
            listed publication against Crossref, OpenAlex and the live POSI index.
          </p>
          <p style={{ margin: '4px 0 0', fontFamily: MONO, color: TEAL, wordBreak: 'break-all' }}>{data.verifyUrl}</p>
          <p style={{ margin: '8px 0 0' }}>
            This certificate states indexing status only. It is not an assessment of the quality of any publication or
            journal. Issued by the Panorama Open Scholarly Index, Panorama Scholarly Group Ltd.
          </p>
        </div>
        <div style={{ textAlign: 'center' }}>
          {qr
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={qr} alt="Verification QR code" width={110} height={110} style={{ display: 'block' }} />
            : <div style={{ width: 110, height: 110, background: '#eef1f1' }} />}
          <div style={{ fontFamily: MONO, fontSize: 9.5, marginTop: 4 }}>{data.code}</div>
        </div>
      </footer>
    </article>
  )
}
