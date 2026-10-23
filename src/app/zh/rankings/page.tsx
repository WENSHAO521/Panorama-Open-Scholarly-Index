import { RankingsView, rankingsMetadata } from '@/components/views/RankingsView'

export const metadata = rankingsMetadata('zh-Hans')

export default function Page() {
  return <RankingsView locale="zh-Hans" />
}
