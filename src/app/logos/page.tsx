import { readFileSync } from 'fs'
import { join } from 'path'
import Link from 'next/link'
import { getCoreCollection } from '@/lib/data'
import { LogoEmbed, type MarkFile } from '@/components/LogoEmbed'
import { PageHeader, SectionTitle } from '@/components/db'

export const metadata = {
  title: 'Logos and journal marks',
  description: 'Official POSI marks for journal websites: Indexed in POSI for every indexed journal, and the Core Collection mark for certified journals. SVG and PNG, with embed code and usage rules.',
  alternates: { canonical: '/logos/' },
}

// Sizes read from the files themselves (scripts/build-logos.mjs writes them).
function size(file: string): { width: number; height: number } {
  const svg = readFileSync(join(process.cwd(), 'public/logos', file), 'utf-8')
  const m = svg.match(/width="([\d.]+)" height="([\d.]+)"/)
  return { width: Math.round(Number(m?.[1] ?? 0)), height: Math.round(Number(m?.[2] ?? 0)) }
}
const mk = (file: string, label: string): MarkFile => ({ file, label, ...size(file) })

const INDEXED: MarkFile[] = [
  mk('posi-indexed.svg', 'Horizontal, light'),
  mk('posi-indexed-dark.svg', 'Horizontal, dark'),
  mk('posi-indexed-stacked.svg', 'Stacked, light'),
  mk('posi-indexed-stacked-dark.svg', 'Stacked, dark'),
  mk('posi-indexed-mono.svg', 'Horizontal, black (print)'),
]
const CORE: MarkFile[] = [
  mk('posi-core.svg', 'Horizontal, light'),
  mk('posi-core-dark.svg', 'Horizontal, dark'),
  mk('posi-core-stacked.svg', 'Stacked, light'),
  mk('posi-core-stacked-dark.svg', 'Stacked, dark'),
  mk('posi-core-mono.svg', 'Horizontal, black (print)'),
]
const LOGOS: MarkFile[] = [
  mk('posi-logo.svg', 'Logo'),
  mk('posi-logo-white.svg', 'Logo, white'),
  mk('posi-mark.svg', 'Mark'),
]

function Gallery({ marks }: { marks: MarkFile[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {marks.map(m => (
        <li key={m.file} className="panel overflow-hidden">
          <div className="flex items-center justify-center p-6" style={{ background: /dark|white/.test(m.file) ? '#2b3440' : 'var(--surface-2)', minHeight: 150 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/logos/${m.file}`} alt="" width={m.width} height={m.height} style={{ maxWidth: '100%', height: 'auto' }} />
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-[13px]" style={{ borderTop: '1px solid var(--line)' }}>
            <span style={{ color: 'var(--ink)' }}>{m.label}</span>
            <span className="flex gap-3">
              <a href={`/logos/${m.file}`} download className="link">SVG</a>
              <a href={`/logos/${m.file.replace(/\.svg$/, '.png')}`} download className="link">PNG</a>
            </span>
          </div>
        </li>
      ))}
    </ul>
  )
}

export default function LogosPage() {
  const core = getCoreCollection().map(j => ({ code: j.journal_code, title: j.title })).sort((a, b) => a.title.localeCompare(b.title))
  return (
    <div className="wrap pb-12">
      <PageHeader title="Logos and journal marks" crumbs={[{ label: 'POSI', href: '/' }, { label: 'Logos and journal marks' }]}>
        <p className="max-w-[68ch]">
          Journals indexed in POSI may show the POSI mark on their website. There are two marks: one for every indexed
          journal, and one reserved for journals certified in the Core Collection. Each links to the journal’s POSI
          page, where anyone can check its current status.
        </p>
      </PageHeader>

      <div className="space-y-14">
        <section aria-labelledby="which">
          <SectionTitle id="which">Which mark to use</SectionTitle>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="panel p-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logos/posi-indexed.svg" alt="Indexed in the Panorama Open Scholarly Index" width={INDEXED[0].width} height={INDEXED[0].height} style={{ maxWidth: '100%', height: 'auto' }} />
              <h3 className="mt-4 text-[15px] font-semibold" style={{ color: 'var(--ink)' }}>Indexed in POSI</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>
                For any journal in the POSI index: every journal with an ISSN that is registered with Crossref or
                described by OpenAlex. Link it to the journal’s profile. <Link href="/journals/" className="link">Find your journal</Link>.
              </p>
            </div>
            <div className="panel p-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logos/posi-core.svg" alt="Panorama Open Scholarly Index Core Collection" width={CORE[0].width} height={CORE[0].height} style={{ maxWidth: '100%', height: 'auto' }} />
              <h3 className="mt-4 text-[15px] font-semibold" style={{ color: 'var(--ink)' }}>Core Collection</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>
                Only for journals currently certified in the <Link href="/core-collection/" className="link">Core Collection</Link>,
                linked to the journal’s POSI record. It must be removed if certification lapses. Other journals can{' '}
                <Link href="/certification/" className="link">apply for certification</Link>.
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="embed">
          <SectionTitle id="embed">Embed code</SectionTitle>
          <p className="text-[14px] mb-4 max-w-[70ch]" style={{ color: 'var(--muted)' }}>
            Choose your journal and a style, then paste the code into your website’s footer or sidebar. The image is served
            from POSI, so it stays current if the design is updated.
          </p>
          <LogoEmbed core={core} indexedMarks={INDEXED} coreMarks={CORE} />
        </section>

        <section aria-labelledby="indexed-files">
          <SectionTitle id="indexed-files">Indexed in POSI</SectionTitle>
          <Gallery marks={INDEXED} />
        </section>

        <section aria-labelledby="core-files">
          <SectionTitle id="core-files">Core Collection</SectionTitle>
          <Gallery marks={CORE} />
        </section>

        <section aria-labelledby="rules" className="max-w-[820px]">
          <SectionTitle id="rules">Using the marks</SectionTitle>
          <ul className="space-y-2.5 text-[14px] leading-relaxed list-disc pl-5" style={{ color: 'var(--ink-2)' }}>
            <li>Link every mark to the journal’s own POSI page, so readers can check its status. The embed code does this.</li>
            <li>Use the files as supplied. Do not recolour, redraw, stretch, crop or add to them, and do not combine them with other logos.</li>
            <li>Show the horizontal marks at least 180 pixels wide and the stacked marks at least 120 pixels wide, with clear space around them of at least a quarter of their height.</li>
            <li>Use the dark versions on dark backgrounds and the black version where only one colour can be printed.</li>
            <li>The Core Collection mark may be shown only while the journal is certified. If certification lapses or is withdrawn, replace it with the Indexed in POSI mark.</li>
            <li>The marks state indexing and certification status. They do not state that POSI endorses the journal’s content, and must not be presented as such.</li>
            <li>To report a mark used without the status it states, such as the Core Collection mark on a journal that is not certified, use the <Link href="/contact/" className="link">contact page</Link>.</li>
          </ul>
        </section>

        <section aria-labelledby="logo">
          <SectionTitle id="logo">The POSI logo</SectionTitle>
          <p className="text-[14px] mb-4 max-w-[70ch]" style={{ color: 'var(--muted)' }}>
            For publications, presentations and news items about POSI. Journals should use the marks above instead.
          </p>
          <Gallery marks={LOGOS} />
        </section>
      </div>
    </div>
  )
}
