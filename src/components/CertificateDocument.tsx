'use client'

// The certificate of indexing. It is a paper document, so it always renders
// on a white A4 sheet with fixed ink colours, whatever the site theme.
// Type and seal match the Core Collection certificate: EB Garamond for the
// formal wording, IBM Plex Sans for data (fonts in src/assets/fonts).

import { useEffect, useState } from 'react'
import localFont from 'next/font/local'
import QRCode from 'qrcode'
import type { CertItem } from '@/lib/certificate'
import { Seal } from './Seal'

const garamond = localFont({
  src: [
    { path: '../assets/fonts/EBGaramond-Medium.ttf', weight: '500', style: 'normal' },
    { path: '../assets/fonts/EBGaramond-SemiBold.ttf', weight: '600', style: 'normal' },
    { path: '../assets/fonts/EBGaramond-MediumItalic.ttf', weight: '500', style: 'italic' },
  ],
  variable: '--font-cert-serif',
  display: 'swap',
})

// Script face for the signatory's signature (SIL OFL).
const signature = localFont({
  src: '../assets/fonts/Allura-Regular.ttf',
  variable: '--font-cert-signature',
  display: 'swap',
})

const SIGNATORY = 'Chengwen Song'

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
const MUTED = '#565f63'
const SOFT = '#8c979b'
const RULE = '#cfd5d6'
const TEAL = '#1c4f8f'
const SERIF = 'var(--font-cert-serif), "EB Garamond", Garamond, Georgia, serif'
const SANS = 'var(--font-ibm), "IBM Plex Sans", Arial, sans-serif'
const MONO = 'var(--font-mono), ui-monospace, monospace'

function Mark() {
  return (
    <svg width="30" height="30" viewBox="20 20 54 54" aria-hidden="true">
      <rect x="20" y="20" width="24" height="24" fill={INK} />
      <rect x="50" y="20" width="24" height="24" fill="#e30613" />
      <rect x="20" y="50" width="24" height="24" fill={INK} />
      <rect x="50" y="50" width="24" height="8" fill={INK} />
    </svg>
  )
}

function longDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

