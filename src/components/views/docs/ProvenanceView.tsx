// /docs/provenance/ in every language it is published in: the English page (En) and its Simplified Chinese translation (Zh).
import Link from 'next/link'
import { getAllRecords } from '@/lib/records-data'
import { toIndexRecord, freshnessOf, VERIFICATION, FRESHNESS, type Verification, type Freshness } from '@/lib/records'
import { PageHeader, SectionTitle, VerificationPill, FreshnessTag, fmt } from '@/components/db'
import type { Metadata } from 'next'
import type { Locale } from '@/i18n/config'
import { localizedHref, pageAlternates } from '@/i18n/alternates'
import { FRESHNESS_ZH, VERIFICATION_ZH } from '@/i18n/records-zh-Hans'

const EN_META = {
  title: 'Provenance and verification',
  description: 'How POSI assigns verification and freshness states, orders its sources, resolves duplicates and labels small samples.',
  alternates: { canonical: '/docs/provenance/' },
}

const TIERS = [
  { name: 'Persistent identifiers', body: 'ISSN, ISSN-L, DOI prefix, OpenAlex source id. Checked against the issuing registry before anything is called verified.' },
  { name: 'Open registry metadata', body: 'Crossref, OpenAlex, DOAJ and the ISSN Portal. Taken as-is and labelled with the registry it came from.' },
  { name: 'Publisher declarations', body: 'Frequency, peer-review model, license and country as stated by the journal. Recorded as declared, never as observed.' },
  { name: 'Computed values', body: 'Subjects, ratings and citation indicators from posi-engine under a named, versioned specification.' },
]

