// /contact/ in every language it is published in: the English page (En) and its Simplified Chinese translation (Zh).
import Link from 'next/link'
import { PageHeader } from '@/components/db'
import type { Metadata } from 'next'
import type { Locale } from '@/i18n/config'
import { localizedHref, pageAlternates } from '@/i18n/alternates'

const EN_META = {
  title: 'Contact',
  description: 'Contact the POSI editorial team about certification, record corrections, certificates and data.',
  alternates: { canonical: '/contact/' },
}

const TOPICS = [
  { topic: 'Core Collection certification', subject: 'POSI Certification: [Journal title]', body: 'Apply through the certification form, which prepares the message for you.', href: '/certification/', cta: 'Apply for certification' },
  { topic: 'Record correction', subject: 'POSI Correction: [Journal title or ISSN]', body: 'Wrong ISSN, publisher, subject category or other details on a POSI record. Registry data is corrected at Crossref or OpenAlex; see data sources.', href: '/docs/data/#corrections', cta: 'Data sources and access' },
  { topic: 'Appeal', subject: 'POSI Appeal: [Journal title]', body: 'Appeals against a certification decision, warning, suspension or delisting, with supporting evidence.', href: '/editorial-policy/#appeals', cta: 'Appeals process' },
  { topic: 'Certificates of indexing', subject: 'POSI Certificate: [Certificate number]', body: 'Questions about a certificate or its verification.', href: '/docs/certificates/', cta: 'How certificates work' },
  { topic: 'Data and licensing', subject: 'POSI Data', body: 'Bulk data, reuse and attribution.', href: '/datasets/', cta: 'Data downloads' },
]

function En() {
  return (
    <div className="pb-12">
      <PageHeader title="Contact" crumbs={[{ label: 'POSI', href: '/' }, { label: 'About', href: '/about/' }, { label: 'Contact' }]}>
        <p className="max-w-[68ch]">
          Write to <a href="mailto:posi@panorama-sg.com" className="link">posi@panorama-sg.com</a> with the subject line
          for your request. Enquiries are acknowledged within two to three business days.
        </p>
      </PageHeader>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] max-w-[1000px]">
        <ul className="panel divide-y divide-[var(--line-soft)]">
          {TOPICS.map(t => (
            <li key={t.topic} className="p-5" style={{ borderColor: 'var(--line-soft)' }}>
              <h2 className="text-[15.5px] font-semibold">{t.topic}</h2>
              <p className="mt-1 text-[14px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>{t.body}</p>
              <p className="mt-2 text-[12.5px]" style={{ color: 'var(--muted)' }}>
                Subject: <span className="font-mono" style={{ color: 'var(--ink-2)' }}>{t.subject}</span>
              </p>
              <Link href={t.href} className="link mt-2 inline-block text-[13.5px]">{t.cta}</Link>
            </li>
          ))}
        </ul>

        <aside>
          <address className="not-italic panel p-5 text-[14px] leading-relaxed">
            <p className="font-semibold" style={{ color: 'var(--ink)' }}>Panorama Scholarly Group Ltd.</p>
            <p className="mt-1" style={{ color: 'var(--ink-2)' }}>
              Room 1508, 15/F., Office Tower Two, Grand Plaza<br />
              625 Nathan Road, Kowloon<br />
              Hong Kong SAR
            </p>
            <p className="mt-3"><a href="mailto:posi@panorama-sg.com" className="link">posi@panorama-sg.com</a></p>
            <p className="mt-3 text-[12.5px]" style={{ color: 'var(--muted)' }}>Certification reviews take ten to twenty business days.</p>
          </address>
        </aside>
      </div>
    </div>
  )
}

export function contactMetadata(locale: Locale): Metadata {
  const m = locale === 'zh-Hans' ? ZH_META : EN_META
  return { title: m.title, description: m.description, alternates: pageAlternates('/contact/', locale) }
}

export function ContactView({ locale }: { locale: Locale }) {
  return locale === 'zh-Hans' ? <Zh /> : <En />
}

const ZH_META = {
  title: '联系我们',
  description: '就期刊认证、记录更正、收录证书与数据事宜联系 POSI 编辑团队。',
}

const L = (p: string) => localizedHref('zh-Hans', p)

// Subject lines stay in English: the editorial office files requests by them.
const TOPICS_ZH = [
  { topic: '核心合集认证', subject: TOPICS[0].subject, body: '请通过认证申请表提交，表单会为您生成邮件内容。', href: '/certification/', cta: '申请认证' },
  { topic: '记录更正', subject: TOPICS[1].subject, body: 'POSI 记录中的 ISSN、出版商、学科类别或其他信息有误。登记机构数据须在 Crossref 或 OpenAlex 处更正，详见数据来源说明。', href: '/docs/data/#corrections', cta: '数据来源与获取' },
  { topic: '申诉', subject: TOPICS[2].subject, body: '对认证决定、警示、暂停或除名提出申诉，并附上支持证据。', href: '/editorial-policy/#appeals', cta: '申诉程序' },
  { topic: '收录证书', subject: TOPICS[3].subject, body: '有关证书或证书验证的问题。', href: '/docs/certificates/', cta: '证书说明' },
  { topic: '数据与许可', subject: TOPICS[4].subject, body: '批量数据、再利用与署名。', href: '/datasets/', cta: '数据下载' },
]

function Zh() {
  return (
    <div className="pb-12">
      <PageHeader locale="zh-Hans" title="联系我们" crumbs={[{ label: 'POSI', href: L('/') }, { label: '关于', href: L('/about/') }, { label: '联系我们' }]}>
        <p className="max-w-[68ch]">
          请发送邮件至 <a href="mailto:posi@panorama-sg.com" className="link">posi@panorama-sg.com</a>，并使用与您的请求对应的邮件主题。我们会在两至三个工作日内确认收到。
        </p>
      </PageHeader>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] max-w-[1000px]">
        <ul className="panel divide-y divide-[var(--line-soft)]">
          {TOPICS_ZH.map(t => (
            <li key={t.topic} className="p-5" style={{ borderColor: 'var(--line-soft)' }}>
              <h2 className="text-[15.5px] font-semibold">{t.topic}</h2>
              <p className="mt-1 text-[14px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>{t.body}</p>
              <p className="mt-2 text-[12.5px]" style={{ color: 'var(--muted)' }}>
                邮件主题：<span className="font-mono" style={{ color: 'var(--ink-2)' }}>{t.subject}</span>
              </p>
              <Link href={L(t.href)} className="link mt-2 inline-block text-[13.5px]">{t.cta}</Link>
            </li>
          ))}
        </ul>

        <aside>
          <address className="not-italic panel p-5 text-[14px] leading-relaxed">
            <p className="font-semibold" style={{ color: 'var(--ink)' }}>Panorama Scholarly Group Ltd.</p>
            <p className="mt-1" style={{ color: 'var(--ink-2)' }}>
              Room 1508, 15/F., Office Tower Two, Grand Plaza<br />
              625 Nathan Road, Kowloon<br />
              Hong Kong SAR
            </p>
            <p className="mt-3"><a href="mailto:posi@panorama-sg.com" className="link">posi@panorama-sg.com</a></p>
            <p className="mt-3 text-[12.5px]" style={{ color: 'var(--muted)' }}>认证评审需十至二十个工作日。</p>
          </address>
        </aside>
      </div>
    </div>
  )
}
