// The POSI seal as SVG, for the certificate of indexing.
// Same design as the Core Collection certificate's seal (lib/seal.ts).

import { SEAL, serratedPath } from '@/lib/seal'

export function Seal({ size = 132, centre = 'POSI', sub = 'VERIFIED' }: { size?: number; centre?: string; sub?: string }) {
  const R = 100
  const c = 110 // viewBox is 220 x 220, centre (110, 110)
  const fs = SEAL.textSize * R
  const arc = (r: number, span: number, upper: boolean) => {
    const a0 = ((upper ? 270 - span / 2 : 90 + span / 2) * Math.PI) / 180
    const a1 = ((upper ? 270 + span / 2 : 90 - span / 2) * Math.PI) / 180
    const p = (a: number) => `${(c + r * Math.cos(a)).toFixed(2)} ${(c + r * Math.sin(a)).toFixed(2)}`
    // upper arc runs clockwise over the top; lower arc runs anticlockwise along the bottom
    return `M ${p(a0)} A ${r} ${r} 0 ${span > 180 ? 1 : 0} ${upper ? 1 : 0} ${p(a1)}`
  }
  const text = { fill: SEAL.ink, fontFamily: 'var(--font-ibm), "IBM Plex Sans", Arial, sans-serif', fontWeight: 600 }
  const ring = (r: number, w: number) => <circle cx={c} cy={c} r={r * R} fill="none" stroke={SEAL.ink} strokeWidth={w} />
  const dotR = ((SEAL.innerRing + SEAL.outerRing2) / 2) * R

  return (
    <svg width={size} height={size} viewBox="0 0 220 220" role="img" aria-label="Seal of the Panorama Open Scholarly Index, Editorial Office" style={{ opacity: SEAL.opacity }}>
      <defs>
        <path id="seal-top" d={arc(SEAL.topBaseline * R, SEAL.topSpan, true)} />
        <path id="seal-bottom" d={arc(SEAL.bottomBaseline * R, SEAL.bottomSpan, false)} />
      </defs>
      <path d={serratedPath(c, c, R)} fill="none" stroke={SEAL.ink} strokeWidth={1.4} strokeLinejoin="round" />
      {ring(SEAL.outerRing, 2.2)}
      {ring(SEAL.outerRing2, 0.8)}
      {ring(SEAL.innerRing, 1.4)}
      {ring(SEAL.innerRing2, 0.6)}
      <text {...text} fontSize={fs} letterSpacing={SEAL.tracking * R}>
        <textPath href="#seal-top" startOffset="50%" textAnchor="middle">{SEAL.top}</textPath>
      </text>
      <text {...text} fontSize={fs} letterSpacing={SEAL.tracking * R}>
        <textPath href="#seal-bottom" startOffset="50%" textAnchor="middle">{SEAL.bottom}</textPath>
      </text>
      {[180 - SEAL.dotAngle, SEAL.dotAngle].map(a => {
        const t = (a * Math.PI) / 180
        return <circle key={a} cx={c + dotR * Math.cos(t)} cy={c + dotR * Math.sin(t)} r={2.6} fill={SEAL.ink} />
      })}
      <line x1={c - 30} x2={c + 30} y1={c - 24} y2={c - 24} stroke={SEAL.ink} strokeWidth={0.9} />
      <text {...text} x={c} y={c + 10} fontSize={29} textAnchor="middle" letterSpacing={1.5}>{centre}</text>
      <line x1={c - 30} x2={c + 30} y1={c + 19} y2={c + 19} stroke={SEAL.ink} strokeWidth={0.9} />
      <text {...text} x={c} y={c + 33} fontSize={9.5} textAnchor="middle" letterSpacing={2.4}>{sub}</text>
    </svg>
  )
}
