'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { localizedHref } from '@/i18n/alternates'
import type { Locale } from '@/i18n/config'

type Text = { title: string; body: string; searchPublications: string; browseSources: string; documentation: string }

/**
 * The 404 page's text. The host serves one 404.html for every unknown address, so the page is built in English and
 * shows the Chinese text in the browser when the address is under /zh/.
 */
export function NotFoundBody({ text }: { text: Record<Locale, Text> }) {
  const [locale, setLocale] = useState<Locale>('en')
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the address is known only in the browser
    if (/^\/zh(\/|$)/.test(window.location.pathname)) setLocale('zh-Hans')
  }, [])
  const t = text[locale]
  const href = (p: string) => localizedHref(locale, p)
  return (
    <div className="wrap py-24 max-w-2xl" lang={locale === 'zh-Hans' ? 'zh-Hans' : undefined}>
      <p className="font-mono text-[13px]" style={{ color: 'var(--muted)' }}>404</p>
      <h1 className="mt-2 text-[26px] font-semibold tracking-tight" style={{ color: 'var(--ink)' }}>{t.title}</h1>
      <p className="mt-3 text-[16px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>{t.body}</p>
      <div className="mt-8 flex flex-wrap gap-2">
        <Link href={href('/publications/')} className="btn btn-primary">{t.searchPublications}</Link>
        <Link href={href('/journals/')} className="btn">{t.browseSources}</Link>
        <Link href={href('/docs/')} className="btn">{t.documentation}</Link>
      </div>
    </div>
  )
}
