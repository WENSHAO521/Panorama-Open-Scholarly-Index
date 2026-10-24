'use client'

import Link from 'next/link'
import { useEffect } from 'react'

// Shown in place of a Chinese page that failed in the browser, inside the site's header and footer (as the English
// error page).
export default function PageError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div className="wrap py-24 max-w-2xl">
      <h1 className="text-[26px] font-semibold tracking-tight" style={{ color: 'var(--ink)' }}>页面出错了</h1>
      <p className="mt-3 text-[16px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>
        显示此页面时出现问题。请重试；如果您正在使用浏览器的翻译功能，刷新页面后重新翻译通常可以解决。
      </p>
      <div className="mt-8 flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary" onClick={() => retry()}>重试</button>
        <button type="button" className="btn" onClick={() => window.location.reload()}>刷新页面</button>
        <Link href="/zh/" className="btn">首页</Link>
      </div>
    </div>
  )
}
