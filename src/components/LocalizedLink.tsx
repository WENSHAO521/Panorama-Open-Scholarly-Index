'use client'

import Link from 'next/link'
import type { ComponentProps } from 'react'
import { localePath, type Locale } from '@/i18n/config'
import { useLocale } from '@/i18n/LocaleProvider'

/**
 * next/link with a language's prefix on internal addresses: the current language's, or `locale` when given (the
 * language switcher). English has no prefix, so its addresses are unchanged.
 */
export function LocalizedLink({ href, locale, ...rest }: Omit<ComponentProps<typeof Link>, 'href'> & { href: string; locale?: Locale }) {
  const current = useLocale()
  return <Link href={localePath(locale ?? current, href)} {...rest} />
}
