// Data downloads (/datasets/), in every language they are published in. File paths, field names and licence names
// are not translated.
import Link from 'next/link'
import type { Metadata } from 'next'
import { getAllRecords, getStaticRecordJournals } from '@/lib/records-data'
import { toIndexRecord, type Collection } from '@/lib/records'
import { DISCOVERED_JOURNALS } from '@/lib/data'
import { getDirectory, getDirectoryCategories, getPublishers } from '@/lib/global-journals'
import { getRankings, RANKING_DOWNLOADS } from '@/lib/rankings'
import { DATA_BASE, dataUrl } from '@/lib/data-base'
import { PUBLISHER_SHARD_COUNT } from '@/lib/publishers'
import psc from '@/lib/psc-v1.0.snapshot.json'
import { PageHeader, SectionTitle, fmt } from '@/components/db'
import { SnapshotPanel } from '@/components/SnapshotPanel'
import type { Locale } from '@/i18n/config'
import { localizedHref, pageAlternates } from '@/i18n/alternates'
import { fill } from '@/i18n/format'

const en = {
  title: 'Datasets',
  description: 'Download every POSI file: the global journal directory, publishers, rankings, curated journal records in JSON and CSV, the PSC subject classification and the checksummed canonical snapshot.',
  lead: 'The global journal directory, publishers, rankings, curated journal records and the subject classification, under open licences. Every file is regenerated from the current data.',
  th: { path: 'Path', contents: 'Contents', records: 'Records', size: 'Size', formats: 'Formats' },
  global: 'Global index',
  globalLead: '{journals} journals registered with Crossref or OpenAlex, the {publishers} publishers behind them, and the ranking edition.',
  globalMissing: 'The global corpus was not available for this build, so these files hold the curated records only.',
  files: {
    directoryIndex: 'Global journal directory: totals, and the file list for each subject category',
    directory: 'Every indexed journal, one file per PSC category; categories over 4,000 journals are split by first letter',
    publishers: 'Every publisher with indexed journals: journal, Core, open-access and DOAJ counts, and works',
    publisherShards: 'Publisher details with subjects, countries and every journal, in {n} hashed shards',
    ranking: 'Citation Ranking {year} (PNCI-1.0): the edition\'s versions, snapshot date and thresholds, and the file list per subject category; the CSV has the {ranked} ranked journals',
    rankingAll: 'Every journal of the Citation Ranking edition, all ranking statuses, as one CSV',
    rankingCategory: 'PNCI, citation rank, percentile, Citation Quartile, POSI Zone and ranking status per journal, one file per PSC category, with PCS as a descriptive field and PCI, also descriptive, for Core Collection journals only',
    core: 'Core Collection records, compact index',
    benchmark: 'Global Benchmark curated seed, compact index',
    discovered: 'Discovered and other curated (not certified) records, compact index',
    journal: 'Full record with status and indicators, one file per Core and Benchmark journal',
    discoveredShards: 'Full Discovered records, 64 shards by a hash of the record key',
    psc: 'PSC subject taxonomy v{version}',
    schema: 'Field dictionary and index key map (see Record schema)',
    stats: 'Record counts by collection and verification state',
  },
  curated: 'Curated records',
  curatedLeadA: 'Records POSI holds with a permanent POSI-J id. Index files use short keys, documented in the ', schemaLink: 'record schema', curatedLeadB: '.',
  canonical: 'Canonical snapshot',
  canonicalLead: 'Each snapshot is immutable and records the data and engine versions it was computed from, with SHA-256 checksums.',
  audits: 'Published audits', allAudits: 'All audits on GitHub',
  auditsLead: 'Every change to the curated corpus is published with its method, counts and per-record files in the posi-data repository.',
  auditTh: { audit: 'Audit', date: 'Date', summary: 'Summary' },
  licences: 'Licences',
  licenceRows: [
    ['POSI-produced data (PSC, scores, rankings, curated metadata)', 'CC BY 4.0'],
    ['Source code of this site and posi-engine', 'MIT'],
    ['Upstream metadata (Crossref, OpenAlex, DOAJ, ROR, ORCID)', 'Source license'],
  ],
  licenceNote: 'POSI is open source. Third-party open data are credited and keep their original licences.',
  citeTitle: 'Cite the dataset',
  audit: [
    ['POSI Journal Evaluation Architecture 1.0', 'AJR Ratings (A+ to D) added from each published AJR score; legacy E-Q/M-Q quartiles, PCS-Q quartiles and PCI Citation Q kept as archive and retired as rankings. Citation Rankings move to PNCI-1.0.'],
    ['Global index and PCS edition', 'Every journal registered with Crossref or described by OpenAlex, 158,242 after merging on ISSN; PCS computed from Crossref for each (journals looked up under each of their ISSNs). Its PCS-Q ranks are retired (POSI-EVAL-1.0).'],
    ['PCS ETL, full scope', 'POSI Citation Score from Crossref data for 4,320 journals (the 31 Core Collection journals and the full 4,289-journal Global Benchmark): 6.77 million works fetched, PCS computed for 4,089.'],
    ['AJR-E-1.1 rerate, Core Collection', 'First run of the Early-Stage rating against all 31 Core Collection journals, combining site-crawl and Crossref article-sample evidence.'],
    ['Publisher-expansion canonical records', 'Wrote the 2,177 journal records that the Elsevier and Frontiers expansion had minted ids for, so every registry id resolves to a record.'],
    ['Citation preview correction', 'Withdrew provisional citation quartiles on 3,245 Global Benchmark records and replaced them with a diagnostic-only preview: Benchmark membership alone does not make a journal ranking-eligible.'],
    ['Elsevier and Frontiers expansion', "Global Benchmark grown from 1,000 to 4,289 records from the publishers' own title lists (3,113 Elsevier, 183 Frontiers), with every identity conflict resolved in a second-round re-run."],
    ['Core and Benchmark identity remap', 'All 1,000 Global Benchmark and 31 Core Collection journals resolved against the 24,205-record registry: 0 new ids, 0 conflicts, 0 left for manual review.'],
    ['Initial journal migration', '23,822 legacy source records audited in two independent dry runs with byte-identical output; 171 possible-duplicate groups resolved (166 merged, 5 kept distinct); 23,331 POSI-J ids minted, 0 collisions.'],
  ] as [string, string][],
}
const WORDS: Record<Locale, typeof en> = {
  en,
  'zh-Hans': {
    title: '数据下载',
    description: '下载 POSI 全部数据文件：全球期刊目录、出版商、排名、JSON 与 CSV 格式的精选期刊记录、PSC 学科分类，以及附校验和的规范快照。',
    lead: '全球期刊目录、出版商、排名、精选期刊记录与学科分类，均以开放许可协议发布。所有文件均依据当前数据重新生成。',
    th: { path: '路径', contents: '内容', records: '记录数', size: '大小', formats: '格式' },
    global: '全球索引',
    globalLead: '在 Crossref 或 OpenAlex 注册的 {journals} 种期刊、其背后的 {publishers} 家出版商，以及当前排名版本。',
    globalMissing: '本次构建未能获取全球语料，以下文件仅包含精选记录。',
    files: {
      directoryIndex: '全球期刊目录：总量统计，以及各学科类别的文件列表',
      directory: '全部已收录期刊，每个 PSC 类别一个文件；期刊数超过 4,000 种的类别按首字母拆分',
      publishers: '拥有已收录期刊的全部出版商：期刊数、核心合集期刊数、开放获取期刊数、DOAJ 收录数及文献量',
      publisherShards: '出版商详情，含学科、国家/地区及全部期刊，按哈希分为 {n} 个分片',
      ranking: '{year} 年引文排名（PNCI-1.0）：该版本的各项版本号、快照日期与阈值，以及各学科类别的文件列表；CSV 文件包含 {ranked} 种已排名期刊',
      rankingAll: '本版引文排名的全部期刊（含各种排名状态），单个 CSV 文件',
      rankingCategory: '各期刊的 PNCI、引文排名、百分位、引文分区、POSI Zone 与排名状态，每个 PSC 类别一个文件；PCS 作为描述性字段提供，PCI 同为描述性字段，仅适用于核心合集期刊',
      core: '核心合集记录，精简索引',
      benchmark: 'Global Benchmark 精选种子集，精简索引',
      discovered: 'Discovered 及其他精选（未认证）记录，精简索引',
      journal: '含状态与各项指标的完整记录，每种核心合集及 Benchmark 期刊一个文件',
      discoveredShards: 'Discovered 完整记录，按记录键的哈希分为 64 个分片',
      psc: 'PSC 学科分类体系 v{version}',
      schema: '字段词典与索引键对照表（见记录结构）',
      stats: '按合集与核验状态统计的记录数',
    },
    curated: '精选记录',
    curatedLeadA: 'POSI 持有并赋予永久 POSI-J 编号的记录。索引文件使用缩写键名，说明见', schemaLink: '记录结构', curatedLeadB: '。',
    canonical: '规范快照',
    canonicalLead: '每个快照一经发布即不可更改，并记录其计算所依据的数据版本与引擎版本，附 SHA-256 校验和。',
    audits: '已发布的审计', allAudits: '在 GitHub 查看全部审计',
    auditsLead: '精选语料的每一次变更，均连同其方法、统计数据和逐条记录文件发布于 posi-data 代码库。',
    auditTh: { audit: '审计', date: '日期', summary: '摘要' },
    licences: '许可协议',
    licenceRows: [
      ['POSI 产出的数据（PSC、评分、排名、精选元数据）', 'CC BY 4.0'],
      ['本站及 posi-engine 的源代码', 'MIT'],
      ['上游元数据（Crossref、OpenAlex、DOAJ、ROR、ORCID）', '沿用来源许可'],
    ],
    licenceNote: 'POSI 是开源项目。第三方开放数据均注明来源，并保留其原有许可协议。',
    citeTitle: '引用本数据集',
    audit: [
      ['POSI 期刊评价体系 1.0', '依据已发布的 AJR 分值新增 AJR 评级（A+ 至 D）；原有的 E-Q/M-Q 分区、PCS-Q 分区与 PCI 引文分区作为存档保留，不再用于排名。引文排名改用 PNCI-1.0。'],
      ['全球索引与 PCS 版本', '收录在 Crossref 注册或由 OpenAlex 描述的全部期刊，按 ISSN 合并后共 158,242 种；依据 Crossref 数据为每种期刊计算 PCS（按期刊的每个 ISSN 分别查询）。其 PCS-Q 排名已停用（POSI-EVAL-1.0）。'],
      ['PCS ETL（全范围）', '依据 Crossref 数据为 4,320 种期刊（31 种核心合集期刊及完整的 4,289 种 Global Benchmark 期刊）计算 POSI Citation Score：共获取 677 万篇文献，为 4,089 种期刊算出 PCS。'],
      ['核心合集 AJR-E-1.1 重新评级', '首次对全部 31 种核心合集期刊开展 Early-Stage 评级，综合网站抓取与 Crossref 文章抽样两方面证据。'],
      ['出版商扩充的规范记录', '为 Elsevier 与 Frontiers 扩充时已分配编号的 2,177 种期刊写入记录，使注册表中的每个编号都对应一条记录。'],
      ['引文预览更正', '撤回 3,245 条 Global Benchmark 记录上的暂定引文分区，改为仅供诊断的预览：仅凭 Benchmark 成员身份，期刊并不具备排名资格。'],
      ['Elsevier 与 Frontiers 扩充', '依据出版商自身的期刊清单（Elsevier 3,113 种、Frontiers 183 种），将 Global Benchmark 由 1,000 条扩充至 4,289 条，所有身份冲突均在第二轮复核中解决。'],
      ['核心合集与 Benchmark 身份重新映射', '全部 1,000 种 Global Benchmark 期刊与 31 种核心合集期刊均与 24,205 条记录的注册表完成匹配：新增编号 0 个，冲突 0 个，待人工复核 0 条。'],
      ['期刊初始迁移', '对 23,822 条旧来源记录进行两次独立试运行审计，输出逐字节一致；处理 171 组疑似重复（合并 166 组，5 组保留为不同期刊）；分配 23,331 个 POSI-J 编号，无冲突。'],
    ],
  },
}