function En() {
  const all = getAllRecords()
  const idx = all.map(toIndexRecord)
  const byV = idx.reduce<Record<string, number>>((a, r) => { a[r.v] = (a[r.v] ?? 0) + 1; return a }, {})
  const byF = all.reduce<Record<string, number>>((a, j) => { const f = freshnessOf(j); a[f] = (a[f] ?? 0) + 1; return a }, {})

  return (
    <div className="pb-10 space-y-12 max-w-[900px]">
      <PageHeader title="Provenance and verification" crumbs={[{ label: 'Docs', href: '/docs/' }, { label: 'Provenance' }]}>
        <p>
          Every record states how much of it has been confirmed and how recently it changed. Identifiers are checked
          before anything else, open sources come first, and no value is upgraded because it merely looks right.
        </p>
      </PageHeader>

      <section aria-labelledby="verification">
        <SectionTitle id="verification" aside={`${fmt(idx.length)} records`}>Verification states</SectionTitle>
        <div className="panel overflow-x-auto">
          <table className="dtable">
            <thead><tr><th>State</th><th>Rule</th><th className="text-right">Records</th></tr></thead>
            <tbody>
              {(Object.keys(VERIFICATION) as Verification[]).map(v => (
                <tr key={v}>
                  <td className="whitespace-nowrap"><VerificationPill v={v} /></td>
                  <td className="text-[13.5px]">{VERIFICATION[v].rule}</td>
                  <td className="text-right font-mono tnum">{fmt(byV[v] ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
          The state describes the record&apos;s identity, not the journal&apos;s quality. A Discovered record marked
          needs check may describe an excellent journal; it only means POSI has not confirmed the record yet.
        </p>
      </section>

      <section aria-labelledby="freshness">
        <SectionTitle id="freshness">Freshness</SectionTitle>
        <ul className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(FRESHNESS) as Freshness[]).map(f => (
            <li key={f} className="panel p-4 flex items-start justify-between gap-4">
              <div>
                <FreshnessTag f={f} />
                <p className="mt-2 text-[13.5px]" style={{ color: 'var(--muted)' }}>{FRESHNESS[f].rule}</p>
              </div>
              <span className="font-mono tnum text-[18px]">{fmt(byF[f] ?? 0)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[13.5px]" style={{ color: 'var(--muted)' }}>
          Journal records use a 6 to 12 month window. Freshness is computed from each record&apos;s own update
          timestamp against the data cutoff; it is never assumed.
        </p>
      </section>

      <section aria-labelledby="order">
        <SectionTitle id="order">Source order</SectionTitle>
        <ol className="space-y-3">
          {TIERS.map((t, i) => (
            <li key={t.name} className="grid grid-cols-[28px_minmax(0,1fr)] gap-3">
              <span className="font-mono text-[13px] pt-0.5" style={{ color: 'var(--teal)' }}>{i + 1}</span>
              <div>
                <p className="font-medium" style={{ color: 'var(--ink)' }}>{t.name}</p>
                <p className="text-[14px] leading-relaxed" style={{ color: 'var(--muted)' }}>{t.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-[14px]">Each field&apos;s basis is listed in the <Link href="/docs/schema/" className="link">record schema</Link>.</p>
      </section>

      <section aria-labelledby="dedup" className="prose-doc">
        <h2 id="dedup" style={{ marginTop: 0 }}>Duplicates and identity</h2>
        <p>
          Records are merged on identifiers in this order: ISSN-L, canonical ISSN pair, OpenAlex source id. Title
          similarity alone never merges two records. Every possible duplicate found during the identity migration
          was resolved with a live lookup: 166 groups merged, 5 confirmed distinct, none left ambiguous. The audit is
          linked from <Link href="/datasets/#audits">Datasets</Link>.
        </p>
        <p>
          Unknown values stay unknown. An ISSN, year, publisher or license that was not found is stored as null and
          shown as &quot;Not recorded&quot;, never filled with a best guess.
        </p>

        <h2>Small samples</h2>
        <p>
          Citation indicators computed from very few items are labelled on every record page: fewer than 5 items is
          <em> illustrative</em>, 5 to 19 is a <em>limited sample</em>. These labels travel with the number so a
          value from three articles is never read as if it came from three hundred.
        </p>

        <h2>Declared versus observed</h2>
        <p>
          What a journal says about itself (peer-review model, frequency, license) is kept apart from what POSI or a
          registry observed (registered articles, DOAJ listing, ISSN country). Record pages show them in separate
          sections so a declaration is never presented as a measurement.
        </p>
      </section>
    </div>
  )
}

export function provenanceMetadata(locale: Locale): Metadata {
  const m = locale === 'zh-Hans' ? ZH_META : EN_META
  return { title: m.title, description: m.description, alternates: pageAlternates('/docs/provenance/', locale) }
}

export function ProvenanceView({ locale }: { locale: Locale }) {
  return locale === 'zh-Hans' ? <Zh /> : <En />
}

const ZH_META = {
  title: '数据溯源与核验',
  description: 'POSI 如何赋予核验状态与时效状态、排列数据来源的优先顺序、处理重复记录，以及标注小样本。',
}

const L = (p: string) => localizedHref('zh-Hans', p)

const TIERS_ZH = [
  { name: '永久标识符', body: 'ISSN、ISSN-L、DOI 前缀、OpenAlex 来源 ID。在任何内容被标记为已核验之前，先与签发注册机构核对。' },
  { name: '开放注册机构元数据', body: 'Crossref、OpenAlex、DOAJ 与 ISSN Portal。按原样采用，并标注所来自的注册机构。' },
  { name: '出版方自述', body: '期刊所声明的出版频率、同行评审模式、许可协议与国家/地区。记录为“自述”，从不记录为观察结果。' },
  { name: '计算值', body: '学科、评级与引文指标，由 posi-engine 依据有名称、有版本号的规范计算。' },
]

function Zh() {
  const all = getAllRecords()
  const idx = all.map(toIndexRecord)
  const byV = idx.reduce<Record<string, number>>((a, r) => { a[r.v] = (a[r.v] ?? 0) + 1; return a }, {})
  const byF = all.reduce<Record<string, number>>((a, j) => { const f = freshnessOf(j); a[f] = (a[f] ?? 0) + 1; return a }, {})

  return (
    <div className="pb-10 space-y-12 max-w-[900px]">
      <PageHeader locale="zh-Hans" title="数据溯源与核验" crumbs={[{ label: '文档', href: L('/docs/') }, { label: '数据溯源' }]}>
        <p>
          每条记录都会说明其中有多少内容已经确认，以及最近一次变更的时间。标识符最先核查，开放来源优先采用，任何值都不会仅因看似正确而被升级。
        </p>
      </PageHeader>

      <section aria-labelledby="verification">
        <SectionTitle id="verification" aside={`${fmt(idx.length)} 条记录`}>核验状态</SectionTitle>
        <div className="panel overflow-x-auto">
          <table className="dtable">
            <thead><tr><th>状态</th><th>规则</th><th className="text-right">记录数</th></tr></thead>
            <tbody>
              {(Object.keys(VERIFICATION) as Verification[]).map(v => (
                <tr key={v}>
                  <td className="whitespace-nowrap"><VerificationPill v={v} locale="zh-Hans" /></td>
                  <td className="text-[13.5px]">{VERIFICATION_ZH[v].rule}</td>
                  <td className="text-right font-mono tnum">{fmt(byV[v] ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
          该状态描述的是记录的身份信息，而非期刊的质量。标记为“待核查”的 Discovered 记录可能描述的是一本优秀的期刊，这只表示 POSI 尚未确认该记录。
        </p>
      </section>

      <section aria-labelledby="freshness">
        <SectionTitle id="freshness">时效状态</SectionTitle>
        <ul className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(FRESHNESS) as Freshness[]).map(f => (
            <li key={f} className="panel p-4 flex items-start justify-between gap-4">
              <div>
                <FreshnessTag f={f} locale="zh-Hans" />
                <p className="mt-2 text-[13.5px]" style={{ color: 'var(--muted)' }}>{FRESHNESS_ZH[f].rule}</p>
              </div>
              <span className="font-mono tnum text-[18px]">{fmt(byF[f] ?? 0)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[13.5px]" style={{ color: 'var(--muted)' }}>
          期刊记录采用 6 至 12 个月的时间窗口。时效状态依据每条记录自身的更新时间戳与数据截止日期计算，从不凭推定。
        </p>
      </section>

      <section aria-labelledby="order">
        <SectionTitle id="order">来源顺序</SectionTitle>
        <ol className="space-y-3">
          {TIERS_ZH.map((t, i) => (
            <li key={t.name} className="grid grid-cols-[28px_minmax(0,1fr)] gap-3">
              <span className="font-mono text-[13px] pt-0.5" style={{ color: 'var(--teal)' }}>{i + 1}</span>
              <div>
                <p className="font-medium" style={{ color: 'var(--ink)' }}>{t.name}</p>
                <p className="text-[14px] leading-relaxed" style={{ color: 'var(--muted)' }}>{t.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-[14px]">各字段的依据列于<Link href={L('/docs/schema/')} className="link">记录结构</Link>。</p>
      </section>

      <section aria-labelledby="dedup" className="prose-doc">
        <h2 id="dedup" style={{ marginTop: 0 }}>重复记录与身份识别</h2>
        <p>
          记录按以下顺序依据标识符合并：ISSN-L、规范 ISSN 对、OpenAlex 来源 ID。仅凭刊名相似从不合并两条记录。身份迁移中发现的每组疑似重复记录都经过实时查询处理：合并 166 组，确认 5 组为不同期刊，没有遗留不明确的情况。审计报告的链接见<Link href={L('/datasets/#audits')}>数据集</Link>。
        </p>
        <p>
          未知的值保持未知。未找到的 ISSN、年份、出版商或许可协议以 null 存储，显示为“未记录”，从不以最佳猜测填充。
        </p>

        <h2>小样本</h2>
        <p>
          由极少文献计算得出的引文指标，会在每个记录页面上加以标注：少于 5 篇为<em>仅供参考</em>，5 至 19 篇为<em>样本有限</em>。这些标注始终随数值一同显示，以免将基于三篇文章的数值当作基于三百篇文章的数值来解读。
        </p>

        <h2>自述与观察</h2>
        <p>
          期刊关于自身的陈述（同行评审模式、出版频率、许可协议）与 POSI 或注册机构的观察结果（已注册文章、DOAJ 收录、ISSN 注册国家/地区）分开记录。记录页面将两者分区显示，以免将自述内容呈现为测量结果。
        </p>
      </section>
    </div>
  )
}
