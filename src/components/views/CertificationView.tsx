// Applying for certification (/certification/), in every language it is published in.
import Link from 'next/link'
import type { Metadata } from 'next'
import { getCoreCollection } from '@/lib/data'
import { PageHeader, SectionTitle, fmt } from '@/components/db'
import { CertificationApply } from '@/components/CertificationApply'
import type { Locale } from '@/i18n/config'
import { localizedHref, pageAlternates } from '@/i18n/alternates'
import { fill } from '@/i18n/format'

const en = {
  title: 'Apply for certification', crumb: 'Certification',
  description: 'All journals with DOIs registered with Crossref or a record in OpenAlex are indexed by POSI. Admission to the Core Collection is by application for certification.',
  lead: 'All journals with DOIs registered with Crossref or a record in OpenAlex are indexed by POSI. Certification is the subsequent stage: an evidence-based evaluation through which a journal is admitted to the Core Collection, which currently comprises {n} journals. No fee is charged for applications.',
  indexed: 'Indexed', indexedNote: 'Automatic; no application required',
  indexedItems: [
    'Searchable journal record and publications',
    'Inclusion in the Citation Rankings once its citation data meet the minimum requirements (a rule applied equally to all journals)',
    'Certificates of indexing available to its authors',
  ],
  core: 'Core Collection', coreNote: 'Certified after PQF evaluation',
  coreItems: [
    'All provisions of the Indexed tier',
    'Curated POSI record with published evidence and PQF report',
    'Marked as Core in rankings, publications and certificates',
    'Certificate of certification for the journal',
  ],
  eligibility: 'Eligibility',
  eligible: [
    'Indexed: DOIs registered with Crossref, or a source record in OpenAlex',
    'Actively publishing, with a public journal website',
    'Peer review process documented publicly',
    'Editorial board listed with verifiable affiliations',
    'Fees disclosed, or the absence of charges stated explicitly. Any business model is acceptable provided it is disclosed',
    'Publication ethics, correction and retraction policies publicly available',
  ],
  notEligibleTitle: 'Not eligible',
  notEligible: [
    'Discontinued or inactive journals',
    'Undisclosed or unverifiable editorial board',
    'False claims of indexing in DOAJ, Scopus, Web of Science or PubMed',
  ],
  evaluated: 'What is evaluated', fullMethod: 'Full method', factor: 'PQF factor', points: 'Points', total: 'Total',
  pqf: ['Journal transparency', 'Metadata quality', 'Editorial governance', 'Technical discoverability', 'Citation visibility', 'Research integrity'],
  reassess: 'Certification is reassessed annually. A journal may request an early review upon documented improvements.',
  process: 'Process',
  steps: [
    { verb: 'Apply', time: 'Today', body: 'Submit the application below, with links to the journal’s public policy pages.' },
    { verb: 'Acknowledge', time: '2 to 3 business days', body: 'POSI confirms receipt and checks that the journal is indexed and eligible.' },
    { verb: 'Evaluate', time: '10 to 15 business days', body: 'Each PQF criterion is assessed against public evidence. POSI may request clarification.' },
    { verb: 'Decide', time: '3 to 5 business days', body: 'The journal receives the decision together with a criterion-level evidence report, irrespective of the outcome.' },
  ],
  application: 'Application',
}
const WORDS: Record<Locale, typeof en> = {
  en,
  'zh-Hans': {
    title: '申请期刊认证', crumb: '期刊认证',
    description: '凡在 Crossref 注册 DOI 或在 OpenAlex 有记录的期刊均已被 POSI 收录。期刊须申请认证方可进入核心合集。',
    lead: '凡在 Crossref 注册 DOI 或在 OpenAlex 有记录的期刊，均已被 POSI 收录。认证为其后一阶段：一项基于证据的评审，通过者获准进入核心合集（目前共收录 {n} 种期刊）。申请不收取任何费用。',
    indexed: '已收录', indexedNote: '自动收录，无需申请',
    indexedItems: [
      '可检索的期刊页面与文献',
      '引文数据达到最低要求时进入引文排名（适用于所有期刊的同一规则）',
      '作者可申请收录证书',
    ],
    core: '核心合集', coreNote: '经 PQF 评审后认证',
    coreItems: [
      '享有“已收录”层级的全部权益',
      '经编辑整理的 POSI 记录，公开评审证据与 PQF 报告',
      '在排名、文献与证书中标注为核心合集',
      '为期刊颁发认证证书',
    ],
    eligibility: '申请条件',
    eligible: [
      '已收录：在 Crossref 注册了 DOI，或在 OpenAlex 有来源记录',
      '正常出版，并有公开的期刊网站',
      '同行评审流程有公开说明',
      '公布编委会名单，成员所属机构可核实',
      '公开收费信息，或明确声明不收费。任何商业模式经公开披露即可接受',
      '出版伦理、更正与撤稿政策公开',
    ],
    notEligibleTitle: '不符合条件',
    notEligible: [
      '已停刊或不再出版的期刊',
      '编委会未公开或无法核实',
      '虚假声称被 DOAJ、Scopus、Web of Science 或 PubMed 收录',
    ],
    evaluated: '评审内容', fullMethod: '完整方法', factor: 'PQF 指标', points: '分值', total: '合计',
    pqf: ['期刊透明度', '元数据质量', '编辑治理', '技术可发现性', '引文可见度', '科研诚信'],
    reassess: '认证每年复评一次。期刊在作出有书面记录的改进后，可申请提前复评。',
    process: '流程',
    steps: [
      { verb: '提交申请', time: '当天', body: '通过下方表格提交申请，并附上期刊各项公开政策页面的链接。' },
      { verb: '确认受理', time: '2–3 个工作日', body: 'POSI 确认收到申请，并核实期刊已被收录且符合申请条件。' },
      { verb: '评审', time: '10–15 个工作日', body: '依据公开证据逐项核查 PQF 各项标准，必要时 POSI 将要求期刊补充说明。' },
      { verb: '决定', time: '3–5 个工作日', body: '无论结果如何，期刊均将收到评审决定以及逐项标准的证据报告。' },
    ],
    application: '申请表',
  },
}

