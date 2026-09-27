'use client'

// The zone certificate (POSI 分区证书). A paper document like the certificate
// of indexing: a white A4 sheet with fixed ink colours whatever the site
// theme, the same type, header, signatory and seal.

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { ZONE_BOUNDS, ZONES_VERSION, type Zone } from '@/lib/zones'
import { ZONE_SHARE, type ZoneCertificateData, type ZonePlacement } from '@/lib/zone-certificate'
import {
  garamond, signature, Mark, Signature, longDate, verifyHost,
  INK, MUTED, SOFT, RULE, TEAL, SERIF, SANS, MONO,
} from './CertificateDocument'

const n = (v: number) => v.toLocaleString('en-GB')

function scopeText(p: ZonePlacement) {
  return p.scope === 'category' ? `in the subject category ${p.label}` : 'across all ranked journals'
}

/** The four zones side by side, the journal's own filled. */
function ZoneScale({ p, title }: { p: ZonePlacement; title: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 16, alignItems: 'center' }}>
      <div>
        <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: SOFT }}>{title}</div>
        <div style={{ fontSize: 12, marginTop: 2, lineHeight: 1.3 }}>{p.scope === 'category' ? p.label : 'All ranked journals'}</div>
        <div style={{ fontFamily: MONO, fontSize: 10.5, color: MUTED, marginTop: 2 }}>
          Rank {n(p.rank)} / {n(p.size)}{p.quartile ? ` · ${p.quartile}` : ''}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
        {ZONE_BOUNDS.map(([z]) => {
          const on = z === p.zone
          return (
            <div key={z} style={{
              border: `1px solid ${on ? TEAL : RULE}`, background: on ? TEAL : '#ffffff', color: on ? '#ffffff' : SOFT,
              padding: '7px 8px 6px', textAlign: 'center', lineHeight: 1.25,
            }}>
              <div style={{ fontWeight: 600, fontSize: 12.5, letterSpacing: '0.04em' }}>Zone {z}</div>
              <div style={{ fontSize: 9.5, opacity: on ? 0.9 : 1 }}>{ZONE_SHARE[z as Zone]}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function ZoneCertificateDocument({ data }: { data: ZoneCertificateData }) {
  const [qr, setQr] = useState<string | null>(null)
  useEffect(() => {
    QRCode.toDataURL(data.verifyUrl, { margin: 0, width: 220, errorCorrectionLevel: 'M', color: { dark: INK, light: '#ffffff' } })
      .then(setQr).catch(() => setQr(null))
  }, [data.verifyUrl])

  const { journal: j, primary: p, secondary: s } = data
  const titleSize = j.title.length > 110 ? 22 : j.title.length > 70 ? 25 : 29

  return (
    <article
      className={`cert ${garamond.variable} ${signature.variable}`}
      aria-label="Certificate of journal zone"
      style={{
        background: '#ffffff', color: INK, width: '100%', maxWidth: 794, margin: '0 auto', position: 'relative',
        display: 'flex', flexDirection: 'column', boxSizing: 'border-box', aspectRatio: '210 / 297',
        padding: '26px', borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,.12), 0 8px 24px rgba(0,0,0,.08)',
        fontFamily: SANS, fontSize: 12.5, lineHeight: 1.55,
      }}
    >
      <div style={{ padding: '30px 44px 30px', flex: 1, display: 'flex', flexDirection: 'column' }}>
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

        <div style={{ textAlign: 'center', marginTop: 36 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.32em', color: TEAL }}>POSI ZONES</div>
          <h1 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 58, lineHeight: 1.05, margin: '10px 0 0', letterSpacing: '0.01em' }}>Certificate</h1>
          <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 21, color: MUTED, marginTop: 4 }}>of Journal Zone</div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 26 }}>
          <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 15, color: MUTED }}>This is to certify that the journal</div>
          <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: titleSize, lineHeight: 1.2, margin: '8px auto 0', maxWidth: 600 }}>{j.title}</div>
          <div style={{ color: MUTED, marginTop: 6 }}>
            {j.publisher && <>{j.publisher} · </>}<span style={{ fontFamily: MONO, fontSize: 11.5 }}>ISSN {j.issns.join(', ')}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 26, alignItems: 'center', margin: '24px 0 0' }}>
          <div aria-label={`Zone ${p.zone}`} style={{ flexShrink: 0, width: 108, height: 108, border: `2px solid ${TEAL}`, color: TEAL, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.3em', marginLeft: '0.3em' }}>ZONE</div>
            <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 62, lineHeight: 0.95 }}>{p.zone}</div>
          </div>
          <p style={{ fontFamily: SERIF, fontSize: 17.5, lineHeight: 1.5, margin: 0 }}>
            is placed in <strong style={{ fontWeight: 600 }}>Zone {p.zone}</strong> ({ZONE_SHARE[p.zone]}) of the {data.year} POSI Journal
            Rankings {scopeText(p)}, ranked {n(p.rank)} of {n(p.size)} journals by the POSI Citation Score.
            {s && <> Across all ranked journals it is in <strong style={{ fontWeight: 600 }}>Zone {s.zone}</strong>, ranked {n(s.rank)} of {n(s.size)}.</>}
          </p>
        </div>

        <div style={{ marginTop: 22, paddingTop: 14, borderTop: `1px solid ${RULE}`, display: 'grid', gap: 12 }}>
          <ZoneScale p={p} title={p.scope === 'category' ? 'Subject category' : 'Overall'} />
          {s && <ZoneScale p={s} title="Overall" />}
        </div>

        <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(5, auto)', justifyContent: 'space-between', gap: 0, margin: '20px 0 0', borderTop: `1px solid ${RULE}`, borderBottom: `1px solid ${RULE}` }}>
          {([
            ['POSI ID', j.pid],
            ['PCS', `${data.pcs.toFixed(2)}${data.items != null ? ` · ${n(data.items)} items` : ''}`],
            ['Ranking edition', `PCS-Q ${data.year}`],
            ['Data snapshot', data.snapshot],
            ['Zone rule', ZONES_VERSION],
          ] as const).map(([k, v], i) => (
            <div key={k} style={{ padding: '9px 14px 9px 0', paddingLeft: i ? 14 : 0, borderLeft: i ? `1px solid ${RULE}` : undefined }}>
              <dt style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: SOFT }}>{k}</dt>
              <dd style={{ margin: '1px 0 0', fontFamily: MONO, fontSize: 10.5 }}>{v}</dd>
            </div>
          ))}
        </dl>

        <p style={{ margin: '10px 0 0', fontSize: 10.5, color: MUTED }}>
          Zones divide each ranking by rank position: Zone 1 is the top 5% of journals, Zone 2 the next 15%, Zone 3 the
          next 30% and Zone 4 the remaining half. They are computed from the published ranking edition; no journal is
          placed in a zone by hand.
          {data.trial && <> <strong style={{ color: INK, fontWeight: 600 }}>Trial.</strong> POSI Zones are published as a trial ahead of the December release of record, and the rule may be refined in a versioned change.</>}
        </p>

        <footer style={{ marginTop: 'auto', paddingTop: 22, display: 'grid', gridTemplateColumns: '108px 1fr 270px', gap: 20, alignItems: 'end' }}>
          {qr
            // eslint-disable-next-line @next/next/no-img-element
            ? <a href={data.verifyUrl} data-verify-link><img src={qr} alt="Verification QR code" width={108} height={108} style={{ display: 'block' }} /></a>
            : <div style={{ width: 108, height: 108, background: '#eef1f1' }} />}
          <div style={{ fontSize: 10.5, color: MUTED }}>
            <p style={{ margin: 0, color: INK, fontWeight: 600, fontSize: 12.5 }}>Verify this certificate</p>
            <p style={{ margin: '2px 0 0' }}>
              <a href={data.verifyUrl} data-verify-link style={{ fontFamily: MONO, color: TEAL, fontSize: 10.5, textDecoration: 'none' }}>
                {verifyHost(data.verifyUrl)}/certificate/zone/verify/
              </a>
            </p>
            <p style={{ margin: '4px 0 0' }}>
              Verification recomputes certificate{' '}
              <span style={{ fontFamily: MONO, color: INK, whiteSpace: 'nowrap' }}>{data.code}</span> from the journal&rsquo;s
              current ranking record. It is valid while the zones stated here hold. The certificate states a ranking
              position, not an assessment of individual articles.
            </p>
          </div>
          <Signature sub={`ZONE ${p.zone}`} />
        </footer>
      </div>
    </article>
  )
}
