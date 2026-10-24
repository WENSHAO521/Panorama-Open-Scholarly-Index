// Simplified Chinese names of the record states and fields shown on journal records. English comes from
// lib/records and lib/schema; the keys here mirror theirs.
import type { Collection, Freshness, Verification } from '@/lib/records'
import type { Basis } from '@/lib/schema'

export const COLLECTIONS_ZH: Record<Collection, { label: string; description: string }> = {
  core: {
    label: '核心合集',
    description: '已认证。期刊已申请认证并通过 PQF 编辑评审。核心合集期刊可展示 POSI 核心合集徽标；其引文排名与所有期刊适用相同规则。',
  },
  curated: { label: '已收录，精选记录', description: '已收录。POSI 持有该期刊的精选记录及永久 POSI-J 编号。未经认证，不属于核心合集。' },
  benchmark: { label: '已收录，Benchmark 参照集', description: '已收录。同时属于 POSI 用以检验其方法的 Global Benchmark 参照集。' },
  discovered: { label: '已收录，精选记录', description: '已收录。POSI 持有该期刊的精选记录及永久 POSI-J 编号，记录依据 DOAJ、Crossref 与 OpenAlex 建立。' },
}

export const VERIFICATION_ZH: Record<Verification, { label: string; rule: string }> = {
  VERIFIED: { label: '已核验', rule: '已核查永久标识符（ISSN、DOI 前缀），并依据 PQF 审阅了出版方证据。' },
  PARTIALLY_VERIFIED: { label: '部分核验', rule: 'ISSN 已对应到 OpenAlex 来源记录；期刊层面的证据未经 POSI 审阅。' },
  NEEDS_CHECK: { label: '待核查', rule: '采集自开放注册机构，内容合理，但未经独立确认。请勿用于需要高可信度的陈述。' },
  REJECTED: { label: '已否决', rule: '无法确认，或证据与注册记录相矛盾。仅作为审计记录保留。' },
}

export const FRESHNESS_ZH: Record<Freshness, { label: string; rule: string }> = {
  CURRENT: { label: '最新', rule: '记录在数据截止日期前 6 个月内更新过。' },
  AGING: { label: '较旧', rule: '记录最后更新于数据截止日期前 6–12 个月。' },
  STALE: { label: '过时', rule: '记录最后更新于数据截止日期前 12 个月以上，有待更新。' },
  UNKNOWN: { label: '未知', rule: '记录没有可靠的更新时间戳。' },
}

export const BASIS_ZH: Record<Basis, { label: string; description: string }> = {
  identifier: { label: '标识符', description: '永久标识符，尽可能与签发注册机构核对。' },
  declared: { label: '自述', description: '出版方关于自身的陈述（网站、作者指南），未经独立测量。' },
  registry: { label: '注册机构', description: '原样取自开放学术注册机构（Crossref、OpenAlex、DOAJ、ISSN Portal）。' },
  computed: { label: '计算', description: '由 posi-engine 依据有版本号的公开规范，从注册数据计算得出。' },
  curated: { label: '编辑整理', description: '依据 POSI 收录规则赋值（例如准入门槛、Benchmark 遴选）。' },
}

/** Field labels shown on a journal record, by schema key. */
export const FIELD_LABEL_ZH: Record<string, string> = {
  posi_id: 'POSI ID', title: '刊名', alternate_titles: '又名', issn_online: 'eISSN', issn_print: 'pISSN',
  openalex_source_id: 'OpenAlex 来源', publisher: '出版商', registration_country: 'ISSN 注册国家/地区',
  country: '自述国家/地区', language: '语言', frequency: '出版频率', open_access: '开放获取', license: '许可协议',
  peer_review_type: '同行评审', doaj_status: 'DOAJ 状态', website_url: '网站', apc: '文章处理费（APC）', article_count: '文章数',
}

/** Field sources as the schema states them; only the words are translated, registry names stay as they are. */
export function fieldSourceZh(source: string): string {
  return source.replace(/\bPublisher\b/g, '出版方').replace(/\bJournal website\b/g, '期刊网站')
}

/** What each schema field means (record schema page), by schema key. */
export const FIELD_DESCRIPTION_ZH: Record<string, string> = {
  posi_id: '永久 POSI 标识符，从不重复使用，也从不重新分配。',
  journal_code: '用于记录路径（/journal/<code>/）的 URL 安全键。',
  title: '在 ISSN Portal 注册的期刊刊名。',
  alternate_titles: '期刊的其他名称：曾用名、译名、缩写及其他变体，例如期刊更名后仍滞后的 Crossref/OpenAlex 刊名。可检索，但从不作为显示刊名。',
  issn_online: '电子版 ISSN。未注册时为 null，从不推测。',
  issn_print: '印刷版 ISSN。未注册时为 null。',
  openalex_source_id: 'ISSN 所对应的 OpenAlex 来源记录。',
  publisher: '注册的出版商名称。',
  registration_country: 'ISSN 注册国家/地区，不一定是期刊实际运营所在地。',
  country: '出版方自述的运营所在国家/地区。',
  language: '主要出版语言。',
  frequency: '自述出版频率，实际出版节奏可能不同。',
  open_access: '期刊是否被记录为完全开放获取。未知时为 null，例如 DOAJ 未收录、且无其他来源说明的期刊。',
  license: '文章默认许可协议。',
  peer_review_type: '自述的同行评审模式。POSI 不直接观察评审过程。',
  doaj_status: 'listed · application_submitted · not_listed · null（未核查）。',
  website_url: '期刊主页。',
  apc: '期刊在其网站上公布的 APC，附公布页面及 POSI 核查日期。金额为 0 表示期刊声明不收取 APC。POSI 未找到公布的 APC 时不含此字段。',
  article_count: '截至数据截止日期，以该期刊 ISSN 注册的 DOI 数量。',
  psc_category: '依据期刊 OpenAlex 主题分布得出的 POSI 学科分类（PSC）类别。',
  psc_confidence: 'high · low。low 表示没有单一主题占主导，常见于多学科期刊。',
  pqf: '编辑遴选证据得分，含六个子因子。仅用作核心合集的准入门槛。',
  early_stage_rating: '生命周期阶段；对于创刊 12–59 个月且可评级的期刊，还包括其 AJR-E 得分与评级。仅限核心合集期刊。空字段从不以估计值填充。',
  mature_rating: '对于创刊 60 个月及以上的期刊：其 AJR-M 评级状态、可评级时的得分与评级、模型版本及评级日期。仅限核心合集期刊；自 AJR-M-1.2 起发布。',
  collection: 'core · curated · benchmark · discovered。仅 core 为已认证；curated 为核心合集以外的 POSI 精选记录。',
  verification: 'VERIFIED · PARTIALLY_VERIFIED · NEEDS_CHECK · REJECTED。',
  updated_at: '记录中任一字段最后一次变更的时间。',
}

/** Notes on the one-letter keys of the index files, by key. */
export const INDEX_NOTE_ZH: Record<string, string> = {
  i: '数组，电子版在前，已去重', co: '统一为英文显示名称', u: '仅日期',
}
