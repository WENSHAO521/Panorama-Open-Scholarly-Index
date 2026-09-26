import { Suspense } from 'react'
import { SourceViewer } from './SourceViewer'

export const metadata = {
  title: 'Journal',
  description: 'An indexed journal: identifiers, coverage, works per year and topics from open registry data, read live in your browser.',
}

export default function SourcePage() {
  return (
    <div className="wrap pb-10">
      <Suspense fallback={null}>
        <SourceViewer />
      </Suspense>
    </div>
  )
}
