// Windowed page-number list with ellipsis gaps: always shows page 1 and the
// last page, plus a window around the current page — avoids rendering
// hundreds of page-number buttons for a large dataset. Shared by every
// paginated list on the site (previously duplicated per-component).
export function pageWindow(page: number, totalPages: number): (number | '…')[] {
  const delta = 1
  const range: number[] = []
  for (let p = Math.max(2, page - delta); p <= Math.min(totalPages - 1, page + delta); p++) range.push(p)
  const out: (number | '…')[] = [1]
  if (range[0] > 2) out.push('…')
  out.push(...range)
  if (range[range.length - 1] < totalPages - 1) out.push('…')
  if (totalPages > 1) out.push(totalPages)
  return out
}
