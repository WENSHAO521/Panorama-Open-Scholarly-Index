// Metadata of the client-rendered journal pages: the profile (/journal/?issn=) and the Discovered record viewer (/record/).
import type { Metadata } from 'next'
import type { Locale } from '@/i18n/config'

const PROFILE: Record<Locale, { title: string; description: string }> = {
  en: {
    title: 'Journal',
    description: 'Journal profile in the Panorama Open Scholarly Index: identifiers, publications and citations per year, subject, topics, and its evaluation: Core Collection status, AJR rating (Core Collection journals) and PNCI citation ranking.',
  },
  'zh-Hans': {
    title: '期刊',
    description: 'Panorama Open Scholarly Index 中的期刊页面：标识符、逐年发文量与被引量、学科、主题，以及期刊评价：核心合集状态、AJR 评级（核心合集期刊）与 PNCI 引文排名。',
  },
}

const RECORD: Record<Locale, { title: string; description: string }> = {
  en: {
    title: 'Discovered record',
    description: 'A journal record found in open registries and held by POSI, loaded from a static open-data shard.',
  },
  'zh-Hans': {
    title: 'Discovered 记录',
    description: 'POSI 从开放注册机构中发现并保存的期刊记录，从静态开放数据分片加载。',
  },
}

// No canonical or hreflang: one address serves every journal through its query string, so a canonical would fold
// them all into one page.
export function journalProfileMetadata(locale: Locale): Metadata {
  return PROFILE[locale]
}

export function recordMetadata(locale: Locale): Metadata {
  return { ...RECORD[locale], robots: { index: false } }
}
