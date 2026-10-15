import { Suspense } from 'react'
import { PublisherViewer } from './PublisherViewer'

export const metadata = {
  title: 'Publisher',
  description: 'A publisher with journals in POSI, loaded from a static open-data shard.',
  robots: { index: false },
}

export default function PublisherViewerPage() {
  return (
    <div className="wrap">
      <Suspense fallback={null}>
        <PublisherViewer />
      </Suspense>
    </div>
  )
}
