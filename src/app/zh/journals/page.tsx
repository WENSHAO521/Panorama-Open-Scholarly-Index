import { JournalsView, journalsMetadata } from '@/components/views/JournalsView'

export const metadata = journalsMetadata('zh-Hans')

export default function Page() {
  return <JournalsView locale="zh-Hans" />
}
