'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ComponentProps } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { CaretDown, Check, Globe } from '@phosphor-icons/react/dist/ssr'
import {
  DEFAULT_LOCALE, LOCALES, LOCALE_STORAGE_KEY, UNLOCALIZED_PATTERNS, hasLocalizedCopy, htmlLang, isLocale,
  localeFromPath, localizeHref, translate, unlocalizedPath, type Locale,
} from '@/lib/i18n/locales'

// Which language the interface shows:
//   1. on a prefixed address (/ja/..., /zh-cn/...) the prefix decides, and
//      the page is rendered in that language at build time;
//   2. on the pages that exist only unprefixed (journal records, publisher
//      pages), the reader's saved choice (localStorage), applied after
//      hydration because their static HTML is English.
// Choosing a language, or opening a prefixed address, saves the choice.

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

/** Remember the reader's language. */
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

/** Maps an internal href to the current language's address. */
export function useLocalize() {
  const locale = useLocale()
  return (href: string) => localizeHref(href, locale)
}

/** A page's address in the current language: useLocalizedHref('/about/') -> '/ja/about/'. */
export function useLocalizedHref(href: string): string {
  return useLocalize()(href)
}

/** next/link, pointing at the current language's copy of the page. */
export function LocaleLink({ href, ...rest }: Omit<ComponentProps<typeof Link>, 'href'> & { href: string }) {
  return <Link href={useLocalizedHref(href)} {...rest} />
}

/** useRouter, whose push and replace stay in the current language. */
export function useLocaleRouter() {
  const router = useRouter()
  const locale = useLocale()
  // Stable per language, like useRouter's own result: callers list it in effect dependencies.
  return useMemo(() => ({
    ...router,
    push: (href: string, options?: Parameters<typeof router.push>[1]) => router.push(localizeHref(href, locale), options),
    replace: (href: string, options?: Parameters<typeof router.replace>[1]) => router.replace(localizeHref(href, locale), options),
  }), [router, locale])
}

/** Translated text, for use inside server components: <T>Browse journals</T>. */
export function T({ children, vars }: { children: string; vars?: Record<string, string | number> }) {
  return <>{useT()(children, vars)}</>
}

/**
 * Runs in <head>, before first paint:
 *   - on an unprefixed address that has a localized copy, a reader who
 *     chose another language goes straight to that copy (no English flash);
 *   - otherwise sets <html lang> from the address prefix, or else the saved
 *     choice, so CJK text gets the right fonts and glyph forms.
 */
export const LOCALE_BOOT_SCRIPT = `try{var L=${JSON.stringify(LOCALES.filter(l => l.path).map(l => [l.path, l.code, l.lang]))},X=${JSON.stringify(UNLOCALIZED_PATTERNS)},d=document.documentElement,u=location.pathname,p=u.split('/')[1],s=localStorage.getItem(${JSON.stringify(LOCALE_STORAGE_KEY)}),i,x,c=true;for(i=0;i<L.length;i++)if(L[i][0]===p)x=L[i];for(i=0;i<X.length;i++)if(new RegExp(X[i]).test(u))c=false;if(!x)for(i=0;i<L.length;i++)if(L[i][1]===s)x=L[i];if(x&&x[0]!==p&&c)location.replace('/'+x[0]+u+location.search+location.hash);else if(x)d.lang=x[2]}catch(e){}`

/**
 * Keeps the reader in their language. Mounted once, in the root layout:
 *   - on a prefixed address, saves that language;
 *   - a click on any internal link to an unprefixed page goes to the
 *     current language's copy instead (so links written inside page
 *     content, not only the navigation, stay in the language);
 *   - an in-app navigation that still lands on an unprefixed page with a
 *     localized copy is moved to that copy.
 */
export function KeepLocale() {
  const pathname = usePathname() || '/'
  const router = useRouter()
  const locale = useLocale()
  const fromPath = localeFromPath(pathname)
  const current = useRef(locale)

  useEffect(() => { if (fromPath) saveLocale(fromPath) }, [fromPath])
  useEffect(() => { current.current = locale; document.documentElement.lang = htmlLang(locale) }, [locale])

  useEffect(() => {
    if (!fromPath && locale !== DEFAULT_LOCALE && hasLocalizedCopy(pathname)) {
      router.replace(localizeHref(pathname + window.location.search + window.location.hash, locale))
    }
  }, [fromPath, locale, pathname, router])

  useEffect(() => {
    // Capture phase on window: runs before next/link's click handler, which
    // leaves a click alone once it is defaultPrevented.
    const onClick = (e: MouseEvent) => {
      const locale = current.current
      if (locale === DEFAULT_LOCALE || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as Element | null)?.closest?.('a')
      if (!a || a.hasAttribute('download') || a.hasAttribute('data-locale-switch') || (a.target && a.target !== '_self')) return
      const url = new URL(a.href, window.location.href)
      if (url.origin !== window.location.origin || localeFromPath(url.pathname) || !hasLocalizedCopy(url.pathname)) return
      e.preventDefault()
      router.push(localizeHref(url.pathname + url.search + url.hash, locale))
    }
    window.addEventListener('click', onClick, true)
    return () => window.removeEventListener('click', onClick, true)
  }, [router])

  return null
}

/** Header control: the five interface languages, each a link to this page in it. */
export function LanguageSwitcher({ inverted = false, align = 'right' }: { inverted?: boolean; align?: 'left' | 'right' }) {
  const locale = useLocale()
  const t = useT()
  const router = useRouter()
  const page = unlocalizedPath(usePathname() || '/')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = LOCALES.find(l => l.code === locale)!

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
          aria-label={t('Language')}
          className={`absolute ${align === 'left' ? 'left-0' : 'right-0'} top-full mt-1 z-50 min-w-[150px] py-1 text-[13px]`}
          style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderTop: '2px solid var(--teal)', boxShadow: '0 6px 18px rgba(15, 23, 32, 0.12)' }}
        >
          {LOCALES.map(l => (
            <li key={l.code}>
              <a
                href={localizeHref(page, l.code)}
                hrefLang={l.hreflang}
                lang={l.lang}
                data-locale-switch=""
                aria-current={l.code === locale ? 'true' : undefined}
                onClick={e => {
                  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
                  e.preventDefault()
                  saveLocale(l.code)
                  setOpen(false)
                  const target = localizeHref(page + window.location.search + window.location.hash, l.code)
                  if (target !== window.location.pathname + window.location.search + window.location.hash) router.push(target)
                }}
                className="w-full flex items-center justify-between gap-3 px-3 py-1.5 text-left transition-colors hover:bg-[var(--hover)]"
                style={{ color: 'var(--ink)', fontWeight: l.code === locale ? 600 : 400 }}
              >
                {l.label}
                {l.code === locale && <Check className="h-3.5 w-3.5" style={{ color: 'var(--teal)' }} aria-hidden />}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
