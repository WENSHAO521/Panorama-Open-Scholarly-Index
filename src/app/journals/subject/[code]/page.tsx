import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDirectoryCategories, categoryFiles, categoryLabel } from '@/lib/global-journals'
import { CategoryJournals } from '@/components/CategoryJournals'
import { PageHeader, fmt } from '@/components/db'

export const dynamicParams = false

export function generateStaticParams() {
  return getDirectoryCategories().filter(c => c.count > 0).map(c => ({ code: c.code }))
}

export async function generateMetadata(props: { params: Promise<{ code: string }> }) {
  const { code } = await props.params
  return { title: `${categoryLabel(code)} journals`, description: `Every journal indexed in POSI in ${categoryLabel(code)}.` }
}

export default async function SubjectJournalsPage(props: { params: Promise<{ code: string }> }) {
  const { code } = await props.params
  const cat = getDirectoryCategories().find(c => c.code === code)
  if (!cat || !cat.count) notFound()

  return (
    <div className="wrap pb-10">
      <PageHeader
        title={cat.name}
        crumbs={[{ label: 'POSI', href: '/' }, { label: 'Journals', href: '/journals/' }, { label: code === 'unclassified' ? 'Not yet classified' : code === 'multidisciplinary' ? 'Multidisciplinary' : code }]}
        actions={code !== 'unclassified' && code !== 'multidisciplinary' ? <Link href={`/rankings/${code}/`} className="btn">Rankings in this category</Link> : undefined}
      >
        <p className="max-w-[68ch]">
          {fmt(cat.count)} indexed journals{cat.core ? `, ${cat.core} in the Core Collection` : ''}.
          {code === 'unclassified'
            ? ' These journals have no subject profile yet, usually because they are registered with Crossref but not described by OpenAlex.'
            : code === 'multidisciplinary'
              ? ' General journals whose output spans several fields, such as Science, Nature and The Lancet. They are not ranked within a single subject category.'
              : ` ${cat.domainName}.`}
        </p>
      </PageHeader>
      <Suspense fallback={<TableSkeleton />}>
        <CategoryJournals code={code} files={categoryFiles(code)} total={cat.count} />
      </Suspense>
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      <div className="h-16 rounded-[6px] animate-pulse" style={{ background: 'var(--surface-3)' }} />
      {Array.from({ length: 10 }).map((_, i) => <div key={i} className="h-11 rounded-[6px] animate-pulse" style={{ background: 'var(--surface-2)' }} />)}
    </div>
  )
}
