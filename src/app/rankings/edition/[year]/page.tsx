import { notFound } from 'next/navigation'
import { getEdition, getEditionList } from '@/lib/ranking-editions'
import { RankingsOverview } from '@/components/RankingViews'

export const dynamicParams = false

// Every edition has a permanent address, the current one included.
export function generateStaticParams() {
  return getEditionList().map(e => ({ year: String(e.year) }))
}

export async function generateMetadata(props: { params: Promise<{ year: string }> }) {
  const { year } = await props.params
  return {
    title: `Journal Citation Rankings ${year}`,
    description: `The ${year} edition of the POSI Citation Ranking: journals ranked by PNCI within their PSC subject category, as published.`,
    alternates: { canonical: `/rankings/edition/${year}/` },
  }
}

export default async function EditionPage(props: { params: Promise<{ year: string }> }) {
  const { year } = await props.params
  const e = getEdition(Number(year))
  if (!e) notFound()
  return <RankingsOverview e={e} byYear />
}
