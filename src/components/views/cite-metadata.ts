// Metadata of the citation generator (/cite/); the page itself is the client component CiteView.
import type { Metadata } from 'next'
import type { Locale } from '@/i18n/config'
import { pageAlternates } from '@/i18n/alternates'

const WORDS: Record<Locale, { title: string; description: string }> = {
  en: {
    title: 'Citation generator',
    description: 'Generate PSG, APA, MLA, Chicago, GB/T 7714, BibTeX and RIS citations from a DOI, ISBN or web address.',
  },
  'zh-Hans': {
    title: '引文生成器',
    description: '根据 DOI、ISBN 或网址生成 PSG、APA、MLA、Chicago、GB/T 7714、BibTeX 与 RIS 格式的引文。',
  },
}

export function citeMetadata(locale: Locale): Metadata {
  return { ...WORDS[locale], alternates: pageAlternates('/cite/', locale) }
}
