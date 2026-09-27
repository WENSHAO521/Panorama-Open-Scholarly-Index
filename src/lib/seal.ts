// The POSI seal, shared by the Core Collection certificate (PDF,
// certificate-pdf.ts) and the certificate of indexing (SVG, Seal.tsx).
// An embossed-style institutional seal: serrated rosette edge, fine double
// rings, the index name set around the ring, POSI in the centre.
// Geometry is given for a seal of radius 1; callers scale it.

export const SEAL = {
  ink: '#1c4f8f', // the site accent
  opacity: 1,
  top: 'PANORAMA OPEN SCHOLARLY INDEX',
  bottom: 'EDITORIAL OFFICE',
  teeth: 60,
  toothDepth: 0.06, // serration depth, as a fraction of the radius
  outerRing: 0.88,
  outerRing2: 0.855,
  innerRing: 0.6,
  innerRing2: 0.575,
  topBaseline: 0.675, // top text sits outside this, glyphs pointing outward
  bottomBaseline: 0.79, // bottom text sits inside this, glyphs upright
  textSize: 0.118,
  tracking: 0.014,
  topSpan: 250,
  bottomSpan: 140,
  dotAngle: 24, // separator dots, degrees below the horizontal
} as const

/** Serrated rosette outline as SVG path data, centred on (cx, cy), y axis down. */
export function serratedPath(cx: number, cy: number, r: number): string {
  const n = SEAL.teeth * 2
  const pts: string[] = []
  for (let i = 0; i < n; i++) {
    const rr = i % 2 ? r * (1 - SEAL.toothDepth) : r
    const a = (i * 2 * Math.PI) / n
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(2)} ${(cy + rr * Math.sin(a)).toFixed(2)}`)
  }
  return `M ${pts.join(' L ')} Z`
}
