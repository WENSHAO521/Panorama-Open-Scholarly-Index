// Which languages a page exists in, and the metadata that says so (hreflang) and the switcher shows.
// A language is listed for a path only when that page has been translated, so no hreflang or switcher
// entry ever points at a 404. English, the default, has every page.
import { DEFAULT_LOCALE, HTML_LANG, LOCALES, URL_PREFIX, localePath, type Locale } from './config.ts'
import CORE_JOURNAL_CODES from './core-journal-codes.json' with { type: 'json' }
import { ANNOUNCEMENTS } from '../lib/announcements.ts'

/** The languages and what is translated; a parameter of the functions below only so tests can use a second language. */
export interface LocaleTable {
  locales: readonly string[]
  defaultLocale: string
  prefix: Record<string, string>
  htmlLang: Record<string, string>
  /** Paths (as in site-nav, with a trailing slash) translated into each language; `null` means every path. */
  translated: Record<string, readonly string[] | null>
  /** Sections translated whole: every path under one of these exists in the language too. */
  translatedSections?: Record<string, readonly string[]>
}

/**
 * The pages translated so far. A path is added here in the same change that adds its page under the language's
 * route group (src/app/zh/…), so the switcher, hreflang and the sitemap pick it up together.
 */
export const TRANSLATED_PATHS: Record<Locale, readonly string[] | null> = {
  en: null,
  'zh-Hans': ['/', '/journals/', '/journals/open-access/', '/subjects/', '/publishers/', '/rankings/', '/core-collection/', '/publications/', '/certificate/', '/certificate/zone/', '/cite/', '/datasets/', '/certification/', '/logos/', '/about/', '/methodology/', '/psg-format/', '/privacy/', '/editorial-policy/', '/terms/', '/docs/provenance/', '/docs/certificates/', '/docs/schema/', '/docs/data/', '/docs/', '/ratings/early-stage/', '/ratings/mature/', '/ratings/', '/responsible-use/', '/grades/', '/pqf/', '/pci/', '/coi/', '/contact/',
    // Journal pages: the profile and the Discovered record viewer (one page each, chosen by the query string), and
    // the static record pages of the Core Collection journals. The other records with a static English page (about
    // 1,000) are shown in Chinese by the record viewer (see localizedHref): static copies would pass the file limit.
    '/journal/', '/record/', ...CORE_JOURNAL_CODES.map(c => `/journal/${c}/`),
    // The publisher viewer, which shows every publisher in Chinese (the 500 static English publisher pages have no
    // Chinese copies, see VIEWERS), and the publication page.
    '/publisher/', '/work/',
    // The News list, and the News items that carry a Chinese version (the others are English only).
    '/announcements/', ...ANNOUNCEMENTS.filter(a => a.zh).map(a => `/announcements/${a.slug}/`)],
}

/**
 * Sections whose pages are all translated: their Chinese routes take the same parameters as the English ones, so a
 * page under them exists in both languages. The Citation Ranking (categories, editions and each edition's
 * categories) and the journal list of each subject category.
 */
export const TRANSLATED_SECTIONS: Record<Locale, readonly string[]> = {
  en: [],
  'zh-Hans': ['/rankings/', '/journals/subject/'],
}

/**
 * Static English pages whose set is too large to copy into every language (the deploy has a file limit). A language
 * shows them in one viewer page that builds the page in the browser from the record's data file, chosen by the query
 * string: a link to such a page from a translated page goes to the viewer when the viewer is translated.
 */
const VIEWERS: { pattern: RegExp; viewer: string; key: string }[] = [
  // The journal records outside the Core Collection (about 1,000).
  { pattern: /^\/journal\/([^/?#]+)\/$/, viewer: '/record/', key: 'code' },
  // The 500 largest publishers.
  { pattern: /^\/publishers\/([^/?#]+)\/$/, viewer: '/publisher/', key: 'id' },
]

export const LOCALE_TABLE: LocaleTable = {
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  prefix: URL_PREFIX,
  htmlLang: HTML_LANG,
  translated: TRANSLATED_PATHS,
  translatedSections: TRANSLATED_SECTIONS,
}

/** Whether the page at `path` (no language prefix, no query) exists in `locale`. */
function isTranslated(locale: string, path: string, table: LocaleTable): boolean {
  const list = table.translated[locale]
  return list === null || !!list?.includes(path) || !!table.translatedSections?.[locale]?.some(s => path.startsWith(s))
}

/** The languages `path` (without a language prefix) exists in, the default language first. */
export function availableLocales(path: string, table: LocaleTable = LOCALE_TABLE): string[] {
  const has = (l: string) => isTranslated(l, path, table)
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
  if (isTranslated(locale, path, table)) return localePath(locale, href, table.prefix)
  const viewer = viewerHref(locale, href, table)
  return viewer ? localePath(locale, viewer, table.prefix) : href
}

/**
 * The address (without a language prefix) of the viewer page that shows `href` in `locale`, when `href` is one of
 * the static English pages listed in VIEWERS and that viewer is translated; otherwise null.
 */
export function viewerHref(locale: string, href: string, table: LocaleTable = LOCALE_TABLE): string | null {
  const path = href.replace(/[?#].*$/, '')
  for (const v of VIEWERS) {
    const m = path.match(v.pattern)
    if (m && isTranslated(locale, v.viewer, table)) return `${v.viewer}?${v.key}=${m[1]}${href.slice(path.length).replace(/^\?/, '&')}`
  }
  return null
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
