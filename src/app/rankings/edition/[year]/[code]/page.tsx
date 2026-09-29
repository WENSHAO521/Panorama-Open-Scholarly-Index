import { notFound } from 'next/navigation'
import { editionCategories, getEdition, getEditionList } from '@/lib/ranking-editions'
import { CategoryRankingView } from '@/components/RankingViews'

export const dynamicParams = false

export function generateStaticParams() {
  return getEditionList().flatMap(info => {
    const e = getEdition(info.year)
    return e ? [{ year: String(info.year), code: 'all' }, ...editionCategories(e).map(c => ({ year: String(info.year), code: c.code }))] : []
  })
}

export async function generateMetadata(props: { params: Promise<{ year: string; code: string }> }) {
  const { year, code } = await props.params
  const e = getEdition(Number(year))
  const c = e ? editionCategories(e).find(x => x.code === code) : null
  const name = code === 'all' ? 'all categories' : c?.name ?? code
  return {
    title: `Citation Ranking ${year}, ${name}`,
    description: `The ${year} POSI Citation Ranking for ${name}, as published.`,
    alternates: { canonical: `/rankings/edition/${year}/${code}/` },
  }
}

export default async function EditionCategoryPage(props: { params: Promise<{ year: string; code: string }> }) {
  const { year, code } = await props.params
  const e = getEdition(Number(year))
  if (!e || (code !== 'all' && !editionCategories(e).some(x => x.code === code))) notFound()
  return <CategoryRankingView e={e} code={code} byYear />
}
