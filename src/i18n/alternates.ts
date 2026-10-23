// Which languages a page exists in, and the metadata that says so (hreflang) and the switcher shows.
// A language is listed for a path only when that page has been translated, so no hreflang or switcher
// entry ever points at a 404. English, the default, has every page.
import { DEFAULT_LOCALE, HTML_LANG, LOCALES, URL_PREFIX, localePath, type Locale } from './config.ts'

/** The languages and what is translated; a parameter of the functions below only so tests can use a second language. */
export interface LocaleTable {
  locales: readonly string[]
  defaultLocale: string
  prefix: Record<string, string>
  htmlLang: Record<string, string>
  /** Paths (as in site-nav, with a trailing slash) translated into each language; `null` means every path. */
  translated: Record<string, readonly string[] | null>
}

/**
 * The pages translated so far. A path is added here in the same change that adds its page under the language's
 * route group (src/app/zh/…), so the switcher, hreflang and the sitemap pick it up together.
 */
export const TRANSLATED_PATHS: Record<Locale, readonly string[] | null> = {
  en: null,
  'zh-Hans': ['/', '/journals/', '/journals/open-access/', '/subjects/', '/publishers/', '/rankings/', '/core-collection/', '/publications/'],
}

export const LOCALE_TABLE: LocaleTable = {
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  prefix: URL_PREFIX,
  htmlLang: HTML_LANG,
  translated: TRANSLATED_PATHS,
}

/** The languages `path` (without a language prefix) exists in, the default language first. */
export function availableLocales(path: string, table: LocaleTable = LOCALE_TABLE): string[] {
  const has = (l: string) => table.translated[l] === null || table.translated[l].includes(path)
  return [table.defaultLocale, ...table.locales.filter(l => l !== table.defaultLocale)].filter(has)
}

/**
 * Where an internal link on a page in `locale` goes: the page in that language when it has been translated, otherwise
 * the English original (the published plan: until a page is translated, the Chinese interface links to it in English).
 * External and relative addresses are returned unchanged.
 */
export function localizedHref(locale: string, href: string, table: LocaleTable = LOCALE_TABLE): string {
  if (!/^\/(?!\/)/.test(href)) return href
  const path = href.replace(/[?#].*$/, '')
  const translated = table.translated[locale]
  return translated === null || translated?.includes(path) ? localePath(locale, href, table.prefix) : href
}

/**
 * The `alternates` of a page's metadata: its canonical address in `locale` (English by default), and, when the page
 * exists in more than one language, the address in each language and the default one for x-default.
 * `path` is the page's address without a language prefix.
 */
export function pageAlternates(path: string, locale?: string, table: LocaleTable = LOCALE_TABLE): { canonical: string; languages?: Record<string, string> } {
  const canonical = `${table.prefix[locale ?? table.defaultLocale]}${path}`
  const here = availableLocales(path, table)
  if (here.length < 2) return { canonical }
  const languages: Record<string, string> = {}
  for (const l of here) languages[table.htmlLang[l]] = `${table.prefix[l]}${path}`
  languages['x-default'] = `${table.prefix[table.defaultLocale]}${path}`
  return { canonical, languages }
}

/** The `alternates.languages` of a sitemap entry (absolute addresses), or undefined when the page has one language. */
export function sitemapLanguages(path: string, base: string, table: LocaleTable = LOCALE_TABLE): Record<string, string> | undefined {
  const languages = pageAlternates(path, undefined, table).languages
  if (!languages) return undefined
  return Object.fromEntries(Object.entries(languages).map(([k, v]) => [k, `${base}${v}`]))
}
