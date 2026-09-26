import { Suspense } from 'react'
import { RecordViewer } from './RecordViewer'

export const metadata = {
  title: 'Discovered record',
  description: 'A journal record found in open registries and held by POSI, loaded from a static open-data shard.',
  robots: { index: false },
}

export default function RecordPage() {
  return (
    <div className="wrap">
      <Suspense fallback={null}>
        <RecordViewer />
      </Suspense>
    </div>
  )
}
