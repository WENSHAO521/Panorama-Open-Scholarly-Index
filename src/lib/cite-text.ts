// Small text rules shared by every citation style: splitting a display name
// into given and family names, APA initials, and the end of a title.
// Pure and import-free so it can be tested with `node --test`.

export interface NameParts { given: string; family: string }

/** Lower-case particles that belong to the family name: "van Beethoven", "de la Cruz". */
const PARTICLES = new Set(['van', 'von', 'de', 'del', 'della', 'der', 'den', 'di', 'da', 'dos', 'das', 'du', 'la', 'le', 'ter', 'ten', 'zu'])

/** "P.", "P.J", "J.-P." or a lone capital: a run of initials, not a name. */
function isInitials(t: string): boolean {
  return /^(\p{Lu}[.\-]*)+$/u.test(t) && (t.includes('.') || t.length === 1)
}

/**
 * Splits a display name ("P.J Ruiz Lázaro", "Ludwig van Beethoven", "Smith, John") for sources that give
 * only one string (OpenAlex, DataCite). Leading initials are the given name and everything after them the
 * family name, which keeps Spanish and Portuguese double surnames whole. Otherwise the last word is the
 * family name, with any particles before it. A single word (an organisation, a CJK name) returns null.
 */
export function splitName(name: string | null | undefined): NameParts | null {
  const t = (name ?? '').trim().replace(/\s+/g, ' ')
  if (!t) return null
  const comma = t.indexOf(',')
  if (comma > 0) {
    const family = t.slice(0, comma).trim(), given = t.slice(comma + 1).trim()
    return family && given ? { given, family } : null
  }
  const words = t.split(' ')
  if (words.length < 2) return null
  let k = 0
  while (k < words.length - 1 && isInitials(words[k])) k++
  if (k === 0) {
    k = words.length - 1
    while (k > 1 && PARTICLES.has(words[k - 1])) k--
  }
  return { given: words.slice(0, k).join(' '), family: words.slice(k).join(' ') }
}

/** APA initials: "John A." → "J. A.", "P.J" → "P. J.", "Jean-Pierre" → "J.-P.". */
export function initials(given: string): string {
  return given.split(/[\s.]+/).filter(Boolean)
    .map(w => w.split('-').filter(Boolean).map(p => `${p.charAt(0).toUpperCase()}.`).join('-'))
    .join(' ')
}

/** Initials written out with full stops and spaces, other words kept: "P.J" → "P. J.", "John A" → "John A.". */
export function spaceInitials(given: string): string {
  return given.trim().split(/\s+/).map(w => (isInitials(w) || /^\p{Lu}$/u.test(w) ? initials(w) : w)).join(' ')
}

/** A title as it is cited: trimmed, with a dangling ":", ";" or "," dropped ("…adolescentes:" → "…adolescentes"). */
export function cleanTitle(t: string | null | undefined): string {
  return (t ?? '').trim().replace(/[\s:;,]+$/, '')
}

/** A title followed by a full stop, unless it already ends in ".", "?" or "!". */
export function titleStop(t: string | null | undefined): string {
  const c = cleanTitle(t)
  return /[.?!]$/.test(c) ? c : `${c}.`
}

/** A publication year outside 1000…next year is a data error (OpenAlex has "2203" for 2003). */
export function plausibleYear(y: string | number | null | undefined, now = new Date()): boolean {
  const n = Number(String(y ?? '').slice(0, 4))
  return Number.isInteger(n) && n >= 1000 && n <= now.getFullYear() + 1
}
