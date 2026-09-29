'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { CaretDown, Check, Globe } from '@phosphor-icons/react/dist/ssr'
import { DEFAULT_LOCALE, LOCALES, LOCALE_STORAGE_KEY, htmlLang, isLocale, translate, type Locale } from '@/lib/i18n/locales'

// The chosen language lives in localStorage and is shared by every
// component through one tiny external store. The server snapshot is always
// English, so the static HTML hydrates cleanly and switches afterwards.

const listeners = new Set<() => void>()

function read(): Locale {
  try {
    const v = window.localStorage.getItem(LOCALE_STORAGE_KEY)
    return isLocale(v) ? v : DEFAULT_LOCALE
  } catch {
    return DEFAULT_LOCALE
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  const onStorage = (e: StorageEvent) => { if (e.key === LOCALE_STORAGE_KEY) cb() }
  window.addEventListener('storage', onStorage)
  return () => { listeners.delete(cb); window.removeEventListener('storage', onStorage) }
}

export function setLocale(locale: Locale) {
  try { window.localStorage.setItem(LOCALE_STORAGE_KEY, locale) } catch { /* private mode: this page view only */ }
  document.documentElement.lang = htmlLang(locale)
  listeners.forEach(l => l())
}

export function useLocale(): Locale {
  return useSyncExternalStore(subscribe, read, () => DEFAULT_LOCALE)
}

export function useT() {
  const locale = useLocale()
  return (text: string, vars?: Record<string, string | number>) => translate(locale, text, vars)
}

/** Translated text, for use inside server components: <T>Browse journals</T>. */
export function T({ children, vars }: { children: string; vars?: Record<string, string | number> }) {
  return <>{useT()(children, vars)}</>
}

/**
 * Runs before hydration: sets <html lang> from the saved choice so CJK text
 * gets the right fonts and glyph forms from the first paint.
 */
export const LOCALE_BOOT_SCRIPT = `try{var l=localStorage.getItem(${JSON.stringify(LOCALE_STORAGE_KEY)});var m={ja:'ja',ko:'ko','zh-Hans':'zh-CN','zh-Hant':'zh-TW'};if(m[l])document.documentElement.lang=m[l]}catch(e){}`

/** Header control: a globe button with the five interface languages. */
export function LanguageSwitcher({ inverted = false, align = 'right' }: { inverted?: boolean; align?: 'left' | 'right' }) {
  const locale = useLocale()
  const t = useT()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = LOCALES.find(l => l.code === locale)!

  useEffect(() => { document.documentElement.lang = htmlLang(locale) }, [locale])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  return (
    <div
      ref={ref}
      className="relative"
      onBlur={e => { if (!ref.current?.contains(e.relatedTarget as Node)) setOpen(false) }}
    >
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${t('Language')}: ${current.label}`}
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-1.5 transition-colors"
        style={{ color: inverted ? 'var(--band-muted)' : 'var(--ink-2)' }}
      >
        <Globe className="h-3.5 w-3.5" aria-hidden />
        <span>{current.label}</span>
        <CaretDown className="h-3 w-3" aria-hidden style={{ transform: open ? 'rotate(180deg)' : undefined }} />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={t('Language')}
          className={`absolute ${align === 'left' ? 'left-0' : 'right-0'} top-full mt-1 z-50 min-w-[150px] py-1 text-[13px]`}
          style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderTop: '2px solid var(--teal)', boxShadow: '0 6px 18px rgba(15, 23, 32, 0.12)' }}
        >
          {LOCALES.map(l => (
            <li key={l.code} role="option" aria-selected={l.code === locale} lang={htmlLang(l.code)}>
              <button
                type="button"
                onClick={() => { setLocale(l.code); setOpen(false) }}
                className="w-full flex items-center justify-between gap-3 px-3 py-1.5 text-left transition-colors hover:bg-[var(--hover)]"
                style={{ color: 'var(--ink)', fontWeight: l.code === locale ? 600 : 400 }}
              >
                {l.label}
                {l.code === locale && <Check className="h-3.5 w-3.5" style={{ color: 'var(--teal)' }} aria-hidden />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
