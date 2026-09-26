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

export function ThemeToggle({ className = '', band = false }: { className?: string; band?: boolean }) {
  const theme = useSyncExternalStore<Theme | null>(subscribe, current, () => null)

  function toggle() {
    const next: Theme = current() === 'dark' ? 'light' : 'dark'
    const root = document.documentElement
    root.dataset.theme = next
    root.style.colorScheme = next
    try { localStorage.setItem(THEME_KEY, next) } catch { /* storage unavailable */ }
    window.dispatchEvent(new Event(EVENT))
  }

  const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={band
        ? `inline-flex h-6 items-center gap-1.5 px-1.5 text-[12px] transition-colors hover:text-[var(--band-ink)] ${className}`
        : `btn btn-sm h-8 w-8 px-0 justify-center ${className}`}
      style={band ? { color: 'var(--band-muted)' } : undefined}
    >
      {theme === 'dark' ? <Sun className={band ? 'h-3.5 w-3.5' : 'h-4 w-4'} /> : <Moon className={band ? 'h-3.5 w-3.5' : 'h-4 w-4'} />}
      {band && <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>}
    </button>
  )
}
