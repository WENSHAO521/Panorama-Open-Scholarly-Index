import { notFound } from 'next/navigation'
import { editionCategories, getEdition } from '@/lib/ranking-editions'
import { CategoryRankingView } from '@/components/RankingViews'
import { editionCategoryMetadata, editionCategoryParams } from '@/components/views/ranking-pages'

export const dynamicParams = false

export function generateStaticParams() {
  return editionCategoryParams()
}

export async function generateMetadata(props: { params: Promise<{ year: string; code: string }> }) {
  const { year, code } = await props.params
  return editionCategoryMetadata(year, code, 'en')
}

export default async function EditionCategoryPage(props: { params: Promise<{ year: string; code: string }> }) {
  const { year, code } = await props.params
  const e = getEdition(Number(year))
  if (!e || (code !== 'all' && !editionCategories(e).some(x => x.code === code))) notFound()
  return <CategoryRankingView e={e} code={code} byYear locale="en" />
}
