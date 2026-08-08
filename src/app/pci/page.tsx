import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'POSI Citation Impact (PCI) & POSI Citation Score (PCS) | POSI',
  description: 'PCI and PCS are open, auditable citation-impact indicators — POSI\'s contribution to the open/alternative metrics movement, positioned alongside DORA and altmetrics rather than as a replacement for the Journal Impact Factor or CiteScore.',
}

const COMPARISON = [
  { dimension: 'Underlying data',    pci: 'Open citation graph (OpenAlex, aggregating Crossref)', jif: 'Proprietary Web of Science Core Collection' },
  { dimension: 'Formula',            pci: 'Fully published — see methodology below',              jif: 'Historically undisclosed in full detail' },
  { dimension: 'Reproducibility',    pci: 'Anyone can recompute it from the open OpenAlex API',     jif: 'Not independently reproducible without a WoS license' },
  { dimension: 'Access to the number', pci: 'Free and public on every journal record',              jif: 'Requires a Journal Citation Reports subscription' },
  { dimension: 'Journal coverage',   pci: 'Any journal with an OpenAlex source record',              jif: 'Limited to WoS Core Collection-indexed journals' },
]

const COMPARISON_PCS = [
  { dimension: 'Underlying data',    pcs: 'Crossref DOI registry (is-referenced-by-count)', citescore: 'Proprietary Scopus database' },
  { dimension: 'Window',             pcs: 'Trailing 4 calendar years, published formula',   citescore: 'Trailing 4 calendar years, undisclosed sampling internals' },
  { dimension: 'Reproducibility',    pcs: 'Anyone can recompute it from the open Crossref API', citescore: 'Not independently reproducible without Scopus access' },
  { dimension: 'Access to the number', pcs: 'Free and public on every journal record',        citescore: 'Free to view, but underlying data requires a Scopus subscription' },
]

const MOVEMENT_PRINCIPLES = [
  {
    title: 'DORA (2012)',
    body: 'The San Francisco Declaration on Research Assessment explicitly warns against using Journal Impact Factor as a proxy for the quality of individual articles or researchers. PCI is published with the same caveat, expressed as a per-journal citation-window statistic, not a quality certification.',
  },
  {
    title: 'Altmetrics manifesto (2010)',
    body: 'The founding altmetrics proposal argued that scholarly impact should be measured with open, web-native, auditable signals rather than closed, subscription-gated indices. PCI applies that principle specifically to citation counting.',
  },
  {
    title: 'Leiden Manifesto (2015)',
    body: 'Recommends that quantitative research evaluation support — never substitute for — qualitative, expert assessment, and that the data and methods behind any metric be open to verification. PCI\'s methodology section exists to satisfy that verifiability requirement directly.',
  },
  {
    title: 'One metric among several',
    body: 'PCI sits alongside MQS, PQF, IRS, and CVI on every POSI journal record — deliberately not blended into a single score, so no one number stands in for the others.',
  },
]

