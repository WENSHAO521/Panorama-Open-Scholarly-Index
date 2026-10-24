// Logos and journal marks (/logos/), in every language the page is published in.
import { readFileSync } from 'fs'
import { join } from 'path'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getCoreCollection } from '@/lib/data'
import { LogoEmbed, type MarkFile } from '@/components/LogoEmbed'
import { PageHeader, SectionTitle } from '@/components/db'
import type { Locale } from '@/i18n/config'
import { localizedHref, pageAlternates } from '@/i18n/alternates'

// The page's words. The marks themselves, their alt text and the embed code stay in English (they appear on the
// journals' own websites).
const en = {
  title: 'Logos and journal marks',
  description: 'Official POSI marks for journal websites: Indexed in POSI for every indexed journal, and the Core Collection mark for certified journals. SVG and PNG, with embed code and usage rules.',
  lead: 'Journals indexed in POSI may show the POSI mark on their website. There are two marks: one for every indexed journal, and one reserved for journals certified in the Core Collection. Each links to the journal’s POSI page, where anyone can check its current status.',
  style: { hl: 'Horizontal, light', hd: 'Horizontal, dark', sl: 'Stacked, light', sd: 'Stacked, dark', mono: 'Horizontal, black (print)', logo: 'Logo', logoWhite: 'Logo, white', mark: 'Mark' },
  which: 'Which mark to use', indexed: 'Indexed in POSI', core: 'Core Collection',
  indexedBody: 'For any journal in the POSI index: every journal with an ISSN that is registered with Crossref or described by OpenAlex. Link it to the journal’s profile. ',
  findJournal: 'Find your journal', end: '.',
  coreBodyA: 'Only for journals currently certified in the ', coreLink: 'Core Collection',
  coreBodyB: ', linked to the journal’s POSI record. It must be removed if certification lapses. Other journals can ', apply: 'apply for certification',
  embed: 'Embed code',
  embedLead: 'Choose your journal and a style, then paste the code into your website’s footer or sidebar. The image is served from POSI, so it stays current if the design is updated.',
  rules: 'Using the marks',
  ruleItems: [
    'Link every mark to the journal’s own POSI page, so readers can check its status. The embed code does this.',
    'Use the files as supplied. Do not recolour, redraw, stretch, crop or add to them, and do not combine them with other logos.',
    'Show the horizontal marks at least 180 pixels wide and the stacked marks at least 120 pixels wide, with clear space around them of at least a quarter of their height.',
    'Use the dark versions on dark backgrounds and the black version where only one colour can be printed.',
    'The Core Collection mark may be shown only while the journal is certified. If certification lapses or is withdrawn, replace it with the Indexed in POSI mark.',
    'The marks state indexing and certification status. They do not state that POSI endorses the journal’s content, and must not be presented as such.',
  ],
  reportA: 'To report a mark used without the status it states, such as the Core Collection mark on a journal that is not certified, use the ', contact: 'contact page',
  logo: 'The POSI logo', logoLead: 'For publications, presentations and news items about POSI. Journals should use the marks above instead.',
}
const WORDS: Record<Locale, typeof en> = {
  en,
  'zh-Hans': {
    title: '标识与期刊徽标',
    description: '供期刊网站使用的 POSI 官方徽标：所有已收录期刊可使用“Indexed in POSI”徽标，经认证期刊可使用核心合集徽标。提供 SVG 与 PNG 格式、嵌入代码及使用规范。',
    lead: '被 POSI 收录的期刊可在其网站上展示 POSI 徽标。徽标分两种：一种适用于所有已收录期刊，另一种仅限入选核心合集的认证期刊。两种徽标均链接至该期刊的 POSI 页面，任何人都可在该页面核实期刊的当前状态。',
    style: { hl: '横版，浅色', hd: '横版，深色', sl: '竖版，浅色', sd: '竖版，深色', mono: '横版，黑色（印刷用）', logo: '标识', logoWhite: '标识，白色', mark: '图形标' },
    which: '如何选择徽标', indexed: 'Indexed in POSI（已收录）', core: '核心合集',
    indexedBody: '适用于 POSI 索引中的任何期刊，即所有 ISSN 已在 Crossref 注册或由 OpenAlex 描述的期刊。请将其链接至期刊的 POSI 页面。',
    findJournal: '查找您的期刊', end: '。',
    coreBodyA: '仅限当前入选', coreLink: '核心合集',
    coreBodyB: '的认证期刊使用，并须链接至该期刊的 POSI 记录。认证失效后必须撤下。其他期刊可',  apply: '申请认证',
    embed: '嵌入代码',
    embedLead: '选择您的期刊和徽标样式，然后将代码粘贴到网站的页脚或侧栏。图片由 POSI 提供，徽标设计更新时会自动同步。',
    rules: '徽标使用规范',
    ruleItems: [
      '每个徽标都须链接至该期刊本身的 POSI 页面，以便读者核实其状态。嵌入代码已包含此链接。',
      '请按原样使用文件，不得改色、重绘、拉伸、裁剪或增添内容，也不得与其他标识组合使用。',
      '横版徽标显示宽度不小于 180 像素，竖版徽标不小于 120 像素；四周留白不小于徽标高度的四分之一。',
      '深色背景上请使用深色版本；只能单色印刷时请使用黑色版本。',
      '核心合集徽标仅可在期刊处于认证有效期内展示。认证失效或被撤销后，须改用“Indexed in POSI”徽标。',
      '徽标仅表明收录与认证状态，并不表示 POSI 认可期刊的内容，也不得以此名义展示。',
    ],
    reportA: '如发现徽标的使用与其所示状态不符（例如未获认证的期刊使用核心合集徽标），请通过', contact: '联系页面',
    logo: 'POSI 标识', logoLead: '用于介绍 POSI 的出版物、演示文稿和新闻稿。期刊请使用上方的期刊徽标。',
  },
}

