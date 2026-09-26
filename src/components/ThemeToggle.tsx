'use client'

// Light / dark switch. The choice is stored per browser; without one the site
// follows the system setting. THEME_SCRIPT (lib/theme.ts) applies a stored
// choice before first paint.

import { useSyncExternalStore } from 'react'
import { Moon, Sun } from '@phosphor-icons/react/dist/ssr'
import { THEME_KEY } from '@/lib/theme'

const EVENT = 'posi-theme-change'

type Theme = 'light' | 'dark'

function current(): Theme {
  const set = document.documentElement.dataset.theme
  if (set === 'light' || set === 'dark') return set
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function subscribe(cb: () => void) {
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  mq.addEventListener('change', cb)
  window.addEventListener(EVENT, cb)
  return () => { mq.removeEventListener('change', cb); window.removeEventListener(EVENT, cb) }
}

export function ThemeToggle({ className = '' }: { className?: string }) {
  const theme = useSyncExternalStore<Theme | null>(subscribe, current, () => null)

  function toggle() {
    const next: Theme = current() === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    try { localStorage.setItem(THEME_KEY, next) } catch { /* storage unavailable */ }
    window.dispatchEvent(new Event(EVENT))
  }

  const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
  return (
    <button type="button" onClick={toggle} className={`btn btn-sm h-9 w-9 px-0 justify-center ${className}`} aria-label={label} title={label}>
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}
