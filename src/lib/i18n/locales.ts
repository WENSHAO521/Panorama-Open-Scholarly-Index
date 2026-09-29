// Interface languages. The site is a static export, so the language is a
// per-browser preference applied on the client: pages are built once, in
// English, and the chrome (navigation, search, home page) is translated
// after hydration. Record data (titles, publishers, subjects) stays as
// published by its source.
//
// Messages are keyed by the English source text, so an untranslated string
// simply falls back to English.

import ja from './messages/ja'
import ko from './messages/ko'
import zhHans from './messages/zh-Hans'
import zhHant from './messages/zh-Hant'

export const LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'zh-Hans', label: '简体中文' },
  { code: 'zh-Hant', label: '繁體中文' },
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

/** The BCP 47 tag for <html lang>. */
export function htmlLang(locale: Locale): string {
  return locale === 'zh-Hans' ? 'zh-CN' : locale === 'zh-Hant' ? 'zh-TW' : locale
}
