// The POSI official seal as SVG, for the certificate of indexing.
// Same design as the Core Collection certificate's seal (lib/seal.ts).

import { SEAL, starPath } from '@/lib/seal'

export function Seal({ size = 132, centre = 'POSI', sub = 'VERIFIED' }: { size?: number; centre?: string; sub?: string }) {
  const R = 100
  const c = 110 // viewBox is 220 x 220, centre (110, 110)
  const fs = SEAL.textSize * R
  const top = SEAL.topBaseline * R
  const bot = SEAL.bottomBaseline * R
  const arc = (r: number, span: number, upper: boolean) => {
    const a0 = ((upper ? 270 - span / 2 : 90 + span / 2) * Math.PI) / 180
    const a1 = ((upper ? 270 + span / 2 : 90 - span / 2) * Math.PI) / 180
    const p = (a: number) => `${(c + r * Math.cos(a)).toFixed(2)} ${(c + r * Math.sin(a)).toFixed(2)}`
    // upper arc runs clockwise over the top; lower arc runs anticlockwise along the bottom
    return `M ${p(a0)} A ${r} ${r} 0 ${span > 180 ? 1 : 0} ${upper ? 1 : 0} ${p(a1)}`
  }
  const text = { fill: SEAL.ink, fontFamily: 'var(--font-ibm), "IBM Plex Sans", Arial, sans-serif', fontWeight: 600 }

  return (
    <svg width={size} height={size} viewBox="0 0 220 220" role="img" aria-label="Seal of the Panorama Open Scholarly Index, Editorial Office" style={{ opacity: SEAL.opacity }}>
      <defs>
        <path id="seal-top" d={arc(top, SEAL.topSpan, true)} />
        <path id="seal-bottom" d={arc(bot, SEAL.bottomSpan, false)} />
      </defs>
      <circle cx={c} cy={c} r={SEAL.outer * R} fill="none" stroke={SEAL.ink} strokeWidth={4} />
      <circle cx={c} cy={c} r={SEAL.outerInner * R} fill="none" stroke={SEAL.ink} strokeWidth={1.3} />
      <circle cx={c} cy={c} r={SEAL.band * R} fill="none" stroke={SEAL.ink} strokeWidth={1.3} />
      <text {...text} fontSize={fs} letterSpacing={SEAL.tracking * R}>
        <textPath href="#seal-top" startOffset="50%" textAnchor="middle">{SEAL.top}</textPath>
      </text>
      <text {...text} fontSize={fs} letterSpacing={SEAL.tracking * R}>
        <textPath href="#seal-bottom" startOffset="50%" textAnchor="middle">{SEAL.bottom}</textPath>
      </text>
      {[180 - SEAL.starAngle, SEAL.starAngle].map(a => {
        const r = ((SEAL.band + SEAL.outerInner) / 2) * R
        const t = (a * Math.PI) / 180
        return <path key={a} d={starPath(c + r * Math.cos(t), c + r * Math.sin(t), 5.5)} fill={SEAL.ink} />
      })}
      <path d={starPath(c, c - 30, 11)} fill={SEAL.ink} />
      <text {...text} x={c} y={c + 13} fontSize={30} textAnchor="middle" letterSpacing={1}>{centre}</text>
      <text {...text} x={c} y={c + 32} fontSize={11} textAnchor="middle" letterSpacing={2.2}>{sub}</text>
    </svg>
  )
}
