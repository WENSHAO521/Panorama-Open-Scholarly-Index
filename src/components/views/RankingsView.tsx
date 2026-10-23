// The current Citation Ranking overview (/rankings/), in every language it is published in.
import type { Metadata } from 'next'
import { getRankings } from '@/lib/rankings'
import { getEdition } from '@/lib/ranking-editions'
import { RankingsOverview } from '@/components/RankingViews'
import type { Locale } from '@/i18n/config'
import { pageAlternates } from '@/i18n/alternates'

const META: Record<Locale, { title: string; description: string }> = {
  en: {
    title: 'Journal Citation Rankings',
    description: 'POSI Citation Rankings: journals ranked by PNCI within their PSC subject category, with citation percentile, Citation Quartile (C-Q1 to C-Q4) and POSI Zone.',
  },
  'zh-Hans': {
    title: '期刊引文排名',
    description: 'POSI 引文排名：期刊在其 PSC 学科类别内按 PNCI 排名，并给出引文百分位、引文分区（C-Q1 至 C-Q4）与 POSI Zone。',
  },
}

export function rankingsMetadata(locale: Locale): Metadata {
  return { ...META[locale], alternates: pageAlternates('/rankings/', locale) }
}

export function RankingsView({ locale }: { locale: Locale }) {
  return <RankingsOverview e={getEdition(getRankings().year)!} locale={locale} />
}
