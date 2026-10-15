'use client'

import Link from 'next/link'
import { useEffect } from 'react'

// Shown in place of a page that failed in the browser, inside the site's
// header and footer, instead of the framework's bare error screen.
export default function PageError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div className="wrap py-24 max-w-2xl">
      <h1 className="text-[26px] font-semibold tracking-tight" style={{ color: 'var(--ink)' }}>This page stopped working</h1>
      <p className="mt-3 text-[16px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>
        Something went wrong while showing this page. Try again; if you are using your browser&rsquo;s translation,
        reloading the page and translating it again usually helps.
      </p>
      <div className="mt-8 flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary" onClick={() => retry()}>Try again</button>
        <button type="button" className="btn" onClick={() => window.location.reload()}>Reload the page</button>
        <Link href="/" className="btn">Home</Link>
      </div>
    </div>
  )
}