export function CertificateDocument({ data }: { data: CertificateData }) {
  const [qr, setQr] = useState<string | null>(null)
  useEffect(() => {
    QRCode.toDataURL(data.verifyUrl, { margin: 0, width: 220, errorCorrectionLevel: 'M', color: { dark: INK, light: '#ffffff' } })
      .then(setQr).catch(() => setQr(null))
  }, [data.verifyUrl])

  const n = data.items.length
  const cell: React.CSSProperties = { padding: '10px 8px', borderBottom: `1px solid ${RULE}`, verticalAlign: 'top', textAlign: 'left' }
  const head: React.CSSProperties = { ...cell, fontWeight: 600, fontSize: 9.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: SOFT, borderBottom: `1px solid ${INK}` }
  const coreCount = data.items.filter(i => i.tier === 'core').length

  return (
    <article
      className={`cert ${garamond.variable} ${signature.variable}`}
      aria-label="Certificate of indexing"
      style={{
        background: '#ffffff', color: INK, width: '100%', maxWidth: 794, margin: '0 auto', position: 'relative',
        display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
        // Always at least one A4 page, so the frame fills the sheet on screen and in the PDF.
        aspectRatio: '210 / 297',
        padding: '26px', borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,.12), 0 8px 24px rgba(0,0,0,.08)',
        fontFamily: SANS, fontSize: 12.5, lineHeight: 1.55,
      }}
    >
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '34px 44px 38px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, borderBottom: `1px solid ${RULE}`, paddingBottom: 20 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Mark />
              <div>
                <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 21, lineHeight: 1.2 }}>Panorama Open Scholarly Index</div>
                <div style={{ color: MUTED, fontSize: 11.5 }}>Panorama Scholarly Group Ltd.</div>
              </div>
            </div>
            <dl style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '3px 12px', fontSize: 11.5, margin: 0, textAlign: 'right' }}>
              <dt style={{ color: MUTED }}>Certificate No.</dt><dd style={{ margin: 0, fontFamily: MONO, fontWeight: 600 }}>{data.code}</dd>
              <dt style={{ color: MUTED }}>Date of issue</dt><dd style={{ margin: 0, fontWeight: 600 }}>{longDate(data.issued)}</dd>
            </dl>
          </header>

          <div style={{ textAlign: 'center', marginTop: 60 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.32em', color: TEAL }}>POSI INDEXING</div>
            <h1 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 64, lineHeight: 1.05, margin: '12px 0 0', letterSpacing: '0.01em' }}>Certificate</h1>
            <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 21, color: MUTED, marginTop: 4 }}>of Indexing</div>
          </div>

          <dl style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '5px 14px', margin: '52px 0 0', fontSize: 13 }}>
            <dt style={{ color: MUTED }}>Issued to</dt><dd style={{ margin: 0, fontWeight: 600 }}>{data.requester || 'Not stated'}</dd>
            {data.affiliation && <><dt style={{ color: MUTED }}>Affiliation</dt><dd style={{ margin: 0 }}>{data.affiliation}</dd></>}
            {data.purpose && <><dt style={{ color: MUTED }}>Purpose</dt><dd style={{ margin: 0 }}>{data.purpose}</dd></>}
          </dl>

          <p style={{ fontFamily: SERIF, fontSize: 18, lineHeight: 1.5, margin: '22px 0 0' }}>
            This is to certify that the {n === 1 ? 'publication' : `${n} publications`} listed below {n === 1 ? 'is' : 'are'} indexed
            in the Panorama Open Scholarly Index as of the date of issue.
            {coreCount > 0 && ` ${coreCount === n ? (n === 1 ? 'It was' : 'All of them were') : coreCount === 1 ? 'One of them was' : `${coreCount} of them were`} published in ${coreCount === 1 ? 'a journal' : 'journals'} certified in the POSI Core Collection.`}
          </p>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 28, fontSize: 11.5 }}>
            <thead>
              <tr>
                <th style={{ ...head, width: 20 }}>#</th>
                <th style={head}>Publication</th>
                <th style={{ ...head, width: 140 }}>Accession No.</th>
                <th style={{ ...head, width: 78 }}>Journal</th>
                <th style={{ ...head, width: 52, textAlign: 'right' }}>Citations</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((it, i) => {
                const w = it.work!
                const loc = [w.volume, w.issue && `(${w.issue})`].filter(Boolean).join('')
                return (
                  <tr key={it.doi}>
                    <td style={{ ...cell, color: SOFT }}>{i + 1}</td>
                    <td style={cell}>
                      <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 15, lineHeight: 1.3 }}>{w.title}</div>
                      <div style={{ color: MUTED, marginTop: 2 }}>{w.authors.slice(0, 12).join(', ')}{w.authors.length > 12 ? ', et al.' : ''}</div>
                      <div><em>{w.container}</em>{loc ? `, ${loc}` : ''}{w.page ? `, ${w.page}` : ''}{w.year ? ` (${w.year})` : ''}</div>
                      <div style={{ fontFamily: MONO, fontSize: 10.5, color: TEAL }}>https://doi.org/{w.doi}</div>
                      <div style={{ fontSize: 10.5, color: SOFT }}>ISSN {w.issn.join(', ')}{it.journal?.id ? ` · ${it.journal.id}` : ''} · indexed via {it.via}</div>
                    </td>
                    <td style={{ ...cell, fontFamily: MONO, fontSize: 10.5 }}>{it.accession}</td>
                    <td style={cell}>{it.tier === 'core' ? <strong style={{ color: TEAL }}>Core Collection</strong> : 'Indexed'}</td>
                    <td style={{ ...cell, textAlign: 'right', fontFamily: MONO }}>{w.citations}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p style={{ margin: '8px 0 0', fontSize: 10.5, color: MUTED }}>
            Citation counts are those reported by the named registry on the date of issue.
            {data.excluded > 0 && ` ${data.excluded} submitted DOI${data.excluded === 1 ? ' was' : 's were'} not indexed and ${data.excluded === 1 ? 'is' : 'are'} not listed.`}
          </p>

          <footer style={{ marginTop: 'auto', paddingTop: 44, display: 'grid', gridTemplateColumns: '108px 1fr 270px', gap: 20, alignItems: 'end' }}>
            {qr
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={qr} alt="Verification QR code" width={108} height={108} style={{ display: 'block' }} />
              : <div style={{ width: 108, height: 108, background: '#eef1f1' }} />}
            <div style={{ fontSize: 10.5, color: MUTED }}>
              <p style={{ margin: 0, color: INK, fontWeight: 600, fontSize: 12.5 }}>Verify this certificate</p>
              <p style={{ margin: '2px 0 0', fontFamily: MONO, color: TEAL, wordBreak: 'break-all', fontSize: 10 }}>{data.verifyUrl}</p>
              <p style={{ margin: '4px 0 0' }}>
                Verification recomputes the certificate number and checks every listed publication again against
                Crossref, OpenAlex and the POSI index. This certificate states indexing status only.
              </p>
            </div>
            <div style={{ position: 'relative', height: 176 }}>
              <div style={{ position: 'absolute', right: -30, bottom: 30 }}>
                <Seal size={116} sub="VERIFIED" />
              </div>
              <div style={{ position: 'absolute', left: 0, bottom: 112, fontFamily: SERIF, fontStyle: 'italic', fontSize: 12.5, color: MUTED }}>
                For and on behalf of
              </div>
              <div
                aria-label={`Signed: ${SIGNATORY}`}
                style={{ position: 'absolute', left: 2, bottom: 64, fontFamily: 'var(--font-cert-signature), "Allura", cursive', fontSize: 40, lineHeight: 1, color: '#1b2a4e', whiteSpace: 'nowrap' }}
              >
                {SIGNATORY}
              </div>
              <div style={{ position: 'absolute', left: 0, right: 40, bottom: 60, borderTop: `1px solid ${INK}` }} />
              <div style={{ position: 'absolute', left: 0, bottom: 0, lineHeight: 1.35 }}>
                <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 15 }}>{SIGNATORY}</div>
                <div style={{ fontSize: 10.5, color: INK }}>Authorized Signatory</div>
                <div style={{ fontSize: 10.5, color: MUTED }}>Editorial Office, Panorama Open Scholarly Index</div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </article>
  )
}
