import { RankingsView, rankingsMetadata } from '@/components/views/RankingsView'

export const metadata = rankingsMetadata('en')

export default function Page() {
  return <RankingsView locale="en" />
}
