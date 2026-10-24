import { notFound } from 'next/navigation'
import { getCategories, getRankings } from '@/lib/rankings'
import { getEdition } from '@/lib/ranking-editions'
import { CategoryRankingView } from '@/components/RankingViews'
import { categoryMetadata, categoryParams } from '@/components/views/ranking-pages'

export const dynamicParams = false

export function generateStaticParams() {
  return categoryParams()
}

export async function generateMetadata(props: { params: Promise<{ code: string }> }) {
  const { code } = await props.params
  return categoryMetadata(code, 'en')
}

export default async function CategoryRankingPage(props: { params: Promise<{ code: string }> }) {
  const { code } = await props.params
  if (code !== 'all' && !getCategories().some(x => x.code === code)) notFound()
  return <CategoryRankingView e={getEdition(getRankings().year)!} code={code} locale="en" />
}
