import { Suspense } from 'react'
import Link from 'next/link'
import { toIndexRecord } from '@/lib/records'
import { getAllRecords } from '@/lib/records-data'
import { RecordBrowser } from '@/components/RecordBrowser'
import { PageHeader, fmt } from '@/components/db'

export const metadata = {
  title: 'Sources',
  description: 'Search and filter every journal record in POSI: Core Collection, Global Benchmark and Discovered. Runs entirely in your browser against static open-data files.',
}

export default function JournalsPage() {
  const idx = getAllRecords().map(toIndexRecord)
  const expected = {
    core: idx.filter(r => r.k === 'core' || r.k === 'candidate').length,
    benchmark: idx.filter(r => r.k === 'benchmark').length,
    discovered: idx.filter(r => r.k === 'discovered').length,
  }

  return (
    <div className="wrap">
      <PageHeader
        title="Sources"
        crumbs={[{ label: 'POSI', href: '/' }, { label: 'Sources' }]}
        actions={<Link href="/datasets/" className="btn">Bulk download</Link>}
      >
        <p>
          {fmt(idx.length)} journals across three collections, each with published provenance. Search and filters run in your browser
          against the same files you can <Link href="/datasets/" className="link">download</Link>.
        </p>
      </PageHeader>
      <Suspense fallback={<BrowserSkeleton />}>
        <RecordBrowser expected={expected} />
      </Suspense>
    </div>
  )
}

function BrowserSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]" aria-hidden="true">
      <div className="hidden lg:block space-y-3">
        {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-4 rounded-[6px] animate-pulse" style={{ background: 'var(--surface-3)' }} />)}
      </div>
      <div className="space-y-3">
        <div className="h-16 rounded-[6px] animate-pulse" style={{ background: 'var(--surface-3)' }} />
        {Array.from({ length: 10 }).map((_, i) => <div key={i} className="h-11 rounded-[6px] animate-pulse" style={{ background: 'var(--surface-2)' }} />)}
      </div>
    </div>
  )
}
