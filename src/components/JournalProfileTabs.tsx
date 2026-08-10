'use client'

import { useState, type ReactNode } from 'react'

export type ProfileTabId = 'overview' | 'lifecycle' | 'citation' | 'evidence' | 'metadata' | 'history'

const TAB_LABELS: Record<ProfileTabId, string> = {
  overview: 'Overview',
  lifecycle: 'Lifecycle Rating',
  citation: 'Citation',
  evidence: 'Evidence',
  metadata: 'Metadata',
  history: 'History',
}

const TAB_ORDER: ProfileTabId[] = ['overview', 'lifecycle', 'citation', 'evidence', 'metadata', 'history']

/**
 * Journal profile tabs — reorganizes the Overview/Automated Rating/Citation
 * Analytics/Methodology & Evidence sections that used to be a single long
 * scroll (see AJR-SPEC.md §17 frontend proposal). Panels are supplied by the
 * server-rendered parent; this component only owns which one is visible.
 * Callers omit a key entirely (not just pass null) for tabs that don't apply
 * to a given journal (e.g. auto-discovered records skip Lifecycle/Citation/
 * Evidence/Metadata) — with one panel, the tab chrome itself is skipped.
 */
export function JournalProfileTabs({ panels }: { panels: Partial<Record<ProfileTabId, ReactNode>> }) {
  const available = TAB_ORDER.filter(id => panels[id] != null)
  const [active, setActive] = useState<ProfileTabId>(available[0] ?? 'overview')

  if (available.length <= 1) {
    return <>{available.length === 1 ? panels[available[0]] : null}</>
  }

  const current = available.includes(active) ? active : available[0]

  return (
    <div>
      <div className="flex flex-wrap gap-0.5 mb-3" role="tablist" style={{ borderBottom: '1px solid var(--posi-border)' }}>
        {available.map(id => (
          <button
            key={id}
            role="tab"
            aria-selected={current === id}
            onClick={() => setActive(id)}
            className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] transition-colors"
            style={
              current === id
                ? { color: 'var(--posi-accent)', borderBottom: '2px solid var(--posi-accent)', marginBottom: '-1px' }
                : { color: 'var(--posi-muted)', borderBottom: '2px solid transparent', marginBottom: '-1px' }
            }
          >
            {TAB_LABELS[id]}
          </button>
        ))}
      </div>
      <div role="tabpanel">{panels[current]}</div>
    </div>
  )
}
