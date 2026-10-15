'use client'

import { usePathname } from 'next/navigation'
import { HTML_LANG, LANGUAGE_NAME, stripLocale, type Locale } from '@/i18n/config'
import { availableLocales } from '@/i18n/alternates'
import { useLocale, useMessages } from '@/i18n/LocaleProvider'
import { LocalizedLink } from './LocalizedLink'

/**
 * Language switch for the current page: the languages the page exists in, each named in its own language.
 * With one language (all there is until the first translated page) it shows that language's name and nothing to
 * click; the link to another language appears with the page's translation (see TRANSLATED_PATHS).
 */
export function LanguageSwitcher({ onBand = false }: { onBand?: boolean }) {
  const { header } = useMessages()
  const locale = useLocale()
  const path = stripLocale(usePathname() || '/')
  const here = availableLocales(path) as Locale[] // the registry only lists the languages in config
  const muted = onBand ? 'var(--band-muted)' : 'var(--muted)'
  const ink = onBand ? 'var(--band-ink)' : 'var(--ink)'
  return (
    <span role="group" aria-label={header.language} className="inline-flex items-center gap-3 text-[12px]">
      {here.map(l => l === locale ? (
        <span key={l} lang={HTML_LANG[l]} aria-current="true" className="font-medium" style={{ color: ink }}>{LANGUAGE_NAME[l]}</span>
      ) : (
        <LocalizedLink key={l} href={path} locale={l} lang={HTML_LANG[l]} hrefLang={HTML_LANG[l]} className="hover:underline" style={{ color: muted }}>{LANGUAGE_NAME[l]}</LocalizedLink>
      ))}
    </span>
  )
}
