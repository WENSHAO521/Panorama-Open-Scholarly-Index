import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PSG Format | POSI',
  description:
    'PSG Author–Date Citation Format — the official citation standard of Panorama Scholarly Group. Covers in-text citations, reference list rules, and examples for journals, books, datasets, software, AI tools, and multilingual sources.',
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code
      className="text-[11px] font-mono px-1.5 py-0.5 rounded-none"
      style={{ background: 'var(--posi-bg)', border: '1px solid var(--posi-border-light)', color: 'var(--posi-text)' }}
    >
      {children}
    </code>
  )
}

function Example({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mt-2 px-4 py-3 text-[12px] leading-relaxed font-mono"
      style={{ background: 'var(--posi-bg)', border: '1px solid var(--posi-border)', color: 'var(--posi-text)', borderLeft: '3px solid #c41e3a' }}
    >
      {children}
    </div>
  )
}

function SectionHead({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-base font-bold mt-10 mb-4 pb-2" style={{ color: 'var(--posi-text)', borderBottom: '2px solid #c41e3a' }}>
      {children}
    </h2>
  )
}

function SubHead({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[13px] font-semibold mt-6 mb-2" style={{ color: 'var(--posi-text)' }}>
      {children}
    </h3>
  )
}

function Rule({ label, value }: { label: string; value: string }) {
  return (
    <tr style={{ borderBottom: '1px solid var(--posi-border-light)' }}>
      <td className="py-2 pr-4 text-xs align-top whitespace-nowrap font-medium" style={{ color: 'var(--posi-text)' }}>{label}</td>
      <td className="py-2 text-xs align-top" style={{ color: 'var(--posi-muted)' }}>{value}</td>
    </tr>
  )
}

