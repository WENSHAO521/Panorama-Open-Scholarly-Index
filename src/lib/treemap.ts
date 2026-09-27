// Squarified treemap layout (Bruls, Huizing and van Wijk, 2000). Pure and
// deterministic, so the home page can lay out its subject map at build time.

export interface Rect { x: number; y: number; w: number; h: number }

/** Lays out values (sorted largest first) inside a rectangle; returns one rect per value, in input order. */
export function squarify(values: number[], box: Rect): Rect[] {
  const total = values.reduce((s, v) => s + v, 0)
  if (!total) return values.map(() => ({ ...box, w: 0, h: 0 }))
  const scale = (box.w * box.h) / total
  const areas = values.map(v => v * scale)
  const out: Rect[] = []
  let rest = { ...box }
  let row: number[] = []

  const worst = (r: number[], side: number) => {
    const s = r.reduce((a, b) => a + b, 0)
    const max = Math.max(...r), min = Math.min(...r)
    return Math.max((side * side * max) / (s * s), (s * s) / (side * side * min))
  }
  const place = (r: number[]) => {
    const s = r.reduce((a, b) => a + b, 0)
    if (rest.w >= rest.h) {
      const w = s / rest.h
      let y = rest.y
      for (const a of r) { out.push({ x: rest.x, y, w, h: a / w }); y += a / w }
      rest = { x: rest.x + w, y: rest.y, w: rest.w - w, h: rest.h }
    } else {
      const h = s / rest.w
      let x = rest.x
      for (const a of r) { out.push({ x, y: rest.y, w: a / h, h }); x += a / h }
      rest = { x: rest.x, y: rest.y + h, w: rest.w, h: rest.h - h }
    }
  }

  for (const a of areas) {
    const side = Math.min(rest.w, rest.h)
    if (!row.length || worst([...row, a], side) <= worst(row, side)) row.push(a)
    else { place(row); row = [a] }
  }
  if (row.length) place(row)
  return out
}
