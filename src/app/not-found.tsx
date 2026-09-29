import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="wrap py-24 max-w-2xl">
      <p className="font-mono text-[13px]" style={{ color: 'var(--muted)' }}>404</p>
      <h1 className="mt-2 text-[26px] font-semibold tracking-tight" style={{ color: 'var(--ink)' }}>This page is not in the index</h1>
      <p className="mt-3 text-[16px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>
        The address may have moved during the redesign. Search publications and journals, or start from the documentation.
      </p>
      <div className="mt-8 flex flex-wrap gap-2">
        <Link href="/publications/" className="btn btn-primary">Search publications</Link>
        <Link href="/journals/" className="btn">Browse sources</Link>
        <Link href="/docs/" className="btn">Documentation</Link>
      </div>
    </div>
  )
}
