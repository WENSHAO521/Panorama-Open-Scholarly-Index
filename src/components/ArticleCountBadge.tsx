'use client'

import { useState, useEffect } from 'react'

interface Props {
  issn: string | null
  fallback: number
}

export function ArticleCountBadge({ issn, fallback }: Props) {
  const [count, setCount] = useState(fallback)

  useEffect(() => {
    // Only call Crossref if OAI returned nothing
    if (!issn || fallback > 0) return
    fetch(
      `https://api.crossref.org/journals/${issn}/works?rows=0&filter=type:journal-article&mailto=posi@panoramagroup.org`
    )
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const n = d?.message?.['total-results']
        if (typeof n === 'number' && n > 0) setCount(n)
      })
      .catch(() => {})
  }, [issn, fallback])

  return <span className="font-semibold font-mono" style={{ color: 'var(--posi-text)' }}>{count}</span>
}