export function datasetsMetadata(locale: Locale): Metadata {
  const w = WORDS[locale]
  return { title: w.title, description: w.description, alternates: pageAlternates('/datasets/', locale) }
}

function kb(bytes: number) {
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

interface DataFile { path: string; alt?: string; rows: number | null; bytes: number | null; what: string }

/** Short name shown for a file: its path under the data or rankings folder. */
const fileName = (url: string) => url.replace(`${RANKING_DOWNLOADS}/`, 'rankings/').replace(`${DATA_BASE}/`, '')

function FileTable({ files, w }: { files: DataFile[]; w: typeof en }) {
  return (
    <div className="panel overflow-x-auto">
      <table className="dtable min-w-[720px]">
        <thead><tr><th>{w.th.path}</th><th>{w.th.contents}</th><th className="text-right">{w.th.records}</th><th className="text-right">{w.th.size}</th><th>{w.th.formats}</th></tr></thead>
        <tbody>
          {files.map(f => (
            <tr key={f.path}>
              <td className="font-mono text-[13px] whitespace-nowrap">
                {f.path.includes('{') ? fileName(f.path) : <a className="link" href={f.path}>{fileName(f.path)}</a>}
              </td>
              <td className="text-[13.5px]" style={{ color: 'var(--ink-2)' }}>{f.what}</td>
              <td className="text-right font-mono tnum text-[13px]">{f.rows === null ? '' : fmt(f.rows)}</td>
              <td className="text-right font-mono tnum text-[13px]" style={{ color: 'var(--muted)' }}>{f.bytes ? kb(f.bytes) : ''}</td>
              <td className="text-[13px] whitespace-nowrap">
                JSON{f.alt && <>, <a className="link" href={f.alt}>CSV</a></>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const AUDIT_BASE = 'https://github.com/WENSHAO521/posi-data/tree/master/audits/'

// Audits published in posi-data, newest first; their names and summaries are the `audit` entries of the words above,
// in the same order.
const AUDITS = [
  { date: '2026-09-28', path: 'migrations/evaluation-architecture-1.0-2026' },
  { date: '2026-09-27', path: 'global-index/global-index-2026-09-26' },
  { date: '2026-08-14', path: 'pcs-etl/pcs-etl-v1-global1024-2026' },
  { date: '2026-08-14', path: 'ratings/ajr-e-1.1-rerate-core30-2026' },
  { date: '2026-08-13', path: 'migrations/publisher-expansion-canonical-records-2026' },
  { date: '2026-08-13', path: 'migrations/citation-preview-correction-2026' },
  { date: '2026-08-12', path: 'migrations/elsevier-jnlactive-expansion-2026' },
  { date: '2026-08', path: 'migrations/benchmark-identity-remap-2026' },
  { date: '2026', path: 'migrations/initial-journal-migration' },
]

export function DatasetsView({ locale }: { locale: Locale }) {
  const w = WORDS[locale]
  const f = w.files
  const idx = getAllRecords().map(toIndexRecord)
  const group = (ks: Collection[]) => idx.filter(r => ks.includes(r.k))
  const core = group(['core'])
  const bench = group(['benchmark'])
  const disc = group(['discovered', 'curated'])

  const { records: directory, source } = getDirectory()
  const categories = getDirectoryCategories().filter(c => c.count > 0)
  const publishers = getPublishers()
  const { all, ranked, year } = getRankings()

  const global: DataFile[] = [
    { path: dataUrl('journals/index.json'), rows: categories.length, bytes: null, what: f.directoryIndex },
    { path: dataUrl('journals/{category}.json'), rows: directory.length, bytes: JSON.stringify(directory).length, what: f.directory },
    { path: dataUrl('meta/publishers.json'), rows: publishers.length, bytes: JSON.stringify(publishers).length, what: f.publishers },
    { path: `${DATA_BASE}/publishers/{00-${(PUBLISHER_SHARD_COUNT - 1).toString(16)}}.json`, rows: publishers.length, bytes: null, what: fill(f.publisherShards, { n: PUBLISHER_SHARD_COUNT }) },
    { path: `${RANKING_DOWNLOADS}/citation-${year}.json`, alt: `${RANKING_DOWNLOADS}/citation-${year}.csv`, rows: all.length, bytes: null, what: fill(f.ranking, { year, ranked: ranked.length.toLocaleString('en-US') }) },
    { path: `${RANKING_DOWNLOADS}/citation-${year}-all.csv`, rows: all.length, bytes: null, what: f.rankingAll },
    { path: `${RANKING_DOWNLOADS}/citation-${year}-{category}.json`, rows: all.length, bytes: null, what: f.rankingCategory },
  ]

  const curated: DataFile[] = [
    { path: dataUrl('index/core.json'), alt: dataUrl('index/core.csv'), rows: core.length, bytes: JSON.stringify(core).length, what: f.core },
    { path: dataUrl('index/benchmark.json'), alt: dataUrl('index/benchmark.csv'), rows: bench.length, bytes: JSON.stringify(bench).length, what: f.benchmark },
    { path: dataUrl('index/discovered.json'), alt: dataUrl('index/discovered.csv'), rows: disc.length, bytes: JSON.stringify(disc).length, what: f.discovered },
    { path: dataUrl('journal/{code}.json'), rows: getStaticRecordJournals().length, bytes: null, what: f.journal },
    { path: dataUrl('records/discovered-{00-63}.json'), rows: DISCOVERED_JOURNALS.length, bytes: JSON.stringify(DISCOVERED_JOURNALS).length, what: f.discoveredShards },
    { path: dataUrl('meta/psc.json'), rows: psc.categories.length, bytes: JSON.stringify(psc).length, what: fill(f.psc, { version: psc.version }) },
    { path: dataUrl('meta/schema.json'), rows: null, bytes: null, what: f.schema },
    { path: dataUrl('meta/stats.json'), rows: null, bytes: null, what: f.stats },
  ]

  return (
    <div className="wrap">
      <PageHeader locale={locale} title={w.title} crumbs={[{ label: 'POSI', href: localizedHref(locale, '/') }, { label: w.title }]}>
        <p className="max-w-[65ch]">{w.lead}</p>
      </PageHeader>

      <div className="space-y-14">
        <section aria-labelledby="global-files">
          <SectionTitle id="global-files">{w.global}</SectionTitle>
          <p className="text-[14px] mb-4 max-w-[70ch]" style={{ color: 'var(--muted)' }}>
            {source === 'global'
              ? fill(w.globalLead, { journals: fmt(directory.length), publishers: fmt(publishers.length) })
              : w.globalMissing}
          </p>
          <FileTable files={global} w={w} />
        </section>

        <section aria-labelledby="site-files">
          <SectionTitle id="site-files">{w.curated}</SectionTitle>
          <p className="text-[14px] mb-4 max-w-[70ch]" style={{ color: 'var(--muted)' }}>
            {w.curatedLeadA}<Link href={localizedHref(locale, '/docs/schema/')} className="link">{w.schemaLink}</Link>{w.curatedLeadB}
          </p>
          <FileTable files={curated} w={w} />
        </section>

        <section aria-labelledby="canonical">
          <SectionTitle id="canonical">{w.canonical}</SectionTitle>
          <p className="text-[14px] mb-4 max-w-[70ch]" style={{ color: 'var(--muted)' }}>
            {w.canonicalLead}
          </p>
          <SnapshotPanel />
        </section>

        <section aria-labelledby="audits">
          <SectionTitle id="audits" aside={<a href={AUDIT_BASE} className="link" target="_blank" rel="noopener">{w.allAudits}</a>}>{w.audits}</SectionTitle>
          <p className="text-[14px] mb-4 max-w-[70ch]" style={{ color: 'var(--muted)' }}>
            {w.auditsLead}
          </p>
          <div className="panel overflow-x-auto">
            <table className="dtable min-w-[720px]">
              <thead><tr><th>{w.auditTh.audit}</th><th>{w.auditTh.date}</th><th>{w.auditTh.summary}</th></tr></thead>
              <tbody>
                {AUDITS.map((a, i) => (
                  <tr key={a.path}>
                    <td className="whitespace-nowrap align-top">
                      <a href={AUDIT_BASE + a.path} className="link font-medium" target="_blank" rel="noopener">{w.audit[i][0]}</a>
                    </td>
                    <td className="font-mono text-[12.5px] whitespace-nowrap align-top" style={{ color: 'var(--muted)' }}>{a.date}</td>
                    <td className="text-[13.5px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>{w.audit[i][1]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="licences" className="max-w-[760px]">
          <SectionTitle id="licences">{w.licences}</SectionTitle>
          <div className="panel overflow-hidden">
            <table className="dtable">
              <tbody>
                {w.licenceRows.map(([what, licence], i) => (
                  <tr key={what}><td>{what}</td><td className={i < 2 ? 'font-mono whitespace-nowrap' : 'whitespace-nowrap'}>{licence}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[13px]" style={{ color: 'var(--muted)' }}>{w.licenceNote}</p>
        </section>

        <section aria-labelledby="cite" className="max-w-[820px] pb-10">
          <SectionTitle id="cite">{w.citeTitle}</SectionTitle>
          <pre className="code whitespace-pre-wrap"><code>{`Panorama Open Scholarly Index (${new Date().getFullYear()}). POSI journal records. Panorama Scholarly Group. https://posi.panorama-sg.com/datasets/. Accessed [date]. Licence: CC BY 4.0.`}</code></pre>
        </section>
      </div>
    </div>
  )
}
