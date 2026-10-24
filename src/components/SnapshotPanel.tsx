'use client'

// Reads the canonical data layer (posi-data-delivery) directly from the
// browser: current.json -> manifest.json -> SHA256SUMS. Nothing is proxied.

import { useEffect, useState } from 'react'
import { useLocale } from '@/i18n/LocaleProvider'

const BASE = 'https://data.posi.panorama-sg.com'

interface Current { snapshot: string; manifest: string; is_official_release: boolean; release?: string | null; latest_release?: string | null; note?: string }
type Manifest = Record<string, string | number | boolean | null>
interface Loaded { current: Current; manifest: Manifest; sums: { hash: string; path: string }[] }

const VERSION_KEYS = ['lifecycle_version', 'psc_crosswalk_version', 'ajr_e_version', 'ajr_m_version', 'rank_version', 'evidence_version', 'pcs_version', 'pci_version', 'pcs_q_version']
const COUNT_KEYS = ['journal_count', 'core_collection_count', 'benchmark_curated_count', 'benchmark_publisher_catalog_count', 'pcs_computed_count', 'pci_computed_count', 'early_stage_rated_count', 'citation_q_ranked_count']

function label(k: string) {
  return k.replace(/_count$/, '').replace(/_version$/, '').replace(/_/g, ' ').replace(/\b(ajr|pcs|pci|psc|q)\b/gi, m => m.toUpperCase()).replace(/^./, c => c.toUpperCase())
}

// Simplified Chinese labels of the manifest's versions and counts; English labels are derived from the key.
const ZH_LABEL: Record<string, string> = {
  lifecycle: '生命周期', psc_crosswalk: 'PSC 对照表', ajr_e: 'AJR-E', ajr_m: 'AJR-M', rank: '排名', evidence: '证据',
  pcs: 'PCS', pci: 'PCI', pcs_q: 'PCS-Q', journal: '期刊', core_collection: '核心合集', benchmark_curated: 'Benchmark 精选',
  benchmark_publisher_catalog: 'Benchmark 出版商目录', pcs_computed: '已计算 PCS', pci_computed: '已计算 PCI',
  early_stage_rated: 'Early-Stage 已评级', citation_q_ranked: '已获引文分区',
}

const WORDS = {
  en: {
    failed: 'Snapshot information could not be loaded. Please try again shortly.', loading: 'Loading snapshot manifest',
    release: 'Current release', snapshot: 'Current snapshot',
    official: (s: React.ReactNode) => <>Official release, published as snapshot {s}.</>,
    since: (r: React.ReactNode) => <>Data updated since release {r}; this snapshot is not itself a release.</>,
    pre: 'Pre-release data snapshot. No POSI-R release has been produced yet.',
    cutoff: (c: React.ReactNode) => <>Data cutoff {c}.</>,
    dataVersion: 'Data version', engineVersion: 'Engine version', file: 'File', open: 'Open',
    label: (k: string) => label(k)
  },
  'zh-Hans': {
    failed: '暂时无法加载快照信息，请稍后再试。', loading: '正在加载快照清单',
    release: '当前发布版本', snapshot: '当前快照',
    official: (s: React.ReactNode) => <>正式发布版本，以快照 {s} 发布。</>,
    since: (r: React.ReactNode) => <>数据已在发布版本 {r} 之后更新；本快照本身不是发布版本。</>,
    pre: '预发布数据快照，尚未产生 POSI-R 发布版本。',
    cutoff: (c: React.ReactNode) => <>数据截止日期 {c}。</>,
    dataVersion: '数据版本', engineVersion: '引擎版本', file: '文件', open: '打开',
    label: (k: string) => ZH_LABEL[k.replace(/_count$/, '').replace(/_version$/, '')] ?? label(k)
  },
}

