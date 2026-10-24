'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Translate } from '@phosphor-icons/react/dist/ssr'
import { DEFAULT_LOCALE, HTML_LANG, LANGUAGE_NAME, LOCALES, stripLocale, type Locale } from '@/i18n/config'
import { availableLocales, localizedHref, viewerHref } from '@/i18n/alternates'
import { useLocale, useMessages } from '@/i18n/LocaleProvider'
import { LocalizedLink } from './LocalizedLink'

// The narrow-screen label, so the switch fits beside the logo and the menu button.
const SHORT_NAME: Record<Locale, string> = { en: 'EN', 'zh-Hans': '中文' }

/**
 * Language switch in the header bar: one link to the other language, named in that language. It goes to the same page
 * in that language when the page is translated, or to the viewer that shows it in that language (a publisher or journal
 * record page, see viewerHref), otherwise to that language's home page (see TRANSLATED_PATHS), so a reader can always
 * reach the other interface from wherever they are. On the same page the query string goes along,
 * since pages such as the journal profile (/journal/?issn=…) are chosen by it.
 */
export function LanguageSwitcher() {
  const { header } = useMessages()
  const locale = useLocale()
  const router = useRouter()
  const path = stripLocale(usePathname() || '/')
  const here = availableLocales(path) as Locale[] // the registry only lists the languages in config
  // With two languages, the other one; English from any other language.
  const other = locale === DEFAULT_LOCALE ? LOCALES.find(l => l !== DEFAULT_LOCALE) : DEFAULT_LOCALE
  if (!other) return null
  const target = here.includes(other) ? path : viewerHref(other, path) ?? '/'
  return (
    <LocalizedLink
      href={target}
      locale={other}
      lang={HTML_LANG[other]}
      hrefLang={HTML_LANG[other]}
      aria-label={`${header.language}: ${LANGUAGE_NAME[other]}`}
      title={LANGUAGE_NAME[other]}
      className="inline-flex h-7 items-center gap-1.5 px-2 sm:px-2.5 rounded-[var(--radius)] text-[13px] font-medium whitespace-nowrap transition-colors hover:bg-[var(--hover)] hover:text-[var(--ink)]"
      style={{ border: '1px solid var(--line)', color: 'var(--ink-2)' }}
      onClick={e => {
        const { search, hash } = window.location
        if (target !== path || !(search || hash) || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
        e.preventDefault()
        router.push(`${localizedHref(other, target)}${search}${hash}`)
      }}
    >
      <Translate className="h-3.5 w-3.5" aria-hidden="true" />
      <span className="hidden sm:inline">{LANGUAGE_NAME[other]}</span>
      <span className="sm:hidden">{SHORT_NAME[other]}</span>
    </LocalizedLink>
  )
}
