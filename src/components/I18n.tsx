'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { CaretDown, Check, Globe } from '@phosphor-icons/react/dist/ssr'
import {
  DEFAULT_LOCALE, LOCALES, LOCALE_STORAGE_KEY, LOCALIZED_PAGES, htmlLang, isLocale, localeFromPath,
  localizedPath, translate, unlocalizedPath, type Locale,
} from '@/lib/i18n/locales'

// Which language the interface shows:
//   1. on a localized address (/ja/, /zh-cn/ ...) the prefix decides, and
//      the page is rendered in that language at build time;
//   2. elsewhere, the reader's saved choice (localStorage), applied after
//      hydration because the static HTML of those pages is English.

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

/** Remember the reader's language (for pages without a localized address). */
export function saveLocale(locale: Locale) {
  try {
    if (window.localStorage.getItem(LOCALE_STORAGE_KEY) === locale) return
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch { /* private mode: this page view only */ }
  listeners.forEach(l => l())
}

/** The reader's saved language, ignoring the address. */
export function useSavedLocale(): Locale {
  return useSyncExternalStore(subscribe, read, () => DEFAULT_LOCALE)
}

export function useLocale(): Locale {
  const fromPath = localeFromPath(usePathname() || '/')
  const saved = useSavedLocale()
  return fromPath ?? saved
}

export function useT() {
  const locale = useLocale()
  return (text: string, vars?: Record<string, string | number>) => translate(locale, text, vars)
}

/** A localized page's address in the current language: useLocalizedHref('/') -> '/zh-cn/'. */
export function useLocalizedHref(page: string): string {
  return localizedPath(page, useLocale())
}

/** Translated text, for use inside server components: <T>Browse journals</T>. */
export function T({ children, vars }: { children: string; vars?: Record<string, string | number> }) {
  return <>{useT()(children, vars)}</>
}

/**
 * Runs in <head>, before first paint:
 *   - on the English copy of a localized page, a reader who chose another
 *     language goes straight to that language's copy (no English flash);
 *   - otherwise sets <html lang> from the address prefix, or else the saved
 *     choice, so CJK text gets the right fonts and glyph forms.
 */
export const LOCALE_BOOT_SCRIPT = `try{var L=${JSON.stringify(LOCALES.filter(l => l.path).map(l => [l.path, l.code, l.lang]))},P=${JSON.stringify(LOCALIZED_PAGES)},d=document.documentElement,u=location.pathname,p=u.split('/')[1],s=localStorage.getItem(${JSON.stringify(LOCALE_STORAGE_KEY)}),i,x;for(i=0;i<L.length;i++)if(L[i][0]===p)x=L[i];if(!x)for(i=0;i<L.length;i++)if(L[i][1]===s)x=L[i];if(x&&x[0]!==p&&P.indexOf(u)>=0)location.replace('/'+x[0]+u+location.search+location.hash);else if(x)d.lang=x[2]}catch(e){}`

/**
 * On a localized address: remember the language, so the pages that exist
 * only once keep showing the interface in it.
 */
export function RememberLocale({ locale }: { locale: Locale }) {
  useEffect(() => { saveLocale(locale) }, [locale])
  return null
}

/**
 * On the unprefixed (English) copy of a localized page: a reader who chose
 * another language is taken to that language's copy. Full page loads are
 * redirected earlier by LOCALE_BOOT_SCRIPT; this covers in-app navigation.
 */
export function RedirectToSavedLocale({ page }: { page: string }) {
  const saved = useSavedLocale()
  const router = useRouter()
  useEffect(() => { if (saved !== DEFAULT_LOCALE) router.replace(localizedPath(page, saved)) }, [saved, page, router])
  return null
}

/** Header control: a globe button with the five interface languages. */
export function LanguageSwitcher({ inverted = false, align = 'right' }: { inverted?: boolean; align?: 'left' | 'right' }) {
  const locale = useLocale()
  const t = useT()
  const router = useRouter()
  const page = unlocalizedPath(usePathname() || '/')
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
                onClick={() => {
                  saveLocale(l.code)
                  setOpen(false)
                  if (LOCALIZED_PAGES.includes(page)) router.push(localizedPath(page, l.code))
                }}
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