export function SnapshotPanel() {
  const w = WORDS[useLocale()]
  const [data, setData] = useState<Loaded | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const current: Current = await fetch(`${BASE}/current.json`).then(r => { if (!r.ok) throw 0; return r.json() })
        const dir = current.manifest.replace(/manifest\.json$/, '')
        const [manifest, sumsText] = await Promise.all([
          fetch(`${BASE}${current.manifest}`).then(r => { if (!r.ok) throw 0; return r.json() }),
          fetch(`${BASE}${dir}SHA256SUMS`).then(r => (r.ok ? r.text() : '')),
        ])
        const sums = sumsText.trim().split('\n').filter(Boolean).map(line => {
          const [hash, ...rest] = line.trim().split(/\s+/)
          return { hash, path: rest.join(' ') }
        })
        if (!cancelled) setData({ current, manifest, sums })
      } catch {
        if (!cancelled) setError(true)
      }
    })()
    return () => { cancelled = true }
  }, [])

  if (error) {
    return (
      <div className="panel p-5 text-[14px]" style={{ color: 'var(--muted)' }}>
        {w.failed}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="panel p-5 space-y-3" aria-busy="true" aria-label={w.loading}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-4 rounded-[var(--radius)] animate-pulse" style={{ background: 'var(--surface-3)', width: `${90 - i * 9}%` }} />
        ))}
      </div>
    )
  }

  const { current, manifest, sums } = data
  const dir = current.manifest.replace(/manifest\.json$/, '')

  return (
    <div className="space-y-4">
      <div className="panel p-5 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <p className="text-[13px]" style={{ color: 'var(--muted)' }}>{current.release ? w.release : w.snapshot}</p>
          <p className="font-mono text-[22px] mt-1" style={{ color: 'var(--ink)' }}>{current.release ?? current.snapshot}</p>
          <p className="mt-2 text-[13px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            {current.is_official_release
              ? w.official(<span className="font-mono">{current.snapshot}</span>)
              : current.latest_release
                ? w.since(<span className="font-mono">{current.latest_release}</span>)
                : w.pre}{' '}
            {w.cutoff(<span className="font-mono">{String(manifest.data_cutoff ?? 'n/a')}</span>)}
          </p>
          <dl className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-[12.5px]">
            <dt style={{ color: 'var(--muted)' }}>{w.dataVersion}</dt>
            <dd className="font-mono truncate">{String(manifest.data_commit).slice(0, 12)}</dd>
            <dt style={{ color: 'var(--muted)' }}>{w.engineVersion}</dt>
            <dd className="font-mono truncate">{String(manifest.engine_commit).slice(0, 12)}</dd>
          </dl>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[13px] content-start">
          {VERSION_KEYS.filter(k => manifest[k]).map(k => (
            <div key={k} className="flex justify-between gap-2 py-1" style={{ borderBottom: '1px solid var(--line-soft)' }}>
              <span style={{ color: 'var(--muted)' }}>{w.label(k)}</span>
              <span className="font-mono text-[12px]">{String(manifest[k])}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="stat-strip grid-cols-2 md:grid-cols-4">
        {COUNT_KEYS.filter(k => typeof manifest[k] === 'number').map(k => (
          <div key={k}>
            <p className="label">{w.label(k)}</p>
            <p className="mt-1 figure text-[20px]">{Number(manifest[k]).toLocaleString('en-US')}</p>
          </div>
        ))}
      </div>

      <div className="panel overflow-x-auto">
        <table className="dtable min-w-[640px]">
          <thead><tr><th>{w.file}</th><th>SHA-256</th><th></th></tr></thead>
          <tbody>
            {sums.map(s => (
              <tr key={s.path}>
                <td className="font-mono text-[13px]">{s.path}</td>
                <td className="font-mono text-[12px]" style={{ color: 'var(--muted)' }} title={s.hash}>{s.hash.slice(0, 16)}…</td>
                <td className="text-right">
                  <a href={`${BASE}${dir}${s.path}`} className="inline-flex items-center gap-1 link text-[13px]" target="_blank" rel="noopener noreferrer">
                    {w.open}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
