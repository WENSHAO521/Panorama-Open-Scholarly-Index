// Which languages a page exists in, and the metadata that says so (hreflang) and the switcher shows.
// A language is listed for a path only when that page has been translated, so no hreflang or switcher
// entry ever points at a 404. English, the default, has every page.
import { DEFAULT_LOCALE, HTML_LANG, LOCALES, URL_PREFIX, type Locale } from './config.ts'

export interface LocaleTable<L extends string = Locale> {
  locales: readonly L[]
  defaultLocale: L
  prefix: Record<L, string>
  htmlLang: Record<L, string>
  /** Paths (as in site-nav, with a trailing slash) translated into each language; `null` means every path. */
  translated: Record<L, readonly string[] | null>
}

/**
 * The pages translated so far. A path is added here in the same change that adds its page under the language's
 * route group (src/app/zh/…), so the switcher, hreflang and the sitemap pick it up together.
 */
export const TRANSLATED_PATHS: Record<Locale, readonly string[] | null> = { en: null }

export const LOCALE_TABLE: LocaleTable = {
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  prefix: URL_PREFIX,
  htmlLang: HTML_LANG,
  translated: TRANSLATED_PATHS,
}

/** The languages `path` (without a language prefix) exists in, the default language first. */
export function availableLocales<L extends string = Locale>(path: string, table: LocaleTable<L> = LOCALE_TABLE as unknown as LocaleTable<L>): L[] {
  const has = (l: L) => table.translated[l] === null || table.translated[l].includes(path)
  return [table.defaultLocale, ...table.locales.filter(l => l !== table.defaultLocale)].filter(has)
}

/**
 * The `alternates` of a page's metadata: its canonical address in `locale` (English by default), and, when the page
 * exists in more than one language, the address in each language and the default one for x-default.
 * `path` is the page's address without a language prefix.
 */
export function pageAlternates<L extends string = Locale>(path: string, locale?: L, table: LocaleTable<L> = LOCALE_TABLE as unknown as LocaleTable<L>): { canonical: string; languages?: Record<string, string> } {
  const canonical = `${table.prefix[locale ?? table.defaultLocale]}${path}`
  const here = availableLocales(path, table)
  if (here.length < 2) return { canonical }
  const languages: Record<string, string> = {}
  for (const l of here) languages[table.htmlLang[l]] = `${table.prefix[l]}${path}`
  languages['x-default'] = `${table.prefix[table.defaultLocale]}${path}`
  return { canonical, languages }
}

/** The `alternates.languages` of a sitemap entry (absolute addresses), or undefined when the page has one language. */
export function sitemapLanguages<L extends string = Locale>(path: string, base: string, table: LocaleTable<L> = LOCALE_TABLE as unknown as LocaleTable<L>): Record<string, string> | undefined {
  const languages = pageAlternates(path, undefined, table).languages
  if (!languages) return undefined
  return Object.fromEntries(Object.entries(languages).map(([k, v]) => [k, `${base}${v}`]))
}
