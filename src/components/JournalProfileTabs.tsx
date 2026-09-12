'use client'

import { useEffect, useState, type ReactNode } from 'react'

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

function isProfileTabId(v: string): v is ProfileTabId {
  return (TAB_ORDER as string[]).includes(v)
}

/**
 * Journal profile tabs — reorganizes the Overview/Automated Rating/Citation
 * Analytics/Methodology & Evidence sections that used to be a single long
 * scroll (see AJR-SPEC.md §17 frontend proposal). Panels are supplied by the
 * server-rendered parent; this component only owns which one is visible.
 * Callers omit a key entirely (not just pass null) for tabs that don't apply
 * to a given journal (e.g. auto-discovered records skip Lifecycle/Citation/
 * Evidence/Metadata) — with one panel, the tab chrome itself is skipped.
 *
 * Deep-linkable (§31 of the Stage 2 brief): an incoming `#lifecycle` /
 * `#citation` / etc. hash selects that tab on mount, and clicking a tab
 * updates the hash — so a rating/evidence section can be linked to and
 * shared directly, not just the profile as a whole. Applied only after
 * mount (never during the initial render) so server and client markup
 * always match on first paint — no hydration mismatch.
 */
export function JournalProfileTabs({ panels }: { panels: Partial<Record<ProfileTabId, ReactNode>> }) {
  const available = TAB_ORDER.filter(id => panels[id] != null)
  const [active, setActive] = useState<ProfileTabId>(available[0] ?? 'overview')

  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    if (hash && isProfileTabId(hash) && available.includes(hash)) {
      // One-time sync from an external system (the URL the browser actually
      // navigated to) on mount — not a derived-state anti-pattern; the
      // alternative (reading window.location in useState's lazy initializer)
      // would make the client's first render disagree with the server-
      // rendered markup and trigger a real hydration mismatch instead.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActive(hash)
    }
    // Only ever read on mount — a later external hash change (e.g. browser
    // back/forward) isn't tracked, matching this component's existing
    // local-state-only tab model.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (available.length <= 1) {
    return <>{available.length === 1 ? panels[available[0]] : null}</>
  }

  const current = available.includes(active) ? active : available[0]

  function selectTab(id: ProfileTabId) {
    setActive(id)
    history.replaceState(null, '', `#${id}`)
  }

  return (
    <div>
      <div className="flex flex-wrap gap-0.5 mb-3" role="tablist" style={{ borderBottom: '1px solid var(--posi-border)' }}>
        {available.map(id => (
          <button
            key={id}
            role="tab"
            aria-selected={current === id}
            onClick={() => selectTab(id)}
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
