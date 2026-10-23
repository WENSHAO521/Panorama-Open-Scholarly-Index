'use client'

import { useEffect, useState } from 'react'
import { THEME_KEY, type ThemeChoice } from '@/lib/theme'
import { Sun, Moon } from '@phosphor-icons/react/dist/ssr'
import { useMessages } from '@/i18n/LocaleProvider'

const CHOICES = [{ id: 'light', Icon: Sun }, { id: 'dark', Icon: Moon }] as const

function apply(choice: ThemeChoice) {
  document.documentElement.setAttribute('data-theme', choice)
  try { localStorage.setItem(THEME_KEY, choice) } catch { /* storage blocked: the choice still applies for this page view */ }
}

/** Colour-scheme switch, a sun and a moon: a radio group, so it works by keyboard and is announced as one control. Light unless the visitor picked dark. */
export function ThemeToggle({ onBand = false }: { onBand?: boolean }) {
  const { header } = useMessages()
  const [choice, setChoice] = useState<ThemeChoice>('light')

  useEffect(() => {
    const t = document.documentElement.getAttribute('data-theme')
    // Reading the DOM after mount keeps server and client markup identical.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChoice(t === 'dark' ? 'dark' : 'light')
  }, [])

  function pick(c: ThemeChoice) { setChoice(c); apply(c) }

  return (
    <div role="radiogroup" aria-label={header.colourScheme} className="inline-flex items-center overflow-hidden" style={{ border: `1px solid ${onBand ? 'var(--band-line)' : 'var(--line)'}`, borderRadius: 'var(--radius)' }}>
      {CHOICES.map(({ id, Icon }, i) => {
        const on = choice === id
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={header.theme[id]}
            title={header.theme[id]}
            onClick={() => pick(id)}
            className="inline-flex items-center justify-center w-8 h-7"
            style={{
              borderLeft: i ? `1px solid ${onBand ? 'var(--band-line)' : 'var(--line)'}` : undefined,
              background: on ? (onBand ? 'var(--band-ink)' : 'var(--posi-brand)') : 'transparent',
              color: on ? (onBand ? 'var(--band)' : 'var(--posi-on-brand)') : (onBand ? 'var(--band-muted)' : 'var(--muted)'),
            }}
          >
            <Icon className="h-3.5 w-3.5" weight={on ? 'fill' : 'regular'} aria-hidden="true" />
          </button>
        )
      })}
    </div>
  )
}
