// /docs/schema/ in every language it is published in: the English page (En) and its Simplified Chinese translation (Zh).
import Link from 'next/link'
import { JOURNAL_FIELDS, INDEX_KEYS, BASIS, type Basis } from '@/lib/schema'
import { PageHeader, SectionTitle, BasisTag } from '@/components/db'
import { dataUrl } from '@/lib/data-base'
import type { Metadata } from 'next'
import type { Locale } from '@/i18n/config'
import { localizedHref, pageAlternates } from '@/i18n/alternates'
import { BASIS_ZH, FIELD_DESCRIPTION_ZH, INDEX_NOTE_ZH, fieldSourceZh } from '@/i18n/records-zh-Hans'

const EN_META = {
  title: 'Record schema',
  description: 'Every field in a POSI journal record: type, provenance basis, source and meaning, plus the short keys used in the index files.',
  alternates: { canonical: '/docs/schema/' },
}

function En() {
  return (
    <div className="pb-10 space-y-12">
      <PageHeader title="Record schema" crumbs={[{ label: 'Docs', href: '/docs/' }, { label: 'Record schema' }]}>
        <p className="max-w-[65ch]">
          The fields of a journal record, as published in <span className="font-mono">/data/journal/&#123;code&#125;.json</span> and
          the Discovered shards. Each field states its basis so declared claims are never mistaken for measurements.
          Machine-readable copy: <a href={dataUrl('meta/schema.json')} className="link font-mono">{dataUrl('meta/schema.json')}</a>.
        </p>
      </PageHeader>

      <section aria-labelledby="basis">
        <SectionTitle id="basis">Provenance basis</SectionTitle>
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {(Object.keys(BASIS) as Basis[]).map(b => (
            <div key={b} className="flex gap-3">
              <dt className="shrink-0 pt-0.5"><BasisTag b={b} /></dt>
              <dd className="text-[14px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>{BASIS[b].description}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="fields">
        <SectionTitle id="fields">Fields</SectionTitle>
        <div className="panel overflow-x-auto">
          <table className="dtable min-w-[760px]">
            <thead><tr><th>Field</th><th>Type</th><th>Basis</th><th>Source</th><th>Meaning</th></tr></thead>
            <tbody>
              {JOURNAL_FIELDS.map(f => (
                <tr key={f.key}>
                  <td className="font-mono text-[13px] whitespace-nowrap">{f.key}</td>
                  <td className="font-mono text-[12px] min-w-[170px] max-w-[240px]" style={{ color: 'var(--muted)' }}>{f.type}</td>
                  <td><BasisTag b={f.basis} /></td>
                  <td className="text-[13px] whitespace-nowrap" style={{ color: 'var(--muted)' }}>{f.source}</td>
                  <td className="text-[13.5px]">{f.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="index-keys">
        <SectionTitle id="index-keys">Index file keys</SectionTitle>
        <p className="text-[14px] mb-4 max-w-[65ch]" style={{ color: 'var(--muted)' }}>
          The files under <span className="font-mono">/data/index/</span> use one-letter keys to stay small. The CSV
          versions use full column names.
        </p>
        <div className="panel overflow-x-auto max-w-[760px]">
          <table className="dtable">
            <thead><tr><th>Key</th><th>Field</th><th>Note</th></tr></thead>
            <tbody>
              {INDEX_KEYS.map(k => (
                <tr key={k.key}>
                  <td className="font-mono">{k.key}</td>
                  <td className="font-mono text-[13px]">{k.field}</td>
                  <td className="text-[13px]" style={{ color: 'var(--muted)' }}>{k.note ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-[14px]">
          See <Link href="/docs/provenance/" className="link">Provenance and verification</Link> for how{' '}
          <span className="font-mono">k</span> and <span className="font-mono">v</span> are assigned.
        </p>
      </section>
    </div>
  )
}

export function schemaMetadata(locale: Locale): Metadata {
  const m = locale === 'zh-Hans' ? ZH_META : EN_META
  return { title: m.title, description: m.description, alternates: pageAlternates('/docs/schema/', locale) }
}

export function SchemaView({ locale }: { locale: Locale }) {
  return locale === 'zh-Hans' ? <Zh /> : <En />
}

const ZH_META = {
  title: '记录结构',
  description: 'POSI 期刊记录的全部字段：类型、溯源依据、来源与含义，以及索引文件中使用的短键。',
}

const L = (p: string) => localizedHref('zh-Hans', p)

function Zh() {
  return (
    <div className="pb-10 space-y-12">
      <PageHeader locale="zh-Hans" title="记录结构" crumbs={[{ label: '文档', href: L('/docs/') }, { label: '记录结构' }]}>
        <p className="max-w-[65ch]">
          期刊记录的字段，发布于 <span className="font-mono">/data/journal/&#123;code&#125;.json</span> 及 Discovered 分片文件中。每个字段都注明其依据，以免将自述内容误认为测量结果。机器可读版本：<a href={dataUrl('meta/schema.json')} className="link font-mono">{dataUrl('meta/schema.json')}</a>。
        </p>
      </PageHeader>

      <section aria-labelledby="basis">
        <SectionTitle id="basis">溯源依据</SectionTitle>
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {(Object.keys(BASIS) as Basis[]).map(b => (
            <div key={b} className="flex gap-3">
              <dt className="shrink-0 pt-0.5"><BasisTag b={b} locale="zh-Hans" /></dt>
              <dd className="text-[14px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>{BASIS_ZH[b].description}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="fields">
        <SectionTitle id="fields">字段</SectionTitle>
        <div className="panel overflow-x-auto">
          <table className="dtable min-w-[760px]">
            <thead><tr><th>字段</th><th>类型</th><th>依据</th><th>来源</th><th>含义</th></tr></thead>
            <tbody>
              {JOURNAL_FIELDS.map(f => (
                <tr key={f.key}>
                  <td className="font-mono text-[13px] whitespace-nowrap">{f.key}</td>
                  <td className="font-mono text-[12px] min-w-[170px] max-w-[240px]" style={{ color: 'var(--muted)' }}>{f.type}</td>
                  <td><BasisTag b={f.basis} locale="zh-Hans" /></td>
                  <td className="text-[13px] whitespace-nowrap" style={{ color: 'var(--muted)' }}>{fieldSourceZh(f.source)}</td>
                  <td className="text-[13.5px]">{FIELD_DESCRIPTION_ZH[f.key] ?? f.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="index-keys">
        <SectionTitle id="index-keys">索引文件键名</SectionTitle>
        <p className="text-[14px] mb-4 max-w-[65ch]" style={{ color: 'var(--muted)' }}>
          <span className="font-mono">/data/index/</span> 下的文件使用单字母键名以减小体积；CSV 版本使用完整列名。
        </p>
        <div className="panel overflow-x-auto max-w-[760px]">
          <table className="dtable">
            <thead><tr><th>键</th><th>字段</th><th>说明</th></tr></thead>
            <tbody>
              {INDEX_KEYS.map(k => (
                <tr key={k.key}>
                  <td className="font-mono">{k.key}</td>
                  <td className="font-mono text-[13px]">{k.field}</td>
                  <td className="text-[13px]" style={{ color: 'var(--muted)' }}>{INDEX_NOTE_ZH[k.key] ?? k.note ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-[14px]">
          <span className="font-mono">k</span> 与 <span className="font-mono">v</span> 的赋值方式详见<Link href={L('/docs/provenance/')} className="link">数据溯源与核验</Link>。
        </p>
      </section>
    </div>
  )
}
