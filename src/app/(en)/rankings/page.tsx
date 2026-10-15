import { getRankings } from '@/lib/rankings'
import { getEdition } from '@/lib/ranking-editions'
import { RankingsOverview } from '@/components/RankingViews'

export const metadata = {
  title: 'Journal Citation Rankings',
  description: 'POSI Citation Rankings: journals ranked by PNCI within their PSC subject category, with citation percentile, Citation Quartile (C-Q1 to C-Q4) and POSI Zone.',
  alternates: { canonical: '/rankings/' },
}

export default function RankingsPage() {
  return <RankingsOverview e={getEdition(getRankings().year)!} />
}
