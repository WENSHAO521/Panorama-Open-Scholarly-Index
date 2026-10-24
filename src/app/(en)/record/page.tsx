import { Suspense } from 'react'
import { RecordViewer } from '@/components/views/RecordViewer'
import { recordMetadata } from '@/components/views/journal-metadata'

export const metadata = recordMetadata('en')

export default function RecordPage() {
  return (
    <div className="wrap">
      <Suspense fallback={null}>
        <RecordViewer />
      </Suspense>
    </div>
  )
}
