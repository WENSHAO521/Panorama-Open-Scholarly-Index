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
