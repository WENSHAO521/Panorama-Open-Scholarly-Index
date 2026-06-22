import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Journal Inclusion and Verification Policy | POSI',
  description:
    'POSI uses a hybrid inclusion model combining automatic metadata discovery, journal-initiated submission, and evidence-based manual verification. This policy defines how records are discovered, verified, and assessed.',
}

function Zh({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 pl-3 text-[11px] leading-relaxed" style={{ borderLeft: '2px solid var(--posi-border)', color: 'var(--posi-muted)' }}>
      {children}
    </div>
  )
}

function SectionHeader({ num, title, zh }: { num: string; title: string; zh: string }) {
  return (
    <div className="px-5 py-3 border-b border-gray-100">
      <div className="flex items-center gap-2.5">
        <span className="text-[9px] font-mono font-bold text-[#c41e3a] border border-[#c41e3a] px-1.5 py-0.5 leading-none shrink-0">{num}</span>
        <h2 className="text-xs font-bold text-gray-700 uppercase tracking-[0.1em]">{title}</h2>
      </div>
      <p className="text-[10px] mt-1 ml-7" style={{ color: 'var(--posi-muted)' }}>{zh}</p>
    </div>
  )
}

const RECORD_STATUSES = [
  { status: 'discovered',    en: 'The record was found from public metadata sources but has not yet been imported.', zh: '系统从公开元数据来源发现记录，但尚未导入。' },
  { status: 'imported',      en: 'The record has been imported into POSI as a metadata record.',                      zh: '记录已作为元数据记录导入 POSI。' },
  { status: 'unverified',    en: 'The record exists in POSI but has not passed manual verification.',                  zh: '记录已存在于 POSI，但尚未通过人工审核。' },
  { status: 'submitted',     en: 'The journal has submitted information for POSI review.',                            zh: '期刊已主动提交审核申请。' },
  { status: 'under_review',  en: 'POSI is reviewing the record against public evidence criteria.',                    zh: 'POSI 正在根据公开证据标准进行审核。' },
  { status: 'verified',      en: 'The record has passed POSI evidence-based verification.',                           zh: '记录已通过 POSI 公开证据审核。' },
  { status: 'pqf_evaluated', en: 'The journal has received a POSI Quality Factor assessment.',                       zh: '期刊已获得 POSI Quality Factor 评估。' },
  { status: 'excluded',      en: 'The record does not meet POSI inclusion or evidence criteria.',                    zh: '记录不符合 POSI 收录或证据标准。' },
  { status: 'removed',       en: 'The record has been removed from public display or active indexing.',              zh: '记录已从公开展示或活跃索引中移除。' },
]

const PQF_RULES = [
  { type: 'Auto-discovered record',             zh: '自动发现记录',              display: 'No full PQF',                      zh2: '不显示完整 PQF' },
  { type: 'Imported but unverified record',      zh: '已导入但未验证记录',        display: 'No full PQF',                      zh2: '不显示完整 PQF' },
  { type: 'Submitted record',                   zh: '已提交记录',               display: 'Preliminary review only',           zh2: '仅可显示初步审核状态' },
  { type: 'Under review record',                zh: '审核中记录',               display: 'PQF pending',                      zh2: 'PQF pending' },
  { type: 'Verified record',                    zh: '已验证记录',               display: 'Eligible for full PQF',             zh2: '可进入完整 PQF 评估' },
  { type: 'Verified with sufficient evidence',  zh: '已验证且证据充分记录',      display: 'Full PQF displayed',               zh2: '显示完整 PQF' },
  { type: 'Publisher-owned journal',            zh: '出版社自有期刊',            display: 'Full PQF + COI notice required',   zh2: '可显示完整 PQF，但必须有利益冲突说明' },
]

