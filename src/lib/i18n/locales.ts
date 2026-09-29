// Interface languages.
//
// Localized pages have their own addresses under a language prefix
// (/ja/, /ko/, /zh-cn/, /zh-tw/); English is unprefixed. Only pages whose
// content is translated get a prefixed copy: the site is a static export
// close to Cloudflare Pages' file limit, so the thousands of record pages
// exist once. On those, the interface chrome (navigation, search, footer)
// follows the reader's saved language; record data (titles, publishers,
// subjects) stays as published by its source.
//
// Messages are keyed by the English source text, so an untranslated string
// simply falls back to English.

import ja from './messages/ja.ts'
import ko from './messages/ko.ts'
import zhHans from './messages/zh-Hans.ts'
import zhHant from './messages/zh-Hant.ts'

// path: the URL prefix. lang: <html lang>, which also picks the CJK fonts
// in globals.css. hreflang: the alternate-language tag for search engines.
export const LOCALES = [
  { code: 'en', label: 'English', path: '', lang: 'en', hreflang: 'en', og: 'en_US' },
  { code: 'ja', label: '日本語', path: 'ja', lang: 'ja', hreflang: 'ja', og: 'ja_JP' },
  { code: 'ko', label: '한국어', path: 'ko', lang: 'ko', hreflang: 'ko', og: 'ko_KR' },
  { code: 'zh-Hans', label: '简体中文', path: 'zh-cn', lang: 'zh-CN', hreflang: 'zh-Hans', og: 'zh_CN' },
  { code: 'zh-Hant', label: '繁體中文', path: 'zh-tw', lang: 'zh-TW', hreflang: 'zh-Hant', og: 'zh_TW' },
] as const

export type Locale = typeof LOCALES[number]['code']
export type Messages = Record<string, string>

export const DEFAULT_LOCALE: Locale = 'en'
export const LOCALE_STORAGE_KEY = 'posi-locale'

const MESSAGES: Record<Locale, Messages> = { en: {}, ja, ko, 'zh-Hans': zhHans, 'zh-Hant': zhHant }

export function isLocale(v: unknown): v is Locale {
  return LOCALES.some(l => l.code === v)
}

/** Translate an English source string; `{name}` placeholders are filled from `vars`. */
export function translate(locale: Locale, text: string, vars?: Record<string, string | number>): string {
  let out = MESSAGES[locale][text] ?? text
  if (vars) for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{${k}}`, String(v))
  return out
}

export type LocaleInfo = typeof LOCALES[number]

export function localeInfo(locale: Locale): LocaleInfo {
  return LOCALES.find(l => l.code === locale)!
}

/** The BCP 47 tag for <html lang>. */
export function htmlLang(locale: Locale): string {
  return localeInfo(locale).lang
}

/** The prefixed locales, as the [locale] route segment spells them. */
export const LOCALE_PATHS = LOCALES.filter(l => l.path).map(l => l.path)

/** The locale a URL prefix names ("zh-cn" -> zh-Hans), or null for none. */
export function localeFromSegment(segment: string | undefined): Locale | null {
  const l = LOCALES.find(x => x.path && x.path === segment?.toLowerCase())
  return l ? l.code : null
}

/** The locale an address belongs to, from its first path segment. */
export function localeFromPath(pathname: string): Locale | null {
  return localeFromSegment(pathname.split('/')[1])
}

/**
 * Pages that have a translated copy under each prefix. The switcher moves
 * between these copies; every other page keeps its one address.
 */
export const LOCALIZED_PAGES = ['/']

/** A localized page's address in a language: localizedPath('/', 'ja') -> '/ja/'. */
export function localizedPath(page: string, locale: Locale): string {
  const { path } = localeInfo(locale)
  return path ? `/${path}${page}` : page
}

/** Strip a language prefix: '/zh-cn/' -> '/'. */
export function unlocalizedPath(pathname: string): string {
  return localeFromPath(pathname) ? pathname.replace(/^\/[^/]+/, '') || '/' : pathname
}
