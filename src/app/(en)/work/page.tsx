import { Suspense } from 'react'
import { WorkViewer } from './WorkViewer'

export const metadata = {
  title: 'Publication',
  description: 'Publication details: authors, abstract, journal, citations and ready-made citations.',
}

export default function WorkPage() {
  return (
    <div className="wrap">
      <Suspense fallback={null}>
        <WorkViewer />
      </Suspense>
    </div>
  )
}
