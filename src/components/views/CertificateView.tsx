// Issuing certificates (/certificate/ and /certificate/zone/) and verifying them (…/verify/), in every language they
// are published in. The certificates themselves stay in English (published plan; decided 2026-10-23); their
// verification pages are translated (decided 2026-10-24).
import { Suspense } from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { CertificateTool } from '@/components/CertificateTool'
import { ZoneCertificateTool } from '@/components/ZoneCertificateTool'
import { CertificateVerifier } from '@/components/CertificateVerifier'
import { ZoneCertificateVerifier } from '@/components/ZoneCertificateVerifier'
import { PageHeader } from '@/components/db'
import type { Locale } from '@/i18n/config'
import { localizedHref, pageAlternates } from '@/i18n/alternates'

const en = {
  title: 'Indexing certificate',
  description: 'Verifiable certificates of indexing for journal publications, issued free of charge upon verification against Crossref, DataCite, Zenodo, OpenAlex and the live POSI index.',
  crumb: 'Certificate',
  leadA: 'Enter the DOIs of the publications concerned. Each DOI is verified against Crossref, DataCite, Zenodo, OpenAlex and the POSI index, and a certificate is issued for each indexed journal publication, stating whether the journal belongs to the Core Collection. Any party may verify the certificate by scanning its QR code. See ',
  how: 'how certificates work', leadEnd: '.',
  journalsA: 'Journals: a ', zoneLink: 'zone certificate', journalsB: ' states a journal\'s POSI Zone (POSI 分区) in the current Journal Rankings.',
  zoneTitle: 'Zone certificate',
  zoneDescription: 'A verifiable certificate of a journal’s official POSI Zone (POSI 分区), being its PNCI percentile zone within its PSC subject category. Issued free of charge and without delay.',
  zoneCrumb: 'Zone',
  zoneLead: 'This certificate attests to a journal\'s POSI Zone (POSI 分区) in the current Citation Ranking, being the zone of its PNCI percentile within its PSC subject category. It is available to every journal with an official zone, and any party may verify it by its QR code. See ',
  zoneHow: 'how zone certificates work',
  verifyTitle: 'Verify a certificate',
  verifyDescription: 'Verification that a POSI certificate of indexing is unaltered and that each listed publication remains indexed.',
  verifyCrumb: 'Verify',
  verifyLead: 'Open this page from the certificate\'s QR code, or paste its verification address.',
  zoneVerifyTitle: 'Verify a zone certificate',
  zoneVerifyDescription: 'Verification that a POSI zone certificate corresponds to the journal’s zones in the current Journal Rankings.',
  zoneVerifyLead: 'Opened from the certificate\'s QR code, this page checks the certificate against the journal\'s current ranking record.',
}
const WORDS: Record<Locale, typeof en> = {
  en,
  'zh-Hans': {
    title: '收录证书',
    description: '为期刊文献出具可验证的收录证书，经 Crossref、DataCite、Zenodo、OpenAlex 与 POSI 实时索引核查后免费出具。',
    crumb: '证书',
    leadA: '请输入相关文献的 DOI。系统将逐一在 Crossref、DataCite、Zenodo、OpenAlex 与 POSI 索引中核查，并为每篇已收录的期刊文献出具证书，注明其所在期刊是否属于核心合集。任何人均可扫描证书上的二维码进行核验。详见',
    how: '证书说明', leadEnd: '。',
    journalsA: '期刊：', zoneLink: 'POSI Zone 证书', journalsB: '可证明期刊在当前期刊排名中的 POSI Zone（POSI 分区）。',
    zoneTitle: 'POSI Zone 证书',
    zoneDescription: '为期刊出具可验证的正式 POSI Zone（POSI 分区）证书，即期刊在其 PSC 学科类别内的 PNCI 百分位分区。免费并即时出具。',
    zoneCrumb: 'Zone',
    zoneLead: '本证书证明期刊在当前引文排名中的 POSI Zone（POSI 分区），即期刊 PNCI 百分位在其 PSC 学科类别内所处的分区。凡具有正式 Zone 的期刊均可申领，任何人均可通过二维码进行核验。详见',
    zoneHow: 'Zone 证书说明',
    verifyTitle: '证书验证',
    verifyDescription: '核验 POSI 收录证书是否未经改动，以及所列文献是否仍被收录。',
    verifyCrumb: '验证',
    verifyLead: '扫描证书上的二维码即可打开本页，也可粘贴证书的验证地址。',
    zoneVerifyTitle: 'POSI Zone 证书验证',
    zoneVerifyDescription: '核验 POSI Zone 证书是否与期刊在当前期刊排名中的 Zone 相符。',
    zoneVerifyLead: '本页由证书上的二维码打开，依据期刊当前的排名记录核验证书。',
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

export function verifyCertificateMetadata(locale: Locale): Metadata {
  const w = WORDS[locale]
  return { title: w.verifyTitle, description: w.verifyDescription, alternates: pageAlternates('/certificate/verify/', locale) }
}

export function VerifyCertificateView({ locale }: { locale: Locale }) {
  const w = WORDS[locale]
  const href = (p: string) => localizedHref(locale, p)
  return (
    <div className="wrap pb-10">
      <PageHeader locale={locale} title={w.verifyTitle} crumbs={[{ label: 'POSI', href: href('/') }, { label: w.crumb, href: href('/certificate/') }, { label: w.verifyCrumb }]}>
        <p className="max-w-[65ch]">{w.verifyLead}</p>
      </PageHeader>
      <Suspense fallback={null}>
        <CertificateVerifier />
      </Suspense>
    </div>
  )
}

export function verifyZoneCertificateMetadata(locale: Locale): Metadata {
  const w = WORDS[locale]
  return { title: w.zoneVerifyTitle, description: w.zoneVerifyDescription, alternates: pageAlternates('/certificate/zone/verify/', locale) }
}

export function VerifyZoneCertificateView({ locale }: { locale: Locale }) {
  const w = WORDS[locale]
  const href = (p: string) => localizedHref(locale, p)
  return (
    <div className="wrap pb-10">
      <PageHeader locale={locale} title={w.zoneVerifyTitle} crumbs={[{ label: 'POSI', href: href('/') }, { label: w.crumb, href: href('/certificate/') }, { label: w.zoneCrumb, href: href('/certificate/zone/') }, { label: w.verifyCrumb }]}>
        <p className="max-w-[65ch]">{w.zoneVerifyLead}</p>
      </PageHeader>
      <Suspense fallback={null}>
        <ZoneCertificateVerifier />
      </Suspense>
    </div>
  )
}
