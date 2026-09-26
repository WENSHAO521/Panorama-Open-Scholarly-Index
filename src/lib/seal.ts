// The POSI official seal, shared by the Core Collection certificate (PDF,
// certificate-pdf.ts) and the certificate of indexing (SVG, Seal.tsx).
// Geometry is given for a seal of radius 1; callers scale it.

export const SEAL = {
  ink: '#c1121f',
  opacity: 0.9,
  top: 'PANORAMA OPEN SCHOLARLY INDEX',
  bottom: 'EDITORIAL OFFICE',
  // radii, as a fraction of the outer radius
  outer: 1,
  outerInner: 0.93,
  band: 0.66,
  topBaseline: 0.745, // top text sits outside this, glyphs pointing outward
  bottomBaseline: 0.845, // bottom text sits inside this, glyphs upright
  textSize: 0.13,
  tracking: 0.012,
  // path spans in degrees (text is centred on them), and the angle of the
  // two separator stars from the horizontal, below it
  topSpan: 250,
  bottomSpan: 130,
  starAngle: 27,
} as const

/** Five-point star as SVG path data, centred on (cx, cy), y axis down. */
export function starPath(cx: number, cy: number, r: number): string {
  const pts: string[] = []
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * 0.4 : r
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(2)} ${(cy + rr * Math.sin(a)).toFixed(2)}`)
  }
  return `M ${pts.join(' L ')} Z`
}