export function logosMetadata(locale: Locale): Metadata {
  const w = WORDS[locale]
  return { title: w.title, description: w.description, alternates: pageAlternates('/logos/', locale) }
}

// Sizes read from the files themselves (scripts/build-logos.mjs writes them).
function size(file: string): { width: number; height: number } {
  const svg = readFileSync(join(process.cwd(), 'public/logos', file), 'utf-8')
  const m = svg.match(/width="([\d.]+)" height="([\d.]+)"/)
  return { width: Math.round(Number(m?.[1] ?? 0)), height: Math.round(Number(m?.[2] ?? 0)) }
}
type Style = keyof typeof en.style
const mk = (file: string, label: Style) => ({ file, label, ...size(file) })

const INDEXED = [
  mk('posi-indexed.svg', 'hl'),
  mk('posi-indexed-dark.svg', 'hd'),
  mk('posi-indexed-stacked.svg', 'sl'),
  mk('posi-indexed-stacked-dark.svg', 'sd'),
  mk('posi-indexed-mono.svg', 'mono'),
]
const CORE = [
  mk('posi-core.svg', 'hl'),
  mk('posi-core-dark.svg', 'hd'),
  mk('posi-core-stacked.svg', 'sl'),
  mk('posi-core-stacked-dark.svg', 'sd'),
  mk('posi-core-mono.svg', 'mono'),
]
const LOGOS = [
  mk('posi-logo.svg', 'logo'),
  mk('posi-logo-white.svg', 'logoWhite'),
  mk('posi-mark.svg', 'mark'),
]

/** The marks with their style named in the language. */
const named = (marks: typeof INDEXED, w: typeof en): MarkFile[] => marks.map(m => ({ ...m, label: w.style[m.label] }))

function Gallery({ marks }: { marks: MarkFile[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {marks.map(m => (
        <li key={m.file} className="panel overflow-hidden">
          <div className="flex items-center justify-center p-6" style={{ background: /dark|white/.test(m.file) ? '#1e2b26' : 'var(--surface-2)', minHeight: 150 }}>
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

export function LogosView({ locale }: { locale: Locale }) {
  const w = WORDS[locale]
  const href = (p: string) => localizedHref(locale, p)
  const core = getCoreCollection().map(j => ({ code: j.journal_code, title: j.title })).sort((a, b) => a.title.localeCompare(b.title))
  return (
    <div className="wrap pb-12">
      <PageHeader locale={locale} title={w.title} crumbs={[{ label: 'POSI', href: href('/') }, { label: w.title }]}>
        <p className="max-w-[68ch]">{w.lead}</p>
      </PageHeader>

      <div className="space-y-14">
        <section aria-labelledby="which">
          <SectionTitle id="which">{w.which}</SectionTitle>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="panel p-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logos/posi-indexed.svg" alt="Indexed in the Panorama Open Scholarly Index" width={INDEXED[0].width} height={INDEXED[0].height} style={{ maxWidth: '100%', height: 'auto' }} />
              <h3 className="mt-4 text-[15px] font-semibold" style={{ color: 'var(--ink)' }}>{w.indexed}</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>
                {w.indexedBody}<Link href={href('/journals/')} className="link">{w.findJournal}</Link>{w.end}
              </p>
            </div>
            <div className="panel p-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logos/posi-core.svg" alt="Panorama Open Scholarly Index Core Collection" width={CORE[0].width} height={CORE[0].height} style={{ maxWidth: '100%', height: 'auto' }} />
              <h3 className="mt-4 text-[15px] font-semibold" style={{ color: 'var(--ink)' }}>{w.core}</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>
                {w.coreBodyA}<Link href={href('/core-collection/')} className="link">{w.coreLink}</Link>{w.coreBodyB}
                <Link href={href('/certification/')} className="link">{w.apply}</Link>{w.end}
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="embed">
          <SectionTitle id="embed">{w.embed}</SectionTitle>
          <p className="text-[14px] mb-4 max-w-[70ch]" style={{ color: 'var(--muted)' }}>
            {w.embedLead}
          </p>
          <LogoEmbed core={core} indexedMarks={named(INDEXED, w)} coreMarks={named(CORE, w)} />
        </section>

        <section aria-labelledby="indexed-files">
          <SectionTitle id="indexed-files">{w.indexed}</SectionTitle>
          <Gallery marks={named(INDEXED, w)} />
        </section>

        <section aria-labelledby="core-files">
          <SectionTitle id="core-files">{w.core}</SectionTitle>
          <Gallery marks={named(CORE, w)} />
        </section>

        <section aria-labelledby="rules" className="max-w-[820px]">
          <SectionTitle id="rules">{w.rules}</SectionTitle>
          <ul className="space-y-2.5 text-[14px] leading-relaxed list-disc pl-5" style={{ color: 'var(--ink-2)' }}>
            {w.ruleItems.map(r => <li key={r}>{r}</li>)}
            <li>{w.reportA}<Link href={href('/contact/')} className="link">{w.contact}</Link>{locale === 'zh-Hans' ? '告知我们。' : '.'}</li>
          </ul>
        </section>

        <section aria-labelledby="logo">
          <SectionTitle id="logo">{w.logo}</SectionTitle>
          <p className="text-[14px] mb-4 max-w-[70ch]" style={{ color: 'var(--muted)' }}>
            {w.logoLead}
          </p>
          <Gallery marks={named(LOGOS, w)} />
        </section>
      </div>
    </div>
  )
}
