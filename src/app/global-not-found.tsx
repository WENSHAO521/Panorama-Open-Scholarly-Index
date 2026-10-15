// The one 404 page. With a root layout per language there is no single layout to render a
// not-found.tsx inside, and the host serves the same 404.html for every unknown address.
import { RootShell } from '@/components/RootShell'
import { LocalizedLink } from '@/components/LocalizedLink'
import { getMessages } from '@/i18n'
import { siteMetadata, siteViewport } from './site-metadata'

export const metadata = siteMetadata
export const viewport = siteViewport

export default function GlobalNotFound() {
  const m = getMessages('en')
  return (
    <RootShell locale="en">
      <div className="wrap py-24 max-w-2xl">
        <p className="font-mono text-[13px]" style={{ color: 'var(--muted)' }}>404</p>
        <h1 className="mt-2 text-[26px] font-semibold tracking-tight" style={{ color: 'var(--ink)' }}>{m.notFound.title}</h1>
        <p className="mt-3 text-[16px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>
          {m.notFound.body}
        </p>
        <div className="mt-8 flex flex-wrap gap-2">
          <LocalizedLink href="/publications/" className="btn btn-primary">{m.notFound.searchPublications}</LocalizedLink>
          <LocalizedLink href="/journals/" className="btn">{m.notFound.browseSources}</LocalizedLink>
          <LocalizedLink href="/docs/" className="btn">{m.common.documentation}</LocalizedLink>
        </div>
      </div>
    </RootShell>
  )
}
