import { LocaleLink, T } from '@/components/I18n'

export default function NotFound() {
  return (
    <div className="wrap py-24 max-w-2xl">
      <p className="font-mono text-[13px]" style={{ color: 'var(--muted)' }}>404</p>
      <h1 className="mt-2 text-[26px] font-semibold tracking-tight" style={{ color: 'var(--ink)' }}><T>This page is not in the index</T></h1>
      <p className="mt-3 text-[16px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>
        <T>The address may have moved during the redesign. Search publications and journals, or start from the documentation.</T>
      </p>
      <div className="mt-8 flex flex-wrap gap-2">
        <LocaleLink href="/publications/" className="btn btn-primary"><T>Search publications</T></LocaleLink>
        <LocaleLink href="/journals/" className="btn"><T>Browse sources</T></LocaleLink>
        <LocaleLink href="/docs/" className="btn"><T>Documentation</T></LocaleLink>
      </div>
    </div>
  )
}
