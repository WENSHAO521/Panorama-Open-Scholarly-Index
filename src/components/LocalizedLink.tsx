'use client'

import Link from 'next/link'
import type { ComponentProps } from 'react'
import { localePath } from '@/i18n/config'
import { useLocale } from '@/i18n/LocaleProvider'

/** next/link with the current language's prefix on internal addresses (none in English, so its addresses are unchanged). */
export function LocalizedLink({ href, ...rest }: Omit<ComponentProps<typeof Link>, 'href'> & { href: string }) {
  const locale = useLocale()
  return <Link href={localePath(locale, href)} {...rest} />
}
