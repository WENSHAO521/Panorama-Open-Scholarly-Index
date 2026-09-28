// Journal search over POSI's own index: title words from /data/jt/<prefix>.json
// (built at prebuild), ISSNs and OpenAlex ids through the profile shards.

import { getJournalProfile } from './journal-profile'

export interface JournalHit {
  key: string
  title: string
  publisher: string | null
  works: number
  oa: boolean
  /** POSI-EVAL-1.0 summary, when the journal has one */
  psc?: string | null
  quartile?: 'Q1' | 'Q2' | 'Q3' | 'Q4' | null
  zone?: 1 | 2 | 3 | 4 | null
  status?: string | null
  ajr?: string | null
  zoneStatus?: 'official' | 'provisional' | 'not_assigned' | null
}

type Evaluation = [string | null, 'Q1' | 'Q2' | 'Q3' | 'Q4' | null, 1 | 2 | 3 | 4 | null, string | null, string | null, ('official' | 'provisional' | 'not_assigned' | null)?]
/** [key, title, publisher, works, open access, alternate titles joined by ' | ', [PSC, quartile, zone, ranking status, AJR Rating, zone status]] */
type Entry = [string, string, string | null, number, 0 | 1, string?, Evaluation?]

/** Keep in step with scripts/sync-live-data.mjs. */
const STOP_WORDS = new Set('journal journals international of and the for in on de la y e des du und der revista research da di del el et les en al'.split(' '))

const HAN = /\p{Script=Han}/u

/** Latin words of 2+ letters, and each Chinese character on its own. Keep in step with scripts/sync-live-data.mjs. */
export function titleWords(t: string): string[] {
  return (t.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().match(/[a-z0-9]+|\p{Script=Han}/gu) ?? [])
    .filter(w => (w.length >= 2 || HAN.test(w)) && !STOP_WORDS.has(w))
}

/** Index file a word lives in. Keep in step with scripts/sync-live-data.mjs. */
function prefixOf(w: string): string {
  return HAN.test(w) ? `zh${w.codePointAt(0)! % 64}` : w.slice(0, 2)
}

const ISSN_RE = /^\d{4}-?\d{3}[\dXx]$/

// Shared between callers: never tied to one caller's AbortSignal.
const cache = new Map<string, Promise<Entry[]>>()
function loadPrefix(p: string): Promise<Entry[]> {
  let hit = cache.get(p)
  if (!hit) {
    hit = fetch(`/data/jt/${p}.json`)
      .then(r => (r.ok ? r.json() : []))
      .catch(e => { cache.delete(p); throw e })
    cache.set(p, hit)
  }
  return hit
}

export async function searchJournals(q: string, limit = 50, signal?: AbortSignal): Promise<{ hits: JournalHit[]; total: number }> {
  const query = q.trim()
  if (!query) return { hits: [], total: 0 }

  if (ISSN_RE.test(query) || /^S\d+$/i.test(query)) {
    const p = await getJournalProfile(query, signal)
    return p
      ? { hits: [{ key: p.k, title: p.t, publisher: p.pub ?? null, works: p.w ?? p.cr ?? 0, oa: !!p.oa, psc: p.ev?.cat ?? p.s ?? null, quartile: p.ev?.q ?? null, zone: p.ev?.z ?? null, status: p.ev?.st ?? null, ajr: p.ev?.ajr?.[0] ?? null, zoneStatus: p.ev?.zs ?? null }], total: 1 }
      : { hits: [], total: 0 }
  }

  const words = titleWords(query)
  if (!words.length) return { hits: [], total: 0 }
  // The longest word narrows the candidate file the most.
  const anchor = [...words].sort((a, b) => b.length - a.length)[0]
  const entries = await loadPrefix(prefixOf(anchor))
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')

  const full = words.join(' ')
  const scored: { e: Entry; score: number }[] = []
  for (const e of entries) {
    let best = -1
    for (const title of [e[1], ...(e[5] ? e[5].split(' | ') : [])]) {
      const tw = titleWords(title)
      // every query word must prefix-match some title word
      if (!words.every(w => tw.some(t => t.startsWith(w)))) continue
      const joined = tw.join(' ')
      best = Math.max(best, joined === full ? 3 : joined.startsWith(full) ? 2 : words.every(w => tw.includes(w)) ? 1 : 0)
    }
    if (best >= 0) scored.push({ e, score: best })
  }
  // entries arrive sorted by works, so a stable sort keeps that as the tiebreak
  scored.sort((a, b) => b.score - a.score)
  return {
    total: scored.length,
    hits: scored.slice(0, limit).map(({ e }) => ({
      key: e[0], title: e[1], publisher: e[2], works: e[3], oa: e[4] === 1,
      ...(e[6] ? { psc: e[6][0], quartile: e[6][1], zone: e[6][2], status: e[6][3], ajr: e[6][4], zoneStatus: e[6][5] ?? null } : {}),
    })),
  }
}
