// The one 404 page. With a root layout per language there is no single layout to render a
// not-found.tsx inside, and the host serves the same 404.html for every unknown address.
import { RootShell } from '@/components/RootShell'
import { NotFoundBody } from '@/components/NotFoundBody'
import { getMessages } from '@/i18n'
import { siteMetadata, siteViewport } from './site-metadata'

export const metadata = siteMetadata
export const viewport = siteViewport

export default function GlobalNotFound() {
  const text = (l: 'en' | 'zh-Hans') => { const m = getMessages(l); return { ...m.notFound, documentation: m.common.documentation } }
  return (
    <RootShell locale="en">
      <NotFoundBody text={{ en: text('en'), 'zh-Hans': text('zh-Hans') }} />
    </RootShell>
  )
}