const WORKFLOW_STEPS = [
  {
    step: 1, title: 'Automatic Discovery', zh: '自动发现',
    en: 'POSI automatically discovers journal and article metadata from public sources.',
    zhDesc: 'POSI 自动从公开来源发现期刊和文章元数据。',
    statuses: ['discovered', 'imported', 'unverified'],
  },
  {
    step: 2, title: 'Metadata Import', zh: '元数据导入',
    en: 'Basic metadata is imported into POSI. No verification claim. No full PQF.',
    zhDesc: '基础元数据导入 POSI，无验证声明，无完整 PQF。',
    statuses: [],
  },
  {
    step: 3, title: 'Journal Submission', zh: '期刊提交',
    en: 'A journal may submit additional information and evidence for review.',
    zhDesc: '期刊可提交补充信息和证据申请审核。',
    statuses: ['submitted', 'under_review'],
  },
  {
    step: 4, title: 'Evidence Review', zh: '证据审核',
    en: 'POSI checks public evidence and verifies record accuracy.',
    zhDesc: 'POSI 核查公开证据，验证记录准确性。',
    statuses: ['verified', 'excluded'],
  },
  {
    step: 5, title: 'PQF Assessment', zh: 'PQF 评估',
    en: 'Verified journals with sufficient evidence may receive PQF evaluation.',
    zhDesc: '已验证且证据充分的期刊可进行 PQF 评估。',
    statuses: ['pqf_evaluated'],
  },
  {
    step: 6, title: 'Public Display', zh: '公开展示',
    en: 'The record is displayed with status labels, evidence links, and responsible use notices.',
    zhDesc: '记录公开展示，附带状态标签、证据链接和负责任使用说明。',
    statuses: [],
  },
]

