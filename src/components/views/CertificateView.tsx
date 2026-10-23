// Issuing certificates (/certificate/ and /certificate/zone/), in every language they are published in. The certificates
// and their verification pages stay in English (published plan; decided 2026-10-23).
import { Suspense } from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { CertificateTool } from '@/components/CertificateTool'
import { ZoneCertificateTool } from '@/components/ZoneCertificateTool'
import { PageHeader } from '@/components/db'
import type { Locale } from '@/i18n/config'
import { localizedHref, pageAlternates } from '@/i18n/alternates'

const en = {
  title: 'Indexing certificate',
  description: 'Issue a verifiable certificate of indexing for your journal publications. Free, instant, checked against Crossref, DataCite, Zenodo, OpenAlex and the live POSI index.',
  crumb: 'Certificate',
  leadA: 'Enter the DOIs of your publications. Each one is checked against Crossref, DataCite, Zenodo, OpenAlex and the POSI index, and a certificate is issued for every indexed journal publication, stating whether its journal is in the Core Collection. Anyone can verify the certificate by scanning its code. See ',
  how: 'how certificates work', leadEnd: '.',
  journalsA: 'Journals: a ', zoneLink: 'zone certificate', journalsB: ' states a journal\'s POSI Zone (POSI 分区) in the current Journal Rankings.',
  zoneTitle: 'Zone certificate',
  zoneDescription: 'Issue a verifiable certificate of a journal’s official POSI Zone (POSI 分区): its PNCI percentile zone within its PSC category. Free and immediate.',
  zoneCrumb: 'Zone',
  zoneLead: 'A certificate of the journal\'s POSI Zone (POSI 分区) in the current Citation Ranking: the zone of its PNCI percentile within its PSC subject category. It is issued for every journal with an official zone and can be verified by anyone from its QR code. See ',
  zoneHow: 'how zone certificates work',
}
const WORDS: Record<Locale, typeof en> = {
  en,
  'zh-Hans': {
    title: '收录证书',
    description: '为您的期刊文献出具可验证的收录证书。免费、即时，依据 Crossref、DataCite、Zenodo、OpenAlex 与 POSI 实时索引核查。',
    crumb: '证书',
    leadA: '输入您的文献 DOI。系统将逐一在 Crossref、DataCite、Zenodo、OpenAlex 与 POSI 索引中核查，并为每篇已收录的期刊文献出具证书，注明其所在期刊是否属于核心合集。任何人扫描证书上的二维码即可验证。详见',
    how: '证书说明', leadEnd: '。',
    journalsA: '期刊：', zoneLink: 'POSI Zone 证书', journalsB: '可证明期刊在当前期刊排名中的 POSI Zone（POSI 分区）。',
    zoneTitle: 'POSI Zone 证书',
    zoneDescription: '为期刊出具可验证的正式 POSI Zone（POSI 分区）证书，即期刊在其 PSC 类别内的 PNCI 百分位分区。免费、即时。',
    zoneCrumb: 'Zone',
    zoneLead: '证明期刊在当前引文排名中的 POSI Zone（POSI 分区），即期刊 PNCI 百分位在其 PSC 学科类别内所处的分区。凡有正式 Zone 的期刊均可出具，任何人扫描二维码即可验证。详见',
    zoneHow: 'Zone 证书说明',
  },
}

export function certificateMetadata(locale: Locale): Metadata {
  const w = WORDS[locale]
  return { title: w.title, description: w.description, alternates: pageAlternates('/certificate/', locale) }
}

export function CertificateView({ locale }: { locale: Locale }) {
  const w = WORDS[locale]
  const href = (p: string) => localizedHref(locale, p)
  return (
    <div className="wrap pb-10">
      <div className="no-print">
        <PageHeader locale={locale} title={w.title} crumbs={[{ label: 'POSI', href: href('/') }, { label: w.crumb }]}>
          <p className="max-w-[68ch]">
            {w.leadA}<Link href={href('/docs/certificates/')} className="link">{w.how}</Link>{w.leadEnd}
          </p>
          <p className="max-w-[68ch] mt-2">
            {w.journalsA}<Link href={href('/certificate/zone/')} className="link">{w.zoneLink}</Link>{w.journalsB}
          </p>
        </PageHeader>
      </div>
      <CertificateTool />
    </div>
  )
}

export function zoneCertificateMetadata(locale: Locale): Metadata {
  const w = WORDS[locale]
  return { title: w.zoneTitle, description: w.zoneDescription, alternates: pageAlternates('/certificate/zone/', locale) }
}

export function ZoneCertificateView({ locale }: { locale: Locale }) {
  const w = WORDS[locale]
  const href = (p: string) => localizedHref(locale, p)
  return (
    <div className="wrap pb-10">
      <div className="no-print">
        <PageHeader locale={locale} title={w.zoneTitle} crumbs={[{ label: 'POSI', href: href('/') }, { label: w.crumb, href: href('/certificate/') }, { label: w.zoneCrumb }]}>
          <p className="max-w-[68ch]">
            {w.zoneLead}<Link href={href('/docs/certificates/#zone-certificates')} className="link">{w.zoneHow}</Link>{w.leadEnd}
          </p>
        </PageHeader>
      </div>
      <Suspense fallback={null}>
        <ZoneCertificateTool />
      </Suspense>
    </div>
  )
}
