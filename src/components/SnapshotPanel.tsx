'use client'

// Reads the canonical data layer (posi-data-delivery) directly from the
// browser: current.json -> manifest.json -> SHA256SUMS. Nothing is proxied.

import { useEffect, useState } from 'react'
import { ArrowSquareOut } from '@phosphor-icons/react/dist/ssr'

const BASE = 'https://data.posi.panorama-sg.com'

interface Current { snapshot: string; manifest: string; is_official_release: boolean; release?: string | null; latest_release?: string | null; note?: string }
type Manifest = Record<string, string | number | boolean | null>
interface Loaded { current: Current; manifest: Manifest; sums: { hash: string; path: string }[] }

const VERSION_KEYS = ['lifecycle_version', 'psc_crosswalk_version', 'ajr_e_version', 'ajr_m_version', 'rank_version', 'evidence_version', 'pcs_version', 'pci_version', 'pcs_q_version']
const COUNT_KEYS = ['journal_count', 'core_collection_count', 'benchmark_curated_count', 'benchmark_publisher_catalog_count', 'pcs_computed_count', 'pci_computed_count', 'early_stage_rated_count', 'citation_q_ranked_count']

function label(k: string) {
  return k.replace(/_count$/, '').replace(/_version$/, '').replace(/_/g, ' ').replace(/\b(ajr|pcs|pci|psc|q)\b/gi, m => m.toUpperCase()).replace(/^./, c => c.toUpperCase())
}

export function SnapshotPanel() {
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
        The data layer at <span className="font-mono">{BASE}</span> could not be reached. Please try again shortly.
      </div>
    )
  }

  if (!data) {
    return (
      <div className="panel p-5 space-y-3" aria-busy="true" aria-label="Loading snapshot manifest">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-4 rounded-[2px] animate-pulse" style={{ background: 'var(--surface-3)', width: `${90 - i * 9}%` }} />
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
          <p className="text-[13px]" style={{ color: 'var(--muted)' }}>{current.release ? 'Current release' : 'Current snapshot'}</p>
          <p className="font-mono text-[22px] mt-1" style={{ color: 'var(--ink)' }}>{current.release ?? current.snapshot}</p>
          <p className="mt-2 text-[13px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            {current.is_official_release
              ? <>Official release, published as snapshot <span className="font-mono">{current.snapshot}</span>.</>
              : current.latest_release
                ? <>Data updated since release <span className="font-mono">{current.latest_release}</span>; this snapshot is not itself a release.</>
                : 'Pre-release data snapshot. No POSI-R release has been produced yet.'}{' '}
            Data cutoff <span className="font-mono">{String(manifest.data_cutoff ?? 'n/a')}</span>.
          </p>
          <dl className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-[12.5px]">
            <dt style={{ color: 'var(--muted)' }}>Data version</dt>
            <dd className="font-mono truncate">{String(manifest.data_commit).slice(0, 12)}</dd>
            <dt style={{ color: 'var(--muted)' }}>Engine version</dt>
            <dd className="font-mono truncate">{String(manifest.engine_commit).slice(0, 12)}</dd>
          </dl>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[13px] content-start">
          {VERSION_KEYS.filter(k => manifest[k]).map(k => (
            <div key={k} className="flex justify-between gap-2 py-1" style={{ borderBottom: '1px solid var(--line-soft)' }}>
              <span style={{ color: 'var(--muted)' }}>{label(k)}</span>
              <span className="font-mono text-[12px]">{String(manifest[k])}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="stat-strip grid-cols-2 md:grid-cols-4">
        {COUNT_KEYS.filter(k => typeof manifest[k] === 'number').map(k => (
          <div key={k}>
            <p className="label">{label(k)}</p>
            <p className="mt-1 figure text-[20px]">{Number(manifest[k]).toLocaleString('en-US')}</p>
          </div>
        ))}
      </div>

      <div className="panel overflow-x-auto">
        <table className="dtable min-w-[640px]">
          <thead><tr><th>File</th><th>SHA-256</th><th></th></tr></thead>
          <tbody>
            {sums.map(s => (
              <tr key={s.path}>
                <td className="font-mono text-[13px]">{s.path}</td>
                <td className="font-mono text-[12px]" style={{ color: 'var(--muted)' }} title={s.hash}>{s.hash.slice(0, 16)}…</td>
                <td className="text-right">
                  <a href={`${BASE}${dir}${s.path}`} className="inline-flex items-center gap-1 link text-[13px]" target="_blank" rel="noopener noreferrer">
                    Open <ArrowSquareOut className="h-3.5 w-3.5" />
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
