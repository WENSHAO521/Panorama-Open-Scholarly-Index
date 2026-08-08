import { Database } from '@phosphor-icons/react/dist/ssr'
import type { ZenodoRecord } from '@/lib/api'

export function RelatedDatasetsCard({ records }: { records: ZenodoRecord[] }) {
  if (records.length === 0) return null

  return (
    <div className="bg-white border border-gray-200 p-4">
      <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.12em] mb-3 flex items-center gap-1.5">
        <Database className="h-3.5 w-3.5" />
        Related Datasets
      </h2>
      <div className="space-y-3">
        {records.map(r => (
          <a
            key={r.zenodo_id}
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-xs hover:text-[#c41e3a] transition-colors"
          >
            <p className="font-medium text-gray-900 leading-snug">{r.title}</p>
            <p className="text-[10px] text-gray-500 mt-0.5 font-mono">
              {r.relation}{r.resource_type ? ` · ${r.resource_type}` : ''} · Zenodo
            </p>
          </a>
        ))}
      </div>
      <p className="text-[10px] text-gray-400 mt-3 leading-relaxed">
        Supplementary evidence from Zenodo, linked via the record's own related-identifier metadata.
        Not counted toward citation statistics.
      </p>
    </div>
  )
}