export default function PciPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      <nav className="text-xs flex items-center gap-1.5" style={{ color: 'var(--posi-muted)' }}>
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <Link href="/pqf" className="hover:text-gray-700">Assessment</Link>
        <span>/</span>
        <span style={{ color: 'var(--posi-text)' }}>POSI Citation Impact</span>
      </nav>

      <div className="border-l-4 pl-5" style={{ borderColor: 'var(--posi-accent)' }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5" style={{ color: 'var(--posi-accent)', border: '1px solid var(--posi-accent)' }}>PCI · PCS</span>
          <span className="text-[10px] font-mono uppercase tracking-[0.15em]" style={{ color: 'var(--posi-muted)' }}>Open Alternative Metrics</span>
        </div>
        <h1 className="text-2xl font-bold leading-tight" style={{ color: 'var(--posi-text)' }}>POSI Citation Impact (PCI) &amp; POSI Citation Score (PCS)</h1>
        <p className="text-sm leading-relaxed mt-2 max-w-2xl" style={{ color: 'var(--posi-muted)' }}>
          PCI and PCS are two open, auditable citation-impact indicators, published as POSI's contribution to
          the open/alternative-metrics tradition — not a replacement for the Journal Impact Factor or CiteScore,
          but openly computed options alongside them.
        </p>
      </div>

      {/* Explicit non-overclaiming notice */}
      <div className="p-4 text-xs leading-relaxed" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
        <strong style={{ color: '#1d4ed8' }}>Neither PCI nor PCS claims to replace or outperform the Journal Impact Factor or CiteScore.</strong>
        <span style={{ color: '#1d4ed8' }}>
          {' '}They answer a narrower, honest question: what do fully open citation graphs say about a journal's
          citation rate? Their value is that anyone can check the numbers, not that the numbers are more
          accurate than Clarivate's or Elsevier's.
        </span>
      </div>

      {/* Two independent measurements */}
      <section className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
        <h2 className="text-xs font-bold uppercase tracking-[0.1em] mb-2" style={{ color: 'var(--posi-muted)' }}>Two Independent Measurements, Not One Blended Score</h2>
        <p className="text-[11px] leading-relaxed" style={{ color: 'var(--posi-muted)' }}>
          Web of Science and Scopus are independently curated databases that report independent numbers — a
          journal's JIF and CiteScore routinely disagree, because they're computed from different underlying
          collections. POSI follows the same principle rather than inventing one composite "open impact score":
          <strong style={{ color: 'var(--posi-text)' }}> PCI</strong> is sourced entirely from OpenAlex (a 2-year
          window, JIF-shaped), and <strong style={{ color: 'var(--posi-text)' }}>PCS</strong> is sourced entirely
          from Crossref (a 4-year window, CiteScore-shaped). The two are never averaged or blended — POSI
          publishes both, side by side, and lets the disagreement between them be visible rather than papered over.
        </p>
      </section>

      {/* Adoption is institutional, not POSI's call */}
      <section className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
        <h2 className="text-xs font-bold uppercase tracking-[0.1em] mb-2" style={{ color: 'var(--posi-muted)' }}>Adoption Is an Institutional Choice</h2>
        <p className="text-[11px] leading-relaxed" style={{ color: 'var(--posi-muted)' }}>
          POSI does not lobby for PCI or PCS to replace the Journal Impact Factor or CiteScore everywhere.
          Whether an institution treats an open metric as sufficient for its own evaluation, funding, or
          accreditation purposes — in place of, or alongside, a proprietary index — is a policy decision made
          by that institution, not by POSI. What POSI controls is supply: publishing the numbers, the formulas,
          and the underlying open data, so that an institution which chooses openness as a criterion has
          something verifiable to adopt. POSI is a young, emerging data platform; PCI and PCS's relevance
          grows only as far as institutions choose to rely on them.
        </p>
      </section>

      {/* Why an open metric */}
      <section className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
        <h2 className="text-xs font-bold uppercase tracking-[0.1em] mb-3" style={{ color: 'var(--posi-muted)' }}>Why an Open Metric</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {MOVEMENT_PRINCIPLES.map(p => (
            <div key={p.title} className="border-l-2 pl-3" style={{ borderColor: 'var(--posi-border)' }}>
              <h3 className="text-xs font-semibold mb-1" style={{ color: 'var(--posi-text)' }}>{p.title}</h3>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--posi-muted)' }}>{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison table */}
      <section className="bg-white" style={{ border: '1px solid var(--posi-border)' }}>
        <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--posi-border-light)', background: 'var(--posi-bg)' }}>
          <h2 className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--posi-muted)' }}>PCI vs. Journal Impact Factor</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: 'var(--posi-bg)', borderBottom: '1px solid var(--posi-border-light)' }}>
                <th className="text-left px-5 py-2 font-semibold" style={{ color: 'var(--posi-muted)' }}>Dimension</th>
                <th className="text-left px-4 py-2 font-semibold" style={{ color: 'var(--posi-accent)' }}>PCI (POSI)</th>
                <th className="text-left px-4 py-2 font-semibold" style={{ color: 'var(--posi-muted)' }}>JIF (Clarivate)</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--posi-border-light)' }}>
                  <td className="px-5 py-2.5 font-medium" style={{ color: 'var(--posi-text)' }}>{row.dimension}</td>
                  <td className="px-4 py-2.5" style={{ color: 'var(--posi-text)' }}>{row.pci}</td>
                  <td className="px-4 py-2.5" style={{ color: 'var(--posi-muted)' }}>{row.jif}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* PCS comparison table */}
      <section className="bg-white" style={{ border: '1px solid var(--posi-border)' }}>
        <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--posi-border-light)', background: 'var(--posi-bg)' }}>
          <h2 className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--posi-muted)' }}>PCS vs. CiteScore</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: 'var(--posi-bg)', borderBottom: '1px solid var(--posi-border-light)' }}>
                <th className="text-left px-5 py-2 font-semibold" style={{ color: 'var(--posi-muted)' }}>Dimension</th>
                <th className="text-left px-4 py-2 font-semibold" style={{ color: 'var(--posi-accent)' }}>PCS (POSI)</th>
                <th className="text-left px-4 py-2 font-semibold" style={{ color: 'var(--posi-muted)' }}>CiteScore (Elsevier)</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_PCS.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--posi-border-light)' }}>
                  <td className="px-5 py-2.5 font-medium" style={{ color: 'var(--posi-text)' }}>{row.dimension}</td>
                  <td className="px-4 py-2.5" style={{ color: 'var(--posi-text)' }}>{row.pcs}</td>
                  <td className="px-4 py-2.5" style={{ color: 'var(--posi-muted)' }}>{row.citescore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Methodology (kept in sync with /citation-reports) */}
      <section className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
        <h2 className="text-xs font-bold uppercase tracking-[0.1em] mb-3" style={{ color: 'var(--posi-muted)' }}>How PCI &amp; PCS Are Computed</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { title: 'PCI: one source, OpenAlex', body: 'PCI is OpenAlex\'s 2-year mean citedness, taken as-is. OpenAlex already aggregates and deduplicates citation data from Crossref and other registries — POSI does not separately re-count Crossref citations and add them on top.' },
            { title: 'PCS: one source, Crossref', body: 'PCS is the mean is-referenced-by-count across a journal\'s articles published in the trailing 4 calendar years (sampled up to 200 articles), computed directly from Crossref — independent of OpenAlex, never averaged with PCI.' },
            { title: 'DOI/Crossref article counts ≠ citation counts', body: 'Where Crossref is used to verify how many articles a journal has published (the "Articles" figure on journal records), that is a separate use from PCS\'s citation-count role and is never double-applied.' },
            { title: 'One DOI per cited work', body: 'A dataset or preprint on Zenodo (or similar) under its own DOI is supplementary evidence, not a separate citable record, unless explicitly linked to the article DOI as a version/supplement.' },
            { title: 'No proprietary blending', body: 'POSI does not run a combined citation-counting pipeline that merges OpenAlex and Crossref into one number. Each metric is displayed with its own source attribution — full detail and rankings at Citation Reports.' },
          ].map(p => (
            <div key={p.title} className="border-l-2 pl-3" style={{ borderColor: 'var(--posi-border)' }}>
              <h3 className="text-xs font-semibold mb-1" style={{ color: 'var(--posi-text)' }}>{p.title}</h3>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--posi-muted)' }}>{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Appropriate use */}
      <section className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
        <h2 className="text-xs font-bold uppercase tracking-[0.1em] mb-3" style={{ color: 'var(--posi-muted)' }}>Appropriate Use</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="border-l-2 pl-3" style={{ borderColor: '#1F7A4D' }}>
            <h3 className="text-xs font-semibold mb-1" style={{ color: '#1F7A4D' }}>Reasonable uses</h3>
            <ul className="text-[11px] leading-relaxed space-y-1" style={{ color: 'var(--posi-muted)' }}>
              <li>— Comparing journals within the same subject area over time</li>
              <li>— A funder or library building or reviewing a journal reading/subscription list</li>
              <li>— A journal editorial board tracking its own citation trend</li>
              <li>— One input, alongside PQF/MQS/IRS/CVI and expert review, in an institution's own multi-factor evaluation policy</li>
            </ul>
          </div>
          <div className="border-l-2 pl-3" style={{ borderColor: '#b91c1c' }}>
            <h3 className="text-xs font-semibold mb-1" style={{ color: '#b91c1c' }}>Misuse POSI does not endorse</h3>
            <ul className="text-[11px] leading-relaxed space-y-1" style={{ color: 'var(--posi-muted)' }}>
              <li>— Judging an individual researcher, article, or grant application by the citation average of the journal it appeared in (the ecological fallacy DORA was written to stop)</li>
              <li>— Using PCI or PCS as the sole or primary criterion in hiring, promotion, or tenure decisions</li>
              <li>— Treating a single number as a substitute for reading the work itself</li>
            </ul>
          </div>
        </div>
        <p className="text-[10px] mt-3 leading-relaxed" style={{ color: 'var(--posi-muted)' }}>
          This split follows DORA's own recommendations. See <Link href="/responsible-use" className="underline" style={{ color: 'var(--posi-accent)' }}>Responsible Use Notice</Link> for POSI's full policy.
        </p>
      </section>

      {/* What PCI/PCS is not */}
      <section className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
        <h2 className="text-xs font-bold uppercase tracking-[0.1em] mb-3" style={{ color: 'var(--posi-muted)' }}>What PCI &amp; PCS Are Not</h2>
        <ul className="space-y-2 text-[11px] leading-relaxed" style={{ color: 'var(--posi-muted)' }}>
          <li>— <strong style={{ color: 'var(--posi-text)' }}>Not a JIF or CiteScore substitute.</strong> Neither is calculated or peer-reviewed by Clarivate or Elsevier, and neither is directly comparable to the corresponding proprietary value.</li>
          <li>— <strong style={{ color: 'var(--posi-text)' }}>Not a quality certification.</strong> A high PCI or PCS reflects citation volume within a fixed window, not editorial rigor, peer-review quality, or research integrity — those are covered separately by PQF, MQS, and IRS.</li>
          <li>— <strong style={{ color: 'var(--posi-text)' }}>Not a substitute for expert judgment</strong> — see Appropriate Use above.</li>
          <li>— <strong style={{ color: 'var(--posi-text)' }}>Not exhaustive.</strong> Both metrics are currently published only for POSI's Core Collection; see <Link href="/citation-reports" className="underline" style={{ color: 'var(--posi-accent)' }}>Citation Reports</Link> for the full ranked list.</li>
        </ul>
      </section>

      <div className="flex flex-wrap gap-5 text-xs">
        <Link href="/citation-reports" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Citation Reports (rankings) →</Link>
        <Link href="/cvi" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Citation Visibility Index →</Link>
        <Link href="/pqf" style={{ color: 'var(--posi-accent)' }} className="hover:underline">PQF Methodology →</Link>
        <Link href="/responsible-use" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Responsible Use Notice →</Link>
      </div>

    </div>
  )
}