export default function PolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="text-xs flex items-center gap-1.5 mb-6" style={{ color: 'var(--posi-muted)' }}>
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <span style={{ color: 'var(--posi-text)' }}>Journal Inclusion Policy</span>
      </nav>

      {/* Header */}
      <div className="border-l-4 border-[#c41e3a] pl-5 mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-mono font-bold text-[#c41e3a] border border-[#c41e3a] px-1.5 py-0.5">POLICY</span>
          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-[0.15em]">2026</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">Journal Inclusion and Verification Policy</h1>
        <p className="text-sm text-gray-400 mt-0.5">POSI 期刊收录、发现与验证政策</p>
        <p className="text-sm text-gray-500 mt-3 max-w-2xl leading-relaxed">
          POSI uses a hybrid journal inclusion model combining automatic metadata discovery,
          journal-initiated submission, and evidence-based manual verification.
        </p>
      </div>

      {/* Section 1: Overview */}
      <section className="bg-white border border-gray-200 mb-4">
        <SectionHeader num="1" title="Overview" zh="概述" />
        <div className="p-5 text-xs leading-relaxed text-gray-600 space-y-2">
          <p>
            POSI does not treat every automatically discovered record as a verified indexed journal.
            Automatically discovered records are clearly marked as unverified metadata records until they pass
            POSI's public evidence review.
          </p>
          <Zh>
            POSI 不会将所有自动发现的期刊记录直接视为正式收录期刊。自动发现记录在通过公开证据审核前，将明确标记为未验证元数据记录。
          </Zh>
        </div>
      </section>

      {/* Section 2: Inclusion Model */}
      <section className="bg-white border border-gray-200 mb-4">
        <SectionHeader num="2" title="Inclusion Model" zh="收录模型" />
        <div className="divide-y divide-gray-50">
          {/* 2.1 */}
          <div className="p-5">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.1em] mb-2">2.1 — Auto-discovered Metadata Record <span className="text-gray-300 font-normal">/ 自动发现元数据记录</span></h3>
            <p className="text-xs text-gray-600 leading-relaxed mb-2">
              An auto-discovered metadata record is identified through open scholarly metadata sources such as
              Crossref, OpenAlex, DOAJ, OAI-PMH, or other public metadata infrastructures.
              These records do <strong>not</strong> imply POSI verification, endorsement, accreditation, or quality recognition.
            </p>
            <Zh>自动发现元数据记录通过 Crossref、OpenAlex、DOAJ、OAI-PMH 等开放学术元数据来源自动识别。不代表 POSI 已验证、认可、认证或质量背书。</Zh>
            <div className="mt-3 px-3 py-2 text-[11px] font-mono" style={{ background: 'var(--posi-bg)', border: '1px solid var(--posi-border)' }}>
              <div style={{ color: 'var(--posi-muted)' }}>Status: <span className="text-gray-700">Auto-discovered metadata record</span></div>
              <div style={{ color: 'var(--posi-muted)' }}>Verified: <span className="text-gray-700">Not yet verified by POSI / 尚未通过 POSI 验证</span></div>
            </div>
          </div>

          {/* 2.2 */}
          <div className="p-5">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.1em] mb-2">2.2 — Submitted Journal Record <span className="text-gray-300 font-normal">/ 主动提交期刊记录</span></h3>
            <p className="text-xs text-gray-600 leading-relaxed mb-2">
              Created when a journal, publisher, editor, or authorized representative submits journal information to POSI for review.
              Submitted records enter a review queue and are checked against POSI's public evidence criteria.
            </p>
            <Zh>期刊、出版社、编辑部或授权代表向 POSI 提交期刊信息并申请审核后创建。提交记录进入审核队列，按公开证据标准检查。</Zh>
            <div className="mt-3 px-3 py-2 text-[11px] font-mono" style={{ background: 'var(--posi-bg)', border: '1px solid var(--posi-border)' }}>
              <div style={{ color: 'var(--posi-muted)' }}>Status: <span className="text-gray-700">Submitted for POSI review</span></div>
              <div style={{ color: 'var(--posi-muted)' }}>Review: <span className="text-gray-700">Under evidence review / 正在进行证据审核</span></div>
            </div>
          </div>

          {/* 2.3 */}
          <div className="p-5">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.1em] mb-2">2.3 — POSI Verified Journal Record <span className="text-gray-300 font-normal">/ POSI 已验证期刊记录</span></h3>
            <p className="text-xs text-gray-600 leading-relaxed mb-2">
              A journal record that has passed POSI's evidence-based verification process.
              Verified records may become eligible for full PQF assessment, provided sufficient public evidence is available.
            </p>
            <Zh>已通过 POSI 公开证据审核的期刊记录。在具备充分公开证据的情况下，可获得完整 PQF 评估。</Zh>
            <div className="mt-3 px-3 py-2 text-[11px] font-mono" style={{ background: 'var(--posi-bg)', border: '1px solid var(--posi-border)' }}>
              <div style={{ color: 'var(--posi-muted)' }}>Status: <span style={{ color: '#1F7A4D' }}>POSI Verified Journal Record</span></div>
              <div style={{ color: 'var(--posi-muted)' }}>Evidence: <span className="text-gray-700">Available / 证据可查</span></div>
              <div style={{ color: 'var(--posi-muted)' }}>PQF: <span className="text-gray-700">Eligible for assessment / 可进行 PQF 评估</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Record Status System */}
      <section className="bg-white border border-gray-200 mb-4">
        <SectionHeader num="3" title="Record Status System" zh="记录状态体系" />
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-2 font-semibold text-gray-500 w-36">Status</th>
                <th className="text-left px-4 py-2 font-semibold text-gray-500">Meaning (EN / 中文)</th>
              </tr>
            </thead>
            <tbody>
              {RECORD_STATUSES.map(s => (
                <tr key={s.status} className="border-b border-gray-50 last:border-0">
                  <td className="px-5 py-2.5 font-mono text-[11px]" style={{ color: 'var(--posi-accent)' }}>{s.status}</td>
                  <td className="px-4 py-2.5 text-gray-600">
                    <div>{s.en}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: 'var(--posi-muted)' }}>{s.zh}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 4: Data Sources */}
      <section className="bg-white border border-gray-200 mb-4">
        <SectionHeader num="4" title="Data Sources" zh="数据来源" />
        <div className="p-5">
          <p className="text-xs text-gray-600 mb-3">POSI may discover or enrich records using the following sources. Source attribution and metadata provenance are preserved wherever possible.</p>
          <Zh>POSI 可使用以下来源发现或补充记录，并尽可能保留数据来源说明和元数据溯源信息。</Zh>
          <div className="mt-3 grid sm:grid-cols-2 gap-1">
            {['Crossref', 'OpenAlex', 'OpenCitations', 'DOAJ', 'OAI-PMH', 'ROR', 'ORCID', 'Publisher websites', 'Journal websites', 'Public policy pages'].map(src => (
              <div key={src} className="text-[11px] font-mono px-2 py-1" style={{ background: 'var(--posi-bg)', color: 'var(--posi-text)' }}>{src}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5: Automatic Metadata Discovery */}
      <section className="bg-white border border-gray-200 mb-4">
        <SectionHeader num="5" title="Automatic Metadata Discovery" zh="自动元数据发现" />
        <div className="p-5">
          <p className="text-xs text-gray-600 mb-1">Automatic discovery may include the following metadata fields:</p>
          <Zh className="mb-3">自动发现可以包括以下元数据字段：</Zh>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-1 text-[11px] text-gray-600">
            {[
              'Journal title', 'ISSN / eISSN', 'Publisher', 'Country', 'Website URL', 'DOI prefix',
              'Article title', 'Authors', 'Abstract', 'Keywords', 'Publication date', 'Volume / issue / pages',
              'DOI', 'License', 'References', 'PDF / HTML links', 'OpenAlex match', 'Citation visibility data',
            ].map(f => (
              <div key={f} className="px-2 py-1" style={{ background: 'var(--posi-bg)' }}>{f}</div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-4 italic">
            Automatic discovery does not substitute for manual verification. Records must be clearly marked as unverified unless reviewed.
          </p>
          <Zh>自动发现不能替代人工审核。除非已完成审核，否则自动发现记录必须明确标注为未验证。</Zh>
        </div>
      </section>

      {/* Section 6: Journal Submission Requirements */}
      <section className="bg-white border border-gray-200 mb-4">
        <SectionHeader num="6" title="Journal Submission Requirements" zh="期刊提交要求" />
        <div className="p-5">
          <p className="text-xs text-gray-600 mb-3">A journal submitted to POSI should provide the following:</p>
          <Zh>提交 POSI 审核的期刊应提供以下信息：</Zh>
          <div className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-1 text-[11px] text-gray-600">
            {[
              ['Journal title', '期刊名称'],
              ['Journal abbreviation', '期刊简称'],
              ['ISSN / eISSN', 'ISSN / eISSN'],
              ['Publisher name', '出版社名称'],
              ['Publisher country', '出版社所在国家或地区'],
              ['Journal website', '期刊官网'],
              ['Submission website', '投稿系统网址'],
              ['Open access policy', '开放获取政策'],
              ['Peer review policy', '同行评审政策'],
              ['APC policy', 'APC 政策'],
              ['Waiver policy', '减免政策'],
              ['Copyright policy', '版权政策'],
              ['License policy', '许可协议政策'],
              ['Publication ethics policy', '出版伦理政策'],
              ['Retraction and correction policy', '撤稿与更正政策'],
              ['Editorial board page', '编委会页面'],
              ['Reviewer guidelines', '审稿人指南'],
              ['Author guidelines', '作者指南'],
              ['Data availability policy', '数据可用性政策'],
              ['AI use policy', 'AI 使用政策'],
              ['OAI-PMH endpoint (if available)', 'OAI-PMH 地址（如有）'],
              ['Crossref DOI prefix (if available)', 'Crossref DOI 前缀（如有）'],
              ['DOAJ status (if available)', 'DOAJ 状态（如有）'],
              ['Contact email', '联系邮箱'],
            ].map(([en, zh]) => (
              <div key={en} className="flex gap-2 py-0.5 border-b border-gray-50">
                <span className="flex-1">{en}</span>
                <span style={{ color: 'var(--posi-muted)' }}>{zh}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 7: Verification Criteria */}
      <section className="bg-white border border-gray-200 mb-4">
        <SectionHeader num="7" title="Verification Criteria" zh="审核标准" />
        <div className="p-5">
          <p className="text-xs text-gray-600 mb-3">A journal may be marked verified only after evidence review. Checks may include:</p>
          <Zh>期刊只有在通过公开证据审核后才可标记为已验证。审核内容包括：</Zh>
          <ul className="mt-3 space-y-1.5 text-[11px] text-gray-600">
            {[
              ['Journal website is accessible', '期刊官网可访问'],
              ['Journal title and ISSN are consistent', '期刊名称与 ISSN 信息一致'],
              ['Publisher information is clear', '出版社信息清楚'],
              ['Editorial board is publicly available', '编委会公开'],
              ['Peer review policy is publicly available', '同行评审政策公开'],
              ['Open access policy is publicly available', '开放获取政策公开'],
              ['APC or fee policy is publicly available', 'APC 或费用政策公开'],
              ['Copyright and license information is clear', '版权与许可协议信息清楚'],
              ['Publication ethics policy is available', '出版伦理政策公开'],
              ['Retraction and correction policy is available', '撤稿与更正政策公开'],
              ['DOI records are resolvable, where applicable', 'DOI 可正常解析（如适用）'],
              ['Metadata is available through Crossref, OAI-PMH, or public pages', '元数据可通过 Crossref、OAI-PMH 或公开页面获取'],
              ['No obvious false indexing claims are found', '未发现明显虚假索引宣传'],
              ['No severe transparency gaps are found', '未发现严重透明度缺失问题'],
            ].map(([en, zh]) => (
              <li key={en} className="flex items-start gap-2">
                <span className="mt-0.5 text-[#1F7A4D] shrink-0">✓</span>
                <span>{en} <span style={{ color: 'var(--posi-muted)' }}>/ {zh}</span></span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Section 8: PQF Eligibility */}
      <section className="bg-white border border-gray-200 mb-4">
        <SectionHeader num="8" title="POSI Quality Factor Eligibility" zh="PQF 评估资格" />
        <div className="p-5 pb-0">
          <p className="text-xs text-gray-600 mb-4">Not every POSI record automatically receives a PQF. Eligibility depends on verification status and evidence completeness.</p>
          <Zh>不是所有 POSI 记录都会自动获得 PQF。是否显示取决于验证状态和证据完整度。</Zh>
        </div>
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-2 font-semibold text-gray-500">Record Type / 记录类型</th>
                <th className="text-left px-4 py-2 font-semibold text-gray-500">PQF Display / PQF 显示规则</th>
              </tr>
            </thead>
            <tbody>
              {PQF_RULES.map(r => (
                <tr key={r.type} className="border-b border-gray-50 last:border-0">
                  <td className="px-5 py-2.5 text-gray-700">
                    <div>{r.type}</div>
                    <div className="text-[10px]" style={{ color: 'var(--posi-muted)' }}>{r.zh}</div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="text-gray-600">{r.display}</div>
                    <div className="text-[10px]" style={{ color: 'var(--posi-muted)' }}>{r.zh2}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 9: Frontend Display Rules */}
      <section className="bg-white border border-gray-200 mb-4">
        <SectionHeader num="9" title="Frontend Display Rules" zh="前端展示规则" />
        <div className="divide-y divide-gray-50">
          {[
            {
              label: '9.1 Auto-discovered', zh: '9.1 自动发现记录',
              items: [['Status', 'Auto-discovered metadata record', '自动发现元数据记录'], ['Verification', 'Not yet verified by POSI', '尚未通过 POSI 验证'], ['PQF', 'Not evaluated', '未评估'], ['Evidence', 'Not reviewed', '尚未审核']],
            },
            {
              label: '9.2 Submitted', zh: '9.2 已提交记录',
              items: [['Status', 'Submitted for POSI review', '已提交 POSI 审核'], ['Verification', 'Under review', '审核中'], ['PQF', 'Pending', '待评估'], ['Evidence', 'Under review', '审核中']],
            },
            {
              label: '9.3 Verified', zh: '9.3 已验证记录',
              items: [['Status', 'POSI Verified Journal Record', 'POSI 已验证期刊记录'], ['Verification', 'Verified', '已验证'], ['PQF', 'Available', '可用'], ['Evidence', 'Publicly auditable', '公开可审计']],
            },
          ].map(section => (
            <div key={section.label} className="p-5">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.1em] mb-3">{section.label} <span className="text-gray-300 font-normal">/ {section.zh}</span></h3>
              <div className="font-mono text-[11px] divide-y divide-gray-100 border border-gray-100">
                {section.items.map(([key, val, zh]) => (
                  <div key={key} className="flex gap-3 px-3 py-1.5" style={{ background: 'var(--posi-bg)' }}>
                    <span className="w-24 shrink-0" style={{ color: 'var(--posi-muted)' }}>{key}</span>
                    <span className="text-gray-700">{val}</span>
                    <span className="ml-auto text-[10px]" style={{ color: 'var(--posi-border)' }}>{zh}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 10: Evidence Registry */}
      <section className="bg-white border border-gray-200 mb-4">
        <SectionHeader num="10" title="Evidence Registry" zh="证据注册" />
        <div className="p-5">
          <p className="text-xs text-gray-600 mb-3">Every verified record and every PQF assessment should be connected to evidence. Evidence may include:</p>
          <Zh>每一个已验证记录和每一个 PQF 评估结果，都应连接到对应证据。证据可以包括：</Zh>
          <div className="mt-3 grid sm:grid-cols-2 gap-1 text-[11px] text-gray-600">
            {['Journal website', 'Editorial board page', 'Peer review policy page', 'APC policy page', 'Open access policy page', 'Copyright and license page', 'Publication ethics page', 'Retraction policy page', 'Crossref DOI metadata', 'OAI-PMH endpoint', 'DOAJ record', 'OpenAlex source record', 'Sitemap', 'Robots.txt', 'Schema.org metadata', 'Google Scholar citation tags'].map(e => (
              <div key={e} className="px-2 py-1" style={{ background: 'var(--posi-bg)' }}>{e}</div>
            ))}
          </div>
          <div className="mt-3">
            <Link href="/evidence" className="text-xs hover:underline transition-colors" style={{ color: 'var(--posi-accent)' }}>
              View Evidence Registry →
            </Link>
          </div>
        </div>
      </section>

      {/* Section 11: Correction and Removal */}
      <section className="bg-white border border-gray-200 mb-4">
        <SectionHeader num="11" title="Correction and Removal Policy" zh="纠错与移除政策" />
        <div className="p-5">
          <p className="text-xs text-gray-600 mb-3">POSI accepts correction requests from journals, publishers, editors, authors, and readers. Requests may concern:</p>
          <Zh>POSI 接受来自期刊、出版社、编辑、作者和读者的纠错请求。纠错内容可以包括：</Zh>
          <ul className="mt-3 space-y-1 text-[11px] text-gray-600">
            {[['Incorrect journal title', '期刊名称错误'], ['Incorrect ISSN', 'ISSN 错误'], ['Incorrect publisher information', '出版社信息错误'], ['Broken links', '链接失效'], ['Incorrect DOI metadata', 'DOI 元数据错误'], ['Incorrect article metadata', '文章元数据错误'], ['Outdated policy links', '政策页面过期'], ['Incorrect verification status', '验证状态错误'], ['Incorrect PQF evidence', 'PQF 证据错误'], ['Request for record removal', '记录移除请求']].map(([en, zh]) => (
              <li key={en} className="flex gap-2"><span className="text-gray-300">—</span>{en} <span style={{ color: 'var(--posi-muted)' }}>/ {zh}</span></li>
            ))}
          </ul>
          <p className="text-xs text-gray-500 mt-4">POSI may update, correct, flag, exclude, or remove records where appropriate.</p>
          <Zh>POSI 可根据情况更新、修正、标记、排除或移除相关记录。</Zh>
        </div>
      </section>

      {/* Section 12: Responsible Use */}
      <section className="bg-white border border-gray-200 mb-4">
        <SectionHeader num="12" title="Responsible Use Statement" zh="负责任使用声明" />
        <div className="p-5">
          <p className="text-xs text-gray-600 mb-3">POSI indicators should <strong>not</strong> be used as the sole basis for:</p>
          <Zh>POSI 指标不应作为以下事项的唯一依据：</Zh>
          <div className="mt-3 grid sm:grid-cols-2 gap-1 text-[11px]">
            {[['Researcher evaluation', '学者评价'], ['Hiring', '招聘'], ['Promotion', '晋升'], ['Funding decisions', '资助决策'], ['Institutional ranking', '机构排名'], ['Academic degree evaluation', '学位评价'], ['Journal blacklisting', '期刊黑名单']].map(([en, zh]) => (
              <div key={en} className="flex gap-2 px-2 py-1" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
                <span className="text-orange-400 shrink-0">✕</span>
                <span className="text-orange-700">{en} <span className="text-orange-300">/ {zh}</span></span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 13: Conflict of Interest */}
      <section className="bg-white border border-gray-200 mb-4">
        <SectionHeader num="13" title="Conflict of Interest Statement" zh="利益冲突声明" />
        <div className="p-5">
          <p className="text-xs text-gray-600 leading-relaxed mb-3">
            POSI is operated by Panorama Scholarly Group. Some journals listed in POSI may be published by Panorama Scholarly Group.
            Publisher-owned journals are evaluated using the same public criteria as all other records.
            When a journal is published by Panorama Scholarly Group, this relationship must be clearly disclosed on the journal record page.
          </p>
          <Zh>POSI 由 Panorama Scholarly Group 运营。POSI 中部分期刊可能由 Panorama Scholarly Group 出版。出版社自有期刊按照与其他记录相同的公开标准进行评估。该关系必须在期刊记录页面中明确披露。</Zh>
          <div className="mt-4 p-3 text-[11px] leading-relaxed" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8' }}>
            <strong>Required disclosure:</strong> This journal is published by Panorama Scholarly Group, the operator of POSI.
            The record is evaluated using the same public evidence criteria as all other POSI records.<br />
            <span className="text-blue-400">披露：本期刊由 POSI 运营方 Panorama Scholarly Group 出版。该记录按照与其他 POSI 记录相同的公开证据标准进行评估。</span>
          </div>
        </div>
      </section>

      {/* Section 14: Recommended Workflow */}
      <section className="bg-white border border-gray-200 mb-4">
        <SectionHeader num="14" title="Recommended Workflow" zh="推荐工作流程" />
        <div className="divide-y divide-gray-50">
          {WORKFLOW_STEPS.map(s => (
            <div key={s.step} className="p-4 flex gap-4 items-start">
              <div className="shrink-0 w-7 h-7 flex items-center justify-center font-mono font-bold text-xs text-white" style={{ background: 'var(--posi-accent)' }}>{s.step}</div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-gray-800 mb-0.5">{s.title} <span className="font-normal text-gray-400">/ {s.zh}</span></div>
                <p className="text-[11px] text-gray-600">{s.en}</p>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--posi-muted)' }}>{s.zhDesc}</p>
                {s.statuses.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {s.statuses.map(st => (
                      <span key={st} className="text-[9px] font-mono px-1.5 py-0.5" style={{ background: 'var(--posi-bg)', color: 'var(--posi-accent)', border: '1px solid var(--posi-border)' }}>
                        {st}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 15: Public Labels */}
      <section className="bg-white border border-gray-200 mb-4">
        <SectionHeader num="15" title="Recommended Public Labels" zh="推荐公开标签" />
        <div className="p-5">
          <div className="grid sm:grid-cols-2 gap-1.5">
            {[
              ['Auto-discovered metadata record', '自动发现元数据记录'],
              ['Imported metadata record', '已导入元数据记录'],
              ['Unverified record', '未验证记录'],
              ['Submitted for POSI review', '已提交 POSI 审核'],
              ['Under evidence review', '证据审核中'],
              ['POSI verified journal record', 'POSI 已验证期刊记录'],
              ['PQF evaluated', '已完成 PQF 评估'],
              ['Evidence available', '证据可查'],
              ['Correction requested', '已提交纠错请求'],
              ['Record excluded', '记录已排除'],
              ['Record removed', '记录已移除'],
            ].map(([en, zh]) => (
              <div key={en} className="text-[11px] px-3 py-1.5 flex justify-between gap-2" style={{ background: 'var(--posi-bg)', border: '1px solid var(--posi-border)' }}>
                <span className="font-mono text-gray-700">{en}</span>
                <span style={{ color: 'var(--posi-muted)' }}>{zh}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 16: Final Summary */}
      <section className="bg-white border border-gray-200 mb-6">
        <SectionHeader num="16" title="Final Policy Summary" zh="政策总结" />
        <div className="p-5">
          <p className="text-xs text-gray-600 leading-relaxed mb-4">
            POSI uses automatic discovery to build open scholarly metadata coverage, journal submissions to improve record accuracy,
            and manual evidence review to establish trust.
          </p>
          <Zh>POSI 通过自动发现建立开放学术元数据覆盖，通过期刊主动提交提高记录准确性，并通过人工证据审核建立可信度。</Zh>
          <div className="mt-4 space-y-2">
            {[
              ['Automatic discovery ≠ verification', '自动发现不等于验证'],
              ['Submission ≠ guaranteed inclusion', '主动提交不保证收录'],
              ['Verification ≠ endorsement', '通过验证不代表质量背书'],
              ['PQF = evidence-based transparency indicator, not an Impact Factor or journal ranking', 'PQF 是基于公开证据的透明度与元数据质量指标，不是影响因子，也不是期刊排名'],
            ].map(([en, zh]) => (
              <div key={en} className="text-xs p-3 border-l-2 border-[#c41e3a] pl-3" style={{ background: 'var(--posi-bg)' }}>
                <div className="font-medium text-gray-800">{en}</div>
                <div className="text-[10px] mt-0.5" style={{ color: 'var(--posi-muted)' }}>{zh}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-4 text-xs">
        <Link href="/pqf" style={{ color: 'var(--posi-accent)' }} className="hover:underline">PQF Methodology →</Link>
        <Link href="/evidence" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Evidence Registry →</Link>
        <Link href="/submit-journal" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Submit a Journal →</Link>
        <Link href="/about" style={{ color: 'var(--posi-accent)' }} className="hover:underline">About & Governance →</Link>
      </div>
    </div>
  )
}