/** PQF points of each factor, in the order of the `pqf` words. */
const PQF_POINTS = [25, 25, 20, 15, 10, 5]

export function certificationMetadata(locale: Locale): Metadata {
  const w = WORDS[locale]
  return { title: w.title, description: w.description, alternates: pageAlternates('/certification/', locale) }
}

export function CertificationView({ locale }: { locale: Locale }) {
  const w = WORDS[locale]
  const core = getCoreCollection().length
  return (
    <div className="wrap pb-10">
      <PageHeader locale={locale} title={w.title} crumbs={[{ label: 'POSI', href: localizedHref(locale, '/') }, { label: w.crumb }]}>
        <p className="max-w-[68ch]">{fill(w.lead, { n: fmt(core) })}</p>
      </PageHeader>

      <section aria-labelledby="tiers" className="grid gap-px rounded-[var(--radius)] overflow-hidden md:grid-cols-2 mb-14" style={{ background: 'var(--line)', border: '1px solid var(--line)' }}>
        <div className="p-6" style={{ background: 'var(--surface)' }}>
          <h2 id="tiers" className="text-[18px] font-medium">{w.indexed}</h2>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--muted)' }}>{w.indexedNote}</p>
          <ul className="mt-4 space-y-2 text-[14px]" style={{ color: 'var(--ink-2)' }}>
            {w.indexedItems.map(t => <li key={t}>{t}</li>)}
          </ul>
        </div>
        <div className="p-6" style={{ background: 'var(--teal-soft)' }}>
          <h2 className="text-[18px] font-medium" style={{ color: 'var(--teal)' }}>{w.core}</h2>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--muted)' }}>{w.coreNote}</p>
          <ul className="mt-4 space-y-2 text-[14px]" style={{ color: 'var(--ink-2)' }}>
            {w.coreItems.map(t => <li key={t}>{t}</li>)}
          </ul>
        </div>
      </section>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] mb-14">
        <section aria-labelledby="eligibility">
          <SectionTitle id="eligibility">{w.eligibility}</SectionTitle>
          <ul className="space-y-2 text-[14px]" style={{ color: 'var(--ink-2)' }}>
            {w.eligible.map(e => <li key={e} className="pl-4" style={{ borderLeft: '2px solid var(--teal)' }}>{e}</li>)}
          </ul>
          <p className="mt-6 text-[14px] font-medium">{w.notEligibleTitle}</p>
          <ul className="mt-2 space-y-2 text-[14px]" style={{ color: 'var(--muted)' }}>
            {w.notEligible.map(e => <li key={e} className="pl-4" style={{ borderLeft: '2px solid var(--line)' }}>{e}</li>)}
          </ul>
        </section>
        <section aria-labelledby="pqf">
          <SectionTitle id="pqf" aside={<Link href={localizedHref(locale, '/editorial-policy/#certification')} className="link">{w.fullMethod}</Link>}>{w.evaluated}</SectionTitle>
          <div className="panel overflow-x-auto">
            <table className="dtable">
              <thead><tr><th>{w.factor}</th><th className="text-right">{w.points}</th></tr></thead>
              <tbody>
                {w.pqf.map((f, i) => (
                  <tr key={f}><td>{f}</td><td className="text-right font-mono tnum">{PQF_POINTS[i]}</td></tr>
                ))}
                <tr><td className="font-medium">{w.total}</td><td className="text-right font-mono tnum font-medium">100</td></tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[13px]" style={{ color: 'var(--muted)' }}>{w.reassess}</p>
        </section>
      </div>

      <section aria-labelledby="process" className="mb-14">
        <SectionTitle id="process">{w.process}</SectionTitle>
        <ol className="stat-strip md:grid-cols-4">
          {w.steps.map(s => (
            <li key={s.verb}>
              <p className="text-[16px] font-medium" style={{ color: 'var(--teal)' }}>{s.verb}</p>
              <p className="mt-0.5 font-mono text-[12px]" style={{ color: 'var(--muted)' }}>{s.time}</p>
              <p className="mt-2 text-[14px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="apply" className="max-w-[900px]">
        <SectionTitle id="apply">{w.application}</SectionTitle>
        <CertificationApply />
      </section>
    </div>
  )
}
