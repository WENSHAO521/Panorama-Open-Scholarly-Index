import type { Metadata } from 'next'
import { LOCALES, localeInfo, localizedPath, translate, type Locale } from './locales'

const SITE_NAME = 'Panorama Open Scholarly Index (POSI)'

/** hreflang alternates for a localized page, x-default being the English copy. */
export function languageAlternates(page: string): Record<string, string> {
  return {
    ...Object.fromEntries(LOCALES.map(l => [l.hreflang, localizedPath(page, l.code)])),
    'x-default': page,
  }
}

/** Title, description, canonical address and alternates of the home page in one language. */
export function homeMetadata(locale: Locale): Metadata {
  const t = (s: string) => translate(locale, s)
  const title = locale === 'en' ? SITE_NAME : `${SITE_NAME} · ${t('Citation index and journal rankings')}`
  const description = t('The Panorama Open Scholarly Index, published by Panorama Scholarly Group Ltd: publications, journals, journal rankings and certificates of indexing.')
  const url = localizedPath('/', locale)
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url, languages: languageAlternates('/') },
    openGraph: {
      type: 'website',
      url,
      siteName: 'POSI - Panorama Open Scholarly Index',
      title,
      description,
      locale: localeInfo(locale).og,
      alternateLocale: LOCALES.filter(l => l.code !== locale).map(l => l.og),
    },
  }
}
