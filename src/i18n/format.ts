// Small formatting helpers for translated text.
import type { Locale } from './config.ts'
import { PSC_ZH_HANS } from './psc-zh-Hans.ts'

/** Fills `{name}` placeholders in a message. */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m))
}

/** A calendar date (YYYY-MM-DD) as the language writes it: "12 Oct 2026", "2026年10月12日". */
export function formatDate(locale: Locale, date: string): string {
  const d = new Date(`${date}T00:00:00Z`)
  return locale === 'zh-Hans'
    ? d.toLocaleDateString('zh-Hans-CN', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

/** A month (from a YYYY-MM-DD date) as the language writes it: "October 2026", "2026年10月". */
export function formatMonth(locale: Locale, date: string): string {
  const d = new Date(`${date}T00:00:00Z`)
  return d.toLocaleDateString(locale === 'zh-Hans' ? 'zh-Hans-CN' : 'en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })
}

/**
 * The name of a PSC subject category (or domain) in the language; `english` is the name the data carries, used for
 * English and for any code without a translation. The codes (P1.01 …) are the same in every language.
 */
export function subjectName(locale: Locale, code: string, english: string): string {
  return locale === 'zh-Hans' ? PSC_ZH_HANS[code] ?? english : english
}
