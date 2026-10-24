import { notFound } from 'next/navigation'
import { getEdition } from '@/lib/ranking-editions'
import { RankingsOverview } from '@/components/RankingViews'
import { editionMetadata, editionParams } from '@/components/views/ranking-pages'

export const dynamicParams = false

export function generateStaticParams() {
  return editionParams()
}

export async function generateMetadata(props: { params: Promise<{ year: string }> }) {
  const { year } = await props.params
  return editionMetadata(year, 'zh-Hans')
}

export default async function EditionPage(props: { params: Promise<{ year: string }> }) {
  const { year } = await props.params
  const e = getEdition(Number(year))
  if (!e) notFound()
  return <RankingsOverview e={e} byYear locale="zh-Hans" />
}