export default function PsgFormatPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span
            className="text-[10px] font-mono font-bold px-2 py-0.5 uppercase tracking-[0.15em]"
            style={{ background: '#c41e3a', color: '#fff' }}
          >
            PSG Official
          </span>
          <span className="text-[10px] font-mono uppercase tracking-[0.12em]" style={{ color: 'var(--posi-muted)' }}>
            Citation Standard
          </span>
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--posi-text)' }}>
          PSG Author–Date Citation Format
        </h1>
        <p className="text-sm leading-relaxed max-w-2xl" style={{ color: 'var(--posi-muted)' }}>
          PSG Format is the official author–date citation format of Panorama Scholarly Group. It uses a
          Chicago-style author–date structure, APA-informed digital metadata practices, and PSG-specific
          rules for DOI normalization, multilingual references, datasets, software, AI tools, and
          reference integrity.
        </p>
        <div className="mt-4 flex gap-3">
          <Link
            href="/cite"
            className="px-4 py-2 text-xs font-semibold text-white transition-colors"
            style={{ background: '#c41e3a' }}
          >
            Citation Generator →
          </Link>
        </div>
      </div>

      {/* Structure overview */}
      <div
        className="px-4 py-3 text-xs leading-relaxed font-mono mb-8"
        style={{ background: 'var(--posi-bg)', border: '1px solid var(--posi-border)' }}
      >
        <span className="text-[10px] uppercase tracking-[0.12em] font-sans font-semibold block mb-1" style={{ color: 'var(--posi-muted)' }}>Core Pattern</span>
        Author. Year. &ldquo;Article Title.&rdquo; <em>Journal Name</em> Volume, no. Issue: Pages. https://doi.org/…
      </div>

      {/* ── Section 1: In-text ── */}
      <SectionHead id="in-text">I. In-Text Citations</SectionHead>
      <p className="text-xs mb-4" style={{ color: 'var(--posi-muted)' }}>
        PSG in-text citations use the author–year form in parentheses. Surnames only; no comma between author and year.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse" style={{ border: '1px solid var(--posi-border)' }}>
          <thead>
            <tr style={{ background: 'var(--posi-bg)', borderBottom: '1px solid var(--posi-border)' }}>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>Type</th>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>PSG Format</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['1 author',              '(Smith 2024)'],
              ['2 authors',             '(Smith and Lee 2024)'],
              ['3 authors',             '(Smith, Lee, and Wang 2024)'],
              ['4 or more authors',     '(Smith et al. 2024)'],
              ['With page number',      '(Smith 2024, 25)'],
              ['Page range',            '(Smith 2024, 25–27)'],
              ['Multiple sources',      '(Chen 2021; Kim 2022; Smith 2024)'],
              ['No date',               '(Smith n.d.)'],
              ['Same author, same year','(Smith 2024a, 2024b)'],
            ].map(([type, fmt]) => (
              <tr key={type} style={{ borderBottom: '1px solid var(--posi-border-light)' }}>
                <td className="px-3 py-2 font-medium" style={{ color: 'var(--posi-text)' }}>{type}</td>
                <td className="px-3 py-2 font-mono" style={{ color: 'var(--posi-text)' }}>{fmt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Section 2: Reference list ── */}
      <SectionHead id="reference-list">II. Reference List Formats</SectionHead>

      {/* 1. Journal article */}
      <SubHead>1. Journal Article</SubHead>
      <p className="text-xs mb-1" style={{ color: 'var(--posi-muted)' }}>
        <Code>Last, First, and First Last. Year. &ldquo;Title.&rdquo; <em>Journal</em> Vol, no. Issue: Pages. https://doi.org/…</Code>
      </p>
      <Example>
        Smith, John A., Helen K. Lee, and Ming Wang. 2024. &ldquo;Artificial Intelligence and Administrative
        Reform in Local Government.&rdquo; <em>Journal of Public Governance and Society</em> 12, no. 2: 45–63.
        https://doi.org/10.xxxx/xxxxx
      </Example>
      <p className="text-[11px] mt-1" style={{ color: 'var(--posi-muted)' }}>In-text: <span className="font-mono">(Smith, Lee, and Wang 2024)</span></p>

      {/* 2. Article number */}
      <SubHead>2. Article Number (no page range)</SubHead>
      <Example>
        Chen, Li, and Sungho Park. 2023. &ldquo;Digital Learning Anxiety among University Students.&rdquo;
        <em>Educational Psychology Review</em> 35, no. 2: Article 108. https://doi.org/10.xxxx/xxxxx
      </Example>
      <p className="text-[11px] mt-1" style={{ color: 'var(--posi-muted)' }}>In-text: <span className="font-mono">(Chen and Park 2023)</span></p>

      {/* 3. Book */}
      <SubHead>3. Book</SubHead>
      <p className="text-xs mb-1" style={{ color: 'var(--posi-muted)' }}>
        <Code>Last, First. Year. <em>Book Title: Subtitle.</em> Place: Publisher.</Code>
      </p>
      <Example>
        Giddens, Anthony. 1991. <em>Modernity and Self-Identity: Self and Society in the Late Modern Age.</em>{' '}
        Stanford: Stanford University Press.
      </Example>
      <p className="text-[11px] mt-1" style={{ color: 'var(--posi-muted)' }}>In-text: <span className="font-mono">(Giddens 1991)</span></p>

      {/* 4. Book chapter */}
      <SubHead>4. Book Chapter</SubHead>
      <Example>
        Lee, Hyun K. 2022. &ldquo;Artificial Intelligence in Public Administration.&rdquo; In <em>Digital
        Governance in Asia</em>, edited by John Smith and Robert Brown, 55–78. Singapore: Springer.
        https://doi.org/10.xxxx/xxxxx
      </Example>
      <p className="text-[11px] mt-1" style={{ color: 'var(--posi-muted)' }}>In-text: <span className="font-mono">(Lee 2022, 60)</span></p>

      {/* 5. Webpage */}
      <SubHead>5. Webpage</SubHead>
      <Example>
        Panorama Scholarly Group. 2026. &ldquo;Publication Ethics.&rdquo; Accessed June 24, 2026.
        https://example.com/publication-ethics
      </Example>
      <p className="text-[11px] mt-1" style={{ color: 'var(--posi-muted)' }}>In-text: <span className="font-mono">(Panorama Scholarly Group 2026)</span></p>

      {/* 6. Government / institutional report */}
      <SubHead>6. Government or Institutional Report</SubHead>
      <Example>
        Ministry of Education. 2024. <em>Annual Report on Higher Education Development.</em> Seoul:
        Ministry of Education. https://example.gov/report
      </Example>
      <p className="text-[11px] mt-1" style={{ color: 'var(--posi-muted)' }}>In-text: <span className="font-mono">(Ministry of Education 2024)</span></p>

      {/* 7. Chinese */}
      <SubHead>7. Chinese-Language Source</SubHead>
      <p className="text-xs mb-1" style={{ color: 'var(--posi-muted)' }}>
        Original-language title + English translation in square brackets. Author names romanized (Pinyin).
      </p>
      <Example>
        Wang, Ming, and Hua Li. 2023. &ldquo;数字治理背景下的公共服务改革 [Public Service Reform in the
        Context of Digital Governance].&rdquo; <em>公共行政研究 [Public Administration Research]</em> 15,
        no. 2: 45–58. https://doi.org/10.xxxx/xxxxx
      </Example>
      <p className="text-[11px] mt-1" style={{ color: 'var(--posi-muted)' }}>In-text: <span className="font-mono">(Wang and Li 2023)</span></p>

      {/* 8. Korean */}
      <SubHead>8. Korean-Language Source</SubHead>
      <Example>
        Kim, Minsoo. 2024. &ldquo;공공기관의 디지털 전환과 조직성과 [Digital Transformation and
        Organizational Performance in Public Institutions].&rdquo; <em>한국행정학보 [Korean Public
        Administration Review]</em> 58, no. 1: 101–125. https://doi.org/10.xxxx/xxxxx
      </Example>
      <p className="text-[11px] mt-1" style={{ color: 'var(--posi-muted)' }}>In-text: <span className="font-mono">(Kim 2024)</span></p>

      {/* 9. Dataset */}
      <SubHead>9. Dataset</SubHead>
      <Example>
        Lee, Sungho. 2024. <em>Survey Data on Digital Public Service Satisfaction in South Korea.</em>{' '}
        Data set. Zenodo. https://doi.org/10.xxxx/xxxxx
      </Example>
      <p className="text-[11px] mt-1" style={{ color: 'var(--posi-muted)' }}>In-text: <span className="font-mono">(Lee 2024)</span></p>

      {/* 10. Software / GitHub */}
      <SubHead>10. Software / GitHub Repository</SubHead>
      <Example>
        Chen, Li. 2024. <em>OJS Reference Checker.</em> Source code. GitHub.
        https://github.com/example/ojs-reference-checker
      </Example>
      <p className="text-[11px] mt-1" style={{ color: 'var(--posi-muted)' }}>In-text: <span className="font-mono">(Chen 2024)</span></p>

      {/* 11. AI tool */}
      <SubHead>11. AI Tool</SubHead>
      <Example>
        OpenAI. 2026. <em>ChatGPT.</em> Large language model. https://chat.openai.com/
      </Example>
      <p className="text-[11px] mt-1" style={{ color: 'var(--posi-muted)' }}>In-text: <span className="font-mono">(OpenAI 2026)</span></p>

      {/* ── Section 3: Fixed rules ── */}
      <SectionHead id="rules">III. Fixed Rules</SectionHead>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse" style={{ border: '1px solid var(--posi-border)' }}>
          <thead>
            <tr style={{ background: 'var(--posi-bg)', borderBottom: '1px solid var(--posi-border)' }}>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>Element</th>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>PSG Rule</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--posi-border-light)' }}>
            {[
              ['In-text style',          'Author–year parenthetical; no comma between author and year'],
              ['Year position',          'After author in reference list; no brackets'],
              ['Article title',          'English curly/typographic quotes “ ”; period inside closing quote'],
              ['Journal name',           'Italic (plain text: no special markup)'],
              ['Volume & issue',         '12, no. 2'],
              ['Page range',             '45–63 (en-dash, not hyphen)'],
              ['Article number',         'Article 108'],
              ['DOI format',             'Must be https://doi.org/…'],
              ['After DOI',              'No trailing period after DOI or URL'],
              ['After URL (no DOI)',     'No trailing period'],
              ['Multilingual title',     'Original title + [English translation] in square brackets'],
              ['Author connector',       'and (not &)'],
              ['4+ authors in-text',     'et al.'],
              ['Author format (1st)',    'Last, First (inverted)'],
              ['Author format (others)', 'First Last (natural order)'],
            ].map(([element, rule]) => (
              <tr key={element}>
                <td className="px-3 py-2 font-medium whitespace-nowrap align-top" style={{ color: 'var(--posi-text)' }}>{element}</td>
                <td className="px-3 py-2 align-top" style={{ color: 'var(--posi-muted)' }}>{rule}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Section 4: Definition ── */}
      <SectionHead id="definition">IV. Official Definition</SectionHead>
      <div
        className="px-5 py-4 text-sm leading-relaxed"
        style={{ background: 'var(--posi-bg)', border: '1px solid var(--posi-border)', borderLeft: '4px solid #c41e3a' }}
      >
        <p style={{ color: 'var(--posi-text)' }}>
          <strong>PSG Format</strong> is the official author–date citation format of Panorama Scholarly
          Group. It uses a Chicago-style author–date structure, APA-informed digital metadata practices,
          and PSG-specific rules for DOI normalization, multilingual references, datasets, software, AI
          tools, and reference integrity.
        </p>
      </div>

      {/* Footer links */}
      <div className="flex flex-wrap gap-4 text-xs mt-10 pt-6" style={{ borderTop: '1px solid var(--posi-border)' }}>
        <Link href="/cite" style={{ color: 'var(--posi-accent)' }} className="hover:underline">
          Citation Generator →
        </Link>
        <Link href="/policies" style={{ color: 'var(--posi-accent)' }} className="hover:underline">
          Publication Policies →
        </Link>
        <Link href="/about" style={{ color: 'var(--posi-accent)' }} className="hover:underline">
          About POSI →
        </Link>
      </div>
    </div>
  )
}
