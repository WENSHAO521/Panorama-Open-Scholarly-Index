'use client'

// Maps ISSNs to POSI records so publication results can say whether their
// journal is in the index. Loads the small Core + Benchmark index files once
// per page view (Discovered is skipped: too large to fetch just for this).

import { useEffect, useState } from 'react'
import type { IndexRecord } from './records'
import { dataUrl } from '@/lib/data-base'

export type IssnMap = Map<string, IndexRecord>

let cache: Promise<IssnMap> | null = null

function load(): Promise<IssnMap> {
  if (!cache) {
    cache = Promise.all(['core', 'benchmark'].map(g => fetch(dataUrl(`index/${g}.json`)).then(r => (r.ok ? r.json() : []))))
      .then((groups: IndexRecord[][]) => {
        const m: IssnMap = new Map()
        for (const r of groups.flat()) for (const i of r.i) m.set(i.toUpperCase(), r)
        return m
      })
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
  for (const i of issns) if (i && map.has(i.toUpperCase())) return map.get(i.toUpperCase())!
  return null
}
