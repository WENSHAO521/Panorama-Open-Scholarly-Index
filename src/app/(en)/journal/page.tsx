import { Suspense } from 'react'
import { JournalProfileView } from './JournalProfileView'

export const metadata = {
  title: 'Journal',
  description: 'Journal profile in the Panorama Open Scholarly Index: identifiers, publications and citations per year, subject, topics, and its evaluation: Core Collection status, AJR rating (Core Collection journals) and PNCI citation ranking.',
}

export default function JournalProfilePage() {
  return (
    <div className="wrap">
      <Suspense fallback={null}>
        <JournalProfileView />
      </Suspense>
    </div>
  )
}
