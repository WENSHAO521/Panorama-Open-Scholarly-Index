import { JournalsView, journalsMetadata } from '@/components/views/JournalsView'

export const metadata = journalsMetadata('en')

export default function Page() {
  return <JournalsView locale="en" />
}
