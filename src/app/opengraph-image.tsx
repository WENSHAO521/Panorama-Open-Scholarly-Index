import { ImageResponse } from 'next/og'

export const dynamic = 'force-static'
export const alt = 'Panorama Open Scholarly Index'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#111111',
          padding: '72px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 10, height: 56, background: '#cc0000' }} />
          <div
            style={{
              fontSize: 40,
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: '#ffffff',
              fontFamily: 'monospace',
            }}
          >
            POSI
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div
            style={{
              fontSize: 60,
              fontWeight: 700,
              color: '#ffffff',
              lineHeight: 1.15,
              maxWidth: 980,
            }}
          >
            Panorama Open Scholarly Index
          </div>
          <div
            style={{
              fontSize: 26,
              color: 'rgba(255,255,255,0.55)',
              maxWidth: 900,
              lineHeight: 1.4,
            }}
          >
            Open journal indexing, lifecycle evaluation, subject ranking, and citation
            analytics — built on versioned evidence and reproducible methodology.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: 20,
            letterSpacing: '0.15em',
            color: 'rgba(255,255,255,0.3)',
            fontFamily: 'monospace',
            textTransform: 'uppercase',
          }}
        >
          posi.panorama-sg.com
        </div>
      </div>
    ),
    { ...size }
  )
}
