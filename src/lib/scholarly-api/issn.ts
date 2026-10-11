// ISSN validation and conflict detection. POSI-J IDs are the permanent journal key; an ISSN returned by an
// external service is evidence about a journal, never a key, and never overwrites a verified record.

/** Upper-case, hyphenated ISSN ("1234-567X"), or null if the text is not shaped like one. */
export function normalizeIssn(s: string | null | undefined): string | null {
  const m = /^\s*(?:urn:issn:)?(\d{4})-?(\d{3}[\dXx])\s*$/.exec(s ?? '')
  return m ? `${m[1]}-${m[2].toUpperCase()}` : null
}

/** True when the mod-11 check digit is right. */
export function isValidIssn(s: string | null | undefined): boolean {
  const n = normalizeIssn(s)
  if (!n) return false
  const d = n.replace('-', '')
  let sum = 0
  for (let i = 0; i < 7; i++) sum += Number(d[i]) * (8 - i)
  const check = (11 - (sum % 11)) % 11
  return d[7] === (check === 10 ? 'X' : String(check))
}

export type IssnConflict =
  | { kind: 'invalid'; issn: string }
  | { kind: 'swapped'; print: string; electronic: string }
  | { kind: 'foreign'; issn: string }

export interface JournalIssns { print?: string | null; electronic?: string | null; issnL?: string | null; historical?: string[] }

/**
 * Compare ISSNs reported by an external service with the verified record. Returns the conflicts found; the
 * caller keeps the raw values, flags the journal for review and leaves the verified record untouched.
 */
export function issnConflicts(verified: JournalIssns, reported: string[], reportedPrint?: string | null, reportedElectronic?: string | null): IssnConflict[] {
  const known = new Set([verified.print, verified.electronic, verified.issnL, ...(verified.historical ?? [])].map(normalizeIssn).filter(Boolean) as string[])
  const out: IssnConflict[] = []
  for (const raw of reported) {
    const n = normalizeIssn(raw)
    if (!n || !isValidIssn(n)) out.push({ kind: 'invalid', issn: raw })
    else if (known.size && !known.has(n)) out.push({ kind: 'foreign', issn: n })
  }
  const vp = normalizeIssn(verified.print), ve = normalizeIssn(verified.electronic)
  const rp = normalizeIssn(reportedPrint), re = normalizeIssn(reportedElectronic)
  if (vp && ve && rp === ve && re === vp) out.push({ kind: 'swapped', print: vp, electronic: ve })
  return out
}

/** Index of verified journals by every ISSN they hold, so a match never depends on which ISSN a service sent. */
export function buildIssnIndex<T>(journals: T[], issnsOf: (j: T) => (string | null | undefined)[]): Map<string, T[]> {
  const idx = new Map<string, T[]>()
  for (const j of journals) for (const raw of issnsOf(j)) {
    const n = normalizeIssn(raw)
    if (!n) continue
    const list = idx.get(n) ?? []
    if (!list.includes(j)) list.push(j)
    idx.set(n, list)
  }
  return idx
}

/** The single journal an ISSN list resolves to; null when nothing matches or the ISSNs point to different journals. */
export function resolveJournal<T>(idx: Map<string, T[]>, issns: (string | null | undefined)[]): T | null {
  const hits = new Set<T>()
  for (const raw of issns) {
    const n = normalizeIssn(raw)
    for (const j of (n && idx.get(n)) || []) hits.add(j)
  }
  return hits.size === 1 ? [...hits][0] : null
}
