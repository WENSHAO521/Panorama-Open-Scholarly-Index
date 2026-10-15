import { notFound } from 'next/navigation'
import { getCategories, getRankings } from '@/lib/rankings'
import { getEdition } from '@/lib/ranking-editions'
import { CategoryRankingView } from '@/components/RankingViews'

export const dynamicParams = false

// Every PSC category and "all", ranked or not, so no category URL ever 404s.
export function generateStaticParams() {
  return [{ code: 'all' }, ...getCategories().map(c => ({ code: c.code }))]
}

export async function generateMetadata(props: { params: Promise<{ code: string }> }) {
  const { code } = await props.params
  if (code === 'all') return { title: 'Citation Rankings, all categories', description: 'Every journal ranked by PNCI within its PSC category, listed together; ranks are category ranks.', alternates: { canonical: '/rankings/all/' } }
  const c = getCategories().find(x => x.code === code)
  return c ? { title: `${c.name} journal citation ranking`, description: `Journals in ${c.name} (${c.code}) ranked by PNCI, with citation percentile, Citation Quartile (C-Q1 to C-Q4) and POSI Zone.`, alternates: { canonical: `/rankings/${c.code}/` } } : {}
}

export default async function CategoryRankingPage(props: { params: Promise<{ code: string }> }) {
  const { code } = await props.params
  if (code !== 'all' && !getCategories().some(x => x.code === code)) notFound()
  return <CategoryRankingView e={getEdition(getRankings().year)!} code={code} />
}
