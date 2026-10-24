import { Suspense } from 'react'
import { JournalProfileView } from '@/components/views/JournalProfileView'
import { journalProfileMetadata } from '@/components/views/journal-metadata'

export const metadata = journalProfileMetadata('zh-Hans')

export default function JournalProfilePage() {
  return (
    <div className="wrap">
      <Suspense fallback={null}>
        <JournalProfileView />
      </Suspense>
    </div>
  )
}
