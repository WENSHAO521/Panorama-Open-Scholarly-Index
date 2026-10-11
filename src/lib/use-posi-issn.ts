'use client'

// Maps ISSNs to POSI records so publication results can say whether their
// journal is in the index. Loads the small Core + Benchmark index files once
// per page view (Discovered is skipped: too large to fetch just for this).

import { useEffect, useState } from 'react'
import type { IndexRecord } from './records'
import { dataUrl } from '@/lib/data-base'
import { buildIssnIndex, resolveJournal } from '@/lib/scholarly-api/issn'

// Every ISSN of every record, normalised ("1234-567X"). An ISSN held by two records maps to both, so a match
// is only made when the work's ISSNs point to exactly one record.
export type IssnMap = Map<string, IndexRecord[]>

let cache: Promise<IssnMap> | null = null

function load(): Promise<IssnMap> {
  if (!cache) {
    cache = Promise.all(['core', 'benchmark'].map(g => fetch(dataUrl(`index/${g}.json`)).then(r => (r.ok ? r.json() : []))))
      .then((groups: IndexRecord[][]) => buildIssnIndex(groups.flat(), r => r.i))
      .catch(() => new Map())
  }
  return cache
}

export function usePosiIssnMap(): IssnMap | null {
  const [map, setMap] = useState<IssnMap | null>(null)
  useEffect(() => { let on = true; load().then(m => { if (on) setMap(m) }); return () => { on = false } }, [])
  return map
}

export function matchIssn(map: IssnMap | null, issns: (string | null | undefined)[] | null | undefined): IndexRecord | null {
  if (!map || !issns) return null
  return resolveJournal(map, issns)
}
