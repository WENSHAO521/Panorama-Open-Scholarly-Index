import { notFound } from 'next/navigation'
import { HomePage } from '@/components/HomePage'
import { RememberLocale } from '@/components/I18n'
import { LOCALE_PATHS, localeFromSegment } from '@/lib/i18n/locales'
import { homeMetadata } from '@/lib/i18n/metadata'

// The home page in each interface language: /ja/, /ko/, /zh-cn/, /zh-tw/.
// English is the unprefixed /.
export const dynamicParams = false

export function generateStaticParams() {
  return LOCALE_PATHS.map(locale => ({ locale }))
}

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const locale = localeFromSegment((await props.params).locale)
  return locale ? homeMetadata(locale) : {}
}

export default async function Page(props: { params: Promise<{ locale: string }> }) {
  const locale = localeFromSegment((await props.params).locale)
  if (!locale) notFound()
  return (
    <>
      <RememberLocale locale={locale} />
      <HomePage locale={locale} />
    </>
  )
}
