import { notFound } from 'next/navigation'
import { HomePage } from '@/components/HomePage'
import { localeFromSegment } from '@/lib/i18n/locales'
import { homeMetadata } from '@/lib/i18n/metadata'

// The home page in each interface language, translated in full, so each
// copy is its own canonical address (unlike the generated copies).
export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const locale = localeFromSegment((await props.params).locale)
  return locale ? homeMetadata(locale) : {}
}

export default async function Page(props: { params: Promise<{ locale: string }> }) {
  const locale = localeFromSegment((await props.params).locale)
  if (!locale) notFound()
  return <HomePage locale={locale} />
}
