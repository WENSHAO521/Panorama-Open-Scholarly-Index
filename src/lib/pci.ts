import raw from './pci.json'

// PCI / PCI-5 (POSI Citation Impact, posi-data's PJR-SPEC.md § 5-6) — a
// real, OpenAlex-sourced citation-window indicator, synced from
// posi-data-delivery's collections/pci.json (see scripts/sync-corpus.mjs).
// Scope is currently the curated Global Benchmark seed only (~993
// records) — Core Collection isn't covered yet, since a same-day spot-
// check found it's overwhelmingly too young (most journals first
// published 2025-2026) to have any real 2023-2024 output to measure. See
// posi-data's audits/pjr-seed-corpus/pjr-seed-corpus-global993-2026/
// README.md for methodology and scope. No POSI-R-* release has been
// produced (POSI-R-1.0-SPEC.md) and PNCI has not been computed this run,
// so this real PCI data still does not determine Citation Rank,
// Percentile, or Quartile — same non-overclaiming posture PCS already
// has. Every field below is passed through unmodified from posi-data's
// schema/metric.schema.json-declared PCI subset.
export interface PciEntry {
  journal_id: string
  metric_year: number
  pci: number | null
  pci_window_start_year: number | null
  pci_window_end_year: number | null
  pci_citable_items: number | null
  pci_citation_count: number | null
  pci_5yr: number | null
  pci_5yr_citable_items: number | null
  pci_5yr_numerator_capped: boolean | null
  pci_source: 'openalex' | null
  pci_source_retrieved_at: string | null
  pci_methodology_version: string | null
}

const PCI_RECORDS = raw as PciEntry[]

const BY_JOURNAL_ID: Record<string, PciEntry> = Object.fromEntries(
  PCI_RECORDS.map(r => [r.journal_id, r])
)

/** All synced PCI records — currently the curated Global Benchmark seed
 * only, including pci: null entries. */
export function getAllPciEntries(): PciEntry[] {
  return PCI_RECORDS
}

/** Look up a journal's PCI entry by its posi-data posi_id (e.g. "POSI-J-023605"). */
export function getPciEntry(posiId: string | null | undefined): PciEntry | null {
  if (!posiId) return null
  return BY_JOURNAL_ID[posiId] ?? null
}
