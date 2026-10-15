// The interface languages. English is the default and lives at the root of the site; every other language
// gets a path prefix (for example /zh/ for Simplified Chinese). A language is added here only together with
// its message file, so that `Record<Locale, …>` below stays complete.
export const LOCALES = ['en'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'en'

/** Path prefix of each language, without a trailing slash. English has none, so its addresses do not change. */
export const URL_PREFIX: Record<Locale, string> = { en: '' }

/** The `lang` attribute of the <html> element, also the hreflang value of the language's pages. */
export const HTML_LANG: Record<Locale, string> = { en: 'en' }

/** Each language's name in that language, as shown in the language switcher. Not translated. */
export const LANGUAGE_NAME: Record<Locale, string> = { en: 'English' }

/** Address of `href` (a path starting with "/") in the given language. */
export function localePath(locale: string, href: string, prefix: Record<string, string> = URL_PREFIX): string {
  return /^\/(?!\/)/.test(href) ? `${prefix[locale]}${href}` : href
}

/** The path without a language prefix: "/zh/journals/" becomes "/journals/". */
export function stripLocale(pathname: string, prefixes: Record<string, string> = URL_PREFIX): string {
  for (const prefix of Object.values(prefixes)) {
    if (prefix && (pathname === prefix || pathname.startsWith(`${prefix}/`))) return pathname.slice(prefix.length) || '/'
  }
  return pathname
}
