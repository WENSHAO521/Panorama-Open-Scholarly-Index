'use client'

import { useEffect, useState } from 'react'
import { THEME_KEY, type ThemeChoice } from '@/lib/theme'
import { useMessages } from '@/i18n/LocaleProvider'

const CHOICE_IDS: ThemeChoice[] = ['system', 'light', 'dark']

function apply(choice: ThemeChoice) {
  const root = document.documentElement
  if (choice === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', choice)
  try {
    if (choice === 'system') localStorage.removeItem(THEME_KEY)
    else localStorage.setItem(THEME_KEY, choice)
  } catch { /* storage blocked: the choice still applies for this page view */ }
}

/** Colour-scheme switch: a radio group, so it works by keyboard and is announced as one control. */
export function ThemeToggle({ onBand = false }: { onBand?: boolean }) {
  const { header } = useMessages()
  const [choice, setChoice] = useState<ThemeChoice>('system')

  useEffect(() => {
    const t = document.documentElement.getAttribute('data-theme')
    // Reading the DOM after mount keeps server and client markup identical.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChoice(t === 'light' || t === 'dark' ? t : 'system')
  }, [])

  function pick(c: ThemeChoice) { setChoice(c); apply(c) }

  return (
    <div role="radiogroup" aria-label={header.colourScheme} className="inline-flex items-center" style={{ border: `1px solid ${onBand ? 'var(--band-line)' : 'var(--line-strong)'}`, borderRadius: 'var(--radius)' }}>
      {CHOICE_IDS.map((id, i) => {
        const on = choice === id
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => pick(id)}
            className="px-2 h-6 text-[11.5px] font-medium"
            style={{
              borderLeft: i ? `1px solid ${onBand ? 'var(--band-line)' : 'var(--line)'}` : undefined,
              background: on ? (onBand ? 'var(--band-ink)' : 'var(--posi-brand)') : 'transparent',
              color: on ? (onBand ? 'var(--band)' : 'var(--posi-on-brand)') : (onBand ? 'var(--band-muted)' : 'var(--muted)'),
            }}
          >
            {header.theme[id]}
          </button>
        )
      })}
    </div>
  )
}
